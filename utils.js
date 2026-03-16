// Utility functions for the bookmark manager application

// Enhanced URL validation function
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return ['http:', 'https:', 'file:'].includes(url.protocol);
    } catch (_) {
        return false;
    }
}

// Sanitize input to prevent XSS
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Color palette and helpers
function getColorPalette() {
    return [
        'rgb(250, 235, 235)', // very soft rose
        'rgb(235, 245, 235)', // very soft mint
        'rgb(235, 240, 250)', // very soft blue
        'rgb(250, 248, 235)', // very soft cream
        'rgb(245, 235, 250)', // very soft lavender
        'rgb(248, 250, 235)', // very soft lime
        'rgb(235, 248, 245)', // very soft teal
        'rgb(248, 235, 240)', // very soft pink
        'rgb(240, 245, 250)', // very soft sky
        'rgb(245, 248, 235)', // very soft sage
        'rgb(250, 245, 240)', // very soft peach
        'rgb(240, 235, 245)', // very soft mauve
    ];
}

// Generate random color function
function getRandomColor() {
    const colors = getColorPalette();
    return colors[Math.floor(Math.random() * colors.length)];
}

// Derive a stronger/darker accent from a pastel rgb() string
function deriveAccentColor(rgbStr) {
    const match = /rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i.exec(rgbStr);
    if (!match) return rgbStr;
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    const { h, s, l } = rgbToHsl(r, g, b);
    const newS = Math.min(1, s + 0.25);
    const newL = Math.max(0, Math.min(1, l - 0.25));
    const { r: rr, g: gg, b: bb } = hslToRgb(h, newS, newL);
    return `rgb(${rr}, ${gg}, ${bb})`;
}

// Convert RGB [0-255] to HSL [h:0-1, s:0-1, l:0-1]
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h, s, l };
}

// Convert HSL [h:0-1, s:0-1, l:0-1] to RGB [0-255]
function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}


// Handle localStorage operations with error handling
function safeLocalStorageOperation(operation, key, data = null) {
    try {
        switch (operation) {
            case 'get':
                return localStorage.getItem(key);
            case 'set':
                localStorage.setItem(key, data);
                return true;
            case 'remove':
                localStorage.removeItem(key);
                return true;
            default:
                throw new Error('Invalid localStorage operation');
        }
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            showMessage('Storage quota exceeded. Please export data and clear some items.', 'error');
        } else {
            showMessage('Storage operation failed: ' + error.message, 'error');
        }
        return null;
    }
}

// Debounce function for performance optimization
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(this, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(this, args);
    };
}

// Format date function for consistent display
function formatDate(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Create element with attributes helper
function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);

    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'textContent') {
            element.textContent = value;
        } else if (key === 'innerHTML') {
            element.innerHTML = value;
        } else {
            element.setAttribute(key, value);
        }
    });

    // Add children
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else {
            element.appendChild(child);
        }
    });

    return element;
}

// Show message function with better performance and icons
function showMessage(message, type = 'info') {
    // Check if message container exists
    let messageContainer = document.querySelector('.message-container');

    // If not, create one
    if (!messageContainer) {
        messageContainer = createElement('div', {
            className: 'message-container'
        });
        document.body.appendChild(messageContainer);
    }

    // Icon mapping for different message types
    const icons = {
        success: '<i class="fas fa-check-circle"></i>',
        error: '<i class="fas fa-exclamation-triangle"></i>',
        info: '<i class="fas fa-info-circle"></i>'
    };

    // Create message element with icon
    const messageElement = createElement('div', {
        className: `message ${type}`
    });

    messageElement.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 14px; flex-shrink: 0;">${icons[type] || icons.info}</span>
            <span style="flex: 1;">${message}</span>
        </div>
    `;

    // Add message to container
    messageContainer.appendChild(messageElement);

    // Remove message after 4 seconds (longer for better UX)
    setTimeout(() => {
        messageElement.classList.add('fade-out');
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }

            // Remove container if empty
            if (messageContainer.children.length === 0) {
                messageContainer.remove();
            }
        }, 400);
    }, 4000);
}

// Export functions for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isValidUrl,
        sanitizeInput,
        getRandomColor,
        getColorPalette,
        safeLocalStorageOperation,
        debounce,
        formatDate,
        createElement,
        showMessage,
        deriveAccentColor
    };
}

// Also export to window for global access
if (typeof window !== 'undefined') {
    window.showMessage = showMessage;
    window.getRandomColor = getRandomColor;
    window.getColorPalette = getColorPalette;
}

// Ensure accent helper is exposed on window as well
if (typeof window !== 'undefined') {
    window.deriveAccentColor = deriveAccentColor;
}
