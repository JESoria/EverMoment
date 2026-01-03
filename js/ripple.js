/**
 * ===========================================
 * Material Design 3 - Ripple Effect
 * ===========================================
 */

(function() {
    'use strict';

    // Elements that should have ripple effect
    const RIPPLE_SELECTORS = [
        '.btn',
        '.btn-primary',
        '.btn-secondary',
        '.btn-success',
        '.btn-danger',
        '.btn-icon',
        '.upload-btn',
        '.toggle-btn',
        '.nav-item',
        '.color-option',
        '.bg-option',
        '.carousel-btn',
        '.canvas-lock-btn',
        '.upload-bg-btn'
    ].join(', ');

    /**
     * Create and animate ripple effect
     * @param {HTMLElement} element - The element to add ripple to
     * @param {MouseEvent|TouchEvent} event - The triggering event
     */
    function createRipple(element, event) {
        // Don't create ripple if element is disabled
        if (element.disabled || element.classList.contains('disabled')) {
            return;
        }

        // Get element dimensions
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);

        // Calculate position
        let x, y;
        if (event.touches && event.touches.length) {
            x = event.touches[0].clientX - rect.left - size / 2;
            y = event.touches[0].clientY - rect.top - size / 2;
        } else {
            x = event.clientX - rect.left - size / 2;
            y = event.clientY - rect.top - size / 2;
        }

        // Create ripple element
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        // Add ripple container class if not present
        if (!element.classList.contains('ripple-container')) {
            element.classList.add('ripple-container');
        }

        // Add ripple to element
        element.appendChild(ripple);

        // Remove ripple after animation
        ripple.addEventListener('animationend', function() {
            ripple.remove();
        });

        // Fallback removal (in case animationend doesn't fire)
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.remove();
            }
        }, 1000);
    }

    /**
     * Initialize ripple effect on elements
     */
    function initRipple() {
        // Use event delegation for better performance
        document.addEventListener('mousedown', function(e) {
            const target = e.target.closest(RIPPLE_SELECTORS);
            if (target) {
                createRipple(target, e);
            }
        });

        // Touch support
        document.addEventListener('touchstart', function(e) {
            const target = e.target.closest(RIPPLE_SELECTORS);
            if (target) {
                createRipple(target, e);
            }
        }, { passive: true });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRipple);
    } else {
        initRipple();
    }

    // Export for manual use if needed
    window.createRipple = createRipple;
})();
