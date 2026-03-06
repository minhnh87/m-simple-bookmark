// Note Module - Handles note initialization, saving, and storage functions

// Configure marked.js
if (typeof marked !== 'undefined') {
    marked.setOptions({
        breaks: true,      // Convert \n to <br>
        gfm: true          // GitHub Flavored Markdown
    });
}

// Helper to render markdown safely
function renderMarkdown(content) {
    if (typeof marked !== 'undefined') {
        return marked.parse(content);
    }
    // Fallback: show raw text if marked is not loaded
    return content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}

// Notes Functions
function initializeNote() {
    const notesList = window.UI.elements.notesList;

    // Clear notes list
    notesList.innerHTML = '';

    // Get note from localStorage or create a new one
    let note = getNoteFromStorage();
    let skipBlurSave = false;

    // Create note item
    const noteItem = document.createElement('div');
    noteItem.className = 'note-item';

    // Create textarea (edit mode)
    const textarea = document.createElement('textarea');
    textarea.className = 'note-content';
    textarea.value = note.content;
    textarea.placeholder = 'Write your notes here...';
    textarea.spellcheck = false;

    // Create preview div (preview mode)
    const previewDiv = document.createElement('div');
    previewDiv.className = 'note-preview';

    // Set initial visibility based on content
    if (note.content) {
        textarea.style.display = 'none';
        previewDiv.style.display = 'block';
        previewDiv.innerHTML = renderMarkdown(note.content);
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
            saveNote(textarea.value);
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
            saveNote(textarea.value);
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
            const freshNote = getNoteFromStorage();
            textarea.value = freshNote.content;
            previewDiv.innerHTML = renderMarkdown(freshNote.content);
            if (freshNote.content.trim()) {
                textarea.style.display = 'none';
                previewDiv.style.display = 'block';
            }
            skipBlurSave = true;
            textarea.blur();
        }
    });

    // Append both textarea and preview to note item
    noteItem.appendChild(textarea);
    noteItem.appendChild(previewDiv);

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