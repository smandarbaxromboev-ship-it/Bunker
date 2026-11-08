// User Management & Economy System for "Бункер: 7 Раундов Откровений"
// BunCoins currency, Player Profiles, Shop Items & Customization
const fs = require('fs');
const path = require('path');
const SHOP_ITEMS = require('./shopCatalog');

const USERS_FILE = path.join(__dirname, 'usersDatabase.json');

class UserManager {
  constructor() {
    this.users = new Map();
    this.loadUsers();
  }

  loadUsers() {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const raw = fs.readFileSync(USERS_FILE, 'utf8');
        const data = JSON.parse(raw);
        for (const [username, user] of Object.entries(data)) {
          this.users.set(username.toLowerCase(), user);
        }
      }
    } catch (e) {
      console.error('Ошибка загрузки пользователей:', e);
    }
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
      username: uname,
      password: pwd,
      avatarUrl: photo || null,
      bunCoins: 500, // Starting gift!
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
        username: uname,
        password: fallback.password || 'user123',
        avatarUrl: fallback.avatarUrl || null,
        bunCoins: typeof fallback.bunCoins === 'number' ? fallback.bunCoins : 500,
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
    }
    return user;
  }

  updateProfile(username, updates = {}) {
    if (!username) return { error: 'Имя пользователя не указано' };
    const user = this.ensureUser(username, updates);
    if (!user) return { error: 'Имя пользователя не указано' };

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
      list.push({
        username: user.username,
        avatarUrl: user.avatarUrl || null,
        rulesAccepted: Boolean(user.rulesAccepted),
        bunCoins: user.bunCoins || 0,
        isBlocked: Boolean(user.isBlocked),
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
    const characterItem = SHOP_ITEMS.find(i => i.id === user.equipped.character) || SHOP_ITEMS[0];
    const frameItem = SHOP_ITEMS.find(i => i.id === user.equipped.frame) || SHOP_ITEMS.find(i => i.type === 'frame');
    const titleItem = SHOP_ITEMS.find(i => i.id === user.equipped.title) || SHOP_ITEMS.find(i => i.type === 'title');

    return {
      username: user.username,
      avatarUrl: user.avatarUrl || null,
      rulesAccepted: Boolean(user.rulesAccepted),
      bunCoins: user.bunCoins,
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
      isBlocked: Boolean(user.isBlocked)
    };
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
