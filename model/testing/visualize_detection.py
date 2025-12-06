"""
Visualize Detection Results
===========================
Script untuk memvisualisasikan hasil deteksi dengan bounding boxes.
Output akan disimpan ke folder testing/output/
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ultralytics import YOLO
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import random

# Constants
MODEL_PATH = Path(__file__).parent.parent / "best.pt"
DATASET_PATH = Path(__file__).parent.parent.parent / "dataset" / "valid" / "images"
OUTPUT_PATH = Path(__file__).parent / "output"


def ensure_output_dir():
    """Pastikan folder output ada."""
    OUTPUT_PATH.mkdir(parents=True, exist_ok=True)
    print(f"📁 Output folder: {OUTPUT_PATH}")


def get_random_color():
    """Generate random bright color."""
    return (
        random.randint(100, 255),
        random.randint(100, 255),
        random.randint(100, 255)
    )


def visualize_single_image(model, img_path: Path, output_name: str = None):
    """Visualisasikan deteksi pada satu gambar."""
    try:
        # Load image
        img = Image.open(img_path).convert("RGB")
        img_np = np.array(img)
        
        # Run inference
        results = model(img_np, verbose=False)
        
        # Create drawing context
        draw = ImageDraw.Draw(img)
        
        # Try to use a nice font, fallback to default
        try:
            font = ImageFont.truetype("arial.ttf", 20)
            font_small = ImageFont.truetype("arial.ttf", 14)
        except:
            font = ImageFont.load_default()
            font_small = font
        
        # Draw detections
        if len(results) > 0 and results[0].boxes is not None:
            boxes = results[0].boxes
            
            for i, box in enumerate(boxes):
                # Get box coordinates (xyxy format)
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                
                # Get class and confidence
                cls_idx = int(box.cls.item())
                conf = float(box.conf.item())
                # Gunakan model.names untuk mendapatkan huruf yang benar
                letter = model.names.get(cls_idx, "?")
                
                # Draw box
                color = get_random_color()
                draw.rectangle([x1, y1, x2, y2], outline=color, width=3)
                
                # Draw label background
                label = f"{letter} {conf:.0%}"
                bbox = draw.textbbox((x1, y1 - 25), label, font=font)
                draw.rectangle(bbox, fill=color)
                
                # Draw label text
                draw.text((x1, y1 - 25), label, fill="white", font=font)
        
        # Save result
        if output_name is None:
            output_name = f"detect_{img_path.stem}.jpg"
        
        output_file = OUTPUT_PATH / output_name
        img.save(output_file, quality=95)
        print(f"   ✅ Saved: {output_file.name}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error processing {img_path.name}: {e}")
        return False


def visualize_batch(model, num_images: int = 10):
    """Visualisasikan batch gambar dari dataset."""
    print("\n" + "=" * 60)
    print("BATCH VISUALIZATION")
    print("=" * 60)
    
    if not DATASET_PATH.exists():
        print(f"❌ Dataset tidak ditemukan di: {DATASET_PATH}")
        return
    
    # Get random images
    all_images = list(DATASET_PATH.glob("*.jpg"))
    
    if not all_images:
        print("❌ Tidak ada gambar di dataset")
        return
    
    # Sample random images
    sample_images = random.sample(all_images, min(num_images, len(all_images)))
    
    print(f"   Processing {len(sample_images)} gambar...")
    
    success = 0
    for i, img_path in enumerate(sample_images, 1):
        if visualize_single_image(model, img_path, f"batch_{i:02d}_{img_path.stem[:20]}.jpg"):
            success += 1
    
    print(f"\n   Hasil: {success}/{len(sample_images)} berhasil divisualisasikan")


def visualize_per_class(model, samples_per_class: int = 2):
    """Visualisasikan sample dari setiap kelas."""
    print("\n" + "=" * 60)
    print("PER-CLASS VISUALIZATION")
    print("=" * 60)
    
    if not DATASET_PATH.exists():
        print(f"❌ Dataset tidak ditemukan")
        return
    
    labels_path = DATASET_PATH.parent / "labels"
    
    if not labels_path.exists():
        print(f"❌ Labels folder tidak ditemukan")
        return
    
    # Group images by class
    from collections import defaultdict
    class_images = defaultdict(list)
    
    for label_file in labels_path.glob("*.txt"):
        img_path = DATASET_PATH / (label_file.stem + ".jpg")
        if not img_path.exists():
            continue
        
        try:
            with open(label_file, 'r') as f:
                lines = f.readlines()
                if lines:
                    class_id = int(lines[0].strip().split()[0])
                    class_images[class_id].append(img_path)
        except:
            continue
    
    print(f"   Visualisasi {samples_per_class} sample per kelas...")
    
    total = 0
    for class_id in sorted(class_images.keys())[:24]:  # 24 kelas (tanpa J dan Z)
        # Gunakan model.names untuk mendapatkan huruf yang benar
        letter = model.names.get(class_id, f"class_{class_id}")
        images = class_images[class_id][:samples_per_class]
        
        for i, img_path in enumerate(images):
            output_name = f"class_{letter}_{i+1}.jpg"
            if visualize_single_image(model, img_path, output_name):
                total += 1
    
    print(f"\n   Total: {total} gambar divisualisasikan")


def create_grid_visualization(model, grid_size: int = 4):
    """Create a grid of detection results."""
    print("\n" + "=" * 60)
    print("GRID VISUALIZATION")
    print("=" * 60)
    
    if not DATASET_PATH.exists():
        print(f"❌ Dataset tidak ditemukan")
        return
    
    # Get random images
    all_images = list(DATASET_PATH.glob("*.jpg"))
    sample_images = random.sample(all_images, min(grid_size * grid_size, len(all_images)))
    
    # Process images and store results
    cell_size = 200
    grid_img = Image.new('RGB', (cell_size * grid_size, cell_size * grid_size), (30, 30, 30))
    
    try:
        font = ImageFont.truetype("arial.ttf", 16)
    except:
        font = ImageFont.load_default()
    
    for idx, img_path in enumerate(sample_images):
        row = idx // grid_size
        col = idx % grid_size
        
        try:
            # Load and process
            img = Image.open(img_path).convert("RGB")
            img_np = np.array(img)
            results = model(img_np, verbose=False)
            
            # Resize for grid
            img_thumb = img.resize((cell_size, cell_size))
            draw = ImageDraw.Draw(img_thumb)
            
            # Add detection label
            if len(results) > 0 and results[0].boxes is not None and len(results[0].boxes) > 0:
                boxes = results[0].boxes
                best_idx = int(boxes.conf.argmax())
                cls_idx = int(boxes[best_idx].cls.item())
                conf = float(boxes[best_idx].conf.item())
                # Gunakan model.names untuk mendapatkan huruf yang benar
                letter = model.names.get(cls_idx, "?")
                
                label = f"{letter} ({conf:.0%})"
                # Draw label at bottom
                draw.rectangle([0, cell_size - 30, cell_size, cell_size], fill=(0, 100, 0))
                draw.text((10, cell_size - 25), label, fill="white", font=font)
            else:
                draw.rectangle([0, cell_size - 30, cell_size, cell_size], fill=(100, 0, 0))
                draw.text((10, cell_size - 25), "No detection", fill="white", font=font)
            
            # Paste into grid
            grid_img.paste(img_thumb, (col * cell_size, row * cell_size))
            
        except Exception as e:
            print(f"   ⚠️ Error: {e}")
    
    # Save grid
    output_file = OUTPUT_PATH / "detection_grid.jpg"
    grid_img.save(output_file, quality=95)
    print(f"   ✅ Grid saved: {output_file}")


def main():
    """Main function to run visualizations."""
    print("\n")
    print("╔" + "═" * 58 + "╗")
    print("║" + " SIBI DETECTION VISUALIZATION ".center(58) + "║")
    print("╚" + "═" * 58 + "╝")
    print()
    
    # Ensure output directory exists
    ensure_output_dir()
    
    # Load model
    print("\n📦 Loading model...")
    try:
        model = YOLO(str(MODEL_PATH))
        print(f"   ✅ Model loaded from: {MODEL_PATH}")
        print(f"   📋 Kelas: {list(model.names.values())} (tanpa J)")
    except Exception as e:
        print(f"   ❌ Failed to load model: {e}")
        return
    
    # Run visualizations
    visualize_batch(model, num_images=10)
    visualize_per_class(model, samples_per_class=1)
    create_grid_visualization(model, grid_size=4)
    
    print("\n" + "=" * 60)
    print(f"🎉 Semua visualisasi selesai!")
    print(f"   Lihat hasil di: {OUTPUT_PATH}")
    print("=" * 60)


if __name__ == "__main__":
    main()
