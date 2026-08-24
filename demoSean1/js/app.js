import { PROFILES } from './profiles.js';
import { CardDeck, synth } from './swipe.js';
import { initChatSystem, addMatch, getMatches } from './chat.js';
import { initProfileSettings, getUserProfile } from './profile-settings.js';

let deck = null;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize application logic
  initThemeEngine();
  initTabNavigation();
  initProfileSettings();
  initChatSystem();
  
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

  // Bind controls for buttons (Like/Pass/SuperLike) below the deck
  setupDeckActionButtons();

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

// Setup deck manual controller buttons (Dislike / Superlike / Like)
function setupDeckActionButtons() {
  const btnPass = document.getElementById('action-pass');
  const btnSuper = document.getElementById('action-super');
  const btnLike = document.getElementById('action-like');

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

  if (btnSuper) {
    btnSuper.addEventListener('click', () => {
      synth.playClick();
      // Superlike matches instantly with higher initial affection!
      const card = document.querySelector('.swipe-card.top-card');
      if (card && deck) {
        const topProfile = deck.deck[deck.currentIndex];
        if (topProfile) {
          deck.triggerSwipe(1);
          // Wait briefly, then increase affection
          setTimeout(() => {
            const matches = getMatches();
            const idx = matches.findIndex(m => m.id === topProfile.id);
            if (idx !== -1) {
              matches[idx].affection = 40; // Starts higher
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

// Cyberpunk Theme Switcher logic
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
    body.classList.remove('theme-cyberpunk', 'theme-tactical', 'theme-guild');
    themeBtns.forEach(b => b.classList.remove('active'));
    
    const activeBtn = document.querySelector(`.theme-btn[data-theme="${themeName}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    body.classList.add(`theme-${themeName}`);
    localStorage.setItem('carryme-theme', themeName);
  }
}
