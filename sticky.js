// Sticky Notes Module - Handles sticky note CRUD operations

// Track if sticky notes have been initialized to prevent duplicate event listeners
let stickyInitialized = false;
let stickyKeyHandler = null;
let stickyFocusHandler = null;

// Initialize sticky notes functionality
function initializeSticky() {
    if (stickyInitialized) return;
    stickyInitialized = true;
    
    const stickyTitleInput = document.getElementById('sticky-title-input');
    const stickyInput = window.UI.elements.stickyInput;
    const stickyList = window.UI.elements.stickyList;
    
    // Load and display existing sticky notes
    displayStickyNotes();
    
    // Remove any existing event listeners first
    if (stickyKeyHandler) {
        stickyInput.removeEventListener('keypress', stickyKeyHandler);
    }
    if (stickyFocusHandler) {
        stickyInput.removeEventListener('focus', stickyFocusHandler);
    }
    
    // Create new event handlers
    stickyKeyHandler = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const title = stickyTitleInput.value.trim();
            const content = stickyInput.value.trim();
            const visibilityCheckbox = document.getElementById('sticky-visibility-checkbox');
            const showContent = visibilityCheckbox.checked;
            if (content) {
                addStickyNote(title, content, showContent);
                stickyTitleInput.value = '';
                stickyInput.value = '';
                visibilityCheckbox.checked = false; // Reset checkbox
                stickyTitleInput.focus();
            }
        }
    };
    
    stickyFocusHandler = () => {
        stickyInput.select();
    };
    
    // Add event listeners
    stickyInput.addEventListener('keypress', stickyKeyHandler);
    stickyInput.addEventListener('focus', stickyFocusHandler);
    
    // Add Tab key navigation between title and content
    stickyTitleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' || e.key === 'Enter') {
            e.preventDefault();
            stickyInput.focus();
        }
    });
}

// Generate random color for sticky note
function getRandomStickyColor() {
    const colors = [
        { bg: '#ffffff', border: '#e2e8f0', accent: '#0891b2' }, // Cyan
        { bg: '#ffffff', border: '#e2e8f0', accent: '#7c3aed' }, // Violet
        { bg: '#ffffff', border: '#e2e8f0', accent: '#059669' }, // Emerald
        { bg: '#ffffff', border: '#e2e8f0', accent: '#e11d48' }, // Rose
        { bg: '#ffffff', border: '#e2e8f0', accent: '#ea580c' }, // Orange
        { bg: '#ffffff', border: '#e2e8f0', accent: '#2563eb' }, // Blue
        { bg: '#ffffff', border: '#e2e8f0', accent: '#d946ef' }, // Fuchsia
        { bg: '#ffffff', border: '#e2e8f0', accent: '#0d9488' }, // Teal
    ];

    return colors[Math.floor(Math.random() * colors.length)];
}

// Add a new sticky note
function addStickyNote(title, content, showContent = false) {
    const stickyNotes = getStickyNotesFromStorage();
    const randomColor = getRandomStickyColor();

    const newNote = {
        id: Date.now(),
        title: title || '',
        content: content,
        showContent: showContent,
        color: randomColor,
        createdAt: new Date().toLocaleString()
    };

    stickyNotes.push(newNote);
    saveStickyNotesToStorage(stickyNotes);
    displayStickyNotes();
}

// Edit a sticky note
function editStickyNote(id, newTitle, newContent, showContent) {
    const stickyNotes = getStickyNotesFromStorage();
    const noteIndex = stickyNotes.findIndex(note => note.id === id);

    if (noteIndex !== -1) {
        stickyNotes[noteIndex].title = newTitle || '';
        stickyNotes[noteIndex].content = newContent;
        stickyNotes[noteIndex].showContent = showContent;
        stickyNotes[noteIndex].updatedAt = new Date().toLocaleString();
        saveStickyNotesToStorage(stickyNotes);
        displayStickyNotes();
    }
}

// Delete a sticky note
function deleteStickyNote(id) {
    const stickyNotes = getStickyNotesFromStorage();
    const filteredNotes = stickyNotes.filter(note => note.id !== id);
    
    saveStickyNotesToStorage(filteredNotes);
    displayStickyNotes();
}

// Copy sticky note content to clipboard
function copyStickyNote(content) {
    navigator.clipboard.writeText(content).then(() => {
        // Show success notification
        showMessage('Copied', 'success');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showMessage('Failed to copy to clipboard', 'error');
    });
}

// Display all sticky notes
function displayStickyNotes() {
    const stickyList = window.UI.elements.stickyList;
    const stickyNotes = getStickyNotesFromStorage();
    
    // Clear existing notes
    stickyList.innerHTML = '';
    
    if (stickyNotes.length === 0) {
        stickyList.innerHTML = '<div class="empty-message">No sticky notes yet. Add one above!</div>';
        return;
    }
    
    stickyNotes.forEach(note => {
        const noteElement = createStickyNoteElement(note);
        stickyList.appendChild(noteElement);
    });
}

// Create a sticky note DOM element
function createStickyNoteElement(note) {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'sticky-note-item';
    noteDiv.setAttribute('data-id', note.id);

    // Apply accent color to left border
    const color = note.color || { bg: '#ffffff', border: '#e2e8f0', accent: '#0891b2' };
    noteDiv.style.borderLeftColor = color.accent;

    // Handle title display
    const noteTitle = note.title || 'Untitled';
    const displayTitle = noteTitle.length > 25 ? noteTitle.substring(0, 25) + '...' : noteTitle;

    // Handle content visibility - default to hidden for existing notes without showContent property
    const shouldShowContent = note.showContent === true;
    const truncatedContent = shouldShowContent
        ? (note.content.length > 50 ? note.content.substring(0, 50) + '...' : note.content)
        : '';

    const fullTitle = note.title ? `Title: ${note.title}\nContent: ${note.content}` : note.content;

    noteDiv.innerHTML = `
        <div class="sticky-note-header">
            <div class="sticky-note-title" title="${escapeHtml(fullTitle)}">
                ${escapeHtml(displayTitle)}
            </div>
        </div>
        <div class="sticky-note-content" title="${escapeHtml(fullTitle)}">
            ${shouldShowContent ? escapeHtml(truncatedContent) : '<span class="sticky-hidden-icon"><i class="fas fa-eye-slash" aria-hidden="true"></i></span>'}
        </div>
        <div class="sticky-note-actions">
            <button class="sticky-btn edit-btn" onclick="window.Sticky.startEditStickyNote(${note.id})" title="Edit note" aria-label="Edit note">
                <i class="fas fa-edit" aria-hidden="true"></i>
            </button>
            <button class="sticky-btn delete-btn" onclick="window.Sticky.deleteStickyNote(${note.id})" title="Delete note" aria-label="Delete note">
                <i class="fas fa-trash" aria-hidden="true"></i>
            </button>
        </div>
    `;

    // Add click-to-copy functionality
    noteDiv.addEventListener('click', (e) => {
        // Don't trigger copy if clicking on action buttons
        if (e.target.closest('.sticky-note-actions')) {
            return;
        }

        // Only copy the content, not the title
        copyStickyNote(note.content);

        // Show visual feedback with border flash (no layout shift)
        noteDiv.classList.add('copied');
        setTimeout(() => {
            noteDiv.classList.remove('copied');
        }, 300);
    });

    return noteDiv;
}

// Start editing a sticky note
function startEditStickyNote(id) {
    const stickyNotes = getStickyNotesFromStorage();
    const note = stickyNotes.find(note => note.id === id);
    
    if (!note) return;
    
    const noteElement = document.querySelector(`[data-id="${id}"]`);
    const headerDiv = noteElement.querySelector('.sticky-note-header');
    const contentDiv = noteElement.querySelector('.sticky-note-content');
    const actionsDiv = noteElement.querySelector('.sticky-note-actions');
    
    // Add editing class to expand the note
    noteElement.classList.add('editing');
    
    // Create input for title editing
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'sticky-edit-title';
    titleInput.value = note.title || '';
    titleInput.placeholder = 'Note title (optional)';
    
    // Create textarea for content editing
    const textarea = document.createElement('textarea');
    textarea.className = 'sticky-edit-textarea';
    textarea.value = note.content;
    textarea.placeholder = 'Edit your note...';

    // Create visibility checkbox for editing
    const visibilityContainer = document.createElement('div');
    visibilityContainer.className = 'sticky-edit-visibility';
    const shouldShowContent = note.showContent === true;
    visibilityContainer.innerHTML = `
        <label>
            <input type="checkbox" class="sticky-edit-visibility-checkbox" ${shouldShowContent ? 'checked' : ''}>
            Show content
        </label>
    `;

    // Create edit actions
    const editActions = document.createElement('div');
    editActions.className = 'sticky-edit-actions';
    editActions.innerHTML = `
        <button class="sticky-btn save-btn" onclick="window.Sticky.saveEditStickyNote(${id})" title="Save changes">
            <i class="fas fa-save"></i>
        </button>
        <button class="sticky-btn cancel-btn" onclick="window.Sticky.cancelEditStickyNote(${id})" title="Cancel editing">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Replace content and actions with edit interface
    headerDiv.style.display = 'none';
    contentDiv.style.display = 'none';
    actionsDiv.style.display = 'none';

    noteElement.insertBefore(titleInput, headerDiv);
    noteElement.insertBefore(textarea, contentDiv);
    noteElement.insertBefore(visibilityContainer, actionsDiv);
    noteElement.insertBefore(editActions, actionsDiv);
    
    titleInput.focus();
    titleInput.select();
    
    // Handle Tab key to move between fields
    titleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            textarea.focus();
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            textarea.focus();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            cancelEditStickyNote(id);
        }
    });
    
    // Handle Enter key to save (Ctrl/Cmd + Enter for new line)
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            saveEditStickyNote(id);
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            cancelEditStickyNote(id);
        }
    });
}

// Save edited sticky note
function saveEditStickyNote(id) {
    const noteElement = document.querySelector(`[data-id="${id}"]`);
    const titleInput = noteElement.querySelector('.sticky-edit-title');
    const textarea = noteElement.querySelector('.sticky-edit-textarea');
    const visibilityCheckbox = noteElement.querySelector('.sticky-edit-visibility-checkbox');
    const newTitle = titleInput.value.trim();
    const newContent = textarea.value.trim();
    const showContent = visibilityCheckbox.checked;

    if (newContent) {
        editStickyNote(id, newTitle, newContent, showContent);
    } else {
        cancelEditStickyNote(id);
    }
}

// Cancel editing sticky note
function cancelEditStickyNote(id) {
    displayStickyNotes(); // Refresh the display to cancel edit mode
}

// Get sticky notes from localStorage
function getStickyNotesFromStorage() {
    const notes = localStorage.getItem('stickyNotes');
    return notes ? JSON.parse(notes) : [];
}

// Save sticky notes to localStorage
function saveStickyNotesToStorage(notes) {
    localStorage.setItem('stickyNotes', JSON.stringify(notes));
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
    window.Sticky = {
        initializeSticky,
        addStickyNote,
        editStickyNote,
        deleteStickyNote,
        copyStickyNote,
        startEditStickyNote,
        saveEditStickyNote,
        cancelEditStickyNote,
        displayStickyNotes,
        getStickyNotesFromStorage,
        saveStickyNotesToStorage,
        getRandomStickyColor
    };
}