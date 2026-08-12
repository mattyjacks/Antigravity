// OBSplug / plug1 - Interactive Simulator & Real-time AI Viewport Engine

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const canvas = document.getElementById('stream-canvas');
  const ctx = canvas.getContext('2d');
  const chatInput = document.getElementById('chat-input-sim');
  const sendChatBtn = document.getElementById('send-chat-btn');
  const twitchChatBox = document.getElementById('twitch-chat-box');
  const obsChatOverlay = document.getElementById('obs-chat-overlay');
  const edgeEffectSelect = document.getElementById('edge-effect-select');
  const aiComputeMode = document.getElementById('ai-compute-mode');
  const glowIntensity = document.getElementById('glow-intensity');
  const aiThreshold = document.getElementById('ai-threshold');
  const effectBanner = document.getElementById('active-effect-banner');
  const aiBackendStatus = document.getElementById('ai-backend-status');

  // Animation state
  let time = 0;
  let activeEffect = null;
  let effectTimeRemaining = 0;
  let adPlaying = false;
  let adProgress = 0;

  // Tab switching
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Chat Overlay Style switching
  const styleBtns = document.querySelectorAll('.style-btn');
  styleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      styleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      obsChatOverlay.className = `obs-chat-layer style-${btn.dataset.style}`;
    });
  });

  // Compute mode toggle feedback
  aiComputeMode.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'gpu') {
      aiBackendStatus.textContent = 'Local AI: GPU Direct3D Active';
      aiBackendStatus.style.color = '#00ff88';
    } else {
      aiBackendStatus.textContent = 'Local AI: CPU SIMD Active';
      aiBackendStatus.style.color = '#00f2fe';
    }
  });

  // Chat messages simulation
  const initialMessages = [
    { user: 'CyberGamer99', text: 'Yo streamer! That background removal is crisp 🔥' },
    { user: 'VentureDev', text: 'Try typing fire in chat guys!' },
    { user: 'TwitchMod', text: 'Welcome everyone to the stream!' }
  ];

  initialMessages.forEach(msg => appendChatMessage(msg.user, msg.text));

  sendChatBtn.addEventListener('click', handleChatSubmit);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChatSubmit();
  });

  function handleChatSubmit() {
    const text = chatInput.value.trim();
    if (!text) return;
    appendChatMessage('You (Streamer)', text);
    processChatTrigger(text);
    chatInput.value = '';
  }

  function appendChatMessage(user, message) {
    // Add to side panel
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg';

    const isTrigger = message.toLowerCase().includes('fire') || 
                      message.includes('🔥') || 
                      message.toLowerCase().includes('shake') || 
                      message.toLowerCase().includes('glitch');

    if (isTrigger) msgDiv.classList.add('trigger-msg');

    msgDiv.innerHTML = `<span class="user">${user}:</span> <span class="text">${message}</span>`;
    twitchChatBox.appendChild(msgDiv);
    twitchChatBox.scrollTop = twitchChatBox.scrollHeight;

    // Add to overlay on screen
    const streamBubble = document.createElement('div');
    streamBubble.className = 'chat-bubble-stream';
    streamBubble.innerHTML = `<span class="author">${user}</span> ${message}`;
    obsChatOverlay.appendChild(streamBubble);

    if (obsChatOverlay.children.length > 4) {
      obsChatOverlay.removeChild(obsChatOverlay.children[0]);
    }
  }

  function processChatTrigger(text) {
    const lower = text.toLowerCase();
    if (lower.includes('fire') || text.includes('🔥')) {
      triggerEffect('FIRE AURA 🔥', 'fire', 5);
    } else if (lower.includes('shake')) {
      triggerEffect('SCREEN SHAKE 📳', 'shake', 3);
    } else if (lower.includes('glitch')) {
      triggerEffect('CYBERPUNK GLITCH 👾', 'glitch', 4);
    }
  }

  function triggerEffect(name, type, durationSec) {
    activeEffect = type;
    effectTimeRemaining = durationSec;
    effectBanner.textContent = `🔥 CHAT TRIGGER ACTIVE: ${name}`;
    effectBanner.classList.remove('hidden');
  }

  // Video Presenter Simulator
  const playBtns = document.querySelectorAll('.btn-play');
  const adMonitorText = document.getElementById('ad-status-text');
  const adProgressBar = document.getElementById('ad-progress');

  playBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      adPlaying = true;
      adProgress = 0;
      adMonitorText.textContent = 'PLAYING PREMADE SPONSOR VIDEO (Mic Audio Auto-Ducked)';
      adMonitorText.style.color = '#00f2fe';
    });
  });

  // Render Loop for Stream Canvas
  function renderFrame() {
    time += 0.05;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply screen shake if active
    let offsetX = 0;
    let offsetY = 0;
    if (activeEffect === 'shake') {
      offsetX = (Math.random() - 0.5) * 20;
      offsetY = (Math.random() - 0.5) * 20;
    }

    ctx.save();
    ctx.translate(offsetX, offsetY);

    // 1. Draw Stream Background (Synthwave / Gamer Room Grid)
    ctx.fillStyle = '#0d0e1b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = 'rgba(138, 43, 226, 0.15)';
    ctx.lineWidth = 2;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // 2. Local AI Person Segmentation & Human Silhouette Simulation
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 30;

    // Determine current edge effect mode
    let selectedMode = edgeEffectSelect.value;
    if (activeEffect === 'fire') selectedMode = 'fire';
    if (activeEffect === 'glitch') selectedMode = 'glitch';

    // Draw Subject Edge Aura Contour Shader Simulation
    const intensity = parseFloat(glowIntensity.value);

    if (selectedMode !== 'none') {
      ctx.save();
      ctx.beginPath();
      // Person Head & Shoulders Path
      ctx.arc(centerX, centerY - 100, 85, 0, Math.PI * 2);
      ctx.ellipse(centerX, centerY + 140, 180, 140, 0, 0, Math.PI, true);

      if (selectedMode === 'fire') {
        ctx.shadowColor = '#ff4500';
        ctx.shadowBlur = intensity * 2.5 + Math.sin(time * 8) * 10;
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 8;
      } else if (selectedMode === 'cyberpunk') {
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = intensity * 2;
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 6;
      } else if (selectedMode === 'electric') {
        ctx.shadowColor = '#00a8ff';
        ctx.shadowBlur = intensity * 3;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4 + (Math.random() * 4);
      } else if (selectedMode === 'rainbow') {
        const hue = (time * 100) % 360;
        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
        ctx.shadowBlur = intensity * 2;
        ctx.strokeStyle = `hsl(${hue}, 100%, 70%)`;
        ctx.lineWidth = 6;
      }

      ctx.stroke();
      ctx.restore();
    }

    // Draw Streamer Subject (AI Segmented cutout overlay)
    ctx.save();
    ctx.fillStyle = '#1c233a';
    ctx.beginPath();
    ctx.arc(centerX, centerY - 100, 80, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 140, 175, 135, 0, 0, Math.PI, true);
    ctx.fill();

    // Streamer Headset & Face features
    ctx.fillStyle = '#00f2fe';
    ctx.fillRect(centerX - 95, centerY - 110, 15, 40);
    ctx.fillRect(centerX + 80, centerY - 110, 15, 40);

    // Glitch effect slice overlay
    if (selectedMode === 'glitch') {
      ctx.fillStyle = 'rgba(0, 242, 254, 0.4)';
      const sliceY = centerY - 120 + Math.sin(time * 10) * 80;
      ctx.fillRect(centerX - 100, sliceY, 200, 15);
    }

    ctx.restore();
    ctx.restore();

    // Active effect countdown timer
    if (activeEffect) {
      effectTimeRemaining -= 0.016;
      if (effectTimeRemaining <= 0) {
        activeEffect = null;
        effectBanner.classList.add('hidden');
      }
    }

    // Video Presenter Progress
    if (adPlaying) {
      adProgress += 0.5;
      adProgressBar.style.width = `${adProgress}%`;
      if (adProgress >= 100) {
        adPlaying = false;
        adProgress = 0;
        adMonitorText.textContent = 'Standby (Ready to play)';
        adMonitorText.style.color = 'var(--text-muted)';
        adProgressBar.style.width = '0%';
      }
    }

    requestAnimationFrame(renderFrame);
  }

  renderFrame();
});
