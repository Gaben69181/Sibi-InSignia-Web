"""
Test Model Loading and Basic Inference
======================================
Script untuk menguji apakah model YOLO bisa dimuat dan melakukan inference.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ultralytics import YOLO
import numpy as np
from PIL import Image

# Constants
MODEL_PATH = Path(__file__).parent.parent / "best.pt"


def test_model_loading():
    """Test apakah model bisa dimuat dengan benar."""
    print("=" * 60)
    print("TEST 1: Model Loading")
    print("=" * 60)
    
    try:
        model = YOLO(str(MODEL_PATH))
        print(f"✅ Model berhasil dimuat dari: {MODEL_PATH}")
        print(f"   Model type: {type(model)}")
        print(f"   Model names: {model.names}")
        return model
    except Exception as e:
        print(f"❌ Gagal memuat model: {e}")
        return None


def test_model_info(model):
    """Test informasi model."""
    print("\n" + "=" * 60)
    print("TEST 2: Model Information")
    print("=" * 60)
    
    try:
        # Get model info
        if hasattr(model, 'names'):
            print(f"✅ Jumlah kelas: {len(model.names)}")
            print(f"   Kelas yang terdeteksi (tanpa huruf J):")
            for idx, name in model.names.items():
                # Langsung gunakan nama dari model (sudah benar)
                print(f"      {idx}: {name}")
        return True
    except Exception as e:
        print(f"❌ Gagal mendapatkan info model: {e}")
        return False


def test_inference_dummy_image(model):
    """Test inference dengan gambar dummy."""
    print("\n" + "=" * 60)
    print("TEST 3: Inference dengan Gambar Dummy")
    print("=" * 60)
    
    try:
        # Create a dummy image (random noise)
        dummy_img = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        # Run inference
        results = model(dummy_img, verbose=False)
        
        print(f"✅ Inference berhasil!")
        print(f"   Jumlah hasil: {len(results)}")
        
        if len(results) > 0:
            result = results[0]
            boxes = result.boxes
            if boxes is not None and len(boxes) > 0:
                print(f"   Deteksi ditemukan: {len(boxes)} objek")
                for i, box in enumerate(boxes):
                    cls_idx = int(box.cls.item())
                    conf = float(box.conf.item())
                    # Gunakan model.names untuk mendapatkan huruf yang benar
                    letter = model.names.get(cls_idx, "?")
                    print(f"      [{i+1}] Huruf: {letter}, Confidence: {conf:.2%}")
            else:
                print("   Tidak ada deteksi pada gambar dummy (normal)")
        
        return True
    except Exception as e:
        print(f"❌ Gagal melakukan inference: {e}")
        return False


def test_inference_with_dataset(model):
    """Test inference dengan gambar dari dataset."""
    print("\n" + "=" * 60)
    print("TEST 4: Inference dengan Gambar Dataset")
    print("=" * 60)
    
    dataset_path = Path(__file__).parent.parent.parent / "dataset" / "valid" / "images"
    
    if not dataset_path.exists():
        print(f"⚠️ Dataset tidak ditemukan di: {dataset_path}")
        return False
    
    # Get some sample images
    images = list(dataset_path.glob("*.jpg"))[:5]
    
    if not images:
        print("⚠️ Tidak ada gambar di dataset")
        return False
    
    print(f"   Menguji dengan {len(images)} gambar...")
    
    success_count = 0
    for img_path in images:
        try:
            # Load image
            img = Image.open(img_path).convert("RGB")
            img_np = np.array(img)
            
            # Run inference
            results = model(img_np, verbose=False)
            
            if len(results) > 0:
                result = results[0]
                boxes = result.boxes
                if boxes is not None and len(boxes) > 0:
                    best_idx = int(boxes.conf.argmax())
                    best_box = boxes[best_idx]
                    cls_idx = int(best_box.cls.item())
                    conf = float(best_box.conf.item())
                    # Gunakan model.names untuk mendapatkan huruf yang benar
                    letter = model.names.get(cls_idx, "?")
                    print(f"   ✅ {img_path.name[:30]}... -> Huruf: {letter} ({conf:.2%})")
                    success_count += 1
                else:
                    print(f"   ⚠️ {img_path.name[:30]}... -> Tidak ada deteksi")
            
        except Exception as e:
            print(f"   ❌ {img_path.name[:30]}... -> Error: {e}")
    
    print(f"\n   Hasil: {success_count}/{len(images)} gambar berhasil dideteksi")
    return success_count > 0


def run_all_tests():
    """Jalankan semua test."""
    print("\n")
    print("╔" + "═" * 58 + "╗")
    print("║" + " SIBI MODEL TESTING ".center(58) + "║")
    print("╚" + "═" * 58 + "╝")
    print()
    
    results = {}
    
    # Test 1: Model loading
    model = test_model_loading()
    results["Model Loading"] = model is not None
    
    if model is None:
        print("\n❌ Model tidak bisa dimuat. Testing dihentikan.")
        return results
    
    # Test 2: Model info
    results["Model Info"] = test_model_info(model)
    
    # Test 3: Dummy image inference
    results["Dummy Inference"] = test_inference_dummy_image(model)
    
    # Test 4: Dataset inference
    results["Dataset Inference"] = test_inference_with_dataset(model)
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    all_passed = True
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"   {test_name}: {status}")
        if not passed:
            all_passed = False
    
    print()
    if all_passed:
        print("🎉 Semua test berhasil!")
    else:
        print("⚠️ Beberapa test gagal. Periksa output di atas.")
    
    return results


if __name__ == "__main__":
    run_all_tests()
