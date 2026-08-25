import { PROFILES } from './profiles.js';
import { CardDeck, synth, triggerConfetti } from './swipe.js';
import { initChatSystem, addMatch, getMatches, selectMatchChat, openVisionDateModal, startAutoDateMode } from './chat.js';
import { initProfileSettings, getUserProfile, showNotification } from './profile-settings.js';

let deck = null;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize application logic
  initThemeEngine();
  initTabNavigation();
  initProfileSettings();
  initChatSystem();
  initAudioControls();
  
  // Set up the Swipe Card Deck
  const deckContainer = document.getElementById('swipe-deck-container');
  if (deckContainer) {
    deck = new CardDeck(
      deckContainer,
      // On Swipe Right (Like / Match)
      (profile, compat) => {
        addMatch(profile, compat);
        trackSwipedProfile(profile.id);
      },
      // On Swipe Left (Pass / Next)
      (profile) => {
        trackSwipedProfile(profile.id);
      }
    );
    
    // Load deck cards
    refreshDeck();
  }

  // Bind controls for buttons (Like/Pass/SuperLike/Rewind) below the deck
  setupDeckActionButtons();
  setupSkipToGoodPartButton();
  setupDeckFilterBar();

  // Listen to profile change events to refresh deck scores
  window.addEventListener('carrymeUserProfileChanged', () => {
    refreshDeck();
  });

  // Listen to deck re-queue events
  window.addEventListener('carrymeResetDeck', () => {
    refreshDeck();
  });

  // Initialize Lucide icons on page load
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});

// Setup Master Audio Mute Button
function initAudioControls() {
  const muteBtn = document.getElementById('audio-mute-toggle-btn');
  const icon = document.getElementById('audio-icon');

  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      const enabled = synth.toggleMute();
      if (icon) {
        icon.setAttribute('data-lucide', enabled ? 'volume-2' : 'volume-x');
        if (window.refreshIcons) window.refreshIcons();
      }
      showNotification(enabled ? "Audio sound effects unmuted" : "Audio sound effects muted", enabled ? "volume-2" : "volume-x");
    });
  }
}

// Setup Deck Filter Chips
function setupDeckFilterBar() {
  const filterChips = document.querySelectorAll('#deck-filter-bar .filter-chip');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      synth.playClick();
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filterVal = chip.getAttribute('data-filter');
      if (deck) deck.setFilter(filterVal);
    });
  });
}

// Setup "Skip to Good Part ⚡" instant auto date button
function setupSkipToGoodPartButton() {
  const skipBtn = document.getElementById('skip-to-good-part-btn');
  if (!skipBtn) return;

  skipBtn.addEventListener('click', () => {
    synth.playMatch();
    triggerConfetti();

    // 1. Pick a random profile from PROFILES
    const randomProfile = PROFILES[Math.floor(Math.random() * PROFILES.length)];

    // 2. Add to active matches if not already present
    addMatch(randomProfile, 98);

    // 3. Switch view tab to Active Chats
    const chatTabBtn = document.querySelector('.nav-links a[href="#chat-section"]');
    if (chatTabBtn) chatTabBtn.click();

    // 4. Select match chat
    selectMatchChat(randomProfile.id);

    // 5. Open AI Vision & Voice Date Lab Modal & start Auto Date Mode!
    setTimeout(() => {
      openVisionDateModal(randomProfile);
      startAutoDateMode();
      showNotification(`⚡ Skipped to Good Part! Live AI Vision & Voice Date active with ${randomProfile.tag}!`, 'heart');
    }, 200);
  });
}

// Refresh the cards queue in CardDeck
function refreshDeck() {
  if (!deck) return;
  
  const userProfile = getUserProfile();
  const matchedList = getMatches();
  const swipedIds = getSwipedProfiles();

  // Filter out profiles that are already matched or swiped (dismissed/liked)
  const remaining = PROFILES.filter(p => {
    const isMatched = matchedList.some(m => m.id === p.id);
    const isSwiped = swipedIds.includes(p.id);
    return !isMatched && !isSwiped;
  });

  deck.setProfiles(remaining, userProfile);
}

// Track profile IDs swiped in localStorage to filter them later
function getSwipedProfiles() {
  const saved = localStorage.getItem('carryme_swiped_profiles');
  return saved ? JSON.parse(saved) : [];
}

function trackSwipedProfile(profileId) {
  const swiped = getSwipedProfiles();
  if (!swiped.includes(profileId)) {
    swiped.push(profileId);
    localStorage.setItem('carryme_swiped_profiles', JSON.stringify(swiped));
  }
}

// Setup deck manual controller buttons (Dislike / Superlike / Like / Rewind)
function setupDeckActionButtons() {
  const btnPass = document.getElementById('action-pass');
  const btnSuper = document.getElementById('action-super');
  const btnLike = document.getElementById('action-like');
  const btnRewind = document.getElementById('action-rewind');

  if (btnPass) {
    btnPass.addEventListener('click', () => {
      if (deck) deck.triggerSwipe(-1);
    });
  }

  if (btnLike) {
    btnLike.addEventListener('click', () => {
      if (deck) deck.triggerSwipe(1);
    });
  }

  if (btnRewind) {
    btnRewind.addEventListener('click', () => {
      if (deck) deck.rewindSwipe();
    });
  }

  if (btnSuper) {
    btnSuper.addEventListener('click', () => {
      synth.playMatch();
      triggerConfetti();

      // Superlike matches instantly with higher initial affection!
      const visibleDeck = deck ? deck.getFilteredDeck() : [];
      if (deck && visibleDeck.length > deck.currentIndex) {
        const topProfile = visibleDeck[deck.currentIndex];
        if (topProfile) {
          deck.triggerSwipe(1);
          setTimeout(() => {
            const matches = getMatches();
            const idx = matches.findIndex(m => m.id === topProfile.id);
            if (idx !== -1) {
              matches[idx].affection = 45; // Starts higher
              matches[idx].affectionReason = "Super Liked by Player 1! Instant connection.";
              localStorage.setItem('carryme_matches', JSON.stringify(matches));
              window.dispatchEvent(new Event('carrymeMatchesUpdated'));
            }
          }, 350);
        }
      }
    });
  }
}

// Client-side Tab Switcher
function initTabNavigation() {
  const navLinks = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('main section.app-section');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetHash = link.getAttribute('href');
      if (!targetHash.startsWith('#')) return;
      
      e.preventDefault();
      synth.playClick();

      // Update Nav Link Active Highlight
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Show Selected Section & Hide Others
      sections.forEach(sec => {
        if (`#${sec.id}` === targetHash) {
          sec.classList.add('active');
        } else {
          sec.classList.remove('active');
        }
      });

      // Special layout reflows if opening chat
      if (targetHash === '#chat-section') {
        const chatContainer = document.getElementById('chat-messages-container');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }
    });
  });
}

// Theme Switcher logic
function initThemeEngine() {
  const themeBtns = document.querySelectorAll('.theme-btn');
  const body = document.body;
  
  const savedTheme = localStorage.getItem('carryme-theme') || 'cyberpunk';
  applyTheme(savedTheme);
  
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      synth.playClick();
      const theme = btn.getAttribute('data-theme');
      applyTheme(theme);
    });
  });
  
  function applyTheme(themeName) {
    body.classList.remove('theme-cyberpunk', 'theme-tactical', 'theme-guild', 'theme-synthwave');
    themeBtns.forEach(b => b.classList.remove('active'));
    
    const activeBtn = document.querySelector(`.theme-btn[data-theme="${themeName}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    body.classList.add(`theme-${themeName}`);
    localStorage.setItem('carryme-theme', themeName);
  }
}

