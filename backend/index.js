const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
 
const app = express();
const PORT = process.env.PORT || 5000;
 
// Dataset paths
const DATASET_ROOT = path.join(__dirname, '..', 'dataset');
const VALID_LABELS_DIR = path.join(DATASET_ROOT, 'valid', 'labels');
const VALID_IMAGES_DIR = path.join(DATASET_ROOT, 'valid', 'images');
 
// Middleware
app.use(cors());
app.use(express.json());
 
// Serve dataset statically so frontend can load images
app.use('/dataset', express.static(DATASET_ROOT));
 
// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to InSignia Backend API' });
});
 
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
 
// Dictionary route: return sample images for a given classId (YOLO class index)
app.get('/api/dictionary', async (req, res) => {
  const { classId } = req.query;
 
  if (typeof classId === 'undefined') {
    return res.status(400).json({ error: 'classId query parameter is required' });
  }
 
  const parsedId = parseInt(classId, 10);
  if (Number.isNaN(parsedId) || parsedId < 0) {
    return res.status(400).json({ error: 'classId must be a non-negative integer' });
  }
 
  // Ensure dataset directories exist
  try {
    await fs.promises.access(VALID_LABELS_DIR);
    await fs.promises.access(VALID_IMAGES_DIR);
  } catch (err) {
    return res.status(500).json({ error: 'Dataset directories not found on server' });
  }
 
  try {
    const labelFiles = await fs.promises.readdir(VALID_LABELS_DIR);
    const maxSamples = 20;
    const samples = [];
 
    for (const file of labelFiles) {
      if (!file.endsWith('.txt')) continue;
 
      const fullLabelPath = path.join(VALID_LABELS_DIR, file);
      const content = await fs.promises.readFile(fullLabelPath, 'utf8');
      const lines = content.split(/\r?\n/).filter(Boolean);
 
      const hasClass = lines.some((line) => {
        const [cls] = line.trim().split(/\s+/);
        return Number.parseInt(cls, 10) === parsedId;
      });
 
      if (!hasClass) continue;
 
      const baseName = path.basename(file, '.txt'); // e.g. 0_jpg.rf.19ebf...
      const jpgName = `${baseName}.jpg`;
      const imagePath = path.join(VALID_IMAGES_DIR, jpgName);
 
      try {
        await fs.promises.access(imagePath);
        samples.push({
          id: baseName,
          imageUrl: `/dataset/valid/images/${jpgName}`,
          classId: parsedId,
        });
      } catch {
        // Skip if corresponding image is missing
      }
 
      if (samples.length >= maxSamples) break;
    }
 
    return res.json({
      classId: parsedId,
      count: samples.length,
      samples,
    });
  } catch (err) {
    console.error('Error while reading dictionary dataset:', err);
    return res.status(500).json({ error: 'Failed to read dataset on server' });
  }
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