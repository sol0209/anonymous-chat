const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// ✅ 쟁한 색상 위주로 20가지 고유 색상 정의
function getRandomColor() {
  const colors = [
    '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
    '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
    '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000',
    '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ✅ 방마다 메시지를 저장하는 객체
const messagesByRoom = {};

io.on('connection', (socket) => {
  const anonId = 'Anon' + Math.floor(Math.random() * 1000);
  const userColor = getRandomColor();

  socket.anonId = anonId;
  socket.userColor = userColor;

  socket.on('join', (roomId) => {
    socket.join(roomId);

    // ✅ 이전 메시지 전송
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

    // ✅ 메시지 저장
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

