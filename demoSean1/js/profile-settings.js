// Profile customization logic for CarryMe
export const DEFAULT_USER_PROFILE = {
  tag: "Player1",
  age: 22,
  level: 15,
  location: "Concord, NH",
  avatar: "🎮",
  rank: "Radiant",
  platforms: ["PC"],
  categories: ["RPG", "FPS"],
  games: ["Elden Ring", "Valorant"],
  playstyle: "Casual",
  roles: ["Healer", "Support"],
  bio: "Looking for someone to play co-op games and build bases. Let's conquer dungeons together! 👾"
};

export function initProfileSettings() {
  const form = document.getElementById('profile-edit-form');
  if (!form) return;

  // Load existing profile or set default
  let profile = getUserProfile();

  // Populate form fields
  const tagEl = document.getElementById('edit-gamertag');
  const locEl = document.getElementById('edit-location');
  const bioEl = document.getElementById('edit-bio');
  const playstyleEl = document.getElementById('edit-playstyle');
  const rankEl = document.getElementById('edit-rank');

  if (tagEl) tagEl.value = profile.tag;
  if (locEl) locEl.value = profile.location;
  if (bioEl) bioEl.value = profile.bio;
  if (playstyleEl) playstyleEl.value = profile.playstyle;
  if (rankEl) rankEl.value = profile.rank || "Radiant";

  // Set platform checkboxes
  const platformBoxes = form.querySelectorAll('input[name="platforms"]');
  platformBoxes.forEach(box => {
    box.checked = profile.platforms.includes(box.value);
  });

  // Set games checkboxes
  const gamesBoxes = form.querySelectorAll('input[name="games"]');
  gamesBoxes.forEach(box => {
    box.checked = profile.games.includes(box.value);
  });

  // Set role checkboxes
  const roleBoxes = form.querySelectorAll('input[name="roles"]');
  roleBoxes.forEach(box => {
    box.checked = profile.roles.includes(box.value);
  });

  // Save handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const updatedProfile = {
      tag: tagEl ? tagEl.value.trim() : DEFAULT_USER_PROFILE.tag,
      age: profile.age,
      level: profile.level,
      location: locEl ? locEl.value.trim() : DEFAULT_USER_PROFILE.location,
      avatar: profile.avatar,
      rank: rankEl ? rankEl.value : "Radiant",
      playstyle: playstyleEl ? playstyleEl.value : "Casual",
      bio: bioEl ? bioEl.value.trim() : DEFAULT_USER_PROFILE.bio,
      platforms: Array.from(form.querySelectorAll('input[name="platforms"]:checked')).map(cb => cb.value),
      games: Array.from(form.querySelectorAll('input[name="games"]:checked')).map(cb => cb.value),
      roles: Array.from(form.querySelectorAll('input[name="roles"]:checked')).map(cb => cb.value)
    };

    localStorage.setItem('carryme_user_profile', JSON.stringify(updatedProfile));
    
    // Play level up sound
    import('./swipe.js').then(module => {
      module.synth.playLevelUp();
    });

    // Alert user
    showNotification("Loadout saved successfully! Synergy scores recalibrated.");

    // Fire event
    window.dispatchEvent(new CustomEvent('carrymeUserProfileChanged', { detail: updatedProfile }));
  });

  // Initialize Global Keyboard Hotkeys
  initKeyboardShortcuts();
}

// Setup Keyboard Hotkeys for Desktop Gamers
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ignore hotkeys when typing in input/textarea
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    if (e.key === 'ArrowLeft') {
      const passBtn = document.getElementById('action-pass');
      if (passBtn) passBtn.click();
    } else if (e.key === 'ArrowRight') {
      const likeBtn = document.getElementById('action-like');
      if (likeBtn) likeBtn.click();
    } else if (e.key === 'ArrowUp') {
      const superBtn = document.getElementById('action-super');
      if (superBtn) superBtn.click();
    } else if (e.code === 'Space') {
      e.preventDefault();
      const skipBtn = document.getElementById('skip-to-good-part-btn');
      if (skipBtn) skipBtn.click();
    }
  });
}

export function getUserProfile() {
  const saved = localStorage.getItem('carryme_user_profile');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return DEFAULT_USER_PROFILE;
    }
  }
  return DEFAULT_USER_PROFILE;
}

export function showNotification(message, icon = 'shield-check') {
  const container = document.getElementById('notification-container');
  if (!container) return;

  const notif = document.createElement('div');
  notif.className = 'hud-notification';
  notif.innerHTML = `
    <div class="notif-bar"></div>
    <div class="notif-content">
      <i data-lucide="${icon}" style="color:var(--accent);width:16px;height:16px;"></i>
      <span>${message}</span>
    </div>
  `;

  container.appendChild(notif);
  if (window.refreshIcons) window.refreshIcons();

  setTimeout(() => {
    notif.classList.add('active');
  }, 10);

  setTimeout(() => {
    notif.classList.remove('active');
    setTimeout(() => notif.remove(), 400);
  }, 4000);
}

