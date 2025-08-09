// Note Module - Handles note initialization, saving, and storage functions

// Notes Functions
function initializeNote() {
    const notesList = window.UI.elements.notesList;
    
    // Clear notes list
    notesList.innerHTML = '';
    
    // Get note from localStorage or create a new one
    let note = getNoteFromStorage();
    
    // Create note item
    const noteItem = document.createElement('div');
    noteItem.className = 'note-item';
    
    // Create note content
    const noteContent = document.createElement('textarea');
    noteContent.className = 'note-content';
    noteContent.value = note.content;
    noteContent.placeholder = 'Write your notes here...';
    noteContent.spellcheck = false;
    
    // Handle key events for save (Enter) and cancel (Escape)
    noteContent.addEventListener('keydown', (e) => {
        // Save on Enter key (without shift for new line)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveNote(noteContent.value);
            noteContent.blur();
        }
        
        // Cancel on Escape key
        if (e.key === 'Escape') {
            e.preventDefault();
            // Get the most recent content from localStorage
            const freshNote = getNoteFromStorage();
            noteContent.value = freshNote.content;
            noteContent.blur();
        }
    });
    
    // When focus is lost, revert to the most recent saved content
    noteContent.addEventListener('blur', () => {
        // Get the most recent content from localStorage
        const freshNote = getNoteFromStorage();
        noteContent.value = freshNote.content;
    });
    
    // Append content to note item
    noteItem.appendChild(noteContent);
    
    // Append note item to notes list
    notesList.appendChild(noteItem);
}

function saveNote(content) {
    // Get note from localStorage
    let note = getNoteFromStorage();
    
    // Update note content
    note.content = content;
    note.updatedAt = new Date().toLocaleString();
    
    // Save to localStorage
    localStorage.setItem('note', JSON.stringify(note));
    
    // Show success message
    showMessage('Note saved!', 'success');
}

// Get note from localStorage
function getNoteFromStorage() {
    let note = localStorage.getItem('note');
    
    if (note === null) {
        // Create a default note if none exists
        note = {
            id: Date.now(),
            content: '',
            createdAt: new Date().toLocaleString()
        };
        localStorage.setItem('note', JSON.stringify(note));
    } else {
        note = JSON.parse(note);
    }
    
    return note;
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.Notes = {
        initializeNote,
        saveNote,
        getNoteFromStorage
    };
}