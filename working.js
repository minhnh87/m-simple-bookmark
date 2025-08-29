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
    
    // Create working link object with placeholders
    const workingLink = {
        id: Date.now(),
        url: sanitizedUrl,
        title: 'Loading...',
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
    
    // Fetch metadata asynchronously
    fetchLinkMetadata(workingLink.id, sanitizedUrl);
}

// Fetch link metadata (title and favicon)
async function fetchLinkMetadata(linkId, url) {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        
        // Use domain as title (we can't fetch page title due to CORS)
        let title = domain;
        
        // Try to make title prettier by removing common prefixes
        if (title.startsWith('www.')) {
            title = title.substring(4);
        }
        
        // Capitalize first letter for better appearance
        title = title.charAt(0).toUpperCase() + title.slice(1);
        
        // Update immediately with available data
        updateWorkingLinkMetadata(linkId, title);
        
    } catch (error) {
        console.error('Error processing link metadata:', error);
        // Use fallback values
        try {
            const urlObj = new URL(url);
            const fallbackTitle = urlObj.hostname.replace('www.', '');
            updateWorkingLinkMetadata(linkId, fallbackTitle);
        } catch (fallbackError) {
            // If URL parsing fails, use the URL itself as title
            updateWorkingLinkMetadata(linkId, url, null);
        }
    }
}

// Update working link metadata
function updateWorkingLinkMetadata(linkId, title) {
    const workingLinks = getWorkingLinksFromStorage();
    const linkIndex = workingLinks.findIndex(link => link.id === linkId);
    
    if (linkIndex !== -1) {
        workingLinks[linkIndex].title = title;
        
        // Save updated data
        safeLocalStorageOperation('set', 'workingLinks', JSON.stringify(workingLinks));
        
        // Reload working links to show updated metadata
        loadWorkingLinks();
    }
}

// Update working link title
function updateWorkingLinkTitle(linkId, newTitle) {
    const workingLinks = getWorkingLinksFromStorage();
    const linkIndex = workingLinks.findIndex(link => link.id === linkId);
    
    if (linkIndex !== -1 && newTitle.trim() !== '') {
        workingLinks[linkIndex].title = newTitle.trim();
        
        // Save updated data
        safeLocalStorageOperation('set', 'workingLinks', JSON.stringify(workingLinks));
        
        // Show success message
        showMessage('Title updated!', 'success');
    }
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
    
    // Create favicon element
    const faviconElement = document.createElement('img');
    faviconElement.className = 'working-link-favicon';
    faviconElement.width = 16;
    faviconElement.height = 16;
    faviconElement.alt = '';
    faviconElement.setAttribute('aria-hidden', 'true');
    
    faviconElement.style.display = 'none';
    
    // Create title/url container
    const textContainer = document.createElement('div');
    textContainer.className = 'working-link-text';
    
    // Create editable title element
    const titleElement = document.createElement('input');
    titleElement.type = 'text';
    titleElement.className = 'working-link-title';
    titleElement.value = workingLink.title || 'Loading...';
    titleElement.setAttribute('aria-label', 'Edit link title');
    
    // Add edit functionality
    titleElement.addEventListener('blur', () => {
        updateWorkingLinkTitle(workingLink.id, titleElement.value);
    });
    
    titleElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            titleElement.blur(); // Trigger save
        }
        if (e.key === 'Escape') {
            titleElement.value = workingLink.title; // Reset to original
            titleElement.blur();
        }
    });
    
    // Prevent link click when editing title
    titleElement.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    
    // Create URL element (smaller, subdued)
    const urlElement = document.createElement('div');
    urlElement.className = 'working-link-url';
    urlElement.textContent = workingLink.url;
    
    // Append text elements
    textContainer.appendChild(titleElement);
    textContainer.appendChild(urlElement);
    
    // Append favicon and text to link
    linkElement.appendChild(faviconElement);
    linkElement.appendChild(textContainer);
    
    linkElement.setAttribute('aria-label', `Open working link: ${workingLink.title || workingLink.url}`);
    
    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'working-delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
    deleteBtn.setAttribute('aria-label', `Delete working link: ${workingLink.title || workingLink.url}`);
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

// Group working links by domain
function groupWorkingLinksByDomain(workingLinks) {
    const groups = {};
    
    workingLinks.forEach(link => {
        try {
            const urlObj = new URL(link.url);
            const domain = urlObj.hostname.replace('www.', '');
            
            if (!groups[domain]) {
                groups[domain] = [];
            }
            groups[domain].push(link);
        } catch (error) {
            // If URL parsing fails, put in "Others" group
            if (!groups['Others']) {
                groups['Others'] = [];
            }
            groups['Others'].push(link);
        }
    });
    
    // Sort each group by timestamp (newest first)
    Object.keys(groups).forEach(domain => {
        groups[domain].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    });
    
    return groups;
}

// Generate color for domain
function getDomainColor(domain) {
    // Simple hash function to generate consistent colors for domains
    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
        hash = domain.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert hash to HSL color with good saturation and lightness
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 85%)`; // Light, pleasant colors
}

// Create simple domain label with smart truncation
function createDomainLabel(domain) {
    const domainLabel = document.createElement('div');
    domainLabel.className = 'working-domain-label';
    
    // Smart domain shortening for very long domains
    let displayDomain = domain;
    if (domain.length > 30) {
        // For very long domains, show first part + "..." + TLD
        const parts = domain.split('.');
        if (parts.length > 2) {
            const firstPart = parts[0];
            const lastPart = parts[parts.length - 1];
            displayDomain = `${firstPart.substring(0, 15)}...${lastPart}`;
        } else {
            // Simple truncation for domains without multiple subdomains
            displayDomain = domain.substring(0, 27) + '...';
        }
    }
    
    domainLabel.textContent = displayDomain;
    domainLabel.style.backgroundColor = getDomainColor(domain);
    domainLabel.setAttribute('title', domain); // Full domain on hover
    
    return domainLabel;
}

// Load working links (grouped or list based on view mode)
function loadWorkingLinks() {
    if (workingViewMode === 'grouped') {
        loadWorkingLinksAsGroups();
    } else {
        loadWorkingLinksAsList();
    }
}

// Load working links with domain grouping
function loadWorkingLinksAsGroups() {
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
    
    // Group links by domain
    const groupedLinks = groupWorkingLinksByDomain(workingLinks);
    
    // Sort domains alphabetically
    const sortedDomains = Object.keys(groupedLinks).sort();
    
    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Create groups
    sortedDomains.forEach(domain => {
        const links = groupedLinks[domain];
        
        // Create domain label
        const domainLabel = createDomainLabel(domain);
        fragment.appendChild(domainLabel);
        
        // Add links for this domain
        links.forEach(workingLink => {
            fragment.appendChild(createWorkingLinkElement(workingLink));
        });
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
        const validLinks = workingLinks.map(link => {
            // Ensure link has required properties
            if (link && 
                typeof link === 'object' && 
                link.id && 
                link.url && 
                typeof link.url === 'string' &&
                link.url.trim() !== '') {
                
                // Add missing properties with defaults for existing links
                if (!link.hasOwnProperty('title') || link.title === 'Loading...') {
                    const urlObj = new URL(link.url);
                    let title = urlObj.hostname;
                    if (title.startsWith('www.')) {
                        title = title.substring(4);
                    }
                    title = title.charAt(0).toUpperCase() + title.slice(1);
                    link.title = title;
                }
                if (!link.hasOwnProperty('timestamp')) {
                    link.timestamp = new Date().toISOString();
                }
                
                return link;
            }
            return null;
        }).filter(link => link !== null);
        
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

// Refresh metadata for all existing links
function refreshAllMetadata() {
    const workingLinks = getWorkingLinksFromStorage();
    let updated = false;
    
    workingLinks.forEach(link => {
        if (link.title === 'Loading...' || !link.title) {
            try {
                const urlObj = new URL(link.url);
                let title = urlObj.hostname;
                if (title.startsWith('www.')) {
                    title = title.substring(4);
                }
                title = title.charAt(0).toUpperCase() + title.slice(1);
                link.title = title;
                updated = true;
            } catch (error) {
                console.error('Error updating metadata for link:', link.url);
                link.title = link.url;
            }
        }
    });
    
    if (updated) {
        safeLocalStorageOperation('set', 'workingLinks', JSON.stringify(workingLinks));
        loadWorkingLinks();
    }
}

// Initialize working links module with validation
function initializeWorking() {
    // Validate existing data on startup
    validateWorkingLinksData();
    // Refresh metadata for any existing links
    refreshAllMetadata();
    loadWorkingLinks();
    setupWorkingEventListeners();
    // Setup view toggle button
    setupWorkingViewToggle();
    updateWorkingViewButton();
}

// Setup working view toggle button
function setupWorkingViewToggle() {
    const viewButton = document.getElementById('working-view-toggle');
    if (viewButton) {
        viewButton.addEventListener('click', toggleWorkingViewMode);
    }
}

// Working links view mode (grouped or list)
let workingViewMode = localStorage.getItem('workingViewMode') || 'grouped';

// Toggle working links view mode
function toggleWorkingViewMode() {
    workingViewMode = workingViewMode === 'grouped' ? 'list' : 'grouped';
    localStorage.setItem('workingViewMode', workingViewMode);
    loadWorkingLinks();
    updateWorkingViewButton();
}

// Update working view button text
function updateWorkingViewButton() {
    const viewButton = document.getElementById('working-view-toggle');
    if (viewButton) {
        viewButton.innerHTML = workingViewMode === 'grouped' ? 
            '<i class="fas fa-list" aria-hidden="true"></i> List View' :
            '<i class="fas fa-layer-group" aria-hidden="true"></i> Group View';
        viewButton.setAttribute('aria-label', `Switch to ${workingViewMode === 'grouped' ? 'list' : 'group'} view`);
    }
}

// Load working links in list format (original)
function loadWorkingLinksAsList() {
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
        exportWorkingLinksToClipboard,
        refreshAllMetadata,
        toggleWorkingViewMode,
        updateWorkingViewButton,
        groupWorkingLinksByDomain,
        loadWorkingLinksAsGroups,
        loadWorkingLinksAsList,
        getDomainColor,
        updateWorkingLinkTitle
    };
}