const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Загрузка переменных окружения из server/.env (если существует)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envLines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of envLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const k = trimmed.slice(0, eqIdx).trim();
      const v = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

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
  maxHttpBufferSize: 5e6,
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const gameManager = new GameManager(io);

// Отслеживание онлайн-игроков по username (username.toLowerCase() -> Set<socketId>)
const userSockets = new Map();

function bindUserSocket(username, socketId) {
  if (!username || !socketId) return;
  const key = String(username).trim().toLowerCase();
  if (!key) return;
  if (!userSockets.has(key)) {
    userSockets.set(key, new Set());
  }
  userSockets.get(key).add(socketId);
}

function unbindSocket(socketId) {
  for (const [key, set] of userSockets.entries()) {
    set.delete(socketId);
    if (set.size === 0) {
      userSockets.delete(key);
    }
  }
}

function getOnlineUsernamesSet() {
  return new Set(userSockets.keys());
}

// Проверка админских прав через переменные окружения (.env)
const ADMIN_LOGIN_ENV = (process.env.ADMIN_LOGIN || 'Samandar').trim().toLowerCase();
const ADMIN_PASSWORD_ENV = (process.env.ADMIN_PASSWORD || '05052013').trim();

function checkAdminAuth(login, password) {
  return (
    login &&
    password &&
    login.trim().toLowerCase() === ADMIN_LOGIN_ENV &&
    password.trim() === ADMIN_PASSWORD_ENV
  );
}

io.on('connection', (socket) => {
  console.log(`[SOCKET] Подключен клиент: ${socket.id}`);

  // ===================== АВТОРИЗАЦИЯ И ПРОФИЛЬ =====================
  socket.on('register', ({ username, password, avatarUrl }, callback) => {
    try {
      const res = userManager.register(username, password, avatarUrl);
      if (res && res.success && res.user) {
        bindUserSocket(res.user.username, socket.id);
      }
      if (typeof callback === 'function') callback(res);
    } catch (e) {
      console.error('Ошибка register:', e);
      if (typeof callback === 'function') callback({ error: 'Ошибка регистрации' });
    }
  });

  socket.on('updateProfile', ({ username, avatarUrl, rulesAccepted }, callback) => {
    try {
      const res = userManager.updateProfile(username, { avatarUrl, rulesAccepted });
      if (res && res.success) {
        bindUserSocket(res.user.username, socket.id);
        gameManager.updatePlayerProfile(username, res.user);
        io.emit('userProfileUpdated', { username, user: res.user });
      }
      if (typeof callback === 'function') callback(res);
    } catch (e) {
      console.error('Ошибка updateProfile:', e);
      if (typeof callback === 'function') callback({ error: 'Ошибка обновления профиля' });
    }
  });

  socket.on('login', ({ username, password }, callback) => {
    try {
      const res = userManager.login(username, password);
      if (res && res.success && res.user) {
        bindUserSocket(res.user.username, socket.id);
      }
      if (typeof callback === 'function') callback(res);
    } catch (e) {
      console.error('Ошибка login:', e);
      if (typeof callback === 'function') callback({ error: 'Ошибка входа' });
    }
  });

  socket.on('getProfile', ({ username, fallbackUser }, callback) => {
    try {
      const user = userManager.getUser(username, fallbackUser);
      if (user && user.username) {
        bindUserSocket(user.username, socket.id);
      }
      if (typeof callback === 'function') callback({ user });
    } catch (e) {
      if (typeof callback === 'function') callback({ user: null });
    }
  });

  // ===================== ДРУЗЬЯ ПО ID И ПРИГЛАШЕНИЯ В КОМНАТУ =====================
  socket.on('getFriends', ({ username }, callback) => {
    try {
      if (username) bindUserSocket(username, socket.id);
      const user = userManager.getUser(username);
      const friends = userManager.getFriendsList(
        username,
        getOnlineUsernamesSet(),
        gameManager.getActiveRoomsSummary()
      );
      if (typeof callback === 'function') {
        callback({
          success: true,
          userId: user ? user.userId : null,
          friends
        });
      }
    } catch (e) {
      console.error('Ошибка getFriends:', e);
      if (typeof callback === 'function') callback({ error: 'Ошибка загрузки списка друзей' });
    }
  });

  socket.on('addFriend', ({ username, targetQuery }, callback) => {
    try {
      if (username) bindUserSocket(username, socket.id);
      const res = userManager.addFriend(username, targetQuery);
      if (res.error) {
        if (typeof callback === 'function') callback(res);
        return;
      }

      const onlineSet = getOnlineUsernamesSet();
      const activeRooms = gameManager.getActiveRoomsSummary();
      const myFriends = userManager.getFriendsList(username, onlineSet, activeRooms);

      // Уведомляем второго игрока в реальном времени, что его добавили в друзья!
      if (res.friend && res.friend.username) {
        const targetFriends = userManager.getFriendsList(res.friend.username, onlineSet, activeRooms);
        io.emit('friendsUpdated', {
          targetUsername: res.friend.username,
          addedBy: res.user.username,
          friends: targetFriends
        });
      }

      if (typeof callback === 'function') {
        callback({
          success: true,
          user: res.user,
          friend: res.friend,
          friends: myFriends
        });
      }
    } catch (e) {
      console.error('Ошибка addFriend:', e);
      if (typeof callback === 'function') callback({ error: 'Ошибка добавления друга' });
    }
  });

  socket.on('removeFriend', ({ username, friendUsername }, callback) => {
    try {
      const res = userManager.removeFriend(username, friendUsername);
      const friends = userManager.getFriendsList(
        username,
        getOnlineUsernamesSet(),
        gameManager.getActiveRoomsSummary()
      );
      if (typeof callback === 'function') {
        callback({
          success: true,
          user: res.user,
          friends
        });
      }
    } catch (e) {
      if (typeof callback === 'function') callback({ error: 'Ошибка удаления друга' });
    }
  });

  socket.on('inviteFriendToRoom', ({ fromUsername, targetUsername, targetUserId, roomCode }, callback) => {
    try {
      if (!roomCode) {
        if (typeof callback === 'function') callback({ error: 'Сначала создайте комнату или войдите в бункер!' });
        return;
      }
      const cleanRoomCode = String(roomCode).trim();
      const targetRoom = gameManager.rooms.get(cleanRoomCode);
      if (!targetRoom) {
        if (typeof callback === 'function') callback({ error: 'Комната не найдена!' });
        return;
      }
      if (targetRoom.status !== 'LOBBY') {
        if (typeof callback === 'function') {
          callback({ error: '🔒 Игра в этой комнате уже началась! Звать друзей можно только до начала игры (в лобби).' });
        }
        return;
      }
      if (targetRoom.players.length >= 12) {
        if (typeof callback === 'function') callback({ error: 'Комната уже заполнена (12/12)!' });
        return;
      }
      const sender = userManager.getUser(fromUsername);
      const target = userManager.findUserByIdOrName(targetUserId || targetUsername);
      if (!target) {
        if (typeof callback === 'function') callback({ error: 'Игрок не найден!' });
        return;
      }

      const invitePayload = {
        id: 'inv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        fromUsername: sender ? sender.username : fromUsername,
        fromUserId: sender ? sender.userId : null,
        fromAvatar: sender?.characterDetails?.avatar || '🥷',
        fromAvatarUrl: sender?.avatarUrl || null,
        targetUsername: target.username,
        targetUserId: target.userId,
        roomCode: String(roomCode).trim(),
        timestamp: Date.now()
      };

      // Отправляем всем сокетам (клиент отфильтрует по своему username / userId)
      io.emit('roomInvite', invitePayload);

      if (typeof callback === 'function') {
        callback({
          success: true,
          message: `Приглашение в комнату #${roomCode} отправлено игроку ${target.username}!`
        });
      }
    } catch (e) {
      console.error('Ошибка inviteFriendToRoom:', e);
      if (typeof callback === 'function') callback({ error: 'Ошибка отправки приглашения' });
    }
  });

  // ===================== ЕЖЕДНЕВНЫЙ БОНУС, ПРОМОКОДЫ И ЛИЧНЫЕ СООБЩЕНИЯ =====================
  socket.on('claimDailyCrate', ({ username }, callback) => {
    try {
      const res = userManager.claimDailyCrate(username);
      if (typeof callback === 'function') callback(res);
    } catch (e) {
      if (typeof callback === 'function') callback({ error: 'Ошибка открытия ящика снабжения' });
    }
  });

  socket.on('redeemPromoCode', ({ username, code }, callback) => {
    try {
      const res = userManager.redeemPromoCode(username, code);
      if (typeof callback === 'function') callback(res);
    } catch (e) {
      if (typeof callback === 'function') callback({ error: 'Ошибка активации промокода' });
    }
  });

  socket.on('getDirectMessages', ({ username, friendUsername }, callback) => {
    try {
      const messages = userManager.getDirectMessages(username, friendUsername);
      if (typeof callback === 'function') callback({ success: true, messages });
    } catch (e) {
      if (typeof callback === 'function') callback({ error: 'Ошибка загрузки переписки' });
    }
  });

  socket.on('sendDirectMessage', ({ fromUsername, toUsername, text }, callback) => {
    try {
      const res = userManager.sendDirectMessage(fromUsername, toUsername, text);
      if (res.success && res.message) {
        io.emit('directMessageReceived', {
          from: res.message.from,
          to: res.message.to,
          message: res.message
        });
      }
      if (typeof callback === 'function') callback(res);
    } catch (e) {
      if (typeof callback === 'function') callback({ error: 'Ошибка отправки сообщения' });
    }
  });

  socket.on('getPublicRooms', (callback) => {
    try {
      const rooms = gameManager.getPublicLobbyRooms();
      if (typeof callback === 'function') callback({ success: true, rooms });
    } catch (e) {
      if (typeof callback === 'function') callback({ success: true, rooms: [] });
    }
  });

  // ===================== МАГАЗИН И КАСТОМИЗАЦИЯ =====================
  socket.on('getShopCatalog', (callback) => {
    if (typeof callback === 'function') callback({ items: userManager.getShopCatalog() });
  });

  socket.on('buyShopItem', ({ username, itemId }, callback) => {
    try {
      const res = userManager.buyItem(username, itemId);
      if (res && res.success && res.user) {
        gameManager.updatePlayerProfile(username, res.user);
      }
      if (typeof callback === 'function') callback(res);
    } catch (e) {
      if (typeof callback === 'function') callback({ error: 'Ошибка покупки' });
    }
  });

  socket.on('equipShopItem', ({ username, itemId }, callback) => {
    try {
      const res = userManager.equipItem(username, itemId);
      if (res && res.success && res.user) {
        gameManager.updatePlayerProfile(username, res.user);
      }
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
    const amt = parseInt(amount, 10) || 0;
    const newBal = userManager.addCoins(targetUsername, amt);
    const updatedUser = userManager.getUser(targetUsername);

    // Мгновенная синхронизация со всеми подключенными клиентами в реальном времени!
    io.emit('userProfileUpdated', {
      username: targetUsername,
      user: updatedUser,
      coinsAdded: amt
    });

    if (typeof callback === 'function') {
      callback({ success: true, newBalance: newBal, user: updatedUser });
    }
  });

  socket.on('adminGetUsers', ({ login, password }, callback) => {
    if (!checkAdminAuth(login, password)) {
      if (typeof callback === 'function') callback({ error: 'Доступ запрещен' });
      return;
    }
    const users = userManager.getAllUsers();
    if (typeof callback === 'function') callback({ success: true, users });
  });

  socket.on('adminBlockUser', ({ login, password, username, isBlocked }, callback) => {
    if (!checkAdminAuth(login, password)) {
      if (typeof callback === 'function') callback({ error: 'Доступ запрещен' });
      return;
    }
    const res = userManager.blockUser(username, isBlocked);
    if (res.success && isBlocked) {
      io.emit('userBlocked', { username, message: 'Ваш аккаунт был заблокирован администратором!' });
    }
    if (typeof callback === 'function') callback(res);
  });

  socket.on('adminDeleteUser', ({ login, password, username }, callback) => {
    if (!checkAdminAuth(login, password)) {
      if (typeof callback === 'function') callback({ error: 'Доступ запрещен' });
      return;
    }
    const res = userManager.deleteUser(username);
    if (typeof callback === 'function') callback(res);
  });

  socket.on('adminGetRooms', ({ login, password }, callback) => {
    if (!checkAdminAuth(login, password)) {
      if (typeof callback === 'function') callback({ error: 'Доступ запрещен' });
      return;
    }
    const rooms = gameManager.getActiveRoomsSummary();
    if (typeof callback === 'function') callback({ success: true, rooms });
  });

  socket.on('adminCloseRoom', ({ login, password, roomCode }, callback) => {
    if (!checkAdminAuth(login, password)) {
      if (typeof callback === 'function') callback({ error: 'Доступ запрещен' });
      return;
    }
    const closed = gameManager.closeRoom(roomCode);
    if (typeof callback === 'function') callback({ success: closed });
  });

  socket.on('adminGetPromos', ({ login, password }, callback) => {
    if (!checkAdminAuth(login, password)) {
      if (typeof callback === 'function') callback({ error: 'Доступ запрещен' });
      return;
    }
    const promos = userManager.getPromoCodes();
    if (typeof callback === 'function') callback({ success: true, promos });
  });

  socket.on('adminCreatePromo', ({ login, password, code, reward, maxUses }, callback) => {
    if (!checkAdminAuth(login, password)) {
      if (typeof callback === 'function') callback({ error: 'Доступ запрещен' });
      return;
    }
    const res = userManager.createPromoCode(code, reward, maxUses);
    if (typeof callback === 'function') callback(res);
  });

  socket.on('adminDeletePromo', ({ login, password, code }, callback) => {
    if (!checkAdminAuth(login, password)) {
      if (typeof callback === 'function') callback({ error: 'Доступ запрещен' });
      return;
    }
    const res = userManager.deletePromoCode(code);
    if (typeof callback === 'function') callback(res);
  });

  socket.on('getUserProfile', ({ username }, callback) => {
    const u = userManager.getUser(username);
    if (typeof callback === 'function') callback(u);
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
  socket.on('addBot', ({ roomCode, requesterId, lang }) => {
    gameManager.addBot(roomCode, requesterId, lang);
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

  // Выход игрока (или Призрака) из комнаты в главное меню
  socket.on('leaveRoom', ({ roomCode, playerId }, callback) => {
    try {
      if (roomCode) {
        socket.leave(String(roomCode).trim());
      }
      gameManager.leaveRoom(roomCode, playerId, socket.id);
      if (typeof callback === 'function') callback({ success: true });
    } catch (e) {
      console.error('Ошибка leaveRoom:', e);
      if (typeof callback === 'function') callback({ error: 'Ошибка выхода из комнаты' });
    }
  });

  // Отправка текстового сообщения или стикера в чат
  socket.on('sendMessage', ({ roomCode, senderId, text, sticker }) => {
    gameManager.addChatMessage(roomCode, senderId, text, sticker);
  });

  socket.on('disconnect', () => {
    unbindSocket(socket.id);
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
