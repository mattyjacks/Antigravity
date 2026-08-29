/**
 * IT'S WALLY'S WORLD - DEMO 2 (High-End Curated Vault & Heritage Gallery)
 * Interactive Script
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initMobileMenu();
  initMagnifierLoupe();
  initGalleryFilter();
  initLocationSwitcher();
  initConsignmentWizard();
  initVipPassGenerator();
  initModals();
  initLightbox();
  initForms();
});

/* ==========================================================================
   1. HEADER SCROLL & MOBILE MENU
   ========================================================================== */
function initHeaderScroll() {
  const header = document.querySelector('.luxe-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

function initMobileMenu() {
  const toggle = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.luxe-nav-menu');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    const isOpen = nav.classList.contains('open');
    toggle.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
  });

  document.querySelectorAll('.luxe-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
    });
  });
}

/* ==========================================================================
   2. INTERACTIVE MAGNIFIER LOUPE (High Detail Inspection)
   ========================================================================== */
function initMagnifierLoupe() {
  const container = document.getElementById('inspectContainer');
  const img = document.getElementById('inspectImg');
  const loupe = document.getElementById('inspectLoupe');
  if (!container || !img || !loupe) return;

  const zoomLevel = 2.4;

  container.addEventListener('mouseenter', () => {
    loupe.style.display = 'block';
    loupe.style.backgroundImage = `url('${img.src}')`;
    loupe.style.backgroundSize = `${img.width * zoomLevel}px ${img.height * zoomLevel}px`;
  });

  container.addEventListener('mouseleave', () => {
    loupe.style.display = 'none';
  });

  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const loupeWidth = loupe.offsetWidth;
    const loupeHeight = loupe.offsetHeight;

    let posX = x - (loupeWidth / 2);
    let posY = y - (loupeHeight / 2);

    // Keep loupe inside container bounds
    if (posX < 0) posX = 0;
    if (posY < 0) posY = 0;
    if (posX > rect.width - loupeWidth) posX = rect.width - loupeWidth;
    if (posY > rect.height - loupeHeight) posY = rect.height - loupeHeight;

    loupe.style.left = `${posX}px`;
    loupe.style.top = `${posY}px`;

    const bgPosX = (x * zoomLevel) - (loupeWidth / 2);
    const bgPosY = (y * zoomLevel) - (loupeHeight / 2);

    loupe.style.backgroundPosition = `-${bgPosX}px -${bgPosY}px`;
  });
}

/* ==========================================================================
   3. CURATED MUSEUM PIECES & GALLERY FILTER
   ========================================================================== */
const CURATED_PIECES = [
  {
    id: 'p1',
    title: '1994 Ultimate Avengers & Marvel Golden Age Slabs',
    discipline: 'comics',
    grade: 'CGC 9.6 NM+',
    provenance: 'Long Island Private Estate',
    price: '$285.00',
    image: 'assets/images/funko_comics.jpg',
    desc: 'Archival UV-sealed slab issue with immaculate cover gloss and unblemished page structure. Certified authentic.'
  },
  {
    id: 'p2',
    title: 'Marvel Funko Vault: Stan Lee & Sylvie Convention Exclusives',
    discipline: 'funkos',
    grade: 'Vaulted Mint 10',
    provenance: 'Official Convention Drop',
    price: '$145.00',
    image: 'assets/images/funko_comics.jpg',
    desc: 'Encased in heavy gauge acrylic Pop Armor with untouched corners and verified hologram verification seals.'
  },
  {
    id: 'p3',
    title: 'Spider-Man Vintage Diecast Vehicles & Toy Biz Action Archives',
    discipline: 'figures',
    grade: 'Archival Near Mint',
    provenance: '1990s Collector Vault',
    price: '$195.00',
    image: 'assets/images/figures_collectibles.jpg',
    desc: 'Original Corgi diecast Spider-Man adventure vehicles, Marvel hero sculptures, and rare Pez dispenser set in collector museum condition.'
  },
  {
    id: 'p4',
    title: '1990s Starter Athletic Outerwear & Archival Single-Stitch Tees',
    discipline: 'apparel',
    grade: 'Grade A Vintage',
    provenance: 'NY Archival Sourcing',
    price: '$160.00',
    image: 'assets/images/storefront.jpg',
    desc: 'Heirloom quality satin bomber jacket, heavyweight single-stitch concert tees, and rare vintage NY athletic apparel.'
  },
  {
    id: 'p5',
    title: 'DC Comics Joker & Batman Showcase Foil Edition Slabs',
    discipline: 'comics',
    grade: 'CGC 9.8 Gem Mint',
    provenance: 'Estate Comic Vault',
    price: '$230.00',
    image: 'assets/images/funko_comics.jpg',
    desc: 'Pristine foil tribute cover, high grade white pages, certified by premier comic grading authority.'
  },
  {
    id: 'p6',
    title: 'Marvel Avengers Groot & Taskmaster Exclusive Figurines',
    discipline: 'funkos',
    grade: 'Flawless Box 9.5+',
    provenance: 'Limited Edition Run',
    price: '$65.00',
    image: 'assets/images/funko_comics.jpg',
    desc: 'Rare retailer exclusive editions with pristine window displays and untouched packaging.'
  }
];

function initGalleryFilter() {
  const container = document.getElementById('curatedGalleryGrid');
  const tabs = document.querySelectorAll('.gallery-tab-btn');
  if (!container) return;

  function render(filter = 'all') {
    container.innerHTML = '';
    const filtered = CURATED_PIECES.filter(p => filter === 'all' || p.discipline === filter);

    filtered.forEach(piece => {
      const card = document.createElement('div');
      card.className = 'gallery-piece-card';
      card.innerHTML = `
        <div class="gallery-piece-media" onclick="openLightbox('${piece.image}', '${escapeHtml(piece.title)}')">
          <img src="${piece.image}" alt="${escapeHtml(piece.title)}" loading="lazy">
          <span class="piece-grade-badge">${piece.grade}</span>
        </div>
        <div class="piece-body">
          <div class="piece-provenance">${piece.provenance}</div>
          <h3 class="piece-title">${piece.title}</h3>
          <p class="piece-desc">${piece.desc}</p>
          <div class="piece-footer">
            <div class="piece-price">${piece.price}</div>
            <button class="btn btn-luxury-outline btn-sm" onclick="openAcquisitionModal('${escapeHtml(piece.title)}', '${piece.price}')">
              Acquire Piece
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      render(tab.getAttribute('data-discipline'));
    });
  });

  render();
}

function escapeHtml(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

/* ==========================================================================
   4. DUAL-LOCATION SWITCHER
   ========================================================================== */
function initLocationSwitcher() {
  const tabBtns = document.querySelectorAll('.loc-tab-btn');
  const panes = document.querySelectorAll('.loc-content-pane');
  if (!tabBtns.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetLoc = btn.getAttribute('data-loc');
      tabBtns.forEach(b => b.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const activePane = document.getElementById(`pane-${targetLoc}`);
      if (activePane) activePane.classList.add('active');
    });
  });
}

/* ==========================================================================
   5. CONSIGNMENT & COLLECTION ACQUISITION WIZARD
   ========================================================================== */
function initConsignmentWizard() {
  const options = document.querySelectorAll('.wizard-select-card');
  options.forEach(card => {
    card.addEventListener('click', () => {
      const parent = card.parentElement;
      parent.querySelectorAll('.wizard-select-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });
}

/* ==========================================================================
   6. VIP COLLECTOR DIGITAL PASS GENERATOR
   ========================================================================== */
function initVipPassGenerator() {
  const nameInput = document.getElementById('vipNameInput');
  const tierSelect = document.getElementById('vipTierSelect');
  const cardName = document.getElementById('vipCardName');
  const cardTier = document.getElementById('vipCardTier');
  const memberNumber = document.getElementById('vipMemberNumber');

  if (!nameInput || !cardName) return;

  // Generate random 8-digit VIP ID
  const randomId = 'WW-' + Math.floor(100000 + Math.random() * 900000);
  if (memberNumber) memberNumber.innerText = randomId;

  nameInput.addEventListener('input', (e) => {
    cardName.innerText = e.target.value.trim() || 'VICTORIA STERLING';
  });

  if (tierSelect && cardTier) {
    tierSelect.addEventListener('change', (e) => {
      cardTier.innerText = e.target.value;
    });
  }
}

window.downloadVipPass = function() {
  showLuxeToast('💎 VIP Pass Created! Take a screenshot or show on your phone at Wally\'s World.');
};

/* ==========================================================================
   7. MODALS & LIGHTBOX
   ========================================================================== */
function initModals() {
  document.querySelectorAll('.luxe-modal-close, .luxe-modal-backdrop').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el) closeLuxeModals();
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLuxeModals();
  });
}

function closeLuxeModals() {
  document.querySelectorAll('.luxe-modal-backdrop').forEach(modal => {
    modal.classList.remove('active');
  });
}

window.openAcquisitionModal = function(title, price) {
  const modal = document.getElementById('acquisitionModal');
  const titleField = document.getElementById('acqPieceTitle');
  const priceField = document.getElementById('acqPiecePrice');
  if (!modal) return;

  if (titleField) titleField.value = title;
  if (priceField) priceField.value = price;
  modal.classList.add('active');
};

window.openConsignmentModal = function() {
  const modal = document.getElementById('consignmentModal');
  if (modal) modal.classList.add('active');
};

function initLightbox() {
  const lightbox = document.getElementById('luxeLightbox');
  const lightboxImg = document.getElementById('luxeLightboxImg');
  const lightboxCaption = document.getElementById('luxeLightboxCaption');
  if (!lightbox || !lightboxImg) return;

  window.openLightbox = function(src, caption) {
    lightboxImg.src = src;
    if (lightboxCaption) lightboxCaption.innerText = caption || 'It\'s Wally\'s World Curated Archive';
    lightbox.classList.add('active');
  };
}

/* ==========================================================================
   8. FORMS & LUXE TOAST
   ========================================================================== */
function initForms() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      closeLuxeModals();
      showLuxeToast('✦ Consultation request transmitted. Wally\'s curation team will contact you.');
      form.reset();
    });
  });
}

function showLuxeToast(msg) {
  let toast = document.getElementById('luxeToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'luxeToast';
    toast.className = 'luxe-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fa-solid fa-gem" style="color: var(--gold-primary);"></i> <span>${msg}</span>`;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4500);
}
