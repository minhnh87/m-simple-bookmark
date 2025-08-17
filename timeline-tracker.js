// Timeline Tracker JavaScript

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    document.getElementById('activity-date').value = new Date().toISOString().split('T')[0];

    // Load existing activities
    loadActivities();

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            addActivity();
        }
    });
});

// Get activities from localStorage
function getActivities() {
    const activities = localStorage.getItem('company-timeline-activities');
    return activities ? JSON.parse(activities) : [];
}

// Export function for use by other modules
function getTimelineActivities() {
    return getActivities();
}

// Generate random color for timeline items
function getRandomColor() {
    const colors = [
        '#FFE5E5', // Light pink
        '#E5F3FF', // Light blue
        '#E5FFE5', // Light green
        '#FFF5E5', // Light orange
        '#F0E5FF', // Light purple
        '#FFFFE5', // Light yellow
        '#E5FFFF', // Light cyan
        '#FFE5F5', // Light magenta
        '#F5FFE5', // Light lime
        '#E5F5FF'  // Light sky blue
    ];

    return colors[Math.floor(Math.random() * colors.length)];
}

// Save activities to localStorage
function saveActivities(activities) {
    localStorage.setItem('company-timeline-activities', JSON.stringify(activities));
}

// Add new activity
function addActivity() {
    const date = document.getElementById('activity-date').value;
    const activity = document.getElementById('activity-name').value.trim();
    const desc = document.getElementById('activity-desc').value.trim();
    
    // Validation
    if (!date || !activity || !desc) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    // Create activity object
    const newActivity = {
        id: Date.now(),
        date: date,
        activity: activity,
        desc: desc,
        timestamp: new Date().toISOString()
    };
    
    // Get existing activities and add new one
    const activities = getActivities();
    activities.push(newActivity);
    
    // Save to localStorage
    saveActivities(activities);

    // Debug: Check if data was saved
    console.log('Activities saved:', activities);
    console.log('Total activities:', activities.length);

    // Clear form
    document.getElementById('activity-name').value = '';
    document.getElementById('activity-desc').value = '';

    // Reload timeline
    loadActivities();

    showMessage('Activity added successfully!', 'success');
}

// Load and display activities
function loadActivities() {
    const activities = getActivities();
    const timeline = document.getElementById('timeline');
    const emptyState = document.getElementById('empty-state');

    // Debug: Check what we're loading
    console.log('Loading activities:', activities);
    console.log('Activities count:', activities.length);

    // Clear only timeline items, not the empty state
    const timelineItems = timeline.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => item.remove());

    if (activities.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    // Hide empty state when we have activities
    emptyState.style.display = 'none';

    // Sort activities by date (newest first)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Create timeline items directly
    activities.forEach(activity => {
        console.log('Creating timeline item for:', activity);
        const timelineItem = createTimelineItem(activity);
        timeline.appendChild(timelineItem);
    });

    console.log('Timeline items added:', timeline.children.length);
}

// Create timeline item element
function createTimelineItem(activity) {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.setAttribute('data-id', activity.id);

    // Apply random background color
    const backgroundColor = getRandomColor();
    item.style.backgroundColor = backgroundColor;

    const formattedDate = formatDate(activity.date);

    item.innerHTML = `
        <div class="timeline-date">
            📅 ${formattedDate}
        </div>
        <div class="timeline-activity">${escapeHtml(activity.activity)}</div>
        <div class="timeline-desc">${escapeHtml(activity.desc)}</div>
        <div class="timeline-actions">
            <button class="btn btn-secondary btn-small" onclick="editActivity(${activity.id})">
                ✏️ Edit
            </button>
            <button class="btn btn-danger btn-small" onclick="deleteActivity(${activity.id})">
                🗑️ Delete
            </button>
        </div>
    `;

    return item;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Edit activity
function editActivity(id) {
    const activities = getActivities();
    const activity = activities.find(a => a.id === id);
    
    if (!activity) return;
    
    // Fill form with existing data
    document.getElementById('activity-date').value = activity.date;
    document.getElementById('activity-name').value = activity.activity;
    document.getElementById('activity-desc').value = activity.desc;
    
    // Delete the old activity
    deleteActivity(id, false);
    
    // Scroll to form
    document.querySelector('.controls').scrollIntoView({ behavior: 'smooth' });
    
    showMessage('Activity loaded for editing', 'info');
}

// Delete activity
function deleteActivity(id, showConfirm = true) {
    if (showConfirm && !confirm('Are you sure you want to delete this activity?')) {
        return;
    }
    
    const activities = getActivities();
    const filteredActivities = activities.filter(a => a.id !== id);
    
    saveActivities(filteredActivities);
    loadActivities();
    
    if (showConfirm) {
        showMessage('Activity deleted', 'info');
    }
}



// Show message to user
function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            messageDiv.style.backgroundColor = '#27ae60';
            break;
        case 'error':
            messageDiv.style.backgroundColor = '#e74c3c';
            break;
        case 'info':
            messageDiv.style.backgroundColor = '#3498db';
            break;
        default:
            messageDiv.style.backgroundColor = '#34495e';
    }
    
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // Remove message after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
        style.remove();
    }, 3000);
}



// Make functions available globally for bookmark export
if (typeof window !== 'undefined') {
    window.TimelineTracker = {
        getTimelineActivities: getTimelineActivities
    };
}
