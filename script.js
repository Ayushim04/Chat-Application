// Global State
let currentUser = "";
let currentRoom = "General";
let activeUsers = []; // Initially empty as per your request
let roomMessages = {
    'General': [],
    'Project Updates': [],
    'Design Feedback': []
};

// Persistence Functions
function loadFromStorage() {
    const storedMessages = localStorage.getItem('roomMessages');
    const storedUsers = localStorage.getItem('activeUsers');
    if (storedMessages) {
        roomMessages = JSON.parse(storedMessages);
    }
    if (storedUsers) {
        activeUsers = JSON.parse(storedUsers);
    }
}

function saveToStorage() {
    localStorage.setItem('roomMessages', JSON.stringify(roomMessages));
    localStorage.setItem('activeUsers', JSON.stringify(activeUsers));
}

// 1. Join Chat Logic
function handleLogin() {
    const input = document.getElementById('username-input');
    const name = input.value.trim();

    if (name === "" || name.length < 3 || name.length > 20 || !/^[a-zA-Z0-9_]+$/.test(name)) {
        return alert("Username must be 3-20 characters, alphanumeric or underscore only!");
    }

    currentUser = name;
    if (!activeUsers.includes(name)) {
        activeUsers.push(name); // Add user to online list
    }

    // Update UI
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('chat-container').classList.remove('hidden');
    document.getElementById('user-badge').innerText = `User: ${name}`;

    updateOnlineList();
    renderMessages();
    saveToStorage();
}

// 2. Dynamic User List (Only shows active users)
function updateOnlineList() {
    const list = document.getElementById('user-list');
    list.innerHTML = ''; // Clear current list
    
    activeUsers.forEach(user => {
        const div = document.createElement('div');
        div.className = 'user-item';
        div.innerText = user === currentUser ? `${user} (You)` : user;
        list.appendChild(div);
    });
}

// 3. Messaging with Formatting
function sendMessage() {
    const input = document.getElementById('msg-input');
    if (input.value.trim() === "") return;

    const sanitizedText = input.value.replace(/</g, '<').replace(/>/g, '>'); // Basic XSS prevention

    const msg = {
        user: currentUser,
        text: sanitizedText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    roomMessages[currentRoom].push(msg);
    renderMessages();
    input.value = "";
    saveToStorage();
}

function renderMessages(searchTerm = '') {
    const display = document.getElementById('message-display');
    display.innerHTML = '';

    const messages = roomMessages[currentRoom].filter(m =>
        searchTerm === '' || m.text.toLowerCase().includes(searchTerm.toLowerCase()) || m.user.toLowerCase().includes(searchTerm.toLowerCase())
    );

    messages.forEach(m => {
        const div = document.createElement('div');
        div.className = `msg ${m.user === currentUser ? 'own' : ''}`;
        div.innerHTML = `
            <strong>${m.user}</strong><br>
            ${formatText(m.text)}
            <span class="msg-meta">${m.time}</span>
        `;
        display.appendChild(div);
    });
    display.scrollTop = display.scrollHeight;
}

function formatText(text) {
    return text
        .replace(/\*(.*?)\*/g, '<b>$1</b>')   // *bold*
        .replace(/_(.*?)_/g, '<i>$1</i>')     // _italic_
        .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:#60a5fa">$1</a>');
}

// 4. Room Management
function switchRoom(roomName) {
    currentRoom = roomName;
    document.getElementById('current-room-name').innerText = `# ${roomName}`;
    document.querySelectorAll('.room-item').forEach(el => {
        el.classList.toggle('active', el.innerText === `# ${roomName}`);
    });
    renderMessages();
}

function createNewRoom() {
    const name = prompt("Enter new room name:");
    if (name && !roomMessages[name]) {
        roomMessages[name] = [];
        const roomDiv = document.createElement('div');
        roomDiv.className = 'room-item';
        roomDiv.innerText = `# ${name}`;
        roomDiv.onclick = () => switchRoom(name);
        document.getElementById('room-list').appendChild(roomDiv);
        switchRoom(name);
        saveToStorage();
    }
}

// Emoji Picker Functions
function toggleEmojiPicker() {
    const picker = document.getElementById('emoji-picker');
    picker.classList.toggle('hidden');
}

function insertEmoji(emoji) {
    const input = document.getElementById('msg-input');
    input.value += emoji;
    input.focus();
    toggleEmojiPicker(); // Hide picker after selection
}

// Search Functionality
function handleSearch() {
    const searchTerm = document.getElementById('search-input').value;
    renderMessages(searchTerm);
}

// Typing Indicator
let typingTimeout;
function showTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    indicator.classList.remove('hidden');
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        indicator.classList.add('hidden');
    }, 2000);
}

// Event Listeners
document.getElementById('send-btn').onclick = sendMessage;
document.getElementById('msg-input').onkeypress = (e) => { if(e.key === 'Enter') sendMessage(); };
document.getElementById('emoji-btn').onclick = toggleEmojiPicker;
document.getElementById('search-input').oninput = handleSearch;
document.getElementById('msg-input').oninput = showTypingIndicator;

// Load data on page load
loadFromStorage();
