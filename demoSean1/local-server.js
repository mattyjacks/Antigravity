import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import chatHandler from './api/chat.js';
import camEmotionHandler from './api/cam-emotion.js';
import ttsHandler from './api/tts.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Resolve paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static assets from the current directory
app.use(express.static(__dirname));

// Helper for Vercel serverless compatible response mocks
const mockVercelRes = (res) => {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
    return res;
  };
  return res;
};

// Bind API handlers
app.post('/api/chat', (req, res) => chatHandler(req, mockVercelRes(res)));
app.post('/api/cam-emotion', (req, res) => camEmotionHandler(req, mockVercelRes(res)));
app.post('/api/tts', (req, res) => ttsHandler(req, mockVercelRes(res)));

// Serve index.html for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`🎮 CarryMe Local Development Server Running!`);
  console.log(`🔗 Address: http://localhost:${PORT}`);
  console.log(`⚙️  Model:   ${process.env.OPENAI_MODEL || 'gpt-5.4-nano-2026-03-17'}`);
  console.log(`🔑 API Key: ${process.env.OPENAI_API_KEY ? 'Configured ✅' : 'DEMO MODE ⚠️ (Use mock responses)'}`);
  console.log(`================================================================`);
});
