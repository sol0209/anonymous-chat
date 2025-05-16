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

io.on('connection', (socket) => {
  const anonId = 'Anon' + Math.floor(Math.random() * 1000);
  const userColor = getRandomColor();

  socket.anonId = anonId;
  socket.userColor = userColor;

  socket.on('join', (roomId) => {
    socket.join(roomId);
    io.to(roomId).emit('message', {
      text: `${anonId} has joined the chat.`,
      color: userColor
    });
  });

  socket.on('chat', ({ roomId, msg }) => {
    io.to(roomId).emit('message', {
      text: `[${anonId}]: ${msg}`,
      color: userColor
    });
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit('message', {
          text: `${anonId} has left the chat.`,
          color: userColor
        });
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
