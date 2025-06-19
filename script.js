// DOM Elements
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTask');
const taskList = document.getElementById('taskList');
const filterBtns = document.querySelectorAll('.filter-btn');
const categoryBtns = document.querySelectorAll('.category-btn');
const sortSelect = document.getElementById('sortBy');
const taskCategory = document.getElementById('taskCategory');
const taskPriority = document.getElementById('taskPriority');
const taskDueDate = document.getElementById('taskDueDate');
const searchInput = document.getElementById('searchInput');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const themeSwitch = document.getElementById('checkbox');
const clearCompletedBtn = document.getElementById('clearCompleted');
const exportTasksBtn = document.getElementById('exportTasks');
const importTasksBtn = document.getElementById('importTasks');

// Stats Elements
const totalTasksSpan = document.getElementById('totalTasks');
const completedTasksSpan = document.getElementById('completedTasks');
const pendingTasksSpan = document.getElementById('pendingTasks');

// State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let currentCategory = 'all';
let currentSort = 'date';
let searchQuery = '';

// Theme
const currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);
themeSwitch.checked = currentTheme === 'dark';

// Initialize Sortable
new Sortable(taskList, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    onEnd: function(evt) {
        const itemEl = evt.item;
        const newIndex = evt.newIndex;
        const oldIndex = evt.oldIndex;
        
        // Update tasks array
        const taskId = parseInt(itemEl.dataset.id);
        const task = tasks.find(t => t.id === taskId);
        tasks = tasks.filter(t => t.id !== taskId);
        tasks.splice(newIndex, 0, task);
        
        saveTasks();
        renderTasks();
    }
});

// Event Listeners
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderTasks();
});

themeSwitch.addEventListener('change', (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        renderTasks();
    });
});

sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderTasks();
});

clearCompletedBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all completed tasks?')) {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        showNotification('Completed tasks cleared!', 'success');
    }
});

exportTasksBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(tasks);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'tasks.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showNotification('Tasks exported successfully!', 'success');
});

importTasksBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const importedTasks = JSON.parse(event.target.result);
                tasks = importedTasks;
                saveTasks();
                renderTasks();
                showNotification('Tasks imported successfully!', 'success');
            } catch (error) {
                showNotification('Error importing tasks!', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
});

// Functions
function addTask() {
    const taskText = taskInput.value.trim();
    const category = taskCategory.value;
    const priority = taskPriority.value;
    const dueDate = taskDueDate.value;

    if (taskText) {
        const task = {
            id: Date.now(),
            text: taskText,
            completed: false,
            category: category,
            priority: priority,
            dueDate: dueDate,
            createdAt: new Date().toISOString(),
            notes: '',
            tags: [],
            subtasks: []
        };
        tasks.push(task);
        saveTasks();
        renderTasks();
        taskInput.value = '';
        taskDueDate.value = '';
        
        showNotification('Task added successfully!', 'success');
        animateAddTask();
    } else {
        showNotification('Please enter a task!', 'error');
    }
}

function deleteTask(id) {
    const taskElement = document.querySelector(`[data-id="${id}"]`);
    if (taskElement) {
        taskElement.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
            showNotification('Task deleted successfully!', 'success');
        }, 300);
    }
}

function toggleTask(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            const newCompleted = !task.completed;
            if (newCompleted) {
                showNotification('Task completed! 🎉', 'success');
                triggerConfetti();
            }
            return { ...task, completed: newCompleted };
        }
        return task;
    });
    saveTasks();
    renderTasks();
}

function editTask(id) {
    const task = tasks.find(task => task.id === id);
    const newText = prompt('Edit task:', task.text);
    if (newText && newText.trim()) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, text: newText.trim() };
            }
            return task;
        });
        saveTasks();
        renderTasks();
        showNotification('Task updated successfully!', 'success');
    }
}

function addSubtask(taskId) {
    const subtaskText = prompt('Enter subtask:');
    if (subtaskText && subtaskText.trim()) {
        tasks = tasks.map(task => {
            if (task.id === taskId) {
                return {
                    ...task,
                    subtasks: [...task.subtasks, {
                        id: Date.now(),
                        text: subtaskText.trim(),
                        completed: false
                    }]
                };
            }
            return task;
        });
        saveTasks();
        renderTasks();
        showNotification('Subtask added!', 'success');
    }
}

function toggleSubtask(taskId, subtaskId) {
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            return {
                ...task,
                subtasks: task.subtasks.map(subtask => {
                    if (subtask.id === subtaskId) {
                        return { ...subtask, completed: !subtask.completed };
                    }
                    return subtask;
                })
            };
        }
        return task;
    });
    saveTasks();
    renderTasks();
}

function addNote(taskId) {
    const task = tasks.find(task => task.id === taskId);
    const note = prompt('Add a note:', task.notes);
    if (note !== null) {
        tasks = tasks.map(task => {
            if (task.id === taskId) {
                return { ...task, notes: note };
            }
            return task;
        });
        saveTasks();
        renderTasks();
        showNotification('Note added!', 'success');
    }
}

function addTag(taskId) {
    const tag = prompt('Enter a tag:');
    if (tag && tag.trim()) {
        tasks = tasks.map(task => {
            if (task.id === taskId) {
                return {
                    ...task,
                    tags: [...new Set([...task.tags, tag.trim()])]
                };
            }
            return task;
        });
        saveTasks();
        renderTasks();
        showNotification('Tag added!', 'success');
    }
}

function removeTag(taskId, tag) {
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            return {
                ...task,
                tags: task.tags.filter(t => t !== tag)
            };
        }
        return task;
    });
    saveTasks();
    renderTasks();
    showNotification('Tag removed!', 'success');
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateStats();
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(task => isOverdue(task.dueDate)).length;

    totalTasksSpan.textContent = `Total: ${total}`;
    completedTasksSpan.textContent = `Completed: ${completed}`;
    pendingTasksSpan.textContent = `Pending: ${pending}`;

    // Update progress bar with animation
    const progress = total === 0 ? 0 : (completed / total) * 100;
    progressBar.style.transition = 'width 0.5s ease-in-out';
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${Math.round(progress)}% Complete`;

    // Add pulse animation to progress bar when updated
    progressBar.classList.add('pulse');
    setTimeout(() => progressBar.classList.remove('pulse'), 500);
}

function isOverdue(dueDate) {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Add entrance animation
    notification.style.animation = 'slideIn 0.3s ease-out';

    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
}

function triggerConfetti() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
}

function animateAddTask() {
    const newTask = taskList.lastElementChild;
    if (newTask) {
        newTask.style.animation = 'bounce 0.5s ease-out';
        setTimeout(() => {
            newTask.style.animation = '';
        }, 500);
    }
}

function renderTasks() {
    taskList.innerHTML = '';
    
    let filteredTasks = tasks.filter(task => {
        // Search filter
        if (searchQuery && !task.text.toLowerCase().includes(searchQuery)) {
            return false;
        }
        
        // Status filter
        if (currentFilter === 'active') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        if (currentFilter === 'overdue') return isOverdue(task.dueDate);
        return true;
    });

    // Category filter
    if (currentCategory !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.category === currentCategory);
    }

    // Sort tasks
    filteredTasks.sort((a, b) => {
        switch (currentSort) {
            case 'date':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'priority':
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            case 'category':
                return a.category.localeCompare(b.category);
            default:
                return 0;
        }
    });

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;
        
        const isTaskOverdue = isOverdue(task.dueDate);
        
        li.innerHTML = `
            <div class="task-main">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${task.text}</span>
                <div class="task-details">
                    <span class="task-category">${task.category}</span>
                    <span class="task-priority ${task.priority}">${task.priority}</span>
                    ${task.dueDate ? `<span class="task-due-date ${isTaskOverdue ? 'overdue' : ''}">${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
                </div>
                <div class="task-actions">
                    <button class="action-btn add-subtask" title="Add Subtask"><i class="fas fa-list"></i></button>
                    <button class="action-btn add-note" title="Add Note"><i class="fas fa-sticky-note"></i></button>
                    <button class="action-btn add-tag" title="Add Tag"><i class="fas fa-tag"></i></button>
                    <button class="action-btn edit-btn" title="Edit Task"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" title="Delete Task"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            ${task.notes ? `<div class="task-notes"><i class="fas fa-sticky-note"></i> ${task.notes}</div>` : ''}
            ${task.tags.length > 0 ? `
                <div class="task-tags">
                    ${task.tags.map(tag => `
                        <span class="tag">
                            ${tag}
                            <button class="remove-tag" data-tag="${tag}">×</button>
                        </span>
                    `).join('')}
                </div>
            ` : ''}
            ${task.subtasks.length > 0 ? `
                <div class="subtasks">
                    ${task.subtasks.map(subtask => `
                        <div class="subtask">
                            <input type="checkbox" class="subtask-checkbox" ${subtask.completed ? 'checked' : ''}>
                            <span class="subtask-text ${subtask.completed ? 'completed' : ''}">${subtask.text}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;

        const checkbox = li.querySelector('.task-checkbox');
        const editBtn = li.querySelector('.edit-btn');
        const deleteBtn = li.querySelector('.delete-btn');
        const addSubtaskBtn = li.querySelector('.add-subtask');
        const addNoteBtn = li.querySelector('.add-note');
        const addTagBtn = li.querySelector('.add-tag');
        const removeTagBtns = li.querySelectorAll('.remove-tag');
        const subtaskCheckboxes = li.querySelectorAll('.subtask-checkbox');

        checkbox.addEventListener('change', () => toggleTask(task.id));
        editBtn.addEventListener('click', () => editTask(task.id));
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        addSubtaskBtn.addEventListener('click', () => addSubtask(task.id));
        addNoteBtn.addEventListener('click', () => addNote(task.id));
        addTagBtn.addEventListener('click', () => addTag(task.id));
        
        removeTagBtns.forEach(btn => {
            btn.addEventListener('click', () => removeTag(task.id, btn.dataset.tag));
        });

        subtaskCheckboxes.forEach((checkbox, index) => {
            checkbox.addEventListener('change', () => toggleSubtask(task.id, task.subtasks[index].id));
        });

        // Add entrance animation
        li.style.animation = 'slideIn 0.3s ease-out';
        taskList.appendChild(li);
    });

    updateStats();
}

// Initial render
renderTasks(); 