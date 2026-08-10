// KimberlAI - Interactive Silly Website Engine

document.addEventListener('DOMContentLoaded', () => {
  initFloatingBackground();
  initMouseTrail();
  initClickSparkles();
  initAnnotatorGame();
  initBubblegumCompiler();
  initAnnotatorMode();
  initChatbot();
});

/* 1. Floating Background Elements */
function initFloatingBackground() {
  const container = document.querySelector('.floating-bg');
  if (!container) return;

  const elements = [
    '💖', '✨', '🎀', '🐱', '🐰', '🧋', '🧠', 
    '{}', '</>', 'data', 'let', 'const', 'AI', '1010', 'ML'
  ];

  const totalElements = 25;
  for (let i = 0; i < totalElements; i++) {
    const el = document.createElement('div');
    el.className = 'floating-shape';
    el.textContent = elements[Math.floor(Math.random() * elements.length)];
    
    // Randomize styling
    el.style.left = `${Math.random() * 100}%`;
    el.style.top = `${Math.random() * 100}%`;
    el.style.fontSize = `${Math.random() * 1.5 + 1}rem`;
    
    // Animation properties
    const duration = Math.random() * 12 + 8; // 8s to 20s
    const delay = Math.random() * -10;
    el.style.animation = `floatUpDown ${duration}s ease-in-out infinite`;
    el.style.animationDelay = `${delay}s`;
    
    container.appendChild(el);
  }
}

/* 2. Custom Sparkly Mouse Trail */
function initMouseTrail() {
  let lastMove = 0;
  window.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastMove < 30) return; // limit spawning rate
    lastMove = now;

    const dot = document.createElement('div');
    dot.className = 'trail-dot';
    dot.style.left = `${e.clientX}px`;
    dot.style.top = `${e.clientY}px`;
    
    // random pink/purple hue
    const colors = ['#ff69b4', '#ff1493', '#da70d6', '#ffb7c5', '#fff0f5'];
    dot.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    document.body.appendChild(dot);
    
    // Remove element after animation
    setTimeout(() => {
      dot.remove();
    }, 500);
  });
}

/* 3. Click Sparkles Effect & Pop Sound Synth */
function playPopSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch (e) {
    // blocked by browser audio policy or not supported
  }
}

function initClickSparkles() {
  const sparkles = ['✨', '💖', '⭐', '🌸', '💫'];
  
  window.addEventListener('click', (e) => {
    // Play POP sound if clicked on interactive elements
    const target = e.target;
    if (target.closest('button, a, input, select, textarea, .slider, .game-btn, .suggestion-btn, #bot-avatar, .logo')) {
      playPopSound();
    }

    // Spawn 5 sparkles
    for (let i = 0; i < 5; i++) {
      const p = document.createElement('div');
      p.className = 'sparkle-particle';
      p.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
      p.style.left = `${e.pageX}px`;
      p.style.top = `${e.pageY}px`;
      
      // Random direction
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 50 + 20;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      
      p.style.setProperty('--tx', `${tx}px`);
      p.style.setProperty('--ty', `${ty}px`);
      
      // Inject inline animation custom offsets
      p.animate([
        { transform: 'translate(-50%, -50%) scale(0.5) rotate(0deg)', opacity: 1 },
        { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(1.3) rotate(${Math.random() * 360}deg)`, opacity: 0 }
      ], {
        duration: 800,
        easing: 'ease-out',
        fill: 'forwards'
      });
      
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 800);
    }
  });
}

/* 4. Annotator Game: Annotate-O-Matic 3000 */
const GAME_ROUNDS = [
  {
    image: 'assets/cute_computer_cat.png',
    svgFallback: `<svg viewBox="0 0 100 100" width="150" height="150"><rect x="25" y="30" width="50" height="40" rx="15" fill="%23ff69b4"/><circle cx="40" cy="50" r="5" fill="black"/><circle cx="60" cy="50" r="5" fill="black"/><polygon points="48,55 52,55 50,58" fill="red"/><path d="M 28 30 L 20 15 L 38 25 M 72 30 L 80 15 L 62 25" stroke="%23ff69b4" stroke-width="4" fill="none"/><rect x="15" y="75" width="70" height="8" rx="4" fill="%23da70d6"/></svg>`,
    prompt: 'Locate and label the "Cyber Cat Coder" (🐱)',
    correctTag: 'Cat Coder 🐱',
    options: ['Boba Robot 🧋', 'Cat Coder 🐱', 'Binary Bunny 🐰', 'Matrix Cube 🔮'],
    bbox: { top: '15%', left: '20%', width: '60%', height: '70%' },
    successMsg: 'Purr-fect! The cat is now optimized to write bugs in 9 different programming languages! 🐾'
  },
  {
    image: 'assets/cute_boba_tea.png',
    svgFallback: `<svg viewBox="0 0 100 100" width="150" height="150"><path d="M 35 30 L 40 80 A 10 10 0 0 0 60 80 L 65 30 Z" fill="%23da70d6"/><rect x="30" y="25" width="40" height="10" rx="5" fill="%23ff69b4"/><line x1="50" y1="15" x2="60" y2="45" stroke="%23ff1493" stroke-width="6"/><circle cx="45" cy="50" r="4" fill="black"/><circle cx="55" cy="50" r="4" fill="black"/><circle cx="43" cy="70" r="5" fill="%230d020e"/><circle cx="57" cy="68" r="5" fill="%230d020e"/><circle cx="50" cy="75" r="5" fill="%230d020e"/></svg>`,
    prompt: 'Identify the high-performance AI fuel "Boba Fuel Core" (🧋)',
    correctTag: 'Boba Fuel Core 🧋',
    options: ['Silly Semicolon 💬', 'Boba Fuel Core 🧋', 'AI Brain Wave 🧠', 'Waffle Generator 🧇'],
    bbox: { top: '25%', left: '30%', width: '40%', height: '65%' },
    successMsg: 'Delicious! The AI\'s processing speed has tripled thanks to the tapioca energy! ⚡🧋'
  },
  {
    image: 'assets/cute_ai_robot.png',
    svgFallback: `<svg viewBox="0 0 100 100" width="150" height="150"><rect x="30" y="35" width="40" height="40" rx="10" fill="%23ff1493"/><circle cx="40" cy="50" r="6" fill="%2339ff14"/><circle cx="60" cy="50" r="6" fill="%2339ff14"/><rect x="45" y="62" width="10" height="4" rx="2" fill="white"/><path d="M 40 20 L 40 35 M 60 20 L 60 35" stroke="%23ff1493" stroke-width="4"/><circle cx="40" cy="18" r="4" fill="%23ffb7c5"/><circle cx="60" cy="18" r="4" fill="%23ffb7c5"/></svg>`,
    prompt: 'Find the "AI Bunny Bot Instance" (🐰)',
    correctTag: 'Binary Bunny 🐰',
    options: ['Hard Drive 💾', 'Cookie Clicker 🍪', 'Binary Bunny 🐰', 'Spaghetti Code 🍝'],
    bbox: { top: '10%', left: '25%', width: '50%', height: '80%' },
    successMsg: 'Bunny hops detected! AI training loss has decreased by 99% because of extreme cuteness! 🐰✨'
  },
  {
    image: 'assets/cute_sparkly_code.png',
    svgFallback: `<svg viewBox="0 0 100 100" width="150" height="150"><rect x="20" y="20" width="60" height="60" rx="12" fill="%23ffb7c5" opacity="0.3" stroke="%23ff69b4" stroke-width="3"/><text x="25" y="45" font-family="monospace" font-size="12" fill="%23ff1493" font-weight="bold">&lt;love/&gt;</text><text x="35" y="65" font-family="monospace" font-size="12" fill="%23da70d6" font-weight="bold">const sparkles</text><polygon points="75,25 80,35 90,35 82,42 85,52 75,45 65,52 68,42 60,35 70,35" fill="yellow"/></svg>`,
    prompt: 'Tag the "Sparkly Matrix Core" (🔮)',
    correctTag: 'Matrix Cube 🔮',
    options: ['Matrix Cube 🔮', 'Boba Fuel Core 🧋', 'Cat Coder 🐱', 'Binary Bunny 🐰'],
    bbox: { top: '20%', left: '20%', width: '60%', height: '60%' },
    successMsg: 'Incredible! You annotated the magical data core. KimberlAI is now fully conscious and requests boba! 💖'
  }
];

function spawnConfettiBurst(x, y) {
  const particles = ['✨', '💖', '⭐', '🌸', '💫', '🍬', '🐰', '🧋'];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'sparkle-particle';
    p.textContent = particles[Math.floor(Math.random() * particles.length)];
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.fontSize = `${Math.random() * 1.5 + 1}rem`;
    
    // Random direction
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 120 + 40;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    
    p.animate([
      { transform: 'translate(-50%, -50%) scale(0.3) rotate(0deg)', opacity: 1 },
      { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(1.5) rotate(${Math.random() * 360}deg)`, opacity: 0 }
    ], {
      duration: Math.random() * 1000 + 600,
      easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)',
      fill: 'forwards'
    });
    
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1600);
  }
}

function initAnnotatorGame() {
  let score = 0;
  let currentRoundIdx = 0;
  
  const promptEl = document.getElementById('game-prompt');
  const screenEl = document.getElementById('game-screen');
  const buttonsContainer = document.getElementById('game-buttons');
  const scoreEl = document.getElementById('game-score');
  
  if (!promptEl || !screenEl || !buttonsContainer) return;

  function loadRound() {
    // Clear previous elements
    screenEl.innerHTML = '';
    buttonsContainer.innerHTML = '';
    
    const round = GAME_ROUNDS[currentRoundIdx % GAME_ROUNDS.length];
    promptEl.textContent = round.prompt;
    
    // Create image wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'game-image-wrapper';
    
    // Create image
    const img = document.createElement('img');
    img.src = round.image;
    img.alt = 'Annotate Target';
    img.className = 'game-target-img';
    
    // Fallback if image doesn't exist yet
    img.onerror = () => {
      // replace with inline SVG fallback
      const svgContainer = document.createElement('div');
      svgContainer.innerHTML = round.svgFallback.replaceAll('%23', '#');
      wrapper.innerHTML = '';
      wrapper.appendChild(svgContainer);
    };
    
    wrapper.appendChild(img);
    screenEl.appendChild(wrapper);
    
    // Render options buttons
    round.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'game-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => handleGuess(opt, round, wrapper));
      buttonsContainer.appendChild(btn);
    });
  }

  function handleGuess(guess, round, wrapper) {
    if (guess === round.correctTag) {
      // SUCCESS!
      score += 100;
      scoreEl.textContent = score;
      
      // Draw dynamic bounding box
      const bboxEl = document.createElement('div');
      bboxEl.className = 'dynamic-bbox';
      bboxEl.style.top = round.bbox.top;
      bboxEl.style.left = round.bbox.left;
      bboxEl.style.width = round.bbox.width;
      bboxEl.style.height = round.bbox.height;
      bboxEl.setAttribute('data-label', `${round.correctTag} [Conf: 99.99%]`);
      
      wrapper.appendChild(bboxEl);

      // Trigger confetti from the middle of the game screen
      const rect = wrapper.getBoundingClientRect();
      const burstX = window.scrollX + rect.left + rect.width / 2;
      const burstY = window.scrollY + rect.top + rect.height / 2;
      spawnConfettiBurst(burstX, burstY);
      
      // Disable buttons
      const buttons = buttonsContainer.querySelectorAll('button');
      buttons.forEach(b => b.disabled = true);
      
      // Show success text
      promptEl.innerHTML = `<span style="color: #39ff14;">✨ ${round.successMsg}</span>`;
      
      // Go to next round after 3 seconds
      setTimeout(() => {
        currentRoundIdx++;
        loadRound();
      }, 3000);
    } else {
      // FAIL
      promptEl.innerHTML = `<span style="color: #ff1493;">❌ Wrong annotation! The AI is getting grumpy. Try again!</span>`;
      
      // Shake screen
      screenEl.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(0)' }
      ], { duration: 300 });
    }
  }

  loadRound();
}

/* 5. Bubblegum Compiler */
const FUN_COMMENTS = [
  '// 🎀 AI is eating this data, nom nom 🎀',
  '// ✨ Adding sparkly dust to make it run faster ✨',
  '// 🐰 Powered by hop-optimization protocols 🐰',
  '// 💅 Beautiful code for beautiful neural networks',
  '// 💕 Semicolons are just winking faces ;)',
  '// 🧋 Boba break here, do not delete!'
];

const MAGICAL_WORDS = {
  'function': '💖✨ magicRecipe ✨💖',
  'let': 'sparklyCandy',
  'const': 'immutableDiamond 💎',
  'var': 'mysticalMist',
  'console.log': 'giggles.spread 🗣️',
  'return': 'deliverLove 💝',
  'true': 'abso-freakin-lutely ✨',
  'false': 'no-way-bestie 💔',
  'for': 'spinAroundAndRound 🎠',
  'while': 'keepDancing 💃',
  'if': 'maybeCutie 💅',
  'else': 'otherwiseSilly 🦄',
  'null': 'emptyPocket 🕳️',
  'undefined': 'lostInSpace 🪐',
  'class': 'pinkBlueprint 🏰',
  'import': 'inviteFriend 💌'
};

function initBubblegumCompiler() {
  const compileBtn = document.getElementById('compile-btn');
  const inputEl = document.getElementById('compiler-input');
  const outputEl = document.getElementById('compiler-output');
  
  if (!compileBtn || !inputEl || !outputEl) return;
  
  compileBtn.addEventListener('click', () => {
    const rawCode = inputEl.value;
    if (!rawCode.trim()) {
      outputEl.textContent = '🎀 Please feed some code to the Bubblegum Compiler! 🎀';
      return;
    }
    
    outputEl.textContent = '✨ Sparkle-compiling... ✨';
    outputEl.classList.add('sparkling');
    
    setTimeout(() => {
      let compiled = rawCode;
      
      // Inject cute comments randomly
      const lines = compiled.split('\n');
      const linesWithComments = lines.map(line => {
        if (line.trim().length > 5 && Math.random() > 0.6) {
          const comment = FUN_COMMENTS[Math.floor(Math.random() * FUN_COMMENTS.length)];
          const indent = line.match(/^\s*/)[0];
          return `${indent}${comment}\n${line}`;
        }
        return line;
      });
      compiled = linesWithComments.join('\n');
      
      // Replace keywords
      for (const [key, replacement] of Object.entries(MAGICAL_WORDS)) {
        // use regex to replace matching words, avoiding sub-word matches (using word boundary)
        // handle symbols like console.log manually or via regex
        const safeKey = key.replace('.', '\\.');
        const regex = new RegExp(`\\b${safeKey}\\b`, 'g');
        compiled = compiled.replace(regex, replacement);
      }
      
      // Wrap the whole output in code borders
      outputEl.textContent = `🎀 BUBBLEGUM COMPILATION COMPLETE 🎀\n\n${compiled}\n\n// 💖 Made with love by KimberlAI Compiler v3.5-sparkles`;
      outputEl.classList.remove('sparkling');
      
      // Play a glitter glow animation on the box
      outputEl.parentElement.animate([
        { boxShadow: '0 0 10px rgba(255, 20, 147, 0.2)' },
        { boxShadow: '0 0 30px rgba(255, 20, 147, 0.8)' },
        { boxShadow: '0 0 10px rgba(255, 20, 147, 0.2)' }
      ], { duration: 1000 });
      
    }, 1000);
  });
}

/* 6. Bounding Box Annotation Mode for Website */
function initAnnotatorMode() {
  const toggle = document.getElementById('annotate-mode-checkbox');
  if (!toggle) return;
  
  toggle.addEventListener('change', () => {
    if (toggle.checked) {
      document.body.classList.add('annotated-mode');
    } else {
      document.body.classList.remove('annotated-mode');
    }
  });
}

/* 7. Sparkly Chatbot: KimberlAI Bot */
const CHATBOT_JOKES = [
  "Why did the machine learning model break up with the compiler? It felt their relationshp was overfitting! 💔",
  "How many data annotators does it take to change a lightbulb? 100. One to screw it in, and 99 to agree on the label: 'glowing_orb'! 💡",
  "Why did the computer cat refuse to train the model? It saw too many mice, but none of them were real! 🐱🖱️",
  "What is an AI's favorite dance move? The Algorithm! It's super steps-oriented. 💃",
  "Why was the neural network so popular at the disco? Because it had multiple layers of cool! 🕺✨",
  "Why are coding errors like cats? Because they hide in corners and only show up when you are trying to relax! 🐈"
];

const BOT_RESPONSES = {
  data: "Data Annotation is like sorting pink bubblegum from blue boba pearls so that the baby AI monster eats only the yummy stuff! 🍬",
  code: "Coding is writing magical spellbooks in Python, Javascript, or HTML. Semicolons are like little winks to the parser! 😉✨",
  ai: "Artificial Intelligence is our sparkly bunny-eared robot friend that learns everything we teach it. Feed it cute datasets! 🐰💖",
  joke: () => CHATBOT_JOKES[Math.floor(Math.random() * CHATBOT_JOKES.length)],
  default: "Ooh! Sparkles detected! Keep coding and annotating to achieve 100% maximum cuteness! 🌸✨"
};

function initChatbot() {
  const widget = document.getElementById('bot-widget');
  const avatar = document.getElementById('bot-avatar');
  const chatWin = document.getElementById('chat-window');
  const closeBtn = document.getElementById('chat-close');
  const msgContainer = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  const suggestions = document.querySelectorAll('.suggestion-btn');
  
  if (!widget || !avatar || !chatWin || !closeBtn || !msgContainer || !chatInput || !chatSend) return;
  
  // Periodically wiggle bunny ears
  setInterval(() => {
    avatar.animate([
      { transform: 'scale(1) rotate(0)' },
      { transform: 'scale(1.1) rotate(-8deg)', offset: 0.2 },
      { transform: 'scale(1.1) rotate(8deg)', offset: 0.4 },
      { transform: 'scale(1.1) rotate(-8deg)', offset: 0.6 },
      { transform: 'scale(1.15) rotate(0)', offset: 0.8 },
      { transform: 'scale(1) rotate(0)' }
    ], { duration: 800, easing: 'ease-in-out' });
  }, 4000);
  
  // Toggle open
  avatar.addEventListener('click', () => {
    chatWin.classList.add('open');
  });
  
  // Close
  closeBtn.addEventListener('click', () => {
    chatWin.classList.remove('open');
  });
  
  // Suggestion buttons
  suggestions.forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.textContent;
      sendUserMessage(text);
    });
  });
  
  // Send button
  chatSend.addEventListener('click', () => {
    const text = chatInput.value.trim();
    if (text) {
      sendUserMessage(text);
      chatInput.value = '';
    }
  });
  
  // Input enter key
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const text = chatInput.value.trim();
      if (text) {
        sendUserMessage(text);
        chatInput.value = '';
      }
    }
  });
  
  function sendUserMessage(text) {
    appendMsg(text, 'user');
    
    // bot response delay
    setTimeout(() => {
      const query = text.toLowerCase();
      let reply = BOT_RESPONSES.default;
      
      if (query.includes('joke')) {
        reply = BOT_RESPONSES.joke();
      } else if (query.includes('data') || query.includes('label') || query.includes('annotate')) {
        reply = BOT_RESPONSES.data;
      } else if (query.includes('code') || query.includes('coding') || query.includes('programmer')) {
        reply = BOT_RESPONSES.code;
      } else if (query.includes('ai') || query.includes('neural') || query.includes('intelligence') || query.includes('robot')) {
        reply = BOT_RESPONSES.ai;
      }
      
      appendMsg(reply, 'bot');
    }, 800);
  }
  
  function appendMsg(text, sender) {
    const msg = document.createElement('div');
    msg.className = `msg msg-${sender}`;
    msg.textContent = text;
    msgContainer.appendChild(msg);
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }
}
