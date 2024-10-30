const socket = io();
let username = '';

// DOM Elements
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const usernameInput = document.getElementById('username');
const joinBtn = document.getElementById('join-btn');
const fileInput = document.getElementById('file-input');
const fileBtn = document.getElementById('file-btn');
const fileContent = document.getElementById('file-content');

// Join Chat Function
joinBtn.addEventListener('click', () => {
    if (usernameInput.value.trim()) {
        username = usernameInput.value.trim();
        socket.emit('client-hello', username);
        addMessage(`Hello from Client ${username}`, 'sent');
        
        // Enable inputs
        messageInput.disabled = false;
        sendBtn.disabled = false;
        fileInput.disabled = false;
        fileBtn.disabled = false;
        
        // Disable join elements
        usernameInput.disabled = true;
        joinBtn.disabled = true;
    }
});

// Send Message Function
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('chat-message', message);
        messageInput.value = '';
    }
}

// File Upload Function
fileBtn.addEventListener('click', () => {
    const file = fileInput.files[0];
    if (file) {
        if (file.size > 10240) { // > 10KB
            const reader = new FileReader();
            reader.onload = (e) => {
                socket.emit('file-upload', {
                    filename: file.name,
                    content: e.target.result
                });
                addMessage(`File sent: ${file.name}`, 'sent');
            };
            reader.readAsText(file);
        } else {
            alert('Please select a file larger than 10KB');
        }
    }
});

// Socket Event Handlers
socket.on('server-message', (message) => {
    addMessage(message, 'system');
});

socket.on('chat-message', (data) => {
    const messageType = data.username === username ? 'sent' : 'received';
    addMessage(`${data.username}: ${data.message}`, messageType);
});

socket.on('user-joined', (username) => {
    addMessage(`${username} joined the chat`, 'system');
});

socket.on('user-left', (username) => {
    addMessage(`${username} left the chat`, 'system');
});

socket.on('file-response', (data) => {
    fileContent.textContent = data.content;
    addMessage(`Received updated file: ${data.filename}`, 'system');
});

// Helper Function to Add Messages
function addMessage(message, type) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', type);
    messageElement.textContent = message;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}