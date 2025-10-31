// Main JavaScript functionality for Date & Maple Café

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupMenuFiltering();
    setupContactForm();
    setupReviewForm();
    setupHeroButtons();
    loadReviews();
    setupScrollEffects();
}

// Navigation functionality
function setupNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
        });
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^=\"#\"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Menu filtering functionality
function setupMenuFiltering() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    const menuCategories = document.querySelectorAll('.menu-category');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.dataset.category;
            
            // Update active button
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show/hide menu categories
            menuCategories.forEach(categoryDiv => {
                if (category === 'all' || categoryDiv.dataset.category === category) {
                    categoryDiv.style.display = 'block';
                    categoryDiv.classList.add('fade-in');
                } else {
                    categoryDiv.style.display = 'none';
                }
            });
        });
    });
}

// Contact form functionality
function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const contactData = {
                name: formData.get('name'),
                email: formData.get('email'),
                subject: formData.get('subject'),
                message: formData.get('message'),
                timestamp: new Date().toISOString()
            };
            
            // Store contact message locally
            const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
            messages.push(contactData);
            localStorage.setItem('contactMessages', JSON.stringify(messages));
            
            // Show success message
            showNotification('Thank you for your message! We\\'ll get back to you soon.', 'success');
            
            // Reset form
            this.reset();
        });
    }
}

// Review form functionality
function setupReviewForm() {
    const reviewForm = document.getElementById('reviewForm');
    const stars = document.querySelectorAll('.stars i');
    let selectedRating = 0;
    
    // Star rating functionality
    stars.forEach((star, index) => {
        star.addEventListener('click', function() {
            selectedRating = index + 1;
            updateStarDisplay(selectedRating);
            document.querySelector('input[name=\"rating\"]').value = selectedRating;
        });
        
        star.addEventListener('mouseover', function() {
            updateStarDisplay(index + 1);
        });
    });
    
    document.querySelector('.stars').addEventListener('mouseleave', function() {
        updateStarDisplay(selectedRating);
    });
    
    function updateStarDisplay(rating) {
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }
    
    // Review form submission
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const reviewData = {
                id: Date.now().toString(),
                reviewerName: formData.get('reviewerName'),
                rating: parseInt(formData.get('rating')),
                reviewText: formData.get('reviewText'),
                timestamp: new Date().toISOString()
            };
            
            if (!reviewData.rating) {
                showNotification('Please select a rating', 'error');
                return;
            }
            
            // Store review locally
            const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
            reviews.unshift(reviewData); // Add to beginning of array
            localStorage.setItem('reviews', JSON.stringify(reviews));
            
            // Show success message
            showNotification('Thank you for your review!', 'success');
            
            // Reset form
            this.reset();
            selectedRating = 0;
            updateStarDisplay(0);
            
            // Reload reviews
            loadReviews();
        });
    }
}

// Load and display reviews
function loadReviews() {
    const reviewsDisplay = document.getElementById('reviewsDisplay');
    if (!reviewsDisplay) return;
    
    const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    
    if (reviews.length === 0) {
        reviewsDisplay.innerHTML = `
            <div class=\"review-card\">
                <p class=\"text-center\" style=\"color: #666;\">No reviews yet. Be the first to leave a review!</p>
            </div>
        `;
        return;
    }
    
    reviewsDisplay.innerHTML = reviews.map(review => `
        <div class=\"review-card\">
            <div class=\"review-header\">
                <span class=\"reviewer-name\">${escapeHtml(review.reviewerName)}</span>
                <div class=\"review-rating\">
                    ${generateStarRating(review.rating)}
                </div>
            </div>
            <div class=\"review-text\">${escapeHtml(review.reviewText)}</div>
            <div class=\"review-date\">${formatDate(review.timestamp)}</div>
        </div>
    `).join('');
}

function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class=\"fas fa-star\"></i>';
        } else {
            stars += '<i class=\"far fa-star\"></i>';
        }
    }
    return stars;
}

// Hero buttons functionality
function setupHeroButtons() {
    const orderNowBtn = document.querySelector('.hero-buttons .btn.primary');
    const learnMoreBtn = document.querySelector('.hero-buttons .btn.secondary');

    if (orderNowBtn) {
        orderNowBtn.addEventListener('click', function() {
            scrollToSection('menu');
        });
    }

    if (learnMoreBtn) {
        learnMoreBtn.addEventListener('click', function() {
            scrollToSection('about');
        });
    }
}

// Utility functions - Make scrollToSection globally accessible
window.scrollToSection = function(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick=\"this.parentElement.remove()\">&times;</button>
    `;
    
    // Add styles if not already added
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
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
            .notification-success {
                border-left: 4px solid #28a745;
                color: #155724;
            }
            .notification-error {
                border-left: 4px solid #dc3545;
                color: #721c24;
            }
            .notification-info {
                border-left: 4px solid #17a2b8;
                color: #0c5460;
            }
            .notification button {
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

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Scroll effects
function setupScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    // Observe menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        observer.observe(item);
    });
    
    // Observe section content
    document.querySelectorAll('.about-content, .contact-content, .reviews-content').forEach(content => {
        observer.observe(content);
    });
}