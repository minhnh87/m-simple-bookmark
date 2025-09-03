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
const tasksTab = document.getElementById('tasks-tab');
const stickyTab = document.getElementById('sticky-tab');
const notesContent = document.getElementById('notes-content');
const tasksContent = document.getElementById('tasks-content');
const stickyContent = document.getElementById('sticky-content');
const tasksList = document.getElementById('tasks-list');
const taskInput = document.getElementById('task-input');
const stickyList = document.getElementById('sticky-list');
const stickyInput = document.getElementById('sticky-input');
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
    
    tasksTab.addEventListener('click', () => {
        switchTab('tasks');
    });
    
    stickyTab.addEventListener('click', () => {
        switchTab('sticky');
    });
    

    
    // Add keyboard navigation for tabs
    [notesTab, tasksTab, stickyTab].forEach(tab => {
        tab.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const currentTab = e.target;
                const tabs = [notesTab, tasksTab, stickyTab];
                const tabNames = ['notes', 'tasks', 'sticky'];
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
    [notesTab, tasksTab, stickyTab].forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('tabindex', '-1');
    });
    [notesContent, tasksContent, stickyContent].forEach(content => {
        content.classList.remove('active');
    });
    
    // Add active class to selected tab and content
    if (tabName === 'notes') {
        notesTab.classList.add('active');
        notesContent.classList.add('active');
        notesTab.setAttribute('aria-selected', 'true');
        notesTab.setAttribute('tabindex', '0');
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
            gap: 12px;
            pointer-events: none;
        }
        
        .message {
            padding: 16px 20px;
            border-radius: 12px;
            color: white;
            font-weight: 500;
            font-size: 14px;
            line-height: 1.4;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
            backdrop-filter: blur(8px);
            animation: slide-in 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            min-width: 280px;
            max-width: 400px;
            position: relative;
            pointer-events: auto;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .message::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            border-radius: 12px 12px 0 0;
        }
        
        .success {
            background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
        }
        
        .success::before {
            background: linear-gradient(90deg, #2ecc71, #27ae60);
        }
        
        .error {
            background: linear-gradient(135deg, #c0392b 0%, #e74c3c 100%);
        }
        
        .error::before {
            background: linear-gradient(90deg, #e74c3c, #c0392b);
        }
        
        .info {
            background: linear-gradient(135deg, #3498db 0%, #5dade2 100%);
        }
        
        .info::before {
            background: linear-gradient(90deg, #5dade2, #3498db);
        }
        
        .message:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .fade-out {
            animation: fade-out 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        @keyframes slide-in {
            from {
                transform: translateX(100%) scale(0.9);
                opacity: 0;
            }
            to {
                transform: translateX(0) scale(1);
                opacity: 1;
            }
        }
        
        @keyframes fade-out {
            from {
                transform: translateX(0) scale(1);
                opacity: 1;
            }
            to {
                transform: translateX(100%) scale(0.9);
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
                font-size: 13px;
                padding: 14px 16px;
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
            workingBookmarkList,
            workingBookmarkInput
        }
    };
}