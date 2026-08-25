// Audio Synthesis Engine using Native Web Audio API
class AudioSynth {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.8;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  toggleMute() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.08 * this.volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playSwipe() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.05 * this.volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playPassBuzz() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.06 * this.volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playMatch() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    
    const playNote = (freq, start, duration) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.1 * this.volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };

    // Play retro gaming chord arpeggio
    playNote(261.63, now, 0.15); // C4
    playNote(329.63, now + 0.08, 0.15); // E4
    playNote(392.00, now + 0.16, 0.15); // G4
    playNote(523.25, now + 0.24, 0.4); // C5
  }

  playLevelUp() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const playNote = (freq, start, duration) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.08 * this.volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };

    playNote(523.25, now, 0.1); // C5
    playNote(659.25, now + 0.1, 0.1); // E5
    playNote(783.99, now + 0.2, 0.1); // G5
    playNote(1046.50, now + 0.3, 0.5); // C6
  }
}

export const synth = new AudioSynth();

// Trigger screen confetti effect for Super Like & Level Ups
export function triggerConfetti() {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '999999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#00f0ff', '#ff007f', '#ffd700', '#00ff66', '#e024ff'];

  for (let i = 0; i < 60; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 0.7) * 18,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.2
    });
  }

  let startTime = Date.now();
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const elapsed = Date.now() - startTime;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4; // gravity
      p.alpha -= 0.015;
      p.rot += p.vRot;

      if (p.alpha > 0) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (elapsed < 1500) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
    }
  };
  requestAnimationFrame(draw);
}

// Compatibility Calculator logic
export function calculateCompatibility(userProfile, matchProfile) {
  let score = 20; // Base score

  if (!userProfile) return 50; // default if user profile is missing

  // Game overlap: 15% per game
  const userGames = userProfile.games || [];
  const matchGames = matchProfile.games || [];
  const sharedGames = userGames.filter(g => matchGames.includes(g));
  score += sharedGames.length * 15;

  // Platform synergy: 15% if share a platform
  const userPlatforms = userProfile.platforms || [];
  const matchPlatforms = matchProfile.platforms || [];
  const hasSharedPlatform = userPlatforms.some(p => matchPlatforms.includes(p));
  if (hasSharedPlatform) {
    score += 15;
  }

  // Playstyle synergy: 20%
  if (userProfile.playstyle === matchProfile.playstyle) {
    score += 20;
  } else if (
    (userProfile.playstyle === "Competitive" && matchProfile.playstyle === "Achievements") ||
    (userProfile.playstyle === "Casual" && matchProfile.playstyle === "Lore")
  ) {
    score += 10; // secondary synergy
  }

  // Role synergy: 30%
  const userRoles = userProfile.roles || [];
  const matchRoles = matchProfile.roles || [];
  
  let roleSynergy = false;
  // Healer + Carry Synergy
  if (
    (userRoles.includes("Healer") || userRoles.includes("Support")) &&
    (matchRoles.includes("Duelist") || matchRoles.includes("DPS") || matchRoles.includes("Entry Frag"))
  ) roleSynergy = true;

  if (
    (matchRoles.includes("Healer") || matchRoles.includes("Support")) &&
    (userRoles.includes("Duelist") || userRoles.includes("DPS") || userRoles.includes("Entry Frag"))
  ) roleSynergy = true;

  // Tank + Healer Synergy
  if (
    userRoles.includes("Tank") && 
    (matchRoles.includes("Healer") || matchRoles.includes("Support"))
  ) roleSynergy = true;
  if (
    matchRoles.includes("Tank") && 
    (userRoles.includes("Healer") || matchRoles.includes("Support"))
  ) roleSynergy = true;

  // Lead + Scout Synergy
  if (userRoles.includes("IGL (In-Game Leader)") && matchRoles.includes("Sniper")) roleSynergy = true;
  if (matchRoles.includes("IGL (In-Game Leader)") && userRoles.includes("Sniper")) roleSynergy = true;

  if (roleSynergy) {
    score += 30;
  }

  // Add random organic factor (10% - 15%)
  const seed = matchProfile.tag.length * 3;
  const organicFactor = 10 + (seed % 6);
  score += organicFactor;

  // Clamp score
  return Math.min(100, Math.max(30, score));
}

// Tinder Card Deck Class
export class CardDeck {
  constructor(containerEl, onSwipeRight, onSwipeLeft) {
    this.container = containerEl;
    this.onSwipeRight = onSwipeRight;
    this.onSwipeLeft = onSwipeLeft;
    this.deck = [];
    this.currentIndex = 0;
    this.historyStack = []; // For rewind feature
    this.activeFilter = 'All';
  }

  setProfiles(profilesList, userProfile) {
    this.deck = [...profilesList];
    this.userProfile = userProfile;
    this.currentIndex = 0;
    this.historyStack = [];
    this.render();
  }

  setFilter(filterCategory) {
    this.activeFilter = filterCategory;
    this.render();
  }

  getFilteredDeck() {
    if (this.activeFilter === 'All') return this.deck;
    return this.deck.filter(p => p.playstyle === this.activeFilter || p.categories.includes(this.activeFilter));
  }

  render() {
    this.container.innerHTML = '';
    const visibleDeck = this.getFilteredDeck();
    
    if (this.currentIndex >= visibleDeck.length) {
      this.container.innerHTML = `
        <div class="empty-deck-card">
          <i data-lucide="gamepad-2" class="empty-icon"></i>
          <h3>DECK COMPLETED!</h3>
          <p>You have run out of active gamer queues. Try updating your profile or resetting matches to find new duos.</p>
          <div class="empty-deck-actions" style="display:flex;gap:1rem;margin-top:1rem;">
            ${this.historyStack.length > 0 ? `
              <button class="btn btn-accent" id="rewind-card-btn">
                <i data-lucide="rotate-ccw" style="width:16px;height:16px;"></i> Undo Last Swipe
              </button>
            ` : ''}
            <button class="btn btn-secondary" id="reset-deck-btn">
              <i data-lucide="refresh-cw" style="width:16px;height:16px;"></i>
              Re-Queue Profiles
            </button>
          </div>
        </div>
      `;
      
      const resetBtn = this.container.querySelector('#reset-deck-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          synth.playClick();
          localStorage.removeItem('carryme_swiped_profiles');
          window.dispatchEvent(new Event('carrymeResetDeck'));
        });
      }

      const rewindBtn = this.container.querySelector('#rewind-card-btn');
      if (rewindBtn) {
        rewindBtn.addEventListener('click', () => this.rewindSwipe());
      }
      
      if (window.refreshIcons) window.refreshIcons();
      return;
    }

    // Render top 3 cards in stack
    const limit = Math.min(visibleDeck.length, this.currentIndex + 3);
    
    for (let i = limit - 1; i >= this.currentIndex; i--) {
      const profile = visibleDeck[i];
      const compat = calculateCompatibility(this.userProfile, profile);
      const isTop = i === this.currentIndex;
      
      const card = document.createElement('div');
      card.className = `swipe-card ${isTop ? 'top-card' : ''}`;
      card.style.zIndex = visibleDeck.length - i;
      
      const platformBadges = profile.platforms.map(p => {
        let iconName = 'laptop';
        let title = 'PC';
        if (p === 'PlayStation') { iconName = 'gamepad'; title = 'PlayStation'; }
        else if (p === 'Xbox') { iconName = 'shield'; title = 'Xbox'; }
        else if (p === 'Switch') { iconName = 'sparkles'; title = 'Nintendo Switch'; }
        
        return `<span class="platform-chip ${p.toLowerCase()}" title="${title}">
          <i data-lucide="${iconName}" style="width:12px;height:12px;"></i> ${p}
        </span>`;
      }).join('');

      const categoriesHtml = profile.categories.map(c => `<span>#${c}</span>`).join(' ');
      const backStats = profile.backStats || {
        kd: "2.5",
        winRate: "65%",
        mainAgent: profile.roles[0] || "Main",
        playTime: "1,200 hrs",
        favoriteFood: "Boba & Pizza",
        favoriteQuote: "Let's win this round!"
      };

      card.innerHTML = `
        <div class="card-inner">
          <!-- FRONT OF CARD -->
          <div class="card-front">
            <div class="card-glow" style="background: radial-gradient(circle at center, rgba(${profile.color === '#ff007f' ? '255,0,127' : '0,255,204'},0.15) 0%, transparent 70%);"></div>
            <div class="card-visual-frame">
              <div class="avatar-box" style="border-color: ${profile.color}; text-shadow: 0 0 10px ${profile.color}; overflow: hidden;">
                ${profile.image ? `<img src="${profile.image}" alt="${profile.tag}" style="width:100%;height:100%;object-fit:cover;">` : profile.avatar}
              </div>
              <div class="card-synergy-badge" style="box-shadow: 0 0 15px rgba(${profile.color === '#ff007f' ? '255,0,127' : '0,255,204'},0.25); border-color: ${profile.color};">
                <span class="synergy-num">${compat}%</span>
                <span class="synergy-lbl">Synergy</span>
              </div>
              <button class="btn-flip-card" title="Flip to see Gaming Stats & K/D">
                <i data-lucide="rotate-cw" style="width:14px;height:14px;"></i> Specs
              </button>
            </div>
            <div class="card-meta">
              <div class="meta-row">
                <h2>${profile.tag}, ${profile.age}</h2>
                <span class="gamer-lvl">LVL ${profile.level}</span>
              </div>
              <p class="card-location">
                <i data-lucide="map-pin" style="width:12px;height:12px;vertical-align:middle;margin-right:2px;"></i> 
                ${profile.location}
              </p>
              <div class="card-platforms">${platformBadges}</div>
              <p class="card-bio">"${profile.bio}"</p>
              <div class="card-game-tags">
                <strong>Active Games:</strong>
                ${profile.games.map(g => `<span class="game-tag">${g}</span>`).join('')}
              </div>
              <div class="card-categories">${categoriesHtml}</div>
            </div>
          </div>

          <!-- BACK OF CARD (GAMER STATS) -->
          <div class="card-back" style="border-color: ${profile.color};">
            <div class="card-back-header">
              <h3>🎮 ${profile.tag}'s LOADOUT STATS</h3>
              <button class="btn-flip-card btn-flip-back" title="Flip back">
                <i data-lucide="rotate-ccw" style="width:14px;height:14px;"></i> Back
              </button>
            </div>
            <div class="stats-grid">
              <div class="stat-box">
                <span class="stat-val">${backStats.kd}</span>
                <span class="stat-lbl">K/D Ratio</span>
              </div>
              <div class="stat-box">
                <span class="stat-val">${backStats.winRate}</span>
                <span class="stat-lbl">Win Rate</span>
              </div>
              <div class="stat-box">
                <span class="stat-val">${backStats.playTime}</span>
                <span class="stat-lbl">Time Played</span>
              </div>
              <div class="stat-box">
                <span class="stat-val">${backStats.mainAgent}</span>
                <span class="stat-lbl">Main Class</span>
              </div>
            </div>
            <div class="back-details">
              <p><strong>🍵 Fuel:</strong> ${backStats.favoriteFood}</p>
              <p><strong>💬 Motto:</strong> "${backStats.favoriteQuote}"</p>
            </div>
          </div>
        </div>
      `;

      this.container.appendChild(card);

      // Flip button handler
      const flipBtns = card.querySelectorAll('.btn-flip-card');
      flipBtns.forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          synth.playClick();
          card.classList.toggle('flipped');
        });
      });
      
      if (isTop) {
        this.setupDrag(card, profile, compat);
      }
    }
    
    if (window.refreshIcons) window.refreshIcons();
  }

  rewindSwipe() {
    if (this.historyStack.length === 0) return;
    synth.playClick();
    const lastProfileId = this.historyStack.pop();
    
    // Remove from swiped storage
    const swiped = JSON.parse(localStorage.getItem('carryme_swiped_profiles') || '[]');
    const updatedSwiped = swiped.filter(id => id !== lastProfileId);
    localStorage.setItem('carryme_swiped_profiles', JSON.stringify(updatedSwiped));
    
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
    this.render();
  }

  setupDrag(cardEl, profile, compat) {
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;
    
    const onStart = (e) => {
      if (e.target.closest('button') || e.target.closest('a') || cardEl.classList.contains('flipped')) return;
      
      isDragging = true;
      cardEl.style.transition = 'none';
      
      const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
      
      startX = clientX;
      startY = clientY;
    };
    
    const onMove = (e) => {
      if (!isDragging) return;
      
      const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
      
      currentX = clientX - startX;
      currentY = clientY - startY;
      
      const rot = currentX * 0.08;
      cardEl.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rot}deg)`;
      
      if (currentX > 50) {
        cardEl.style.boxShadow = `0 0 30px rgba(0, 240, 255, ${Math.min(0.5, (currentX - 50) / 200)})`;
      } else if (currentX < -50) {
        cardEl.style.boxShadow = `0 0 30px rgba(255, 0, 127, ${Math.min(0.5, (-currentX - 50) / 200)})`;
      } else {
        cardEl.style.boxShadow = '';
      }
    };
    
    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      
      const threshold = 130;
      cardEl.style.transition = 'transform 0.4s ease, opacity 0.4s ease, box-shadow 0.4s ease';
      
      if (currentX > threshold) {
        this.animateSwipe(cardEl, 1, currentY);
        this.historyStack.push(profile.id);
        setTimeout(() => this.onSwipeRight(profile, compat), 300);
      } else if (currentX < -threshold) {
        this.animateSwipe(cardEl, -1, currentY);
        this.historyStack.push(profile.id);
        setTimeout(() => this.onSwipeLeft(profile), 300);
      } else {
        cardEl.style.transform = 'translate(0px, 0px) rotate(0deg)';
        cardEl.style.boxShadow = '';
      }
      
      currentX = 0;
      currentY = 0;
    };
    
    cardEl.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    cardEl.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    
    cardEl._dragCleanup = () => {
      cardEl.removeEventListener('mousedown', onStart);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      cardEl.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }

  animateSwipe(cardEl, direction, yOffset) {
    if (direction === 1) synth.playSwipe();
    else synth.playPassBuzz();
    
    const flyX = direction * (window.innerWidth + 200);
    const flyY = yOffset + (yOffset > 0 ? 100 : -100);
    const rot = direction * 45;
    
    cardEl.style.transform = `translate(${flyX}px, ${flyY}px) rotate(${rot}deg)`;
    cardEl.style.opacity = '0';
    
    if (cardEl._dragCleanup) cardEl._dragCleanup();
    
    this.currentIndex++;
    setTimeout(() => this.render(), 300);
  }

  triggerSwipe(direction) {
    const visibleDeck = this.getFilteredDeck();
    const card = this.container.querySelector('.swipe-card.top-card');
    if (!card || this.currentIndex >= visibleDeck.length) return;
    
    const profile = visibleDeck[this.currentIndex];
    const compat = calculateCompatibility(this.userProfile, profile);
    this.historyStack.push(profile.id);
    
    this.animateSwipe(card, direction, 0);
    
    if (direction === 1) {
      setTimeout(() => this.onSwipeRight(profile, compat), 300);
    } else {
      setTimeout(() => this.onSwipeLeft(profile), 300);
    }
  }
}

