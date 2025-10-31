// Enhanced Payment Integration for Date & Maple Café
// Supports Apple Pay, Google Pay, Credit Cards, and Cash payments

// Initialize Enhanced Payment Methods
document.addEventListener('DOMContentLoaded', function() {
    initializeEnhancedPayments();
});

function initializeEnhancedPayments() {
    initializeApplePay();
    initializeGooglePay();
    setupPaymentMethodToggle();
    setupCheckoutFormEnhancement();
    setupCardInputFormatting();
}

// Apple Pay Integration
function initializeApplePay() {
    const applePayButtonElement = document.getElementById('apple-pay-button');
    if (!applePayButtonElement) return;

    // For demo purposes, show Apple Pay button on all devices (in production, check for actual availability)
    // if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
        applePayButtonElement.style.display = 'flex';
        applePayButtonElement.addEventListener('click', handleApplePay);
    // } else {
    //     console.log('Apple Pay not available on this device');
    // }
}

// Google Pay Integration
function initializeGooglePay() {
    const googlePayButtonElement = document.getElementById('google-pay-button');
    if (!googlePayButtonElement) return;

    // For demo purposes, show Google Pay button
    googlePayButtonElement.style.display = 'flex';
    googlePayButtonElement.addEventListener('click', handleGooglePay);
}

// Handle Apple Pay payment
async function handleApplePay() {
    try {
        showNotification('Processing Apple Pay payment...', 'info');

        const cartData = getCartDataFromStorage();
        if (!cartData || cartData.total <= 0) {
            throw new Error('Your cart is empty');
        }

        // Simulate Apple Pay processing
        setTimeout(async () => {
            const mockPaymentIntent = {
                id: `pi_applepay_${Date.now()}`,
                status: 'succeeded',
                amount: Math.round(cartData.total * 100)
            };

            await handleExpressPaymentSuccess(mockPaymentIntent, 'apple_pay');
        }, 2000);
    } catch (error) {
        console.error('Apple Pay error:', error);
        showNotification(error.message || 'Apple Pay payment failed', 'error');
    }
}

// Handle Google Pay payment
async function handleGooglePay() {
    try {
        showNotification('Processing Google Pay payment...', 'info');

        const cartData = getCartDataFromStorage();
        if (!cartData || cartData.total <= 0) {
            throw new Error('Your cart is empty');
        }

        // Simulate Google Pay processing
        setTimeout(async () => {
            const mockPaymentIntent = {
                id: `pi_googlepay_${Date.now()}`,
                status: 'succeeded',
                amount: Math.round(cartData.total * 100)
            };

            await handleExpressPaymentSuccess(mockPaymentIntent, 'google_pay');
        }, 2000);
    } catch (error) {
        console.error('Google Pay error:', error);
        showNotification(error.message || 'Google Pay payment failed', 'error');
    }
}

// Handle successful express payment (Apple Pay / Google Pay)
async function handleExpressPaymentSuccess(paymentIntent, paymentMethod) {
    const cartData = getCartDataFromStorage();

    const orderData = {
        id: Date.now().toString(),
        customerInfo: {
            firstName: paymentMethod === 'apple_pay' ? 'Apple Pay' : 'Google Pay',
            lastName: 'Customer',
            email: 'customer@example.com',
            phone: '555-0123'
        },
        cart: cartData,
        paymentMethod: paymentMethod,
        paymentIntent: {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount
        },
        specialInstructions: '',
        status: 'confirmed',
        timestamp: new Date().toISOString()
    };

    // Save order
    await saveOrderAndNotify(orderData, paymentMethod);
}

// Setup payment method toggle functionality
function setupPaymentMethodToggle() {
    const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
    const cardPaymentSection = document.getElementById('cardPaymentSection');

    if (!cardPaymentSection) return;

    paymentMethodRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'card') {
                cardPaymentSection.style.display = 'block';
                // Try to initialize Stripe elements, show fallback form if unavailable
                setTimeout(() => {
                    initializeCardPaymentForm();
                }, 100);
            } else {
                cardPaymentSection.style.display = 'none';
            }
        });
    });

    // Set initial state
    const checkedRadio = document.querySelector('input[name="paymentMethod"]:checked');
    if (checkedRadio && checkedRadio.value === 'card') {
        cardPaymentSection.style.display = 'block';
        // Initialize card payment form
        setTimeout(() => {
            initializeCardPaymentForm();
        }, 100);
    } else {
        cardPaymentSection.style.display = 'none';
    }
}

// Enhanced checkout form handling
function setupCheckoutFormEnhancement() {
    const checkoutForm = document.getElementById('checkoutForm');
    if (!checkoutForm) return;

    checkoutForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const paymentMethod = formData.get('paymentMethod');

        try {
            // Show loading state
            const submitBtn = this.querySelector('.checkout-submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Processing...';
            submitBtn.disabled = true;

            switch (paymentMethod) {
                case 'card':
                    await processCardPayment(formData);
                    break;

                case 'cash':
                    await processCashPayment(formData);
                    break;

                default:
                    throw new Error('Please select a payment method');
            }

        } catch (error) {
            console.error('Payment error:', error);
            showNotification(error.message || 'Payment failed. Please try again.', 'error');

            // Reset button state
            const submitBtn = this.querySelector('.checkout-submit-btn');
            submitBtn.textContent = 'Place Order';
            submitBtn.disabled = false;
        }
    });
}

// Process card payment
async function processCardPayment(formData) {
    // Check if Stripe is initialized and card element exists
    if (typeof processStripePayment === 'function' && window.cardElement) {
        // Use existing Stripe payment processing
        await processStripePayment(formData);
    } else {
        // Fallback - simulate card payment for demo
        const cartData = getCartDataFromStorage();

        if (!cartData || cartData.total <= 0) {
            throw new Error('Your cart is empty');
        }

        // Simulate card processing
        showNotification('Processing card payment...', 'info');

        await new Promise(resolve => setTimeout(resolve, 2000));

        const mockPaymentIntent = {
            id: `pi_card_${Date.now()}`,
            status: 'succeeded',
            amount: Math.round(cartData.total * 100)
        };

        const orderData = {
            id: Date.now().toString(),
            customerInfo: {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone')
            },
            cart: cartData,
            paymentMethod: 'card',
            paymentIntent: mockPaymentIntent,
            specialInstructions: formData.get('specialInstructions'),
            status: 'confirmed',
            timestamp: new Date().toISOString()
        };

        await saveOrderAndNotify(orderData, 'card');
    }
}

// Process cash payment
async function processCashPayment(formData) {
    const cartData = getCartDataFromStorage();

    if (!cartData || cartData.total <= 0) {
        throw new Error('Your cart is empty');
    }

    const orderData = {
        id: Date.now().toString(),
        customerInfo: {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone')
        },
        cart: cartData,
        paymentMethod: 'cash',
        specialInstructions: formData.get('specialInstructions'),
        status: 'pending_payment',
        timestamp: new Date().toISOString()
    };

    await saveOrderAndNotify(orderData, 'cash');
}

// Get cart data from localStorage
function getCartDataFromStorage() {
    try {
        return JSON.parse(localStorage.getItem('cart') || '{"items": [], "total": 0}');
    } catch (error) {
        console.error('Error parsing cart data:', error);
        return {"items": [], "total": 0};
    }
}

// Save order and show notifications
async function saveOrderAndNotify(orderData, paymentMethod) {
    try {
        // Save order locally
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.push(orderData);
        localStorage.setItem('orders', JSON.stringify(orders));

        // Send to server
        await sendOrderToServer(orderData);

        // Show success message
        const paymentName = getPaymentMethodName(paymentMethod);
        const message = paymentMethod === 'cash'
            ? `Order #${orderData.id} confirmed! Pay when you collect your order.`
            : `Payment successful via ${paymentName}! Order #${orderData.id} confirmed.`;

        showNotification(message, 'success');

        // Clear cart and close modal
        clearCartAndCloseModal();

        // Send confirmation email
        await sendOrderConfirmationEmail(orderData);

    } catch (error) {
        console.error('Error saving order:', error);
        throw new Error('Failed to process order. Please try again.');
    }
}

// Send order to server
async function sendOrderToServer(orderData) {
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            throw new Error('Failed to save order');
        }

        console.log('Order saved to server successfully');
    } catch (error) {
        console.error('Server error:', error);
        // Don't throw here - we still want to show success to user
    }
}

// Send order confirmation email
async function sendOrderConfirmationEmail(orderData) {
    try {
        const response = await fetch('/api/send-confirmation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: orderData.customerInfo.email,
                orderData: orderData
            })
        });

        if (response.ok) {
            console.log('Confirmation email sent successfully');
        }
    } catch (error) {
        console.error('Email sending error:', error);
        // Don't show error to user for email issues
    }
}

// Clear cart and close modal
function clearCartAndCloseModal() {
    // Clear cart
    if (typeof clearCart === 'function') {
        clearCart();
    } else {
        localStorage.removeItem('cart');
    }

    // Close modal
    if (typeof closeCheckoutModal === 'function') {
        closeCheckoutModal();
    } else {
        const modal = document.getElementById('checkoutModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Get human-readable payment method name
function getPaymentMethodName(paymentMethod) {
    switch (paymentMethod) {
        case 'apple_pay': return 'Apple Pay';
        case 'google_pay': return 'Google Pay';
        case 'card': return 'Credit Card';
        case 'cash': return 'Cash';
        default: return 'Payment';
    }
}

// Show notification (use existing function if available)
function showNotification(message, type = 'info') {
    // Try to use existing notification function
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }

    // Fallback notification
    const notification = document.createElement('div');
    notification.className = `enhanced-notification enhanced-notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;

    // Add styles if not already added
    if (!document.getElementById('enhanced-notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'enhanced-notification-styles';
        styles.textContent = `
            .enhanced-notification {
                position: fixed;
                top: 100px;
                right: 20px;
                background: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                z-index: 1003;
                display: flex;
                align-items: center;
                gap: 10px;
                min-width: 300px;
                animation: slideIn 0.3s ease-out;
            }
            .enhanced-notification-success {
                border-left: 4px solid #28a745;
                color: #155724;
            }
            .enhanced-notification-error {
                border-left: 4px solid #dc3545;
                color: #721c24;
            }
            .enhanced-notification-info {
                border-left: 4px solid #17a2b8;
                color: #0c5460;
            }
            .enhanced-notification button {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                opacity: 0.7;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Initialize card payment form (Stripe or fallback)
function initializeCardPaymentForm() {
    const stripeSection = document.getElementById('stripe-card-section');
    const fallbackSection = document.getElementById('fallback-card-form');

    // Try to use Stripe if available
    if (typeof initializeStripeElements === 'function' && !window.cardElement) {
        try {
            initializeStripeElements();
            if (window.cardElement) {
                stripeSection.style.display = 'block';
                fallbackSection.style.display = 'none';
                return;
            }
        } catch (error) {
            console.log('Stripe not available, using fallback form');
        }
    }

    // Use fallback form
    stripeSection.style.display = 'none';
    fallbackSection.style.display = 'block';
}

// Setup card input formatting for better UX
function setupCardInputFormatting() {
    // Card number formatting
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
            e.target.value = value;
        });
    }

    // Expiry date formatting
    const expiryInput = document.getElementById('expiryDate');
    if (expiryInput) {
        expiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }

    // CVV formatting (numbers only)
    const cvvInput = document.getElementById('cvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }

    // Card name formatting (letters and spaces only)
    const cardNameInput = document.getElementById('cardName');
    if (cardNameInput) {
        cardNameInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
        });
    }
}