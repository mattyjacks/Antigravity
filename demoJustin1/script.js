/**
 * Singson Hotdogs - Interactive JavaScript
 * Chef Justin Singson's Restaurant Experience
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // 1. Navigation Scroll Effect
    // -------------------------------------------------------------
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // -------------------------------------------------------------
    // 2. Mobile Menu Toggle
    // -------------------------------------------------------------
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navLinkItems = document.querySelectorAll('.nav-links a');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    navLinkItems.forEach(item => {
        item.addEventListener('click', () => {
            if (hamburger) hamburger.classList.remove('active');
            if (navLinks) navLinks.classList.remove('active');
        });
    });

    // -------------------------------------------------------------
    // 3. Menu Filtering
    // -------------------------------------------------------------
    const filterButtons = document.querySelectorAll('.menu-tab-btn');
    const menuCards = document.querySelectorAll('.menu-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active from all, add to this one
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const category = button.getAttribute('data-filter');

            menuCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                if (category === 'all' || cardCategory === category) {
                    card.style.display = 'flex';
                    // Trigger a tiny animation re-run
                    card.style.animation = 'none';
                    card.offsetHeight; // trigger reflow
                    card.style.animation = null;
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // -------------------------------------------------------------
    // 4. Shopping Cart State & Management
    // -------------------------------------------------------------
    let cart = [];
    const cartBadge = document.querySelector('.cart-badge');
    const cartItemsContainer = document.querySelector('.cart-items');
    const subtotalEl = document.getElementById('subtotal-price');
    const totalEl = document.getElementById('total-price');
    const cartEmptyMsg = document.querySelector('.cart-empty-msg');
    const cartTotals = document.querySelector('.cart-totals');
    const btnCheckout = document.querySelector('.btn-checkout');

    // Load initial cart layout
    updateCartUI();

    function addToCart(item) {
        cart.push(item);
        updateCartUI();
        showAlert('Added to Order!', `${item.name} has been added to your basket.`);
    }

    function removeFromCart(index) {
        const removedItem = cart[index];
        cart.splice(index, 1);
        updateCartUI();
        showAlert('Removed!', `${removedItem.name} removed from your basket.`);
    }

    function updateCartUI() {
        // Update Badge
        if (cartBadge) {
            cartBadge.textContent = cart.length;
            cartBadge.style.display = cart.length > 0 ? 'flex' : 'none';
        }

        // Update items list
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = '';
            
            if (cart.length === 0) {
                if (cartEmptyMsg) cartEmptyMsg.style.display = 'block';
                if (cartTotals) cartTotals.style.display = 'none';
                if (btnCheckout) btnCheckout.setAttribute('disabled', 'true');
            } else {
                if (cartEmptyMsg) cartEmptyMsg.style.display = 'none';
                if (cartTotals) cartTotals.style.display = 'block';
                if (btnCheckout) btnCheckout.removeAttribute('disabled');

                let subtotal = 0;

                cart.forEach((item, index) => {
                    subtotal += item.price;
                    
                    const itemEl = document.createElement('div');
                    itemEl.classList.add('cart-item');
                    itemEl.innerHTML = `
                        <div class="cart-item-info">
                            <h5>${item.name}</h5>
                            <p>${item.details || ''}</p>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <span class="cart-item-price">₱${item.price}</span>
                            <button class="cart-item-remove" data-index="${index}">&times;</button>
                        </div>
                    `;
                    cartItemsContainer.appendChild(itemEl);
                });

                // Attach remove click events
                const removeBtns = cartItemsContainer.querySelectorAll('.cart-item-remove');
                removeBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const index = parseInt(e.target.getAttribute('data-index'));
                        removeFromCart(index);
                    });
                });

                // Calculations
                const deliveryFee = 50; // PHP 50 delivery fee
                if (subtotalEl) subtotalEl.textContent = `₱${subtotal}`;
                if (totalEl) totalEl.textContent = `₱${subtotal + deliveryFee}`;
            }
        }
    }

    // Add standard items from the menu
    const menuAddButtons = document.querySelectorAll('.btn-add-cart');
    menuAddButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.menu-card');
            const name = card.querySelector('.menu-card-title').textContent;
            const priceText = card.querySelector('.menu-card-price').textContent;
            const price = parseInt(priceText.replace('₱', ''));
            const desc = card.querySelector('.menu-card-desc').textContent;

            addToCart({
                name: name,
                price: price,
                details: desc.substring(0, 45) + (desc.length > 45 ? '...' : '')
            });
        });
    });

    // -------------------------------------------------------------
    // 5. Custom Hotdog Builder Visualizer
    // -------------------------------------------------------------
    const builderForm = document.getElementById('dog-builder-form');
    const visualSausage = document.querySelector('.v-sausage');
    const visualSauces = document.querySelectorAll('.v-sauce');
    const visualToppings = document.querySelectorAll('.v-topping');
    const customDogNameEl = document.querySelector('.visualizer-dog-name');
    const customPriceEl = document.getElementById('custom-dog-price');
    const btnAddCustom = document.getElementById('btn-add-custom');

    if (builderForm) {
        builderForm.addEventListener('change', updateBuilderVisuals);
    }

    function updateBuilderVisuals() {
        if (!builderForm) return;

        // 1. Base Sausage
        const selectedBaseInput = builderForm.querySelector('input[name="sausage-base"]:checked');
        const baseName = selectedBaseInput.getAttribute('data-name');
        const basePrice = parseInt(selectedBaseInput.value);
        const baseClass = selectedBaseInput.id; // e.g., 'longganisa', 'wagyu', 'beef'

        // Reset and apply sausage styles
        visualSausage.className = 'visual-element v-sausage';
        if (baseClass === 'longganisa') {
            visualSausage.classList.add('longganisa');
        } else if (baseClass === 'wagyu') {
            visualSausage.classList.add('wagyu');
        }

        // 2. Sauces
        const selectedSauces = builderForm.querySelectorAll('input[name="sauce"]:checked');
        let sauceNames = [];
        let saucePrice = 0;

        // Reset visual sauces
        visualSauces.forEach(vs => vs.classList.remove('active'));

        selectedSauces.forEach(input => {
            sauceNames.push(input.getAttribute('data-name'));
            saucePrice += parseInt(input.value);
            // Activate corresponding visual sauce
            const sauceId = input.id; // e.g., 'ketchup', 'mustard', 'garlic-aioli'
            const visualSauceEl = document.querySelector(`.v-sauce.${sauceId}`);
            if (visualSauceEl) visualSauceEl.classList.add('active');
        });

        // 3. Toppings
        const selectedToppings = builderForm.querySelectorAll('input[name="topping"]:checked');
        let toppingNames = [];
        let toppingPrice = 0;

        // Reset visual toppings
        visualToppings.forEach(vt => vt.classList.remove('active'));

        selectedToppings.forEach(input => {
            toppingNames.push(input.getAttribute('data-name'));
            toppingPrice += parseInt(input.value);
            // Activate corresponding visual topping
            const toppingId = input.id;
            const visualToppingEl = document.querySelector(`.v-topping.${toppingId}`);
            if (visualToppingEl) visualToppingEl.classList.add('active');
        });

        // Update Option Card style toggling
        const allOptionInputs = builderForm.querySelectorAll('input');
        allOptionInputs.forEach(input => {
            const card = input.closest('.option-card');
            if (card) {
                if (input.checked) {
                    card.classList.add('selected');
                } else {
                    card.classList.remove('selected');
                }
            }
        });

        // Calculate Totals
        const grandTotal = basePrice + saucePrice + toppingPrice;
        if (customPriceEl) customPriceEl.textContent = grandTotal;

        // Create descriptive name
        let dogTitle = `${baseName} Dog`;
        if (toppingNames.length > 0) {
            dogTitle += ` w/ ${toppingNames[0]}`;
            if (toppingNames.length > 1) dogTitle += ' & Co.';
        } else if (sauceNames.length > 0) {
            dogTitle += ` w/ ${sauceNames[0]}`;
        }
        if (customDogNameEl) customDogNameEl.textContent = dogTitle;
    }

    // Add Custom Dog to Cart
    if (btnAddCustom) {
        btnAddCustom.addEventListener('click', () => {
            if (!builderForm) return;

            const selectedBaseInput = builderForm.querySelector('input[name="sausage-base"]:checked');
            const baseName = selectedBaseInput.getAttribute('data-name');
            const basePrice = parseInt(selectedBaseInput.value);

            const selectedSauces = builderForm.querySelectorAll('input[name="sauce"]:checked');
            let sauceNames = [];
            let saucePrice = 0;
            selectedSauces.forEach(input => {
                sauceNames.push(input.getAttribute('data-name'));
                saucePrice += parseInt(input.value);
            });

            const selectedToppings = builderForm.querySelectorAll('input[name="topping"]:checked');
            let toppingNames = [];
            let toppingPrice = 0;
            selectedToppings.forEach(input => {
                toppingNames.push(input.getAttribute('data-name'));
                toppingPrice += parseInt(input.value);
            });

            const totalPrice = basePrice + saucePrice + toppingPrice;
            const dogTitle = customDogNameEl ? customDogNameEl.textContent : "Custom Singson Dog";

            // Formulation of details string
            let details = `Base: ${baseName}`;
            if (sauceNames.length > 0) details += ` | Sauces: ${sauceNames.join(', ')}`;
            if (toppingNames.length > 0) details += ` | Toppings: ${toppingNames.join(', ')}`;

            addToCart({
                name: dogTitle,
                price: totalPrice,
                details: details
            });

            // Reset checkboxes/inputs back to standard settings
            builderForm.reset();
            // Trigger UI update to redraw standard state
            updateBuilderVisuals();
        });
    }

    // -------------------------------------------------------------
    // 6. Checkout Order
    // -------------------------------------------------------------
    if (btnCheckout) {
        btnCheckout.addEventListener('click', () => {
            if (cart.length === 0) return;

            // Generate an order ID
            const orderId = Math.floor(100000 + Math.random() * 900000);
            
            showAlert('Salamat! Order Placed', `Chef Justin and team are preparing your order. Reference ID: #${orderId}`);
            
            // Clear cart
            cart = [];
            updateCartUI();
        });
    }

    // -------------------------------------------------------------
    // 7. Booking Reservations
    // -------------------------------------------------------------
    const reservationForm = document.getElementById('reservation-form');
    if (reservationForm) {
        reservationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('res-name').value;
            const date = document.getElementById('res-date').value;
            const time = document.getElementById('res-time').value;
            const guests = document.getElementById('res-guests').value;

            showAlert('Table Reserved!', `Maraming salamat ${name}. Your table for ${guests} on ${date} at ${time} is secured.`);
            
            reservationForm.reset();
        });
    }

    // -------------------------------------------------------------
    // 8. Custom Alerts System
    // -------------------------------------------------------------
    const alertPopup = document.querySelector('.alert-popup');
    const alertTitle = alertPopup.querySelector('h4');
    const alertDesc = alertPopup.querySelector('p');
    let alertTimeout;

    function showAlert(title, message) {
        if (!alertPopup) return;

        // Clear existing timeout
        clearTimeout(alertTimeout);

        alertTitle.textContent = title;
        alertDesc.textContent = message;
        alertPopup.classList.add('show');

        // Sound effect (simulated visual or console)
        console.log(`[ALERT] ${title} - ${message}`);

        alertTimeout = setTimeout(() => {
            alertPopup.classList.remove('show');
        }, 4000);
    }
});
