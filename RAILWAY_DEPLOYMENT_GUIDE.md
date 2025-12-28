# 🚀 Railway Deployment Guide - SIBI Detection App

**Panduan lengkap untuk deploy aplikasi SIBI Detection (4 services) di Railway**

---

## 📋 Daftar Isi

1. [Overview Arsitektur](#overview-arsitektur)
2. [Prerequisites](#prerequisites)
3. [Setup Awal di Railway](#setup-awal-di-railway)
4. [Environment Variables](#environment-variables)
5. [Build & Deploy](#build--deploy)
6. [Troubleshooting](#troubleshooting)
7. [Monitoring & Logs](#monitoring--logs)

---

## 🏗️ Overview Arsitektur

Aplikasi ini terdiri dari **4 services** yang berjalan paralel:

```
┌─────────────────────────────────────────────────────────────┐
│                    RAILWAY DEPLOYMENT                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  Frontend    │  │   Backend    │  │  Detect Model    │ │
│  │  (Node.js)   │  │  (Node.js)   │  │  (Python 3.11)   │ │
│  │              │  │              │  │                  │ │
│  │ Vite Server  │  │ Express API  │  │ FastAPI - Port   │ │
│  │ Port: 4173   │  │ Port: 5000   │  │ 8002 (or env)    │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
│                                                              │
│                      ┌──────────────────────┐               │
│                      │  Stream Model        │               │
│                      │  (Python 3.11)       │               │
│                      │                      │               │
│                      │  FastAPI - Streaming │               │
│                      │  Port: 8003 (or env) │               │
│                      └──────────────────────┘               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Service Details:

- **Frontend**: React + Vite
- **Backend**: Express.js (proxy API calls)
- **Detect-Model**: FastAPI (detection inference server)
- **Stream-Model**: FastAPI (real-time video streaming)

---

## ✅ Prerequisites

Sebelum deploy, pastikan Anda memiliki:

1. **GitHub Account** - untuk connect repository
2. **Railway Account** - https://railway.app
3. **Git installed** - untuk push ke GitHub
4. **Project sudah di GitHub** - repository harus public atau private dengan akses Railway

### Struktur File yang Diperlukan:

```
project-root/
├── railway.json          ✅ (Updated - multi-service config)
├── runtime.txt           ✅ (Python 3.11.7)
├── .nvmrc               ✅ (Node 18.17.0)
├── RAILWAY_DEPLOYMENT_GUIDE.md  ✅ (Dokumentasi ini)
│
├── frontend/
│   ├── package.json      ✅ (Updated dengan engines)
│   ├── vite.config.js
│   └── src/
│
├── backend/
│   ├── package.json      ✅ (Updated dengan engines)
│   ├── index.js
│   └── ...
│
└── model/
    ├── requirements.txt   (Sudah siap)
    ├── detect_server.py  ✅ (Updated untuk PORT env)
    ├── stream_server.py  ✅ (Updated untuk PORT env)
    └── best.pt
```

---

## 🔧 Setup Awal di Railway

### Step 1: Login ke Railway

1. Buka https://railway.app
2. Klik **"Login"** → Login dengan GitHub
3. Authorize Railway untuk akses GitHub

### Step 2: Create New Project

1. Klik **"New Project"** (di dashboard)
2. Pilih **"Deploy from GitHub repo"**
3. Connect GitHub account jika belum

### Step 3: Select Repository

1. Cari dan select repository Anda
2. Pilih **branch** yang ingin di-deploy (default: `main`)
3. Klik **"Deploy"**

### Step 4: Railway Akan Auto-Detect Services

Railway akan membaca `railway.json` dan automatically:

- ✅ Detect 4 services: `frontend`, `backend`, `detect-model`, `stream-model`
- ✅ Setup Python 3.11 environment (dari `runtime.txt`)
- ✅ Setup Node.js 18 environment (dari `.nvmrc`)
- ✅ Install dependencies

**Tunggu proses build selesai** (biasanya 5-10 menit per service)

---

## 🔐 Environment Variables

Setelah deployment, setup environment variables di setiap service:

### 1️⃣ Frontend Service

Klik **"Frontend"** → **"Variables"** tab → Add:

```env
VITE_DETECT_API_URL=https://detect-model-[PROJECT_ID].railway.app
VITE_STREAM_API_URL=https://stream-model-[PROJECT_ID].railway.app
VITE_BACKEND_API_URL=https://backend-[PROJECT_ID].railway.app
```

**Cara mendapat Project ID:**

- Lihat di URL: `https://railway.app/project/[PROJECT_ID]`
- Atau di setiap service card: `servicename-[PROJECT_ID].railway.app`

### 2️⃣ Backend Service

Klik **"Backend"** → **"Variables"** tab → Add:

```env
NODE_ENV=production
PORT=5000
DETECT_MODEL_URL=https://detect-model-[PROJECT_ID].railway.app
STREAM_MODEL_URL=https://stream-model-[PROJECT_ID].railway.app
```

### 3️⃣ Detect-Model Service

Klik **"Detect-Model"** → **"Variables"** tab → Add:

```env
PORT=8002
```

### 4️⃣ Stream-Model Service

Klik **"Stream-Model"** → **"Variables"** tab → Add:

```env
PORT=8003
```

---

## 🚀 Build & Deploy

### Automatic Deploy (Recommended)

Railway otomatis trigger deploy ketika ada push ke GitHub:

```bash
# Di local machine
git add .
git commit -m "Update configuration untuk Railway deployment"
git push origin main
```

Railway akan automatically:

1. Pull latest code
2. Rebuild semua services
3. Deploy ke production
4. Assign public URLs

### Manual Deploy

Jika ingin redeploy tanpa push:

1. Go to railway.app dashboard
2. Pilih project Anda
3. Click **"Deployments"** tab
4. Click **"Redeploy"** pada latest deployment

### Monitoring Build Progress

1. Click masing-masing service card
2. Go to **"Deployments"** tab
3. Lihat logs real-time

---

## 🌐 Testing Endpoints

Setelah semua services deployed, test masing-masing:

### Frontend

```
https://frontend-[PROJECT_ID].railway.app
```

Harus bisa akses website SIBI Detection

### Backend Health Check

```
curl https://backend-[PROJECT_ID].railway.app/api/health
```

### Detect Model Health Check

```
curl https://detect-model-[PROJECT_ID].railway.app/health
```

### Stream Model Status

```
curl https://stream-model-[PROJECT_ID].railway.app/status
```

---

## 🔍 Troubleshooting

### ❌ Build Error: "Module not found"

**Problem:** `python: can't find module ultralytics`

**Solution:**

1. Check `model/requirements.txt` ada semua dependencies
2. Re-trigger build di Railway dashboard
3. Check build logs untuk error details

```bash
# Locally verify
pip install -r model/requirements.txt
python model/detect_server.py
```

### ❌ Port Binding Error

**Problem:** `Port 5000 is already in use`

**Solution:**
Railway auto-assign PORT dari env variable. Pastikan:

- `detect_server.py` baca env: `port = int(os.environ.get('PORT', 8002))`
- `stream_server.py` baca env: `port = int(os.environ.get('PORT', 8003))`
- Environment variables sudah set di Railway dashboard

### ❌ CORS Error di Frontend

**Problem:** `Access to XMLHttpRequest blocked by CORS`

**Solution:**

1. Pastikan backend accept CORS:

   ```javascript
   const cors = require("cors");
   app.use(cors());
   ```

2. Update frontend env variables:

   ```env
   VITE_BACKEND_API_URL=https://backend-[PROJECT_ID].railway.app
   ```

3. Clear browser cache (Ctrl+Shift+Delete)

### ❌ Python Package Installation Too Slow

**Problem:** Build timeout karena package install lama

**Solution:**

- Railway punya 1 jam timeout default
- Remove unnecessary dependencies dari `requirements.txt`
- Gunakan binary wheels: `opencv-python-headless` (not `opencv-python`)

### ❌ Model File Missing

**Problem:** `FileNotFoundError: best.pt not found`

**Solution:**

1. Pastikan `best.pt` commit ke Git:

   ```bash
   # Remove dari .gitignore jika ada
   git add model/best.pt
   git commit -m "Add model file"
   git push
   ```

2. Atau upload manual di Railway:
   - Railway Dashboard → Service → Files tab
   - Upload `best.pt` ke `/home/railway/app/model/`

---

## 📊 Monitoring & Logs

### View Real-Time Logs

1. Dashboard → Select Service
2. **"Logs"** tab
3. Real-time streaming dari service

### Common Log Messages:

✅ **Success:**

```
✅ Server ready!
🌐 Starting server on port 8002
```

❌ **Error:**

```
❌ Startup failed: [error message]
ModuleNotFoundError: No module named 'ultralytics'
```

### Check CPU/Memory Usage

1. Dashboard → Service card
2. **"Metrics"** tab
3. Monitor CPU, Memory, Network

---

## 📝 Configuration Files Reference

### `railway.json` - Multi-Service Config

```json
{
  "services": {
    "frontend": {...},
    "backend": {...},
    "detect-model": {...},
    "stream-model": {...}
  }
}
```

### `runtime.txt` - Python Version

```
python-3.11.7
```

### `.nvmrc` - Node.js Version

```
18.17.0
```

### `model/requirements.txt` - Python Dependencies

- FastAPI + Uvicorn
- PyTorch CPU
- OpenCV (headless)
- Ultralytics YOLO

---

## 🔗 Useful Links

- **Railway Docs**: https://docs.railway.app
- **Railway Dashboard**: https://railway.app/dashboard
- **GitHub Deployments**: https://github.com/settings/apps/railway
- **Project Settings**: https://railway.app/project/[PROJECT_ID]/settings

---

## ✨ Tips & Best Practices

1. **Always test locally first** sebelum push ke main

   ```bash
   npm run dev  # frontend
   npm start    # backend
   python detect_server.py  # detect model
   python stream_server.py  # stream model
   ```

2. **Use .gitignore properly**

   ```
   node_modules/
   __pycache__/
   *.pyc
   .env.local
   ```

   ❌ Jangan ignore `best.pt` (model file diperlukan!)

3. **Monitor costs di Railway**

   - Free tier: $5/month free usage
   - Lihat breakdown di dashboard

4. **Keep dependencies updated**

   ```bash
   npm outdated  # check Node.js packages
   pip list --outdated  # check Python packages
   ```

5. **Use meaningful commit messages**
   ```
   git commit -m "Add Railway deployment config"
   git commit -m "Fix CORS issues in backend"
   ```

---

## 🎯 Next Steps

Setelah deployment berhasil:

1. ✅ Test semua endpoints
2. ✅ Setup custom domain (jika ingin)
3. ✅ Monitor logs & performance
4. ✅ Setup alerts untuk errors
5. ✅ Regular backups model & data

---

## 📞 Support

Jika ada masalah:

1. **Check Railway Logs** - Most detailed information
2. **Check GitHub Issues** - Lihat apakah ada issue similar
3. **Local Testing** - Reproduce error di local machine
4. **Railway Community** - https://discord.gg/railway

---

**Happy Deploying! 🚀**

Last Updated: December 28, 2025
