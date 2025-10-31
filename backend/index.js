const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to InSignia Backend API' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Placeholder routes for future features
app.get('/api/dictionary', (req, res) => {
  res.json({ message: 'Dictionary endpoint - to be implemented' });
});

app.post('/api/detect', (req, res) => {
  res.json({ message: 'Detection endpoint - to be implemented' });
});

app.get('/api/quiz', (req, res) => {
  res.json({ message: 'Quiz endpoint - to be implemented' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});