# InSignia

Real-time SIBI (Sistem Isyarat Bahasa Indonesia) Detection for Inclusive Education

## Project Structure

This project consists of three main components:

- `frontend/` - React application (Vite + Tailwind CSS + Framer Motion)
- `backend/` - Node.js/Express API server
- `model/` - Python FastAPI server with YOLOv8 for SIBI detection

## Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- npm or yarn

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Gaben69181/Sibi-InSignia-Web.git
cd Sibi-InSignia-Web
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
PORT=5000
NODE_ENV=development
```

Run the backend server:

```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. Model Setup (AI Detection Server)

```bash
cd ../model
pip install -r requirements.txt
python detect_server.py
```

The model server will run on `http://localhost:8002`

## Features

- **Dictionary**: SIBI sign language reference with sample images
- **Sign Detection**: Real-time SIBI detection using YOLOv8 AI model
- **Quiz Game**: Interactive learning through quizzes
- **Responsive Design**: Mobile-friendly interface with smooth animations

## API Endpoints

### Backend (Express)

- `GET /` - Welcome message
- `GET /api/health` - Health check
- `GET /api/dictionary?classId={id}` - Get dictionary samples for a specific SIBI class
- `POST /api/detect` - Sign detection (placeholder)
- `GET /api/quiz` - Quiz data (placeholder)

### Model (FastAPI)

- `POST /detect` - Run SIBI detection on base64 image data

## Technologies

- **Frontend**: React 19, Vite, React Router DOM, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express.js, CORS
- **Model**: Python, FastAPI, Ultralytics YOLOv8, OpenCV, PIL
- **Dataset**: YOLO-formatted SIBI dataset with validation images and labels

## Dataset

The project uses a SIBI dataset located in the `dataset/` directory with the following structure:

```
dataset/
├── valid/
│   ├── images/  # .jpg files
│   └── labels/  # .txt files with YOLO annotations
```

## Model Training

The `best.pt` file in the `model/` directory contains the trained YOLOv8 model for SIBI detection (26 classes: A-Z).

## Development

1. Start all three servers (backend, frontend, model)
2. Open `http://localhost:5173` in your browser
3. The frontend will communicate with the backend and model servers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
