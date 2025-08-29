// API Helper - Handles interaction with ngrok API for sync functionality

const API_BASE_URL = 'https://frog-faithful-puma.ngrok-free.app';
const API_ENDPOINT_SET = `${API_BASE_URL}/redisorj32hro32h/set`;
const API_ENDPOINT_GET = `${API_BASE_URL}/redisorj32hro32h/get`;

// Headers required for ngrok
const API_HEADERS = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '1'
};

/**
 * Save data to remote API
 * @param {Object} data - Data to save (same format as export)
 * @returns {Promise<boolean>} - Success status
 */
async function saveToApi(data) {
    try {
        
        
        const response = await fetch(API_ENDPOINT_SET, {
            method: 'POST',
            headers: API_HEADERS,
            body: JSON.stringify({
                key: 'bookmark',
                value: JSON.stringify(data)
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Save to API successful:', result);
        showMessage('Syncing to cloud...', 'info');
        return true;
        
    } catch (error) {
        console.error('Save to API error:', error);
        showMessage('Sync failed: ' + error.message, 'error');
        return false;
    }
}

/**
 * Load data from remote API
 * @returns {Promise<Object|null>} - Loaded data or null if failed
 */
async function loadFromApi() {
    try {
        const response = await fetch(API_ENDPOINT_GET + '?key=bookmark', {
            method: 'GET',
            headers: API_HEADERS
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Load from API successful:', result);
        
        // Return the data if it exists
        if (result && result.data && result.data !== '') {
            return JSON.parse(result.data);
        }
        
        return null;
        
    } catch (error) {
        console.error('Load from API error:', error);
        return null;
    }
}

/**
 * Sync current data to cloud (export format)
 * @returns {Promise<boolean>} - Success status
 */
async function syncToCloud() {
    try {
        // Use the same export data creation logic as exportBookmarks()
        if (!window.Bookmarks || !window.Bookmarks.createExportData) {
            showMessage('Export functionality not available', 'error');
            return false;
        }
        
        const exportData = window.Bookmarks.createExportData();
        
        // Check if there's any data to sync (using metadata from createExportData)
        const hasData = exportData.metadata.bookmarkCount > 0 || 
                       exportData.metadata.hasNote ||
                       exportData.metadata.taskCount > 0 ||
                       exportData.metadata.stickyNoteCount > 0 ||
                       exportData.metadata.workingLinkCount > 0 ||
                       exportData.metadata.timelineActivityCount > 0;
        
        if (!hasData) {
            showMessage('No data to sync', 'warning');
            return false;
        }
        
        const success = await saveToApi(exportData);
        
        return success;
        
    } catch (error) {
        console.error('Sync to cloud error:', error);
        showMessage('Sync failed: ' + error.message, 'error');
        return false;
    }
}

/**
 * Initialize app with data from cloud API
 * @returns {Promise<boolean>} - Success status
 */
async function initializeFromCloud() {
    try {
        const cloudData = await loadFromApi();
        
        if (!cloudData) {
            console.log('No cloud data found, using local data');
            showMessage('No cloud backup found, using local data', 'info');
            return false;
        }
        
        console.log('Cloud data retrieved:', cloudData);
        
        // Import the data using the same logic as import function
        
        // Import bookmarks
        if (Array.isArray(cloudData.bookmarks) && cloudData.bookmarks.length > 0) {
            const validBookmarks = cloudData.bookmarks.filter(bookmark => 
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
                name: bookmark.name || bookmark.title,
                url: bookmark.url,
                color: bookmark.color || getRandomColor(),
                category: bookmark.category || '',
                isDefault: bookmark.isDefault || false
            }));
            
            if (validBookmarks.length > 0) {
                const success = safeLocalStorageOperation('set', 'bookmarks', JSON.stringify(validBookmarks));
            }
        }
        
        // Import note
        if (cloudData.note && typeof cloudData.note === 'object' && cloudData.note.content) {
            const success = safeLocalStorageOperation('set', 'note', JSON.stringify(cloudData.note));
        }
        
        // Import tasks
        if (Array.isArray(cloudData.tasks) && cloudData.tasks.length > 0) {
            const validTasks = cloudData.tasks.filter(task => 
                task && 
                typeof task === 'object' && 
                task.text &&
                typeof task.text === 'string' &&
                task.text.trim() !== ''
            );
            
            if (validTasks.length > 0) {
                const success = safeLocalStorageOperation('set', 'tasks', JSON.stringify(validTasks));
            }
        }
        
        // Import sticky notes
        if (Array.isArray(cloudData.stickyNotes) && cloudData.stickyNotes.length > 0) {
            const validStickyNotes = cloudData.stickyNotes.filter(note => 
                note && 
                typeof note === 'object' && 
                note.content &&
                typeof note.content === 'string' &&
                note.content.trim() !== ''
            );
            
            if (validStickyNotes.length > 0) {
                const success = safeLocalStorageOperation('set', 'stickyNotes', JSON.stringify(validStickyNotes));
            }
        }
        
        // Import working links
        if (Array.isArray(cloudData.workingLinks) && cloudData.workingLinks.length > 0) {
            const validWorkingLinks = cloudData.workingLinks.filter(link => {
                if (!link || typeof link !== 'object') return false;
                if (!link.url || typeof link.url !== 'string' || link.url.trim() === '') return false;
                
                // Validate URL format
                try {
                    const url = link.url.trim();
                    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
                        return false;
                    }
                    new URL(url);
                    return true;
                } catch {
                    return false;
                }
            }).map(link => ({
                id: link.id || Date.now() + Math.random(),
                url: link.url.trim(),
                title: link.title || new URL(link.url.trim()).hostname.replace('www.', '').charAt(0).toUpperCase() + new URL(link.url.trim()).hostname.replace('www.', '').slice(1),
                timestamp: link.timestamp || new Date().toISOString()
            }));
            
            if (validWorkingLinks.length > 0) {
                const success = safeLocalStorageOperation('set', 'workingLinks', JSON.stringify(validWorkingLinks));
            }
        }

        // Import timeline activities
        if (Array.isArray(cloudData.timelineActivities) && cloudData.timelineActivities.length > 0) {
            const validTimelineActivities = cloudData.timelineActivities.filter(activity =>
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

            if (validTimelineActivities.length > 0) {
                const success = safeLocalStorageOperation('set', 'company-timeline-activities', JSON.stringify(validTimelineActivities));
            }
        }
        
        showMessage('Cloud data loaded successfully!', 'success');
        return true;
        
    } catch (error) {
        console.error('Initialize from cloud error:', error);
        showMessage('Failed to load cloud data: ' + error.message, 'error');
        return false;
    }
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.ApiHelper = {
        saveToApi,
        loadFromApi,
        syncToCloud,
        initializeFromCloud
    };
}