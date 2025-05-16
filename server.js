const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// ✅ 쨍한 RGB 원색 계열 15가지
function getRandomColor() {
  const colors = [
    '#FF0000', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF',
    '#00FF00', '#FF2400', '#00FFFF', '#FF00FF', '#FF00AF',
    '#98FB98', '#FF77FF', '#0BDA51', '#7FFFD4', '#FFEF00'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ✅ 한국 시간 기준 HH:MM 반환
function getCurrentTime() {
  const now = new Date();
  now.setUTCHours(now.getUTCHours() + 9); // UTC → KST
  return now.toTimeString().slice(0, 5);
}

const messagesByRoom = {};

io.on('connection', (socket) => {
  const anonId = 'Anon' + Math.floor(Math.random() * 1000);
  const userColor = getRandomColor();

  socket.anonId = anonId;
  socket.userColor = userColor;

  socket.on('join', (roomId) => {
    socket.join(roomId);

    // ✅ 이전 대화 전송
    if (messagesByRoom[roomId]) {
      messagesByRoom[roomId].forEach((msg) => {
        socket.emit('message', msg);
      });
    }

    const joinMsg = {
      text: `[${getCurrentTime()}] ${anonId} has joined the chat.`,
      color: userColor,
    };

    io.to(roomId).emit('message', joinMsg);
    messagesByRoom[roomId] = messagesByRoom[roomId] || [];
    messagesByRoom[roomId].push(joinMsg);
  });

  socket.on('chat', ({ roomId, msg }) => {
    const chatMsg = {
      text: `[${getCurrentTime()}] [${anonId}]: ${msg}`,
      color: userColor,
    };

    io.to(roomId).emit('message', chatMsg);
    messagesByRoom[roomId].push(chatMsg);
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        const leaveMsg = {
          text: `[${getCurrentTime()}] ${anonId} has left the chat.`,
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
