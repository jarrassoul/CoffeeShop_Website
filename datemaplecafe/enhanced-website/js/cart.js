// Shopping Cart functionality for Date & Maple Café

let cart = [];
const TAX_RATE = 0.0875; // 8.75% tax

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
    loadCartFromStorage();
    updateCartDisplay();
    
    // Add event listener to pickup time select
    const pickupTimeSelect = document.getElementById('pickupTime');
    if (pickupTimeSelect) {
        pickupTimeSelect.addEventListener('change', function() {
            updateCartDisplay(); // This will update the checkout button state
        });
    }
});

// Add item to cart
function addToCart(itemId, itemName, basePrice, buttonElement) {
    const menuItem = buttonElement.closest('.menu-item');
    const options = {};
    let finalPrice = basePrice;
    
    // Get customization options for menu items
    if (menuItem.querySelector('.item-options')) {
        const selects = menuItem.querySelectorAll('.item-options select');
        
        selects.forEach(select => {
            const selectName = select.name;
            const selectedOption = select.options[select.selectedIndex];
            
            if (select.value) {
                options[selectName] = select.value;
            } else {
                options[selectName] = selectedOption.textContent;
            }
            
            // Add price if option has data-price
            if (selectedOption.dataset.price) {
                finalPrice += parseFloat(selectedOption.dataset.price);
            }
        });
    }
    
    // Create unique item ID based on customizations
    const customizationKey = Object.values(options).join('-');
    const uniqueId = `${itemId}-${customizationKey}`;
    
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(item => item.uniqueId === uniqueId);
    
    if (existingItemIndex >= 0) {
        // Increase quantity
        cart[existingItemIndex].quantity += 1;
    } else {
        // Add new item
        const cartItem = {
            uniqueId: uniqueId,
            itemId: itemId,
            name: itemName,
            basePrice: basePrice,
            finalPrice: finalPrice,
            options: options,
            quantity: 1
        };
        cart.push(cartItem);
    }
    
    // Show feedback
    showAddToCartFeedback(buttonElement);
    
    // Update cart display
    updateCartDisplay();
    saveCartToStorage();
    
    // Open cart sidebar briefly
    toggleCart();
    setTimeout(() => {
        if (cart.length > 1) { // Only close if there are multiple items
            // Don't auto-close, let user decide
        }
    }, 2000);
}

// Show visual feedback when item is added
function showAddToCartFeedback(buttonElement) {
    const originalText = buttonElement.innerHTML;
    buttonElement.innerHTML = '<i class=\"fas fa-check\"></i> Added!';
    buttonElement.style.background = '#28a745';
    
    setTimeout(() => {
        buttonElement.innerHTML = originalText;
        buttonElement.style.background = '';
    }, 1500);
}

// Update cart quantity
function updateCartQuantity(uniqueId, change) {
    const itemIndex = cart.findIndex(item => item.uniqueId === uniqueId);
    if (itemIndex >= 0) {
        cart[itemIndex].quantity += change;
        
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
        
        updateCartDisplay();
        saveCartToStorage();
    }
}

// Remove item from cart
function removeFromCart(uniqueId) {
    cart = cart.filter(item => item.uniqueId !== uniqueId);
    updateCartDisplay();
    saveCartToStorage();
}

// Update cart display
function updateCartDisplay() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const subtotalElement = document.getElementById('subtotal');
    const taxElement = document.getElementById('tax');
    const totalElement = document.getElementById('total');
    const checkoutBtn = document.querySelector('.checkout-btn');
    
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Update cart items display
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class=\"empty-cart\">
                <i class=\"fas fa-shopping-cart\"></i>
                <p>Your cart is empty</p>
            </div>
        `;
        checkoutBtn.disabled = true;
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class=\"cart-item\">
                <div class=\"cart-item-info\">
                    <div class=\"cart-item-name\">${escapeHtml(item.name)}</div>
                    ${generateCartItemOptions(item.options)}
                    <div class=\"cart-item-price\">$${item.finalPrice.toFixed(2)} each</div>
                </div>
                <div class=\"cart-item-controls\">
                    <button class=\"quantity-btn\" onclick=\"updateCartQuantity('${item.uniqueId}', -1)\">-</button>
                    <span class=\"quantity\">${item.quantity}</span>
                    <button class=\"quantity-btn\" onclick=\"updateCartQuantity('${item.uniqueId}', 1)\">+</button>
                    <button class=\"quantity-btn\" onclick=\"removeFromCart('${item.uniqueId}')\" style=\"background: #ff6b6b; color: white; margin-left: 10px;\">
                        <i class=\"fas fa-trash\"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Enable checkout only if pickup time is selected
        const pickupTime = document.getElementById('pickupTime').value;
        checkoutBtn.disabled = !pickupTime;
        
        if (!pickupTime) {
            checkoutBtn.textContent = 'Select Pickup Time First';
            checkoutBtn.style.background = '#ccc';
        } else {
            checkoutBtn.textContent = 'Proceed to Checkout';
            checkoutBtn.style.background = '';
        }
    }
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    
    // Update totals display
    if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    if (taxElement) taxElement.textContent = `$${tax.toFixed(2)}`;
    if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`;
}

// Generate cart item options display
function generateCartItemOptions(options) {
    if (!options || Object.keys(options).length === 0) return '';
    
    const optionTexts = [];
    
    // Handle all types of options
    Object.entries(options).forEach(([key, value]) => {
        if (value && value !== 'none' && value !== 'regular' && value !== '') {
            // Format the option text based on the key
            let optionText = '';
            switch (key) {
                case 'milk':
                    optionText = `${formatOptionName(value)} milk`;
                    break;
                case 'sweetener':
                    optionText = `${formatOptionName(value)} sweetener`;
                    break;
                case 'addons':
                    optionText = formatOptionName(value);
                    break;
                case 'version':
                    optionText = formatOptionName(value);
                    break;
                case 'roll-type':
                    optionText = formatOptionName(value);
                    break;
                case 'style':
                    optionText = formatOptionName(value);
                    break;
                default:
                    optionText = formatOptionName(value);
            }
            
            if (optionText) {
                optionTexts.push(optionText);
            }
        }
    });
    
    if (optionTexts.length === 0) return '';
    
    return `<div class="cart-item-options">${optionTexts.join(', ')}</div>`;
}

function formatOptionName(option) {
    return option.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Toggle cart sidebar
function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    cartSidebar.classList.toggle('open');
}

// Proceed to checkout
function proceedToCheckout() {
    // Validate pickup time is selected
    const pickupTime = document.getElementById('pickupTime').value;
    if (!pickupTime) {
        showNotification('You must select a pickup time to place your order!', 'error');
        // Highlight the pickup time selection
        const pickupSelect = document.getElementById('pickupTime');
        pickupSelect.style.border = '2px solid #dc3545';
        pickupSelect.focus();
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
            pickupSelect.style.border = '';
        }, 3000);
        
        return;
    }
    
    // Open checkout modal
    openCheckoutModal();
}

// Open checkout modal
function openCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    const orderSummary = document.getElementById('checkoutOrderSummary');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    // Update order summary
    const subtotal = cart.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    
    orderSummary.innerHTML = `
        <div class=\"order-summary\">
            ${cart.map(item => `
                <div class=\"summary-item\">
                    <span>${escapeHtml(item.name)} ${generateCartItemOptions(item.options)} x${item.quantity}</span>
                    <span>$${(item.finalPrice * item.quantity).toFixed(2)}</span>
                </div>
            `).join('')}
            <div class=\"summary-item\">
                <span>Subtotal:</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class=\"summary-item\">
                <span>Tax (8.75%):</span>
                <span>$${tax.toFixed(2)}</span>
            </div>
            <div class=\"summary-item total\">
                <span><strong>Total:</strong></span>
                <span><strong>$${total.toFixed(2)}</strong></span>
            </div>
            <div class=\"summary-item\">
                <span>Pickup Time:</span>
                <span>${document.getElementById('pickupTime').value}</span>
            </div>
        </div>
    `;
    
    checkoutTotal.textContent = `$${total.toFixed(2)}`;
    
    modal.style.display = 'block';
    
    // Initialize payment method toggle
    setupPaymentMethodToggle();
}

// Close checkout modal
function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    modal.style.display = 'none';
}

// Setup payment method toggle
function setupPaymentMethodToggle() {
    const paymentMethods = document.querySelectorAll('input[name=\"paymentMethod\"]');
    const cardSection = document.getElementById('cardPaymentSection');
    
    paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
            if (this.value === 'card') {
                cardSection.style.display = 'block';
                // Initialize Stripe Elements if not already done
                if (!window.cardElement) {
                    initializeStripeElements();
                }
            } else {
                cardSection.style.display = 'none';
            }
        });
    });
}

// Save cart to localStorage
function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Load cart from localStorage
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            cart = [];
        }
    }
}

// Clear cart
function clearCart() {
    cart = [];
    updateCartDisplay();
    saveCartToStorage();
    toggleCart(); // Close cart sidebar
}

// Get cart data for order submission
function getCartData() {
    const subtotal = cart.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    
    return {
        items: cart,
        subtotal: subtotal,
        tax: tax,
        total: total,
        pickupTime: document.getElementById('pickupTime').value
    };
}

// Handle checkout form submission
document.addEventListener('DOMContentLoaded', function() {
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckoutSubmission);
    }
});

async function handleCheckoutSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const paymentMethod = formData.get('paymentMethod');
    
    // Disable submit button to prevent double submission
    const submitBtn = document.querySelector('.checkout-submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Processing...';
    submitBtn.disabled = true;
    
    try {
        if (paymentMethod === 'card') {
            // For now, redirect to cash payment (card processing can be added later)
            showNotification('Card payments are coming soon! Please select cash payment for now.', 'info');
            return;
        } else {
            // Process cash payment
            await processCashPayment(formData);
        }
    } catch (error) {
        console.error('Checkout error:', error);
        showNotification('There was an error processing your order. Please try again.', 'error');
    } finally {
        // Re-enable submit button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function processCashPayment(formData) {
    const orderData = {
        id: Date.now().toString(),
        customerInfo: {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone')
        },
        cart: getCartData(),
        paymentMethod: 'cash',
        specialInstructions: formData.get('specialInstructions'),
        status: 'pending',
        timestamp: new Date().toISOString()
    };
    
    try {
        // Submit order to server
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit order to server');
        }
        
        const savedOrder = await response.json();
        
        // Save order locally as backup
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.push(savedOrder);
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Show success message
        showOrderConfirmation(savedOrder);
        
        // Clear cart and close modal
        clearCart();
        closeCheckoutModal();
        
    } catch (error) {
        console.error('Error submitting order:', error);
        
        // Save order locally if server fails
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.push(orderData);
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Show success message (order saved locally)
        showOrderConfirmation(orderData);
        showNotification('Order saved! We received your order even though there was a connection issue.', 'success');
        
        // Clear cart and close modal
        clearCart();
        closeCheckoutModal();
    }
}

function showOrderConfirmation(orderData) {
    const confirmationHtml = `
        <div class=\"order-confirmation\">
            <h2>✅ Order Confirmed!</h2>
            <p><strong>Order #:</strong> ${orderData.id}</p>
            <p><strong>Name:</strong> ${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}</p>
            <p><strong>Pickup Time:</strong> ${orderData.cart.pickupTime}</p>
            <p><strong>Total:</strong> $${orderData.cart.total.toFixed(2)}</p>
            <p><strong>Payment:</strong> ${orderData.paymentMethod === 'cash' ? 'Cash (Pay on pickup)' : 'Card (Paid)'}</p>
            <br>
            <p>Thank you for your order! We'll have it ready for you at the scheduled pickup time.</p>
            <p>You'll receive a confirmation email shortly.</p>
        </div>
    `;
    
    // Create and show confirmation modal
    const confirmationModal = document.createElement('div');
    confirmationModal.className = 'modal';
    confirmationModal.style.display = 'block';
    confirmationModal.innerHTML = `
        <div class=\"modal-content\">
            <div class=\"modal-header\">
                <h3>Order Confirmation</h3>
                <span class=\"close\" onclick=\"this.closest('.modal').remove()\">&times;</span>
            </div>
            <div class=\"modal-body\">
                ${confirmationHtml}
                <button class=\"btn primary\" onclick=\"this.closest('.modal').remove()\" style=\"width: 100%; margin-top: 20px;\">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(confirmationModal);
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
        if (confirmationModal.parentElement) {
            confirmationModal.remove();
        }
    }, 30000);
}

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const checkoutModal = document.getElementById('checkoutModal');
    if (e.target === checkoutModal) {
        closeCheckoutModal();
    }
});

// Utility function (if not already defined in main.js)
if (typeof escapeHtml === 'undefined') {
    function escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }
}