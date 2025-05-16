const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  const anonId = 'Anon' + Math.floor(Math.random() * 1000);
  socket.anonId = anonId;
  socket.on('join', (roomId) => {
    socket.join(roomId);
    io.to(roomId).emit('message', `${anonId} has joined the chat.`);
  });
  socket.on('chat', ({ roomId, msg }) => {
    io.to(roomId).emit('message', `[${anonId}]: ${msg}`);
  });
  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit('message', `${anonId} has left the chat.`);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
