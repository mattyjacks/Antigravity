import { OpenAI } from 'openai';

// Fallback waifu portraits (SVG base64 encoded) for demo mode
const DEMO_WAIFU_TEXTURES = {
  Aura_Jett: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256'><rect width='256' height='256' fill='%230b0d19'/><circle cx='128' cy='128' r='90' fill='%23ff007f' opacity='0.2'/><text x='128' y='140' font-size='70' text-anchor='middle'>☄️</text><text x='128' y='210' font-size='16' fill='%2300f0ff' font-family='sans-serif' text-anchor='middle'>AURA JETT // 3D AI WAIFU</text></svg>",
  CozyCat: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256'><rect width='256' height='256' fill='%230f172a'/><circle cx='128' cy='128' r='90' fill='%2300ffcc' opacity='0.2'/><text x='128' y='140' font-size='70' text-anchor='middle'>🐱</text><text x='128' y='210' font-size='16' fill='%2300ffcc' font-family='sans-serif' text-anchor='middle'>COZYCAT // 3D AI WAIFU</text></svg>",
  Default: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256'><rect width='256' height='256' fill='%23181825'/><circle cx='128' cy='128' r='90' fill='%23ff007f' opacity='0.2'/><text x='128' y='140' font-size='70' text-anchor='middle'>💖</text><text x='128' y='210' font-size='16' fill='%23ffffff' font-family='sans-serif' text-anchor='middle'>AI MATCH WAIFU</text></svg>"
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

  const { characterName, emotion } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  // Use DALL-E 2 with size 256x256 (Cheapest available image generation model on OpenAI: $0.016 / image)
  if (!apiKey || apiKey.startsWith('your-')) {
    console.log("Waifu Image API running in Demo Mode (No OpenAI Key)");
    const fallback = DEMO_WAIFU_TEXTURES[characterName] || DEMO_WAIFU_TEXTURES.Default;
    return res.status(200).json({ url: fallback, demo: true });
  }

  const openai = new OpenAI({ apiKey });

  try {
    const promptText = `Cute anime waifu girl gamer persona named ${characterName || 'Player 2'}, ${emotion || 'smiling flustered'}, cyberpunk neon background, highly detailed digital anime art portrait, vibrant colors`;

    const imageResponse = await openai.images.generate({
      model: 'dall-e-2', // Cheapest image model
      prompt: promptText,
      n: 1,
      size: '256x256' // Cheapest resolution
    });

    const imageUrl = imageResponse.data[0].url;
    return res.status(200).json({ url: imageUrl });
  } catch (error) {
    console.error("OpenAI DALL-E 2 image generation error:", error);
    const fallback = DEMO_WAIFU_TEXTURES[characterName] || DEMO_WAIFU_TEXTURES.Default;
    return res.status(200).json({ url: fallback, demo: true, error: error.message });
  }
}
