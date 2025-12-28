# 🚀 VERCEL DEPLOYMENT GUIDE

**Deploy Frontend React + Vite ke Vercel dalam 5 menit**

---

## 📋 Prerequisites

- [x] GitHub account dengan repo `Sibi-InSignia-Web`
- [x] Railway project sudah running (Backend + Models)
- [x] Railway Project ID (lihat di URL: `railway.app/project/[PROJECT_ID]`)

---

## ⚡ QUICK SETUP (5 Minutes)

### **Step 1: Buka Vercel**

1. Pergi ke https://vercel.com
2. Klik **"Sign Up"** atau **"Sign In"** (pakai GitHub)
3. Authorize Vercel ke GitHub

### **Step 2: Import Project**

1. Klik **"New Project"** (top-right)
2. Klik **"Continue with GitHub"**
3. Search repo: **`Sibi-InSignia-Web`**
4. Klik **"Import"**

### **Step 3: Configure Project**

Vercel akan auto-detect:

```
Framework Preset: Vite
Build Command: cd frontend && npm install && npm run build
Output Directory: frontend/dist
Install Command: npm install
```

✅ **Biarkan default! Sudah benar!**

Jika tidak auto-detect, set manual:

- **Framework**: Vite
- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/dist`

### **Step 4: Set Environment Variables**

Sebelum deploy, set variables:

1. Scroll ke bawah, lihat **"Environment Variables"** section
2. Tambahkan 3 variables:

| Name                   | Value                                           |
| ---------------------- | ----------------------------------------------- |
| `VITE_DETECT_API_URL`  | `https://stream-model-[RAILWAY_ID].railway.app` |
| `VITE_STREAM_API_URL`  | `https://stream-model-[RAILWAY_ID].railway.app` |
| `VITE_BACKEND_API_URL` | `https://backend-[RAILWAY_ID].railway.app`      |

**Ganti `[RAILWAY_ID]` dengan project ID Anda dari Railway.**

Contoh jika PROJECT_ID = `pacific-mercy`:

```
VITE_DETECT_API_URL=https://stream-model-pacific-mercy.railway.app
VITE_STREAM_API_URL=https://stream-model-pacific-mercy.railway.app
VITE_BACKEND_API_URL=https://backend-pacific-mercy.railway.app
```

### **Step 5: Deploy!**

Klik **"Deploy"** button → Tunggu selesai (±2-3 menit)

**Selesai!** 🎉 Frontend sudah live di:

```
https://sibi-insignia-web.vercel.app
```

---

## 🔗 Dapatkan Public URLs dari Railway

Sebelum set environment variables di Vercel, cari public URLs services:

### **Cara mendapat URL di Railway:**

1. Buka Railway Dashboard: https://railway.app/dashboard
2. Klik project `pacific-mercy` (atau nama project Anda)
3. Klik service **"Backend"** → tab **"Settings"**
4. Cari **"Domains"** section → copy public URL
5. Lakukan sama untuk **"detect-model"** dan **"stream-model"**

**URLs format:**

```
https://backend-[PROJECT_ID].railway.app
https://detect-model-[PROJECT_ID].railway.app
https://stream-model-[PROJECT_ID].railway.app
```

---

## ✅ VERIFICATION CHECKLIST

Setelah deploy ke Vercel:

### **1. Test Frontend Load**

```bash
curl https://sibi-insignia-web.vercel.app
```

Harus return HTML (200 OK)

### **2. Check Console (Browser)**

1. Buka frontend URL di browser
2. Klik **F12** → **Console** tab
3. Tidak boleh ada 502/504 errors

### **3. Test API Connectivity**

```bash
# Test Backend
curl https://backend-[RAILWAY_ID].railway.app/api/health

# Test Detect Model
curl https://detect-model-[RAILWAY_ID].railway.app/health

# Test Stream Model
curl https://stream-model-[RAILWAY_ID].railway.app/status
```

Semua harus return 200 OK ✅

---

## 🐛 Troubleshooting

### **502 Bad Gateway di Frontend**

**Penyebab:** Environment variables tidak di-set di Vercel

**Fix:**

1. Vercel Dashboard → Project Settings → **Environment Variables**
2. Pastikan ketiga `VITE_*` variables sudah ada
3. Redeploy: Klik **"Deployments"** → **"Redeploy"** latest

### **Frontend build failed**

**Penyebab:** Build command salah

**Fix:**

1. Check build logs di Vercel: **Deployments** → **Details** → **Build logs**
2. Pastikan [`frontend/package.json`](../frontend/package.json) sudah ada semua dependencies
3. Redeploy

### **API returning 404**

**Penyebab:** Public URLs salah atau services tidak running

**Fix:**

1. Check Railway services semua "Running" status
2. Copy exact public URLs dari Railway Settings
3. Update variables di Vercel dengan correct URLs
4. Redeploy

---

## 🔄 Auto-Deployment dari GitHub

Setelah setup pertama, Vercel otomatis:

- ✅ Deploy setiap kali push ke `main` branch
- ✅ Preview untuk setiap pull request
- ✅ Production deployment instant

**Jadi tinggal:**

```bash
git push origin main
# Vercel otomatis deploy dalam 1-2 menit
```

---

## 📊 Vercel Dashboard Features

Setelah deploy, Anda bisa:

### **Deployments**

- Lihat history semua deployments
- Rollback ke versi sebelumnya
- Preview URLs

### **Metrics**

- Response time
- Request count
- Error rates
- Uptime

### **Settings**

- Domain management (custom domain)
- Environment variables
- Build & output settings
- Analytics

### **Git Integration**

- Auto-sync dengan GitHub
- PR previews
- Branch deployments

---

## 🎁 Bonus: Custom Domain

Jika ingin custom domain (contoh: `sibi.yourdomain.com`):

1. Vercel Dashboard → **Settings** → **Domains**
2. Klik **"Add"**
3. Input custom domain
4. Follow DNS instructions di provider Anda

---

## 📞 Next Steps

1. ✅ Deploy ke Vercel (ikuti guide ini)
2. ✅ Verify semua working (lihat Verification Checklist)
3. ✅ Test API calls dari frontend
4. ✅ Announce ke team: app sudah live! 🎉

---

**Total Setup Time:** ~5-10 minutes

**Status:**

- [x] Frontend Ready (Vercel)
- [x] Backend Ready (Railway)
- [x] Models Ready (Railway)
- [x] Environment Variables Configured

**READY TO DEPLOY!** 🚀

Last Updated: December 28, 2025
