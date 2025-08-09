// Task Module - Handles task CRUD operations, rendering, and storage functions

// Tasks functionality
function loadTasks() {
    const tasks = getTasksFromStorage();
    renderTasks(tasks);
    
    // Add event listener for adding tasks
    window.UI.elements.taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
}

function addTask() {
    const taskText = window.UI.elements.taskInput.value.trim();
    
    if (!taskText) {
        showMessage('Please enter a task', 'error');
        return;
    }
    
    const task = {
        id: Date.now(),
        text: taskText,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    // Add to localStorage
    const tasks = getTasksFromStorage();
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    // Clear input
    window.UI.elements.taskInput.value = '';
    
    // Re-render tasks
    renderTasks(tasks);
    
    // Show success message
    showMessage('Task added', 'success');
}

function toggleTaskCompleted(id) {
    const tasks = getTasksFromStorage();
    const taskIndex = tasks.findIndex(task => task.id === id);
    
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks(tasks);
    }
}

function deleteTask(id) {
    const tasks = getTasksFromStorage();
    const filteredTasks = tasks.filter(task => task.id !== id);
    localStorage.setItem('tasks', JSON.stringify(filteredTasks));
    renderTasks(filteredTasks);
}

function renderTasks(tasks) {
    const tasksList = window.UI.elements.tasksList;
    tasksList.innerHTML = '';
    
    if (tasks.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'No tasks yet. Add one above!';
        tasksList.appendChild(emptyMessage);
        return;
    }
    
    // Sort tasks: incomplete first, then completed, both sorted by creation date (oldest first)
    tasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1; // Incomplete tasks first
        }
        return new Date(a.createdAt) - new Date(b.createdAt); // Oldest first
    });
    
    tasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = task.completed ? 'task-item task-completed' : 'task-item';
        taskItem.setAttribute('role', 'listitem');
        taskItem.setAttribute('aria-label', `Task: ${task.text}`);
        
        // Apply subtle random color to incomplete tasks
        if (!task.completed) {
            const color = getRandomColor();
            // Make the color more subtle by adding transparency
            const subtleColor = color.replace(')', ', 0.3)').replace('rgb', 'rgba');
            taskItem.style.backgroundColor = subtleColor;
            taskItem.style.borderLeftColor = color;
        }
        
        const taskCheckbox = document.createElement('input');
        taskCheckbox.type = 'checkbox';
        taskCheckbox.className = 'task-checkbox';
        taskCheckbox.checked = task.completed;
        taskCheckbox.addEventListener('change', () => toggleTaskCompleted(task.id));
        
        const taskText = document.createElement('div');
        taskText.className = 'task-text';
        taskText.textContent = task.text;
        taskText.setAttribute('contenteditable', 'true');
        
        // Save task text on blur
        taskText.addEventListener('blur', () => {
            const newText = taskText.textContent.trim();
            if (newText !== task.text) {
                updateTaskText(task.id, newText);
            }
        });
        
        // Save task text on Enter key
        taskText.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                taskText.blur();
            }
        });
        
        const taskDelete = document.createElement('button');
        taskDelete.className = 'task-delete';
        taskDelete.innerHTML = '<i class="fas fa-trash"></i>';
        taskDelete.addEventListener('click', () => deleteTask(task.id));
        
        taskItem.appendChild(taskCheckbox);
        taskItem.appendChild(taskText);
        taskItem.appendChild(taskDelete);
        
        tasksList.appendChild(taskItem);
    });
}

// Function to update task text
function updateTaskText(id, newText) {
    const tasks = getTasksFromStorage();
    const taskIndex = tasks.findIndex(task => task.id === id);
    
    if (taskIndex !== -1) {
        tasks[taskIndex].text = newText;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        showMessage('Task updated', 'success');
    }
}

function getTasksFromStorage() {
    const tasks = localStorage.getItem('tasks');
    return tasks ? JSON.parse(tasks) : [];
}

// Initialize tasks module
function initializeTasks() {
    loadTasks();
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.Tasks = {
        initializeTasks,
        loadTasks,
        addTask,
        toggleTaskCompleted,
        deleteTask,
        renderTasks,
        updateTaskText,
        getTasksFromStorage
    };
}