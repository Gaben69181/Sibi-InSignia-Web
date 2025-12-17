"""
Test Dataset Integrity & Model Accuracy
=======================================
Script untuk menguji dataset dan mengukur akurasi model pada validation set.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from collections import defaultdict
from ultralytics import YOLO
import numpy as np
from PIL import Image

# Constants
MODEL_PATH = Path(__file__).parent.parent / "best.pt"
DATASET_PATH = Path(__file__).parent.parent.parent / "dataset" / "valid"
IMAGES_PATH = DATASET_PATH / "images"
LABELS_PATH = DATASET_PATH / "labels"


def test_dataset_structure():
    """Test apakah struktur dataset benar."""
    print("=" * 60)
    print("TEST 1: Dataset Structure")
    print("=" * 60)
    
    checks = {
        "Dataset folder": DATASET_PATH.exists(),
        "Images folder": IMAGES_PATH.exists(),
        "Labels folder": LABELS_PATH.exists(),
    }
    
    for name, passed in checks.items():
        status = "✅" if passed else "❌"
        print(f"   {status} {name}: {'Found' if passed else 'Not Found'}")
    
    if not all(checks.values()):
        return False
    
    # Count files
    images = list(IMAGES_PATH.glob("*.jpg"))
    labels = list(LABELS_PATH.glob("*.txt"))
    
    print(f"\n   Jumlah gambar: {len(images)}")
    print(f"   Jumlah label: {len(labels)}")
    
    return len(images) > 0 and len(labels) > 0


def test_class_distribution():
    """Test distribusi kelas dalam dataset."""
    print("\n" + "=" * 60)
    print("TEST 2: Class Distribution")
    print("=" * 60)
    
    if not LABELS_PATH.exists():
        print("❌ Labels folder tidak ditemukan")
        return False
    
    # Load model untuk mendapatkan mapping kelas
    try:
        model = YOLO(str(MODEL_PATH))
        class_names = model.names
    except:
        class_names = {}
    
    class_counts = defaultdict(int)
    total_boxes = 0
    
    for label_file in LABELS_PATH.glob("*.txt"):
        try:
            with open(label_file, 'r') as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) >= 5:
                        class_id = int(parts[0])
                        class_counts[class_id] += 1
                        total_boxes += 1
        except Exception as e:
            print(f"   ⚠️ Error reading {label_file.name}: {e}")
    
    print(f"   Total bounding boxes: {total_boxes}")
    print(f"   Kelas yang ditemukan: {len(class_counts)} (tanpa huruf J)")
    print(f"\n   Distribusi per huruf:")
    
    for class_id in sorted(class_counts.keys()):
        # Gunakan model.names untuk mendapatkan huruf yang benar
        letter = class_names.get(class_id, f"Class {class_id}")
        count = class_counts[class_id]
        bar = "█" * min(count // 5, 20)
        print(f"      {letter}: {count:4d} {bar}")
    
    return len(class_counts) > 0


def test_model_accuracy_sample():
    """Test akurasi model pada sample dari dataset."""
    print("\n" + "=" * 60)
    print("TEST 3: Model Accuracy (Sample)")
    print("=" * 60)
    
    try:
        model = YOLO(str(MODEL_PATH))
        class_names = model.names
    except Exception as e:
        print(f"❌ Gagal memuat model: {e}")
        return False
    
    if not IMAGES_PATH.exists() or not LABELS_PATH.exists():
        print("❌ Dataset tidak lengkap")
        return False
    
    # Get sample images
    images = list(IMAGES_PATH.glob("*.jpg"))[:50]
    
    if not images:
        print("⚠️ Tidak ada gambar")
        return False
    
    correct = 0
    total = 0
    confusion = defaultdict(lambda: defaultdict(int))
    
    print(f"   Menguji {len(images)} gambar...")
    
    for img_path in images:
        # Find corresponding label
        label_path = LABELS_PATH / (img_path.stem + ".txt")
        
        if not label_path.exists():
            continue
        
        # Read ground truth
        try:
            with open(label_path, 'r') as f:
                lines = f.readlines()
                if not lines:
                    continue
                # Get first class (assuming single class per image for simplicity)
                gt_class = int(lines[0].strip().split()[0])
        except:
            continue
        
        # Run inference
        try:
            img = Image.open(img_path).convert("RGB")
            img_np = np.array(img)
            results = model(img_np, verbose=False)
            
            if len(results) > 0 and results[0].boxes is not None and len(results[0].boxes) > 0:
                boxes = results[0].boxes
                best_idx = int(boxes.conf.argmax())
                pred_class = int(boxes[best_idx].cls.item())
                
                total += 1
                if pred_class == gt_class:
                    correct += 1
                
                # Track confusion - gunakan model.names
                gt_letter = class_names.get(gt_class, "?")
                pred_letter = class_names.get(pred_class, "?")
                confusion[gt_letter][pred_letter] += 1
        except Exception as e:
            print(f"   ⚠️ Error pada {img_path.name}: {e}")
    
    if total == 0:
        print("   ⚠️ Tidak ada gambar yang berhasil diproses")
        return False
    
    accuracy = correct / total
    print(f"\n   Hasil:")
    print(f"   ├─ Total diproses: {total}")
    print(f"   ├─ Benar: {correct}")
    print(f"   ├─ Salah: {total - correct}")
    print(f"   └─ Akurasi: {accuracy:.2%}")
    
    # Show some misclassifications
    if total - correct > 0:
        print(f"\n   Contoh kesalahan klasifikasi:")
        shown = 0
        for gt_letter in confusion:
            for pred_letter in confusion[gt_letter]:
                if gt_letter != pred_letter and shown < 5:
                    count = confusion[gt_letter][pred_letter]
                    print(f"      {gt_letter} → {pred_letter}: {count}x")
                    shown += 1
    
    return accuracy > 0.5  # Consider pass if accuracy > 50%


def test_per_class_accuracy():
    """Test akurasi per kelas."""
    print("\n" + "=" * 60)
    print("TEST 4: Per-Class Accuracy")
    print("=" * 60)
    
    try:
        model = YOLO(str(MODEL_PATH))
        class_names = model.names
    except Exception as e:
        print(f"❌ Gagal memuat model: {e}")
        return False
    
    if not IMAGES_PATH.exists() or not LABELS_PATH.exists():
        print("❌ Dataset tidak lengkap")
        return False
    
    # Group images by class
    class_images = defaultdict(list)
    
    for label_path in LABELS_PATH.glob("*.txt"):
        img_path = IMAGES_PATH / (label_path.stem + ".jpg")
        if not img_path.exists():
            continue
        
        try:
            with open(label_path, 'r') as f:
                lines = f.readlines()
                if lines:
                    class_id = int(lines[0].strip().split()[0])
                    class_images[class_id].append(img_path)
        except:
            continue
    
    print(f"   Menguji akurasi per huruf (tanpa J)...")
    
    class_accuracy = {}
    
    for class_id in sorted(class_images.keys()):
        images = class_images[class_id][:10]  # Max 10 per class
        if not images:
            continue
        
        correct = 0
        total = 0
        
        for img_path in images:
            try:
                img = Image.open(img_path).convert("RGB")
                img_np = np.array(img)
                results = model(img_np, verbose=False)
                
                if len(results) > 0 and results[0].boxes is not None and len(results[0].boxes) > 0:
                    boxes = results[0].boxes
                    best_idx = int(boxes.conf.argmax())
                    pred_class = int(boxes[best_idx].cls.item())
                    
                    total += 1
                    if pred_class == class_id:
                        correct += 1
            except:
                continue
        
        if total > 0:
            acc = correct / total
            # Gunakan model.names untuk mendapatkan huruf yang benar
            letter = class_names.get(class_id, f"Class {class_id}")
            class_accuracy[letter] = acc
    
    # Display results
    print(f"\n   Akurasi per huruf:")
    for letter in sorted(class_accuracy.keys()):
        acc = class_accuracy[letter]
        bar_len = int(acc * 20)
        bar = "█" * bar_len + "░" * (20 - bar_len)
        color = "✅" if acc >= 0.7 else "⚠️" if acc >= 0.5 else "❌"
        print(f"      {color} {letter}: {bar} {acc:.0%}")
    
    avg_acc = sum(class_accuracy.values()) / len(class_accuracy) if class_accuracy else 0
    print(f"\n   Rata-rata akurasi: {avg_acc:.2%}")
    
    return avg_acc > 0.5


def run_all_tests():
    """Jalankan semua dataset tests."""
    print("\n")
    print("╔" + "═" * 58 + "╗")
    print("║" + " SIBI DATASET TESTING ".center(58) + "║")
    print("╚" + "═" * 58 + "╝")
    print()
    
    results = {}
    
    # Test 1: Dataset structure
    results["Dataset Structure"] = test_dataset_structure()
    
    if not results["Dataset Structure"]:
        print("\n❌ Dataset tidak lengkap. Testing dihentikan.")
        return results
    
    # Test 2: Class distribution
    results["Class Distribution"] = test_class_distribution()
    
    # Test 3: Model accuracy sample
    results["Model Accuracy (Sample)"] = test_model_accuracy_sample()
    
    # Test 4: Per-class accuracy
    results["Per-Class Accuracy"] = test_per_class_accuracy()
    
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
        print("🎉 Semua dataset test berhasil!")
    else:
        print("⚠️ Beberapa test gagal. Periksa output di atas.")
    
    return results


if __name__ == "__main__":
    run_all_tests()
