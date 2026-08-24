import { getUserProfile, showNotification } from './profile-settings.js';
import { synth } from './swipe.js';
import { CameraEmotionScanner } from './cam-emotion.js';
import { VoiceTalkEngine } from './voice-engine.js';

let activeMatchId = null;
const camScanner = new CameraEmotionScanner();
const voiceEngine = new VoiceTalkEngine();
let lastAiReplyText = "";
let isVisionModalOpen = false;

// Initialize the matches and chat systems
export function initChatSystem() {
  renderMatchesList();

  // Custom event listeners
  window.addEventListener('carrymeMatchesUpdated', () => {
    renderMatchesList();
  });

  // Chat send button handlers
  const sendBtn = document.getElementById('chat-send-btn');
  const inputField = document.getElementById('chat-input-field');

  if (sendBtn && inputField) {
    const handleSend = () => {
      const text = inputField.value.trim();
      if (!text || !activeMatchId) return;
      
      sendMessage(text);
      inputField.value = '';
    };

    sendBtn.addEventListener('click', handleSend);
    inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleSend();
      }
    });
  }

  // Mic Talk Button in Chat Comms Input
  const micBtn = document.getElementById('chat-mic-btn');
  if (micBtn) {
    micBtn.addEventListener('click', () => {
      synth.playClick();
      if (voiceEngine.isListening) {
        voiceEngine.stopListening();
        micBtn.classList.remove('mic-active');
        micBtn.innerHTML = `<i data-lucide="mic" style="width:16px;height:16px;"></i> Talk`;
        if (window.refreshIcons) window.refreshIcons();
      } else {
        micBtn.classList.add('mic-active');
        micBtn.innerHTML = `<i data-lucide="mic-off" style="width:16px;height:16px;"></i> Listening...`;
        if (window.refreshIcons) window.refreshIcons();

        voiceEngine.startListening(
          (transcript, isFinal) => {
            if (inputField) inputField.value = transcript;
            if (isFinal) {
              micBtn.classList.remove('mic-active');
              micBtn.innerHTML = `<i data-lucide="mic" style="width:16px;height:16px;"></i> Talk`;
              if (window.refreshIcons) window.refreshIcons();
              sendMessage(transcript);
              if (inputField) inputField.value = '';
            }
          },
          (err) => {
            micBtn.classList.remove('mic-active');
            micBtn.innerHTML = `<i data-lucide="mic" style="width:16px;height:16px;"></i> Talk`;
            if (window.refreshIcons) window.refreshIcons();
            if (err && err.message !== 'STT Not Supported') {
              showNotification("Voice listening ended or mic permission blocked", 'warning');
            }
          }
        );
      }
    });
  }

  // Setup quick dialog buttons click delegates
  const quickRepliesContainer = document.getElementById('quick-replies');
  if (quickRepliesContainer) {
    quickRepliesContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.quick-reply-btn');
      if (btn && activeMatchId) {
        const text = btn.getAttribute('data-text');
        sendMessage(text);
      }
    });
  }

  // Setup Vision & Voice Date Modal Handlers
  initVisionDateModalHandlers();
}

// Retrieve matches list from localStorage
export function getMatches() {
  const saved = localStorage.getItem('carryme_matches');
  return saved ? JSON.parse(saved) : [];
}

// Save matches list to localStorage
export function saveMatches(matches) {
  localStorage.setItem('carryme_matches', JSON.stringify(matches));
  window.dispatchEvent(new Event('carrymeMatchesUpdated'));
}

// Adds a new match to the matched pool
export function addMatch(profile, compatibility) {
  const matches = getMatches();
  if (matches.some(m => m.id === profile.id)) return;

  const newMatch = {
    ...profile,
    compatibility,
    affection: 10, // Starts at 10%
    affectionReason: "First connection made!",
    currentEmotion: "Neutral 😊",
    emotionReaction: "Waiting for your first transmission",
    matchedAt: new Date().toISOString()
  };

  matches.unshift(newMatch);
  saveMatches(matches);

  // Trigger Match Modal
  showMatchModal(newMatch);
}

// Get affection level text and icon
function getLoveStatus(affection) {
  if (affection < 20) return { title: "Stranger 🤍", desc: "Just matched! Ready to queue." };
  if (affection < 40) return { title: "Co-op Partner 💛", desc: "Exchanging tactics and ideas." };
  if (affection < 60) return { title: "Party Synergy 🧡", desc: "Chemistry is building up!" };
  if (affection < 80) return { title: "Duo Crush ❤️", desc: "Definitely catching gaming feelings!" };
  return { title: "Duo Committed 💖", desc: "Soulmates in co-op and life." };
}

// Render the sidebar listing matches
export function renderMatchesList() {
  const matchesContainer = document.getElementById('matches-sidebar-list');
  if (!matchesContainer) return;

  const matches = getMatches();
  matchesContainer.innerHTML = '';

  if (matches.length === 0) {
    matchesContainer.innerHTML = `
      <div class="empty-sidebar-placeholder">
        <i data-lucide="heart" style="width:24px;height:24px;margin-bottom:0.5rem;color:var(--text-muted);"></i>
        <p>No active matches yet. Keep swiping right to match!</p>
      </div>
    `;
    if (window.refreshIcons) window.refreshIcons();
    
    // Clear chat screen since there are no active matches
    clearChatScreen();
    return;
  }

  matches.forEach(match => {
    const isSelected = match.id === activeMatchId;
    const love = getLoveStatus(match.affection);
    const item = document.createElement('div');
    item.className = `match-sidebar-item ${isSelected ? 'active' : ''}`;
    
    item.innerHTML = `
      <div class="match-avatar" style="border-color:${match.color}; text-shadow: 0 0 5px ${match.color};">
        ${match.avatar}
      </div>
      <div class="match-meta">
        <div class="match-name-row">
          <span class="match-tagname">${match.tag}</span>
          <span class="match-love-badge">${love.title.split(' ')[1]} ${match.affection}%</span>
        </div>
        <div class="match-last-msg">${match.currentEmotion ? `[Mood: ${match.currentEmotion}] ` : ''}${match.affectionReason || "Click to open chat"}</div>
      </div>
    `;

    item.addEventListener('click', () => {
      synth.playClick();
      selectMatchChat(match.id);
    });

    matchesContainer.appendChild(item);
  });

  // Select the first match if none is active
  if (!activeMatchId && matches.length > 0) {
    selectMatchChat(matches[0].id);
  }
}

// Clear the chat display when there are no matches
function clearChatScreen() {
  const chatHeader = document.getElementById('active-chat-header');
  const chatMessages = document.getElementById('chat-messages-container');
  const chatInputArea = document.getElementById('chat-input-area');

  if (chatHeader) chatHeader.innerHTML = `<h3>CARRYME COMMS TERMINAL</h3>`;
  if (chatMessages) chatMessages.innerHTML = `
    <div class="empty-chat-placeholder">
      <i data-lucide="message-square" style="width:36px;height:36px;color:var(--text-muted);margin-bottom:1rem;"></i>
      <p>Select a matched gamer to initiate private chat channel</p>
    </div>
  `;
  if (chatInputArea) chatInputArea.style.opacity = '0.5';
  if (window.refreshIcons) window.refreshIcons();
}

// Select a match to open their chat
export function selectMatchChat(matchId) {
  activeMatchId = matchId;
  
  // Highlight active item in sidebar
  const matches = getMatches();
  const match = matches.find(m => m.id === matchId);
  if (!match) return;

  // Re-render sidebar items to update highlight
  renderMatchesList();

  // Render header with Vision Date Mode button & Emotion Badge
  const chatHeader = document.getElementById('active-chat-header');
  if (chatHeader) {
    const love = getLoveStatus(match.affection);
    const emotionBadge = match.currentEmotion || "Neutral 😊";
    chatHeader.innerHTML = `
      <div class="chat-header-wrap">
        <div class="chat-header-profile">
          <span class="header-avatar">${match.avatar}</span>
          <div>
            <h3>${match.tag} <span class="header-emotion-pill" id="header-emotion-pill">${emotionBadge}</span></h3>
            <span class="header-status">${love.title} - ${love.desc}</span>
          </div>
        </div>
        
        <div class="header-actions-wrap">
          <button class="btn btn-secondary btn-sm" id="header-open-vision-btn" title="Open AI Vision & Voice Date Lab">
            <i data-lucide="video" style="width:14px;height:14px;color:var(--accent);"></i>
            Vision Date Mode
          </button>
          
          <div class="header-affection-container">
            <div class="header-affection-meta">
              <span class="affection-lbl"><i data-lucide="heart" class="heart-pulse-icon" style="width:12px;height:12px;fill:red;color:red;"></i> Affection</span>
              <span class="affection-pct">${match.affection}%</span>
            </div>
            <div class="affection-progress-bar">
              <div class="affection-fill" style="width: ${match.affection}%; background: linear-gradient(90deg, ${match.color} 0%, var(--accent) 100%);"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const openVisionBtn = chatHeader.querySelector('#header-open-vision-btn');
    if (openVisionBtn) {
      openVisionBtn.addEventListener('click', () => {
        synth.playClick();
        openVisionDateModal(match);
      });
    }
  }

  // Load chat logs from localStorage
  renderChatMessages(matchId);

  // Enable input area
  const chatInputArea = document.getElementById('chat-input-area');
  if (chatInputArea) chatInputArea.style.opacity = '1';

  // Render quick replies suggestions
  renderQuickReplies(match);

  if (window.refreshIcons) window.refreshIcons();
}

// Generate quick dialogue options based on match personality
function renderQuickReplies(match) {
  const container = document.getElementById('quick-replies');
  if (!container) return;

  container.innerHTML = '';

  const options = [
    { text: `Hey ${match.tag}! Ready to duo run some matches? 🎮`, label: "Duo Request" },
    { text: `What gaming platforms are you active on? I prefer console/PC.`, label: "Platforms Query" },
    { text: `I read your bio and loved your gaming style! Let's chat.`, label: "Flirt" },
    { text: `What is your favorite meta build right now?`, label: "Theorycraft" }
  ];

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quick-reply-btn';
    btn.setAttribute('data-text', opt.text);
    btn.innerHTML = `
      <span class="btn-tag">${opt.label}</span>
      <span class="btn-text">${opt.text}</span>
    `;
    container.appendChild(btn);
  });
}

// Retrieve chat logs from localStorage
function getChatHistory(matchId) {
  const saved = localStorage.getItem(`carryme_chat_${matchId}`);
  return saved ? JSON.parse(saved) : [];
}

// Save chat logs to localStorage
function saveChatHistory(matchId, history) {
  localStorage.setItem(`carryme_chat_${matchId}`, JSON.stringify(history));
}

// Render the messages of selected chat
function renderChatMessages(matchId) {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  container.innerHTML = '';
  const history = getChatHistory(matchId);

  if (history.length === 0) {
    // Add default first greetings from the profile
    const matches = getMatches();
    const match = matches.find(m => m.id === matchId);
    
    if (match) {
      const firstMessage = {
        sender: match.tag,
        text: match.intro || "GG! Let's match up.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      history.push(firstMessage);
      saveChatHistory(matchId, history);
    }
  }

  history.forEach(msg => {
    const isUser = msg.sender === 'You';
    const div = document.createElement('div');
    div.className = `chat-msg ${isUser ? 'user-msg' : 'match-msg'}`;
    
    div.innerHTML = `
      <div class="chat-msg-header">
        <span class="chat-username">${msg.sender}</span>
        <span class="chat-time">${msg.timestamp}</span>
      </div>
      <div class="chat-text">${msg.text}</div>
    `;
    container.appendChild(div);
  });

  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

// Submit user message and fetch AI reply with vision emotion telemetry
async function sendMessage(text) {
  if (!activeMatchId) return;

  const history = getChatHistory(activeMatchId);
  const userProfile = getUserProfile();
  const matches = getMatches();
  const matchIndex = matches.findIndex(m => m.id === activeMatchId);
  if (matchIndex === -1) return;
  const match = matches[matchIndex];

  // Fetch current user face emotion telemetry
  const latestCamTelemetry = camScanner.getLatestEmotion();

  // Append user message
  const userMessage = {
    sender: 'You',
    text: text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  
  history.push(userMessage);
  saveChatHistory(activeMatchId, history);
  renderChatMessages(activeMatchId);

  // Show typing indicator
  showTypingIndicator(true);

  try {
    const contextMessages = history.slice(-10);

    const apiEndpoint = window.location.protocol === 'file:' 
      ? 'http://localhost:3000/api/chat' 
      : '/api/chat';

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: contextMessages,
        characterName: match.tag,
        characterBio: match.bio,
        characterGames: match.games.join(', '),
        characterPlaystyle: match.playstyle,
        characterPlatforms: match.platforms.join(', '),
        characterRoles: match.roles.join(', '),
        userGamerTag: userProfile.tag,
        userGames: userProfile.games.join(', '),
        userPlaystyle: userProfile.playstyle,
        userPlatforms: userProfile.platforms.join(', '),
        userRoles: userProfile.roles.join(', '),
        userBio: userProfile.bio,
        currentAffection: match.affection,
        userFaceEmotion: latestCamTelemetry.primary_emotion,
        userVisualCues: latestCamTelemetry.facial_cues,
        matchCurrentEmotion: match.currentEmotion || "Neutral 😊"
      })
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();
    showTypingIndicator(false);

    // Apply affection change
    const oldAffection = match.affection;
    let newAffection = oldAffection + (data.affection_change || 0);
    newAffection = Math.min(100, Math.max(0, newAffection));

    // Update match metrics & emotions
    match.affection = newAffection;
    match.affectionReason = data.affection_reason || "Chatted with Player 1";
    match.currentEmotion = data.match_emotion || "Flustered 😳";
    match.emotionReaction = data.emotion_reaction || "Enjoying your company!";
    matches[matchIndex] = match;
    saveMatches(matches);

    lastAiReplyText = data.reply;

    // Play retro sound & milestone checks
    if (newAffection > oldAffection) {
      synth.playClick();
    }
    
    const oldLevel = Math.floor(oldAffection / 20);
    const newLevel = Math.floor(newAffection / 20);
    if (newLevel > oldLevel) {
      synth.playLevelUp();
      showNotification(`Love Level Up with ${match.tag}! Unlocked: ${getLoveStatus(newAffection).title}`, 'heart');
      
      if (newAffection === 100 && oldAffection < 100) {
        synth.playMatch();
        triggerConfettiLove(match);
      }
    }

    // Append AI reply
    const replyMessage = {
      sender: match.tag,
      text: data.reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    history.push(replyMessage);
    saveChatHistory(activeMatchId, history);
    
    // Refresh active views
    selectMatchChat(activeMatchId);

    // Trigger Vision Date UI update if open
    if (isVisionModalOpen) {
      updateVisionDateUI(match);
      spawnEmotionParticles(data.match_emotion);
    }

    // Auto OpenAI Voice speaking
    const autoVoiceChk = document.getElementById('vision-auto-voice-chk');
    const shouldSpeak = isVisionModalOpen || (autoVoiceChk && autoVoiceChk.checked);

    if (shouldSpeak) {
      voiceEngine.speak(data.reply, match.tag);
    }
  } catch (error) {
    console.error("Failed to fetch response:", error);
    showTypingIndicator(false);
    
    const mockReplyText = `[Offline Mode] Sorry, lost my comms signal! (Check console log for network error: ${error.message})`;
    const replyMessage = {
      sender: match.tag,
      text: mockReplyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    history.push(replyMessage);
    saveChatHistory(activeMatchId, history);
    renderChatMessages(activeMatchId);
  }
}

// Vision & Voice Date Modal Handlers
function initVisionDateModalHandlers() {
  const modal = document.getElementById('vision-date-modal');
  const closeBtn = document.getElementById('close-vision-date-btn');
  const overlay = document.getElementById('vision-overlay-bg');
  const scanBtn = document.getElementById('vision-scan-btn');
  const talkBtn = document.getElementById('vision-voice-talk-btn');
  const replayBtn = document.getElementById('vision-replay-voice-btn');

  if (closeBtn) closeBtn.addEventListener('click', closeVisionDateModal);
  if (overlay) overlay.addEventListener('click', closeVisionDateModal);

  // Manual Face Scan Button
  if (scanBtn) {
    scanBtn.addEventListener('click', async () => {
      synth.playClick();
      scanBtn.disabled = true;
      scanBtn.innerText = "Scanning Frame...";

      const matches = getMatches();
      const match = matches.find(m => m.id === activeMatchId);
      const matchName = match ? match.tag : 'Match';

      const res = await camScanner.analyzeCurrentFrame(matchName);
      
      const userEmotionVal = document.getElementById('user-emotion-val');
      const userCuesVal = document.getElementById('user-cues-val');

      if (userEmotionVal) userEmotionVal.innerText = res.primary_emotion;
      if (userCuesVal) userCuesVal.innerText = res.facial_cues;

      scanBtn.disabled = false;
      scanBtn.innerHTML = `<i data-lucide="camera" style="width:16px;height:16px;"></i> Scan My Face Emotion`;
      if (window.refreshIcons) window.refreshIcons();

      showNotification(`Captured Face Emotion: ${res.primary_emotion}`, 'heart');
    });
  }

  // Push to Talk Button in Vision Date Modal
  if (talkBtn) {
    talkBtn.addEventListener('click', () => {
      synth.playClick();
      if (voiceEngine.isListening) {
        voiceEngine.stopListening();
        talkBtn.innerHTML = `<i data-lucide="mic" style="width:16px;height:16px;"></i> Push to Talk (Voice Date)`;
        if (window.refreshIcons) window.refreshIcons();
      } else {
        talkBtn.innerHTML = `<i data-lucide="mic-off" style="width:16px;height:16px;"></i> Listening to Voice...`;
        if (window.refreshIcons) window.refreshIcons();

        voiceEngine.startListening(
          (transcript, isFinal) => {
            if (isFinal) {
              talkBtn.innerHTML = `<i data-lucide="mic" style="width:16px;height:16px;"></i> Push to Talk (Voice Date)`;
              if (window.refreshIcons) window.refreshIcons();
              
              // Automatically scan face + send voice message!
              camScanner.analyzeCurrentFrame();
              sendMessage(transcript);
            }
          },
          (err) => {
            talkBtn.innerHTML = `<i data-lucide="mic" style="width:16px;height:16px;"></i> Push to Talk (Voice Date)`;
            if (window.refreshIcons) window.refreshIcons();
          }
        );
      }
    });
  }

  // Replay AI Voice
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      synth.playClick();
      const matches = getMatches();
      const match = matches.find(m => m.id === activeMatchId);
      if (match && lastAiReplyText) {
        voiceEngine.speak(lastAiReplyText, match.tag);
      } else {
        showNotification("No recent AI voice message to replay", 'warning');
      }
    });
  }
}

// Open Vision Date Mode Modal
export function openVisionDateModal(match) {
  const modal = document.getElementById('vision-date-modal');
  if (!modal) return;

  isVisionModalOpen = true;
  modal.style.display = 'flex';

  const videoElem = document.getElementById('vision-webcam-video');
  const canvasElem = document.getElementById('vision-webcam-canvas');
  const fallbackMsg = document.getElementById('cam-fallback-msg');
  const specCanvas = document.getElementById('voice-spectrum-canvas');

  // Start Camera Scanner
  camScanner.start(videoElem, canvasElem).then(hasWebcam => {
    if (!hasWebcam && fallbackMsg) {
      fallbackMsg.style.display = 'flex';
    }
  });

  // Bind Voice Engine visualizer canvas
  if (specCanvas) {
    voiceEngine.bindVisualizerCanvas(specCanvas);
  }

  // Subscribe to webcam emotion updates
  camScanner.onEmotionChange((emotionData) => {
    const userEmotionVal = document.getElementById('user-emotion-val');
    const userCuesVal = document.getElementById('user-cues-val');
    if (userEmotionVal) userEmotionVal.innerText = emotionData.primary_emotion;
    if (userCuesVal) userCuesVal.innerText = emotionData.facial_cues;
  });

  updateVisionDateUI(match);
}

// Close Vision Date Mode Modal
export function closeVisionDateModal() {
  const modal = document.getElementById('vision-date-modal');
  if (modal) modal.style.display = 'none';

  isVisionModalOpen = false;
  camScanner.stop();
  voiceEngine.stopSpeaking();
}

// Update Vision Date UI elements for current match
function updateVisionDateUI(match) {
  const avatarElem = document.getElementById('vision-match-avatar');
  const moodElem = document.getElementById('vision-match-mood');
  const reactionElem = document.getElementById('vision-match-reaction');
  const badgeElem = document.getElementById('match-holo-badge');

  if (avatarElem) avatarElem.innerText = match.avatar;
  if (moodElem) moodElem.innerText = match.currentEmotion || "Neutral 😊";
  if (reactionElem) reactionElem.innerText = `"${match.emotionReaction || 'Reacting to your presence'}"`;
  if (badgeElem) badgeElem.innerText = `${match.tag.toUpperCase()} HOLOGRAM`;
}

// Spawn floating particle effects on match hologram (Hearts, Sparkles, Fire)
function spawnEmotionParticles(emotionStr) {
  const container = document.getElementById('emotion-particles-layer');
  if (!container) return;

  container.innerHTML = '';

  let symbol = '💖';
  if (emotionStr.includes('Flustered') || emotionStr.includes('Love')) symbol = '💖';
  else if (emotionStr.includes('Playful') || emotionStr.includes('Smug')) symbol = '✨';
  else if (emotionStr.includes('Angry') || emotionStr.includes('Tsundere')) symbol = '💢';
  else if (emotionStr.includes('Shocked')) symbol = '⚡';

  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'emotion-particle';
    p.innerText = symbol;
    p.style.left = `${20 + Math.random() * 60}%`;
    p.style.bottom = `10%`;
    p.style.animationDelay = `${Math.random() * 0.8}s`;
    container.appendChild(p);
  }
}


function showTypingIndicator(show) {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  const existing = document.getElementById('chat-typing-indicator');
  if (existing) existing.remove();

  if (show) {
    const indicator = document.createElement('div');
    indicator.id = 'chat-typing-indicator';
    indicator.className = 'chat-msg match-msg typing-msg';
    indicator.innerHTML = `
      <div class="chat-msg-header">
        <span class="chat-username">AI typing</span>
      </div>
      <div class="typing-dots">
        <span>.</span><span>.</span><span>.</span>
      </div>
    `;
    container.appendChild(indicator);
    container.scrollTop = container.scrollHeight;
  }
}

// "It's a Match!" HUD Overlay Modal
function showMatchModal(matchProfile) {
  synth.playMatch();
  
  const modal = document.createElement('div');
  modal.className = 'hud-modal match-modal';
  modal.id = 'match-overlay-modal';
  
  modal.innerHTML = `
    <div class="match-overlay-bg"></div>
    <div class="match-modal-container">
      <div class="match-title-hologram">DUO PARTNER UNLOCKED!</div>
      <div class="match-avatars-versus">
        <div class="user-avatar-side">🎮</div>
        <div class="heart-split-icon"><i data-lucide="zap" class="match-lightning"></i></div>
        <div class="match-avatar-side" style="border-color:${matchProfile.color};">${matchProfile.avatar}</div>
      </div>
      <h2>YOU MATCHED WITH ${matchProfile.tag}!</h2>
      <p>Your platform settings and games match ${matchProfile.tag}'s profile. Start chat transmission now!</p>
      
      <div class="match-modal-actions">
        <button class="btn btn-primary" id="modal-chat-now-btn">
          <i data-lucide="message-square" style="width:18px;height:18px;"></i>
          Initiate Private Comms
        </button>
        <button class="btn btn-secondary" id="modal-keep-swiping-btn">
          Keep Searching Queue
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  if (window.refreshIcons) window.refreshIcons();

  const chatBtn = modal.querySelector('#modal-chat-now-btn');
  const closeBtn = modal.querySelector('#modal-keep-swiping-btn');

  const removeModal = () => {
    modal.classList.add('fade-out');
    setTimeout(() => modal.remove(), 400);
  };

  chatBtn.addEventListener('click', () => {
    synth.playClick();
    removeModal();
    // Switch to active matches tab / select chat
    const chatTabBtn = document.querySelector('.nav-links a[href="#chat-section"]');
    if (chatTabBtn) chatTabBtn.click();
    selectMatchChat(matchProfile.id);
  });

  closeBtn.addEventListener('click', () => {
    synth.playClick();
    removeModal();
  });
}

// Confetti Hearts floating animation when hitting 100% Love
function triggerConfettiLove(matchProfile) {
  const container = document.createElement('div');
  container.className = 'love-confetti-container';
  document.body.appendChild(container);

  for (let i = 0; i < 30; i++) {
    const heart = document.createElement('div');
    heart.className = 'love-particle';
    heart.innerHTML = Math.random() > 0.5 ? '💖' : '❤️';
    heart.style.left = `${Math.random() * 100}vw`;
    heart.style.top = `100vh`;
    heart.style.fontSize = `${15 + Math.random() * 25}px`;
    heart.style.animationDelay = `${Math.random() * 1.5}s`;
    heart.style.animationDuration = `${2 + Math.random() * 3}s`;
    
    container.appendChild(heart);
  }

  // Pop up milestone card
  const overlay = document.createElement('div');
  overlay.className = 'love-milestone-overlay';
  overlay.innerHTML = `
    <div class="love-milestone-card" style="border-color:${matchProfile.color}; box-shadow:0 0 30px ${matchProfile.color};">
      <div class="milestone-hearts">💖 💝 💖</div>
      <h2>DUO COMMITMENT LEVEL MAXED!</h2>
      <p>Congratulations, <strong>${matchProfile.tag}</strong> has completely fallen in love with you as their co-op gamer for life! 😭💍</p>
      <button class="btn btn-primary" id="love-milestone-dismiss">LFG! ❤️</button>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#love-milestone-dismiss').addEventListener('click', () => {
    synth.playClick();
    overlay.remove();
    container.remove();
  });
}
