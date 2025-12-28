# 🚀 Panduan Cepat Deploy ke Railway

**Cara deploy SIBI Detection app (4 services) ke Railway dalam 30 menit**

---

## 📝 TLDR (Too Long; Didn't Read)

```bash
# 1. Push ke GitHub
git add .
git commit -m "Ready for Railway deployment"
git push origin main

# 2. Buka https://railway.app
# 3. Login dengan GitHub
# 4. New Project → Deploy from GitHub
# 5. Select repo → Tunggu build
# 6. Set environment variables (lihat tabel di bawah)
# 7. Done! 🎉
```

---

## 🎯 Yang Sudah Disiapkan

✅ `railway.json` - Config untuk 4 services  
✅ `runtime.txt` - Python 3.11.7  
✅ `.nvmrc` - Node.js 18.17.0  
✅ `detect_server.py` - Handle PORT env  
✅ `stream_server.py` - Handle PORT env  
✅ `backend/package.json` - Updated  
✅ `frontend/package.json` - Updated

**Semuanya sudah siap! Tinggal deploy.**

---

## 🔥 4 Services yang Akan Di-Deploy

| Service          | Type              | Port | Fungsi              |
| ---------------- | ----------------- | ---- | ------------------- |
| **frontend**     | Node.js (Vite)    | 4173 | UI Website          |
| **backend**      | Node.js (Express) | 5000 | API Bridge          |
| **detect-model** | Python (FastAPI)  | 8002 | Detection Inference |
| **stream-model** | Python (FastAPI)  | 8003 | Video Streaming     |

---

## ⚡ Langkah-Langkah

### 1️⃣ Push ke GitHub (5 menit)

```bash
cd /path/to/project
git add .
git commit -m "Setup Railway deployment - 4 services ready"
git push origin main
```

**Check:** Repository updated di GitHub ✅

---

### 2️⃣ Login ke Railway (2 menit)

1. Buka https://railway.app
2. Klik **"Login"**
3. Login dengan **GitHub account**
4. Authorize Railway

**Check:** Sudah di Railway dashboard ✅

---

### 3️⃣ Create New Project (1 menit)

1. Klik **"New Project"**
2. Pilih **"Deploy from GitHub"**
3. Pilih **repository** Anda
4. Klik **"Deploy"**

**Check:** Build process dimulai ✅

---

### 4️⃣ Tunggu Build Selesai (20 menit)

Railway akan auto-build semua 4 services:

```
Frontend    ████████████████ Building...
Backend     ████████████████ Building...
Detect-Model ████████████████ Building...
Stream-Model ████████████████ Building...
```

Setiap service butuh 3-5 menit.

**Check:** Semua services punya ✅ (deployed successfully) ✅

---

### 5️⃣ Set Environment Variables (5 menit)

**Format URL:**

```
https://[SERVICE_NAME]-[PROJECT_ID].railway.app
```

Cara dapat PROJECT_ID:

- Lihat di URL: `https://railway.app/project/[PROJECT_ID]`
- Atau copy dari service card

#### ✏️ Frontend Variables

Click **"Frontend"** → **"Variables"** → Add:

```
VITE_DETECT_API_URL=https://detect-model-abc123.railway.app
VITE_STREAM_API_URL=https://stream-model-abc123.railway.app
VITE_BACKEND_API_URL=https://backend-abc123.railway.app
```

**Ganti `abc123` dengan PROJECT_ID Anda!**

#### ✏️ Backend Variables

Click **"Backend"** → **"Variables"** → Add:

```
NODE_ENV=production
PORT=5000
DETECT_MODEL_URL=https://detect-model-abc123.railway.app
STREAM_MODEL_URL=https://stream-model-abc123.railway.app
```

#### ✏️ Detect-Model Variables

Click **"Detect-Model"** → **"Variables"** → Add:

```
PORT=8002
```

#### ✏️ Stream-Model Variables

Click **"Stream-Model"** → **"Variables"** → Add:

```
PORT=8003
```

**Check:** Semua environment variables sudah set ✅

---

### 6️⃣ Redeploy (Optional tapi Recommended)

Setelah set environment variables, redeploy services:

1. Click **"Frontend"** → **"Redeploy"**
2. Click **"Backend"** → **"Redeploy"**
3. Click **"Detect-Model"** → **"Redeploy"**
4. Click **"Stream-Model"** → **"Redeploy"**

**Check:** Semua services sudah redeploy ✅

---

## 🧪 Test Hasilnya

### 1. Buka Frontend

```
https://frontend-[PROJECT_ID].railway.app
```

Seharusnya bisa lihat website SIBI Detection ✅

### 2. Test Backend

```bash
curl https://backend-[PROJECT_ID].railway.app/api/health
```

Seharusnya return JSON ✅

### 3. Test Detect Model

```bash
curl https://detect-model-[PROJECT_ID].railway.app/health
```

Seharusnya return status OK ✅

### 4. Test Stream Model

```bash
curl https://stream-model-[PROJECT_ID].railway.app/status
```

Seharusnya return JSON ✅

---

## ✨ Selesai! 🎉

Jika semua test di atas berhasil, berarti **deployment sukses!**

Aplikasi Anda sudah live dan bisa di-akses dari mana saja.

---

## 🆘 Kalau Ada Error

### Error: "Build failed"

**Cek di:**

1. Railway Dashboard → Service → **"Logs"** tab
2. Baca error message dengan teliti
3. Common errors:
   - Module not found → check `requirements.txt`
   - Port conflict → check environment variables
   - Memory limit → optimize requirements

### Error: "Cannot connect to API"

**Cek:**

1. Environment variables sudah set?
2. Backend/Model services sudah started?
3. URL di variables benar?
4. Coba buka API URL di browser, harus return JSON

### Error: "CORS blocked"

**Cek:**

1. Backend ada CORS middleware?
   ```javascript
   app.use(cors());
   ```
2. Frontend env variables benar?
3. Clear browser cache (Ctrl+Shift+Delete)

---

## 📚 Dokumentasi Lengkap

Untuk info lebih detail, baca:

- **RAILWAY_DEPLOYMENT_GUIDE.md** - Dokumentasi komprehensif
- **DEPLOYMENT_CHECKLIST.md** - Checklist untuk deployment

---

## 🔗 Links Penting

- **Railway Dashboard:** https://railway.app/dashboard
- **Project Settings:** https://railway.app/project/[PROJECT_ID]
- **Railway Docs:** https://docs.railway.app

---

## 💡 Pro Tips

1. **Simpan Project ID** - Akan sering dipakai untuk environment variables
2. **Monitor logs** - Check logs setiap hari untuk errors
3. **Keep dependencies updated** - Jalankan `npm update` dan `pip install --upgrade`
4. **Set up alerts** - Railway bisa notify via email kalau ada errors
5. **Test locally dulu** - Sebelum push, test semua services di local machine

---

## 🎓 Next Steps

Setelah deployment:

1. ✅ Announce ke team bahwa app sudah live
2. ✅ Share public URLs
3. ✅ Monitor performance di first week
4. ✅ Gather user feedback
5. ✅ Plan improvement iterations

---

**Selamat! Aplikasi Anda sekarang live di Railway! 🚀**

Kalau ada pertanyaan atau error, check documentasi atau Railway logs.

Last Updated: December 28, 2025
