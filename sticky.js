// Sticky Notes Module - Handles sticky note CRUD operations

// Track if sticky notes have been initialized to prevent duplicate event listeners
let stickyInitialized = false;
let stickyKeyHandler = null;
let stickyFocusHandler = null;

// Initialize sticky notes functionality
function initializeSticky() {
    if (stickyInitialized) return;
    stickyInitialized = true;
    
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
            const content = stickyInput.value.trim();
            if (content) {
                addStickyNote(content);
                stickyInput.value = '';
            }
        }
    };
    
    stickyFocusHandler = () => {
        stickyInput.select();
    };
    
    // Add event listeners
    stickyInput.addEventListener('keypress', stickyKeyHandler);
    stickyInput.addEventListener('focus', stickyFocusHandler);
}

// Generate random color for sticky note
function getRandomStickyColor() {
    const colors = [
        { bg: '#fffbf0', border: '#f0e68c', accent: '#daa520' }, // Yellow (default)
        { bg: '#f0f8ff', border: '#add8e6', accent: '#4682b4' }, // Light blue
        { bg: '#f5fffa', border: '#98fb98', accent: '#32cd32' }, // Light green
        { bg: '#fff0f5', border: '#ffb6c1', accent: '#ff69b4' }, // Pink
        { bg: '#f0fff0', border: '#90ee90', accent: '#228b22' }, // Mint green
        { bg: '#ffefd5', border: '#ffdab9', accent: '#cd853f' }, // Peach
        { bg: '#e6e6fa', border: '#dda0dd', accent: '#9370db' }, // Lavender
        { bg: '#fff8dc', border: '#f0e68c', accent: '#bdb76b' }, // Cornsilk
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
}

// Add a new sticky note
function addStickyNote(content) {
    const stickyNotes = getStickyNotesFromStorage();
    const randomColor = getRandomStickyColor();
    
    const newNote = {
        id: Date.now(),
        content: content,
        color: randomColor,
    };
    
    stickyNotes.push(newNote);
    saveStickyNotesToStorage(stickyNotes);
    displayStickyNotes();
}

// Edit a sticky note
function editStickyNote(id, newContent) {
    const stickyNotes = getStickyNotesFromStorage();
    const noteIndex = stickyNotes.findIndex(note => note.id === id);
    
    if (noteIndex !== -1) {
        stickyNotes[noteIndex].content = newContent;
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
        // Copy successful - no message needed
    }).catch(err => {
        console.error('Failed to copy: ', err);
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
    
    // Apply random color if available, otherwise use default yellow
    const color = note.color || { bg: '#fffbf0', border: '#f0e68c', accent: '#daa520' };
    noteDiv.style.backgroundColor = color.bg;
    noteDiv.style.borderColor = color.border;
    noteDiv.style.borderLeftColor = color.accent;
    
    // Truncate content for display (max 50 characters for smaller display)
    const displayContent = note.content.length > 50 
        ? note.content.substring(0, 50) + '...' 
        : note.content;
    
    noteDiv.innerHTML = `
        <div class="sticky-note-content" title="${escapeHtml(note.content)}">
            ${escapeHtml(displayContent)}
        </div>
        <div class="sticky-note-actions">
            <button class="sticky-btn edit-btn" onclick="window.Sticky.startEditStickyNote(${note.id})" title="Edit note">
                <i class="fas fa-edit"></i>
            </button>
            <button class="sticky-btn delete-btn" onclick="window.Sticky.deleteStickyNote(${note.id})" title="Delete note">
                <i class="fas fa-trash"></i>
            </button>
            <button class="sticky-btn copy-btn" onclick="window.Sticky.copyStickyNote('${escapeHtml(note.content)}')" title="Copy to clipboard">
                <i class="fas fa-copy"></i>
            </button>
        </div>
    `;
    
    return noteDiv;
}

// Start editing a sticky note
function startEditStickyNote(id) {
    const stickyNotes = getStickyNotesFromStorage();
    const note = stickyNotes.find(note => note.id === id);
    
    if (!note) return;
    
    const noteElement = document.querySelector(`[data-id="${id}"]`);
    const contentDiv = noteElement.querySelector('.sticky-note-content');
    const actionsDiv = noteElement.querySelector('.sticky-note-actions');
    
    // Add editing class to expand the note
    noteElement.classList.add('editing');
    
    // Create textarea for editing
    const textarea = document.createElement('textarea');
    textarea.className = 'sticky-edit-textarea';
    textarea.value = note.content;
    textarea.placeholder = 'Edit your note...';
    
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
    contentDiv.style.display = 'none';
    actionsDiv.style.display = 'none';
    
    noteElement.insertBefore(textarea, contentDiv);
    noteElement.insertBefore(editActions, actionsDiv);
    
    textarea.focus();
    textarea.select();
    
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
    const textarea = noteElement.querySelector('.sticky-edit-textarea');
    const newContent = textarea.value.trim();
    
    if (newContent) {
        editStickyNote(id, newContent);
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