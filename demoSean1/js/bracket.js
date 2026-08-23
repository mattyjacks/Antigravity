/* ==========================================================================
   VORTEX GAMING COMMUNITY - BRACKET JS
   ========================================================================== */

// Initial bracket data layout
const BRACKET_DATA = {
  quarters: [
    { id: 'q1', t1: 'Rival Force', t2: 'Cosmic Star', w: null, next: { id: 's1', slot: 't1' } },
    { id: 'q2', t1: 'Asgard Guard', t2: 'Latveria Org', w: null, next: { id: 's1', slot: 't2' } },
    { id: 'q3', t1: 'OpTic Tactical', t2: 'FaZe Hunters', w: null, next: { id: 's2', slot: 't1' } },
    { id: 'q4', t1: 'Empire Royal', t2: 'Ravens Squad', w: null, next: { id: 's2', slot: 't2' } }
  ],
  semis: [
    { id: 's1', t1: 'TBD', t2: 'TBD', w: null, next: { id: 'f1', slot: 't1' } },
    { id: 's2', t1: 'TBD', t2: 'TBD', w: null, next: { id: 'f1', slot: 't2' } }
  ],
  finals: [
    { id: 'f1', t1: 'TBD', t2: 'TBD', w: null }
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  initBracketWidget();
});

function initBracketWidget() {
  const container = document.getElementById('bracket-container-el');
  if (!container) return;
  
  renderBracketHTML();
}

function renderBracketHTML() {
  const container = document.getElementById('bracket-container-el');
  if (!container) return;
  
  container.innerHTML = '';
  
  // 1. Render Quarter Finals Column
  const qRound = document.createElement('div');
  qRound.className = 'bracket-round';
  qRound.innerHTML = '<div class="bracket-round-title">Quarters (BO3)</div>';
  BRACKET_DATA.quarters.forEach(match => {
    qRound.appendChild(createMatchupEl('quarters', match));
  });
  container.appendChild(qRound);
  
  // 2. Render Semi Finals Column
  const sRound = document.createElement('div');
  sRound.className = 'bracket-round';
  sRound.innerHTML = '<div class="bracket-round-title">Semis (BO5)</div>';
  BRACKET_DATA.semis.forEach(match => {
    sRound.appendChild(createMatchupEl('semis', match));
  });
  container.appendChild(sRound);
  
  // 3. Render Grand Finals Column
  const fRound = document.createElement('div');
  fRound.className = 'bracket-round';
  fRound.innerHTML = '<div class="bracket-round-title">Grand Finals (BO7)</div>';
  BRACKET_DATA.finals.forEach(match => {
    fRound.appendChild(createMatchupEl('finals', match));
  });
  container.appendChild(fRound);
  
  if (window.refreshIcons) window.refreshIcons();
}

function createMatchupEl(roundName, match) {
  const matchDiv = document.createElement('div');
  matchDiv.className = 'bracket-match';
  matchDiv.id = `match-${match.id}`;
  
  const isT1Winner = match.w === match.t1 && match.t1 !== 'TBD';
  const isT2Winner = match.w === match.t2 && match.t2 !== 'TBD';
  
  const t1Class = isT1Winner ? 'predict-winner' : (match.w && match.t1 !== 'TBD' ? 'loser' : '');
  const t2Class = isT2Winner ? 'predict-winner' : (match.w && match.t2 !== 'TBD' ? 'loser' : '');
  
  const logo1 = match.t1 !== 'TBD' ? match.t1.substring(0, 2).toUpperCase() : '?';
  const logo2 = match.t2 !== 'TBD' ? match.t2.substring(0, 2).toUpperCase() : '?';
  
  matchDiv.innerHTML = `
    <div class="bracket-team ${t1Class}" data-team="t1">
      <div style="display:flex;align-items:center;">
        <span class="team-logo-initial" style="background:${match.t1 !== 'TBD' ? 'rgba(0, 240, 255, 0.1)' : 'var(--bg-tertiary)'}; color:var(--accent); border: 1px solid var(--border-color);">${logo1}</span>
        <span>${match.t1}</span>
      </div>
      <i data-lucide="${isT1Winner ? 'check-circle' : 'circle'}" style="width:12px;height:12px;opacity:0.7;"></i>
    </div>
    <div style="height:1px;background:var(--border-color);margin:4px 0;"></div>
    <div class="bracket-team ${t2Class}" data-team="t2">
      <div style="display:flex;align-items:center;">
        <span class="team-logo-initial" style="background:${match.t2 !== 'TBD' ? 'rgba(255, 0, 127, 0.08)' : 'var(--bg-tertiary)'}; color:var(--accent-secondary); border: 1px solid var(--border-color);">${logo2}</span>
        <span>${match.t2}</span>
      </div>
      <i data-lucide="${isT2Winner ? 'check-circle' : 'circle'}" style="width:12px;height:12px;opacity:0.7;"></i>
    </div>
  `;
  
  // Click listener for predictions
  const t1Row = matchDiv.querySelector('[data-team="t1"]');
  const t2Row = matchDiv.querySelector('[data-team="t2"]');
  
  t1Row.addEventListener('click', () => {
    if (match.t1 !== 'TBD') handlePrediction(roundName, match.id, match.t1);
  });
  
  t2Row.addEventListener('click', () => {
    if (match.t2 !== 'TBD') handlePrediction(roundName, match.id, match.t2);
  });
  
  return matchDiv;
}

/**
 * Bubble predicted winners forward through the bracket structure
 */
function handlePrediction(roundName, matchId, winnerTeamName) {
  // Find current match in object database
  let match = null;
  let matchesList = BRACKET_DATA[roundName];
  if (matchesList) {
    match = matchesList.find(m => m.id === matchId);
  }
  
  if (!match) return;
  
  // Set winner
  match.w = winnerTeamName;
  
  // Bubble up to next rounds
  if (match.next) {
    const nextMatchId = match.next.id;
    const nextSlotName = match.next.slot; // 't1' or 't2'
    
    // Find next round
    let nextRoundName = 'semis';
    if (nextMatchId.startsWith('f')) nextRoundName = 'finals';
    
    const nextMatch = BRACKET_DATA[nextRoundName].find(m => m.id === nextMatchId);
    if (nextMatch) {
      // Clear winner in downstream matches if resetting
      if (nextMatch[nextSlotName] !== winnerTeamName) {
        clearDownstreamWinners(nextMatchId);
      }
      nextMatch[nextSlotName] = winnerTeamName;
    }
  } else {
    // Finals reached! Trigger champion notification
    if (window.showToastNotification) {
      window.showToastNotification(`🏆 CHAMPION PREDICTION: ${winnerTeamName.toUpperCase()}!`);
    }
  }
  
  renderBracketHTML();
}

/**
 * Resets child branches if a user changes their mind in an early round
 */
function clearDownstreamWinners(startMatchId) {
  // Find match in semis or finals
  const semisMatch = BRACKET_DATA.semis.find(m => m.id === startMatchId);
  if (semisMatch) {
    semisMatch.w = null;
    const finalMatch = BRACKET_DATA.finals[0];
    if (finalMatch) {
      if (semisMatch.next.slot === 't1') finalMatch.t1 = 'TBD';
      if (semisMatch.next.slot === 't2') finalMatch.t2 = 'TBD';
      finalMatch.w = null;
    }
  }
  
  const finalsMatch = BRACKET_DATA.finals.find(m => m.id === startMatchId);
  if (finalsMatch) {
    finalsMatch.w = null;
  }
}
