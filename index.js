let currentPage = 1;
const itemsPerPage = 30;
let totalItems = 0;
let todos = [];

// Fetch TODO list with pagination from the API or localStorage
async function fetchTodos(skip = 0) {
    const pageKey = `todos-page-${currentPage}`;

    // Check if the page is already stored in localStorage
    let storedPage = localStorage.getItem(pageKey);
    if (storedPage) {
        todos = JSON.parse(storedPage);
        totalItems = todos.length;
        displayTodos(todos);
    } else {
        // Fetch from API if not in localStorage
        try {
            const response = await fetch(`https://dummyjson.com/todos?skip=${skip}`);
            const data = await response.json();
            todos = data.todos;
            totalItems = data.total;
            savePageToLocalStorage(todos, currentPage);
            displayTodos(todos);
        } catch (error) {
            console.error('Error fetching TODOs:', error);
        }
    }
    updateTotalPages();
}

// Save specific page to localStorage
function savePageToLocalStorage(pageData, pageNumber) {
    const pageKey = `todos-page-${pageNumber}`;
    localStorage.setItem(pageKey, JSON.stringify(pageData));
}

// Remove specific page from localStorage (for updates or deletions)
function removePageFromLocalStorage(pageNumber) {
    const pageKey = `todos-page-${pageNumber}`;
    localStorage.removeItem(pageKey);
}

// Display the current batch of TODOs
function displayTodos(todoList) {
    const todoTable = document.getElementById('todo-table');
    todoTable.innerHTML = '';

    todoList.forEach(todo => {
        const row = `
            <tr>
                <td>${todo.id}</td>
                <td id="todo-${todo.id}">${todo.todo}</td>
                <td>${todo.userId}</td>
                <td>${todo.completed ? 'Completed' : 'Pending'}</td>
                <td>
                    <button class="delete" onclick="deleteTodo(${todo.id})">Delete</button>
                    <button class="done" onclick="markDone(${todo.id})">Done</button>
                </td>
            </tr>
        `;
        todoTable.innerHTML += row;
    });

    updateTodoCount(totalItems);
    document.getElementById('current-page').innerText = currentPage;
}

// Add a new TODO (API and localStorage)
async function addNewTodo() {
    const taskInput = document.getElementById('new-task');
    const task = taskInput.value.trim();
    if (!task) {
        alert('Task cannot be empty');
        return;
    }

    try {
        const response = await fetch('https://dummyjson.com/todos/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                todo: task,
                completed: false,
                userId: 1,
            })
        });

        const newTodo = await response.json();
        const pageKey = `todos-page-${currentPage}`;
        let pageTodos = JSON.parse(localStorage.getItem(pageKey)) || [];

        // Add new todo to the page and update localStorage
        pageTodos.push(newTodo);
        savePageToLocalStorage(pageTodos, currentPage);

        // Update UI with new data
        displayTodos(pageTodos);
        totalItems++;
        updateTotalPages();
        alert('Task added successfully.');
    } catch (error) {
        alert('An error occurred while adding the task');
    }

    taskInput.value = '';
}

// Delete a TODO (API and localStorage)
async function deleteTodo(id) {
    const confirmation = confirm('Are you sure you want to delete this task?');
    if (confirmation) {
        try {
            const response = await fetch(`https://dummyjson.com/todos/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                const pageKey = `todos-page-${currentPage}`;
                let pageTodos = JSON.parse(localStorage.getItem(pageKey)) || [];

                // Remove the deleted todo from the page and localStorage
                pageTodos = pageTodos.filter(todo => todo.id !== id);
                savePageToLocalStorage(pageTodos, currentPage);

                // Update UI with new data
                displayTodos(pageTodos);
                totalItems--;
                updateTotalPages();
                alert('Task deleted successfully.');
            } else {
                alert('An error occurred while deleting the task');
            }
        } catch (error) {
            alert('An error occurred while deleting the task');
        }
    }
}

// Mark a TODO as done (API and localStorage)
async function markDone(id) {
    try {
        const response = await fetch(`https://dummyjson.com/todos/${id}`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                completed: true,
            })
        });
        const updatedTodo = await response.json();
        if (updatedTodo.completed) {
            const pageKey = `todos-page-${currentPage}`;
            let pageTodos = JSON.parse(localStorage.getItem(pageKey)) || [];

            // Update the todo in the page and localStorage
            pageTodos = pageTodos.map(todo => todo.id === id ? updatedTodo : todo);
            savePageToLocalStorage(pageTodos, currentPage);

            // Update UI with new data
            displayTodos(pageTodos);
            alert('Task marked as completed.');
        } else {
            alert('An error occurred while marking the task as completed.');
        }
    } catch (error) {
        alert('An error occurred while marking the task as completed.');
    }
}

// Update TODO count in the footer
function updateTodoCount(count) {
    document.getElementById('task-count').innerText = count;
}

// Pagination logic (updating total pages and controlling buttons)
function updateTotalPages() {
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    document.getElementById('total-pages').innerText = totalPages;
    document.getElementById('current-page').innerText = currentPage;
    togglePaginationButtons(totalPages);
}

// Enable/Disable Next and Previous buttons based on current page
function togglePaginationButtons(totalPages) {
    document.getElementById('prev-btn').disabled = currentPage === 1;
    document.getElementById('next-btn').disabled = currentPage === totalPages || totalPages === 0;
}

// Next Page Button Function
async function nextPage() {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        const skipValue = (currentPage - 1) * itemsPerPage;
        await fetchTodos(skipValue);
    }
}

// Previous Page Button Function
async function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        const skipValue = (currentPage - 1) * itemsPerPage;
        await fetchTodos(skipValue);
    }
}

// Search TODOs locally
function searchTodos() {
    const searchInput = document.getElementById('search-tasks').value.trim();
    searchByDescription(searchInput);
}

// Search by description within the current batch of TODOs
function searchByDescription(searchInput) {
    let filteredTodos;
    if (searchInput) {
        filteredTodos = todos.filter(todo => todo.todo.toLowerCase().includes(searchInput.toLowerCase()));
    } else {
        filteredTodos = todos;
    }

    displayTodos(filteredTodos.slice(0, itemsPerPage));
}

// Initial Data Load
window.onload = function () {
    fetchTodos();
}
