// Bookmark Module - Handles bookmark CRUD operations, import/export, and rendering

// Add bookmark function
function addBookmark(e) {
    e.preventDefault();

    const name = window.UI.elements.bookmarkNameInput.value.trim();
    let url = window.UI.elements.bookmarkUrlInput.value.trim();
    const category = window.UI.elements.bookmarkCategoryInput.value.trim().toLowerCase();

    // Enhanced validation
    if (!name || !url) {
        showMessage('Please fill in both fields', 'error');
        return;
    }

    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
        url = 'https://' + url;
    }

    // Validate URL format
    if (!isValidUrl(url)) {
        showMessage('Please enter a valid URL', 'error');
        return;
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedUrl = sanitizeInput(url);
    const sanitizedCategory = category ? sanitizeInput(category) : '';

    // Create bookmark object with sanitized inputs
    const bookmark = {
        id: Date.now(),
        name: sanitizedName,
        url: sanitizedUrl,
        category: sanitizedCategory,
        color: getRandomColor()
    };

    // Handle localStorage quota exceeded
    try {
        // Get bookmarks from localStorage
        let bookmarks = getBookmarksFromStorage();
        bookmarks.push(bookmark);
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            showMessage('Storage quota exceeded. Please export data and clear some bookmarks.', 'error');
            return;
        }
        showMessage('Error saving bookmark: ' + error.message, 'error');
        return;
    }

    // Reset form
    window.UI.elements.bookmarkForm.reset();

    // Hide form
    window.UI.elements.addFormContainer.style.display = 'none';

    // Re-fetch bookmarks
    loadBookmarks();

    // Show success message with animation
    showMessage('Bookmark added', 'success');
}

// Delete bookmark function
function deleteBookmark(id) {
    // Get bookmarks from localStorage
    let bookmarks = getBookmarksFromStorage();

    // Find the bookmark
    const bookmarkToDelete = bookmarks.find(bookmark => bookmark.id === id);

    // Prevent deletion of document.html bookmark
    if (bookmarkToDelete && bookmarkToDelete.url.includes('nos1hahaha.bitbucket.io/reading.html')) {
        showMessage('This bookmark cannot be deleted.', 'error');
        return;
    }

    // Confirm before delete
    if (confirm('Are you sure you want to delete this bookmark?')) {
        // Filter out the bookmark with the id
        bookmarks = bookmarks.filter(bookmark => bookmark.id !== id);

        // Re-set to localStorage
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));

        // Re-fetch bookmarks
        loadBookmarks();

        // Show message
        showMessage('Bookmark removed!', 'info');
    }
}

// Create export data object - shared by export and sync functions
function createExportData() {
    const bookmarks = getBookmarksFromStorage();
    const note = window.Notes ? window.Notes.getNoteFromStorage() : null;
    const tasks = window.Tasks ? window.Tasks.getTasksFromStorage() : [];

    // Enhanced sticky notes data retrieval with error handling
    let stickyNotes = [];
    try {
        if (window.Sticky && window.Sticky.getStickyNotesFromStorage) {
            stickyNotes = window.Sticky.getStickyNotesFromStorage();
        } else {
            const stickyData = safeLocalStorageOperation('get', 'stickyNotes');
            stickyNotes = stickyData ? JSON.parse(stickyData) : [];
        }
    } catch (error) {
        console.warn('Error retrieving sticky notes for export:', error);
        stickyNotes = [];
    }

    // Enhanced guides data retrieval with error handling
    let guides = [];
    try {
        if (window.Guides && window.Guides.getGuidesFromStorage) {
            guides = window.Guides.getGuidesFromStorage();
        } else {
            const guidesData = safeLocalStorageOperation('get', 'guides');
            guides = guidesData ? JSON.parse(guidesData) : [];
        }
    } catch (error) {
        console.warn('Error retrieving guides for export:', error);
        guides = [];
    }

    // Enhanced working links data retrieval with validation
    let workingLinks = [];
    try {
        if (window.Working && window.Working.getWorkingLinksFromStorage) {
            workingLinks = window.Working.getWorkingLinksFromStorage();
        } else {
            const workingData = safeLocalStorageOperation('get', 'workingLinks');
            workingLinks = workingData ? JSON.parse(workingData) : [];
        }

        // Validate working links data structure
        workingLinks = workingLinks.filter(link =>
            link &&
            typeof link === 'object' &&
            link.id &&
            link.url &&
            typeof link.url === 'string' &&
            link.url.trim() !== ''
        );
    } catch (error) {
        console.warn('Error retrieving working links for export:', error);
        workingLinks = [];
    }

    // Enhanced timeline data retrieval
    let timelineActivities = [];
    try {
        if (window.TimelineTracker && window.TimelineTracker.getTimelineActivities) {
            timelineActivities = window.TimelineTracker.getTimelineActivities();
        } else {
            const timelineData = safeLocalStorageOperation('get', 'company-timeline-activities');
            timelineActivities = timelineData ? JSON.parse(timelineData) : [];
        }

        // Validate timeline data structure
        timelineActivities = timelineActivities.filter(activity =>
            activity &&
            typeof activity === 'object' &&
            activity.id &&
            activity.date &&
            activity.activity &&
            activity.desc
        );
    } catch (error) {
        console.warn('Error retrieving timeline activities for export:', error);
        timelineActivities = [];
    }
    // Enhanced commands data retrieval with validation
    let commands = [];
    try {
        if (window.Commands && window.Commands.getCommandsFromStorage) {
            commands = window.Commands.getCommandsFromStorage();
        } else {
            const commandsData = safeLocalStorageOperation('get', 'commands');
            commands = commandsData ? JSON.parse(commandsData) : [];
        }
        // Validate commands data structure
        commands = commands.filter(cmd =>
            cmd &&
            typeof cmd === 'object' &&
            cmd.text &&
            typeof cmd.text === 'string' &&
            cmd.text.trim() !== ''
        );
    } catch (error) {
        console.warn('Error retrieving commands for export:', error);
        commands = [];
    }


    // Create comprehensive export data object
    const exportData = {
        version: '2.4', // Updated version for commands support
        exportDate: new Date().toISOString(),
        bookmarks: bookmarks || [],
        note: note || null,
        tasks: tasks || [],
        stickyNotes: stickyNotes || [],
        guides: guides || [],
        workingLinks: workingLinks || [],
        commands: commands || [],
        timelineActivities: timelineActivities || []
    };

    // Add metadata for better import handling
    exportData.metadata = {
        bookmarkCount: exportData.bookmarks.length,
        taskCount: exportData.tasks.length,
        stickyNoteCount: exportData.stickyNotes.length,
        guideCount: exportData.guides.length,
        workingLinkCount: exportData.workingLinks.length,
        commandCount: exportData.commands.length,
        timelineActivityCount: exportData.timelineActivities.length,
        hasNote: !!exportData.note
    };

    return exportData;
}

// Export bookmarks function with enhanced working links support
function exportBookmarks() {
    try {
        const exportData = createExportData();

        // Check if there's any data to export
        const hasBookmarks = exportData.bookmarks && exportData.bookmarks.length > 0;
        const hasNote = exportData.note && exportData.note.content && exportData.note.content.trim() !== '';
        const hasTasks = exportData.tasks && exportData.tasks.length > 0;
        const hasStickyNotes = exportData.stickyNotes && exportData.stickyNotes.length > 0;
            const hasCommands = exportData.commands && exportData.commands.length > 0;

        const hasGuides = exportData.guides && exportData.guides.length > 0;
        const hasWorkingLinks = exportData.workingLinks && exportData.workingLinks.length > 0;
        const hasTimelineActivities = exportData.timelineActivities && exportData.timelineActivities.length > 0;

        if (!hasBookmarks && !hasNote && !hasTasks && !hasStickyNotes && !hasGuides && !hasCommands && !hasWorkingLinks && !hasTimelineActivities) {
            showMessage('No data to export', 'error');
            return;
        }

        // Create a formatted JSON blob
    const exportDataJson = JSON.stringify(exportData, null, 2);
    const blob = new Blob([exportDataJson], { type: 'application/json' });

        // Create download link with enhanced filename
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        a.download = `bookmark-manager-backup-${timestamp}.json`;

    // Trigger download
    document.body.appendChild(a);
    a.click();

        // Cleanup with error handling
    setTimeout(() => {
            try {
                if (document.body.contains(a)) {
        document.body.removeChild(a);
                }
        URL.revokeObjectURL(url);
            } catch (cleanupError) {
                console.warn('Error during export cleanup:', cleanupError);
            }
        }, 100);

        // Show success message with export summary
        const summary = [];
        if (hasBookmarks) summary.push(`${exportData.bookmarks.length} bookmarks`);
        if (hasNote) summary.push('1 note');
        if (hasTasks) summary.push(`${exportData.tasks.length} tasks`);
        if (hasStickyNotes) summary.push(`${exportData.stickyNotes.length} sticky notes`);
        if (hasGuides) summary.push(`${exportData.guides.length} guides`);
        if (hasCommands) summary.push(`${exportData.commands.length} commands`);

        if (hasWorkingLinks) summary.push(`${exportData.workingLinks.length} working links`);

        showMessage(`Export successful! Included: ${summary.join(', ')}`, 'success');

    } catch (error) {
        console.error('Export error:', error);
        showMessage('Export failed: ' + error.message, 'error');
    }
}

// Import bookmarks function with enhanced working links support and validation
function importBookmarks(e) {
    const file = e.target.files[0];

    if (!file) {
        return;
    }

    // Validate file type
    if (!file.type.includes('json') && !file.name.endsWith('.json')) {
        showMessage('Please select a valid JSON file', 'error');
        e.target.value = '';
        return;
    }

    // Check file size (limit to 10MB for safety)
    if (file.size > 10 * 1024 * 1024) {
        showMessage('File too large. Please select a file smaller than 10MB', 'error');
        e.target.value = '';
        return;
    }

    const reader = new FileReader();

    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            console.log('Import data structure:', Object.keys(importedData || {}));
            console.log('Full imported data:', importedData);
            console.log('Available modules:', {
                Notes: !!window.Notes,
                Tasks: !!window.Tasks,
                Sticky: !!window.Sticky,
                Guides: !!window.Guides,
                Working: !!window.Working
            });

            // Handle different formats
            if (Array.isArray(importedData)) {
                // Legacy format - just bookmarks array
                if (importedData.length > 0) {
                    console.log('Processing legacy bookmarks array:', importedData.length);
                    // Ensure legacy bookmarks have the right structure
                    const legacyBookmarks = importedData.map(bookmark => ({
                        id: bookmark.id || Date.now() + Math.random(),
                        name: bookmark.name || bookmark.title || 'Untitled',
                        url: bookmark.url || '',
                        color: bookmark.color || getRandomColor(),
                        category: bookmark.category || '', // Handle legacy bookmarks without category
                        isDefault: bookmark.isDefault || false
                    }));

                    const success = safeLocalStorageOperation('set', 'bookmarks', JSON.stringify(legacyBookmarks));
                    if (success === true) {
                        setTimeout(() => loadBookmarks(), 50);
                    }
                }
                showMessage('Legacy format imported successfully!', 'success');

            } else if (importedData && typeof importedData === 'object') {
                // Enhanced format with validation

                // Import bookmarks with validation
                if (Array.isArray(importedData.bookmarks) && importedData.bookmarks.length > 0) {
                    console.log('Processing bookmarks:', importedData.bookmarks.length);
                    const validBookmarks = importedData.bookmarks.filter(bookmark =>
                        bookmark &&
                        typeof bookmark === 'object' &&
                        (bookmark.name || bookmark.title) &&
                        bookmark.url &&
                        typeof (bookmark.name || bookmark.title) === 'string' &&
                        typeof bookmark.url === 'string' &&
                        (bookmark.name || bookmark.title).trim() !== '' &&
                        bookmark.url.trim() !== ''
                    ).map(bookmark => ({
                        id: bookmark.id || Date.now() + Math.random(),
                        name: bookmark.name || bookmark.title, // Ensure 'name' property exists
                        url: bookmark.url,
                        color: bookmark.color || getRandomColor(),
                        category: bookmark.category || '', // Handle bookmarks without category
                        isDefault: bookmark.isDefault || false
                    }));

                    console.log('Valid bookmarks:', validBookmarks.length);
                    if (validBookmarks.length > 0) {
                        const success = safeLocalStorageOperation('set', 'bookmarks', JSON.stringify(validBookmarks));
                        if (success === true) {
                            console.log('Bookmarks saved to localStorage, triggering reload...');
                            setTimeout(() => {
                                console.log('Loading bookmarks from storage...');
                                loadBookmarks();
                                // Verify data was saved
                                const savedBookmarks = getBookmarksFromStorage();
                                console.log('Bookmarks in storage after import:', savedBookmarks.length);
                            }, 50);
                        } else {
                            console.error('Failed to save bookmarks to localStorage');
                        }
                    }
                } else if (importedData.bookmarks !== undefined) {
                    console.log('Bookmarks data exists but is not a valid array:', typeof importedData.bookmarks);
                }

                // Import note with validation
                if (importedData.note && typeof importedData.note === 'object' && importedData.note.content) {
                    console.log('Processing note content');
                    const success = safeLocalStorageOperation('set', 'note', JSON.stringify(importedData.note));
                    if (success === true && window.Notes && window.Notes.initializeNote) {
                        setTimeout(() => window.Notes.initializeNote(), 50);
                    } else if (success !== true) {
                        console.error('Failed to save note to localStorage');
                    }
                } else if (importedData.note !== undefined) {
                    console.log('Note data exists but is not valid:', typeof importedData.note);
                }

                // Import tasks with validation
                if (Array.isArray(importedData.tasks) && importedData.tasks.length > 0) {
                    console.log('Processing tasks:', importedData.tasks.length);
                    const validTasks = importedData.tasks.filter(task =>
                        task &&
                        typeof task === 'object' &&
                        task.text &&
                        typeof task.text === 'string' &&
                        task.text.trim() !== ''
                    );

                    console.log('Valid tasks:', validTasks.length);
                    if (validTasks.length > 0) {
                        const success = safeLocalStorageOperation('set', 'tasks', JSON.stringify(validTasks));
                        if (success === true && window.Tasks && window.Tasks.loadTasks) {
                            setTimeout(() => window.Tasks.loadTasks(), 100);
                        } else if (success !== true) {
                            console.error('Failed to save tasks to localStorage');
                        }
                    }
                } else if (importedData.tasks !== undefined) {
                    console.log('Tasks data exists but is not a valid array:', typeof importedData.tasks);
                }

                // Import sticky notes with validation
                if (Array.isArray(importedData.stickyNotes) && importedData.stickyNotes.length > 0) {
                    console.log('Processing sticky notes:', importedData.stickyNotes.length);
                    const validStickyNotes = importedData.stickyNotes.filter(note =>
                        note &&
                        typeof note === 'object' &&
                        note.content &&
                        typeof note.content === 'string' &&
                        note.content.trim() !== ''
                    );

                    console.log('Valid sticky notes:', validStickyNotes.length);
                    if (validStickyNotes.length > 0) {
                        const success = safeLocalStorageOperation('set', 'stickyNotes', JSON.stringify(validStickyNotes));
                        if (success === true && window.Sticky && window.Sticky.displayStickyNotes) {
                            setTimeout(() => window.Sticky.displayStickyNotes(), 150);
                        } else if (success !== true) {
                            console.error('Failed to save sticky notes to localStorage');
                        }
                    }
                } else if (importedData.stickyNotes !== undefined) {
                    console.log('Sticky notes data exists but is not a valid array:', typeof importedData.stickyNotes);
                }

                // Import guides with validation
                if (Array.isArray(importedData.guides) && importedData.guides.length > 0) {
                    console.log('Processing guides:', importedData.guides.length);
                    const validGuides = importedData.guides.filter(guide =>
                        guide &&
                        typeof guide === 'object' &&
                        guide.title &&
                        typeof guide.title === 'string' &&
                        guide.title.trim() !== ''
                    );

                    console.log('Valid guides:', validGuides.length);
                    if (validGuides.length > 0) {
                        const success = safeLocalStorageOperation('set', 'guides', JSON.stringify(validGuides));
                        if (success === true && window.Guides && window.Guides.displayGuidesList) {
                            setTimeout(() => window.Guides.displayGuidesList(), 150);
                        } else if (success !== true) {
                            console.error('Failed to save guides to localStorage');
                        }

                    }
                } else if (importedData.guides !== undefined) {
                    console.log('Guides data exists but is not a valid array:', typeof importedData.guides);
                }


                // Import commands with validation
                if (Array.isArray(importedData.commands) && importedData.commands.length > 0) {
                    console.log('Processing commands:', importedData.commands.length);
                    const validCommands = importedData.commands.filter(cmd =>
                        cmd &&
                        typeof cmd === 'object' &&
                        cmd.text &&
                        typeof cmd.text === 'string' &&
                        cmd.text.trim() !== ''
                    ).map(cmd => ({
                        id: cmd.id || Date.now() + Math.random(),
                        text: cmd.text.trim(),
                        color: cmd.color || getRandomColor(),
                        createdAt: cmd.createdAt || new Date().toISOString()
                    }));

                    console.log('Valid commands:', validCommands.length);
                    if (validCommands.length > 0) {
                        const success = safeLocalStorageOperation('set', 'commands', JSON.stringify(validCommands));
                        if (success === true && window.Commands && window.Commands.loadCommands) {
                            setTimeout(() => window.Commands.loadCommands(), 150);
                        } else if (success !== true) {
                            console.error('Failed to save commands to localStorage');
                        }
                    }
                } else if (importedData.commands !== undefined) {
                    console.log('Commands data exists but is not a valid array:', typeof importedData.commands);
                }

                // Enhanced working links import with comprehensive validation
                if (Array.isArray(importedData.workingLinks) && importedData.workingLinks.length > 0) {
                    console.log('Processing working links:', importedData.workingLinks.length);
                    const validWorkingLinks = importedData.workingLinks.filter(link => {
                        if (!link || typeof link !== 'object') return false;
                        if (!link.url || typeof link.url !== 'string' || link.url.trim() === '') return false;

                        // Validate URL format
                        try {
                            const url = link.url.trim();
                            // Basic URL validation
                            if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
                                return false;
                            }
                            new URL(url); // This will throw if invalid
                            return true;
                        } catch {
                            return false;
                        }
                    }).map(link => ({
                        id: link.id || Date.now() + Math.random(), // Ensure unique ID
                        url: link.url.trim(),
                        title: link.title || new URL(link.url.trim()).hostname.replace('www.', '').charAt(0).toUpperCase() + new URL(link.url.trim()).hostname.replace('www.', '').slice(1),
                        timestamp: link.timestamp || new Date().toISOString()
                    }));

                    console.log('Valid working links:', validWorkingLinks.length);
                    if (validWorkingLinks.length > 0) {

                // Import commands with validation
                if (Array.isArray(importedData.commands) && importedData.commands.length > 0) {
                    console.log('Processing commands:', importedData.commands.length);
                    const validCommands = importedData.commands.filter(cmd =>
                        cmd &&
                        typeof cmd === 'object' &&
                        cmd.text &&
                        typeof cmd.text === 'string' &&
                        cmd.text.trim() !== ''
                    ).map(cmd => ({
                        id: cmd.id || Date.now() + Math.random(),
                        text: cmd.text.trim(),
                        color: cmd.color || getRandomColor(),
                        createdAt: cmd.createdAt || new Date().toISOString()
                    }));

                    console.log('Valid commands:', validCommands.length);
                    if (validCommands.length > 0) {
                        const success = safeLocalStorageOperation('set', 'commands', JSON.stringify(validCommands));
                        if (success === true && window.Commands && window.Commands.loadCommands) {
                            setTimeout(() => window.Commands.loadCommands(), 150);
                        } else if (success !== true) {
                            console.error('Failed to save commands to localStorage');
                        }
                    }
                } else if (importedData.commands !== undefined) {
                    console.log('Commands data exists but is not a valid array:', typeof importedData.commands);
                }

                        const success = safeLocalStorageOperation('set', 'workingLinks', JSON.stringify(validWorkingLinks));
                        if (success === true && window.Working && window.Working.loadWorkingLinks) {
                            setTimeout(() => {
                                // Refresh metadata for imported links that might not have title/favicon
                                if (window.Working.refreshAllMetadata) {
                                    window.Working.refreshAllMetadata();
                                }
                                window.Working.loadWorkingLinks();
                            }, 200);
                        } else if (success !== true) {
                            console.error('Failed to save working links to localStorage');
                        }
                    }
                } else if (importedData.workingLinks !== undefined) {
                    console.log('Working links data exists but is not a valid array:', typeof importedData.workingLinks);
                }

                // Import timeline activities with validation
                if (Array.isArray(importedData.timelineActivities) && importedData.timelineActivities.length > 0) {
                    console.log('Processing timeline activities:', importedData.timelineActivities.length);
                    const validTimelineActivities = importedData.timelineActivities.filter(activity =>
                        activity &&
                        typeof activity === 'object' &&
                        activity.date &&
                        activity.activity &&
                        typeof activity.activity === 'string' &&
                        activity.activity.trim() !== '' &&
                        activity.desc &&
                        typeof activity.desc === 'string' &&
                        activity.desc.trim() !== ''
                    ).map(activity => ({
                        id: activity.id || Date.now() + Math.random(),
                        date: activity.date,
                        activity: activity.activity.trim(),
                        desc: activity.desc.trim(),
                        timestamp: activity.timestamp || new Date().toISOString()
                    }));

                    console.log('Valid timeline activities:', validTimelineActivities.length);
                    if (validTimelineActivities.length > 0) {
                        const success = safeLocalStorageOperation('set', 'company-timeline-activities', JSON.stringify(validTimelineActivities));
                        if (success === true) {
                        } else {
                            console.error('Failed to save timeline activities to localStorage');
                        }
                    }
                } else if (importedData.timelineActivities !== undefined) {
                    console.log('Timeline activities data exists but is not a valid array:', typeof importedData.timelineActivities);
                }

                showMessage('Import successful!', 'success');

            } else {
                throw new Error('Invalid file format');
            }

        } catch (error) {
            console.error('Import error:', error);
            if (error instanceof SyntaxError) {
                showMessage('Error: Invalid JSON file format', 'error');
            } else {
                showMessage('Error importing data: ' + error.message, 'error');
            }
        }
    };

    reader.onerror = function() {
        showMessage('Error reading file', 'error');
    };

    reader.readAsText(file);

    // Reset file input
    e.target.value = '';
}

// Get bookmarks from localStorage
function getBookmarksFromStorage() {
    let bookmarks = localStorage.getItem('bookmarks');

    if (bookmarks === null) {
        const defaultBookmarks = [
            {
                id: Date.now(),
                name: 'Markdown Documents',
                url: 'https://nos1hahaha.bitbucket.io/reading.html',
                color: '#f6f4ddff',
                isDefault: true
            },
            {
                id: Date.now(),
                name: 'Timeline',
                url: 'timeline.html',
                color: 'rgb(202, 255, 191)',
                isDefault: true
            }
        ];
        localStorage.setItem('bookmarks', JSON.stringify(defaultBookmarks));
        return defaultBookmarks;
    } else {
        return JSON.parse(bookmarks);
    }
}

// Optimized bookmark rendering using document fragments
function createBookmarkElement(bookmark) {
    // Create bookmark item
    const bookmarkItem = document.createElement('div');
    bookmarkItem.className = bookmark.isDefault ? 'bookmark-item default-bookmark' : 'bookmark-item';
    bookmarkItem.setAttribute('role', 'gridcell');
    bookmarkItem.setAttribute('aria-label', `Bookmark: ${bookmark.name}`);

    // Apply color if exists, or generate a new one
    const backgroundColor = bookmark.color || getRandomColor();
    bookmarkItem.style.backgroundColor = backgroundColor;

    // Create bookmark info container
    const bookmarkInfo = document.createElement('div');
    bookmarkInfo.className = 'bookmark-info';
    bookmarkInfo.style.cursor = 'pointer';
    bookmarkInfo.setAttribute('tabindex', '0');
    bookmarkInfo.setAttribute('role', 'button');
    bookmarkInfo.setAttribute('aria-label', `Open ${bookmark.name}`);

    // Add keyboard support for bookmark opening
    const openBookmark = () => {
        window.open(bookmark.url, '_blank');
    };

    bookmarkInfo.addEventListener('click', openBookmark);
    bookmarkInfo.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openBookmark();
        }
    });

    // Create bookmark name
    const bookmarkName = document.createElement('span');
    bookmarkName.className = 'bookmark-name';
    bookmarkName.textContent = bookmark.name;

    // Create bookmark URL
    const bookmarkUrl = document.createElement('span');
    bookmarkUrl.className = 'bookmark-url';
    bookmarkUrl.textContent = bookmark.url;

    // Append name and URL to info container
    bookmarkInfo.appendChild(bookmarkName);
    bookmarkInfo.appendChild(bookmarkUrl);

    // Create bookmark actions container
    const bookmarkActions = document.createElement('div');
    bookmarkActions.className = 'bookmark-actions';

    // Create delete button (only for non-document.html bookmarks)
    if (!bookmark.url.includes('nos1hahaha.bitbucket.io/reading.html')) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash" aria-hidden="true"></i>';
        deleteBtn.setAttribute('aria-label', `Delete ${bookmark.name} bookmark`);
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering the bookmark click
            deleteBookmark(bookmark.id);
        });

        // Append delete button to actions
        bookmarkActions.appendChild(deleteBtn);
    }

    // Append info and actions to bookmark item
    bookmarkItem.appendChild(bookmarkInfo);
    bookmarkItem.appendChild(bookmarkActions);

    return bookmarkItem;
}

// Load bookmarks with category grouping
function loadBookmarks() {
    console.log('loadBookmarks called');
    const bookmarks = getBookmarksFromStorage();
    console.log('Retrieved bookmarks:', bookmarks.length, bookmarks);

    const bookmarksList = window.UI.elements.bookmarksList;
    console.log('Bookmarks list element:', bookmarksList);

    if (!bookmarksList) {
        console.error('Bookmarks list element not found!');
        return;
    }

    bookmarksList.innerHTML = '';

    if (bookmarks.length === 0) {
        console.log('No bookmarks found, showing empty message');
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'No bookmarks yet. Add some below!';
        bookmarksList.appendChild(emptyMessage);
        return;
    }

    console.log('Creating grouped bookmark elements...');

    // Group bookmarks by category
    const groupedBookmarks = groupBookmarksByCategory(bookmarks);

    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();

    // Create category groups in order: empty, personal, work, doc, then others alphabetically
    const categoryOrder = ['', 'personal', 'work', 'doc'];
    const allCategories = Object.keys(groupedBookmarks);
    const otherCategories = allCategories.filter(cat => !categoryOrder.includes(cat)).sort();
    const orderedCategories = [...categoryOrder.filter(cat => groupedBookmarks[cat]), ...otherCategories];

    orderedCategories.forEach(category => {
        if (groupedBookmarks[category] && groupedBookmarks[category].length > 0) {
            // Create category header
            const categoryHeader = createCategoryHeader(category);
            fragment.appendChild(categoryHeader);

            // Create category group container
            const categoryGroup = document.createElement('div');
            categoryGroup.className = 'category-group';

            // Add bookmarks in this category
            groupedBookmarks[category].forEach(bookmark => {
                categoryGroup.appendChild(createBookmarkElement(bookmark));
            });

            fragment.appendChild(categoryGroup);
        }
    });

    // Single DOM manipulation
    bookmarksList.appendChild(fragment);
    console.log('Bookmarks loaded successfully with grouping');
}

// Helper function to group bookmarks by category
function groupBookmarksByCategory(bookmarks) {
    const groups = {};

    bookmarks.forEach(bookmark => {
        // Handle bookmarks without category or with empty category
        const category = bookmark.category || '';

        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(bookmark);
    });

    return groups;
}

// Helper function to create category header
function createCategoryHeader(category) {
    const header = document.createElement('div');
    header.className = 'category-header';

    const categoryName = category === '' ? 'Uncategorized' : category.charAt(0).toUpperCase() + category.slice(1);
    header.textContent = categoryName;

    return header;
}

// Restore default bookmarks and clear all data with enhanced working links support
function restoreDefault() {
    const confirmMessage = 'This will permanently delete ALL your data:\n\n' +
                          '• All bookmarks\n' +
                          '• Notes content\n' +
                          '• All tasks\n' +
                          '• All sticky notes\n' +
                          '• All working links\n' +
                          '• View preferences\n\n' +
                          'Default bookmarks will be restored.\n\n' +
                          'Are you absolutely sure you want to continue?';

    if (confirm(confirmMessage)) {
        try {
            // Get current data counts for feedback
            const currentBookmarks = getBookmarksFromStorage();
            const currentNote = window.Notes ? window.Notes.getNoteFromStorage() : null;
            const currentTasks = window.Tasks ? window.Tasks.getTasksFromStorage() : [];
            const currentSticky = JSON.parse(localStorage.getItem('stickyNotes') || '[]');
            const currentGuides = JSON.parse(localStorage.getItem('guides') || '[]');
            const currentWorking = JSON.parse(localStorage.getItem('workingLinks') || '[]');

            const clearedCounts = {
                bookmarks: currentBookmarks.length,
                tasks: currentTasks.length,
                stickyNotes: currentSticky.length,
                guides: currentGuides.length,
                workingLinks: currentWorking.length,
                hasNote: !!(currentNote && currentNote.content && currentNote.content.trim())
            };

            // Clear all localStorage data using safe operations
            const keysToRemove = [
                'bookmarks',
                'note',
                'tasks',
                'stickyNotes',
                'guides',
                'workingLinks',
                'commands',
                'viewMode'
            ];

            keysToRemove.forEach(key => {
                safeLocalStorageOperation('remove', key);
            });

            // Initialize all modules in proper order
            setTimeout(() => {
                // 1. Load default bookmarks first
        loadBookmarks();

                // 2. Initialize note module
        if (window.Notes && window.Notes.initializeNote) {
            window.Notes.initializeNote();
        }

                // 3. Initialize tasks module
        if (window.Tasks && window.Tasks.loadTasks) {
            window.Tasks.loadTasks();
        }

                // 4. Initialize sticky notes module
        if (window.Sticky && window.Sticky.displayStickyNotes) {
            window.Sticky.displayStickyNotes();
        }

                // 5. Initialize guides module
        if (window.Guides && window.Guides.displayGuidesList) {
            window.Guides.displayGuidesList();
        }

                // 5. Initialize working links module with clean state
                if (window.Working) {
                    if (window.Working.loadWorkingLinks) {
            window.Working.loadWorkingLinks();
                    }
                    // Clear working input if it exists
                    if (window.UI && window.UI.elements && window.UI.elements.workingBookmarkInput) {
                        window.UI.elements.workingBookmarkInput.value = '';
                    }
        }

                // 6. Reset view mode to default
        if (window.UI && window.UI.setViewMode) {
            window.UI.setViewMode('grid');
        }

                // Create summary of what was cleared
                const clearedSummary = [];
                if (clearedCounts.bookmarks > 0) clearedSummary.push(`${clearedCounts.bookmarks} bookmarks`);
                if (clearedCounts.hasNote) clearedSummary.push('1 note');
                if (clearedCounts.tasks > 0) clearedSummary.push(`${clearedCounts.tasks} tasks`);
                if (clearedCounts.stickyNotes > 0) clearedSummary.push(`${clearedCounts.stickyNotes} sticky notes`);
                if (clearedCounts.workingLinks > 0) clearedSummary.push(`${clearedCounts.workingLinks} working links`);

                const message = clearedSummary.length > 0
                    ? `Reset complete! Cleared: ${clearedSummary.join(', ')}. Default bookmarks restored.`
                    : 'Reset complete! Default bookmarks restored.';

                showMessage(message, 'success');

            }, 100);

        } catch (error) {
            console.error('Restore default error:', error);
            showMessage('Error during reset: ' + error.message + '. Some data may not have been cleared.', 'error');
        }
    }
}

// Setup bookmark-specific event listeners
function setupBookmarkEventListeners() {
    // Add bookmark event
    window.UI.elements.bookmarkForm.addEventListener('submit', addBookmark);

    // Restore default data
    window.UI.elements.restoreDefaultBtn.addEventListener('click', restoreDefault);

    // Export bookmarks
    window.UI.elements.exportBookmarksBtn.addEventListener('click', exportBookmarks);

    // Sync bookmarks
    window.UI.elements.syncBookmarksBtn.addEventListener('click', () => {
        if (window.ApiHelper && window.ApiHelper.syncToCloud) {
            window.ApiHelper.syncToCloud();
        } else {
            showMessage('Sync functionality not available', 'error');
        }
    });

    // Load from cloud button
    window.UI.elements.loadFromCloudBtn.addEventListener('click', async () => {
        if (window.ApiHelper && window.ApiHelper.loadAndOverwriteFromCloud) {
            // Confirm with user before overwriting local data
            const confirmLoad = confirm('This will load data from cloud and overwrite your local data. Are you sure you want to continue?');

            if (confirmLoad) {
                try {
                    const success = await window.ApiHelper.loadAndOverwriteFromCloud();

                    if (success) {
                        // Reload all modules to display the new data
                        setTimeout(() => {
                            window.Bookmarks.loadBookmarks();
                            if (window.Notes && window.Notes.initializeNote) {
                                window.Notes.initializeNote();
                            }
                            if (window.Tasks && window.Tasks.loadTasks) {
                                window.Tasks.loadTasks();
                            }
                            if (window.Sticky && window.Sticky.displayStickyNotes) {
                                window.Sticky.displayStickyNotes();
                            }
                                if (window.Guides && window.Guides.displayGuidesList) {
                                    window.Guides.displayGuidesList();
                                }

                            if (window.Working && window.Working.loadWorkingLinks) {
                                window.Working.loadWorkingLinks();
                            }
                            if (window.Commands && window.Commands.loadCommands) {
                                window.Commands.loadCommands();
                            }
                        }, 100);
                    }
                } catch (error) {
                    console.error('Failed to load from cloud:', error);
                    showMessage('Failed to load from cloud', 'error');
                }
            }
        } else {
            showMessage('Load from cloud functionality not available', 'error');
        }
    });

    // Import bookmarks button click
    window.UI.elements.importBookmarksBtn.addEventListener('click', () => {
        window.UI.elements.importFileInput.click();
    });

    // Import bookmarks file change
    window.UI.elements.importFileInput.addEventListener('change', importBookmarks);
}

// Initialize bookmark module
function initializeBookmarks() {
    loadBookmarks();
    setupBookmarkEventListeners();
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.Bookmarks = {
        initializeBookmarks,
        loadBookmarks,
        addBookmark,
        deleteBookmark,
        exportBookmarks,
        importBookmarks,
        restoreDefault,
        getBookmarksFromStorage,
        createBookmarkElement,
        createExportData
    };
}