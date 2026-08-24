// Profile customization logic for CarryMe
export const DEFAULT_USER_PROFILE = {
  tag: "Player1",
  age: 22,
  level: 15,
  location: "New Hampshire, USA",
  avatar: "🎮",
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
  document.getElementById('edit-gamertag').value = profile.tag;
  document.getElementById('edit-location').value = profile.location;
  document.getElementById('edit-bio').value = profile.bio;
  document.getElementById('edit-playstyle').value = profile.playstyle;

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
      tag: document.getElementById('edit-gamertag').value.trim() || DEFAULT_USER_PROFILE.tag,
      age: profile.age,
      level: profile.level,
      location: document.getElementById('edit-location').value.trim() || DEFAULT_USER_PROFILE.location,
      avatar: profile.avatar,
      playstyle: document.getElementById('edit-playstyle').value,
      bio: document.getElementById('edit-bio').value.trim() || DEFAULT_USER_PROFILE.bio,
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
    showNotification("Loadout saved successfully! Synergy scores updated.");

    // Fire event
    window.dispatchEvent(new CustomEvent('carrymeUserProfileChanged', { detail: updatedProfile }));
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

  // Trigger CSS entry animation
  setTimeout(() => {
    notif.classList.add('active');
  }, 10);

  setTimeout(() => {
    notif.classList.remove('active');
    setTimeout(() => notif.remove(), 400);
  }, 4000);
}
