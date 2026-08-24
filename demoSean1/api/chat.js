import { OpenAI } from 'openai';

// Fallback mock responses when OpenAI API Key is missing or fails
const MOCK_RESPONSES = {
  Aura_Jett: [
    { text: "if you don't buy me vandal round 2 i'm literally throwing. What rank are you anyway?", change: 5, reason: "Liked that you dared to chat." },
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
  EldenSlayer: [
    { text: "Have you beaten Malenia solo? No spirit ashes, no summons. That's the real test of a warrior.", change: 5, reason: "Testing your gaming grit." },
    { text: "Ah, a fellow Tarnished of culture! Your build sounds interesting. Let's discuss lore.", change: 15, reason: "Approved of your RPG build knowledge." },
    { text: "You dodged that topic like a pro. Fine, I will carry you through the DLC if we duo.", change: 15, reason: "Enjoys your attitude." },
    { text: "Together, we shall devour the very gods! You have proven your worth. Let's form a guild.", change: 25, reason: "Declared you a worthy partner." }
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
    currentAffection
  } = req.body;

  if (!characterName || !messages || !messages.length) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-5.4-nano-2026-03-17';

  // Check if API key is configured. If not, run in DEMO Mode.
  if (!apiKey || apiKey.startsWith('your-')) {
    console.log("CarryMe API Running in Demo Mode (No OpenAI Key)");
    const responseJson = getDemoResponse(characterName, messages, currentAffection);
    return res.status(200).json({ ...responseJson, demo: true });
  }

  const openai = new OpenAI({ apiKey });

  try {
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

Your goal:
1. Respond to the user's message in character. Keep the message short (1-3 sentences) as standard in dating app chats. Use gamer slang, abbreviations (e.g. gg, lfg, dps, glhf), and emojis matching your personality.
2. As the user chats with you, especially if they talk about gaming, tease you, flirt, or talk about shared gaming platforms or roles, you should progressively warm up to them and fall in love with them. Express this growth in your replies.
3. You must respond ONLY in a JSON format matching this schema:
{
  "reply": "Your in-character reply text.",
  "affection_change": -5 to +10, // Integer representing how much the affection changed based on the user's message. Reward compatibility, flirting, or gaming jokes.
  "affection_reason": "A 1-sentence reason for the change in affection (e.g. 'Loved that they play Overwatch too', 'Got defensive when they insulted my main')."
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

    const outputText = completion.choices[0].message.content.trim();
    const result = JSON.parse(outputText);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("OpenAI API call failed:", error);
    // If OpenAI fails for any reason, fallback to demo mode
    const responseJson = getDemoResponse(characterName, messages, currentAffection);
    return res.status(200).json({ ...responseJson, demo: true, error: error.message });
  }
}

function getDemoResponse(characterName, messages, currentAffection) {
  const charKey = MOCK_RESPONSES[characterName] ? characterName : 'Default';
  const pool = MOCK_RESPONSES[charKey];
  
  // Decide response index based on chat history size or current affection level
  const userMsgCount = messages.filter(m => m.sender === 'You').length;
  const index = Math.min(userMsgCount - 1, pool.length - 1);
  const selected = pool[index >= 0 ? index : 0];
  
  return {
    reply: `[Demo Mode] ${selected.text}`,
    affection_change: selected.change,
    affection_reason: selected.reason
  };
}
