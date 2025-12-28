# 🚀 Railway Deployment Checklist

## ✅ Pre-Deployment Checklist

### Code & Configuration

- [ ] Semua code sudah ter-commit ke GitHub
- [ ] `railway.json` sudah updated dengan 4 services
- [ ] `runtime.txt` ada (Python 3.11.7)
- [ ] `.nvmrc` ada (Node 18.17.0)
- [ ] `model/best.pt` ada di repo
- [ ] `model/requirements.txt` updated
- [ ] `backend/package.json` updated dengan engines
- [ ] `frontend/package.json` updated dengan engines
- [ ] `detect_server.py` handle PORT env variable
- [ ] `stream_server.py` handle PORT env variable

### Testing

- [ ] Frontend berjalan: `npm run dev` di folder frontend/
- [ ] Backend berjalan: `npm start` di folder backend/
- [ ] Detect model berjalan: `python detect_server.py` di folder model/
- [ ] Stream model berjalan: `python stream_server.py` di folder model/
- [ ] Frontend API calls bekerja dengan backend

### Documentation

- [ ] `RAILWAY_DEPLOYMENT_GUIDE.md` dibaca
- [ ] Mengerti 4 services yang akan di-deploy
- [ ] Tahu project ID akan di-dapat setelah deploy

---

## 📋 Deployment Steps

### Step 1: Push ke GitHub

```bash
git add .
git commit -m "Setup Railway deployment with 4 services"
git push origin main
```

**Status:** [ ] Done

### Step 2: Login ke Railway

- [ ] Buka https://railway.app
- [ ] Login dengan GitHub account

### Step 3: Create Project

- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Select repository
- [ ] Wait untuk build selesai (5-10 menit per service)

**Estimated time:** 20-40 minutes

### Step 4: Check Build Status

- [ ] Frontend: Built successfully ✅
- [ ] Backend: Built successfully ✅
- [ ] Detect-Model: Built successfully ✅
- [ ] Stream-Model: Built successfully ✅

### Step 5: Set Environment Variables

#### Frontend Service

```
VITE_DETECT_API_URL=https://detect-model-[PROJECT_ID].railway.app
VITE_STREAM_API_URL=https://stream-model-[PROJECT_ID].railway.app
VITE_BACKEND_API_URL=https://backend-[PROJECT_ID].railway.app
```

- [ ] Semua variables sudah set

#### Backend Service

```
NODE_ENV=production
PORT=5000
DETECT_MODEL_URL=https://detect-model-[PROJECT_ID].railway.app
STREAM_MODEL_URL=https://stream-model-[PROJECT_ID].railway.app
```

- [ ] Semua variables sudah set

#### Detect-Model Service

```
PORT=8002
```

- [ ] Variable sudah set

#### Stream-Model Service

```
PORT=8003
```

- [ ] Variable sudah set

### Step 6: Redeploy Services

- [ ] Frontend: Redeploy
- [ ] Backend: Redeploy
- [ ] Detect-Model: Redeploy
- [ ] Stream-Model: Redeploy
- [ ] Wait semua selesai

---

## 🧪 Post-Deployment Testing

### 1. Frontend

```
https://frontend-[PROJECT_ID].railway.app
```

- [ ] Website loads
- [ ] No CSS/JS errors di console
- [ ] Responsive di mobile

### 2. Backend Health

```
curl https://backend-[PROJECT_ID].railway.app/api/health
```

- [ ] Returns 200 OK
- [ ] Response bisa di-parse

### 3. Detect Model Health

```
curl https://detect-model-[PROJECT_ID].railway.app/health
```

- [ ] Returns 200 OK
- [ ] Model loaded

### 4. Stream Model Status

```
curl https://stream-model-[PROJECT_ID].railway.app/status
```

- [ ] Returns JSON status
- [ ] Camera dapat di-initialize

### 5. Integration Testing

- [ ] Frontend bisa akses backend
- [ ] Frontend bisa akses detect model
- [ ] Upload image → detection bekerja
- [ ] Video stream → real-time detection bekerja

---

## 🔧 Troubleshooting Quick Fixes

| Issue              | Solution                                       |
| ------------------ | ---------------------------------------------- |
| Build timeout      | Cek `requirements.txt`, remove unused packages |
| Module not found   | Cek `model/requirements.txt` semua deps ada    |
| Port conflict      | Pastikan env variables PORT sudah set          |
| CORS error         | Cek backend CORS middleware                    |
| Model file missing | `git add model/best.pt && git push`            |
| API endpoints 404  | Cek backend routes, PORT number                |

---

## 📊 Monitoring

### Daily

- [ ] Check logs untuk errors
- [ ] Monitor CPU/Memory usage
- [ ] Verify uptime

### Weekly

- [ ] Review deployment costs
- [ ] Check for security updates
- [ ] Update documentation jika ada perubahan

### Monthly

- [ ] Optimize performance
- [ ] Update dependencies
- [ ] Review & improve architecture

---

## 🎯 Success Criteria

✅ Deployment berhasil ketika:

1. Semua 4 services deployed tanpa error
2. Frontend accessible via public URL
3. API endpoints semua return HTTP 200
4. Detection model inference working
5. Video streaming working real-time
6. No CORS or network errors di browser console

---

## 📞 Need Help?

1. **Check Logs** → Railway Dashboard → Service → Logs tab
2. **Read Docs** → RAILWAY_DEPLOYMENT_GUIDE.md
3. **Test Locally** → Reproduce error di local machine
4. **Check Status** → https://railway.app/status

---

**Last Updated:** December 28, 2025

**Deployed by:** [Your Name]

**Project ID:** ******\_\_\_******

**Deployment Date:** ******\_\_\_******

**Notes:**

---

---
