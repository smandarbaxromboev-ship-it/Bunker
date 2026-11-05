const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const GameManager = require('./gameManager');

const app = express();
app.use(cors());
app.use(express.json());

// Раздача собранного клиентского React приложения
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const gameManager = new GameManager(io);

io.on('connection', (socket) => {
  console.log(`[SOCKET] Подключен клиент: ${socket.id}`);

  // Создание новой комнаты
  socket.on('createRoom', ({ playerName }, callback) => {
    try {
      const res = gameManager.createRoom(playerName || 'Командир', socket.id);
      socket.join(res.code);
      if (typeof callback === 'function') callback(res);
    } catch (e) {
      console.error('Ошибка createRoom:', e);
      if (typeof callback === 'function') callback({ error: 'Ошибка создания комнаты' });
    }
  });

  // Вход в существующую комнату
  socket.on('joinRoom', ({ roomCode, playerName }, callback) => {
    try {
      const cleanCode = (roomCode || '').trim();
      const res = gameManager.joinRoom(cleanCode, playerName || 'Выживший', socket.id);
      if (res.error) {
        if (typeof callback === 'function') callback(res);
        return;
      }
      socket.join(res.code);
      if (typeof callback === 'function') callback(res);
    } catch (e) {
      console.error('Ошибка joinRoom:', e);
      if (typeof callback === 'function') callback({ error: 'Ошибка подключения к комнате' });
    }
  });

  // Восстановление сессии при обновлении страницы
  socket.on('reconnectSession', ({ roomCode, playerId }, callback) => {
    try {
      const res = gameManager.reconnectPlayer(roomCode, playerId, socket.id);
      if (!res.error) {
        socket.join(roomCode);
      }
      if (typeof callback === 'function') callback(res);
    } catch (e) {
      if (typeof callback === 'function') callback({ error: 'Ошибка переподключения' });
    }
  });

  // Добавление бота для тестирования/доукомплектования
  socket.on('addBot', ({ roomCode, requesterId }) => {
    gameManager.addBot(roomCode, requesterId);
  });

  // Удаление бота из лобби
  socket.on('removeBot', ({ roomCode, botId, requesterId }) => {
    gameManager.removeBot(roomCode, botId, requesterId);
  });

  // Старт игры (только хост)
  socket.on('startGame', ({ roomCode, requesterId }, callback) => {
    const res = gameManager.startGame(roomCode, requesterId);
    if (typeof callback === 'function') callback(res);
  });

  // Вскрытие выбранной карты в начале раунда
  socket.on('revealCard', ({ roomCode, playerId, cardId }) => {
    gameManager.revealCard(roomCode, playerId, cardId);
  });

  // Переход от обсуждения к тайному голосованию
  socket.on('startVoting', ({ roomCode, requesterId }) => {
    gameManager.startVotingPhase(roomCode, requesterId);
  });

  // Отдача тайного голоса
  socket.on('castVote', ({ roomCode, voterId, targetPlayerId }) => {
    gameManager.castVote(roomCode, voterId, targetPlayerId);
  });

  // Использование функционального козыря (включая личное переписывание любой карты)
  socket.on('useTrumpAbility', ({ roomCode, playerId, payload }, callback) => {
    try {
      const result = gameManager.useTrumpAbility(roomCode, playerId, payload);
      if (typeof callback === 'function') callback(result);
    } catch (err) {
      console.error('Ошибка useTrumpAbility:', err);
      if (typeof callback === 'function') callback({ error: 'Ошибка применения козыря' });
    }
  });

  // Переход к следующему раунду или финалу
  socket.on('nextRound', ({ roomCode, requesterId }) => {
    gameManager.nextRoundOrEnd(roomCode, requesterId);
  });

  // Сброс в лобби
  socket.on('restartGame', ({ roomCode, requesterId }) => {
    gameManager.restartToLobby(roomCode, requesterId);
  });

  // Отправка текстового сообщения в чат
  socket.on('sendMessage', ({ roomCode, senderId, text }) => {
    gameManager.addChatMessage(roomCode, senderId, text);
  });

  socket.on('disconnect', () => {
    console.log(`[SOCKET] Клиент отключился: ${socket.id}`);
  });
});

// SPA fallback для всех остальных запросов на фронтенд
app.use((req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================================`);
  console.log(` bunker SERVER ONLINE: http://localhost:${PORT}`);
  console.log(` Терминал "Бункер: 7 Раундов Откровений" активен.`);
  console.log(`=================================================`);
});
