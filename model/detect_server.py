from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Tuple
import base64
import io
import os
from pathlib import Path
from PIL import Image
from ultralytics import YOLO  # type: ignore[import]
import numpy as np  # type: ignore[import]

app = FastAPI(title="InSignia SIBI Detection API")

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model variable
yolo_model = None

def load_model():
    """Load YOLO model with error handling."""
    global yolo_model
    try:
        MODEL_PATH = Path(__file__).with_name("best.pt")
        print(f"Loading YOLO model from: {MODEL_PATH}")
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

        yolo_model = YOLO(str(MODEL_PATH))
        print(f"✅ Model loaded successfully! Classes: {len(yolo_model.names)}")
        return True
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        return False

# Load model on startup
MODEL_LOADED = load_model()

# Mapping kelas SIBI yang benar
# Dataset memiliki 24 kelas: A-Y (tanpa J dan Z)
# 
# Urutan huruf:
#   A B C D E F G H I K L M N O P Q R S T U V W X Y
#   0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23
#
# Catatan: Huruf J (setelah I) dan Z (setelah Y) tidak ada di dataset
#
CORRECTED_CLASS_NAMES = {
    0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F', 6: 'G', 7: 'H', 8: 'I',
    9: 'K',   # J tidak ada di dataset
    10: 'L', 11: 'M', 12: 'N', 13: 'O', 14: 'P', 15: 'Q', 16: 'R',
    17: 'S', 18: 'T', 19: 'U', 20: 'V', 21: 'W', 22: 'X', 23: 'Y'
    # Z tidak ada di dataset
}

# Gunakan mapping yang sudah diperbaiki
CLASS_NAMES = CORRECTED_CLASS_NAMES


@app.get("/health")
async def health_check():
    """Health check endpoint for Railway monitoring."""
    return {
        "status": "healthy" if MODEL_LOADED else "unhealthy",
        "model_loaded": MODEL_LOADED,
        "model_path": str(Path(__file__).with_name("best.pt")),
        "classes": len(CLASS_NAMES) if MODEL_LOADED else 0
    }


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

    Simplified version matching realtime_detection.py:
    - Decode base64 image
    - Run YOLO inference
    - Return best detection with confidence > threshold
    - Use direct YOLO bounding box (no OpenCV contour processing)
    """
    if not MODEL_LOADED or yolo_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    image = decode_image(req.image)
    
    # Convert PIL to numpy array (RGB format for YOLO)
    img_np = np.array(image)
    img_h, img_w = img_np.shape[:2]
    
    try:
        results = yolo_model(img_np, verbose=False)[0]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {exc!s}") from exc
    
    # No detections at all
    if results.boxes is None or len(results.boxes) == 0:
        return DetectResponse(
            letter="-",
            confidence=0.0,
            keypoints=[],
            bones=[],
            boxes=[],
        )
    
    # Get all detections and filter by confidence threshold
    CONFIDENCE_THRESHOLD = 0.3  # Same as realtime_detection.py
    boxes_obj = results.boxes
    confidences = boxes_obj.conf.cpu().numpy() if hasattr(boxes_obj.conf, "cpu") else boxes_obj.conf.numpy()
    
    # Filter boxes by confidence
    valid_indices = [i for i, conf in enumerate(confidences) if conf >= CONFIDENCE_THRESHOLD]
    
    if not valid_indices:
        # No detections above threshold
        return DetectResponse(
            letter="-",
            confidence=0.0,
            keypoints=[],
            bones=[],
            boxes=[],
        )
    
    # Get best detection (highest confidence)
    best_idx = valid_indices[0]
    for idx in valid_indices:
        if confidences[idx] > confidences[best_idx]:
            best_idx = idx
    
    best_box = boxes_obj[best_idx]
    best_conf = float(confidences[best_idx])
    
    # Get YOLO bounding box in normalized format (center x, center y, width, height)
    cx, cy, w, h = best_box.xywhn[0].tolist()
    
    # Convert to top-left corner format for frontend
    bx = cx - (w / 2.0)
    by = cy - (h / 2.0)
    bw = w
    bh = h
 
    # Save bounding box for frontend (x, y, w, h normalized, x,y = top-left)
    out_boxes = [Box(x=float(bx), y=float(by), w=float(bw), h=float(bh))]
    
    # Get class ID and map to letter
    cls_idx = int(best_box.cls.item())
    
    # Use corrected class names mapping (24 classes: A-Y without J and Z)
    if cls_idx in CLASS_NAMES:
        letter = CLASS_NAMES[cls_idx]
    else:
        letter = "?"
    
    confidence = best_conf
 
    # Simplified keypoints - create simple dummy skeleton in box center
    # (Frontend mainly uses bounding box, keypoints are optional visualization)
    keypoints: List[Keypoint] = [
        Keypoint(x=float(cx), y=float(cy + (h * 0.20))),  # Bottom
        Keypoint(x=float(cx), y=float(cy)),                # Middle
        Keypoint(x=float(cx), y=float(cy - (h * 0.20))),  # Top
    ]
    bones: List[Tuple[int, int]] = [(0, 1), (1, 2)]
 
    return DetectResponse(
        letter=letter,
        confidence=confidence,
        keypoints=keypoints,
        bones=bones,
        boxes=out_boxes,
    )


if __name__ == "__main__":
    import uvicorn

    # Get port from environment (Railway) or default to 8002
    port = int(os.environ.get('PORT', 8002))

    print(f"Starting SIBI Detection API server on port {port}")
    print(f"Model loaded: {MODEL_LOADED}")

    # Jalankan langsung objek app tanpa reload (stabil untuk struktur folder saat ini)
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
    )