// Stripe Payment Integration for Date & Maple Café

// Stripe configuration
const STRIPE_PUBLIC_KEY = 'pk_test_51234567890abcdef'; // Replace with your actual Stripe public key
let stripe = null;
let cardElement = null;
let applePayButton = null;
let googlePayButton = null;

// Initialize Stripe when the page loads
document.addEventListener('DOMContentLoaded', function() {
    if (typeof Stripe !== 'undefined' && STRIPE_PUBLIC_KEY.startsWith('pk_')) {
        initializeStripe();
        initializeExpressPayments();
    } else {
        console.warn('Stripe not loaded or public key not configured properly');
    }
});

function initializeStripe() {
    try {
        stripe = Stripe(STRIPE_PUBLIC_KEY);
        console.log('Stripe initialized successfully');
    } catch (error) {
        console.error('Error initializing Stripe:', error);
        showNotification('Payment system temporarily unavailable. Please select cash payment.', 'error');
    }
}

function initializeStripeElements() {
    if (!stripe) {
        console.error('Stripe not initialized');
        return;
    }

    const elements = stripe.elements();

    // Create card element
    cardElement = elements.create('card', {
        style: {
            base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                    color: '#aab7c4',
                },
                fontFamily: 'Inter, sans-serif',
                padding: '12px',
            },
            invalid: {
                color: '#dc3545',
            },
        },
    });

    // Mount card element
    const cardElementContainer = document.getElementById('card-element');
    if (cardElementContainer) {
        cardElement.mount('#card-element');

        // Handle real-time validation errors from the card Element
        cardElement.on('change', function(event) {
            const cardErrors = document.getElementById('card-errors');
            if (event.error) {
                cardErrors.textContent = event.error.message;
            } else {
                cardErrors.textContent = '';
            }
        });

        // Show/hide card section based on payment method selection
        setupPaymentMethodToggle();

        window.cardElement = cardElement; // Store reference globally
    }
}

async function processStripePayment(formData) {
    if (!stripe || !cardElement) {
        throw new Error('Stripe not properly initialized');
    }
    
    const cartData = getCartData();
    const amount = Math.round(cartData.total * 100); // Convert to cents
    
    try {
        // Create payment intent
        const paymentIntent = await createPaymentIntent(amount, formData);
        
        if (!paymentIntent.client_secret) {
            throw new Error('Failed to create payment intent');
        }
        
        // Confirm payment with Stripe
        const result = await stripe.confirmCardPayment(paymentIntent.client_secret, {
            payment_method: {
                card: cardElement,
                billing_details: {
                    name: `${formData.get('firstName')} ${formData.get('lastName')}`,
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                },
            }
        });
        
        if (result.error) {
            // Payment failed
            throw new Error(result.error.message);
        } else {
            // Payment succeeded
            await handleSuccessfulPayment(result.paymentIntent, formData);
        }
        
    } catch (error) {
        console.error('Payment error:', error);
        throw error;
    }
}

async function createPaymentIntent(amount, formData) {
    // In a real application, this would be a call to your backend
    // For demo purposes, we'll simulate the payment intent creation
    
    return new Promise((resolve, reject) => {
        // Simulate API call delay
        setTimeout(() => {
            // In development/demo mode, we'll simulate a successful response
            if (amount > 0) {
                resolve({
                    client_secret: `pi_demo_${Date.now()}_secret_demo`,
                    amount: amount,
                    currency: 'usd'
                });
            } else {
                reject(new Error('Invalid amount'));
            }
        }, 1000);
    });
}

async function handleSuccessfulPayment(paymentIntent, formData) {
    const cartData = getCartData();
    
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
        paymentIntent: {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount
        },
        specialInstructions: formData.get('specialInstructions'),
        status: 'confirmed',
        timestamp: new Date().toISOString()
    };
    
    // Save order locally
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(orderData);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Show success message
    showOrderConfirmation(orderData);
    
    // Clear cart and close modal
    clearCart();
    closeCheckoutModal();
    
    // Send confirmation email (simulate)
    await sendOrderConfirmation(orderData);
}

async function sendOrderConfirmation(orderData) {
    // In a real application, this would trigger an email to the customer
    console.log('Order confirmation email would be sent to:', orderData.customerInfo.email);
    console.log('Order details:', orderData);
    
    // Simulate email sending
    return new Promise(resolve => {
        setTimeout(() => {
            console.log('Confirmation email sent successfully');
            resolve();
        }, 500);
    });
}

// Webhook handler for Stripe events (this would be on your backend)
function handleStripeWebhook(event) {
    switch (event.type) {
        case 'payment_intent.succeeded':
            console.log('Payment succeeded:', event.data.object);
            // Update order status in database
            break;
        case 'payment_intent.payment_failed':
            console.log('Payment failed:', event.data.object);
            // Handle failed payment
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
}

// Utility functions for payment processing
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function validatePaymentAmount(amount) {
    return amount > 0 && amount <= 999999; // Max $9,999.99
}

// Error handling for payment failures
function handlePaymentError(error) {
    let message = 'Payment failed. Please try again.';
    
    if (error.code) {
        switch (error.code) {
            case 'card_declined':
                message = 'Your card was declined. Please try a different payment method.';
                break;
            case 'expired_card':
                message = 'Your card has expired. Please use a different card.';
                break;
            case 'insufficient_funds':
                message = 'Insufficient funds. Please try a different payment method.';
                break;
            case 'incorrect_cvc':
                message = 'Your card\\'s security code is incorrect.';
                break;
            case 'processing_error':
                message = 'An error occurred while processing your card. Please try again.';
                break;
            default:
                message = error.message || 'An error occurred while processing your payment.';
        }
    }
    
    showNotification(message, 'error');
}

// Payment method validation
function validatePaymentMethod() {
    const paymentMethod = document.querySelector('input[name=\"paymentMethod\"]:checked');
    if (!paymentMethod) {
        throw new Error('Please select a payment method');
    }
    
    if (paymentMethod.value === 'card' && !cardElement) {
        throw new Error('Card payment method not available');
    }
    
    return paymentMethod.value;
}

// Demo/Development helpers
function simulatePaymentSuccess() {
    // For testing purposes only
    console.log('Simulating successful payment...');
    const mockPaymentIntent = {
        id: `pi_demo_${Date.now()}`,
        status: 'succeeded',
        amount: Math.round(getCartData().total * 100)
    };
    
    const mockFormData = new FormData();
    mockFormData.set('firstName', 'Test');
    mockFormData.set('lastName', 'Customer');
    mockFormData.set('email', 'test@example.com');
    mockFormData.set('phone', '555-0123');
    mockFormData.set('specialInstructions', 'Test order');
    
    handleSuccessfulPayment(mockPaymentIntent, mockFormData);
}

function simulatePaymentFailure() {
    // For testing purposes only
    console.log('Simulating payment failure...');
    handlePaymentError({
        code: 'card_declined',
        message: 'Your card was declined.'
    });
}

// Export functions for testing (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeStripe,
        processStripePayment,
        handlePaymentError,
        validatePaymentMethod,
        formatCurrency,
        validatePaymentAmount
    };
}