# ===== BARIS PALING ATAS =====
import os
import sys

# SET ENVIRONMENT VARIABLES SEBELUM IMPORT APAPUN
os.environ["OPENCV_IO_ENABLE_JASPER"] = "0"
os.environ["OPENCV_IO_ENABLE_OPENEXR"] = "0"
os.environ["OPENCV_IO_ENABLE_GDAL"] = "0"
os.environ["QT_QPA_PLATFORM"] = "offscreen"
os.environ["ULTRALYTICS_NO_GUI"] = "1"
os.environ["DISABLE_OPENCV_IO_FUNCTIONS"] = "1"

# Debug info
print("🚀 Starting SIBI Detection API")
print(f"Python version: {sys.version}")
print(f"Current directory: {os.getcwd()}")
print(f"Files in directory: {os.listdir('.')}")

# ===== IMPORT SETELAH ENV VARS =====
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
        print(f"📂 Looking for model at: {MODEL_PATH}")
        print(f"📂 Absolute path: {MODEL_PATH.absolute()}")
        print(f"📂 File exists: {MODEL_PATH.exists()}")
        
        if not MODEL_PATH.exists():
            # List semua file untuk debugging
            print("📁 Listing all files in current dir:")
            for f in Path('.').rglob('*'):
                print(f"  - {f}")
            raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

        print("🔄 Loading YOLO model...")
        yolo_model = YOLO(str(MODEL_PATH))
        print(f"✅ Model loaded! Classes: {len(yolo_model.names)}")
        return True
    except Exception as e:
        print(f"❌ Failed to load model: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

# Load model on startup
print("⚙️ Loading model...")
MODEL_LOADED = load_model()

# Mapping kelas SIBI yang benar
CORRECTED_CLASS_NAMES = {
    0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F', 6: 'G', 7: 'H', 8: 'I',
    9: 'K', 10: 'L', 11: 'M', 12: 'N', 13: 'O', 14: 'P', 15: 'Q', 16: 'R',
    17: 'S', 18: 'T', 19: 'U', 20: 'V', 21: 'W', 22: 'X', 23: 'Y'
}

CLASS_NAMES = CORRECTED_CLASS_NAMES

@app.get("/")
async def root():
    """Root endpoint untuk test."""
    return {
        "message": "SIBI Detection API",
        "status": "running",
        "model_loaded": MODEL_LOADED,
        "endpoints": ["/health", "/detect"]
    }

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
    """
    if not MODEL_LOADED or yolo_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    image = decode_image(req.image)
    
    # Convert PIL to numpy array (RGB format for YOLO)
    img_np = np.array(image)
    
    try:
        results = yolo_model(img_np, verbose=False)[0]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {exc!s}") from exc
    
    if results.boxes is None or len(results.boxes) == 0:
        return DetectResponse(
            letter="-",
            confidence=0.0,
            keypoints=[],
            bones=[],
            boxes=[],
        )
    
    CONFIDENCE_THRESHOLD = 0.2
    boxes_obj = results.boxes
    confidences = boxes_obj.conf.cpu().numpy() if hasattr(boxes_obj.conf, "cpu") else boxes_obj.conf.numpy()
    
    valid_indices = [i for i, conf in enumerate(confidences) if conf >= CONFIDENCE_THRESHOLD]
    
    if not valid_indices:
        return DetectResponse(
            letter="-",
            confidence=0.0,
            keypoints=[],
            bones=[],
            boxes=[],
        )
    
    best_idx = valid_indices[0]
    for idx in valid_indices:
        if confidences[idx] > confidences[best_idx]:
            best_idx = idx
    
    best_box = boxes_obj[best_idx]
    best_conf = float(confidences[best_idx])
    
    cx, cy, w, h = best_box.xywhn[0].tolist()
    bx = cx - (w / 2.0)
    by = cy - (h / 2.0)
    
    out_boxes = [Box(x=float(bx), y=float(by), w=float(w), h=float(h))]
    
    cls_idx = int(best_box.cls.item())
    letter = CLASS_NAMES.get(cls_idx, "?")
    
    keypoints: List[Keypoint] = [
        Keypoint(x=float(cx), y=float(cy + (h * 0.20))),
        Keypoint(x=float(cx), y=float(cy)),
        Keypoint(x=float(cx), y=float(cy - (h * 0.20))),
    ]
    bones: List[Tuple[int, int]] = [(0, 1), (1, 2)]
    
    print(f"✅ DETECTED: Letter '{letter}' with confidence {best_conf:.3f}")
    
    return DetectResponse(
        letter=letter,
        confidence=best_conf,
        keypoints=keypoints,
        bones=bones,
        boxes=out_boxes,
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get('PORT', 8002))
    print(f"🌐 Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
