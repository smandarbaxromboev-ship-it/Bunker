// User Management & Economy System for "Бункер: 7 Раундов Откровений"
// BunCoins currency, Player Profiles, Shop Items & Customization
const fs = require('fs');
const path = require('path');
const SHOP_ITEMS = require('./shopCatalog');

const USERS_FILE = path.join(__dirname, 'usersDatabase.json');
const PROMOS_FILE = path.join(__dirname, 'promosDatabase.json');
const DM_FILE = path.join(__dirname, 'directMessagesDatabase.json');

class UserManager {
  constructor() {
    this.users = new Map();
    this.promos = new Map();
    this.directMessages = new Map();
    this.loadUsers();
    this.loadPromos();
    this.loadDirectMessages();
  }

  loadPromos() {
    try {
      if (fs.existsSync(PROMOS_FILE)) {
        const raw = fs.readFileSync(PROMOS_FILE, 'utf8');
        const data = JSON.parse(raw);
        for (const [k, v] of Object.entries(data)) {
          this.promos.set(k.toUpperCase(), v);
        }
      }
      if (!this.promos.has('SAMANDAR2026')) {
        this.promos.set('SAMANDAR2026', {
          code: 'SAMANDAR2026',
          reward: 5000,
          maxUses: 500,
          usedBy: [],
          createdAt: new Date().toISOString()
        });
        this.savePromos();
      }
    } catch (e) {
      console.error('Ошибка загрузки промокодов:', e);
    }
  }

  savePromos() {
    try {
      const obj = {};
      for (const [k, v] of this.promos.entries()) {
        obj[k] = v;
      }
      fs.writeFileSync(PROMOS_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch (e) {
      console.error('Ошибка сохранения промокодов:', e);
    }
  }

  loadDirectMessages() {
    try {
      if (fs.existsSync(DM_FILE)) {
        const raw = fs.readFileSync(DM_FILE, 'utf8');
        const data = JSON.parse(raw);
        for (const [k, v] of Object.entries(data)) {
          if (Array.isArray(v)) this.directMessages.set(k, v);
        }
      }
    } catch (e) {
      console.error('Ошибка загрузки личных сообщений:', e);
    }
  }

  saveDirectMessages() {
    try {
      const obj = {};
      for (const [k, v] of this.directMessages.entries()) {
        obj[k] = v;
      }
      fs.writeFileSync(DM_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch (e) {
      console.error('Ошибка сохранения личных сообщений:', e);
    }
  }

  loadUsers() {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const raw = fs.readFileSync(USERS_FILE, 'utf8');
        const data = JSON.parse(raw);
        let needsSave = false;
        for (const [username, user] of Object.entries(data)) {
          if (!user.userId) {
            user.userId = this.generateUniqueUserId();
            needsSave = true;
          }
          if (!Array.isArray(user.friends)) {
            user.friends = [];
            needsSave = true;
          }
          this.users.set(username.toLowerCase(), user);
        }
        if (needsSave) {
          this.saveUsers();
        }
      }
    } catch (e) {
      console.error('Ошибка загрузки пользователей:', e);
    }
  }

  generateUniqueUserId() {
    const existingIds = new Set();
    for (const u of this.users.values()) {
      if (u.userId) existingIds.add(String(u.userId));
    }
    let id;
    do {
      id = String(Math.floor(100000 + Math.random() * 900000));
    } while (existingIds.has(id));
    return id;
  }

  saveUsers() {
    try {
      const obj = {};
      for (const [key, user] of this.users.entries()) {
        obj[key] = user;
      }
      fs.writeFileSync(USERS_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch (e) {
      console.error('Ошибка сохранения пользователей:', e);
    }
  }

  register(username, password, avatarUrl = '') {
    const uname = (username || '').trim();
    const pwd = (password || '').trim();
    const photo = (avatarUrl || '').trim();

    if (!uname || uname.length < 2) {
      return { error: 'Имя пользователя должно содержать минимум 2 символа.' };
    }
    if (!pwd || pwd.length < 3) {
      return { error: 'Пароль должен содержать минимум 3 символа.' };
    }

    const key = uname.toLowerCase();
    if (this.users.has(key)) {
      return { error: 'Пользователь с таким именем уже существует!' };
    }

    const newUser = {
      userId: this.generateUniqueUserId(),
      username: uname,
      password: pwd,
      avatarUrl: photo || null,
      bunCoins: 500, // Starting gift!
      friends: [],
      inventory: ['char_stalker', 'frame_default', 'title_survivor'],
      equipped: {
        character: 'char_stalker',
        frame: 'frame_default',
        title: 'title_survivor'
      },
      stats: {
        gamesPlayed: 0,
        wins: 0,
        roundsSurvived: 0
      },
      rulesAccepted: false,
      createdAt: new Date().toISOString()
    };

    this.users.set(key, newUser);
    this.saveUsers();

    return { success: true, user: this.sanitizeUser(newUser), isNewRegistration: true };
  }

  ensureUser(username, fallback = {}) {
    if (!username) return null;
    const uname = username.trim();
    if (!uname) return null;
    const key = uname.toLowerCase();
    let user = this.users.get(key);
    if (!user) {
      user = {
        userId: fallback.userId || this.generateUniqueUserId(),
        username: uname,
        password: fallback.password || 'user123',
        avatarUrl: fallback.avatarUrl || null,
        bunCoins: typeof fallback.bunCoins === 'number' ? fallback.bunCoins : 500,
        friends: Array.isArray(fallback.friends) ? fallback.friends : [],
        inventory: Array.isArray(fallback.inventory) && fallback.inventory.length > 0
          ? fallback.inventory
          : ['char_stalker', 'frame_default', 'title_survivor'],
        equipped: fallback.equipped || {
          character: 'char_stalker',
          frame: 'frame_default',
          title: 'title_survivor'
        },
        stats: fallback.stats || {
          gamesPlayed: 0,
          wins: 0,
          roundsSurvived: 0
        },
        rulesAccepted: Boolean(fallback.rulesAccepted),
        createdAt: fallback.createdAt || new Date().toISOString()
      };
      this.users.set(key, user);
      this.saveUsers();
    } else {
      let changed = false;
      if (!user.userId) {
        user.userId = this.generateUniqueUserId();
        changed = true;
      }
      if (!Array.isArray(user.friends)) {
        user.friends = [];
        changed = true;
      }
      if (changed) this.saveUsers();
    }
    return user;
  }

  updateProfile(username, updates = {}) {
    if (!username) return { error: 'Имя пользователя не указано' };
    const user = this.ensureUser(username, updates);
    if (!user) return { error: 'Имя пользователя не указано' };

    if (updates.newUsername) {
      const cleanNew = String(updates.newUsername)
        .replace(/[^\p{L}\p{N}_ \-]/gu, '')
        .trim()
        .replace(/\s+/g, '_')
        .substring(0, 16);
      if (cleanNew.length >= 2 && cleanNew.toLowerCase() !== user.username.toLowerCase()) {
        if (this.users.has(cleanNew.toLowerCase())) {
          return { error: 'Пользователь с таким ником уже существует!' };
        }
        this.users.delete(user.username.toLowerCase());
        user.username = cleanNew;
        this.users.set(cleanNew.toLowerCase(), user);
      }
    }

    if (updates.newPassword) {
      const cleanPass = String(updates.newPassword).trim();
      if (cleanPass.length >= 3) {
        user.password = cleanPass;
      }
    }

    if (updates.avatarUrl !== undefined) {
      user.avatarUrl = updates.avatarUrl ? updates.avatarUrl.trim() : null;
    }
    if (updates.rulesAccepted !== undefined) {
      user.rulesAccepted = Boolean(updates.rulesAccepted);
    }
    this.saveUsers();
    return { success: true, user: this.sanitizeUser(user) };
  }

  login(username, password) {
    const uname = (username || '').trim().toLowerCase();
    const pwd = (password || '').trim();

    const user = this.users.get(uname);
    if (!user || user.password !== pwd) {
      return { error: 'Неверное имя пользователя или пароль.' };
    }

    if (user.isBlocked) {
      return { error: 'Ваш аккаунт заблокирован администратором!' };
    }

    return { success: true, user: this.sanitizeUser(user) };
  }

  // Вход / автоматическая регистрация через Google (профиль уже проверен сервером Google)
  googleLogin({ sub, email, name, picture }) {
    if (!sub) return { error: 'Google не вернул идентификатор аккаунта.' };

    let existing = null;
    for (const u of this.users.values()) {
      if (u.googleId === String(sub)) {
        existing = u;
        break;
      }
    }

    if (existing) {
      if (existing.isBlocked) {
        return { error: 'Ваш аккаунт заблокирован администратором!' };
      }
      if (!existing.avatarUrl && picture) {
        existing.avatarUrl = picture;
        this.saveUsers();
      }
      return { success: true, user: this.sanitizeUser(existing), isNewRegistration: false };
    }

    // Подбираем свободное уникальное имя игрока из имени Google / email
    let base = String(name || (email ? email.split('@')[0] : '') || 'Player')
      .replace(/[^\p{L}\p{N}_ \-]/gu, '')
      .trim()
      .replace(/\s+/g, '_')
      .substring(0, 16);
    if (base.length < 2) base = 'Player';

    let candidate = base;
    let n = 1;
    while (this.users.has(candidate.toLowerCase())) {
      n += 1;
      candidate = `${base.substring(0, 16)}_${n}`.substring(0, 20);
      if (n > 9999) {
        candidate = `${base.substring(0, 12)}_${Math.floor(Math.random() * 1e6)}`;
        break;
      }
    }

    const newUser = {
      userId: this.generateUniqueUserId(),
      username: candidate,
      // Случайный пароль: вход в этот аккаунт возможен только через Google
      password: 'g_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
      googleId: String(sub),
      googleEmail: email || null,
      avatarUrl: picture || null,
      bunCoins: 500,
      friends: [],
      inventory: ['char_stalker', 'frame_default', 'title_survivor'],
      equipped: {
        character: 'char_stalker',
        frame: 'frame_default',
        title: 'title_survivor'
      },
      stats: { gamesPlayed: 0, wins: 0, roundsSurvived: 0 },
      rulesAccepted: false,
      createdAt: new Date().toISOString()
    };

    this.users.set(candidate.toLowerCase(), newUser);
    this.saveUsers();
    return { success: true, user: this.sanitizeUser(newUser), isNewRegistration: true };
  }

  // Прямой 1-клик вход и регистрация через Google (не требует ручной настройки Google Cloud Console)
  googleDirectLogin({ email, name, avatarUrl, googleId, clientUser = null }) {
    const rawEmail = (email || '').trim().toLowerCase();
    const rawName = (name || '').trim();
    if (!rawEmail && !rawName && !googleId) {
      return { error: 'Пожалуйста, укажите ваш Google аккаунт (Email или имя).' };
    }

    // Идентификатор Google: либо переданный googleId, либо хеш от email
    const gid = googleId ? String(googleId) : (rawEmail ? `g_${rawEmail}` : `g_${rawName.toLowerCase()}`);

    // Ищем существующего пользователя по googleId, email, userId или имени
    let existing = null;
    for (const u of this.users.values()) {
      if (u.googleId && (u.googleId === gid || (rawEmail && u.googleId === `g_${rawEmail}`))) {
        existing = u;
        break;
      }
      if (rawEmail && u.googleEmail && u.googleEmail.toLowerCase() === rawEmail) {
        existing = u;
        break;
      }
      if (clientUser && clientUser.userId && String(u.userId) === String(clientUser.userId)) {
        existing = u;
        break;
      }
      if (clientUser && clientUser.username && u.username.toLowerCase() === clientUser.username.toLowerCase()) {
        existing = u;
        break;
      }
      if (rawEmail && u.username && u.username.toLowerCase() === rawEmail.split('@')[0].toLowerCase()) {
        existing = u;
        break;
      }
      if (rawName && u.username && u.username.toLowerCase() === rawName.toLowerCase()) {
        existing = u;
        break;
      }
    }

    if (existing) {
      if (existing.isBlocked) {
        return { error: 'Ваш аккаунт заблокирован администратором!' };
      }
      if (!existing.googleId) existing.googleId = gid;
      if (!existing.googleEmail && rawEmail) existing.googleEmail = rawEmail;
      if (avatarUrl) existing.avatarUrl = avatarUrl;

      // Если в сохраненном профиле было больше монет (например 1000), сохраняем баланс!
      const clientCoins = clientUser && typeof clientUser.bunCoins === 'number' ? clientUser.bunCoins : 0;
      if (clientCoins > (existing.bunCoins || 0)) {
        existing.bunCoins = clientCoins;
      } else if ((existing.bunCoins || 0) < 1000) {
        existing.bunCoins = 1000; // Гарантированный стартовый баланс 1000 BunCoins для Google аккаунтов!
      }

      // Объединяем купленные предметы
      if (clientUser && Array.isArray(clientUser.inventory)) {
        clientUser.inventory.forEach(item => {
          if (!existing.inventory) existing.inventory = [];
          if (!existing.inventory.includes(item)) existing.inventory.push(item);
        });
      }

      // Если текущий ник технический ("user" или "user_1"), обновляем его на настоящее имя из Google!
      const targetName = rawName || (rawEmail ? rawEmail.split('@')[0] : '');
      if (targetName && (existing.username.toLowerCase() === 'user' || existing.username.toLowerCase().startsWith('user_'))) {
        const cleanedName = targetName.replace(/[^\p{L}\p{N}_ \-]/gu, '').trim().replace(/\s+/g, '_').substring(0, 16);
        if (cleanedName && cleanedName.toLowerCase() !== existing.username.toLowerCase()) {
          this.users.delete(existing.username.toLowerCase());
          existing.username = cleanedName;
          this.users.set(cleanedName.toLowerCase(), existing);
        }
      }

      this.saveUsers();
      return { success: true, user: this.sanitizeUser(existing), isNewRegistration: false };
    }

    // Создаем имя пользователя из имени Google или email
    let base = rawName || (rawEmail ? rawEmail.split('@')[0] : 'GooglePlayer');
    base = String(base)
      .replace(/[^\p{L}\p{N}_ \-]/gu, '')
      .trim()
      .replace(/\s+/g, '_')
      .substring(0, 16);
    if (base.length < 2) base = 'GooglePlayer';

    let candidate = base;
    let n = 1;
    while (this.users.has(candidate.toLowerCase())) {
      n += 1;
      candidate = `${base.substring(0, 14)}_${n}`.substring(0, 20);
      if (n > 9999) {
        candidate = `${base.substring(0, 10)}_${Math.floor(Math.random() * 1e6)}`;
        break;
      }
    }

    // Генерируем красивый фирменный аватар Google
    const finalAvatar = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate)}&background=4285F4&color=fff&size=256&bold=true`;

    const clientCoins = clientUser && typeof clientUser.bunCoins === 'number' ? clientUser.bunCoins : 1000;
    const initialCoins = Math.max(1000, clientCoins);

    const newUser = {
      userId: clientUser?.userId || this.generateUniqueUserId(),
      username: candidate,
      password: 'g_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
      googleId: gid,
      googleEmail: rawEmail || null,
      avatarUrl: finalAvatar,
      bunCoins: initialCoins, // Приветственные 1000 BunCoins для аккаунта Google!
      friends: clientUser?.friends || [],
      inventory: clientUser?.inventory || ['char_stalker', 'frame_default', 'title_survivor'],
      equipped: clientUser?.equipped || {
        character: 'char_stalker',
        frame: 'frame_default',
        title: 'title_survivor'
      },
      stats: clientUser?.stats || { gamesPlayed: 0, wins: 0, roundsSurvived: 0 },
      rulesAccepted: false,
      createdAt: new Date().toISOString()
    };

    this.users.set(candidate.toLowerCase(), newUser);
    this.saveUsers();
    return { success: true, user: this.sanitizeUser(newUser), isNewRegistration: true };
  }

  getUser(username, fallback = null) {
    if (!username) return null;
    let user = this.users.get(username.trim().toLowerCase());
    if (!user && fallback) {
      user = this.ensureUser(username, fallback);
    }
    return user ? this.sanitizeUser(user) : null;
  }

  getAllUsers() {
    const list = [];
    for (const [key, user] of this.users.entries()) {
      if (!user.userId) {
        user.userId = this.generateUniqueUserId();
      }
      list.push({
        userId: user.userId,
        username: user.username,
        password: user.password || '—',
        avatarUrl: user.avatarUrl || null,
        rulesAccepted: Boolean(user.rulesAccepted),
        bunCoins: user.bunCoins || 0,
        isBlocked: Boolean(user.isBlocked),
        friendsCount: (user.friends || []).length,
        inventoryCount: (user.inventory || []).length,
        equipped: user.equipped,
        stats: user.stats || { gamesPlayed: 0, wins: 0 },
        createdAt: user.createdAt
      });
    }
    return list.sort((a, b) => (b.bunCoins || 0) - (a.bunCoins || 0));
  }

  blockUser(username, isBlocked = true) {
    if (!username) return { error: 'Имя пользователя не указано' };
    const key = username.trim().toLowerCase();
    const user = this.users.get(key);
    if (!user) return { error: 'Пользователь не найден' };
    user.isBlocked = Boolean(isBlocked);
    this.saveUsers();
    return { success: true, user: this.sanitizeUser(user), isBlocked: user.isBlocked };
  }

  deleteUser(username) {
    if (!username) return { error: 'Имя пользователя не указано' };
    const key = username.trim().toLowerCase();
    if (!this.users.has(key)) return { error: 'Пользователь не найден' };
    this.users.delete(key);
    this.saveUsers();
    return { success: true };
  }

  setCoins(username, amount) {
    if (!username) return 0;
    const key = username.trim().toLowerCase();
    const user = this.users.get(key);
    if (user) {
      user.bunCoins = Math.max(0, parseInt(amount, 10) || 0);
      this.saveUsers();
      return user.bunCoins;
    }
    return 0;
  }

  sanitizeUser(user) {
    if (!user.userId) {
      user.userId = this.generateUniqueUserId();
      this.saveUsers();
    }
    const characterItem = SHOP_ITEMS.find(i => i.id === user.equipped?.character) || SHOP_ITEMS[0];
    const frameItem = SHOP_ITEMS.find(i => i.id === user.equipped?.frame) || SHOP_ITEMS.find(i => i.type === 'frame');
    const titleItem = SHOP_ITEMS.find(i => i.id === user.equipped?.title) || SHOP_ITEMS.find(i => i.type === 'title');

    return {
      userId: user.userId,
      username: user.username,
      avatarUrl: user.avatarUrl || null,
      googleEmail: user.googleEmail || null,
      googleId: user.googleId || null,
      rulesAccepted: Boolean(user.rulesAccepted),
      bunCoins: user.bunCoins,
      friends: user.friends || [],
      inventory: user.inventory || [],
      equipped: user.equipped,
      characterDetails: {
        avatar: characterItem ? characterItem.avatar : '🥷',
        avatarUrl: user.avatarUrl || null,
        name: characterItem ? characterItem.name : { ru: 'Сталкер', en: 'Stalker', uz: 'Izquvar' },
        borderClass: frameItem ? (frameItem.borderClass || '') : '',
        glowClass: frameItem ? (frameItem.glowClass || '') : '',
        title: titleItem ? titleItem.name : { ru: 'Выживший', en: 'Survivor', uz: 'Omon Qolgan' },
        titleColor: titleItem ? (titleItem.color || '') : ''
      },
      stats: user.stats || { gamesPlayed: 0, wins: 0 },
      lastDailyClaim: user.lastDailyClaim || 0,
      isBlocked: Boolean(user.isBlocked)
    };
  }

  // ===================== ЕЖЕДНЕВНЫЙ БОНУС (ВОЕННЫЙ ЯЩИК СНАБЖЕНИЯ) =====================
  claimDailyCrate(username) {
    const user = this.ensureUser(username);
    if (!user) return { error: 'Сначала войдите в аккаунт!' };

    const now = Date.now();
    const cooldownMs = 24 * 60 * 60 * 1000; // 24 часа
    const lastClaim = user.lastDailyClaim || 0;

    if (now - lastClaim < cooldownMs) {
      const remainingMs = cooldownMs - (now - lastClaim);
      const hours = Math.floor(remainingMs / (60 * 60 * 1000));
      const minutes = Math.ceil((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
      return {
        error: `Военный ящик уже открыт сегодня! Следующий через ${hours} ч. ${minutes} мин.`,
        nextAvailableAt: lastClaim + cooldownMs
      };
    }

    // Призы из Военного Ящика (от 150 до 2500 BunCoins)
    const prizePool = [
      { coins: 200, weight: 28, label: { ru: 'Армейский паёк (+200 🪙)', en: 'Military Ration (+200 🪙)', uz: 'Harbiy payok (+200 🪙)' } },
      { coins: 350, weight: 25, label: { ru: 'Аптечка Бункера (+350 🪙)', en: 'Bunker Medkit (+350 🪙)', uz: 'Bunker qutisi (+350 🪙)' } },
      { coins: 500, weight: 20, label: { ru: 'Ящик патронов (+500 🪙)', en: 'Ammo Crate (+500 🪙)', uz: 'O\'q-dori qutisi (+500 🪙)' } },
      { coins: 800, weight: 14, label: { ru: 'Золотой фильтр (+800 🪙)', en: 'Golden Filter (+800 🪙)', uz: 'Oltin filtr (+800 🪙)' } },
      { coins: 1200, weight: 8, label: { ru: 'Секретный контейнер (+1200 🪙)', en: 'Secret Container (+1200 🪙)', uz: 'Maxfiy konteyner (+1200 🪙)' } },
      { coins: 2500, weight: 5, label: { ru: '☢️ ДЖЕКПОТ ГЕНЕРАЛА (+2500 🪙)!', en: '☢️ GENERAL JACKPOT (+2500 🪙)!', uz: '☢️ GENERAL JEKPOTI (+2500 🪙)!' } }
    ];

    const totalWeight = prizePool.reduce((acc, p) => acc + p.weight, 0);
    let rand = Math.random() * totalWeight;
    let chosen = prizePool[0];
    for (const p of prizePool) {
      if (rand < p.weight) {
        chosen = p;
        break;
      }
      rand -= p.weight;
    }

    user.bunCoins = (user.bunCoins || 0) + chosen.coins;
    user.lastDailyClaim = now;
    this.saveUsers();

    return {
      success: true,
      prizeCoins: chosen.coins,
      prizeLabel: chosen.label,
      nextAvailableAt: now + cooldownMs,
      user: this.sanitizeUser(user)
    };
  }

  // ===================== ПРОМОКОДЫ (АДМИНКА И АКТИВАЦИЯ) =====================
  getPromoCodes() {
    return Array.from(this.promos.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  createPromoCode(code, reward, maxUses = 100) {
    const cleanCode = String(code || '').trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 3) {
      return { error: 'Промокод должен содержать минимум 3 символа' };
    }
    const rewardNum = Math.max(10, parseInt(reward, 10) || 500);
    const maxUsesNum = Math.max(1, parseInt(maxUses, 10) || 100);

    const promo = {
      code: cleanCode,
      reward: rewardNum,
      maxUses: maxUsesNum,
      usedBy: this.promos.get(cleanCode)?.usedBy || [],
      createdAt: new Date().toISOString()
    };

    this.promos.set(cleanCode, promo);
    this.savePromos();
    return { success: true, promo, promos: this.getPromoCodes() };
  }

  deletePromoCode(code) {
    const cleanCode = String(code || '').trim().toUpperCase();
    this.promos.delete(cleanCode);
    this.savePromos();
    return { success: true, promos: this.getPromoCodes() };
  }

  redeemPromoCode(username, code) {
    const user = this.ensureUser(username);
    if (!user) return { error: 'Сначала войдите в аккаунт!' };

    const cleanCode = String(code || '').trim().toUpperCase();
    if (!cleanCode) return { error: 'Введите промокод!' };

    const promo = this.promos.get(cleanCode);
    if (!promo) return { error: 'Такой промокод не найден или истёк!' };

    if (!Array.isArray(promo.usedBy)) promo.usedBy = [];
    const uKey = user.username.toLowerCase();

    if (promo.usedBy.includes(uKey)) {
      return { error: 'Вы уже активировали этот промокод ранее!' };
    }

    if (promo.usedBy.length >= promo.maxUses) {
      return { error: 'Лимит активаций этого промокода исчерпан!' };
    }

    promo.usedBy.push(uKey);
    user.bunCoins = (user.bunCoins || 0) + promo.reward;
    this.savePromos();
    this.saveUsers();

    return {
      success: true,
      reward: promo.reward,
      code: cleanCode,
      user: this.sanitizeUser(user),
      message: `🎉 Промокод ${cleanCode} активирован! Начислено +${promo.reward} BunCoins!`
    };
  }

  // ===================== ЛИЧНЫЙ ЧАТ С ДРУЗЬЯМИ =====================
  getDmKey(userA, userB) {
    return [String(userA || '').trim().toLowerCase(), String(userB || '').trim().toLowerCase()].sort().join('::');
  }

  getDirectMessages(userA, userB) {
    if (!userA || !userB) return [];
    const key = this.getDmKey(userA, userB);
    return this.directMessages.get(key) || [];
  }

  sendDirectMessage(fromUsername, toUsername, text, voice = null) {
    const sender = this.ensureUser(fromUsername);
    const target = this.findUserByIdOrName(toUsername);
    if (!sender || !target) return { error: 'Игрок не найден' };

    const hasVoice = Boolean(voice && voice.audioData);
    const cleanText = String(text || '').trim().substring(0, 400) || (hasVoice ? '🎤 Голосовое сообщение' : '');
    if (!cleanText && !hasVoice) return { error: 'Введите текст сообщения' };

    const key = this.getDmKey(sender.username, target.username);
    const list = this.directMessages.get(key) || [];

    const nowMs = Date.now();
    const msg = {
      id: 'dm_' + nowMs + '_' + Math.random().toString(36).substring(2, 6),
      from: sender.username,
      fromAvatar: sender.avatarUrl || null,
      to: target.username,
      text: cleanText,
      voice: hasVoice ? {
        audioData: voice.audioData,
        duration: Math.round(Number(voice.duration) || 0)
      } : null,
      timestamp: new Date(nowMs).toLocaleTimeString('ru-RU', {
        timeZone: 'Asia/Tashkent',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      createdAt: nowMs
    };

    list.push(msg);
    if (list.length > 100) list.shift();
    this.directMessages.set(key, list);
    this.saveDirectMessages();

    return {
      success: true,
      message: msg,
      messages: list,
      targetUsername: target.username
    };
  }

  findUserByIdOrName(query) {
    if (!query) return null;
    const clean = String(query).trim().replace(/^#/, '').toLowerCase();
    if (!clean) return null;

    // 1. Сначала ищем по точному совпадению userId (например, 6-значный ID)
    for (const u of this.users.values()) {
      if (u.userId && String(u.userId).toLowerCase() === clean) {
        return u;
      }
    }

    // 2. Затем ищем по имени пользователя
    if (this.users.has(clean)) {
      return this.users.get(clean);
    }

    return null;
  }

  addFriend(username, targetQuery) {
    const me = this.ensureUser(username);
    if (!me) return { error: 'Сначала войдите в свой аккаунт!' };

    const target = this.findUserByIdOrName(targetQuery);
    if (!target) {
      return { error: 'Игрок с таким ID (или именем) не найден!' };
    }

    if (target.username.toLowerCase() === me.username.toLowerCase()) {
      return { error: 'Нельзя добавить самого себя в друзья!' };
    }

    if (!Array.isArray(me.friends)) me.friends = [];
    if (!Array.isArray(target.friends)) target.friends = [];

    const alreadyFriend = me.friends.some(f => f.toLowerCase() === target.username.toLowerCase());
    if (!alreadyFriend) {
      me.friends.push(target.username);
    }

    const reverseFriend = target.friends.some(f => f.toLowerCase() === me.username.toLowerCase());
    if (!reverseFriend) {
      target.friends.push(me.username);
    }

    this.saveUsers();
    return {
      success: true,
      user: this.sanitizeUser(me),
      friend: this.sanitizeUser(target)
    };
  }

  removeFriend(username, friendUsername) {
    const me = this.ensureUser(username);
    if (!me) return { error: 'Аккаунт не найден' };
    const targetKey = (friendUsername || '').trim().toLowerCase();

    if (Array.isArray(me.friends)) {
      me.friends = me.friends.filter(f => f.toLowerCase() !== targetKey);
    }
    const target = this.users.get(targetKey);
    if (target && Array.isArray(target.friends)) {
      target.friends = target.friends.filter(f => f.toLowerCase() !== me.username.toLowerCase());
    }

    this.saveUsers();
    return {
      success: true,
      user: this.sanitizeUser(me)
    };
  }

  getFriendsList(username, onlineSet = new Set(), activeRooms = []) {
    const me = this.ensureUser(username);
    if (!me) return [];
    const friendNames = Array.isArray(me.friends) ? me.friends : [];

    return friendNames
      .map(fname => {
        const fUser = this.users.get(String(fname).toLowerCase());
        if (!fUser) return null;
        const sanitized = this.sanitizeUser(fUser);
        const fKey = fUser.username.toLowerCase();
        const isOnline = onlineSet.has(fKey);

        // Проверяем, находится ли друг сейчас в какой-то открытой комнате
        let currentRoomCode = null;
        let currentRoomStatus = null;
        for (const r of activeRooms) {
          const inRoom = (r.players || []).some(
            p => !p.isBot && ((p.username && p.username.toLowerCase() === fKey) || (p.name && p.name.toLowerCase() === fKey))
          );
          if (inRoom) {
            currentRoomCode = r.code;
            currentRoomStatus = r.status;
            break;
          }
        }

        return {
          userId: sanitized.userId,
          username: sanitized.username,
          avatarUrl: sanitized.avatarUrl,
          characterDetails: sanitized.characterDetails,
          stats: sanitized.stats,
          isOnline: isOnline || Boolean(currentRoomCode),
          currentRoomCode,
          currentRoomStatus
        };
      })
      .filter(Boolean);
  }

  addCoins(username, amount) {
    if (!username) return 0;
    const uname = username.trim();
    const key = uname.toLowerCase();
    let user = this.users.get(key);

    // Если аккаунт еще не зарегистрирован, создаем его автоматически
    if (!user) {
      user = {
        username: uname,
        password: 'user123',
        bunCoins: Math.max(0, 500 + amount),
        inventory: ['char_stalker', 'frame_default', 'title_survivor'],
        equipped: {
          character: 'char_stalker',
          frame: 'frame_default',
          title: 'title_survivor'
        },
        stats: {
          gamesPlayed: 0,
          wins: 0,
          roundsSurvived: 0
        },
        createdAt: new Date().toISOString()
      };
      this.users.set(key, user);
      this.saveUsers();
      return user.bunCoins;
    }

    user.bunCoins = Math.max(0, (user.bunCoins || 0) + amount);
    this.saveUsers();
    return user.bunCoins;
  }

  recordGameStats(username, won = false, rounds = 1) {
    if (!username) return;
    const user = this.users.get(username.toLowerCase());
    if (user) {
      if (!user.stats) user.stats = { gamesPlayed: 0, wins: 0, roundsSurvived: 0 };
      user.stats.gamesPlayed = (user.stats.gamesPlayed || 0) + 1;
      if (won) user.stats.wins = (user.stats.wins || 0) + 1;
      user.stats.roundsSurvived = (user.stats.roundsSurvived || 0) + rounds;

      // Reward BunCoins: +50 per round, +500 for win
      const earned = (rounds * 50) + (won ? 500 : 0);
      user.bunCoins = (user.bunCoins || 0) + earned;

      this.saveUsers();
      return earned;
    }
    return 0;
  }

  buyItem(username, itemId) {
    const user = this.ensureUser(username);
    if (!user) return { error: 'Пользователь не найден' };

    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return { error: 'Товар не найден в магазине' };

    if (!user.inventory) user.inventory = [];
    if (user.inventory.includes(itemId)) {
      return { error: 'Этот предмет уже у вас в инвентаре' };
    }

    if (user.bunCoins < item.price) {
      return { error: `Недостаточно BunCoins! Нужно ${item.price}, а у вас ${user.bunCoins}.` };
    }

    user.bunCoins -= item.price;
    user.inventory.push(itemId);
    this.saveUsers();

    return { success: true, user: this.sanitizeUser(user), message: 'Предмет успешно приобретен!' };
  }

  equipItem(username, itemId) {
    const user = this.ensureUser(username);
    if (!user) return { error: 'Пользователь не найден' };

    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return { error: 'Предмет не найден' };

    if (!user.inventory || !user.inventory.includes(itemId)) {
      return { error: 'Сначала приобретите этот предмет в магазине' };
    }

    if (!user.equipped) {
      user.equipped = { character: 'char_stalker', frame: 'frame_default', title: 'title_survivor' };
    }

    if (item.type === 'character') user.equipped.character = itemId;
    if (item.type === 'frame') user.equipped.frame = itemId;
    if (item.type === 'title') user.equipped.title = itemId;

    this.saveUsers();
    return { success: true, user: this.sanitizeUser(user) };
  }

  getShopCatalog() {
    return SHOP_ITEMS;
  }
}

const userManager = new UserManager();
module.exports = {
  userManager,
  SHOP_ITEMS
};
