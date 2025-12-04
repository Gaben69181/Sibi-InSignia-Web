from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Tuple
import base64
import io
from pathlib import Path
from PIL import Image
from ultralytics import YOLO  # type: ignore[import]
import numpy as np  # type: ignore[import]
import cv2  # type: ignore[import]
import string

app = FastAPI(title="InSignia SIBI Detection API")
 
origins = ["*"]
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
# Muat model YOLO sekali secara global
MODEL_PATH = Path(__file__).with_name("best.pt")
ALPHABET = string.ascii_uppercase  # "A".."Z"
 
yolo_model = YOLO(str(MODEL_PATH))


class DetectRequest(BaseModel):
    image: str


class Keypoint(BaseModel):
    x: float
    y: float


class Box(BaseModel):
    x: float
    y: float
    w: float
    h: float


class DetectResponse(BaseModel):
    letter: str
    confidence: float
    keypoints: List[Keypoint]
    bones: List[Tuple[int, int]]
    boxes: List[Box]


def decode_image(data_url: str) -> Image.Image:
    """Decode data URL (e.g. 'data:image/jpeg;base64,...') to PIL Image."""
    if "," in data_url:
        _, b64 = data_url.split(",", 1)
    else:
        b64 = data_url

    try:
        image_bytes = base64.b64decode(b64)
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=400, detail="Invalid base64 image") from exc

    try:
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid image data") from exc


@app.post("/detect", response_model=DetectResponse)
async def detect(req: DetectRequest) -> DetectResponse:
    """
    Run SIBI detection on a single frame sent as base64 data URL.
 
    - Meng-decode frame dari base64 (data URL) → PIL Image.
    - Menjalankan inference YOLO (`best.pt`) untuk mendapatkan bounding box + kelas.
    - Mengonversi hasil ke format yang dipakai frontend:
      - letter: huruf A..Z dari class id (0-25)
      - confidence: skor confidence deteksi utama
      - boxes: daftar 1 bounding box terpilih (normalized 0..1)
      - keypoints + bones:
          * Jika model adalah pose & punya keypoints → pakai keypoints asli.
          * Jika hanya deteksi box → buat skeleton sederhana di tengah box (3 titik vertikal).
    """
    image = decode_image(req.image)
 
    # Konversi PIL → numpy array (YOLO menerima RGB numpy)
    img_np = np.array(image)
 
    try:
        results = yolo_model(img_np, verbose=False)[0]
    except Exception as exc:  # pragma: no cover - jalur error runtime model
        raise HTTPException(status_code=500, detail=f"Model inference failed: {exc!s}") from exc
 
    # Jika tidak ada deteksi sama sekali
    if results.boxes is None or len(results.boxes) == 0:
        return DetectResponse(
            letter="-",
            confidence=0.0,
            keypoints=[],
            bones=[],
            boxes=[],
        )
 
    # Ambil deteksi dengan confidence tertinggi
    boxes_obj = results.boxes
    scores = boxes_obj.conf.cpu().numpy() if hasattr(boxes_obj.conf, "cpu") else boxes_obj.conf.numpy()
    best_idx = int(scores.argmax())
    best_box = boxes_obj[best_idx]
 
    # Ambil info bounding box ter-normalisasi (cx, cy, w, h) dari YOLO
    # xywhn sudah normalized 0..1 terhadap lebar/tinggi image
    cx, cy, w, h = best_box.xywhn[0].tolist()
 
    # Hitung top-left box dari YOLO (fallback jika OpenCV gagal)
    yolo_top_left_x = cx - (w / 2.0)
    yolo_top_left_y = cy - (h / 2.0)
 
    # Coba hitung bounding box menggunakan OpenCV agar kontur tangan lebih diikuti
    img_h, img_w = img_np.shape[:2]
    opencv_box = None
    try:
        bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (7, 7), 0)
        _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        thresh = cv2.bitwise_not(thresh)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if contours:
            c = max(contours, key=cv2.contourArea)
            x, y, w_box, h_box = cv2.boundingRect(c)
            if w_box > 0 and h_box > 0:
                opencv_box = (
                    x / float(img_w),
                    y / float(img_h),
                    w_box / float(img_w),
                    h_box / float(img_h),
                )
    except Exception:
        opencv_box = None
 
    if opencv_box is not None:
        bx, by, bw, bh = opencv_box
    else:
        bx, by, bw, bh = yolo_top_left_x, yolo_top_left_y, w, h
 
    # Simpan bounding box dalam format yang diharapkan frontend (x,y,w,h) normalized, x,y = top-left
    out_boxes = [Box(x=float(bx), y=float(by), w=float(bw), h=float(bh))]
 
    # Ambil class id → huruf
    if best_box.cls is not None:
        cls_idx = int(best_box.cls.item())
    else:
        cls_idx = 0
 
    if 0 <= cls_idx < len(ALPHABET):
        letter = ALPHABET[cls_idx]
    else:
        letter = "?"
 
    # Confidence 0..1
    confidence = float(best_box.conf.item()) if best_box.conf is not None else 0.0
 
    keypoints: List[Keypoint] = []
    bones: List[Tuple[int, int]] = []
 
    # ====== 1) Jika model adalah YOLO pose / keypoints, gunakan keypoints asli ======
    has_kpts_attr = getattr(results, "keypoints", None) is not None
    if has_kpts_attr and results.keypoints is not None and len(results.keypoints) > 0:
        # xyn: normalized keypoints [num_instances, num_kpts, 2]
        kpt_arr = results.keypoints.xyn[best_idx].tolist()
        for (kx, ky) in kpt_arr:
            keypoints.append(Keypoint(x=float(kx), y=float(ky)))
 
        # Skeleton sederhana: hubungkan keypoint berurutan (0-1, 1-2, dst.)
        if len(keypoints) >= 2:
            bones = [(i, i + 1) for i in range(len(keypoints) - 1)]
    else:
        # ====== 2) Jika tidak ada keypoints (model deteksi biasa), buat skeleton dummy di dalam box ======
        base_y = cy + (h * 0.20)
        mid_y = cy
        tip_y = cy - (h * 0.20)
        keypoints = [
            Keypoint(x=float(cx), y=float(base_y)),
            Keypoint(x=float(cx), y=float(mid_y)),
            Keypoint(x=float(cx), y=float(tip_y)),
        ]
        bones = [(0, 1), (1, 2)]
 
    return DetectResponse(
        letter=letter,
        confidence=confidence,
        keypoints=keypoints,
        bones=bones,
        boxes=out_boxes,
    )


if __name__ == "__main__":
    import uvicorn

    # Jalankan langsung objek app tanpa reload (stabil untuk struktur folder saat ini)
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8002,
    )