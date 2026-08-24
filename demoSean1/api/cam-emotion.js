import { OpenAI } from 'openai';

// Fallback emotions pool for Demo Mode when API key is missing or offline
const DEMO_EMOTIONS = [
  { primary_emotion: "Joy / Smiling", confidence: 94, facial_cues: "Bright smile detected with direct eye contact", match_reaction_hint: "Flustered by your bright smile!" },
  { primary_emotion: "Flirty / Smirking", confidence: 88, facial_cues: "Slight smirk and raised eyebrow, teasing expression", match_reaction_hint: "Heart rate spiking from your playful look!" },
  { primary_emotion: "Surprised / Excited", confidence: 91, facial_cues: "Wide eyes, open smile, engaged posture", match_reaction_hint: "Loves your hyped energy!" },
  { primary_emotion: "Smug / Confident", confidence: 85, facial_cues: "Tilt of head, confident grin, high energy", match_reaction_hint: "Challenged by your confident vibe!" },
  { primary_emotion: "Pouting / Cute Sad", confidence: 82, facial_cues: "Subtle pout and puppy-dog eyes", match_reaction_hint: "Wants to comfort you in co-op!" },
  { primary_emotion: "Focused / Neutral", confidence: 90, facial_cues: "Calm, intent locked gaze on screen", match_reaction_hint: "Admires your intense gamer focus!" }
];

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

  const { image, matchName } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'Missing image frame' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  // Demo mode fallback if no valid key is provided
  if (!apiKey || apiKey.startsWith('your-')) {
    console.log("Cam Emotion API running in Demo Mode");
    const demoResult = getDemoEmotion(image);
    return res.status(200).json({ ...demoResult, demo: true });
  }

  const openai = new OpenAI({ apiKey });

  try {
    const promptText = `Analyze this webcam snapshot of the user interacting with ${matchName || 'their AI gamer match'}.
Analyze the user's facial expression, mouth position, eye engagement, and overall mood.
Respond ONLY with a JSON object in this exact schema:
{
  "primary_emotion": "One of: Joy / Smiling, Flirty / Smirking, Surprised / Excited, Smug / Confident, Pouting / Cute Sad, Angry / Frustrated, Focused / Neutral",
  "confidence": 85, // integer percentage 0-100
  "facial_cues": "A short 1-sentence description of visual cues (e.g. 'Warm smile with relaxed eyes', 'Playful smirk and raised eyebrow')",
  "match_reaction_hint": "A short 1-sentence note on how ${matchName || 'the match'} should react emotionally to seeing this face"
}`;

    const completion = await openai.chat.completions.create({
      model: model.includes('nano') ? 'gpt-4o-mini' : model, // Ensure vision-capable model is used
      messages: [
        {
          role: 'system',
          content: 'You are an advanced AI computer vision system analyzing human face emotions from camera frames.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: promptText },
            {
              type: 'image_url',
              image_url: {
                url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`,
                detail: 'low'
              }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' }
    });

    const outputText = completion.choices[0].message.content.trim();
    const result = JSON.parse(outputText);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Cam Emotion API error:", error);
    const demoResult = getDemoEmotion(image);
    return res.status(200).json({ ...demoResult, demo: true, error: error.message });
  }
}

function getDemoEmotion(imageBase64) {
  // Deterministic seed selection based on string length to simulate consistent analysis per frame
  const len = imageBase64 ? imageBase64.length : Math.floor(Math.random() * 100);
  const index = len % DEMO_EMOTIONS.length;
  return DEMO_EMOTIONS[index];
}
