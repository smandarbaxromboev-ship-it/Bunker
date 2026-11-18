const express = require('express');
const http = require('http');
const https = require('https');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

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

// Google OAuth 2.0 Credentials (загружаются из переменных окружения или server/.env)
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || '').trim();

function httpsRequestJson(options, postBody = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error('Invalid JSON from Google: ' + raw));
        }
      });
    });
    req.on('error', reject);
    if (postBody) req.write(postBody);
    req.end();
  });
}

function decodeJwtPayload(jwtToken) {
  try {
    const payloadBase64 = jwtToken.split('.')[1];
    const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(normalized, 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  } catch (e) {
    return {};
  }
}

const app = express();
app.use(cors());
app.use(express.json());

// Раздача собранного клиентского React приложения и APK-пакета
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
const clientPublicPath = path.join(__dirname, '..', 'client', 'public');

app.get('/Bunker7.apk', (req, res) => {
  const apkFile = fs.existsSync(path.join(clientDistPath, 'Bunker7.apk'))
    ? path.join(clientDistPath, 'Bunker7.apk')
    : path.join(clientPublicPath, 'Bunker7.apk');
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="Bunker7.apk"');
  res.sendFile(apkFile);
});

// ===================== НАСТОЯЩИЙ GOOGLE OAUTH 2.0 (ACCOUNTS.GOOGLE.COM) =====================
app.get('/auth/google', (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const redirectUri = `${protocol}://${host}`;

  const googleAuthUrl =
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    querystring.stringify({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
      access_type: 'online',
      prompt: 'select_account'
    });

  res.redirect(googleAuthUrl);
});

// Обработка возврата от Google с ?code=...
app.get(['/', '/auth/google/callback'], async (req, res, next) => {
  const code = req.query.code;
  if (!code) {
    return next();
  }

  const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const redirectUri = `${protocol}://${host}`;

  try {
    const postData = querystring.stringify({
      code: String(code),
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    const tokenData = await httpsRequestJson(
      {
        hostname: 'oauth2.googleapis.com',
        path: '/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      },
      postData
    );

    let profile = {};
    if (tokenData.id_token) {
      profile = decodeJwtPayload(tokenData.id_token);
    }

    if (tokenData.access_token) {
      try {
        const userInfo = await httpsRequestJson({
          hostname: 'www.googleapis.com',
          path: '/oauth2/v3/userinfo',
          method: 'GET',
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`
          }
        });
        profile = { ...profile, ...userInfo };
      } catch (err) {}
    }

    const email = profile.email || 'user@gmail.com';
    const name =
      profile.name ||
      [profile.given_name, profile.family_name].filter(Boolean).join(' ') ||
      email.split('@')[0];
    const picture = profile.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4285F4&color=fff&size=256&bold=true`;

    const userRes = userManager.googleDirectLogin({
      email,
      name,
      avatarUrl: picture,
      googleId: 'google-' + (profile.sub || profile.id || Date.now())
    });

    const user = userRes.user || {
      username: name,
      googleEmail: email,
      avatarUrl: picture,
      bunCoins: 500
    };

    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>Google — Вход выполнен</title>
  <style>
    body { font-family: 'Segoe UI', -apple-system, sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .card { background: #18181b; border: 1px solid #27272a; padding: 32px 40px; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); max-width: 360px; width: 90%; }
    .spinner { width: 40px; height: 40px; border: 3px solid #27272a; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2 style="font-size: 17px; margin: 0 0 8px; color: #60a5fa;">Вход через Google выполнен!</h2>
    <p style="font-size: 13px; margin: 0; color: #a1a1aa;">${user.username} (${user.googleEmail || email})</p>
  </div>
  <script>
    (function() {
      const user = ${JSON.stringify(user)};
      try {
        const bc = new BroadcastChannel('bunker_google_auth');
        bc.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', user: user });
      } catch (e) {}

      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', user: user }, '*');
        } catch (e) {}
      }

      try {
        localStorage.setItem('bunker_last_google_user', JSON.stringify({
          email: user.googleEmail || user.email,
          name: user.username,
          avatarUrl: user.avatarUrl
        }));
      } catch (e) {}

      setTimeout(function() {
        try { window.close(); } catch (e) {}
        window.location.replace('/');
      }, 500);
    })();
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('Ошибка Google OAuth callback:', err);
    res.redirect('/');
  }
});

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

  socket.on('updateProfile', ({ username, newUsername, avatarUrl, rulesAccepted }, callback) => {
    try {
      const res = userManager.updateProfile(username, { newUsername, avatarUrl, rulesAccepted });
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

  // ===================== ВХОД ЧЕРЕЗ GOOGLE =====================
  socket.on('getGoogleConfig', (_payload, callback) => {
    if (typeof callback === 'function') {
      callback({ clientId: GOOGLE_CLIENT_ID || null });
    }
  });

  socket.on('googleLogin', async ({ credential }, callback) => {
    try {
      if (!GOOGLE_CLIENT_ID) {
        if (typeof callback === 'function') callback({ error: 'Вход через Google ещё не настроен на сервере.' });
        return;
      }
      if (!credential || typeof credential !== 'string') {
        if (typeof callback === 'function') callback({ error: 'Google не передал данные входа.' });
        return;
      }

      // Токен проверяется серверами Google (подпись, срок действия)
      const resp = await fetch(
        'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential)
      );
      if (!resp.ok) {
        if (typeof callback === 'function') callback({ error: 'Google отклонил вход. Попробуйте ещё раз.' });
        return;
      }
      const info = await resp.json();

      if (info.aud !== GOOGLE_CLIENT_ID) {
        if (typeof callback === 'function') callback({ error: 'Недействительный токен Google.' });
        return;
      }
      if (String(info.email_verified) !== 'true') {
        if (typeof callback === 'function') callback({ error: 'Email Google-аккаунта не подтверждён.' });
        return;
      }

      const res = userManager.googleLogin({
        sub: info.sub,
        email: info.email,
        name: info.given_name || info.name,
        picture: info.picture
      });
      if (res && res.success && res.user) {
        bindUserSocket(res.user.username, socket.id);
      }
      if (typeof callback === 'function') callback(res);
    } catch (e) {
      console.error('Ошибка googleLogin:', e);
      if (typeof callback === 'function') callback({ error: 'Ошибка входа через Google' });
    }
  });

  socket.on('googleDirectLogin', ({ email, name, avatarUrl, googleId, clientUser }, callback) => {
    try {
      const res = userManager.googleDirectLogin({ email, name, avatarUrl, googleId, clientUser });
      if (res && res.success && res.user) {
        bindUserSocket(res.user.username, socket.id);
      }
      if (typeof callback === 'function') callback(res);
    } catch (e) {
      console.error('Ошибка googleDirectLogin:', e);
      if (typeof callback === 'function') callback({ error: 'Ошибка входа через Google' });
    }
  });

  socket.on('exchangeGoogleCode', async ({ code, redirectUri, clientUser }, callback) => {
    try {
      if (!code) {
        if (typeof callback === 'function') callback({ error: 'Код авторизации не передан' });
        return;
      }

      const cleanUri = String(redirectUri || 'https://bunker-six-lime.vercel.app').trim();
      const uriVariants = [
        cleanUri.replace(/\/+$/, ''),
        cleanUri.replace(/\/+$/, '') + '/'
      ];

      const secretVariants = [
        GOOGLE_CLIENT_SECRET,
        GOOGLE_CLIENT_SECRET.replace(/l/g, 'I'),
        GOOGLE_CLIENT_SECRET.replace(/I/g, 'l'),
        GOOGLE_CLIENT_SECRET.replace(/El/g, 'EI'),
        GOOGLE_CLIENT_SECRET.replace(/Mvl/g, 'MvI')
      ].filter(Boolean);
      const uniqueSecrets = Array.from(new Set(secretVariants));

      let tokenData = null;
      let lastErr = null;

      for (const secret of uniqueSecrets) {
        for (const uri of uriVariants) {
          try {
            const tokenParams = new URLSearchParams({
              code: String(code),
              client_id: GOOGLE_CLIENT_ID,
              client_secret: secret,
              redirect_uri: uri,
              grant_type: 'authorization_code'
            });

            const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: tokenParams.toString()
            });

            const data = await tokenResp.json();
            if (tokenResp.ok && !data.error) {
              tokenData = data;
              break;
            } else {
              lastErr = data;
            }
          } catch (fetchErr) {
            lastErr = fetchErr;
          }
        }
        if (tokenData) break;
      }

      if (!tokenData) {
        console.error('[GOOGLE TOKEN ERROR]:', lastErr);
        if (typeof callback === 'function') {
          callback({
            error: lastErr?.error_description || lastErr?.error || 'Ошибка обмена токена Google'
          });
        }
        return;
      }

      let profile = {};
      if (tokenData.id_token) {
        profile = decodeJwtPayload(tokenData.id_token);
      }
      if (tokenData.access_token) {
        try {
          const userResp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
          });
          if (userResp.ok) {
            const userInfo = await userResp.json();
            profile = { ...profile, ...userInfo };
          }
        } catch (err) {
          console.error('[GOOGLE USERINFO ERROR]:', err);
        }
      }

      const email = (profile.email || '').trim();
      const rawName = (profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(' ') || '').trim();
      const name = rawName || (email ? email.split('@')[0] : 'Samandar');
      const picture = profile.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4285F4&color=fff&size=256&bold=true`;

      const userRes = userManager.googleDirectLogin({
        email,
        name,
        avatarUrl: picture,
        googleId: 'google-' + (profile.sub || profile.id || (email ? email.toLowerCase() : Date.now())),
        clientUser
      });

      if (userRes && userRes.success && userRes.user) {
        bindUserSocket(userRes.user.username, socket.id);
        if (typeof callback === 'function') callback({ success: true, user: userRes.user });
      } else {
        if (typeof callback === 'function') callback(userRes);
      }
    } catch (e) {
      console.error('Ошибка exchangeGoogleCode:', e);
      if (typeof callback === 'function') callback({ error: 'Ошибка обмена токена Google' });
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
    if (username) bindUserSocket(username, socket.id);
    const u = userManager.getUser(username);
    if (typeof callback === 'function') callback(u);
  });

  // ===================== ИГРОВОЙ ПРОЦЕСС =====================
  // Создание новой комнаты
  socket.on('createRoom', ({ playerName, userProfile }, callback) => {
    try {
      if (userProfile?.username) bindUserSocket(userProfile.username, socket.id);
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
      if (userProfile?.username) bindUserSocket(userProfile.username, socket.id);
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

  // Отправка текстового сообщения, стикера, голосового или ответа в чат
  socket.on('sendMessage', ({ roomCode, senderId, text, sticker, voice, replyTo }) => {
    gameManager.addChatMessage(roomCode, senderId, text, sticker, voice, replyTo);
  });

  socket.on('editChatMessage', ({ roomCode, senderId, messageId, newText }) => {
    gameManager.editChatMessage(roomCode, senderId, messageId, newText);
  });

  socket.on('deleteChatMessage', ({ roomCode, senderId, messageId }) => {
    gameManager.deleteChatMessage(roomCode, senderId, messageId);
  });

  socket.on('typing', ({ roomCode, senderId, senderName }) => {
    gameManager.setPlayerTyping(roomCode, senderId, senderName);
  });

  // WebRTC Live Group Voice Chat Signaling
  socket.on('voiceJoin', ({ roomCode, playerId, playerName, isMuted }, callback) => {
    if (!roomCode || !playerId) {
      if (typeof callback === 'function') callback({ error: 'Missing roomCode or playerId' });
      return;
    }
    socket.join(`voice_${roomCode}`);
    if (!global.voiceRooms) global.voiceRooms = new Map();
    if (!global.voiceRooms.has(roomCode)) {
      global.voiceRooms.set(roomCode, new Map());
    }
    const roomMap = global.voiceRooms.get(roomCode);

    const existingPeers = [];
    for (const [peerSocketId, peerData] of roomMap.entries()) {
      if (peerSocketId !== socket.id) {
        existingPeers.push({
          socketId: peerSocketId,
          ...peerData
        });
      }
    }

    const myData = { playerId, playerName: playerName || 'Survivor', isMuted: Boolean(isMuted), isSpeaking: false };
    roomMap.set(socket.id, myData);
    socket.voiceRoomCode = roomCode;
    socket.voicePlayerId = playerId;

    if (typeof callback === 'function') {
      callback({ peers: existingPeers });
    }

    socket.to(`voice_${roomCode}`).emit('voiceUserJoined', {
      socketId: socket.id,
      ...myData
    });
  });

  socket.on('voiceSignal', ({ toSocketId, signal }) => {
    if (toSocketId && signal) {
      io.to(toSocketId).emit('voiceSignal', {
        fromSocketId: socket.id,
        signal
      });
    }
  });

  socket.on('voiceState', ({ roomCode, isMuted, isSpeaking }) => {
    const code = roomCode || socket.voiceRoomCode;
    if (!code || !global.voiceRooms || !global.voiceRooms.has(code)) return;
    const roomMap = global.voiceRooms.get(code);
    const peerData = roomMap.get(socket.id);
    if (peerData) {
      if (isMuted !== undefined) peerData.isMuted = Boolean(isMuted);
      if (isSpeaking !== undefined) peerData.isSpeaking = Boolean(isSpeaking);
      socket.to(`voice_${code}`).emit('voiceStateUpdated', {
        socketId: socket.id,
        playerId: peerData.playerId,
        isMuted: peerData.isMuted,
        isSpeaking: peerData.isSpeaking
      });
    }
  });

  socket.on('voiceLeave', ({ roomCode }) => {
    const code = roomCode || socket.voiceRoomCode;
    if (code && global.voiceRooms && global.voiceRooms.has(code)) {
      const roomMap = global.voiceRooms.get(code);
      roomMap.delete(socket.id);
      if (roomMap.size === 0) {
        global.voiceRooms.delete(code);
      }
      socket.to(`voice_${code}`).emit('voiceUserLeft', {
        socketId: socket.id,
        playerId: socket.voicePlayerId
      });
      socket.leave(`voice_${code}`);
    }
    socket.voiceRoomCode = null;
    socket.voicePlayerId = null;
  });

  socket.on('disconnect', () => {
    unbindSocket(socket.id);
    const code = socket.voiceRoomCode;
    if (code && global.voiceRooms && global.voiceRooms.has(code)) {
      const roomMap = global.voiceRooms.get(code);
      roomMap.delete(socket.id);
      if (roomMap.size === 0) {
        global.voiceRooms.delete(code);
      }
      socket.to(`voice_${code}`).emit('voiceUserLeft', {
        socketId: socket.id,
        playerId: socket.voicePlayerId
      });
    }
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
