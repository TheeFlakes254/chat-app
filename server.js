const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');

// Serve static files from 'public' directory
app.use(express.static('public'));

// Store connected clients
const clients = new Map();

io.on('connection', (socket) => {
    console.log('A user connected');
    
    // Initial hello message
    socket.emit('server-message', 'Hello from Server Admin');
    
    // Handle client's initial message
    socket.on('client-hello', (username) => {
        clients.set(socket.id, username);
        socket.broadcast.emit('user-joined', username);
    });

    // Handle regular chat messages
    socket.on('chat-message', (message) => {
        const username = clients.get(socket.id);
        if (message === `Bye from Client ${username}`) {
            socket.emit('server-message', `Bye from Server Admin`);
            socket.disconnect();
        } else {
            io.emit('chat-message', { username, message });
        }
    });

    // Handle file upload
    socket.on('file-upload', (data) => {
        const { filename, content } = data;
        
        // Save the file
        const filePath = path.join(__dirname, 'uploads', filename);
        fs.writeFileSync(filePath, content);
        
        // Append additional line
        fs.appendFileSync(filePath, '\nThis is an added line from a server');
        
        // Read the updated file
        const updatedContent = fs.readFileSync(filePath, 'utf8');
        
        // Send back to client
        socket.emit('file-response', {
            filename,
            content: updatedContent
        });
        
        // Display file content on server console
        console.log('Received file content:');
        console.log(content);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const username = clients.get(socket.id);
        if (username) {
            io.emit('user-left', username);
            clients.delete(socket.id);
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)){
        fs.mkdirSync(uploadsDir);
    }
});