// Guides Module - Handles guide initialization, management, and storage functions

// Global variables to prevent duplicate event listeners and track state
let guidesInitialized = false;
let guidesKeyHandler = null;
let guidesFocusHandler = null;
let currentGuideId = null;
let currentView = 'list'; // 'list' or 'content'

// Initialize guides functionality
function initializeGuides() {
    if (guidesInitialized) return;
    guidesInitialized = true;

    // Load and display existing guides
    displayGuidesList();

    // Setup navigation
    setupNavigation();

    // Setup input event listeners
    setupInputListeners();
}

// Setup input event listeners
function setupInputListeners() {
    // Try both methods to get the input element
    let guidesInput = window.UI && window.UI.elements ? window.UI.elements.guidesInput : null;

    if (!guidesInput) {
        guidesInput = document.getElementById('guides-input');
    }

    if (!guidesInput) {
        console.error('Guides input element not found!');
        return;
    }

    // Remove any existing event listeners first
    if (guidesKeyHandler) {
        guidesInput.removeEventListener('keypress', guidesKeyHandler);
        guidesInput.removeEventListener('keydown', guidesKeyHandler);
    }
    if (guidesFocusHandler) {
        guidesInput.removeEventListener('focus', guidesFocusHandler);
    }

    // Create new event handlers
    guidesKeyHandler = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const title = guidesInput.value.trim();
            if (title) {
                addGuide(title);
                guidesInput.value = '';
                guidesInput.focus();
            }
        }
    };

    guidesFocusHandler = () => {
        guidesInput.select();
    };

    // Add event listeners
    guidesInput.addEventListener('keypress', guidesKeyHandler);
    guidesInput.addEventListener('keydown', guidesKeyHandler); // Add both for safety
    guidesInput.addEventListener('focus', guidesFocusHandler);
}

// Setup navigation between views
function setupNavigation() {
    const backBtn = document.getElementById('guides-back-btn');
    const prevBtn = document.getElementById('guides-prev-btn');
    const nextBtn = document.getElementById('guides-next-btn');

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            showGuidesList();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            navigateToGuide('prev');
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            navigateToGuide('next');
        });
    }
}

// Navigate to previous or next guide
function navigateToGuide(direction) {
    if (!currentGuideId) return;

    const guides = getGuidesFromStorage();
    const currentIndex = guides.findIndex(g => g.id === currentGuideId);

    if (currentIndex === -1) return;

    let targetIndex;
    if (direction === 'prev') {
        targetIndex = currentIndex > 0 ? currentIndex - 1 : guides.length - 1;
    } else {
        targetIndex = currentIndex < guides.length - 1 ? currentIndex + 1 : 0;
    }

    const targetGuide = guides[targetIndex];
    if (targetGuide) {
        showGuideContent(targetGuide.id);
    }
}

// Update navigation buttons state
function updateNavigationState() {
    const guides = getGuidesFromStorage();
    const prevBtn = document.getElementById('guides-prev-btn');
    const nextBtn = document.getElementById('guides-next-btn');

    if (prevBtn && nextBtn) {
        // Enable/disable based on whether there are multiple guides
        const hasMultipleGuides = guides.length > 1;
        prevBtn.style.display = hasMultipleGuides ? 'flex' : 'none';
        nextBtn.style.display = hasMultipleGuides ? 'flex' : 'none';
    }
}

// Show guides list view
function showGuidesList() {
    currentView = 'list';
    document.getElementById('guides-list-view').style.display = 'block';
    document.getElementById('guides-content-view').style.display = 'none';
    displayGuidesList();
}

// Show guide content view
function showGuideContent(guideId) {
    currentView = 'content';
    currentGuideId = guideId;
    document.getElementById('guides-list-view').style.display = 'none';
    document.getElementById('guides-content-view').style.display = 'block';
    updateNavigationState();
    displayGuideContent(guideId);
}

// Add a new guide
function addGuide(title) {
    const guides = getGuidesFromStorage();
    const randomColor = getRandomGuideColor();

    const newGuide = {
        id: Date.now(),
        title: title,
        content: '',
        color: randomColor,
        createdAt: new Date().toLocaleString()
    };

    guides.push(newGuide);
    saveGuidesToStorage(guides);

    // Just refresh the guides list, don't open the guide
    displayGuidesList();
}

// Save guide content
function saveGuide(id, content) {
    const guides = getGuidesFromStorage();
    const guideIndex = guides.findIndex(guide => guide.id === id);

    if (guideIndex !== -1) {
        guides[guideIndex].content = content;
        guides[guideIndex].updatedAt = new Date().toLocaleString();
        saveGuidesToStorage(guides);

        // Show success message
        showMessage('Guide saved!', 'success');
    }
}

// Update guide title
function updateGuideTitle(id, newTitle) {
    const guides = getGuidesFromStorage();
    const guideIndex = guides.findIndex(guide => guide.id === id);

    if (guideIndex !== -1) {
        guides[guideIndex].title = newTitle;
        guides[guideIndex].updatedAt = new Date().toLocaleString();
        saveGuidesToStorage(guides);

        // Update the navigation title
        const titleElement = document.getElementById('current-guide-title');
        if (titleElement) {
            titleElement.textContent = newTitle;
        }
    }
}

// Delete a guide
function deleteGuide(id) {
    const guides = getGuidesFromStorage();
    const filteredGuides = guides.filter(guide => guide.id !== id);

    saveGuidesToStorage(filteredGuides);

    // If we're currently viewing the deleted guide, go back to list
    if (currentGuideId === id) {
        showGuidesList();
    } else {
        displayGuidesList();
    }
}

// Get random color for guides (similar to sticky notes)
function getRandomGuideColor() {
    const colors = [
        { bg: '#fff9e6', border: '#f0e68c', accent: '#daa520' }, // Yellow
        { bg: '#f0f8ff', border: '#87ceeb', accent: '#4682b4' }, // Blue
        { bg: '#f0fff0', border: '#90ee90', accent: '#32cd32' }, // Green
        { bg: '#fff0f5', border: '#ffb6c1', accent: '#ff69b4' }, // Pink
        { bg: '#f5f0ff', border: '#dda0dd', accent: '#9370db' }, // Purple
        { bg: '#fff8dc', border: '#f0e68c', accent: '#b8860b' }  // Beige
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Display guides list
function displayGuidesList() {
    const guidesList = window.UI.elements.guidesList;
    const guides = getGuidesFromStorage();

    // Clear existing guides
    guidesList.innerHTML = '';

    if (guides.length === 0) {
        guidesList.innerHTML = '<div class="empty-message">No guides yet. Add one above!</div>';
        return;
    }

    guides.forEach(guide => {
        const guideElement = createGuideListElement(guide);
        guidesList.appendChild(guideElement);
    });
}

// Display guide content with markdown toggle (edit on focus, preview on blur)
function displayGuideContent(guideId) {
    const guides = getGuidesFromStorage();
    const guide = guides.find(g => g.id === guideId);

    if (!guide) {
        showGuidesList();
        return;
    }

    const container = document.getElementById('guides-content-container');
    const titleElement = document.getElementById('current-guide-title');

    // Update navigation title
    if (titleElement) {
        titleElement.textContent = guide.title;
    }

    // Clear container
    container.innerHTML = '';

    // Create guide item (similar to note-item)
    const guideItem = document.createElement('div');
    guideItem.className = 'guide-item-content';

    let skipBlurSave = false;

    // Create textarea (edit mode)
    const textarea = document.createElement('textarea');
    textarea.className = 'guide-content';
    textarea.value = guide.content;
    textarea.placeholder = 'Write your guide content here...';
    textarea.spellcheck = false;

    // Create preview div (preview mode)
    const previewDiv = document.createElement('div');
    previewDiv.className = 'guide-preview';

    // Set initial visibility based on content
    if (guide.content) {
        textarea.style.display = 'none';
        previewDiv.style.display = 'block';
        previewDiv.innerHTML = renderMarkdown(guide.content);
    } else {
        textarea.style.display = 'block';
        previewDiv.style.display = 'none';
    }

    // Click on preview → switch to edit mode
    previewDiv.addEventListener('click', () => {
        previewDiv.style.display = 'none';
        textarea.style.display = 'block';
        textarea.focus();
        // Auto-resize textarea to match content
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    });

    // Textarea blur → save and switch to preview
    textarea.addEventListener('blur', () => {
        if (!skipBlurSave) {
            saveGuide(guideId, textarea.value);
        }
        skipBlurSave = false;
        previewDiv.innerHTML = renderMarkdown(textarea.value);

        if (textarea.value.trim()) {
            textarea.style.display = 'none';
            previewDiv.style.display = 'block';
        } else {
            // Keep textarea visible if empty
            textarea.style.display = 'block';
            previewDiv.style.display = 'none';
        }
    });

    // Keyboard shortcuts
    textarea.addEventListener('keydown', (e) => {
        // Ctrl+S / Cmd+S → save and switch to preview
        if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            saveGuide(guideId, textarea.value);
            previewDiv.innerHTML = renderMarkdown(textarea.value);
            if (textarea.value.trim()) {
                textarea.style.display = 'none';
                previewDiv.style.display = 'block';
            }
            skipBlurSave = true;
            textarea.blur();
        }

        // Escape → revert and switch to preview
        if (e.key === 'Escape') {
            e.preventDefault();
            const freshGuides = getGuidesFromStorage();
            const freshGuide = freshGuides.find(g => g.id === guideId);
            if (freshGuide) {
                textarea.value = freshGuide.content;
            }
            previewDiv.innerHTML = renderMarkdown(textarea.value);
            if (textarea.value.trim()) {
                textarea.style.display = 'none';
                previewDiv.style.display = 'block';
            }
            skipBlurSave = true;
            textarea.blur();
        }
    });

    // Append both textarea and preview to guide item
    guideItem.appendChild(textarea);
    guideItem.appendChild(previewDiv);

    // Append guide item to container
    container.appendChild(guideItem);
}

// Create a guide list element (for the guides list view)
function createGuideListElement(guide) {
    const guideDiv = document.createElement('div');
    guideDiv.className = 'guide-list-item';
    guideDiv.setAttribute('data-id', guide.id);

    if (currentGuideId === guide.id) {
        guideDiv.classList.add('selected');
    }

    const color = guide.color || { bg: '#f0f8ff', border: '#87ceeb', accent: '#4682b4' };
    guideDiv.style.borderLeftColor = color.accent;

    const guideTitle = guide.title || 'Untitled Guide';
    const displayTitle = guideTitle.length > 40 ? guideTitle.substring(0, 40) + '...' : guideTitle;

    // Create preview snippet: strip markdown, take first ~100 chars
    const contentPreview = guide.content
        ? guide.content
            .replace(/#{1,6}\s/g, '')           // Remove headings
            .replace(/\*\*|__/g, '')             // Remove bold
            .replace(/\*|_/g, '')                // Remove italic
            .replace(/`{1,3}[^`]*`{1,3}/g, '')  // Remove code
            .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Links → text
            .replace(/^\s*[-*+]\s/gm, '')        // Remove list markers
            .replace(/^\s*>\s/gm, '')            // Remove blockquote
            .replace(/\n+/g, ' ')                // Newlines → spaces
            .trim()
            .substring(0, 100)
        : '';
    const displayPreview = contentPreview ? (contentPreview.length >= 100 ? contentPreview + '...' : contentPreview) : 'No content yet';

    // Format date
    const dateStr = guide.createdAt || '';
    const displayDate = dateStr || 'No date';

    guideDiv.innerHTML = `
        <div class="guide-card-header">
            <i class="fas fa-book guide-card-icon" aria-hidden="true"></i>
            <div class="guide-title" title="${escapeHtml(guideTitle)}">
                ${escapeHtml(displayTitle)}
            </div>
            <div class="guide-actions">
                <button class="guide-btn delete-btn" onclick="window.Guides.deleteGuide(${guide.id})" title="Delete guide">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="guide-card-preview">${escapeHtml(displayPreview)}</div>
        <div class="guide-card-date">
            <i class="far fa-clock" aria-hidden="true"></i> ${escapeHtml(displayDate)}
        </div>
    `;

    guideDiv.addEventListener('click', (e) => {
        if (e.target.closest('.guide-actions')) return;
        showGuideContent(guide.id);
    });

    return guideDiv;
}

// Legacy function for compatibility - now redirects to content view
function startEditGuide(id) {
    showGuideContent(id);
}

// Get guides from localStorage
function getGuidesFromStorage() {
    const guides = localStorage.getItem('guides');
    return guides ? JSON.parse(guides) : [];
}

// Save guides to localStorage
function saveGuidesToStorage(guides) {
    localStorage.setItem('guides', JSON.stringify(guides));
}

// Utility function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}



// Export functions for use in other modules and global access
if (typeof window !== 'undefined') {
    window.Guides = {
        initializeGuides,
        setupInputListeners,
        addGuide,
        saveGuide,
        updateGuideTitle,
        deleteGuide,
        startEditGuide, // Legacy compatibility
        showGuidesList,
        showGuideContent,
        displayGuidesList,
        displayGuideContent,
        navigateToGuide,
        updateNavigationState,
        getGuidesFromStorage,
        saveGuidesToStorage,
        getRandomGuideColor
    };
}
