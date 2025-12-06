"""
Real-time SIBI Detection with Webcam
====================================
Script untuk testing model YOLO secara real-time menggunakan webcam.
Menampilkan video dengan bounding box hijau, label huruf, dan confidence score.

Cara menjalankan:
    python realtime_detection.py

Controls:
    - Q: Quit / keluar
    - Space: Screenshot
    - C: Ganti kamera (jika ada multiple cameras)
"""

import sys
from pathlib import Path
import cv2
import numpy as np

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ultralytics import YOLO

# Constants
MODEL_PATH = Path(__file__).parent.parent / "best.pt"
CONFIDENCE_THRESHOLD = 0.3  # Minimum confidence untuk menampilkan deteksi
WINDOW_NAME = "SIBI Real-time Detection"

# Colors (BGR format untuk OpenCV)
GREEN = (34, 197, 94)      # Hijau untuk bounding box
WHITE = (255, 255, 255)     # Putih untuk text
BLACK = (0, 0, 0)           # Hitam untuk background text
RED = (0, 0, 255)           # Merah untuk error message


class SIBIDetector:
    """Real-time SIBI hand sign detector using webcam."""
    
    def __init__(self, model_path: Path, camera_id: int = 0):
        """Initialize detector with model and webcam.
        
        Args:
            model_path: Path to YOLO model (.pt file)
            camera_id: Camera device ID (default: 0)
        """
        print("🚀 Initializing SIBI Detector...")
        
        # Load YOLO model
        if not model_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}")
        
        print(f"📦 Loading model: {model_path.name}")
        self.model = YOLO(str(model_path))
        print(f"✅ Model loaded successfully!")
        print(f"📊 Classes: {len(self.model.names)} SIBI letters")
        
        # Initialize webcam
        self.camera_id = camera_id
        self.cap = None
        self._init_camera()
        
        # Statistics
        self.frame_count = 0
        self.detection_count = 0
        self.screenshot_count = 0
        
    def _init_camera(self):
        """Initialize or reinitialize camera."""
        if self.cap is not None:
            self.cap.release()
        
        print(f"📷 Opening camera {self.camera_id}...")
        
        # Try DirectShow first (more compatible on Windows)
        self.cap = cv2.VideoCapture(self.camera_id, cv2.CAP_DSHOW)
        
        if not self.cap.isOpened():
            print("⚠️  DirectShow failed, trying default backend...")
            self.cap = cv2.VideoCapture(self.camera_id)
        
        if not self.cap.isOpened():
            raise RuntimeError(
                f"Failed to open camera {self.camera_id}\n"
                "   Please check:\n"
                "   1. Camera is connected and not used by other apps\n"
                "   2. Windows Settings → Privacy → Camera → Allow apps to access camera\n"
                "   3. Close browser tabs using webcam"
            )
        
        # Set camera properties for better performance
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        self.cap.set(cv2.CAP_PROP_FPS, 30)
        
        # Test read a frame to ensure camera works
        ret, test_frame = self.cap.read()
        if not ret or test_frame is None:
            self.cap.release()
            raise RuntimeError(
                f"Camera {self.camera_id} opened but cannot read frames\n"
                "   This usually means camera is in use by another application"
            )
        
        print("✅ Camera opened successfully!")
    
    def switch_camera(self):
        """Switch to next available camera."""
        self.camera_id = (self.camera_id + 1) % 4  # Try up to 4 cameras
        try:
            self._init_camera()
            print(f"📷 Switched to camera {self.camera_id}")
            return True
        except RuntimeError:
            print(f"❌ Camera {self.camera_id} not available")
            return False
    
    def draw_info_panel(self, frame: np.ndarray):
        """Draw information panel at the top of frame."""
        h, w = frame.shape[:2]
        
        # Semi-transparent background
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, 70), BLACK, -1)
        cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
        
        # Title
        cv2.putText(frame, "SIBI Real-time Detection", (10, 25),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, WHITE, 2)
        
        # Statistics
        stats = f"Frames: {self.frame_count} | Detections: {self.detection_count} | Screenshots: {self.screenshot_count}"
        cv2.putText(frame, stats, (10, 50),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
        
        # Controls help
        help_text = "Q: Quit | Space: Screenshot | C: Switch Camera"
        cv2.putText(frame, help_text, (10, h - 15),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
    
    def draw_detection(self, frame: np.ndarray, box, cls_idx: int, conf: float):
        """Draw bounding box with label on frame."""
        h, w = frame.shape[:2]
        
        # Get box coordinates (xyxy format)
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
        
        # Get class name from model
        letter = self.model.names.get(cls_idx, "?")
        
        # Draw bounding box (thick green line)
        cv2.rectangle(frame, (x1, y1), (x2, y2), GREEN, 4)
        
        # Prepare label text
        label = f"{letter} {conf:.0%}"
        
        # Calculate text size for background
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 1.0
        thickness = 3  # Thick for bold effect
        (text_w, text_h), baseline = cv2.getTextSize(label, font, font_scale, thickness)
        
        # Draw label background (green rectangle)
        label_y1 = max(y1 - text_h - 20, 0)
        label_y2 = label_y1 + text_h + 15
        cv2.rectangle(frame, (x1, label_y1), (x1 + text_w + 15, label_y2), GREEN, -1)
        
        # Draw label text (white)
        text_y = label_y1 + text_h + 5
        cv2.putText(frame, label, (x1 + 7, text_y), font, font_scale, WHITE, thickness)
        
        return letter, conf
    
    def process_frame(self, frame: np.ndarray) -> np.ndarray:
        """Process single frame with YOLO detection.
        
        Args:
            frame: Input frame from webcam (BGR)
            
        Returns:
            Annotated frame with detections
        """
        self.frame_count += 1
        
        # Flip frame horizontally (mirror mode for natural webcam view)
        frame = cv2.flip(frame, 1)
        
        # Run YOLO inference
        results = self.model(frame, verbose=False)[0]
        
        # Draw info panel
        self.draw_info_panel(frame)
        
        # Process detections
        if results.boxes is not None and len(results.boxes) > 0:
            # Filter by confidence threshold
            boxes = results.boxes
            confidences = boxes.conf.cpu().numpy()
            
            detected_this_frame = False
            for i, conf in enumerate(confidences):
                if conf >= CONFIDENCE_THRESHOLD:
                    box = boxes[i]
                    cls_idx = int(box.cls.item())
                    
                    # Draw detection
                    letter, conf_val = self.draw_detection(frame, box, cls_idx, conf)
                    detected_this_frame = True
                    
                    # Show detection info in top-right corner
                    h, w = frame.shape[:2]
                    info_text = f"Detected: {letter}"
                    cv2.putText(frame, info_text, (w - 200, 90),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, GREEN, 2)
                    conf_text = f"Confidence: {conf_val:.1%}"
                    cv2.putText(frame, conf_text, (w - 200, 120),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, WHITE, 1)
            
            if detected_this_frame:
                self.detection_count += 1
        else:
            # No detection message
            h, w = frame.shape[:2]
            cv2.putText(frame, "No hand detected", (w - 200, 90),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (150, 150, 150), 1)
        
        return frame
    
    def save_screenshot(self, frame: np.ndarray):
        """Save current frame as screenshot."""
        output_dir = Path(__file__).parent / "output"
        output_dir.mkdir(exist_ok=True)
        
        filename = f"screenshot_{self.screenshot_count:03d}.jpg"
        filepath = output_dir / filename
        
        cv2.imwrite(str(filepath), frame)
        self.screenshot_count += 1
        print(f"📸 Screenshot saved: {filepath.name}")
    
    def run(self):
        """Main loop for real-time detection."""
        print("\n" + "="*60)
        print("🎥 Starting real-time detection...")
        print("="*60)
        print("\nControls:")
        print("  Q       - Quit")
        print("  Space   - Take screenshot")
        print("  C       - Switch camera")
        print("\n" + "="*60 + "\n")
        
        cv2.namedWindow(WINDOW_NAME, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(WINDOW_NAME, 960, 720)
        
        failed_reads = 0
        max_failed_reads = 30  # Allow 30 consecutive failures before giving up
        
        try:
            while True:
                ret, frame = self.cap.read()
                
                if not ret or frame is None:
                    failed_reads += 1
                    if failed_reads >= max_failed_reads:
                        print(f"\n❌ Failed to read frame from camera ({failed_reads} consecutive failures)")
                        print("   Camera might be disconnected or in use by another application")
                        break
                    continue  # Skip this frame, try next one
                
                failed_reads = 0  # Reset counter on successful read
                
                # Process frame with detection
                annotated_frame = self.process_frame(frame)
                
                # Display frame
                cv2.imshow(WINDOW_NAME, annotated_frame)
                
                # Handle keyboard input
                key = cv2.waitKey(1) & 0xFF
                
                if key == ord('q') or key == ord('Q'):
                    print("\n👋 Quitting...")
                    break
                elif key == ord(' '):  # Space key
                    self.save_screenshot(annotated_frame)
                elif key == ord('c') or key == ord('C'):
                    self.switch_camera()
                
        except KeyboardInterrupt:
            print("\n⚠️  Interrupted by user")
        
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Release resources."""
        print("\n🧹 Cleaning up...")
        if self.cap is not None:
            self.cap.release()
        cv2.destroyAllWindows()
        
        print("\n" + "="*60)
        print("📊 Session Statistics:")
        print(f"  Total frames processed: {self.frame_count}")
        print(f"  Frames with detections: {self.detection_count}")
        print(f"  Screenshots taken: {self.screenshot_count}")
        print("="*60)
        print("\n✅ Done!")


def print_troubleshooting():
    """Print troubleshooting tips."""
    print("\n" + "="*60)
    print("🔧 TROUBLESHOOTING TIPS")
    print("="*60)
    print("\n1. Close other applications using webcam:")
    print("   - Close all browser tabs")
    print("   - Close Zoom, Teams, Skype")
    print("   - Close other camera apps")
    print("\n2. Check Windows Camera Privacy:")
    print("   - Settings → Privacy → Camera")
    print("   - Enable 'Allow apps to access your camera'")
    print("   - Enable 'Allow desktop apps to access your camera'")
    print("\n3. Try different camera:")
    print("   - Run script and press 'C' to cycle through cameras")
    print("   - Try camera_id=1 or camera_id=2")
    print("\n4. Test camera in other apps first:")
    print("   - Open Windows Camera app")
    print("   - If Camera app doesn't work, it's a system issue")
    print("\n5. Update camera drivers:")
    print("   - Device Manager → Cameras → Update driver")
    print("="*60)


def main():
    """Main entry point."""
    print("\n" + "="*60)
    print("   SIBI Real-time Detection - Webcam Testing")
    print("="*60)
    
    try:
        detector = SIBIDetector(MODEL_PATH, camera_id=0)
        detector.run()
    except FileNotFoundError as e:
        print(f"\n❌ Model Error: {e}")
        print(f"\n   Expected model location: {MODEL_PATH}")
        print("   Make sure you're running from the correct directory:")
        print("   cd model/testing")
        print("   python realtime_detection.py")
        sys.exit(1)
    except RuntimeError as e:
        print(f"\n❌ Camera Error:")
        print(f"   {e}")
        print_troubleshooting()
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        print_troubleshooting()
        sys.exit(1)


if __name__ == "__main__":
    main()

