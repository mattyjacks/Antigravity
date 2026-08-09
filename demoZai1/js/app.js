// Cart state management
let cart = JSON.parse(localStorage.getItem('zai_cart')) || [];

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    setupMobileMenu();
    setupProductActions();
    setupCartPage();
    setupFilters();
    setupFaqs();
});

// Update cart counter badge
function updateCartCount() {
    const counts = document.querySelectorAll('.cart-count');
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    counts.forEach(countEl => {
        countEl.textContent = totalQty;
        countEl.style.display = totalQty > 0 ? 'flex' : 'none';
    });
}

// Add item to cart
function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    showToast(product.title);
}

function saveCart() {
    localStorage.setItem('zai_cart', JSON.stringify(cart));
    updateCartCount();
}

// Show micro-interaction Toast alert
function showToast(productName) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span class="toast-icon">✓</span> <span class="toast-text"></span>`;
        document.body.appendChild(toast);
    }
    toast.querySelector('.toast-text').textContent = `${productName} added to cart`;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// Mobile navigation menu toggle
function setupMobileMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            nav.classList.toggle('open');
            toggle.innerHTML = nav.classList.contains('open') ? '✕' : '☰';
        });
    }
}

// Setup product listing actions
function setupProductActions() {
    const grid = document.querySelector('.products-grid');
    if (grid) {
        grid.addEventListener('click', (e) => {
            const btn = e.target.closest('.add-to-cart-btn');
            if (btn) {
                e.preventDefault();
                const card = btn.closest('.product-card');
                const product = {
                    id: card.dataset.id,
                    title: card.dataset.name,
                    price: parseFloat(card.dataset.price),
                    category: card.dataset.category,
                    image: card.querySelector('img').getAttribute('src')
                };
                addToCart(product);
            }
        });
    }
}

// Setup Cart page operations
function setupCartPage() {
    const itemsContainer = document.getElementById('cart-items');
    if (!itemsContainer) return;

    renderCartItems();

    itemsContainer.addEventListener('click', (e) => {
        const itemEl = e.target.closest('.cart-item');
        if (!itemEl) return;
        const itemId = itemEl.dataset.id;
        
        if (e.target.closest('.qty-minus')) {
            const item = cart.find(i => i.id === itemId);
            if (item) {
                item.quantity -= 1;
                if (item.quantity <= 0) {
                    cart = cart.filter(i => i.id !== itemId);
                }
                saveCart();
                renderCartItems();
            }
        } else if (e.target.closest('.qty-plus')) {
            const item = cart.find(i => i.id === itemId);
            if (item) {
                item.quantity += 1;
                saveCart();
                renderCartItems();
            }
        } else if (e.target.closest('.cart-item-remove')) {
            cart = cart.filter(i => i.id !== itemId);
            saveCart();
            renderCartItems();
        }
    });

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) return;
            alert('Thank you for shopping with Zai Essentials! Checkout feature is currently simulated.');
            cart = [];
            saveCart();
            renderCartItems();
        });
    }
}

function renderCartItems() {
    const container = document.getElementById('cart-items');
    const orderItemsCount = document.getElementById('order-items-count');
    const orderSubtotal = document.getElementById('order-subtotal');
    const orderTotal = document.getElementById('order-total');
    
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-message">
                <i>🛒</i>
                <h3>Your cart is empty</h3>
                <p>Browse our catalog to add essentials to your life.</p>
                <a href="essentials.html" class="btn btn-primary" style="margin-top: 1.5rem;">Shop Essentials</a>
            </div>
        `;
        if (orderItemsCount) orderItemsCount.textContent = '0 items';
        if (orderSubtotal) orderSubtotal.textContent = '$0.00';
        if (orderTotal) orderTotal.textContent = '$0.00';
        
        const summaryBtn = document.getElementById('checkout-btn');
        if (summaryBtn) summaryBtn.disabled = true;
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <img class="cart-item-img" src="${item.image}" alt="${item.title}">
            <div class="cart-item-info">
                <span class="cart-item-category">${item.category}</span>
                <h4 class="cart-item-title">${item.title}</h4>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
            </div>
            <div class="cart-qty-control">
                <button class="cart-qty-btn qty-minus">−</button>
                <span class="cart-qty-val">${item.quantity}</span>
                <button class="cart-qty-btn qty-plus">+</button>
            </div>
            <button class="cart-item-remove" title="Remove Item">✕</button>
        </div>
    `).join('');

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (orderItemsCount) orderItemsCount.textContent = `${totalQty} item${totalQty !== 1 ? 's' : ''}`;
    if (orderSubtotal) orderSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    if (orderTotal) orderTotal.textContent = `$${subtotal.toFixed(2)}`;

    const summaryBtn = document.getElementById('checkout-btn');
    if (summaryBtn) summaryBtn.disabled = false;
}

// Catalog filter/sorting mechanism
function setupFilters() {
    const sortSelect = document.getElementById('sort-products');
    const grid = document.querySelector('.products-grid');
    if (!sortSelect || !grid) return;

    sortSelect.addEventListener('change', () => {
        const cards = Array.from(grid.querySelectorAll('.product-card'));
        const val = sortSelect.value;

        if (val === 'price-low') {
            cards.sort((a, b) => parseFloat(a.dataset.price) - parseFloat(b.dataset.price));
        } else if (val === 'price-high') {
            cards.sort((a, b) => parseFloat(b.dataset.price) - parseFloat(a.dataset.price));
        } else {
            cards.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name));
        }

        grid.innerHTML = '';
        cards.forEach(card => grid.appendChild(card));
    });
}

// FAQ Accordion
function setupFaqs() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(q => {
        q.addEventListener('click', () => {
            const item = q.parentElement;
            item.classList.toggle('active');
        });
    });
}
