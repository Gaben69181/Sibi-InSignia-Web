# InSignia Frontend

React frontend application for the InSignia SIBI Detection platform, built with modern web technologies.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the development server:

   ```bash
   npm run dev
   ```

3. Build for production:

   ```bash
   npm run build
   ```

4. Preview production build:
   ```bash
   npm run preview
   ```

The development server runs on `http://localhost:5173`

## Technologies

- **React 19**: Latest React with concurrent features
- **Vite**: Fast build tool and development server
- **React Router DOM v7**: Client-side routing
- **Tailwind CSS v4**: Utility-first CSS framework
- **Framer Motion**: Animation library for React
- **ESLint**: Code linting and formatting

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── FeatureCard.jsx    # Feature showcase cards
│   │   └── Hero.jsx          # Landing page hero section
│   ├── pages/
│   │   ├── Home.jsx          # Landing page
│   │   ├── Dictionary.jsx    # SIBI sign dictionary
│   │   ├── Detect.jsx        # Real-time sign detection
│   │   └── Quiz.jsx          # Interactive quiz game
│   ├── App.jsx               # Main app component with routing
│   ├── main.jsx              # App entry point
│   ├── index.css             # Global styles
│   └── assets/               # Static assets
├── public/                   # Public assets
├── index.html                # Main HTML template
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
└── package.json              # Dependencies and scripts
```

## Features

### Home Page

- Hero section with animated introduction
- Feature cards showcasing platform capabilities
- Responsive design with smooth animations

### Dictionary Page

- Browse SIBI signs by category
- View sample images from the dataset
- Interactive sign reference

### Sign Detection Page

- Real-time camera access for sign detection
- Integration with AI model for SIBI recognition
- Visual feedback with bounding boxes and keypoints

### Quiz Game Page

- Interactive learning through quizzes
- Progress tracking and scoring
- Educational gameplay mechanics

## Routing

The application uses React Router with the following routes:

- `/` - Home page
- `/dictionary` - Sign dictionary
- `/detect` - Sign detection
- `/quiz` - Quiz game

## Styling

- **Tailwind CSS**: Utility classes for rapid UI development
- **Custom CSS**: Additional styles in `index.css`
- **Responsive Design**: Mobile-first approach
- **Dark Theme**: Gradient backgrounds and modern aesthetics

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment

The frontend communicates with:

- **Backend API**: `http://localhost:5000` (Express server)
- **Model API**: `http://localhost:8002` (FastAPI server)

Ensure both backend and model servers are running for full functionality.

## Browser Support

- Modern browsers with ES6+ support
- Camera API access for detection features
- WebGL support for animations
