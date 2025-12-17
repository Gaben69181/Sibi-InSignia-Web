"""
SIBI Detection with Video Streaming
===================================
FastAPI server yang stream video real-time dengan deteksi SIBI overlay.
React frontend hanya consume video stream (seperti IP camera).

Endpoints:
    GET  /video_feed - MJPEG video stream dengan overlay
    GET  /status     - Status kamera dan detection stats
"""

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
import cv2
import numpy as np
from pathlib import Path
from ultralytics import YOLO
import time
from threading import Thread, Lock

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup resources."""
    # Startup
    print("\n" + "="*60)
    print("   SIBI Detection Streaming Server")
    print("="*60)
    
    try:
        load_model()
        # Camera will be started manually via API
        print("\n✅ Server ready!")
        print("\nEndpoints:")
        print("  GET  /video_feed - MJPEG video stream")
        print("  GET  /status     - Detection statistics")
        print("  POST /start_camera - Start camera")
        print("  POST /stop_camera  - Stop camera")
        print("\n" + "="*60 + "\n")
    except Exception as e:
        print(f"\n❌ Startup failed: {e}")
        raise
    
    yield  # Server is running
    
    # Shutdown
    global camera
    print("\n🧹 Shutting down...")
    
    with camera_lock:
        if camera is not None:
            camera.release()
    
    with stats_lock:
        stats["camera_active"] = False
    
    print("✅ Cleanup complete")

app = FastAPI(title="SIBI Detection Streaming API", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
MODEL_PATH = Path(__file__).parent / "best.pt"
CONFIDENCE_THRESHOLD = 0.3

# Camera dan model
camera = None
camera_lock = Lock()
model = None
current_camera_id = 0

# Statistics
stats = {
    "frames_processed": 0,
    "detections": 0,
    "last_detection": "-",
    "last_confidence": 0.0,
    "fps": 0.0,
    "camera_active": False,
    "current_camera_id": 0
}
stats_lock = Lock()

# Colors (BGR)
GREEN = (34, 197, 94)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)


def load_model():
    """Load YOLO model."""
    global model
    print(f"📦 Loading model: {MODEL_PATH.name}")
    model = YOLO(str(MODEL_PATH))
    print(f"✅ Model loaded! Classes: {len(model.names)}")


def get_available_cameras():
    """Get list of available cameras."""
    available = []
    for i in range(10):  # Check first 10 camera indices
        cap = cv2.VideoCapture(i, cv2.CAP_DSHOW)
        if cap.isOpened():
            ret, _ = cap.read()
            if ret:
                available.append({
                    "id": i,
                    "name": f"Camera {i}",
                    "backend": "DirectShow"
                })
            cap.release()
    return available


def init_camera(camera_id=0):
    """Initialize camera."""
    global camera, stats, current_camera_id
    
    with camera_lock:
        if camera is not None:
            camera.release()
        
        print(f"📷 Opening camera {camera_id}...")
        
        # Try DirectShow first (Windows)
        cap = cv2.VideoCapture(camera_id, cv2.CAP_DSHOW)
        
        if not cap.isOpened():
            print("⚠️  DirectShow failed, trying default...")
            cap = cv2.VideoCapture(camera_id)
        
        if not cap.isOpened():
            raise RuntimeError(f"Failed to open camera {camera_id}")
        
        # Set properties
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cap.set(cv2.CAP_PROP_FPS, 30)
        
        # Test read
        ret, test_frame = cap.read()
        if not ret or test_frame is None:
            cap.release()
            raise RuntimeError("Camera opened but cannot read frames")
        
        camera = cap
        current_camera_id = camera_id
        
        with stats_lock:
            stats["camera_active"] = True
            stats["current_camera_id"] = camera_id
        
        print(f"✅ Camera {camera_id} ready!")
        return True


# def draw_info_panel(frame: np.ndarray, detection_info: dict = None):
#     """Draw info panel on frame."""
#     h, w = frame.shape[:2]
    
#     # Semi-transparent background
#     overlay = frame.copy()
#     cv2.rectangle(overlay, (0, 0), (w, 70), BLACK, -1)
#     cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
    
#     # Title
#     cv2.putText(frame, "SIBI Real-time Detection", (10, 25),
#                cv2.FONT_HERSHEY_SIMPLEX, 0.7, WHITE, 2)
    
#     # Stats
#     with stats_lock:
#         stats_text = f"Frames: {stats['frames_processed']} | Detections: {stats['detections']} | FPS: {stats['fps']:.1f}"
#     cv2.putText(frame, stats_text, (10, 50),
#                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
    
#     # Detection info (top-right)
#     if detection_info:
#         letter = detection_info['letter']
#         conf = detection_info['confidence']
        
#         info_text = f"Detected: {letter}"
#         cv2.putText(frame, info_text, (w - 200, 90),
#                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, GREEN, 2)
        
#         conf_text = f"Confidence: {conf:.1%}"
#         cv2.putText(frame, conf_text, (w - 200, 120),
#                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, WHITE, 1)
#     else:
#         cv2.putText(frame, "No hand detected", (w - 200, 90),
#                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (150, 150, 150), 1)


def draw_detection(frame: np.ndarray, box, cls_idx: int, conf: float):
    """Draw bounding box with label."""
    h, w = frame.shape[:2]
    
    # Get box coordinates (xyxy format)
    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
    
    # Get class name
    letter = model.names.get(cls_idx, "?")
    
    # Draw bounding box
    cv2.rectangle(frame, (x1, y1), (x2, y2), GREEN, 4)
    
    # Prepare label
    label = f"{letter} {conf:.0%}"
    
    # Calculate text size
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 1.0
    thickness = 3
    (text_w, text_h), baseline = cv2.getTextSize(label, font, font_scale, thickness)
    
    # Draw label background
    label_y1 = max(y1 - text_h - 20, 0)
    label_y2 = label_y1 + text_h + 15
    cv2.rectangle(frame, (x1, label_y1), (x1 + text_w + 15, label_y2), GREEN, -1)
    
    # Draw label text
    text_y = label_y1 + text_h + 5
    cv2.putText(frame, label, (x1 + 7, text_y), font, font_scale, WHITE, thickness)
    
    return letter, conf


def process_frame(frame: np.ndarray):
    """Process frame with detection and overlay."""
    global stats
    
    # Flip horizontally (mirror mode)
    frame = cv2.flip(frame, 1)
    
    # Run detection
    results = model(frame, verbose=False)[0]
    
    detection_info = None
    
    # Process detections
    if results.boxes is not None and len(results.boxes) > 0:
        boxes = results.boxes
        confidences = boxes.conf.cpu().numpy()
        
        for i, conf in enumerate(confidences):
            if conf >= CONFIDENCE_THRESHOLD:
                box = boxes[i]
                cls_idx = int(box.cls.item())
                
                letter, conf_val = draw_detection(frame, box, cls_idx, conf)
                
                detection_info = {
                    'letter': letter,
                    'confidence': float(conf_val)
                }
                
                with stats_lock:
                    stats['detections'] += 1
                    stats['last_detection'] = letter
                    stats['last_confidence'] = float(conf_val)
                
                break  # Only draw best detection
    
    # Draw info panel (disabled - stats shown in frontend)
    # draw_info_panel(frame, detection_info)
    
    with stats_lock:
        stats['frames_processed'] += 1
    
    return frame


def generate_frames():
    """Generate video frames with detection overlay."""
    global camera, stats
    
    fps_start_time = time.time()
    fps_frame_count = 0
    
    while True:
        with camera_lock:
            if camera is None or not camera.isOpened():
                print("❌ Camera not available")
                break
            
            ret, frame = camera.read()
        
        if not ret or frame is None:
            print("⚠️  Failed to read frame")
            time.sleep(0.1)
            continue
        
        try:
            # Process frame with detection
            processed_frame = process_frame(frame)
            
            # Calculate FPS
            fps_frame_count += 1
            if fps_frame_count >= 30:
                fps_end_time = time.time()
                fps = fps_frame_count / (fps_end_time - fps_start_time)
                
                with stats_lock:
                    stats['fps'] = fps
                
                fps_start_time = time.time()
                fps_frame_count = 0
            
            # Encode frame to JPEG
            ret, buffer = cv2.imencode('.jpg', processed_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            
            if not ret:
                continue
            
            frame_bytes = buffer.tobytes()
            
            # Yield frame in MJPEG format
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        
        except Exception as e:
            print(f"❌ Error processing frame: {e}")
            continue




@app.get("/")
async def root():
    """API root."""
    return {
        "name": "SIBI Detection Streaming API",
        "version": "1.0.0",
        "endpoints": {
            "/video_feed": "MJPEG video stream with detection overlay",
            "/status": "Detection statistics and camera status"
        }
    }


@app.get("/video_feed")
async def video_feed():
    """MJPEG video stream endpoint."""
    return StreamingResponse(
        generate_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.get("/status")
async def get_status():
    """Get detection statistics."""
    with stats_lock:
        return {
            "camera_active": stats["camera_active"],
            "frames_processed": stats["frames_processed"],
            "total_detections": stats["detections"],
            "last_detection": stats["last_detection"],
            "last_confidence": stats["last_confidence"],
            "fps": round(stats["fps"], 2),
            "current_camera_id": stats["current_camera_id"]
        }


@app.get("/cameras")
async def list_cameras():
    """Get list of available cameras."""
    cameras = get_available_cameras()
    with stats_lock:
        current_id = stats.get("current_camera_id", 0)
    
    return {
        "cameras": cameras,
        "current_camera_id": current_id,
        "total": len(cameras)
    }


@app.post("/switch_camera/{camera_id}")
async def switch_camera(camera_id: int):
    """Switch to a different camera."""
    try:
        success = init_camera(camera_id)
        if success:
            return {
                "success": True,
                "message": f"Switched to camera {camera_id}",
                "camera_id": camera_id
            }
        else:
            return {
                "success": False,
                "message": f"Failed to switch to camera {camera_id}"
            }
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }


@app.post("/start_camera")
async def start_camera():
    """Start the camera."""
    try:
        success = init_camera(current_camera_id)
        if success:
            return {
                "success": True,
                "message": "Camera started"
            }
        else:
            return {
                "success": False,
                "message": "Failed to start camera"
            }
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }


@app.post("/stop_camera")
async def stop_camera():
    """Stop the camera."""
    global camera
    try:
        with camera_lock:
            if camera is not None:
                camera.release()
                camera = None

        with stats_lock:
            stats["camera_active"] = False

        return {
            "success": True,
            "message": "Camera stopped"
        }
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)

