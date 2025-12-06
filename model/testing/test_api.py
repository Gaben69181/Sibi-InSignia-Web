"""
Test API Endpoint
=================
Script untuk menguji endpoint /detect dari server FastAPI.
"""

import sys
from pathlib import Path
import base64
import json
import time

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    import requests
except ImportError:
    print("⚠️ Package 'requests' belum terinstall. Jalankan: pip install requests")
    sys.exit(1)

from PIL import Image
import numpy as np
import io


# Constants
API_URL = "http://localhost:8002/detect"
DATASET_PATH = Path(__file__).parent.parent.parent / "dataset" / "valid" / "images"


def image_to_base64(image_path: str) -> str:
    """Convert image file to base64 data URL."""
    with open(image_path, "rb") as f:
        img_bytes = f.read()
    b64 = base64.b64encode(img_bytes).decode()
    return f"data:image/jpeg;base64,{b64}"


def numpy_to_base64(img_np: np.ndarray) -> str:
    """Convert numpy array to base64 data URL."""
    img = Image.fromarray(img_np)
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=85)
    b64 = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/jpeg;base64,{b64}"


def test_server_health():
    """Test apakah server berjalan."""
    print("=" * 60)
    print("TEST 1: Server Health Check")
    print("=" * 60)
    
    try:
        # Try to connect to server root
        response = requests.get("http://localhost:8002/", timeout=5)
        print(f"✅ Server berjalan di http://localhost:8002")
        return True
    except requests.exceptions.ConnectionError:
        print(f"❌ Server tidak berjalan!")
        print(f"   Jalankan server dulu dengan:")
        print(f"   cd model && D:\\venv\\Scripts\\Activate.ps1 && python detect_server.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_detect_endpoint_dummy():
    """Test /detect endpoint dengan gambar dummy."""
    print("\n" + "=" * 60)
    print("TEST 2: Detect Endpoint (Dummy Image)")
    print("=" * 60)
    
    try:
        # Create dummy image
        dummy_img = np.random.randint(100, 200, (480, 640, 3), dtype=np.uint8)
        data_url = numpy_to_base64(dummy_img)
        
        # Send request
        start_time = time.time()
        response = requests.post(
            API_URL,
            json={"image": data_url},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Request berhasil! (Response time: {elapsed:.2f}s)")
            print(f"   Letter: {result.get('letter', '-')}")
            print(f"   Confidence: {result.get('confidence', 0):.2%}")
            print(f"   Boxes: {len(result.get('boxes', []))} detected")
            return True
        else:
            print(f"❌ Request gagal dengan status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_detect_endpoint_dataset():
    """Test /detect endpoint dengan gambar dari dataset."""
    print("\n" + "=" * 60)
    print("TEST 3: Detect Endpoint (Dataset Images)")
    print("=" * 60)
    
    if not DATASET_PATH.exists():
        print(f"⚠️ Dataset tidak ditemukan di: {DATASET_PATH}")
        return False
    
    # Get sample images from different classes
    images = list(DATASET_PATH.glob("*.jpg"))[:10]
    
    if not images:
        print("⚠️ Tidak ada gambar di dataset")
        return False
    
    print(f"   Menguji dengan {len(images)} gambar...")
    
    success_count = 0
    total_time = 0
    
    for img_path in images:
        try:
            data_url = image_to_base64(str(img_path))
            
            start_time = time.time()
            response = requests.post(
                API_URL,
                json={"image": data_url},
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            elapsed = time.time() - start_time
            total_time += elapsed
            
            if response.status_code == 200:
                result = response.json()
                letter = result.get('letter', '-')
                conf = result.get('confidence', 0)
                
                if letter != '-' and conf > 0:
                    print(f"   ✅ {img_path.name[:25]}... -> {letter} ({conf:.2%}) [{elapsed:.2f}s]")
                    success_count += 1
                else:
                    print(f"   ⚠️ {img_path.name[:25]}... -> No detection [{elapsed:.2f}s]")
            else:
                print(f"   ❌ {img_path.name[:25]}... -> HTTP {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ {img_path.name[:25]}... -> Error: {e}")
    
    avg_time = total_time / len(images) if images else 0
    print(f"\n   Hasil: {success_count}/{len(images)} berhasil")
    print(f"   Rata-rata waktu: {avg_time:.2f}s per gambar")
    
    return success_count > 0


def test_invalid_request():
    """Test endpoint dengan request yang tidak valid."""
    print("\n" + "=" * 60)
    print("TEST 4: Invalid Request Handling")
    print("=" * 60)
    
    test_cases = [
        ("Empty body", {}),
        ("Invalid base64", {"image": "not-a-valid-base64"}),
        ("Empty image", {"image": ""}),
    ]
    
    all_passed = True
    
    for name, payload in test_cases:
        try:
            response = requests.post(
                API_URL,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            # Server should return error for invalid requests
            if response.status_code in [400, 422, 500]:
                print(f"   ✅ {name}: Correctly rejected (HTTP {response.status_code})")
            else:
                print(f"   ⚠️ {name}: Unexpected response (HTTP {response.status_code})")
                
        except Exception as e:
            print(f"   ❌ {name}: Error - {e}")
            all_passed = False
    
    return all_passed


def run_all_tests():
    """Jalankan semua API tests."""
    print("\n")
    print("╔" + "═" * 58 + "╗")
    print("║" + " SIBI API TESTING ".center(58) + "║")
    print("╚" + "═" * 58 + "╝")
    print()
    
    results = {}
    
    # Test 1: Server health
    results["Server Health"] = test_server_health()
    
    if not results["Server Health"]:
        print("\n❌ Server tidak berjalan. Testing dihentikan.")
        return results
    
    # Test 2: Detect with dummy
    results["Detect (Dummy)"] = test_detect_endpoint_dummy()
    
    # Test 3: Detect with dataset
    results["Detect (Dataset)"] = test_detect_endpoint_dataset()
    
    # Test 4: Invalid requests
    results["Invalid Handling"] = test_invalid_request()
    
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
        print("🎉 Semua API test berhasil!")
    else:
        print("⚠️ Beberapa test gagal. Periksa output di atas.")
    
    return results


if __name__ == "__main__":
    run_all_tests()

