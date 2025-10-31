# InSignia Backend

Backend API for the InSignia SIBI Detection platform.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   PORT=5000
   NODE_ENV=development
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Or run the production server:
   ```bash
   npm start
   ```

## API Endpoints

- `GET /` - Welcome message
- `GET /api/health` - Health check
- `GET /api/dictionary` - Dictionary data (placeholder)
- `POST /api/detect` - Sign detection (placeholder)
- `GET /api/quiz` - Quiz data (placeholder)

## Technologies

- Node.js
- Express.js
- CORS
- dotenv