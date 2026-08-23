/* ==========================================================================
   VORTEX GAMING COMMUNITY - CALL OF DUTY GUNSMITH JS
   ========================================================================== */

const WEAPONS_DATABASE = {
  mcw: {
    name: 'MCW',
    class: 'Assault Rifle',
    stats: { damage: 65, accuracy: 72, range: 60, mobility: 55, control: 68 }
  },
  horus: {
    name: 'FJX Horus',
    class: 'Submachine Gun',
    stats: { damage: 48, accuracy: 52, range: 38, mobility: 86, control: 58 }
  },
  kar98k: {
    name: 'Kar98k',
    class: 'Marksman Rifle',
    stats: { damage: 92, accuracy: 82, range: 88, mobility: 42, control: 48 }
  }
};

const ATTACHMENTS_DATABASE = {
  muzzle: [
    { id: 'none', name: 'Factory Standard', stats: { damage: 0, accuracy: 0, range: 0, mobility: 0, control: 0 } },
    { id: 'suppressor', name: 'Shadowstrike Suppressor', stats: { damage: 0, accuracy: 2, range: -4, mobility: -2, control: 0 } },
    { id: 'compensator', name: 'Colossus Compensator', stats: { damage: 0, accuracy: 12, range: 0, mobility: -5, control: 15 } }
  ],
  barrel: [
    { id: 'none', name: 'Factory Standard', stats: { damage: 0, accuracy: 0, range: 0, mobility: 0, control: 0 } },
    { id: 'long', name: '16.5" Cyclone Heavy', stats: { damage: 6, accuracy: 8, range: 16, mobility: -8, control: 6 } },
    { id: 'light', name: 'Tempus Micro Sprint', stats: { damage: -4, accuracy: -6, range: -12, mobility: 14, control: -8 } }
  ],
  optic: [
    { id: 'none', name: 'Iron Sights', stats: { damage: 0, accuracy: 0, range: 0, mobility: 0, control: 0 } },
    { id: 'slate', name: 'Slate Reflector 1x', stats: { damage: 0, accuracy: 4, range: 0, mobility: -1, control: 2 } },
    { id: 'eagleseye', name: 'Corio Eagleseye 2.5x', stats: { damage: 0, accuracy: 8, range: 6, mobility: -4, control: 4 } }
  ],
  magazine: [
    { id: 'none', name: 'Standard Magazine', stats: { damage: 0, accuracy: 0, range: 0, mobility: 0, control: 0 } },
    { id: 'mag40', name: '40-Round Extended', stats: { damage: 0, accuracy: 0, range: 0, mobility: -4, control: 0 } },
    { id: 'drum60', name: '60-Round Heavy Drum', stats: { damage: 0, accuracy: 0, range: 0, mobility: -12, control: -4 } }
  ],
  stock: [
    { id: 'none', name: 'Factory Standard', stats: { damage: 0, accuracy: 0, range: 0, mobility: 0, control: 0 } },
    { id: 'heavy', name: 'Tactical Combat Stock', stats: { damage: 0, accuracy: 6, range: 0, mobility: -6, control: 10 } },
    { id: 'nostock', name: 'Recoil-Cut Stock Delete', stats: { damage: 0, accuracy: -14, range: -6, mobility: 22, control: -16 } }
  ]
};

let currentWeaponId = 'mcw';
let selectedAttachments = {
  muzzle: 'none',
  barrel: 'none',
  optic: 'none',
  magazine: 'none',
  stock: 'none'
};

document.addEventListener('DOMContentLoaded', () => {
  initGunsmith();
});

function initGunsmith() {
  const weaponSelect = document.getElementById('cod-weapon-select');
  if (!weaponSelect) return;
  
  // Set up weapon switch dropdown
  weaponSelect.addEventListener('change', (e) => {
    currentWeaponId = e.target.value;
    resetAttachments();
    updateGunsmithUI();
  });
  
  // Set up attachment select listeners
  const slots = ['muzzle', 'barrel', 'optic', 'magazine', 'stock'];
  slots.forEach(slot => {
    const selector = document.getElementById(`cod-select-${slot}`);
    if (selector) {
      // Draw option listings
      selector.innerHTML = '';
      ATTACHMENTS_DATABASE[slot].forEach(att => {
        const opt = document.createElement('option');
        opt.value = att.id;
        opt.innerText = att.name;
        selector.appendChild(opt);
      });
      
      selector.addEventListener('change', (e) => {
        selectedAttachments[slot] = e.target.value;
        updateGunsmithUI();
      });
    }
  });
  
  // Set up blueprint click points
  const nodes = document.querySelectorAll('.gun-node');
  nodes.forEach(node => {
    node.addEventListener('click', () => {
      const slot = node.getAttribute('data-slot');
      const selector = document.getElementById(`cod-select-${slot}`);
      if (selector) {
        selector.focus();
        // Visual indicator pulse
        nodes.forEach(n => n.classList.remove('active'));
        node.classList.add('active');
      }
    });
  });

  updateGunsmithUI();
}

function resetAttachments() {
  selectedAttachments = {
    muzzle: 'none',
    barrel: 'none',
    optic: 'none',
    magazine: 'none',
    stock: 'none'
  };
  
  const slots = ['muzzle', 'barrel', 'optic', 'magazine', 'stock'];
  slots.forEach(slot => {
    const selector = document.getElementById(`cod-select-${slot}`);
    if (selector) {
      selector.value = 'none';
    }
  });
}

/**
 * Recalculates stats and updates progress bar values with deltas
 */
function updateGunsmithUI() {
  const weapon = WEAPONS_DATABASE[currentWeaponId];
  if (!weapon) return;
  
  // Update name tag overlays
  const nameOverlay = document.getElementById('cod-gun-name-overlay');
  const classOverlay = document.getElementById('cod-gun-class-overlay');
  if (nameOverlay) nameOverlay.innerText = weapon.name;
  if (classOverlay) classOverlay.innerText = weapon.class;
  
  // Calculate total attachment offsets
  const totalOffsets = { damage: 0, accuracy: 0, range: 0, mobility: 0, control: 0 };
  
  Object.keys(selectedAttachments).forEach(slot => {
    const attId = selectedAttachments[slot];
    const attachmentData = ATTACHMENTS_DATABASE[slot].find(a => a.id === attId);
    
    // Highlight nodes in the blueprint
    const nodeEl = document.querySelector(`.gun-node[data-slot="${slot}"]`);
    if (nodeEl) {
      if (attId !== 'none') {
        nodeEl.classList.add('active');
      } else {
        nodeEl.classList.remove('active');
      }
    }
    
    // Update attachment label sub-details in form
    const labelVal = document.getElementById(`cod-val-${slot}`);
    if (labelVal) {
      labelVal.innerText = attachmentData ? attachmentData.name : 'Factory Standard';
    }
    
    if (attachmentData) {
      Object.keys(attachmentData.stats).forEach(stat => {
        totalOffsets[stat] += attachmentData.stats[stat];
      });
    }
  });
  
  // Render and update stat sliders
  const statsKeys = ['damage', 'accuracy', 'range', 'mobility', 'control'];
  statsKeys.forEach(key => {
    const baseVal = weapon.stats[key];
    const offsetVal = totalOffsets[key];
    let finalVal = baseVal + offsetVal;
    
    // Clamp values
    finalVal = Math.max(0, Math.min(100, finalVal));
    
    // Select HTML node objects
    const statText = document.getElementById(`cod-stat-${key}-val`);
    const barInner = document.getElementById(`cod-bar-${key}-inner`);
    const barDiff = document.getElementById(`cod-bar-${key}-diff`);
    
    if (statText) {
      statText.innerText = finalVal;
      if (offsetVal > 0) {
        statText.innerHTML = `${finalVal} <span style="color:#00ff66;font-size:0.75rem;">(+${offsetVal})</span>`;
      } else if (offsetVal < 0) {
        statText.innerHTML = `${finalVal} <span style="color:#ff3b30;font-size:0.75rem;">(${offsetVal})</span>`;
      }
    }
    
    if (barInner) {
      barInner.style.width = `${baseVal}%`;
    }
    
    if (barDiff) {
      barDiff.className = 'gun-stat-bar-diff';
      if (offsetVal > 0) {
        // Draw green offset to the right of base
        barDiff.classList.add('positive');
        barDiff.style.left = `${baseVal}%`;
        barDiff.style.width = `${offsetVal}%`;
      } else if (offsetVal < 0) {
        // Draw red offset overlapping base from final to base
        barDiff.classList.add('negative');
        barDiff.style.left = `${finalVal}%`;
        barDiff.style.width = `${Math.abs(offsetVal)}%`;
      } else {
        barDiff.style.width = `0%`;
      }
    }
  });
}
