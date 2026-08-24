import { getUserProfile, showNotification } from './profile-settings.js';
import { synth } from './swipe.js';

let activeMatchId = null;

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
        <div class="match-last-msg">${match.affectionReason || "Click to open chat"}</div>
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
  const items = document.querySelectorAll('.match-sidebar-item');
  const matches = getMatches();
  const match = matches.find(m => m.id === matchId);
  if (!match) return;

  // Re-render sidebar items to update highlight
  renderMatchesList();

  // Render header
  const chatHeader = document.getElementById('active-chat-header');
  if (chatHeader) {
    const love = getLoveStatus(match.affection);
    chatHeader.innerHTML = `
      <div class="chat-header-wrap">
        <div class="chat-header-profile">
          <span class="header-avatar">${match.avatar}</span>
          <div>
            <h3>${match.tag}</h3>
            <span class="header-status">${love.title} - ${love.desc}</span>
          </div>
        </div>
        
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
    `;
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

// Submit user message and fetch AI reply
async function sendMessage(text) {
  if (!activeMatchId) return;

  const history = getChatHistory(activeMatchId);
  const userProfile = getUserProfile();
  const matches = getMatches();
  const matchIndex = matches.findIndex(m => m.id === activeMatchId);
  if (matchIndex === -1) return;
  const match = matches[matchIndex];

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
    // Format message logs for system context (keep last 10 messages to avoid large tokens)
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
        currentAffection: match.affection
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

    // Update match metrics
    match.affection = newAffection;
    match.affectionReason = data.affection_reason || "Chatted with Player 1";
    matches[matchIndex] = match;
    saveMatches(matches);

    // Play retro sounds
    if (newAffection > oldAffection) {
      synth.playClick();
    }
    
    // Check level up milestone
    const oldLevel = Math.floor(oldAffection / 20);
    const newLevel = Math.floor(newAffection / 20);
    if (newLevel > oldLevel) {
      synth.playLevelUp();
      showNotification(`Love Level Up with ${match.tag}! Unlocked: ${getLoveStatus(newAffection).title}`, 'heart');
      
      if (newAffection === 100 && oldAffection < 100) {
        // Ultimate milestone - falling in love!
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
  } catch (error) {
    console.error("Failed to fetch response:", error);
    showTypingIndicator(false);
    
    // Mock local fallback response
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
