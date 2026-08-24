import { OpenAI } from 'openai';

const CHARACTER_VOICES = {
  Aura_Jett: 'nova',
  CozyCat: 'shimmer',
  EldenSlayer: 'echo',
  SupportBae: 'alloy',
  NukeTactics: 'onyx',
  RetroPixel: 'fable',
  ManaShield: 'onyx',
  FakerFanboy: 'echo',
  Default: 'nova'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, characterName } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing text parameter' });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.startsWith('your-')) {
    console.log("TTS API running in Demo Mode (No OpenAI Key)");
    return res.status(200).json({ demo: true, message: "Use client Web Speech Synthesis fallback" });
  }

  const openai = new OpenAI({ apiKey });
  const selectedVoice = CHARACTER_VOICES[characterName] || CHARACTER_VOICES.Default;

  try {
    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: selectedVoice,
      input: text,
      speed: 1.05
    });

    const buffer = Buffer.from(await mp3Response.arrayBuffer());
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("OpenAI TTS error:", error);
    return res.status(500).json({ error: error.message, demo: true });
  }
}
