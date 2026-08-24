import { PROFILES } from './profiles.js';

// Audio Synthesis Engine using Native Web Audio API
class AudioSynth {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
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
    
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
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
      
      gain.gain.setValueAtTime(0.1, start);
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
      
      gain.gain.setValueAtTime(0.08, start);
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
    (userRoles.includes("Healer") || userRoles.includes("Support"))
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
  }

  setProfiles(profilesList, userProfile) {
    // Exclude matches and filter
    this.deck = [...profilesList];
    this.userProfile = userProfile;
    this.currentIndex = 0;
    this.render();
  }

  render() {
    this.container.innerHTML = '';
    
    if (this.currentIndex >= this.deck.length) {
      this.container.innerHTML = `
        <div class="empty-deck-card">
          <i data-lucide="gamepad-2" class="empty-icon"></i>
          <h3>DECK COMPLETED!</h3>
          <p>You have run out of active gamer queues. Try updating your profile or resetting matches to find new duos.</p>
          <button class="btn btn-secondary" id="reset-deck-btn">
            <i data-lucide="refresh-cw" style="width:16px;height:16px;"></i>
            Re-Queue Profiles
          </button>
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
      
      if (window.refreshIcons) window.refreshIcons();
      return;
    }

    // Render the top 3 cards in stack for 3D depth effect
    const limit = Math.min(this.deck.length, this.currentIndex + 3);
    
    for (let i = limit - 1; i >= this.currentIndex; i--) {
      const profile = this.deck[i];
      const compat = calculateCompatibility(this.userProfile, profile);
      const isTop = i === this.currentIndex;
      
      const card = document.createElement('div');
      card.className = `swipe-card ${isTop ? 'top-card' : ''}`;
      card.style.zIndex = this.deck.length - i;
      
      // Calculate platform badge icons
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

      // Build categories list
      const categoriesHtml = profile.categories.map(c => `<span>#${c}</span>`).join(' ');

      card.innerHTML = `
        <div class="card-glow" style="background: radial-gradient(circle at center, rgba(${profile.color === '#ff007f' ? '255,0,127' : '0,255,204'},0.15) 0%, transparent 70%);"></div>
        <div class="card-visual-frame">
          <div class="avatar-box" style="border-color: ${profile.color}; text-shadow: 0 0 10px ${profile.color};">
            ${profile.avatar}
          </div>
          <div class="card-synergy-badge" style="box-shadow: 0 0 15px rgba(${profile.color === '#ff007f' ? '255,0,127' : '0,255,204'},0.25); border-color: ${profile.color};">
            <span class="synergy-num">${compat}%</span>
            <span class="synergy-lbl">Synergy</span>
          </div>
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
      `;

      this.container.appendChild(card);
      
      if (isTop) {
        this.setupDrag(card, profile, compat);
      }
    }
    
    if (window.refreshIcons) window.refreshIcons();
  }

  setupDrag(cardEl, profile, compat) {
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;
    
    const onStart = (e) => {
      // Don't drag if clicking buttons
      if (e.target.closest('button') || e.target.closest('a')) return;
      
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
      
      // Calculate rotation based on horizontal displacement
      const rot = currentX * 0.08;
      
      cardEl.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rot}deg)`;
      
      // Color card overlay indicators depending on swipe direction
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
        // Swipe Right (Like)
        this.animateSwipe(cardEl, 1, currentY);
        setTimeout(() => this.onSwipeRight(profile, compat), 300);
      } else if (currentX < -threshold) {
        // Swipe Left (Pass)
        this.animateSwipe(cardEl, -1, currentY);
        setTimeout(() => this.onSwipeLeft(profile), 300);
      } else {
        // Reset card position
        cardEl.style.transform = 'translate(0px, 0px) rotate(0deg)';
        cardEl.style.boxShadow = '';
      }
      
      currentX = 0;
      currentY = 0;
    };
    
    // Mouse Event Listeners
    cardEl.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    
    // Touch Event Listeners
    cardEl.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    
    // Cleanup listeners when card is removed
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
    synth.playSwipe();
    
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
    const card = this.container.querySelector('.swipe-card.top-card');
    if (!card) return;
    
    this.animateSwipe(card, direction, 0);
    const profile = this.deck[this.currentIndex - 1];
    const compat = calculateCompatibility(this.userProfile, profile);
    
    if (direction === 1) {
      setTimeout(() => this.onSwipeRight(profile, compat), 300);
    } else {
      setTimeout(() => this.onSwipeLeft(profile), 300);
    }
  }
}
