const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

function getRandomColor() {
  const colors = ['#ff6b6b', '#6bc5ff', '#81f495', '#ffe66d', '#d3a4ff', '#ff9f80'];
  return colors[Math.floor(Math.random() * colors.length)];
}

const messagesByRoom = {}; // Store chat history per room

io.on('connection', (socket) => {
  const anonId = 'Anon' + Math.floor(Math.random() * 1000);
  const userColor = getRandomColor();

  socket.anonId = anonId;
  socket.userColor = userColor;

  socket.on('join', (roomId) => {
    socket.join(roomId);

    if (messagesByRoom[roomId]) {
      messagesByRoom[roomId].forEach((msg) => {
        socket.emit('message', msg);
      });
    }

    const joinMsg = {
      text: `${anonId} has joined the chat.`,
      color: userColor,
    };

    io.to(roomId).emit('message', joinMsg);
    messagesByRoom[roomId] = messagesByRoom[roomId] || [];
    messagesByRoom[roomId].push(joinMsg);
  });

  socket.on('chat', ({ roomId, msg }) => {
    const chatMsg = {
      text: `[${anonId}]: ${msg}`,
      color: userColor,
    };

    io.to(roomId).emit('message', chatMsg);
    messagesByRoom[roomId].push(chatMsg);
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        const leaveMsg = {
          text: `${anonId} has left the chat.`,
          color: userColor,
        };

        socket.to(room).emit('message', leaveMsg);
        messagesByRoom[room] = messagesByRoom[room] || [];
        messagesByRoom[room].push(leaveMsg);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
