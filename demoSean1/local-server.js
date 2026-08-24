import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import chatHandler from './api/chat.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Resolve paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static assets from the current directory
app.use(express.static(__dirname));

// Bind the Vercel serverless API handler to the local Express instance
app.post('/api/chat', (req, res) => {
  // Mock Vercel response helper methods
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
    return res;
  };
  
  chatHandler(req, res);
});

// Serve index.html for any other route to handle client-side routing if added later
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
