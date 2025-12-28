# Railway Deployment Guide

Panduan lengkap untuk deploy aplikasi SIBI Detection ke Railway.

## 📋 Prerequisites

1. **Akun Railway**: https://railway.app
2. **GitHub Repository**: Pastikan kode sudah di-push ke branch `prototype`
3. **Railway CLI** (opsional): `npm install -g @railway/cli`

## 🚀 Quick Deploy

### Step 1: Import Project
1. Buka Railway dashboard
2. Klik "New Project" → "Deploy from GitHub"
3. Pilih repository `Gaben69181/Sibi-InSignia-Web`
4. Pilih branch `prototype`

### Step 2: Setup Services
Railway akan otomatis detect 3 services berdasarkan `nixpacks.toml`:

#### Service 1: Frontend (React)
- **Source**: `frontend/`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run preview`
- **Port**: Auto-detected (4173)

#### Service 2: Backend (Node.js)
- **Source**: `backend/`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Port**: 5000
- **Environment**: `NODE_ENV=production`

#### Service 3: Model (Python)
- **Source**: `model/`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python detect_server.py`
- **Port**: 8002

## ⚙️ Environment Variables

Set di Railway dashboard untuk setiap service:

### Frontend Service
```bash
VITE_DETECT_API_URL=https://[model-service-name].railway.app
```

### Backend Service
```bash
NODE_ENV=production
PORT=5000
```

### Model Service
```bash
MODEL_PORT=8002
```

## 🔗 Service Communication

Setelah deploy, update environment variables dengan URL yang benar:

1. **Model Service** akan dapat URL seperti: `https://sibi-model-production.up.railway.app`
2. **Backend Service** akan dapat URL seperti: `https://sibi-backend-production.up.railway.app`
3. **Frontend Service** akan dapat URL seperti: `https://sibi-frontend-production.up.railway.app`

### Update Frontend Environment:
```
VITE_DETECT_API_URL=https://sibi-model-production.up.railway.app
```

## 📁 File Structure

```
.
├── railway.json              # Railway configuration
├── frontend/
│   ├── nixpacks.toml        # Frontend build config
│   ├── package.json         # Updated with production scripts
│   └── src/                 # React app
├── backend/
│   ├── nixpacks.toml        # Backend build config
│   └── index.js            # Express server
├── model/
│   ├── nixpacks.toml        # Python build config
│   ├── requirements.txt     # Python dependencies
│   ├── detect_server.py    # Single image detection
│   └── stream_server.py    # Video streaming
└── .env.example            # Environment variables template
```

## 🐛 Troubleshooting

### Build Fails
- **Python**: Check `requirements.txt` compatibility
- **Node.js**: Ensure all dependencies listed in `package.json`
- **Memory**: Upgrade plan jika build membutuhkan >512MB RAM

### Runtime Issues
- **CORS**: Update CORS settings di backend untuk production URLs
- **Environment Variables**: Pastikan semua variables sudah di-set
- **Ports**: Railway auto-assign ports, gunakan `$PORT` variable

### Model Issues
- **YOLO Model**: `best.pt` harus ada di `model/` directory
- **Dependencies**: Pastikan semua Python packages compatible
- **Memory**: ML inference butuh minimal 1GB RAM

## 💰 Pricing

- **Hobby Plan**: $5/month - Cukup untuk development/testing
- **Pro Plan**: $10/month - Recommended untuk production
- **Memory**: Minimal 1GB untuk ML service

## 🔄 Redeploy

Setelah update kode:
1. Push ke branch `prototype`
2. Railway akan auto-redeploy
3. Atau manual trigger di dashboard

## 📊 Monitoring

- **Logs**: Check di Railway dashboard per service
- **Metrics**: CPU, Memory, Network usage
- **Health Checks**: Monitor `/api/health` endpoint

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] Services communicating properly
- [ ] CORS settings updated
- [ ] Domain/custom URL configured
- [ ] SSL certificate active
- [ ] Monitoring alerts setup

## 📞 Support

Jika ada masalah:
1. Check Railway logs
2. Verify environment variables
3. Test local development setup
4. Check Railway status page

---

**Happy Deploying! 🚀**