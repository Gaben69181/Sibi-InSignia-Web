"""
Simple Camera Test
==================
Script sederhana untuk testing apakah kamera bisa dibuka oleh OpenCV.
Gunakan ini untuk troubleshooting sebelum menjalankan realtime_detection.py

Cara menjalankan:
    python test_camera.py
"""

import cv2
import sys

def test_camera(camera_id=0):
    """Test if camera can be opened and read."""
    print(f"\n{'='*60}")
    print(f"Testing Camera {camera_id}")
    print(f"{'='*60}\n")
    
    # Try different backends
    backends = [
        ("DirectShow", cv2.CAP_DSHOW),
        ("MSMF", cv2.CAP_MSMF),
        ("Any (auto)", cv2.CAP_ANY),
    ]
    
    for backend_name, backend in backends:
        print(f"🔍 Trying {backend_name} backend...")
        
        cap = cv2.VideoCapture(camera_id, backend)
        
        if not cap.isOpened():
            print(f"   ❌ Failed to open camera with {backend_name}")
            continue
        
        # Try to read a frame
        ret, frame = cap.read()
        
        if not ret or frame is None:
            print(f"   ⚠️  Camera opened but cannot read frame")
            cap.release()
            continue
        
        # Success!
        print(f"   ✅ SUCCESS with {backend_name}!")
        print(f"   Frame shape: {frame.shape}")
        print(f"   Resolution: {frame.shape[1]}x{frame.shape[0]}")
        
        # Show the frame
        print(f"\n   Opening preview window...")
        print(f"   Press 'Q' to close and test next camera\n")
        
        cv2.namedWindow(f"Camera {camera_id} Test - {backend_name}", cv2.WINDOW_NORMAL)
        
        frame_count = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                print(f"   ❌ Lost camera connection after {frame_count} frames")
                break
            
            frame_count += 1
            
            # Add info text
            cv2.putText(frame, f"Camera {camera_id} - {backend_name}", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.putText(frame, f"Frame: {frame_count}", (10, 60),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.putText(frame, "Press Q to quit", (10, 90),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            cv2.imshow(f"Camera {camera_id} Test - {backend_name}", frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q') or key == ord('Q'):
                break
        
        cap.release()
        cv2.destroyAllWindows()
        
        print(f"\n   📊 Total frames displayed: {frame_count}")
        return True
    
    print(f"\n❌ Failed to open camera {camera_id} with all backends")
    return False


def main():
    """Main entry point."""
    print("\n" + "="*60)
    print("   OpenCV Camera Test Tool")
    print("="*60)
    print("\nThis tool will test if your camera works with OpenCV")
    print("It will try different backends (DirectShow, MSMF, Auto)")
    print("\nControls:")
    print("  Q - Quit current test and try next camera")
    print("\n" + "="*60)
    
    # Test up to 3 cameras
    working_cameras = []
    
    for cam_id in range(3):
        if test_camera(cam_id):
            working_cameras.append(cam_id)
            
            user_input = input(f"\n   Test another camera? (y/n): ").strip().lower()
            if user_input != 'y':
                break
        else:
            print(f"   Skipping to next camera...\n")
    
    # Summary
    print("\n" + "="*60)
    print("   Test Summary")
    print("="*60)
    
    if working_cameras:
        print(f"\n✅ Working cameras: {working_cameras}")
        print(f"\n   You can use these camera IDs in realtime_detection.py")
        print(f"   Example: detector = SIBIDetector(MODEL_PATH, camera_id={working_cameras[0]})")
    else:
        print("\n❌ No working cameras found")
        print("\n🔧 Troubleshooting:")
        print("   1. Close all apps using webcam (browsers, Zoom, Teams)")
        print("   2. Check Windows Settings → Privacy → Camera")
        print("   3. Try unplugging and replugging USB camera")
        print("   4. Restart computer")
        print("   5. Test in Windows Camera app first")
    
    print("\n" + "="*60 + "\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        cv2.destroyAllWindows()
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

