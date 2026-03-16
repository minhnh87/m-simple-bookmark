// UI Module - Handles DOM elements, event listeners, tabs, and view modes

// DOM Elements
const bookmarkForm = document.getElementById('bookmark-form');
const bookmarkNameInput = document.getElementById('bookmark-name');
const bookmarkUrlInput = document.getElementById('bookmark-url');
const bookmarkCategoryInput = document.getElementById('bookmark-category');
const bookmarksList = document.getElementById('bookmarks-list');
const toggleFormBtn = document.getElementById('toggle-form');
const cancelAddBtn = document.getElementById('cancel-add');
const addFormContainer = document.getElementById('add-form');
const notesList = document.getElementById('notes-list');
const restoreDefaultBtn = document.getElementById('restore-default');
const exportBookmarksBtn = document.getElementById('export-bookmarks');
const syncBookmarksBtn = document.getElementById('sync-bookmarks');
const loadFromCloudBtn = document.getElementById('load-from-cloud');
const importBookmarksBtn = document.getElementById('import-bookmarks');
const importFileInput = document.getElementById('import-file');
const gridViewBtn = document.getElementById('grid-view');
const rowViewBtn = document.getElementById('row-view');
const notesTab = document.getElementById('notes-tab');
const guidesTab = document.getElementById('guides-tab');
const tasksTab = document.getElementById('tasks-tab');
const stickyTab = document.getElementById('sticky-tab');
const commandsTab = document.getElementById('commands-tab');
const commandsContent = document.getElementById('commands-content');
const commandsList = document.getElementById('commands-list');
const commandsInput = document.getElementById('commands-input');

const notesContent = document.getElementById('notes-content');
const guidesContent = document.getElementById('guides-content');
const tasksContent = document.getElementById('tasks-content');
const stickyContent = document.getElementById('sticky-content');
const tasksList = document.getElementById('tasks-list');
const taskInput = document.getElementById('task-input');
const stickyList = document.getElementById('sticky-list');
const stickyInput = document.getElementById('sticky-input');
const guidesList = document.getElementById('guides-list');
const guidesInput = document.getElementById('guides-input');
// Bookmark tabs elements
const bookmarksTab = document.getElementById('bookmarks-tab');
const workingBookmarkTab = document.getElementById('working-bookmark-tab');
const bookmarksContent = document.getElementById('bookmarks-content');
const workingBookmarkContent = document.getElementById('working-bookmark-content');
const workingBookmarkList = document.getElementById('working-bookmark-list');
const workingBookmarkInput = document.getElementById('working-bookmark-input');

// Initialize UI when DOM is loaded
function initializeUI() {
    initializeTabs();
    initializeBookmarkTabs();
    initViewMode();
    setupEventListeners();
}

// Tab functionality with keyboard navigation
function initializeTabs() {
    notesTab.addEventListener('click', () => {
        switchTab('notes');
    });

    if (commandsTab) {
        commandsTab.addEventListener('click', () => {
            switchTab('commands');
        });
    }

    guidesTab.addEventListener('click', () => {
        switchTab('guides');
    });

    tasksTab.addEventListener('click', () => {
        switchTab('tasks');
    });

    stickyTab.addEventListener('click', () => {
        switchTab('sticky');
    });



    // Add keyboard navigation for tabs
    [notesTab, commandsTab, guidesTab, tasksTab, stickyTab].forEach(tab => {
        if (!tab) return;
        tab.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const currentTab = e.target;
                const tabs = [notesTab, commandsTab, guidesTab, tasksTab, stickyTab].filter(Boolean);
                const tabNames = ['notes', 'commands', 'guides', 'tasks', 'sticky'].slice(0, tabs.length);
                const currentIndex = tabs.indexOf(currentTab);

                let targetIndex;
                if (e.key === 'ArrowRight') {
                    targetIndex = (currentIndex + 1) % tabs.length;
                } else {
                    targetIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                }

                const targetTab = tabs[targetIndex];
                const targetTabName = tabNames[targetIndex];

                switchTab(targetTabName);
                targetTab.focus();
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.target.click();
            }
        });
    });
}

function switchTab(tabName) {
    // Remove active class from all tabs and content
    [notesTab, commandsTab, guidesTab, tasksTab, stickyTab].filter(Boolean).forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('tabindex', '-1');
    });
    [notesContent, commandsContent, guidesContent, tasksContent, stickyContent].filter(Boolean).forEach(content => {
        content.classList.remove('active');
    });

    // Add active class to selected tab and content
    if (tabName === 'notes') {
        notesTab.classList.add('active');
        notesContent.classList.add('active');
        notesTab.setAttribute('aria-selected', 'true');
        notesTab.setAttribute('tabindex', '0');
    } else if (tabName === 'commands' && commandsTab && commandsContent) {
        commandsTab.classList.add('active');
        commandsContent.classList.add('active');
        commandsTab.setAttribute('aria-selected', 'true');
        commandsTab.setAttribute('tabindex', '0');
    } else if (tabName === 'guides') {
        guidesTab.classList.add('active');
        guidesContent.classList.add('active');
        guidesTab.setAttribute('aria-selected', 'true');
        guidesTab.setAttribute('tabindex', '0');

        // Re-setup guides input listeners when tab becomes active
        if (window.Guides && window.Guides.setupInputListeners) {
            setTimeout(() => window.Guides.setupInputListeners(), 100);
        }
    } else if (tabName === 'tasks') {
        tasksTab.classList.add('active');
        tasksContent.classList.add('active');
        tasksTab.setAttribute('aria-selected', 'true');
        tasksTab.setAttribute('tabindex', '0');
    } else if (tabName === 'sticky') {
        stickyTab.classList.add('active');
        stickyContent.classList.add('active');
        stickyTab.setAttribute('aria-selected', 'true');
        stickyTab.setAttribute('tabindex', '0');
    }
}

// Bookmark tab functionality
function initializeBookmarkTabs() {
    bookmarksTab.addEventListener('click', () => {
        switchBookmarkTab('bookmarks');
    });

    workingBookmarkTab.addEventListener('click', () => {
        switchBookmarkTab('working');
    });

    // Add keyboard navigation for bookmark tabs
    [bookmarksTab, workingBookmarkTab].forEach(tab => {
        if (!tab) return;
        tab.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const currentTab = e.target;
                const tabs = [bookmarksTab, workingBookmarkTab];
                const tabNames = ['bookmarks', 'working'];
                const currentIndex = tabs.indexOf(currentTab);

                let targetIndex;
                if (e.key === 'ArrowRight') {
                    targetIndex = (currentIndex + 1) % tabs.length;
                } else {
                    targetIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                }

                const targetTab = tabs[targetIndex];
                const targetTabName = tabNames[targetIndex];

                switchBookmarkTab(targetTabName);
                targetTab.focus();
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.target.click();
            }
        });
    });
}

function switchBookmarkTab(tabName) {
    // Remove active class from all bookmark tabs and content
    [bookmarksTab, workingBookmarkTab].forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('tabindex', '-1');
    });
    [bookmarksContent, workingBookmarkContent].forEach(content => {
        content.classList.remove('active');
    });

    // Add active class to selected tab and content
    if (tabName === 'bookmarks') {
        bookmarksTab.classList.add('active');
        bookmarksContent.classList.add('active');
        bookmarksTab.setAttribute('aria-selected', 'true');
        bookmarksTab.setAttribute('tabindex', '0');
    } else if (tabName === 'working') {
        workingBookmarkTab.classList.add('active');
        workingBookmarkContent.classList.add('active');
        workingBookmarkTab.setAttribute('aria-selected', 'true');
        workingBookmarkTab.setAttribute('tabindex', '0');
    }
}

// Initialize view mode from localStorage or default to grid
function initViewMode() {
    const viewMode = localStorage.getItem('viewMode') || 'grid';
    setViewMode(viewMode);
}

// Set view mode and save to localStorage
function setViewMode(mode) {
    // Update active button
    if (mode === 'grid') {
        gridViewBtn.classList.add('active');
        rowViewBtn.classList.remove('active');
        bookmarksList.classList.remove('row-view');

        // Update ARIA attributes
        gridViewBtn.setAttribute('aria-pressed', 'true');
        rowViewBtn.setAttribute('aria-pressed', 'false');
    } else {
        rowViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        bookmarksList.classList.add('row-view');

        // Update ARIA attributes
        rowViewBtn.setAttribute('aria-pressed', 'true');
        gridViewBtn.setAttribute('aria-pressed', 'false');
    }

    // Save to localStorage
    localStorage.setItem('viewMode', mode);
}

// Setup all event listeners
function setupEventListeners() {
    // Toggle form visibility
    toggleFormBtn.addEventListener('click', () => {
        if (addFormContainer.style.display === 'block') {
            addFormContainer.style.display = 'none';
        } else {
            addFormContainer.style.display = 'block';
            bookmarkNameInput.focus();
        }
    });

    // Cancel add bookmark
    cancelAddBtn.addEventListener('click', () => {
        addFormContainer.style.display = 'none';
        bookmarkForm.reset();
    });

    // View toggle events
    gridViewBtn.addEventListener('click', () => {
        setViewMode('grid');
    });

    rowViewBtn.addEventListener('click', () => {
        setViewMode('row');
    });
}

// Add CSS for messages (keeping this here as it's UI-related)
function addMessageStyles() {
    const messageStyles = document.createElement('style');
    messageStyles.textContent = `
        .message-container {
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        }

        .message {
            padding: 10px 16px;
            border-radius: 8px;
            color: #1a1a1a;
            font-weight: 500;
            font-size: 13px;
            line-height: 1.4;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06);
            animation: slide-in 0.3s ease-out;
            min-width: 200px;
            max-width: 320px;
            position: relative;
            pointer-events: auto;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-left: 3px solid #3498db;
        }

        .success {
            border-left-color: #27ae60;
        }

        .error {
            border-left-color: #e74c3c;
        }

        .info {
            border-left-color: #3498db;
        }

        .fade-out {
            animation: fade-out 0.3s ease-out forwards;
        }

        @keyframes slide-in {
            from {
                transform: translateY(-20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        @keyframes fade-out {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(-20px);
                opacity: 0;
            }
        }

        /* Mobile responsive */
        @media (max-width: 480px) {
            .message-container {
                top: 16px;
                right: 16px;
                left: 16px;
            }

            .message {
                min-width: auto;
                max-width: none;
            }
        }
    `;
    document.head.appendChild(messageStyles);
}

// Initialize message styles when UI loads
addMessageStyles();

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.UI = {
        initializeUI,
        switchTab,
        switchBookmarkTab,
        setViewMode,
        // Export DOM elements for other modules to use
        elements: {
            bookmarkForm,
            bookmarkNameInput,
            bookmarkUrlInput,
            bookmarkCategoryInput,
            bookmarksList,
            addFormContainer,
            notesList,
            restoreDefaultBtn,
            exportBookmarksBtn,
            syncBookmarksBtn,
            loadFromCloudBtn,
            importBookmarksBtn,
            importFileInput,
            tasksList,
            taskInput,
            stickyList,
            stickyInput,
            guidesList,
            guidesInput,
            workingBookmarkList,
            workingBookmarkInput,
            commandsList,
            commandsInput
        }
    };
}