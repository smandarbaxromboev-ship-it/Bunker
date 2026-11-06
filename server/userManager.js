// User Management & Economy System for "Бункер: 7 Раундов Откровений"
// BunCoins currency, Player Profiles, Shop Items & Customization
const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, 'usersDatabase.json');

// Shop Catalog: Characters, Frames & Titles
const SHOP_ITEMS = [
  // CHARACTERS / SKINS
  {
    id: 'char_stalker',
    type: 'character',
    name: { ru: 'Сталкер-Разведчик', en: 'Wasteland Stalker', uz: 'Yovvoyi Izquvar' },
    avatar: '🥷',
    price: 0, // Default free
    desc: { ru: 'Привык к вылазкам на радиоактивную поверхность.', en: 'Used to scouting dangerous radioactive surface.', uz: 'Xavfli radiatsion yerlarda yurishga o\'rgangan.' }
  },
  {
    id: 'char_medic',
    type: 'character',
    name: { ru: 'Боевой Медик', en: 'Combat Medic', uz: 'Harbiy Shifokor' },
    avatar: '🩺',
    price: 300,
    desc: { ru: 'Спасет жизни союзников в критический момент.', en: 'Saves allies lives during critical moments.', uz: 'Og\'ir vaziyatlarda safdoshlar hayotini saqlaydi.' }
  },
  {
    id: 'char_cyborg',
    type: 'character',
    name: { ru: 'Киборг X-100', en: 'Cyborg X-100', uz: 'Kiborg X-100' },
    avatar: '🤖',
    price: 500,
    desc: { ru: 'Титановый экзоскелет и бионический прицел.', en: 'Titanium chassis and bionic scope.', uz: 'Titan tanasi va bionik ko\'rish qobiliyati.' }
  },
  {
    id: 'char_hazmat',
    type: 'character',
    name: { ru: 'Ученый Биолаборатории', en: 'Bio-Hazmat Scientist', uz: 'Biolaboratoriya Olimi' },
    avatar: '☣️',
    price: 450,
    desc: { ru: 'Знает формулы вакцин и синтеза фильтров.', en: 'Knows formulas for vaccines and filters.', uz: 'Vaksina va filtrlar formulasini biladi.' }
  },
  {
    id: 'char_officer',
    type: 'character',
    name: { ru: 'Командир Альфа', en: 'Alpha Commander', uz: 'Alfa Komandiri' },
    avatar: '🎖️',
    price: 700,
    desc: { ru: 'Железная дисциплина и тактический гений.', en: 'Iron discipline and tactical genius.', uz: 'Temir intizom va taktik mahorat.' }
  },
  {
    id: 'char_mutant',
    type: 'character',
    name: { ru: 'Радиоактивный Мутант', en: 'Glowing Mutant', uz: 'Nurlangan Mutant' },
    avatar: '🧬',
    price: 600,
    desc: { ru: 'Иммунен к любой радиации пустошей.', en: 'Immune to all wasteland radiation.', uz: 'Barcha radiatsiyalarga immunitetga ega.' }
  },
  {
    id: 'char_sniper',
    type: 'character',
    name: { ru: 'Неоновый Снайпер', en: 'Neon Sniper', uz: 'Neon Mergan' },
    avatar: '🎯',
    price: 800,
    desc: { ru: 'Бьет без промаха сквозь ночной дым.', en: 'Never misses a shot through thick night fog.', uz: 'Tungi tuman ichida ham nishonga bexato uradi.' }
  },

  // AVATAR FRAMES
  {
    id: 'frame_default',
    type: 'frame',
    name: { ru: 'Стандартная сталь', en: 'Standard Steel', uz: 'Standart Po\'lat' },
    borderClass: 'border-slate-400 dark:border-zinc-700',
    glowClass: '',
    price: 0
  },
  {
    id: 'frame_amber',
    type: 'frame',
    name: { ru: 'Янтарный Неон', en: 'Amber Neon Glow', uz: 'Qahrabo Neon' },
    borderClass: 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]',
    glowClass: 'ring-2 ring-amber-400/60',
    price: 200
  },
  {
    id: 'frame_radioactive',
    type: 'frame',
    name: { ru: 'Радиационное сияние', en: 'Radioactive Green', uz: 'Radiatsion Yashil' },
    borderClass: 'border-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.55)]',
    glowClass: 'ring-2 ring-emerald-400/60',
    price: 350
  },
  {
    id: 'frame_plasma',
    type: 'frame',
    name: { ru: 'Плазменный фиолетовый', en: 'Plasma Purple', uz: 'Plazma Binafsha' },
    borderClass: 'border-purple-500 shadow-[0_0_18px_rgba(168,85,247,0.55)]',
    glowClass: 'ring-2 ring-purple-400/60',
    price: 450
  },
  {
    id: 'frame_gold',
    type: 'frame',
    name: { ru: 'Золотой Киберпанк', en: 'Cyberpunk Gold', uz: 'Oltin Kiberpank' },
    borderClass: 'border-yellow-400 shadow-[0_0_22px_rgba(250,204,21,0.65)]',
    glowClass: 'ring-2 ring-yellow-400',
    price: 600
  },
  {
    id: 'frame_titan',
    type: 'frame',
    name: { ru: 'Титан Элита', en: 'Titanium Elite', uz: 'Titan Elita' },
    borderClass: 'border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.7)] animate-pulse',
    glowClass: 'ring-2 ring-cyan-300',
    price: 800
  },

  // TITLES
  {
    id: 'title_survivor',
    type: 'title',
    name: { ru: 'Выживший', en: 'Survivor', uz: 'Omon Qolgan' },
    color: 'text-slate-400',
    price: 0
  },
  {
    id: 'title_master',
    type: 'title',
    name: { ru: 'Хозяин Бункера', en: 'Bunker Master', uz: 'Bunker Xo\'jayini' },
    color: 'text-amber-400 font-bold',
    price: 300
  },
  {
    id: 'title_ghost',
    type: 'title',
    name: { ru: 'Призрак Пустошей', en: 'Wasteland Phantom', uz: 'Sahro Arvohi' },
    color: 'text-purple-400 font-bold',
    price: 250
  },
  {
    id: 'title_agent',
    type: 'title',
    name: { ru: 'Кибер-Агент', en: 'Cyber-Agent', uz: 'Kiber-Agent' },
    color: 'text-cyan-400 font-bold',
    price: 400
  },
  {
    id: 'title_legend',
    type: 'title',
    name: { ru: 'Легенда Зоны', en: 'Zone Legend', uz: 'Zona Afsonasi' },
    color: 'text-red-400 font-bold',
    price: 600
  },
  {
    id: 'title_immortal',
    type: 'title',
    name: { ru: 'Бессмертный', en: 'Immortal', uz: 'O\'lmas' },
    color: 'text-yellow-400 font-extrabold tracking-wider',
    price: 1000
  }
];

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

  register(username, password) {
    const uname = (username || '').trim();
    const pwd = (password || '').trim();

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
      createdAt: new Date().toISOString()
    };

    this.users.set(key, newUser);
    this.saveUsers();

    return { success: true, user: this.sanitizeUser(newUser) };
  }

  login(username, password) {
    const uname = (username || '').trim().toLowerCase();
    const pwd = (password || '').trim();

    const user = this.users.get(uname);
    if (!user || user.password !== pwd) {
      return { error: 'Неверное имя пользователя или пароль.' };
    }

    return { success: true, user: this.sanitizeUser(user) };
  }

  getUser(username) {
    if (!username) return null;
    const user = this.users.get(username.toLowerCase());
    return user ? this.sanitizeUser(user) : null;
  }

  sanitizeUser(user) {
    const characterItem = SHOP_ITEMS.find(i => i.id === user.equipped.character) || SHOP_ITEMS[0];
    const frameItem = SHOP_ITEMS.find(i => i.id === user.equipped.frame) || SHOP_ITEMS[7];
    const titleItem = SHOP_ITEMS.find(i => i.id === user.equipped.title) || SHOP_ITEMS[13];

    return {
      username: user.username,
      bunCoins: user.bunCoins,
      inventory: user.inventory || [],
      equipped: user.equipped,
      characterDetails: {
        avatar: characterItem.avatar,
        name: characterItem.name,
        borderClass: frameItem.borderClass || '',
        glowClass: frameItem.glowClass || '',
        title: titleItem.name,
        titleColor: titleItem.color || ''
      },
      stats: user.stats || { gamesPlayed: 0, wins: 0 }
    };
  }

  addCoins(username, amount) {
    if (!username) return;
    const user = this.users.get(username.toLowerCase());
    if (user) {
      user.bunCoins = Math.max(0, (user.bunCoins || 0) + amount);
      this.saveUsers();
      return user.bunCoins;
    }
    return 0;
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
    const user = this.users.get((username || '').toLowerCase());
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
    const user = this.users.get((username || '').toLowerCase());
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

