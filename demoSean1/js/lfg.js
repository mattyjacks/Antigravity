/* ==========================================================================
   VORTEX GAMING COMMUNITY - LFG BOARD JS
   ========================================================================== */

let lfgLobbies = [
  {
    id: 1,
    host: 'Hela_Queen',
    game: 'rivals',
    title: 'Comp Gold Push. Need Vanguard & Strategist mains!',
    mode: 'Ranked Compet.',
    size: 6,
    filled: 4,
    time: '3m ago',
    avatar: 'HQ',
    joined: false
  },
  {
    id: 2,
    host: 'Ghost_Tactics',
    game: 'cod',
    title: 'Warzone Champion\'s Quest. Mic required + KD 1.8+',
    mode: 'Warzone Nuke',
    size: 4,
    filled: 3,
    time: '5m ago',
    avatar: 'GT',
    joined: false
  },
  {
    id: 3,
    host: 'Magneto_Was_Right',
    game: 'rivals',
    title: 'Quick Match chill team comp tests. Open to anyone',
    mode: 'Quick Play',
    size: 6,
    filled: 2,
    time: '12m ago',
    avatar: 'MR',
    joined: false
  },
  {
    id: 4,
    host: 'Sniper_Elite_CoD',
    game: 'cod',
    title: 'Search & Destroy custom wagers. Sweat session.',
    mode: 'S&D Custom',
    size: 5,
    filled: 2,
    time: '20m ago',
    avatar: 'SE',
    joined: false
  }
];

let activeLfgFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  initLfgBoard();
});

function initLfgBoard() {
  const modal = document.getElementById('lfg-modal-container');
  const openBtn = document.getElementById('lfg-create-btn');
  const closeBtn = document.getElementById('lfg-modal-close');
  const filterBtns = document.querySelectorAll('.lfg-filter-chip');
  const form = document.getElementById('lfg-create-form');

  if (!openBtn) return;

  // Open/Close modal handlers
  openBtn.addEventListener('click', () => {
    modal.classList.add('open');
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('open');
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('open');
    }
  });

  // Filter chips handlers
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeLfgFilter = btn.getAttribute('data-filter');
      renderLfgGrid();
    });
  });

  // Handle Form Submission
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const host = document.getElementById('lfg-form-host').value.trim() || 'VortexUser';
      const game = document.getElementById('lfg-form-game').value;
      const title = document.getElementById('lfg-form-title').value.trim() || 'Looking for team!';
      const mode = document.getElementById('lfg-form-mode').value.trim() || 'Regular Match';
      const size = parseInt(document.getElementById('lfg-form-size').value, 10) || 4;
      
      const newLobby = {
        id: Date.now(),
        host: host,
        game: game,
        title: title,
        mode: mode,
        size: size,
        filled: 1, // Host is the first
        time: 'Just now',
        avatar: host.substring(0, 2).toUpperCase(),
        joined: false
      };
      
      // Add to database
      lfgLobbies.unshift(newLobby);
      
      // Reset & close modal
      form.reset();
      modal.classList.remove('open');
      
      // Re-render
      renderLfgGrid();
      
      if (window.showToastNotification) {
        window.showToastNotification('Lobby published successfully!');
      }
    });
  }

  // Initial render
  renderLfgGrid();
}

/**
 * Renders list items in the LFG dashboard
 */
function renderLfgGrid() {
  const grid = document.getElementById('lfg-listings-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  const filtered = lfgLobbies.filter(lobby => {
    if (activeLfgFilter === 'all') return true;
    return lobby.game === activeLfgFilter;
  });
  
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 3rem 0;">
        <i data-lucide="users-2" style="width: 40px; height:40px; margin-bottom:1rem; opacity:0.5;"></i>
        <p>No active squads found for this game category. Post one to get started!</p>
      </div>
    `;
    if (window.refreshIcons) window.refreshIcons();
    return;
  }
  
  filtered.forEach(lobby => {
    const card = document.createElement('div');
    card.className = 'lfg-card';
    
    // Badge game type
    const badgeText = lobby.game === 'rivals' ? 'Marvel Rivals' : 'Call of Duty';
    const badgeClass = lobby.game === 'rivals' ? 'badge-rivals' : 'badge-cod';
    
    // Button join state
    let btnText = 'Join Squad';
    let btnClass = 'btn-secondary';
    let isFull = lobby.filled >= lobby.size;
    
    if (lobby.joined) {
      btnText = 'Leave Squad';
      btnClass = 'btn-primary';
    } else if (isFull) {
      btnText = 'Squad Full';
      btnClass = 'btn-secondary';
    }
    
    // Generate dots indicators
    let dotsHtml = '';
    for (let i = 0; i < lobby.size; i++) {
      const isFilled = i < lobby.filled;
      dotsHtml += `<div class="slot-dot ${isFilled ? 'filled' : ''}"></div>`;
    }
    
    card.innerHTML = `
      <div class="lfg-card-badge ${badgeClass}">${badgeText}</div>
      <div class="lfg-host-info">
        <div class="lfg-host-avatar" style="border-color: ${lobby.game === 'rivals' ? '#ff007f' : '#00ff66'}">
          ${lobby.avatar}
        </div>
        <div>
          <div class="lfg-host-name">${lobby.host}</div>
          <div class="lfg-host-meta">Host • ${lobby.time}</div>
        </div>
      </div>
      <div class="lfg-card-title">"${lobby.title}"</div>
      <div class="lfg-lobby-details">
        <div class="lfg-lobby-item">
          <i data-lucide="gamepad-2" style="width:14px;height:14px;"></i>
          <span>${lobby.mode}</span>
        </div>
      </div>
      <div class="lfg-card-footer">
        <div>
          <div class="lfg-slots-indicator" style="margin-bottom: 0.25rem;">
            ${dotsHtml}
          </div>
          <div class="slot-text">${lobby.filled}/${lobby.size} players</div>
        </div>
        <button class="btn ${btnClass} lfg-join-btn" data-id="${lobby.id}" style="padding: 8px 16px; font-size: 0.75rem;" ${isFull && !lobby.joined ? 'disabled' : ''}>
          ${btnText}
        </button>
      </div>
    `;
    
    // Wire button listener
    const btn = card.querySelector('.lfg-join-btn');
    btn.addEventListener('click', () => {
      toggleLobbyJoin(lobby.id);
    });
    
    grid.appendChild(card);
  });
  
  if (window.refreshIcons) window.refreshIcons();
}

/**
 * Handles adding/removing slots dynamically on local join clicks
 */
function toggleLobbyJoin(lobbyId) {
  const lobby = lfgLobbies.find(l => l.id === lobbyId);
  if (!lobby) return;
  
  if (lobby.joined) {
    // Leave lobby
    lobby.joined = false;
    lobby.filled--;
  } else {
    // Join lobby
    if (lobby.filled < lobby.size) {
      lobby.joined = true;
      lobby.filled++;
      if (window.showToastNotification) {
        window.showToastNotification(`Joined ${lobby.host}'s lobby! Connecting...`);
      }
    } else {
      if (window.showToastNotification) {
        window.showToastNotification('Lobby is already full!');
      }
      return;
    }
  }
  
  renderLfgGrid();
}
