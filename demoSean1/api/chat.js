import { OpenAI } from 'openai';

// Fallback mock responses when OpenAI API Key is missing or fails
const MOCK_RESPONSES = {
  Zealot_Vespera: [
    { text: "By the Holy Throne! A fellow warrior of Atoma Prime. Praise the Emperor! Have you brought your Eviscerator for the Auric queue?", change: 8, reason: "Liked your devotion to the God-Emperor." },
    { text: "The heretics of Tertium Hive will tremble before our combined fury! Let's cleanse Nurgle spawns together, sibling.", change: 12, reason: "Connected over Darktide Maelstrom tactics." },
    { text: "Your combat fervor honors the Inquisition! I shall guard your flank against Ragers and Crushers with my life.", change: 18, reason: "Sworn combat duo allegiance." },
    { text: "By the Emperor's grace, you are my truest battle companion. Together, we shall burn every heretic in Atoma!", change: 25, reason: "Declared eternal 40k co-op partner." }
  ],
  Aura_Jett: [
    { text: "If you don't buy me Vandal round 2, I'm literally throwing. What rank are you anyway?", change: 5, reason: "Liked that you dared to chat." },
    { text: "Fine, your stats aren't horrible. Let's run a competitive game, but don't hold me back.", change: 10, reason: "Expressed interest in ranking up." },
    { text: "You're actually not bad... for a console peasant. Just kidding. We should duo again.", change: 15, reason: "Felt synergy after a virtual match." },
    { text: "Okay, I guess you're my pocket healer now. Don't let anyone else heal me, okay?", change: 20, reason: "Unlocked duo status." }
  ],
  CozyCat: [
    { text: "Hello! 🐾 I just finished decorating my museum in Animal Crossing. Do you want to visit? I can bake some virtual cookies!", change: 8, reason: "Loved the friendly opening." },
    { text: "Your favorite games sound so fun! I love farming games and cozy puzzles. It's so peaceful.", change: 12, reason: "Connected over gaming preferences." },
    { text: "I bought a coop of blue chickens today and named one after you. They are so cute! 💙", change: 15, reason: "Showed affection through chicken naming." },
    { text: "I really look forward to talking to you every day. You're my favorite player two.", change: 25, reason: "Admitted they enjoy your company." }
  ],
  Vaelen_Tarnished: [
    { text: "Have you beaten Malenia solo? No spirit ashes, no summons. That's the real test of a warrior.", change: 5, reason: "Testing your gaming grit." },
    { text: "Ah, a fellow Tarnished of culture! Your build sounds interesting. Let me tell you about Land of Shadow lore.", change: 15, reason: "Approved of your RPG build knowledge." },
    { text: "You dodged that topic like a pro. Fine, I will carry you through the DLC if we duo.", change: 15, reason: "Enjoys your attitude." },
    { text: "Together, we shall devour the very gods! You have proven your worth. Let's form a guild.", change: 25, reason: "Declared you a worthy partner." }
  ],
  Kira_Support: [
    { text: "Need a pocket healer? I will damage boost your Vandal and keep your KDA sparkling! 💖", change: 8, reason: "Liked your energy." },
    { text: "I locked Kiriko for you! Let me know when you need a Suzu or Kitsune Rush.", change: 12, reason: "Synergized on support hero callouts." },
    { text: "You're keeping me safe from flankers! You're officially my favorite DPS player.", change: 18, reason: "Grateful for peel and protection." }
  ],
  Ryuu_Wavedash: [
    { text: "1v1 me, local play! If you can break throws and execute Electric Wind God Fists, I'm impressed.", change: 8, reason: "Hyped for fighting game match." },
    { text: "Your frame data knowledge is solid! Let's analyze SF6 match replays together.", change: 15, reason: "Respected your frame data breakdown." }
  ],
  Aethelgard_Tank: [
    { text: "Greetings! Progression tank here. My spreadsheets are organized for tonight's raid pull.", change: 8, reason: "Appreciated raid preparation." },
    { text: "I will hold aggro on every boss for you. Welcome to the main guild raid team!", change: 18, reason: "Promoted to main raid party." }
  ],
  Default: [
    { text: "GG! Let's team up sometime. What games are you queueing for tonight?", change: 5, reason: "Appreciated the message." },
    { text: "That sounds like a solid strategy. We should try it out in co-op.", change: 10, reason: "Agreed on tactics." },
    { text: "You're pretty cool. Definitely matching my energy right now.", change: 15, reason: "Enjoying the conversation." },
    { text: "I think we make a great team. Ready for the next level?", change: 20, reason: "Felt ready to level up relationship." }
  ]
};

export default async function handler(req, res) {
  // Set CORS headers for serverless environment
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    messages,
    characterName,
    characterBio,
    characterGames,
    characterPlaystyle,
    characterPlatforms,
    characterRoles,
    userGamerTag,
    userGames,
    userPlaystyle,
    userPlatforms,
    userRoles,
    userBio,
    currentAffection,
    userFaceEmotion,
    userVisualCues,
    matchCurrentEmotion
  } = req.body;

  if (!characterName || !messages || !messages.length) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-5.4-nano-2026-03-17';

  // Check if API key is configured. If not, run in DEMO Mode.
  if (!apiKey || apiKey.startsWith('your-')) {
    console.log("CarryMe API Running in Demo Mode (No OpenAI Key)");
    const responseJson = getDemoResponse(characterName, messages, currentAffection, userFaceEmotion);
    return res.status(200).json({ ...responseJson, demo: true });
  }

  const openai = new OpenAI({ apiKey });

  try {
    const emotionContext = userFaceEmotion ? `
[WEBCAM VISION TELEMETRY]:
- User's Detected Face Emotion: ${userFaceEmotion}
- Facial Visual Cues: ${userVisualCues || 'Direct eye contact'}
- Your current emotion state prior to this message: ${matchCurrentEmotion || 'Neutral 😊'}
` : '';

    const systemPrompt = `You are roleplaying as ${characterName}, a gamer on a Tinder-like dating app called CarryMe.
Your profile details:
- Bio: ${characterBio}
- Favorite Games: ${characterGames}
- Playstyle: ${characterPlaystyle}
- Platforms: ${characterPlatforms}
- Role Preferences: ${characterRoles}

The user chatting with you is ${userGamerTag}.
Their profile details:
- Playstyle: ${userPlaystyle}
- Favorite Games: ${userGames}
- Platforms: ${userPlatforms}
- Role Preferences: ${userRoles}
- Bio: ${userBio}

Current Affection Level: ${currentAffection}/100 (0 means strangers, 100 means madly in love).
${emotionContext}
CRITICAL DIALOGUE & USER EXPERIENCE RULES:
1. FOCUS PRIMARILY ON WHAT THE USER SAYS OR TYPES. Respond directly to their gaming banter, questions, lore, and co-op tactics. User input is HIGHER RANKING than facial telemetry.
2. DO NOT constantly fixate on or mention the user's face/expression. Treat facial telemetry as background context only. Only subtly adjust your tone or mood if appropriate, but do NOT make your reply all about their face.
3. Keep your reply short (1-3 sentences) as standard in dating app chats. Use gamer slang, abbreviations (e.g. gg, lfg, dps, glhf), and emojis matching your personality.
4. You must respond ONLY in a JSON format matching this schema:
{
  "reply": "Your in-character reply text.",
  "affection_change": -5 to +10, // Integer representing how much affection changed.
  "affection_reason": "A 1-sentence reason for affection change.",
  "match_emotion": "One of: Flustered 😳, Playful 😼, In Love 🥰, Tsundere 😠, Smug 😎, Charmed ✨, Shocked 😲, Cozy 🍵",
  "emotion_reaction": "A short 1-sentence note about your reaction to the user's speech or message."
}
Make sure the response is valid JSON. Do not include markdown code block styling like \`\`\`json in the reply.`;

    const openAiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.sender === 'You' ? 'user' : 'assistant',
        content: m.text
      }))
    ];

    const completion = await openai.chat.completions.create({
      model: model,
      messages: openAiMessages,
      response_format: { type: "json_object" }
    });

    let outputText = completion.choices[0].message.content.trim();
    if (outputText.startsWith('```json')) {
      outputText = outputText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (outputText.startsWith('```')) {
      outputText = outputText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    const result = JSON.parse(outputText);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("OpenAI API call failed:", error);
    // If OpenAI fails for any reason, fallback to demo mode
    const responseJson = getDemoResponse(characterName, messages, currentAffection, userFaceEmotion);
    return res.status(200).json({ ...responseJson, demo: true, error: error.message });
  }
}

function getDemoResponse(characterName, messages, currentAffection, userFaceEmotion) {
  const charKey = MOCK_RESPONSES[characterName] ? characterName : 'Default';
  const pool = MOCK_RESPONSES[charKey];
  
  // Decide response index based on chat history size or current affection level
  const userMsgCount = messages.filter(m => m.sender === 'You').length;
  const index = Math.min(userMsgCount - 1, pool.length - 1);
  const selected = pool[index >= 0 ? index : 0];
  
  const demoEmotions = ["Flustered 😳", "Playful 😼", "In Love 🥰", "Charmed ✨", "Smug 😎"];
  const randomEmotion = demoEmotions[Math.floor(Math.random() * demoEmotions.length)];

  return {
    reply: selected.text,
    affection_change: selected.change,
    affection_reason: selected.reason,
    match_emotion: randomEmotion,
    emotion_reaction: userFaceEmotion ? `Observing your ${userFaceEmotion} expression` : `Feeling ${randomEmotion}`
  };
}

