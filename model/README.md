# InSignia Model Server

Python FastAPI server providing AI-powered SIBI (Sistem Isyarat Bahasa Indonesia) sign language detection using YOLOv8.

## Setup

1. Ensure Python 3.8+ is installed

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Ensure `best.pt` (trained YOLOv8 model) is in the same directory

4. Run the server:
   ```bash
   python detect_server.py
   ```

The server will run on `http://localhost:8002`

## API Endpoint

### POST /detect

Runs SIBI detection on a single image frame.

**Request Body:**

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

**Response:**

```json
{
  "letter": "A",
  "confidence": 0.95,
  "keypoints": [
    { "x": 0.5, "y": 0.3 },
    { "x": 0.5, "y": 0.5 },
    { "x": 0.5, "y": 0.7 }
  ],
  "bones": [
    [0, 1],
    [1, 2]
  ],
  "boxes": [{ "x": 0.2, "y": 0.1, "w": 0.6, "h": 0.8 }]
}
```

## Model Details

- **Model**: YOLOv8 (Ultralytics)
- **Classes**: 26 (A-Z for SIBI alphabet)
- **Input**: Base64 encoded images (JPEG/PNG)
- **Output**: Detection results with bounding boxes, keypoints, and letter classification

## Processing Pipeline

1. **Image Decoding**: Convert base64 data URL to PIL Image
2. **Model Inference**: Run YOLOv8 detection on the image
3. **Post-processing**:
   - Extract highest confidence detection
   - Map class ID (0-25) to letter (A-Z)
   - Generate bounding box coordinates
   - Extract keypoints if available (pose model)
   - Create skeleton visualization data
4. **Response Formatting**: Structure data for frontend consumption

## Technologies

- **FastAPI**: Modern Python web framework
- **Ultralytics YOLOv8**: State-of-the-art object detection
- **OpenCV**: Computer vision operations for contour detection
- **PIL/Pillow**: Image processing
- **NumPy**: Numerical computations
- **Uvicorn**: ASGI server

## Model File

- `best.pt`: Trained YOLOv8 model weights
- Supports both detection and pose estimation models
- Automatically handles keypoints if available in the model

## Error Handling

- Invalid base64 images
- Model inference failures
- Missing model file
- Malformed requests

## Performance

- Optimized for real-time detection
- Processes single frames (not video streams)
- Returns results in JSON format for easy frontend integration

## Development

The server includes CORS middleware for cross-origin requests and runs on all interfaces (`0.0.0.0`) for easy access from frontend applications.
