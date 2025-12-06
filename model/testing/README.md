# SIBI Model Testing

Folder ini berisi script untuk menguji model SIBI (Sistem Isyarat Bahasa Indonesia) detection.

## Struktur

```
testing/
├── __init__.py              # Package init
├── run_all_tests.py         # Main test runner
├── test_model.py            # Test model loading & inference
├── test_api.py              # Test FastAPI endpoint
├── test_dataset.py          # Test dataset & accuracy
├── visualize_detection.py   # Visualize detection results
├── output/                  # Output visualisasi (auto-generated)
└── README.md                # Documentation
```

## Cara Menjalankan

### Prerequisites

Pastikan virtual environment sudah aktif dan dependencies terinstall:

```powershell
# Aktifkan venv
D:\venv\Scripts\Activate.ps1

# Pastikan di folder model
cd D:\Sibi-InSignia-Web-main\model
```

### Jalankan Semua Test

```powershell
cd testing
python run_all_tests.py
```

### Jalankan Test Tertentu

```powershell
# Hanya test model
python run_all_tests.py --model

# Hanya test API (pastikan server jalan)
python run_all_tests.py --api

# Hanya test dataset
python run_all_tests.py --dataset

# Hanya visualisasi
python run_all_tests.py --visualize

# Semua test tanpa visualisasi
python run_all_tests.py --no-viz
```

### Jalankan Script Individual

```powershell
# Test model
python test_model.py

# Test API
python test_api.py

# Test dataset
python test_dataset.py

# Visualisasi
python visualize_detection.py
```

## Test Descriptions

### 1. Model Tests (`test_model.py`)

- **Model Loading**: Cek apakah `best.pt` bisa dimuat
- **Model Info**: Tampilkan informasi kelas yang dikenali
- **Dummy Inference**: Test inference dengan gambar random
- **Dataset Inference**: Test inference dengan gambar dari dataset

### 2. API Tests (`test_api.py`)

⚠️ **Pastikan server berjalan sebelum menjalankan API tests:**

```powershell
# Di terminal terpisah
cd D:\Sibi-InSignia-Web-main\model
D:\venv\Scripts\Activate.ps1
python detect_server.py
```

- **Server Health**: Cek apakah server berjalan
- **Detect (Dummy)**: Test endpoint dengan gambar dummy
- **Detect (Dataset)**: Test endpoint dengan gambar dataset
- **Invalid Handling**: Test error handling

### 3. Dataset Tests (`test_dataset.py`)

- **Dataset Structure**: Cek struktur folder dataset
- **Class Distribution**: Tampilkan distribusi kelas dalam dataset
- **Model Accuracy (Sample)**: Hitung akurasi pada sample dataset
- **Per-Class Accuracy**: Hitung akurasi per huruf A-Z

### 4. Visualization (`visualize_detection.py`)

Menghasilkan gambar dengan bounding box hasil deteksi:

- **Batch Visualization**: 10 gambar random dari dataset
- **Per-Class Visualization**: 1 sample per kelas
- **Grid Visualization**: Grid 4x4 hasil deteksi

Output disimpan di `testing/output/`

## Output Example

```
╔══════════════════════════════════════════════════════════════════════╗
║           SIBI INSIGNIA MODEL - COMPLETE TEST SUITE                  ║
╚══════════════════════════════════════════════════════════════════════╝

▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ SECTION 1: MODEL TESTS ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

============================================================
TEST 1: Model Loading
============================================================
✅ Model berhasil dimuat dari: D:\...\model\best.pt
   Model type: <class 'ultralytics.models.yolo.model.YOLO'>

...

╔══════════════════════════════════════════════════════════════════════╗
║                        FINAL TEST SUMMARY                            ║
╠══════════════════════════════════════════════════════════════════════╣
║  Model Tests                                                         ║
║      Model Loading: ✅ PASS                                          ║
║      Model Info: ✅ PASS                                             ║
║      Dummy Inference: ✅ PASS                                        ║
║      Dataset Inference: ✅ PASS                                      ║
║                                                                      ║
║  Total: 12/12 tests passed (100%)                                    ║
║                                                                      ║
║                     🎉 ALL TESTS PASSED!                             ║
╚══════════════════════════════════════════════════════════════════════╝
```

## Troubleshooting

### Model tidak ditemukan

```
❌ Gagal memuat model: ...
```

Pastikan file `best.pt` ada di folder `model/`

### Server tidak berjalan

```
❌ Server tidak berjalan!
```

Jalankan server di terminal terpisah:

```powershell
cd D:\Sibi-InSignia-Web-main\model
D:\venv\Scripts\Activate.ps1
python detect_server.py
```

### Dataset tidak ditemukan

```
⚠️ Dataset tidak ditemukan
```

Pastikan folder `dataset/valid/images/` dan `dataset/valid/labels/` ada dan berisi file.

