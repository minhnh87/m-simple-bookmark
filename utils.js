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

// Generate random color function
function getRandomColor() {
    // Array of soft, pleasant colors in RGB format
    const colors = [
        'rgb(248, 215, 218)', // soft red
        'rgb(209, 231, 221)', // soft green
        'rgb(207, 226, 255)', // soft blue
        'rgb(255, 243, 205)', // soft yellow
        'rgb(226, 227, 229)', // soft gray
        'rgb(216, 243, 220)', // mint
        'rgb(255, 221, 210)', // peach
        'rgb(221, 214, 254)', // lavender
        'rgb(189, 224, 254)', // light blue
        'rgb(255, 175, 204)', // pink
        'rgb(200, 182, 255)', // purple
        'rgb(253, 255, 182)', // light yellow
        'rgb(202, 255, 191)', // light green
        'rgb(155, 246, 255)', // cyan
        'rgb(255, 198, 255)', // magenta
        'rgb(237, 224, 212)', // tan
        'rgb(233, 236, 239)', // light gray
        'rgb(248, 237, 235)', // cream
    ];
    
    // Return a random color from the array
    return colors[Math.floor(Math.random() * colors.length)];
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
            <span style="font-size: 16px; flex-shrink: 0;">${icons[type] || icons.info}</span>
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
        safeLocalStorageOperation,
        debounce,
        formatDate,
        createElement,
        showMessage
    };
}