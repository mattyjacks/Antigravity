/* ==========================================================================
   VORTEX GAMING COMMUNITY - MARVEL RIVALS TEAM BUILDER JS
   ========================================================================== */

const HEROES_DATABASE = [
  { id: 'venom', name: 'Venom', role: 'Vanguard', initial: 'VN', color: '#00ffff' },
  { id: 'magneto', name: 'Magneto', role: 'Vanguard', initial: 'MG', color: '#ff0055' },
  { id: 'drstrange', name: 'Doctor Strange', role: 'Vanguard', initial: 'DS', color: '#ffd700' },
  { id: 'loki', name: 'Loki', role: 'Strategist', initial: 'LK', color: '#00ff66' },
  { id: 'lunasnow', name: 'Luna Snow', role: 'Strategist', initial: 'LS', color: '#00c3ff' },
  { id: 'jeff', name: 'Jeff the Shark', role: 'Strategist', initial: 'JF', color: '#a3e4d7' },
  { id: 'spiderman', name: 'Spider-Man', role: 'Duelist', initial: 'SP', color: '#e74c3c' },
  { id: 'ironman', name: 'Iron Man', role: 'Duelist', initial: 'IM', color: '#f1c40f' },
  { id: 'hela', name: 'Hela', role: 'Duelist', initial: 'HL', color: '#27ae60' },
  { id: 'blackpanther', name: 'Black Panther', role: 'Duelist', initial: 'BP', color: '#8e44ad' },
  { id: 'scarletwitch', name: 'Scarlet Witch', role: 'Duelist', initial: 'SW', color: '#c0392b' },
  { id: 'storm', name: 'Storm', role: 'Duelist', initial: 'ST', color: '#f39c12' }
];

const SYNERGIES = [
  {
    heroes: ['loki', 'hela'],
    name: 'Asgardian Trickery',
    desc: 'Loki and Hela increase each other\'s critical strike rate by 15%.'
  },
  {
    heroes: ['venom', 'spiderman'],
    name: 'Symbiote Infusion',
    desc: 'Spider-Man gains extra mobility; Venom deals bonus splash damage.'
  },
  {
    heroes: ['magneto', 'scarletwitch'],
    name: 'Chaos Magnetism',
    desc: 'Magneto\'s metal barrier inflicts chaos burn when struck.'
  },
  {
    heroes: ['drstrange', 'ironman'],
    name: 'Techno-Mystic Shield',
    desc: 'Iron Man receives a passive runic shield whenever Strange uses portals.'
  },
  {
    heroes: ['blackpanther', 'storm'],
    name: 'Wakandan Tempest',
    desc: 'Storm\'s lightning strikes empower Black Panther\'s vibranium claws with kinetic energy.'
  }
];

let selectedHeroes = [];

document.addEventListener('DOMContentLoaded', () => {
  initRivalsBuilder();
});

function initRivalsBuilder() {
  const rosterGrid = document.getElementById('rivals-roster-grid');
  const filterChips = document.querySelectorAll('.filter-chip');
  
  if (!rosterGrid) return;

  // Render original list
  renderRoster('all');
  renderTeamSlots();
  updateSynergyAnalysis();

  // Setup Role filters
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const roleFilter = chip.getAttribute('data-role');
      renderRoster(roleFilter);
    });
  });
}

/**
 * Renders the selection cards of Heroes
 */
function renderRoster(filter) {
  const rosterGrid = document.getElementById('rivals-roster-grid');
  if (!rosterGrid) return;
  
  rosterGrid.innerHTML = '';
  
  const filteredHeroes = HEROES_DATABASE.filter(h => {
    if (filter === 'all') return true;
    return h.role.toLowerCase() === filter.toLowerCase();
  });
  
  filteredHeroes.forEach(hero => {
    const isSelected = selectedHeroes.includes(hero.id);
    const isFull = selectedHeroes.length >= 6;
    
    const card = document.createElement('div');
    card.className = `hero-card ${isSelected ? 'selected' : ''} ${(!isSelected && isFull) ? 'disabled' : ''}`;
    card.setAttribute('data-id', hero.id);
    
    // Icon based on Role
    let roleIcon = 'shield';
    if (hero.role === 'Duelist') roleIcon = 'sword';
    if (hero.role === 'Strategist') roleIcon = 'heart-pulse';
    
    card.innerHTML = `
      <div class="hero-avatar" style="box-shadow: inset 0 0 10px ${hero.color}40;">
        ${hero.initial}
        <div class="hero-badge-role">
          <i data-lucide="${roleIcon}" style="width:12px;height:12px;"></i>
        </div>
      </div>
      <div class="hero-name">${hero.name}</div>
      <div class="hero-role-text">${hero.role}</div>
    `;
    
    card.addEventListener('click', () => {
      toggleHeroSelection(hero.id);
    });
    
    rosterGrid.appendChild(card);
  });
  
  if (window.refreshIcons) window.refreshIcons();
}

/**
 * Handles character addition and removal on grid click
 */
function toggleHeroSelection(heroId) {
  const index = selectedHeroes.indexOf(heroId);
  
  if (index > -1) {
    // Remove hero
    selectedHeroes.splice(index, 1);
  } else {
    // Add hero (if less than 6 slots filled)
    if (selectedHeroes.length < 6) {
      selectedHeroes.push(heroId);
    } else {
      showToastNotification('Team composition is full! (Max 6 heroes)');
      return;
    }
  }
  
  // Refresh views
  const activeFilter = document.querySelector('.filter-chip.active')?.getAttribute('data-role') || 'all';
  renderRoster(activeFilter);
  renderTeamSlots();
  updateSynergyAnalysis();
}

/**
 * Renders the 6-slot selected team layout
 */
function renderTeamSlots() {
  const slotsContainer = document.getElementById('rivals-team-slots');
  if (!slotsContainer) return;
  
  slotsContainer.innerHTML = '';
  
  for (let i = 0; i < 6; i++) {
    const slot = document.createElement('div');
    
    if (i < selectedHeroes.length) {
      const heroId = selectedHeroes[i];
      const heroData = HEROES_DATABASE.find(h => h.id === heroId);
      
      slot.className = 'team-slot filled';
      slot.innerHTML = `
        <div class="team-slot-remove"><i data-lucide="x" style="width:10px;height:10px;"></i></div>
        <div class="team-slot-avatar" style="color: ${heroData.color}">${heroData.initial}</div>
        <div class="team-slot-name">${heroData.name}</div>
      `;
      
      slot.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleHeroSelection(heroId);
      });
    } else {
      slot.className = 'team-slot';
      slot.innerHTML = `
        <div class="team-slot-avatar"><i data-lucide="plus" style="width:16px;height:16px;"></i></div>
        <div style="font-size: 0.65rem; text-transform:uppercase;">Empty</div>
      `;
    }
    
    slotsContainer.appendChild(slot);
  }
  
  document.getElementById('rivals-slots-count-val').innerText = `${selectedHeroes.length}/6`;
  
  if (window.refreshIcons) window.refreshIcons();
}

/**
 * Calculates current composition stats and active synergies
 */
function updateSynergyAnalysis() {
  // 1. Roles counts
  let vanguards = 0;
  let duelists = 0;
  let strategists = 0;
  
  selectedHeroes.forEach(heroId => {
    const hero = HEROES_DATABASE.find(h => h.id === heroId);
    if (hero) {
      if (hero.role === 'Vanguard') vanguards++;
      if (hero.role === 'Duelist') duelists++;
      if (hero.role === 'Strategist') strategists++;
    }
  });
  
  const vgVal = document.getElementById('synergy-vanguard-val');
  const dlVal = document.getElementById('synergy-duelist-val');
  const stVal = document.getElementById('synergy-strategist-val');
  
  if (vgVal) vgVal.innerText = vanguards;
  if (dlVal) dlVal.innerText = duelists;
  if (stVal) stVal.innerText = strategists;
  
  // 2. Active synergies
  const synergyBox = document.getElementById('rivals-synergy-list');
  if (!synergyBox) return;
  
  synergyBox.innerHTML = '';
  let synergyFound = false;
  
  SYNERGIES.forEach(syn => {
    // Check if all heroes needed in synergy are selected
    const isActive = syn.heroes.every(hId => selectedHeroes.includes(hId));
    
    if (isActive) {
      synergyFound = true;
      const synDiv = document.createElement('div');
      synDiv.className = 'synergy-item active-synergy';
      synDiv.innerHTML = `
        <i data-lucide="sparkles" class="synergy-item-icon" style="width:16px;height:16px;"></i>
        <div class="synergy-item-text">${syn.name}</div>
        <div class="synergy-item-desc">${syn.desc}</div>
      `;
      synergyBox.appendChild(synDiv);
    }
  });
  
  if (!synergyFound) {
    const emptyDiv = document.createElement('div');
    emptyDiv.style.color = 'var(--text-muted)';
    emptyDiv.style.fontSize = '0.8rem';
    emptyDiv.style.textAlign = 'center';
    emptyDiv.style.padding = '1rem 0';
    emptyDiv.innerText = 'No team synergies active. Try pairing Loki & Hela, Venom & Spider-Man, or Magneto & Scarlet Witch!';
    synergyBox.appendChild(emptyDiv);
  }
  
  if (window.refreshIcons) window.refreshIcons();
}

/**
 * Screen alerts utility
 */
function showToastNotification(message) {
  // Check if there is an existing one
  let toast = document.getElementById('vortex-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'vortex-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '2rem';
    toast.style.right = '2rem';
    toast.style.background = 'rgba(255, 0, 127, 0.95)';
    toast.style.color = '#fff';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '8px';
    toast.style.fontFamily = 'var(--font-gaming)';
    toast.style.fontSize = '0.8rem';
    toast.style.letterSpacing = '0.05em';
    toast.style.boxShadow = '0 8px 24px rgba(255, 0, 127, 0.4)';
    toast.style.zIndex = '3000';
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    document.body.appendChild(toast);
  }
  
  toast.innerText = message.toUpperCase();
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
  }, 2500);
}
window.showToastNotification = showToastNotification;
