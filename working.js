// Working Links Module - Handles working links CRUD operations and rendering

// Add working link function
function addWorkingLink(url) {
    // Validate URL
    if (!url || !url.trim()) {
        showMessage('Please enter a URL', 'error');
        return;
    }
    
    url = url.trim();
    
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
        url = 'https://' + url;
    }
    
    // Validate URL format
    if (!isValidUrl(url)) {
        showMessage('Please enter a valid URL', 'error');
        return;
    }
    
    // Sanitize URL
    const sanitizedUrl = sanitizeInput(url);
    
    // Create working link object
    const workingLink = {
        id: Date.now(),
        url: sanitizedUrl,
        timestamp: new Date().toISOString()
    };
    
    // Get working links from localStorage and add new one
    let workingLinks = getWorkingLinksFromStorage();
    workingLinks.push(workingLink);
    
    // Use safe localStorage operation
    if (!safeLocalStorageOperation('set', 'workingLinks', JSON.stringify(workingLinks))) {
        return; // Error message already shown by safeLocalStorageOperation
    }
    
    // Clear input
    window.UI.elements.workingBookmarkInput.value = '';
    
    // Re-fetch working links
    loadWorkingLinks();
    
    // Show success message
    showMessage('Working link added', 'success');
}

// Delete working link function
function deleteWorkingLink(id) {
    // Confirm before delete
    if (confirm('Are you sure you want to delete this working link?')) {
        // Get working links from localStorage
        let workingLinks = getWorkingLinksFromStorage();
        
        // Filter out the working link with the id
        workingLinks = workingLinks.filter(link => link.id !== id);
        
        // Re-set to localStorage using safe operation
        safeLocalStorageOperation('set', 'workingLinks', JSON.stringify(workingLinks));
        
        // Re-fetch working links
        loadWorkingLinks();
        
        // Show message
        showMessage('Working link removed!', 'info');
    }
}

// Get working links from localStorage with safe operation
function getWorkingLinksFromStorage() {
    const workingLinksData = safeLocalStorageOperation('get', 'workingLinks');
    
    if (workingLinksData === null || workingLinksData === undefined) {
        return [];
    }
    
    try {
        return JSON.parse(workingLinksData);
    } catch (error) {
        console.error('Error parsing working links data:', error);
        return [];
    }
}

// Create working link element
function createWorkingLinkElement(workingLink) {
    // Create working link item
    const workingLinkItem = document.createElement('div');
    workingLinkItem.className = 'working-link-item';
    workingLinkItem.setAttribute('role', 'listitem');
    
    // Create link container
    const linkContainer = document.createElement('div');
    linkContainer.className = 'working-link-container';
    
    // Create clickable link
    const linkElement = document.createElement('a');
    linkElement.href = workingLink.url;
    linkElement.target = '_blank';
    linkElement.rel = 'noopener noreferrer';
    linkElement.className = 'working-link';
    linkElement.textContent = workingLink.url;
    linkElement.setAttribute('aria-label', `Open working link: ${workingLink.url}`);
    
    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'working-delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
    deleteBtn.setAttribute('aria-label', `Delete working link: ${workingLink.url}`);
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteWorkingLink(workingLink.id);
    });
    
    // Append elements
    linkContainer.appendChild(linkElement);
    linkContainer.appendChild(deleteBtn);
    workingLinkItem.appendChild(linkContainer);
    
    return workingLinkItem;
}

// Load working links
function loadWorkingLinks() {
    const workingLinks = getWorkingLinksFromStorage();
    const workingList = window.UI.elements.workingBookmarkList;
    
    workingList.innerHTML = '';
    
    if (workingLinks.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'working-empty-message';
        emptyMessage.textContent = 'No working links yet. Add some above!';
        workingList.appendChild(emptyMessage);
        return;
    }
    
    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Sort by timestamp (newest first)
    workingLinks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Loop through working links and create elements
    workingLinks.forEach(workingLink => {
        fragment.appendChild(createWorkingLinkElement(workingLink));
    });
    
    // Single DOM manipulation
    workingList.appendChild(fragment);
}

// Setup working links event listeners
function setupWorkingEventListeners() {
    // Add working link on Enter key
    window.UI.elements.workingBookmarkInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const url = window.UI.elements.workingBookmarkInput.value;
            addWorkingLink(url);
        }
    });
    
    // Also allow adding on input blur (optional)
    window.UI.elements.workingBookmarkInput.addEventListener('blur', () => {
        const url = window.UI.elements.workingBookmarkInput.value;
        if (url.trim()) {
            addWorkingLink(url);
        }
    });
}

// Clear all working links
function clearAllWorkingLinks() {
    const workingLinks = getWorkingLinksFromStorage();
    if (workingLinks.length === 0) {
        showMessage('No working links to clear', 'info');
        return;
    }
    
    if (confirm(`Are you sure you want to clear all ${workingLinks.length} working links?`)) {
        safeLocalStorageOperation('remove', 'workingLinks');
        loadWorkingLinks();
        showMessage(`All ${workingLinks.length} working links cleared!`, 'info');
    }
}

// Validate working links data integrity
function validateWorkingLinksData() {
    try {
        const workingLinks = getWorkingLinksFromStorage();
        const validLinks = workingLinks.filter(link => {
            return link && 
                   typeof link === 'object' && 
                   link.id && 
                   link.url && 
                   typeof link.url === 'string' &&
                   link.url.trim() !== '';
        });
        
        if (validLinks.length !== workingLinks.length) {
            console.warn(`Cleaned ${workingLinks.length - validLinks.length} invalid working links`);
            safeLocalStorageOperation('set', 'workingLinks', JSON.stringify(validLinks));
            return validLinks;
        }
        
        return workingLinks;
    } catch (error) {
        console.error('Error validating working links data:', error);
        return [];
    }
}

// Get working links count for UI updates
function getWorkingLinksCount() {
    return getWorkingLinksFromStorage().length;
}

// Export working links to clipboard
function exportWorkingLinksToClipboard() {
    const workingLinks = getWorkingLinksFromStorage();
    if (workingLinks.length === 0) {
        showMessage('No working links to export', 'info');
        return;
    }
    
    const urls = workingLinks.map(link => link.url).join('\n');
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(urls).then(() => {
            showMessage(`${workingLinks.length} working links copied to clipboard!`, 'success');
        }).catch(() => {
            showMessage('Failed to copy to clipboard', 'error');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = urls;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showMessage(`${workingLinks.length} working links copied to clipboard!`, 'success');
        } catch {
            showMessage('Failed to copy to clipboard', 'error');
        }
        document.body.removeChild(textArea);
    }
}

// Initialize working links module with validation
function initializeWorking() {
    // Validate existing data on startup
    validateWorkingLinksData();
    loadWorkingLinks();
    setupWorkingEventListeners();
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.Working = {
        initializeWorking,
        loadWorkingLinks,
        addWorkingLink,
        deleteWorkingLink,
        clearAllWorkingLinks,
        getWorkingLinksFromStorage,
        createWorkingLinkElement,
        validateWorkingLinksData,
        getWorkingLinksCount,
        exportWorkingLinksToClipboard
    };
}