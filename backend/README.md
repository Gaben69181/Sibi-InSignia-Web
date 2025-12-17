# InSignia Backend

Node.js/Express API server for the InSignia SIBI Detection platform.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the backend directory:

   ```env
   PORT=5000
   NODE_ENV=development
   ```

3. Ensure the dataset directory exists at the project root (`../dataset` relative to backend)

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Or run the production server:
   ```bash
   npm start
   ```

The server will run on `http://localhost:5000`

## API Endpoints

### GET /

Returns a welcome message.

**Response:**

```json
{
  "message": "Welcome to InSignia Backend API"
}
```

### GET /api/health

Health check endpoint.

**Response:**

```json
{
  "status": "OK",
  "timestamp": "2024-12-04T16:45:15.758Z"
}
```

### GET /api/dictionary

Returns sample images for a specific SIBI class from the dataset.

**Query Parameters:**

- `classId` (required): The YOLO class index (0-25 for A-Z)

**Example Request:**

```
GET /api/dictionary?classId=0
```

**Response:**

```json
{
  "classId": 0,
  "count": 5,
  "samples": [
    {
      "id": "0_jpg.rf.19ebf...",
      "imageUrl": "/dataset/valid/images/0_jpg.rf.19ebf....jpg",
      "classId": 0
    }
  ]
}
```

### POST /api/detect

Placeholder endpoint for sign detection (to be implemented).

### GET /api/quiz

Placeholder endpoint for quiz data (to be implemented).

## Dataset Integration

The backend serves the SIBI dataset statically at `/dataset` and provides dictionary functionality by:

1. Reading YOLO label files from `dataset/valid/labels/`
2. Matching class IDs in the labels
3. Returning corresponding image URLs from `dataset/valid/images/`
4. Limiting results to 20 samples per class for performance

## Technologies

- Node.js
- Express.js
- CORS
- dotenv
- File system operations for dataset access

## Development

- Uses `nodemon` for development with auto-restart
- Serves dataset images statically for frontend access
- Handles dataset validation and error responses
