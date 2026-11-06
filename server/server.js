const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const GameManager = require('./gameManager');
const { userManager, SHOP_ITEMS } = require('./userManager');
const cardsManager = require('./cardsManager');

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

// Проверка админских прав: login: Samandar, parol: 05052013
function checkAdminAuth(login, password) {
  return (
    login &&
    password &&
    login.trim().toLowerCase() === 'samandar' &&
    password.trim() === '05052013'
  );
}

io.on('connection', (socket) => {
  console.log(`[SOCKET] Подключен клиент: ${socket.id}`);

  // ===================== АВТОРИЗАЦИЯ И ПРОФИЛЬ =====================
  socket.on('register', ({ username, password }, callback) => {
    try {
      const res = userManager.register(username, password);
      if (typeof callback === 'function') callback(res);
    } catch (e) {
      console.error('Ошибка register:', e);
      if (typeof callback === 'function') callback({ error: 'Ошибка регистрации' });
    }
  });

  socket.on('login', ({ username, password }, callback) => {
    try {
      const res = userManager.login(username, password);
      if (typeof callback === 'function') callback(res);
    } catch (e) {
      console.error('Ошибка login:', e);
      if (typeof callback === 'function') callback({ error: 'Ошибка входа' });
    }
  });

  socket.on('getProfile', ({ username }, callback) => {
    try {
      const user = userManager.getUser(username);
      if (typeof callback === 'function') callback({ user });
    } catch (e) {
      if (typeof callback === 'function') callback({ user: null });
    }
  });

  // ===================== МАГАЗИН И КАСТОМИЗАЦИЯ =====================
  socket.on('getShopCatalog', (callback) => {
    if (typeof callback === 'function') callback({ items: userManager.getShopCatalog() });
  });

  socket.on('buyShopItem', ({ username, itemId }, callback) => {
    try {
      const res = userManager.buyItem(username, itemId);
      if (typeof callback === 'function') callback(res);
    } catch (e) {
      if (typeof callback === 'function') callback({ error: 'Ошибка покупки' });
    }
  });

  socket.on('equipShopItem', ({ username, itemId }, callback) => {
    try {
      const res = userManager.equipItem(username, itemId);
      if (typeof callback === 'function') callback(res);
    } catch (e) {
      if (typeof callback === 'function') callback({ error: 'Ошибка экипировки' });
    }
  });

  // ===================== АДМИН ПАНЕЛЬ (Samandar / 05052013) =====================
  socket.on('adminLogin', ({ login, password }, callback) => {
    const isAuth = checkAdminAuth(login, password);
    if (!isAuth) {
      if (typeof callback === 'function') callback({ success: false, error: 'Неверный логин или пароль администратора' });
      return;
    }
    if (typeof callback === 'function') {
      callback({
        success: true,
        stats: cardsManager.getStats(),
        categories: cardsManager.categories
      });
    }
  });

  socket.on('adminGetCards', ({ login, password, category, search }, callback) => {
    if (!checkAdminAuth(login, password)) {
      if (typeof callback === 'function') callback({ error: 'Доступ запрещен' });
      return;
    }
    const cards = cardsManager.getCards(category, search);
    const stats = cardsManager.getStats();
    if (typeof callback === 'function') callback({ success: true, cards, stats });
  });

  socket.on('adminAddCard', ({ login, password, category, cardData }, callback) => {
    if (!checkAdminAuth(login, password)) {
      if (typeof callback === 'function') callback({ error: 'Доступ запрещен' });
      return;
    }
    const res = cardsManager.addCard(category, cardData);
    if (typeof callback === 'function') callback(res);
  });

  socket.on('adminUpdateCard', ({ login, password, category, index, cardData }, callback) => {
    if (!checkAdminAuth(login, password)) {
      if (typeof callback === 'function') callback({ error: 'Доступ запрещен' });
      return;
    }
    const res = cardsManager.updateCard(category, index, cardData);
    if (typeof callback === 'function') callback(res);
  });

  socket.on('adminDeleteCard', ({ login, password, category, index }, callback) => {
    if (!checkAdminAuth(login, password)) {
      if (typeof callback === 'function') callback({ error: 'Доступ запрещен' });
      return;
    }
    const res = cardsManager.deleteCard(category, index);
    if (typeof callback === 'function') callback(res);
  });

  socket.on('adminAddCoins', ({ login, password, targetUsername, amount }, callback) => {
    if (!checkAdminAuth(login, password)) {
      if (typeof callback === 'function') callback({ error: 'Доступ запрещен' });
      return;
    }
    const newBal = userManager.addCoins(targetUsername, parseInt(amount, 10) || 0);
    if (typeof callback === 'function') callback({ success: true, newBalance: newBal });
  });

  // ===================== ИГРОВОЙ ПРОЦЕСС =====================
  // Создание новой комнаты
  socket.on('createRoom', ({ playerName, userProfile }, callback) => {
    try {
      const res = gameManager.createRoom(playerName || 'Командир', socket.id, userProfile);
      socket.join(res.code);
      if (typeof callback === 'function') callback(res);
    } catch (e) {
      console.error('Ошибка createRoom:', e);
      if (typeof callback === 'function') callback({ error: 'Ошибка создания комнаты' });
    }
  });

  // Вход в существующую комнату
  socket.on('joinRoom', ({ roomCode, playerName, userProfile }, callback) => {
    try {
      const cleanCode = (roomCode || '').trim();
      const res = gameManager.joinRoom(cleanCode, playerName || 'Выживший', socket.id, userProfile);
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

  // Использование функционального козыря
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
  console.log(` Админ панель: login: Samandar, parol: 05052013`);
  console.log(`=================================================`);
});
