// Commands Module - Handles list of commands with copy and color features

function initializeCommands() {
    loadCommands();

    const input = window.UI?.elements?.commandsInput || document.getElementById('commands-input');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addCommand();
            }
        });
    }
}

function getCommandsFromStorage() {
    const raw = localStorage.getItem('commands');
    return raw ? JSON.parse(raw) : [];
}

function saveCommandsToStorage(commands) {
    localStorage.setItem('commands', JSON.stringify(commands));
}

function addCommand() {
    const input = window.UI?.elements?.commandsInput || document.getElementById('commands-input');
    if (!input) return;

    const text = (input.value || '').trim();
    if (!text) {
        showMessage('Please enter a command', 'error');
        return;
    }

    const command = {
        id: Date.now(),
        text: sanitizeInput(text),
        color: typeof getRandomColor === 'function' ? getRandomColor() : '#f0f0f0',
        createdAt: new Date().toISOString()
    };

    const commands = getCommandsFromStorage();
    commands.push(command);
    saveCommandsToStorage(commands);

    input.value = '';
    renderCommands(commands);

}

function renderCommands(commands) {
    const list = window.UI?.elements?.commandsList || document.getElementById('commands-list');
    if (!list) return;

    list.innerHTML = '';

    if (!commands || commands.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-message';
        empty.textContent = 'No commands yet. Add one below!';
        list.appendChild(empty);
        return;
    }

    // Render newest first
    const items = [...commands].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    items.forEach(item => {
        const container = document.createElement('div');
        container.className = 'command-item';
        container.style.backgroundColor = item.color || '#ffffff';

        const textDiv = document.createElement('div');
        textDiv.className = 'command-text';
        textDiv.textContent = item.text;

        // Inline edit helpers and events
        let isEditing = false;
        let originalText = item.text;

        function startEdit() {
            isEditing = true;
            originalText = textDiv.textContent;
            textDiv.setAttribute('contenteditable', 'true');
            textDiv.classList.add('editing');
            textDiv.focus();
            // Place caret at end
            const range = document.createRange();
            range.selectNodeContents(textDiv);
            range.collapse(false);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'command-btn edit-btn';
        editBtn.title = 'Edit command';
        editBtn.innerHTML = '<i class="fas fa-pen"></i>';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!isEditing) startEdit();
            else finishSave();
        });

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'command-btn delete-btn';
        deleteBtn.title = 'Delete command';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Delete this command?')) {
                removeCommand();
            }
        });


        // Delete command helper
        function removeCommand() {
            const all = getCommandsFromStorage();
            const filtered = all.filter(c => c.id !== item.id);
            saveCommandsToStorage(filtered);
            renderCommands(filtered);

        }

        function finishSave() {
            const newText = (textDiv.textContent || '').trim();
            textDiv.setAttribute('contenteditable', 'false');
            textDiv.classList.remove('editing');
            isEditing = false;
            if (!newText) {
                textDiv.textContent = originalText;
                showMessage('Command cannot be empty', 'error');
                return;
            }
            if (newText === item.text) return;

            const all = getCommandsFromStorage();
            const idx = all.findIndex(c => c.id === item.id);
            if (idx !== -1) {
                all[idx].text = sanitizeInput(newText);
                saveCommandsToStorage(all);
                renderCommands(all);

            }
        }

        function cancelEdit() {
            textDiv.textContent = originalText;
            textDiv.setAttribute('contenteditable', 'false');
            textDiv.classList.remove('editing');
            isEditing = false;
        }

        textDiv.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (isEditing) finishSave();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                if (isEditing) cancelEdit();
            }
        });

        textDiv.addEventListener('blur', () => {
            if (isEditing) finishSave();
        });


        const actions = document.createElement('div');
        actions.className = 'command-actions';


        // Color picker
        const colorWrap = document.createElement('div');
        colorWrap.className = 'color-picker-wrapper';

        const colorBtn = document.createElement('button');
        colorBtn.className = 'command-btn color-btn';
        colorBtn.title = 'Pick color';
        colorBtn.innerHTML = '<i class="fas fa-palette"></i>';

        const picker = document.createElement('div');
        picker.className = 'command-color-picker';

        const palette = typeof getColorPalette === 'function' ? getColorPalette() : [];
        palette.forEach(color => {
            const swatch = document.createElement('button');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.addEventListener('click', () => {
                const all = getCommandsFromStorage();
                const idx = all.findIndex(c => c.id === item.id);
                if (idx !== -1) {
                    all[idx].color = color;
                    saveCommandsToStorage(all);
                    renderCommands(all);
                }
                picker.classList.remove('open');
            });
            picker.appendChild(swatch);
        });

        colorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close other pickers
            document.querySelectorAll('.command-color-picker.open').forEach(el => el.classList.remove('open'));
            picker.classList.toggle('open');
        });

        // Close picker on outside click
        document.addEventListener('click', () => picker.classList.remove('open'));

        colorWrap.appendChild(colorBtn);
        colorWrap.appendChild(picker);

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        actions.appendChild(colorWrap);

        container.appendChild(textDiv);
        container.appendChild(actions);

        // Click to copy on the whole box (except action buttons and picker)
        container.title = 'Click to copy';
        container.addEventListener('click', async (e) => {
            if (isEditing) return;
            if (e.target.closest('.command-actions') || e.target.closest('.command-color-picker')) return;
            try {
                await navigator.clipboard.writeText(item.text);
            } catch (err) {
                showMessage('Failed to copy', 'error');
            }
        });


        list.appendChild(container);
    });
}

function loadCommands() {
    const commands = getCommandsFromStorage();
    renderCommands(commands);
}

if (typeof window !== 'undefined') {
    window.Commands = {
        initializeCommands,
        loadCommands,
        addCommand,
        getCommandsFromStorage
    };
}

