/**
 * IT'S WALLY'S WORLD - DEMO 1 (Retro Arcade & 90s Pop Culture)
 * Interactive Script
 */

document.addEventListener('DOMContentLoaded', () => {
  initAudioSynthesizer();
  initHeaderScroll();
  initMobileMenu();
  initGrailVault();
  initMysteryCrate();
  initTradeEstimator();
  initModals();
  initStoreStatus();
  initLightbox();
  initForms();
});

/* ==========================================================================
   1. WEB AUDIO SYNTHESIZER (No external audio files needed!)
   ========================================================================== */
let audioCtx = null;
let soundEnabled = false;

function initAudioSynthesizer() {
  const toggleBtn = document.getElementById('soundToggle');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    soundEnabled = !soundEnabled;
    toggleBtn.classList.toggle('active', soundEnabled);
    toggleBtn.innerHTML = soundEnabled 
      ? '<i class="fa-solid fa-volume-high"></i> SFX ON' 
      : '<i class="fa-solid fa-volume-xmark"></i> SFX OFF';
    
    if (soundEnabled) {
      playSound('powerup');
      showToast('🔊 90s Arcade Sound FX Enabled!');
    }
  });

  // Attach hover/click sounds to key interactive elements
  document.querySelectorAll('.btn, .dept-card, .filter-btn, .calc-radio-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (soundEnabled) playSound('blip', 0.05);
    });
    el.addEventListener('click', () => {
      if (soundEnabled) playSound('click', 0.1);
    });
  });
}

function playSound(type, volume = 0.15) {
  if (!soundEnabled || !audioCtx) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  gain.gain.setValueAtTime(volume, now);

  if (type === 'blip') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  } else if (type === 'click') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
  } else if (type === 'powerup') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(330, now + 0.08);
    osc.frequency.setValueAtTime(440, now + 0.16);
    osc.frequency.setValueAtTime(660, now + 0.24);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.4);
  } else if (type === 'win') {
    osc.type = 'triangle';
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const noteOsc = audioCtx.createOscillator();
      const noteGain = audioCtx.createGain();
      noteOsc.type = 'triangle';
      noteOsc.frequency.setValueAtTime(freq, now + i * 0.1);
      noteGain.gain.setValueAtTime(volume, now + i * 0.1);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.18);
      noteOsc.connect(noteGain);
      noteGain.connect(audioCtx.destination);
      noteOsc.start(now + i * 0.1);
      noteOsc.stop(now + (i + 1) * 0.18);
    });
  }
}

/* ==========================================================================
   2. HEADER & NAVIGATION
   ========================================================================== */
function initHeaderScroll() {
  const header = document.querySelector('.main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

function initMobileMenu() {
  const toggle = document.querySelector('.mobile-toggle');
  const nav = document.querySelector('.nav-menu');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    const isOpen = nav.classList.contains('open');
    toggle.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
    });
  });
}

/* ==========================================================================
   3. GRAIL VAULT FILTER & SEARCH
   ========================================================================== */
const VAULT_DATA = [
  {
    id: 1,
    title: "1994 Ultimate Avengers & Classic Comic Slabs",
    category: "comics",
    condition: "CGC 9.6 NM+",
    price: "$285",
    numericPrice: 285,
    tag: "GRAIL SLAB",
    tagClass: "badge-pink",
    image: "assets/images/funko_comics.jpg",
    desc: "Key collector issue in museum-grade UV sealed case. Features classic cover art and pristine page quality from a private Long Island estate."
  },
  {
    id: 2,
    title: "Vintage Marvel Funko Pop Grails: Stan Lee & Sylvie",
    category: "funkos",
    condition: "Vaulted / Mint 10",
    price: "$145",
    numericPrice: 145,
    tag: "VAULTED",
    tagClass: "badge-gold",
    image: "assets/images/funko_comics.jpg",
    desc: "Authentic original production run with official convention stickers and heavy-duty pop armor casing included."
  },
  {
    id: 3,
    title: "Retro 90s Spider-Man Action Figures & Corgi Diecast",
    category: "figures",
    condition: "Original Carded / Near Mint",
    price: "$195",
    numericPrice: 195,
    tag: "HOLY GRAIL",
    tagClass: "badge-lime",
    image: "assets/images/figures_collectibles.jpg",
    desc: "Authentic 90s Spider-Man adventure vehicles, Corgi diecast editions, and Marvel hero figures in collector-grade display condition."
  },
  {
    id: 4,
    title: "Vintage 90s Starter & Streetwear Bomber Jackets",
    category: "clothing",
    condition: "Vintage 1994 / Mint",
    price: "$120",
    numericPrice: 120,
    tag: "1-OF-1 VINTAGE",
    tagClass: "badge-neon",
    image: "assets/images/storefront.jpg",
    desc: "Authentic single-stitch heavyweight vintage jackets and vintage tees hand-picked from New York storage archives."
  },
  {
    id: 5,
    title: "Marvel Avengers Groot & Taskmaster Exclusive Pops",
    category: "funkos",
    condition: "Mint In Box",
    price: "$65",
    numericPrice: 65,
    tag: "HOT DROP",
    tagClass: "badge-pink",
    image: "assets/images/funko_comics.jpg",
    desc: "Exclusive retailer stickers, window box in flawless 9.5+ condition. Ready for display in your Marvel collection."
  },
  {
    id: 6,
    title: "Vintage NY Sports Memorabilia & Pennants",
    category: "sports",
    condition: "Authentic 80s/90s",
    price: "$175",
    numericPrice: 175,
    tag: "NY HERITAGE",
    tagClass: "badge-gold",
    image: "assets/images/storefront.jpg",
    desc: "Classic New York Knicks, Mets, and Yankees apparel, vintage pins, signed cards, and authentic stadium memorabilia."
  },
  {
    id: 7,
    title: "Batman, Joker & DC Graphic Novel Showcase Slabs",
    category: "comics",
    condition: "Graded Near Mint",
    price: "$210",
    numericPrice: 210,
    tag: "KEY ISSUE",
    tagClass: "badge-lime",
    image: "assets/images/funko_comics.jpg",
    desc: "Iconic Joker 'Kill You' tribute foil editions, Green Lantern, and DC vintage archive issues carefully preserved."
  },
  {
    id: 8,
    title: "Vintage Pez Superhero Dispensers & Marvel Batmobiles",
    category: "figures",
    condition: "Collectible Shelf Set",
    price: "$88",
    numericPrice: 88,
    tag: "RETRO TOY",
    tagClass: "badge-neon",
    image: "assets/images/figures_collectibles.jpg",
    desc: "Original 90s Spider-Man Pez heads, diecast speedsters, and superhero desk displays all preserved intact."
  },
  {
    id: 9,
    title: "Original Vinyl LP Records & Retro Store Collectibles",
    category: "vinyl",
    condition: "VG+ to Mint Slabs",
    price: "$45",
    numericPrice: 45,
    tag: "CRATE GEM",
    tagClass: "badge-gold",
    image: "assets/images/storefront.jpg",
    desc: "Classic rock, 90s hip hop, and nostalgic vinyl records direct from the Lindenhurst crates."
  }
];

function initGrailVault() {
  const container = document.getElementById('vaultGrid');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const searchInput = document.getElementById('vaultSearch');
  if (!container) return;

  function renderVault(category = 'all', searchQuery = '') {
    container.innerHTML = '';

    const filtered = VAULT_DATA.filter(item => {
      const matchCat = (category === 'all') || (item.category === category);
      const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.condition.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
          <i class="fa-solid fa-box-open" style="font-size: 3rem; color: var(--neon-pink); margin-bottom: 1rem;"></i>
          <h3 style="color: #fff;">No Grails Found Matching "${searchQuery}"</h3>
          <p style="color: var(--text-muted);">Try a different keyword or filter category.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'vault-item-card';
      card.innerHTML = `
        <div class="vault-item-media" onclick="openLightbox('${item.image}', '${escapeHtml(item.title)}')">
          <img src="${item.image}" alt="${escapeHtml(item.title)}" loading="lazy">
          <span class="badge ${item.tagClass} item-status-tag">${item.tag}</span>
          <div class="vault-zoom-hint">
            <i class="fa-solid fa-magnifying-glass-plus"></i> Click to Zoom
          </div>
        </div>
        <div class="vault-item-body">
          <div class="vault-item-meta">
            <span class="item-category">${item.category}</span>
            <span class="item-condition">${item.condition}</span>
          </div>
          <h3 class="vault-item-title">${item.title}</h3>
          <p class="vault-item-specs">${item.desc}</p>
          <div class="vault-item-footer">
            <div class="item-price-wrap">
              <span class="price-label">Store Price</span>
              <span class="item-price">${item.price}</span>
            </div>
            <button class="btn btn-outline btn-sm" onclick="openInquiryModal('${escapeHtml(item.title)}', '${item.price}')">
              <i class="fa-solid fa-tag"></i> Hold / Inquire
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-filter');
      const query = searchInput ? searchInput.value : '';
      renderVault(cat, query);
    });
  });

  // Search Input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const activeBtn = document.querySelector('.filter-btn.active');
      const activeCat = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
      renderVault(activeCat, e.target.value);
    });
  }

  // Initial render
  renderVault();
}

function escapeHtml(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

/* ==========================================================================
   4. INTERACTIVE 90S MYSTERY CRATE UNBOXER
   ========================================================================== */
const CRATE_REWARDS = [
  {
    title: "🎉 15% OFF ANY VINTAGE CLOTHING PIECE!",
    code: "WALLYVINTAGE15",
    desc: "Show this code at the checkout counter on Montauk Hwy for 15% off any rack apparel or vintage jacket.",
    badge: "TIER 1 GRAIL DROP"
  },
  {
    title: "⭐ FREE PROTECTIVE COMIC SLEEVE 5-PACK!",
    code: "FREESLEEVES",
    desc: "Upgrade your single issue comics with high-clarity archival poly bags & backing boards.",
    badge: "COLLECTOR PERK"
  },
  {
    title: "⚡ $10 INSTANT CREDIT TOWARDS ANY FUNKO POP VAULT ITEM!",
    code: "FUNKOVAULT10",
    desc: "Valid on any Funko Pop valued at $30 or more. Valid this week in-store.",
    badge: "EPIC POP BONUS"
  },
  {
    title: "🏆 GOLDEN PASS: +25% CASH TRADE-IN BONUS!",
    code: "GOLDTRADE25",
    desc: "Bring your comics, toys, or vintage tees for an extra 25% on top of our regular cash appraisal offer.",
    badge: "LEGENDARY UNLOCK"
  }
];

function initMysteryCrate() {
  const chest = document.getElementById('mysteryChest');
  const triggerBtn = document.getElementById('unboxTriggerBtn');
  const resultBox = document.getElementById('mysteryResult');
  if (!chest || !triggerBtn || !resultBox) return;

  function unbox() {
    chest.classList.add('opening');
    triggerBtn.disabled = true;
    triggerBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Unboxing Crate...';
    playSound('powerup', 0.2);

    setTimeout(() => {
      const randomReward = CRATE_REWARDS[Math.floor(Math.random() * CRATE_REWARDS.length)];
      resultBox.style.display = 'block';
      resultBox.innerHTML = `
        <div class="result-badge">${randomReward.badge}</div>
        <h3 style="color: #fff; margin-bottom: 0.5rem;">${randomReward.title}</h3>
        <p style="color: var(--text-muted); margin-bottom: 1rem;">${randomReward.desc}</p>
        <div>
          <span style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-dim);">Your Secret In-Store Promo Code:</span><br>
          <div class="result-code" id="couponCode">${randomReward.code}</div>
        </div>
        <div style="margin-top: 1rem;">
          <button class="btn btn-cyan btn-sm" onclick="copyCouponCode('${randomReward.code}')">
            <i class="fa-solid fa-copy"></i> Copy Code
          </button>
          <button class="btn btn-outline btn-sm" onclick="resetMysteryCrate()" style="margin-left: 0.5rem;">
            <i class="fa-solid fa-rotate"></i> Spin Again
          </button>
        </div>
      `;
      playSound('win', 0.25);
      triggerBtn.style.display = 'none';
      chest.classList.remove('opening');
    }, 1200);
  }

  chest.addEventListener('click', unbox);
  triggerBtn.addEventListener('click', unbox);
}

window.copyCouponCode = function(code) {
  navigator.clipboard.writeText(code).then(() => {
    showToast(`🎁 Code ${code} copied! Redeem in-store.`);
  });
};

window.resetMysteryCrate = function() {
  const triggerBtn = document.getElementById('unboxTriggerBtn');
  const resultBox = document.getElementById('mysteryResult');
  if (resultBox) resultBox.style.display = 'none';
  if (triggerBtn) {
    triggerBtn.disabled = false;
    triggerBtn.style.display = 'inline-flex';
    triggerBtn.innerHTML = '<i class="fa-solid fa-key"></i> Pop A Mystery Crate!';
  }
};

/* ==========================================================================
   5. TRADE-IN & CASH APPRAISAL ESTIMATOR
   ========================================================================== */
function initTradeEstimator() {
  const radioCards = document.querySelectorAll('.calc-radio-card');
  const countSlider = document.getElementById('itemCountSlider');
  const countDisplay = document.getElementById('itemCountDisplay');
  const cashValDisplay = document.getElementById('estCashValue');
  const creditValDisplay = document.getElementById('estCreditValue');
  const conditionSelect = document.getElementById('conditionSelect');

  if (!countSlider || !cashValDisplay) return;

  let baseValuePerItem = 25; // default for comics

  radioCards.forEach(card => {
    card.addEventListener('click', () => {
      radioCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      baseValuePerItem = parseInt(card.getAttribute('data-base-val'), 10) || 25;
      calculateEstimate();
    });
  });

  if (countSlider && countDisplay) {
    countSlider.addEventListener('input', () => {
      countDisplay.innerText = countSlider.value;
      calculateEstimate();
    });
  }

  if (conditionSelect) {
    conditionSelect.addEventListener('change', calculateEstimate);
  }

  function calculateEstimate() {
    const count = parseInt(countSlider.value, 10) || 1;
    const multiplier = parseFloat(conditionSelect ? conditionSelect.value : '1.0');
    
    // Estimate calculation
    const totalCash = Math.round(count * baseValuePerItem * multiplier);
    const totalCredit = Math.round(totalCash * 1.25); // 25% store credit bonus

    cashValDisplay.innerText = `$${totalCash.toLocaleString()}`;
    creditValDisplay.innerText = `$${totalCredit.toLocaleString()}`;
  }

  calculateEstimate();
}

/* ==========================================================================
   6. REAL-TIME STORE STATUS & HOURS
   ========================================================================== */
function initStoreStatus() {
  const statusBadge = document.getElementById('liveStatusText');
  const todayRowId = 'day-' + new Date().getDay();
  const dayRow = document.getElementById(todayRowId);

  if (dayRow) {
    dayRow.classList.add('today');
  }

  const hour = new Date().getHours();
  const isOpen = (hour >= 10 && hour < 18); // 10 AM to 6 PM typical hours

  if (statusBadge) {
    if (isOpen) {
      statusBadge.innerHTML = '<span class="live-pulse"></span> <strong style="color: var(--neon-lime);">OPEN NOW</strong> (Closes at 6:00 PM)';
    } else {
      statusBadge.innerHTML = '<span class="live-pulse" style="background: var(--neon-pink); box-shadow: 0 0 10px var(--neon-pink);"></span> <strong style="color: var(--neon-pink);">CLOSED NOW</strong> (Opens at 10:00 AM)';
    }
  }
}

/* ==========================================================================
   7. MODALS & LIGHTBOX
   ========================================================================== */
function initModals() {
  // Generic close for all modals
  document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el) {
        closeAllModals();
      }
    });
  });

  // ESC key closes modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });
}

function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.classList.remove('active');
  });
}

window.openInquiryModal = function(title, price) {
  const modal = document.getElementById('inquiryModal');
  const titleField = document.getElementById('inquiryItemTitle');
  const priceField = document.getElementById('inquiryItemPrice');
  if (!modal) return;

  if (titleField) titleField.value = title;
  if (priceField) priceField.value = price;
  modal.classList.add('active');
};

window.openAppraisalModal = function() {
  const modal = document.getElementById('appraisalModal');
  if (modal) modal.classList.add('active');
};

function initLightbox() {
  const lightbox = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  if (!lightbox || !lightboxImg) return;

  window.openLightbox = function(src, caption) {
    lightboxImg.src = src;
    if (lightboxCaption) lightboxCaption.innerText = caption || 'It\'s Wally\'s World Collector Showcase';
    lightbox.classList.add('active');
  };
}

/* ==========================================================================
   8. FORMS & TOAST NOTIFICATION
   ========================================================================== */
function initForms() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      closeAllModals();
      showToast('🚀 Request received! Wally & team will reach out shortly.');
      form.reset();
    });
  });
}

function showToast(msg) {
  let toast = document.getElementById('toastNotice');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotice';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--neon-lime);"></i> <span>${msg}</span>`;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}
