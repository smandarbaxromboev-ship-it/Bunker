// Game Manager for "Бункер: 7 Раундов Откровений"
// Sequential Turn-Based Card Reveals (60s each with auto-pick)
// 20-Minute Round Discussion & Voting (with auto-exile on timeout and +5 min Extra Time on ties)
const { generateDecksForPlayers } = require('./cardGenerator');
const { userManager, SHOP_ITEMS } = require('./userManager');

const BOT_CHARACTERS = [
  { avatar: '🤖', name: { ru: 'Киборг X-100', en: 'Cyborg X-100', uz: 'Kiborg X-100' }, borderClass: 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]', glowClass: 'ring-2 ring-cyan-300', title: { ru: 'Кибер-Агент', en: 'Cyber-Agent', uz: 'Kiber-Agent' }, titleColor: 'text-cyan-400 font-bold' },
  { avatar: '🩺', name: { ru: 'Боевой Медик', en: 'Combat Medic', uz: 'Harbiy Shifokor' }, borderClass: 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]', glowClass: 'ring-2 ring-emerald-400/60', title: { ru: 'Спаситель', en: 'Lifesaver', uz: 'Qutqaruvchi' }, titleColor: 'text-emerald-400 font-bold' },
  { avatar: '☣️', name: { ru: 'Био-Ученый', en: 'Hazmat Scientist', uz: 'Bio Olim' }, borderClass: 'border-lime-500 shadow-[0_0_15px_rgba(132,204,22,0.5)]', glowClass: 'ring-2 ring-lime-400/60', title: { ru: 'Вирусолог', en: 'Virologist', uz: 'Virusolog' }, titleColor: 'text-lime-400 font-bold' },
  { avatar: '🎖️', name: { ru: 'Командир Альфа', en: 'Alpha Commander', uz: 'Alfa Komandiri' }, borderClass: 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]', glowClass: 'ring-2 ring-amber-400/60', title: { ru: 'Хозяин Бункера', en: 'Bunker Master', uz: 'Bunker Xo\'jayini' }, titleColor: 'text-amber-400 font-bold' },
  { avatar: '🧬', name: { ru: 'Мутант Пустошей', en: 'Glowing Mutant', uz: 'Nurlangan Mutant' }, borderClass: 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]', glowClass: 'ring-2 ring-purple-400/60', title: { ru: 'Призрак Зоны', en: 'Zone Phantom', uz: 'Zona Arvohi' }, titleColor: 'text-purple-400 font-bold' },
  { avatar: '🎯', name: { ru: 'Неоновый Снайпер', en: 'Neon Sniper', uz: 'Neon Mergan' }, borderClass: 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]', glowClass: 'ring-2 ring-yellow-400', title: { ru: 'Легенда Пустошей', en: 'Wasteland Legend', uz: 'Sahro Afsonasi' }, titleColor: 'text-yellow-400 font-bold' }
];

// Динамический расчет призовых мест:
// 3..9 игроков -> 2 места
// 10 игроков -> 3 места
// 11 игроков -> 4 места
// 12 игроков -> 5 мест
function calculateBunkerCapacity(playerCount) {
  if (playerCount >= 12) return 5;
  if (playerCount === 11) return 4;
  if (playerCount === 10) return 3;
  return 2;
}

function resolvePlayerCharacter(userProfile) {
  if (userProfile && userProfile.characterDetails) {
    return {
      avatar: userProfile.characterDetails.avatar || '🥷',
      avatarUrl: userProfile.characterDetails.avatarUrl || userProfile.avatarUrl || null,
      name: userProfile.characterDetails.name || { ru: 'Сталкер', en: 'Stalker', uz: 'Izquvar' },
      borderClass: userProfile.characterDetails.borderClass || 'border-slate-400 dark:border-zinc-700',
      glowClass: userProfile.characterDetails.glowClass || '',
      title: userProfile.characterDetails.title || { ru: 'Выживший', en: 'Survivor', uz: 'Omon Qolgan' },
      titleColor: userProfile.characterDetails.titleColor || 'text-slate-400'
    };
  }
  return {
    avatar: '🥷',
    avatarUrl: null,
    name: { ru: 'Сталкер', en: 'Stalker', uz: 'Izquvar' },
    borderClass: 'border-slate-400 dark:border-zinc-700',
    glowClass: '',
    title: { ru: 'Выживший', en: 'Survivor', uz: 'Omon Qolgan' },
    titleColor: 'text-slate-400'
  };
}

const DISASTERS = [
  {
    title: { ru: "Ядерный взрыв", en: "Nuclear Fallout", uz: "Yadroviy portlash" },
    desc: { 
      ru: "Высокая радиация на поверхности. В живых останутся только те, кто займет места в бункере.",
      en: "Extreme radiation above. Only survivors who secure bunker spots will make it.",
      uz: "Tashqarida o'ta yuqori radiatsiya. Faqat bunkerga kirganlar tirik qoladi."
    }
  },
  {
    title: { ru: "Смертельный вирус", en: "Deadly Virus Outbreak", uz: "O'limli virus epidemiyasi" },
    desc: { 
      ru: "Планета заражена мутагеном. В бункере стерильный воздух и ограниченное количество спальных мест.",
      en: "Air is contaminated with mutagen. The bunker has clean air and strictly limited spots.",
      uz: "Havo zaharli virus bilan to'lgan. Bunkerda faqat cheklangan joylar bor."
    }
  },
  {
    title: { ru: "Ледниковый период", en: "Ice Age -70°C", uz: "Muzlik davri -70°C" },
    desc: { 
      ru: "Температура снаружи упала до -70°C. Теплогенератор бункера рассчитан на ограниченное число мест.",
      en: "Temperature outside dropped to -70°C. Shelter heater can support only the designated winners.",
      uz: "Tashqarida havo harorati -70°C ga tushdi. Isitgich faqat belgilangan joylarni isita oladi."
    }
  }
];

class GameManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomCode -> roomData
    this.roomTimers = new Map(); // roomCode -> timeout handle
  }

  generateRoomCode() {
    let code;
    do {
      code = Math.floor(10000 + Math.random() * 90000).toString();
    } while (this.rooms.has(code));
    return code;
  }

  clearRoomTimer(code) {
    if (this.roomTimers.has(code)) {
      clearTimeout(this.roomTimers.get(code));
      this.roomTimers.delete(code);
    }
  }

  setRoomTimer(code, delayMs, callback) {
    this.clearRoomTimer(code);
    const handle = setTimeout(callback, delayMs);
    this.roomTimers.set(code, handle);
    return handle;
  }

  createRoom(hostPlayerName, socketId, userProfile = null) {
    const code = this.generateRoomCode();
    const playerId = 'p_' + Math.random().toString(36).substring(2, 9);
    const disaster = DISASTERS[Math.floor(Math.random() * DISASTERS.length)];
    const char = resolvePlayerCharacter(userProfile);

    const room = {
      code,
      hostId: playerId,
      status: 'LOBBY',
      currentRound: 1,
      maxRounds: 7,
      disaster,
      bunkerCapacity: calculateBunkerCapacity(1),
      createdAt: Date.now(),
      timerExpiresAt: null,
      timerDuration: null,
      timerType: null,
      isExtraTime: false,
      activeTurnPlayerId: null,
      currentRevealingPlayerIndex: 0,
      players: [
        {
          id: playerId,
          name: hostPlayerName.trim().substring(0, 20) || 'Командир',
          username: userProfile ? userProfile.username : null,
          character: char,
          socketId,
          isHost: true,
          isAlive: true,
          isBot: false,
          deck: [],
          revealedCardId: null,
          votedFor: null
        }
      ],
      messages: [
        {
          id: 'sys_' + Date.now(),
          senderId: 'SYSTEM',
          senderName: { ru: 'ТЕРМИНАЛ', en: 'TERMINAL', uz: 'TERMINAL' },
          text: {
            ru: `Комната #${code} готова. Ожидание игроков (от 3 до 12 человек).`,
            en: `Room #${code} is ready. Waiting for players (from 3 to 12 players).`,
            uz: `#${code} xona tayyor. O'yinchilar kutilmoqda (3 dan 12 tagacha o'yinchi).`
          },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true
        }
      ],
      votingResults: null
    };

    this.rooms.set(code, room);
    return { code, playerId, room: this.getSanitizedRoomState(room, playerId) };
  }

  joinRoom(code, playerName, socketId, userProfile = null) {
    const room = this.rooms.get(code);
    if (!room) {
      return { error: 'Комната с таким цифровым кодом не найдена.' };
    }

    if (room.status !== 'LOBBY') {
      return { error: 'Игра в этом бункере уже началась!' };
    }

    if (room.players.length >= 12) {
      return { error: 'Бункер переполнен (максимум 12 человек).' };
    }

    const playerId = 'p_' + Math.random().toString(36).substring(2, 9);
    const char = resolvePlayerCharacter(userProfile);
    const newPlayer = {
      id: playerId,
      name: playerName.trim().substring(0, 20) || `Игрок_${room.players.length + 1}`,
      username: userProfile ? userProfile.username : null,
      character: char,
      socketId,
      isHost: false,
      isAlive: true,
      isBot: false,
      deck: [],
      revealedCardId: null,
      votedFor: null
    };

    room.players.push(newPlayer);
    room.bunkerCapacity = calculateBunkerCapacity(room.players.length);

    this.addSystemMessage(room, {
      ru: `Игрок ${newPlayer.name} подключился к комнате (Игроков: ${room.players.length}/12, Призовых мест: ${room.bunkerCapacity}).`,
      en: `Player ${newPlayer.name} connected to the room (Players: ${room.players.length}/12, Bunker spots: ${room.bunkerCapacity}).`,
      uz: `${newPlayer.name} xonaga qo'shildi (O'yinchilar: ${room.players.length}/12, Bunkerda joylar: ${room.bunkerCapacity}).`
    });
    this.broadcastRoom(code);

    return { code, playerId, room: this.getSanitizedRoomState(room, playerId) };
  }

  reconnectPlayer(code, playerId, socketId) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Сессия не найдена.' };

    const player = room.players.find(p => p.id === playerId);
    if (!player) return { error: 'Игрок не найден.' };

    player.socketId = socketId;
    return { code, playerId, room: this.getSanitizedRoomState(room, playerId) };
  }

  addBot(code, requesterId, lang = 'ru') {
    const room = this.rooms.get(code);
    if (!room || room.status !== 'LOBBY') return;
    if (room.hostId !== requesterId) return;
    if (room.players.length >= 12) return;

    const botNamesByLang = {
      en: [
        'Alex', 'David', 'Sarah', 'Sam',
        'Elena', 'Michael', 'Anna', 'James',
        'Olivia', 'Victor', 'Sophia', 'Max',
        'Emily', 'Arthur', 'Lucas', 'Mia'
      ],
      uz: [
        'Sardor', 'Jasur', 'Dilnoza', 'Alisher',
        'Shahzod', 'Farrux', 'Kamila', 'Aziz',
        'Nilufar', 'Bobur', 'Zilola', 'Ulug\'bek',
        'Madina', 'Jamshid', 'Mohira', 'Shoxrux'
      ],
      ru: [
        'Алексей', 'Дмитрий', 'Марина', 'Сардор',
        'Елена', 'Тимур', 'Анна', 'Рустам',
        'Ольга', 'Жасур', 'Виктор', 'Алишер',
        'София', 'Максим', 'Камила', 'Фаррух',
        'Артур', 'Дильноза', 'Игорь', 'Шахзод'
      ]
    };
    const botNames = botNamesByLang[lang] || botNamesByLang.ru;
    const availableNames = botNames.filter(name => !room.players.some(p => p.name === name));
    const prefix = lang === 'uz' ? 'Bot_' : lang === 'en' ? 'Bot_' : 'Бот_';
    const botName = availableNames[0] || `${prefix}${room.players.length + 1}`;

    const botId = 'bot_' + Math.random().toString(36).substring(2, 9);
    const botChar = BOT_CHARACTERS[(room.players.length - 1) % BOT_CHARACTERS.length];
    room.players.push({
      id: botId,
      name: botName,
      character: botChar,
      socketId: null,
      isHost: false,
      isAlive: true,
      isBot: true,
      deck: [],
      revealedCardId: null,
      votedFor: null
    });

    room.bunkerCapacity = calculateBunkerCapacity(room.players.length);

    this.addSystemMessage(room, {
      ru: `Бот ${botName} вошел в лобби (Игроков: ${room.players.length}/12, Призовых мест: ${room.bunkerCapacity}).`,
      en: `Bot ${botName} joined the lobby (Players: ${room.players.length}/12, Bunker spots: ${room.bunkerCapacity}).`,
      uz: `${botName} boti lobbiga kirdi (O'yinchilar: ${room.players.length}/12, Bunkerda joylar: ${room.bunkerCapacity}).`
    });
    this.broadcastRoom(code);
  }

  removeBot(code, botId, requesterId) {
    const room = this.rooms.get(code);
    if (!room || room.status !== 'LOBBY') return;
    if (room.hostId !== requesterId) return;

    const idx = room.players.findIndex(p => p.id === botId && p.isBot);
    if (idx !== -1) {
      const removed = room.players.splice(idx, 1)[0];
      room.bunkerCapacity = calculateBunkerCapacity(room.players.length);
      this.addSystemMessage(room, {
        ru: `Бот ${removed.name} удален из комнаты (Игроков: ${room.players.length}/12, Призовых мест: ${room.bunkerCapacity}).`,
        en: `Bot ${removed.name} removed from the room (Players: ${room.players.length}/12, Bunker spots: ${room.bunkerCapacity}).`,
        uz: `${removed.name} boti xonadan o'chirildi (O'yinchilar: ${room.players.length}/12, Bunkerda joylar: ${room.bunkerCapacity}).`
      });
      this.broadcastRoom(code);
    }
  }

  startGame(code, requesterId) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Комната не найдена.' };
    if (room.hostId !== requesterId) return { error: 'Только создатель комнаты может запустить игру.' };
    if (room.players.length < 3) {
      return { error: 'Для старта нужно минимум 3 игрока. Добавьте ботов кнопкой!' };
    }
    if (room.players.length > 12) {
      return { error: 'В бункере максимум 12 игроков.' };
    }

    room.currentRound = 1;
    room.bunkerCapacity = calculateBunkerCapacity(room.players.length);

    // Генерируем колоды БЕЗ ДУБЛИКАТОВ для всех игроков
    const decks = generateDecksForPlayers(room.players.length);
    room.players.forEach((player, i) => {
      player.deck = decks[i].map(card => ({
        ...card,
        revealed: false,
        revealedInRound: null
      }));
      player.isAlive = true;
      player.revealedCardId = null;
      player.votedFor = null;
    });

    const cap = room.bunkerCapacity;
    const count = room.players.length;
    this.addSystemMessage(room, {
      ru: `ИГРА НАЧАЛАСЬ! Раунд 1 из 7. Всего участников: ${count}. Призовых мест в бункере: ${cap}!`,
      en: `GAME STARTED! Round 1 of 7. Total players: ${count}. Winning bunker spots: ${cap}!`,
      uz: `O'YIN BOSHLANDI! 7 raunddan 1-raund. Jami ishtirokchilar: ${count}. Bunkerda g'oliblik joylari: ${cap} ta!`
    });
    this.startRevealPhase(room);
    return { success: true };
  }

  // ФАЗА 1: ПООЧЕРЕДНОЕ ВСКРЫТИЕ КАРТ (ПО 60 СЕКУНД НА ИГРОКА)
  startRevealPhase(room) {
    this.clearRoomTimer(room.code);
    room.status = 'ROUND_REVEAL';
    room.currentRevealingPlayerIndex = 0;

    // Сбрасываем выбор текущего раунда
    room.players.forEach(p => {
      p.revealedCardId = null;
    });

    this.addSystemMessage(room, {
      ru: `НАЧИНАЕТСЯ ПООЧЕРЕДНОЕ ВСКРЫТИЕ КАРТ РАУНДА ${room.currentRound}! Каждому дается ровно 1 минута на выбор.`,
      en: `SEQUENTIAL CARD REVEAL BEGINS FOR ROUND ${room.currentRound}! Each player has 60 seconds to choose.`,
      uz: `${room.currentRound}-RAUND UCHUN NAVBAT BILAN KARTALARNI OCHISH BOSHLANDI! Har biriga 1 daqiqa beriladi.`
    });
    this.promptNextPlayerReveal(room);
  }

  promptNextPlayerReveal(room) {
    this.clearRoomTimer(room.code);
    const alivePlayers = room.players.filter(p => p.isAlive);

    // Если все живые игроки уже сделали свой ход в этом раунде -> переходим к дебатам!
    if (room.currentRevealingPlayerIndex >= alivePlayers.length) {
      this.startDiscussionPhase(room);
      return;
    }

    const currentPlayer = alivePlayers[room.currentRevealingPlayerIndex];
    room.activeTurnPlayerId = currentPlayer.id;

    // Если ход бота: бот вскрывает карту через 1.5-2 секунды
    if (currentPlayer.isBot) {
      room.timerDuration = 2;
      room.timerExpiresAt = Date.now() + 2000;
      room.timerType = 'REVEAL';
      this.broadcastRoom(room.code);

      const botTimer = setTimeout(() => {
        this.performBotCardReveal(room, currentPlayer);
      }, 1800);
      this.roomTimers.set(room.code, botTimer);
      return;
    }

    // Если ход живого человека: даем ровно 60 секунд (1 минута)
    room.timerDuration = 60;
    room.timerExpiresAt = Date.now() + 60 * 1000;
    room.timerType = 'REVEAL';

    this.addSystemMessage(room, {
      ru: `🔔 Очередь хода: ${currentPlayer.name}! У вас есть 60 секунд, чтобы показать карту.`,
      en: `🔔 Current turn: ${currentPlayer.name}! You have 60 seconds to reveal a card.`,
      uz: `🔔 Navbat: ${currentPlayer.name}! Kartani ochish uchun sizda 60 soniya bor.`
    });
    this.broadcastRoom(room.code);

    // Таймер на 60 секунд: если истек — случайно вскрываем карту и передаем ход следующему!
    const timerHandle = setTimeout(() => {
      this.autoRevealTimeoutForPlayer(room.code, currentPlayer.id);
    }, 60 * 1000);

    this.roomTimers.set(room.code, timerHandle);
  }

  performBotCardReveal(room, bot) {
    const unrevealed = bot.deck.filter(c => !c.revealed);
    if (unrevealed.length > 0) {
      const chosen = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      chosen.revealed = true;
      chosen.revealedInRound = room.currentRound;
      bot.revealedCardId = chosen.id;

      const nameRu = typeof chosen.name === 'object' ? chosen.name.ru : chosen.name;
      const nameEn = typeof chosen.name === 'object' ? (chosen.name.en || chosen.name.ru) : chosen.name;
      const nameUz = typeof chosen.name === 'object' ? (chosen.name.uz || chosen.name.ru) : chosen.name;

      const valRu = typeof chosen.value === 'object' ? chosen.value.ru : chosen.value;
      const valEn = typeof chosen.value === 'object' ? (chosen.value.en || chosen.value.ru) : chosen.value;
      const valUz = typeof chosen.value === 'object' ? (chosen.value.uz || chosen.value.ru) : chosen.value;

      this.addSystemMessage(room, {
        ru: `🤖 ${bot.name} по очереди вскрыл: [${nameRu}] — "${valRu}"`,
        en: `🤖 ${bot.name} revealed in turn: [${nameEn}] — "${valEn}"`,
        uz: `🤖 ${bot.name} navbat bilan ochdi: [${nameUz}] — "${valUz}"`
      });
    }

    room.currentRevealingPlayerIndex++;
    this.promptNextPlayerReveal(room);
  }

  autoRevealTimeoutForPlayer(code, playerId) {
    const room = this.rooms.get(code);
    if (!room || room.status !== 'ROUND_REVEAL') return;

    const player = room.players.find(p => p.id === playerId);
    if (player && player.isAlive && !player.revealedCardId) {
      const unrevealed = player.deck.filter(c => !c.revealed);
      if (unrevealed.length > 0) {
        const randomCard = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        randomCard.revealed = true;
        randomCard.revealedInRound = room.currentRound;
        player.revealedCardId = randomCard.id;

        const nameRu = typeof randomCard.name === 'object' ? randomCard.name.ru : randomCard.name;
        const nameEn = typeof randomCard.name === 'object' ? (randomCard.name.en || randomCard.name.ru) : randomCard.name;
        const nameUz = typeof randomCard.name === 'object' ? (randomCard.name.uz || randomCard.name.ru) : randomCard.name;

        const valRu = typeof randomCard.value === 'object' ? randomCard.value.ru : randomCard.value;
        const valEn = typeof randomCard.value === 'object' ? (randomCard.value.en || randomCard.value.ru) : randomCard.value;
        const valUz = typeof randomCard.value === 'object' ? (randomCard.value.uz || randomCard.value.ru) : randomCard.value;

        this.addSystemMessage(room, {
          ru: `⏱️ Время 1 минута истекло! У ${player.name} случайно открыта карта: [${nameRu}] — "${valRu}"`,
          en: `⏱️ 1 minute expired! A random card was revealed for ${player.name}: [${nameEn}] — "${valEn}"`,
          uz: `⏱️ 1 daqiqa vaqt tugadi! ${player.name} uchun tasodifiy karta ochildi: [${nameUz}] — "${valUz}"`
        });
      }
    }

    room.currentRevealingPlayerIndex++;
    this.promptNextPlayerReveal(room);
  }

  revealCard(code, playerId, cardId) {
    const room = this.rooms.get(code);
    if (!room || room.status !== 'ROUND_REVEAL') return;

    const alivePlayers = room.players.filter(p => p.isAlive);
    const currentPlayer = alivePlayers[room.currentRevealingPlayerIndex];

    // Разрешаем вскрывать ТОЛЬКО тому, чей сейчас ход!
    if (!currentPlayer || currentPlayer.id !== playerId) return;

    const card = currentPlayer.deck.find(c => c.id === cardId);
    if (!card || card.revealed) return;

    this.clearRoomTimer(code);

    card.revealed = true;
    card.revealedInRound = room.currentRound;
    currentPlayer.revealedCardId = card.id;

    const nameRu = typeof card.name === 'object' ? card.name.ru : card.name;
    const nameEn = typeof card.name === 'object' ? (card.name.en || card.name.ru) : card.name;
    const nameUz = typeof card.name === 'object' ? (card.name.uz || card.name.ru) : card.name;

    const valRu = typeof card.value === 'object' ? card.value.ru : card.value;
    const valEn = typeof card.value === 'object' ? (card.value.en || card.value.ru) : card.value;
    const valUz = typeof card.value === 'object' ? (card.value.uz || card.value.ru) : card.value;

    this.addSystemMessage(room, {
      ru: `👤 ${currentPlayer.name} по очереди открыл: [${nameRu}] — "${valRu}"`,
      en: `👤 ${currentPlayer.name} revealed in turn: [${nameEn}] — "${valEn}"`,
      uz: `👤 ${currentPlayer.name} navbat bilan ochdi: [${nameUz}] — "${valUz}"`
    });

    // Передаем ход следующему игроку
    room.currentRevealingPlayerIndex++;
    this.promptNextPlayerReveal(room);
  }

  // ФАЗА 2: ДЕБАТЫ И ГОЛОСОВАНИЕ — ТАЙМЕР РОВНО 20 МИНУТ (1200 СЕКУНД)
  startDiscussionPhase(room) {
    this.clearRoomTimer(room.code);
    room.status = 'ROUND_DISCUSSION';
    room.activeTurnPlayerId = null;
    room.timerDuration = 20 * 60; // 20 минут = 1200 секунд
    room.timerExpiresAt = Date.now() + 20 * 60 * 1000;
    room.timerType = 'ROUND';

    this.addSystemMessage(room, {
      ru: `📢 ВСЕ КАРТЫ ВСКРЫТЫ! Запущен 20-минутный таймер раунда. Обсуждайте и спорьте!`,
      en: `📢 ALL CARDS REVEALED! 20-minute discussion timer started. Debate and persuade!`,
      uz: `📢 BARCHA KARTALAR OCHILDI! 20 daqiqalik muhokama taymeri ishga tushdi. Bahslashing!`
    });

    this.broadcastRoom(room.code);

    // Таймер на 20 минут: по истечении выбывает набравший больше голосов или случайный игрок!
    const timerHandle = setTimeout(() => {
      this.handleRoundTimeout(room.code);
    }, 20 * 60 * 1000);

    this.roomTimers.set(room.code, timerHandle);
  }

  handleRoundTimeout(code) {
    const room = this.rooms.get(code);
    if (!room) return;
    if (room.status !== 'ROUND_DISCUSSION' && room.status !== 'ROUND_VOTING') return;

    this.addSystemMessage(room, {
      ru: `⏰ 20 МИНУТ РАУНДА ИСТЕКЛИ! Терминал принудительно подводит итоги голосования.`,
      en: `⏰ 20 MINUTES EXPIRED! Terminal is forcing vote resolution.`,
      uz: `⏰ 20 DAQIQA TUGADI! Terminal ovoz berish natijalarini e'lon qilmoqda.`
    });
    this.resolveVoting(room, true); // true = сработало по таймауту 20 минут
  }

  startVotingPhase(code, requesterId) {
    const room = this.rooms.get(code);
    if (!room || room.status !== 'ROUND_DISCUSSION') return;

    room.status = 'ROUND_VOTING';
    room.players.forEach(p => { p.votedFor = null; });
    this.addSystemMessage(room, {
      ru: `Началось голосование! По окончании голосования всем будет открыта полная таблица — кто против кого голосовал!`,
      en: `Voting has begun! Once finished, everyone will see the full table of who voted against whom!`,
      uz: `Ovoz berish boshlandi! Yakunda kim kimga qarshi ovoz bergani barchaga ochiq ko'rsatiladi!`
    });

    this.handleBotVotes(room);
    this.broadcastRoom(code);
  }

  // Оценка слабости открытых карт кандидата для умного голосования ботов (чтобы боты голосовали как реальные люди, а не создавали вечную ничью 1-1-1!)
  evaluatePlayerSuspectScore(player) {
    let score = 10;
    const revealed = (player.deck || []).filter(c => c.revealed);

    // Если игрок скрывает карты — подозрительность выше
    if (revealed.length === 0) score += 15;

    revealed.forEach(card => {
      const val = (card.value?.ru || card.value || '').toLowerCase();
      if (card.type === 'age') {
        const ageNum = parseInt(val, 10);
        if (!isNaN(ageNum)) {
          if (ageNum >= 60) score += 30;
          else if (ageNum >= 48) score += 15;
          else if (ageNum <= 30) score -= 8;
        }
      }
      if (card.type === 'health') {
        if (val.includes('идеальн') || val.includes('100%') || val.includes('здоров') || val.includes('иммунитет') || val.includes('космонавт') || val.includes('богатыр')) {
          score -= 18;
        } else {
          score += 22;
        }
      }
      if (card.type === 'profession') {
        if (val.includes('хирург') || val.includes('врач') || val.includes('инженер') || val.includes('агроном') || val.includes('спецназ') || val.includes('медик') || val.includes('биолог')) {
          score -= 20;
        } else {
          score += 12;
        }
      }
    });

    // Небольшой человеческий фактор
    score += (Math.random() * 8);
    return Math.max(1, score);
  }

  handleBotVotes(room) {
    const bots = room.players.filter(p => p.isBot && p.isAlive);
    const aliveTargets = room.players.filter(p => p.isAlive);
    if (bots.length === 0 || aliveTargets.length <= 1) return;

    // Считаем очки подозрительности/слабости для каждого живого игрока
    const scores = new Map();
    aliveTargets.forEach(t => {
      scores.set(t.id, this.evaluatePlayerSuspectScore(t));
    });

    // Находим главного кандидата (как в реальной игре, где игроки координируются против самого слабого)
    const sortedTargets = [...aliveTargets].sort((a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0));
    const primarySuspect = sortedTargets[0];
    const secondarySuspect = sortedTargets[1] || sortedTargets[0];

    bots.forEach((bot, idx) => {
      const possibleTargets = aliveTargets.filter(p => p.id !== bot.id);
      if (possibleTargets.length === 0) return;

      // Если этот бот уже проголосовал (например, если метод вызван при подсчете) — не меняем его голос
      if (bot.votedFor) return;

      // 75% ботов голосуют консолидированно против самого слабого/подозрительного кандидата (или второго, если первый — сам бот)
      let chosen = primarySuspect.id !== bot.id ? primarySuspect : secondarySuspect;

      // Для разнообразия один из ботов при большом числе игроков может проголосовать за второго подозреваемого
      if (idx > 0 && idx % 3 === 0 && secondarySuspect && secondarySuspect.id !== bot.id) {
        chosen = secondarySuspect;
      }

      if (!chosen || chosen.id === bot.id) {
        chosen = possibleTargets[0];
      }

      bot.votedFor = chosen.id;
    });
  }

  castVote(code, voterId, targetPlayerId) {
    const room = this.rooms.get(code);
    if (!room || (room.status !== 'ROUND_VOTING' && room.status !== 'ROUND_DISCUSSION')) return;

    const voter = room.players.find(p => p.id === voterId);
    if (!voter || !voter.isAlive) return;

    const target = room.players.find(p => p.id === targetPlayerId);
    if (!target || !target.isAlive) return;

    voter.votedFor = targetPlayerId;

    // Если голосование идет прямо во время обсуждения и все люди проголосовали — боты тоже сразу отдают свои голоса!
    const aliveHumans = room.players.filter(p => p.isAlive && !p.isBot);
    const allHumansVoted = aliveHumans.length > 0 && aliveHumans.every(p => p.votedFor !== null);
    if (allHumansVoted) {
      this.handleBotVotes(room);
    }

    const alivePlayers = room.players.filter(p => p.isAlive);
    const allVoted = alivePlayers.every(p => p.votedFor !== null);

    if (allVoted && (room.status === 'ROUND_VOTING' || allHumansVoted)) {
      room.status = 'ROUND_VOTING';
      this.resolveVoting(room, false);
    } else {
      this.broadcastRoom(code);
    }
  }

  useTrumpAbility(code, playerId, payload = {}) {
    const room = this.rooms.get(code);
    if (!room) return { error: "Комната не найдена" };

    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.isAlive) return { error: "Вы не можете использовать карту" };

    const specialCard = player.deck.find(c => c.type === 'special');
    if (!specialCard) return { error: "У вас нет козыря" };
    if (specialCard.used) return { error: "Ваш козырь уже был использован ранее!" };

    const ability = payload.ability || specialCard.ability || 'swap_card';

    // Определяем, к какой именно карте привязан данный козырь (если это узкоспециализированный козырь, например "Замена хобби")
    const detectRestrictedCategory = (sc) => {
      if (sc.targetCard) return sc.targetCard;
      const text = `${sc.value?.ru || ''} ${sc.value?.en || ''} ${sc.description?.ru || ''}`.toLowerCase();
      if (text.includes('возраст') || text.includes('age') || text.includes('yosh')) return 'age';
      if (text.includes('болезн') || text.includes('здоровь') || text.includes('health') || text.includes('medical') || text.includes('медицинский сканер') || text.includes('salomatlik')) return 'health';
      if (text.includes('професси') || text.includes('profession') || text.includes('kasb')) return 'profession';
      if (text.includes('багаж') || text.includes('груз') || text.includes('luggage') || text.includes('supply') || text.includes('yuk')) return 'luggage';
      if (text.includes('факт') || text.includes('fact') || text.includes('биографи')) return 'fact';
      if (text.includes('хобби') || text.includes('hobby') || text.includes('xobbi')) return 'hobby';
      return null; // null = универсальный козырь (любая карта)
    };

    const allowedCategory = detectRestrictedCategory(specialCard);

    // 1. ПЕРЕПИСЫВАНИЕ / ЗАМЕНА КАРТЫ СВОИМИ РУКАМИ (СТРОГО ПО ТИПУ КОЗЫРЯ!)
    if (ability === 'swap_card' || ability === 'rewrite_card' || ability === 'reroll_self') {
      const targetCardId = allowedCategory || payload.targetCardId;
      const customValue = (payload.customValue || "").trim();
      const customDesc = (payload.customDesc || "").trim();

      if (!targetCardId) return { error: "Выберите карту для замены" };
      if (allowedCategory && payload.targetCardId && payload.targetCardId !== allowedCategory) {
        return { error: `Этот козырь позволяет изменить ТОЛЬКО карту категории "${allowedCategory}"!` };
      }
      if (!customValue) return { error: "Введите новое значение для карты" };

      const targetCard = player.deck.find(c => c.id === targetCardId);
      if (!targetCard) return { error: "Выбранная карта не найдена" };

      const oldVal = typeof targetCard.value === 'object' ? targetCard.value.ru : targetCard.value;
      const cardTitle = typeof targetCard.name === 'object' ? targetCard.name.ru : targetCard.name;

      targetCard.value = {
        ru: customValue,
        en: customValue,
        uz: customValue
      };

      if (customDesc) {
        targetCard.description = {
          ru: customDesc,
          en: customDesc,
          uz: customDesc
        };
      }

      targetCard.revealed = true; // Сразу раскрываем усиленную карту всем
      specialCard.used = true;
      specialCard.revealed = true;

      this.addSystemMessage(room, {
        ru: `⚡ [МАСТЕР-КОЗЫРЬ]: ${player.name} лично переписал карту [${cardTitle}]! Было: "${oldVal}" ➔ Стало: "${customValue}"!`,
        en: `⚡ [MASTER TRUMP]: ${player.name} personally rewrote card [${cardTitle}]! Was: "${oldVal}" ➔ Now: "${customValue}"!`,
        uz: `⚡ [USTA KOZIR]: ${player.name} [${cardTitle}] kartasini qayta yozdi! Oldin: "${oldVal}" ➔ Endi: "${customValue}"!`
      });
      this.broadcastRoom(code);
      return { success: true, message: `Карта [${cardTitle}] успешно переписана!` };
    }

    // 2. ДИПЛОМАТИЧЕСКИЙ ИММУНИТЕТ НА ТЕКУЩИЙ РАУНД
    if (ability === 'immunity') {
      player.hasImmunityThisRound = true;
      specialCard.used = true;
      specialCard.revealed = true;
      this.addSystemMessage(room, {
        ru: `🛡️ [КОЗЫРЬ]: ${player.name} активировал Дипломатический Иммунитет! Его невозможно изгнать в этом раунде!`,
        en: `🛡️ [TRUMP]: ${player.name} activated Diplomatic Immunity! They cannot be exiled this round!`,
        uz: `🛡️ [KOZIR]: ${player.name} Diplomatik Daxlsizlikni yoqdi! Bu raundda uni haydab bo'lmaydi!`
      });
      this.broadcastRoom(code);
      return { success: true, message: "Иммунитет успешно активирован!" };
    }

    // 3. ДВОЙНОЙ ГОЛОС
    if (ability === 'double_vote') {
      player.voteWeight = 2;
      specialCard.used = true;
      specialCard.revealed = true;
      this.addSystemMessage(room, {
        ru: `⚡ [КОЗЫРЬ]: ${player.name} активировал Двойной голос на текущее голосование!`,
        en: `⚡ [TRUMP]: ${player.name} activated Double Vote power for this round!`,
        uz: `⚡ [KOZIR]: ${player.name} ushbu ovoz berish uchun Ikki barobar ovoz kuchini yoqdi!`
      });
      this.broadcastRoom(code);
      return { success: true, message: "Двойной голос активирован!" };
    }

    // 4. ПРАВО ВЕТО
    if (ability === 'veto') {
      room.vetoActive = true;
      specialCard.used = true;
      specialCard.revealed = true;
      this.addSystemMessage(room, {
        ru: `⛔ [КОЗЫРЬ]: ${player.name} наложил Право ВЕТО на это голосование! Изгнания не будет.`,
        en: `⛔ [TRUMP]: ${player.name} exercised VETO power on this voting! Exile is canceled.`,
        uz: `⛔ [KOZIR]: ${player.name} ovoz berishga VETO qo'ydi! Hech kim haydalmaydi.`
      });
      this.broadcastRoom(code);
      return { success: true, message: "Право ВЕТО применено!" };
    }

    // 5. ШПИОН / СКАНЕР ДОСЬЕ (ИЛИ МЕДИЦИНСКИЙ СКАНЕР ТОЛЬКО ЗДОРОВЬЯ)
    if (ability === 'inspect') {
      const targetPlayer = room.players.find(p => p.id === payload.targetPlayerId);
      if (!targetPlayer) return { error: "Выберите игрока для проверки" };

      const isMedicalOnly = allowedCategory === 'health';
      const inspectedCards = isMedicalOnly
        ? targetPlayer.deck.filter(c => c.id === 'health')
        : targetPlayer.deck;

      specialCard.used = true;
      specialCard.revealed = true;
      this.addSystemMessage(room, {
        ru: isMedicalOnly
          ? `🩺 [МЕД-СКАНЕР]: ${player.name} просканировал карту Здоровья игрока ${targetPlayer.name}!`
          : `🔍 [КОЗЫРЬ]: ${player.name} применил Сканер и тайно изучил закрытые карты игрока ${targetPlayer.name}!`,
        en: isMedicalOnly
          ? `🩺 [MED-SCANNER]: ${player.name} scanned the Health card of ${targetPlayer.name}!`
          : `🔍 [TRUMP]: ${player.name} deployed Scanner and secretly inspected ${targetPlayer.name}'s hidden dossier!`,
        uz: isMedicalOnly
          ? `🩺 [TIBBIY SKANER]: ${player.name} ${targetPlayer.name}ning Salomatlik kartasini tekshirdi!`
          : `🔍 [KOZIR]: ${player.name} skanerdan foydalanib, ${targetPlayer.name}ning maxfiy kartalarini ko'rib chiqdi!`
      });
      this.broadcastRoom(code);

      return { 
        success: true, 
        inspectedPlayer: {
          id: targetPlayer.id,
          name: targetPlayer.name,
          deck: inspectedCards
        } 
      };
    }

    // 6. ТЕЛОХРАНИТЕЛЬ
    if (ability === 'bodyguard') {
      const targetPlayer = room.players.find(p => p.id === payload.targetPlayerId);
      if (!targetPlayer) return { error: "Выберите союзника для защиты" };

      targetPlayer.hasImmunityThisRound = true;
      specialCard.used = true;
      specialCard.revealed = true;
      this.addSystemMessage(room, {
        ru: `🛡️ [КОЗЫРЬ]: ${player.name} взял под личную защиту игрока ${targetPlayer.name}!`,
        en: `🛡️ [TRUMP]: ${player.name} placed ${targetPlayer.name} under personal bodyguard protection!`,
        uz: `🛡️ [KOZIR]: ${player.name} safdoshi ${targetPlayer.name}ni o'z himoyasiga oldi!`
      });
      this.broadcastRoom(code);
      return { success: true, message: `Игрок ${targetPlayer.name} под вашей защитой!` };
    }

    // 7. ПЕРЕГОЛОСОВАНИЕ
    if (ability === 'revote') {
      room.players.forEach(p => { p.votedFor = null; });
      specialCard.used = true;
      specialCard.revealed = true;
      this.addSystemMessage(room, {
        ru: `🔄 [КОЗЫРЬ]: ${player.name} потребовал немедленное ПЕРЕГОЛОСОВАНИЕ! Все голоса сброшены.`,
        en: `🔄 [TRUMP]: ${player.name} ordered an immediate REVOTE! All votes cleared.`,
        uz: `🔄 [KOZIR]: ${player.name} darhol QAYTA OVOZ BERISHNI talab qildi! Barcha ovozlar bekor qilindi.`
      });
      this.broadcastRoom(code);
      return { success: true, message: "Голоса сброшены, голосуйте заново!" };
    }

    return { error: "Неизвестная способность" };
  }

  resolveVoting(room, isTimeout = false) {
    this.clearRoomTimer(room.code);

    // Если кто-то из живых ботов еще не проголосовал — боты отдают голоса перед подсчетом!
    this.handleBotVotes(room);

    const alivePlayers = room.players.filter(p => p.isAlive);
    const voteCounts = {};
    alivePlayers.forEach(p => { voteCounts[p.id] = 0; });

    // Полная открытая таблица: кто против кого проголосовал (показывается всем после завершения голосования!)
    const voteBreakdown = [];

    let totalVotesCast = 0;
    alivePlayers.forEach(p => {
      const weight = p.voteWeight || 1;
      if (p.votedFor && voteCounts[p.votedFor] !== undefined) {
        voteCounts[p.votedFor] += weight;
        totalVotesCast += weight;
        const targetObj = room.players.find(t => t.id === p.votedFor);
        voteBreakdown.push({
          voterId: p.id,
          voterName: p.name,
          voterAvatar: p.character?.avatar || (p.isBot ? '🤖' : '🥷'),
          targetId: p.votedFor,
          targetName: targetObj ? targetObj.name : '???',
          weight
        });
      } else {
        voteBreakdown.push({
          voterId: p.id,
          voterName: p.name,
          voterAvatar: p.character?.avatar || (p.isBot ? '🤖' : '🥷'),
          targetId: null,
          targetName: null,
          weight: 0
        });
      }
    });

    // Сбрасываем множители голоса после подсчета
    alivePlayers.forEach(p => { p.voteWeight = 1; });

    let maxVotes = -1;
    let candidatesToExile = [];

    Object.entries(voteCounts).forEach(([id, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        candidatesToExile = [id];
      } else if (count === maxVotes) {
        candidatesToExile.push(id);
      }
    });

    // Отправляем открытую сводку в системный чат, чтобы все видели, кто за кого голосовал
    if (voteBreakdown.some(v => v.targetName)) {
      const summaryRu = voteBreakdown.filter(v => v.targetName).map(v => `${v.voterName} ➔ ${v.targetName}${v.weight > 1 ? ` (x${v.weight})` : ''}`).join(' | ');
      const summaryEn = voteBreakdown.filter(v => v.targetName).map(v => `${v.voterName} ➔ ${v.targetName}${v.weight > 1 ? ` (x${v.weight})` : ''}`).join(' | ');
      this.addSystemMessage(room, {
        ru: `📊 ОТКРЫТЫЕ ИТОГИ ГОЛОСОВАНИЯ: ${summaryRu}`,
        en: `📊 PUBLIC VOTE BREAKDOWN: ${summaryEn}`,
        uz: `📊 OCHIQ OVOZ BERISH NATIJALARI: ${summaryEn}`
      });
    }

    // НИЧЬЯ (равенство голосов) - если кандидатов несколько или все голоса равны
    const isTie = (candidatesToExile.length > 1 && maxVotes > 0) || (totalVotesCast === 0 && !isTimeout);

    if (isTie && !room.isExtraTime) {
      // Добавляем +5 МИНУТ экстра таймера!
      room.isExtraTime = true;
      room.timerType = 'EXTRA_TIME';
      room.timerExpiresAt = Date.now() + 5 * 60 * 1000;
      room.status = 'ROUND_DISCUSSION';
      room.lastTieBreakdown = voteBreakdown;
      // Сбрасываем голоса для повторного голосования
      alivePlayers.forEach(p => { p.votedFor = null; });

      const tiedNames = candidatesToExile
        .map(id => room.players.find(p => p.id === id)?.name)
        .filter(Boolean)
        .join(' vs ');

      this.addSystemMessage(room, {
        ru: `⚖️ НИЧЬЯ В ГОЛОСОВАНИИ (${tiedNames} — по ${maxVotes} гол.)! Добавлено +5 МИНУТ дополнительного времени для срочных дебатов и переголосования!`,
        en: `⚖️ TIE IN VOTING (${tiedNames} — ${maxVotes} votes each)! +5 MINUTES of extra time added for debates and revoting!`,
        uz: `⚖️ OVOZLAR TENG KELDI (${tiedNames} — ${maxVotes} tadan ovoz)! Shoshilinch bahslar va qayta ovoz berish uchun +5 DAQIQA qo'shildi!`
      });

      this.setRoomTimer(room.code, 5 * 60 * 1000, () => {
        this.resolveVoting(room, true);
      });

      this.broadcastRoom(room.code);
      return;
    }

    let exiledPlayer = null;

    if (room.vetoActive) {
      this.addSystemMessage(room, {
        ru: `⛔ ПРАВО ВЕТО АКТИВИРОВАНО! Любое решение об изгнании в этом раунде аннулировано!`,
        en: `⛔ VETO ACTIVATED! All exile decisions for this round have been annulled!`,
        uz: `⛔ VETO FAOLLASHTIRILDI! Bu raunddagi har qanday haydash bekor qilindi!`
      });
      room.vetoActive = false;
    } else if (totalVotesCast > 0 && maxVotes > 0) {
      // Есть голоса: кандидат на изгнание
      const exiledId = candidatesToExile[Math.floor(Math.random() * candidatesToExile.length)];
      const candidate = room.players.find(p => p.id === exiledId);

      if (candidate && candidate.hasImmunityThisRound) {
        this.addSystemMessage(room, {
          ru: `🛡️ ИММУНИТЕТ! ${candidate.name} набрал большинство голосов (${maxVotes}), но защищен ДИПЛОМАТИЧЕСКИМ ИММУНИТЕТОМ! Он остается в бункере.`,
          en: `🛡️ IMMUNITY! ${candidate.name} got majority votes (${maxVotes}), but is shielded by DIPLOMATIC IMMUNITY! They stay in the bunker.`,
          uz: `🛡️ DAXLSIZLIK! ${candidate.name} eng ko'p ovoz oldi (${maxVotes}), lekin DIPLOMATIK DAXLSIZLIK bilan himoyalangan! U bunkerda qoladi.`
        });
        candidate.hasImmunityThisRound = false;
      } else if (candidate) {
        exiledPlayer = candidate;
        exiledPlayer.isAlive = false;
        
        const extraNote = room.isExtraTime ? ' [ПО ИТОГАМ ЭКСТРА-ВРЕМЕНИ +5 МИН]' : '';
        this.addSystemMessage(room, {
          ru: `РЕШЕНИЕМ БОЛЬШИНСТВА (${maxVotes} голосов)${extraNote}: ${exiledPlayer.name} ИЗГНАН ИЗ БУНКЕРА! Теперь он Призрак 👻.`,
          en: `BY MAJORITY VOTE (${maxVotes} votes)${extraNote}: ${exiledPlayer.name} HAS BEEN EXILED FROM THE BUNKER! Now a Ghost 👻.`,
          uz: `KO'PCHILIK OVOZI BILAN (${maxVotes} ovoz)${extraNote}: ${exiledPlayer.name} BUNKERDAN HAYDALDI! Endi u Arvoh 👻.`
        });
      }
    } else if (isTimeout) {
      // Никто не проголосовал или таймер истек: случайно изгоняется 1 выживший среди набравших наибольшие голоса или всех
      const pool = candidatesToExile.length > 0 ? candidatesToExile.map(id => room.players.find(p => p.id === id)).filter(Boolean) : alivePlayers;
      const nonImmune = pool.filter(p => !p.hasImmunityThisRound);
      const chosen = nonImmune.length > 0 ? nonImmune : pool;
      exiledPlayer = chosen[Math.floor(Math.random() * chosen.length)];
      if (exiledPlayer) {
        exiledPlayer.isAlive = false;
        this.addSystemMessage(room, {
          ru: `⏰ Таймер истек! По окончанию голосования изгнан: ${exiledPlayer.name}! 👻`,
          en: `⏰ Timer expired! At the end of voting exiled: ${exiledPlayer.name}! 👻`,
          uz: `⏰ Taymer tugadi! Ovoz berish yakunida haydaldi: ${exiledPlayer.name}! 👻`
        });
      }
    } else {
      this.addSystemMessage(room, {
        ru: `Голоса разделились поровну, никто не был изгнан.`,
        en: `Votes were split evenly, nobody was exiled.`,
        uz: `Ovozlar teng bo'ldi, hech kim haydalmadi.`
      });
    }

    const wasExtraTime = Boolean(room.isExtraTime);
    room.isExtraTime = false;
    room.timerType = null;

    // Начисляем +50 BunCoins всем оставшимся в живых зарегистрированным игрокам
    alivePlayers.forEach(p => {
      if (p.isAlive && p.username) {
        userManager.addCoins(p.username, 50);
      }
    });

    // Сбрасываем временные иммунитеты
    alivePlayers.forEach(p => { p.hasImmunityThisRound = false; });

    room.votingResults = {
      round: room.currentRound,
      voteCounts,
      voteBreakdown,
      isExtraTime: wasExtraTime,
      exiledPlayer: exiledPlayer ? {
        id: exiledPlayer.id,
        name: exiledPlayer.name,
        character: exiledPlayer.character,
        votesReceived: maxVotes
      } : null
    };

    room.status = 'ROUND_RESULT';
    room.timerExpiresAt = null;

    // Проверяем: осталось ли выживших <= bunkerCapacity человек?
    const remainingAlive = room.players.filter(p => p.isAlive);
    const capacity = room.bunkerCapacity || calculateBunkerCapacity(room.players.length);
    if (remainingAlive.length <= capacity) {
      setTimeout(() => {
        this.endGame(room);
      }, 3500);
    }

    this.broadcastRoom(room.code);
  }

  nextRoundOrEnd(code, requesterId) {
    const room = this.rooms.get(code);
    if (!room || room.status !== 'ROUND_RESULT') return;

    const alivePlayers = room.players.filter(p => p.isAlive);
    const capacity = room.bunkerCapacity || calculateBunkerCapacity(room.players.length);

    // Если осталось <= capacity человек или раунд 7 завершен -> КОНЕЦ ИГРЫ
    if (alivePlayers.length <= capacity || room.currentRound >= 7) {
      this.endGame(room);
      return;
    }

    room.currentRound++;
    room.players.forEach(p => {
      p.revealedCardId = null;
      p.votedFor = null;
    });

    this.startRevealPhase(room);
  }

  endGame(room) {
    this.clearRoomTimer(room.code);
    room.status = 'GAME_OVER';
    room.timerExpiresAt = null;
    room.isExtraTime = false;
    room.players.forEach(p => {
      p.deck.forEach(c => { c.revealed = true; });
    });

    const winners = room.players.filter(p => p.isAlive);
    const winnerNames = winners.map(w => w.name).join(' & ');
    const count = winners.length;

    // Начисляем награды победителям (+500 BunCoins и победу в статистику)
    winners.forEach(w => {
      if (w.username) {
        userManager.recordGameStats(w.username, true, room.currentRound);
      }
    });

    this.addSystemMessage(room, {
      ru: `🏆 ИГРА ОКОНЧЕНА! В бункер успешно попали ${count} победител(ей/я): ${winnerNames}! Победителям начислено +500 BunCoins!`,
      en: `🏆 GAME OVER! Exactly ${count} winners made it into the bunker: ${winnerNames}! +500 BunCoins awarded to winners!`,
      uz: `🏆 O'YIN YAKUNLANDI! Bunkerga ${count} ta g'olib muvaffaqiyatli kirdi: ${winnerNames}! G'oliblarga +500 BunCoins berildi!`
    });
    this.broadcastRoom(room.code);
  }

  restartToLobby(code, requesterId) {
    const room = this.rooms.get(code);
    if (!room) return;
    if (room.hostId !== requesterId) return;

    this.clearRoomTimer(code);
    room.status = 'LOBBY';
    room.currentRound = 1;
    room.timerExpiresAt = null;
    room.activeTurnPlayerId = null;
    room.bunkerCapacity = calculateBunkerCapacity(room.players.length);
    room.players.forEach(p => {
      p.isAlive = true;
      p.deck = [];
      p.revealedCardId = null;
      p.votedFor = null;
    });
    room.messages = [
      {
        id: 'sys_' + Date.now(),
        senderId: 'SYSTEM',
        senderName: { ru: 'ТЕРМИНАЛ', en: 'TERMINAL', uz: 'TERMINAL' },
        text: {
          ru: `Комната сброшена. Готовы к новой игре!`,
          en: `Room reset. Ready for a new game!`,
          uz: `Xona yangilandi. Yangi o'yinga tayyormiz!`
        },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      }
    ];
    this.broadcastRoom(code);
  }

  addChatMessage(code, senderId, text, sticker = null) {
    const room = this.rooms.get(code);
    if (!room) return;

    const sender = room.players.find(p => p.id === senderId);
    if (!sender) return;

    // Чат доступен ВСЕГДА (даже во время и после голосования)!
    // Если игрок выбыл, сообщение отправляется в закрытый "Призрачный чат" (видят только мертвые)
    const isGhostMessage = !sender.isAlive;

    const msg = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      senderId: sender.id,
      senderName: sender.name,
      senderAvatar: sender.character?.avatar || (sender.isBot ? '🤖' : '🥷'),
      text: (text || '').trim().substring(0, 300),
      sticker: sticker || null,
      isGhost: isGhostMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: false
    };

    room.messages.push(msg);
    if (room.messages.length > 150) room.messages.shift();

    // Призрачные сообщения доставляются ТОЛЬКО выбывшим игрокам! Живые их не видят!
    room.players.forEach(p => {
      if (p.socketId) {
        if (!isGhostMessage || !p.isAlive) {
          this.io.to(p.socketId).emit('chatMessage', msg);
        }
      }
    });
  }

  addSystemMessage(room, textObj) {
    let text = textObj;
    if (typeof textObj === 'string') {
      text = { ru: textObj, en: textObj, uz: textObj };
    }
    const msg = {
      id: 'sys_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      senderId: 'SYSTEM',
      senderName: { ru: 'СИСТЕМА', en: 'SYSTEM', uz: 'TIZIM' },
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true
    };
    room.messages.push(msg);
    if (room.messages.length > 100) room.messages.shift();
    this.io.to(room.code).emit('chatMessage', msg);
  }

  getSanitizedRoomState(room, forPlayerId) {
    const requestingPlayer = room.players.find(p => p.id === forPlayerId);
    const isSpectatorOrGhost = requestingPlayer && !requestingPlayer.isAlive;
    const isGameOver = room.status === 'GAME_OVER';

    let ghostVotes = null;
    if (isSpectatorOrGhost && (room.status === 'ROUND_VOTING' || room.status === 'ROUND_DISCUSSION')) {
      ghostVotes = room.players
        .filter(p => p.isAlive && p.votedFor)
        .map(p => {
          const target = room.players.find(t => t.id === p.votedFor);
          return {
            voterId: p.id,
            voterName: p.name,
            targetId: p.votedFor,
            targetName: target ? target.name : '???'
          };
        });
    }

    return {
      code: room.code,
      hostId: room.hostId,
      status: room.status,
      currentRound: room.currentRound,
      maxRounds: room.maxRounds,
      disaster: room.disaster,
      bunkerCapacity: room.bunkerCapacity || calculateBunkerCapacity(room.players.length),
      votingResults: room.votingResults,
      ghostVotes,
      timerExpiresAt: room.timerExpiresAt,
      timerType: room.timerType,
      isExtraTime: Boolean(room.isExtraTime),
      activeTurnPlayerId: room.activeTurnPlayerId,
      players: room.players.map(p => {
        const isSelf = p.id === forPlayerId;

        return {
          id: p.id,
          name: p.name,
          username: p.username || null,
          character: p.character || {
            avatar: '🥷',
            name: { ru: 'Сталкер', en: 'Stalker', uz: 'Izquvar' },
            borderClass: 'border-slate-400 dark:border-zinc-700',
            glowClass: '',
            title: { ru: 'Выживший', en: 'Survivor', uz: 'Omon Qolgan' },
            titleColor: 'text-slate-400'
          },
          isHost: p.isHost,
          isAlive: p.isAlive,
          isBot: p.isBot,
          revealedCardId: p.revealedCardId,
          hasRevealedThisRound: p.revealedCardId !== null,
          hasVoted: p.votedFor !== null,
          votedFor: isSelf ? p.votedFor : null,
          deck: p.deck.map(card => {
            // В призрачном режиме (isSpectatorOrGhost) выбывшие игроки видят абсолютно ВСЕ карты всех живых!
            if (isSelf || card.revealed || isGameOver || isSpectatorOrGhost) {
              return {
                ...card,
                ghostVision: !card.revealed && isSpectatorOrGhost
              };
            }
            return {
              id: card.id,
              type: card.type,
              name: card.name,
              icon: card.icon,
              revealed: false,
              value: { ru: '??? [ЗАКРЫТО]', en: '??? [LOCKED]', uz: '??? [QULFLANGAN]' },
              description: { ru: 'Скрыто до вскрытия', en: 'Hidden until revealed', uz: 'Ochilguncha yashirin' }
            };
          })
        };
      }),
      // Фильтрация сообщений: призрачные сообщения видят только призраки/наблюдатели
      messages: room.messages.filter(m => !m.isGhost || isSpectatorOrGhost)
    };
  }

  broadcastRoom(code) {
    const room = this.rooms.get(code);
    if (!room) return;

    room.players.forEach(p => {
      if (p.socketId) {
        const sanitized = this.getSanitizedRoomState(room, p.id);
        this.io.to(p.socketId).emit('roomStateUpdate', sanitized);
      }
    });
  }

  getActiveRoomsSummary() {
    const summary = [];
    for (const [code, room] of this.rooms.entries()) {
      const alivePlayers = room.players.filter(p => p.isAlive);
      const botsCount = room.players.filter(p => p.isBot).length;
      const host = room.players.find(p => p.id === room.hostId);
      summary.push({
        code: room.code,
        status: room.status,
        currentRound: room.currentRound,
        maxRounds: room.maxRounds,
        bunkerCapacity: room.bunkerCapacity || calculateBunkerCapacity(room.players.length),
        disaster: room.disaster ? {
          title: room.disaster.title,
          desc: room.disaster.desc
        } : null,
        hostName: host ? host.name : 'Unknown',
        totalPlayers: room.players.length,
        aliveCount: alivePlayers.length,
        botsCount: botsCount,
        players: room.players.map(p => ({
          id: p.id,
          name: p.name,
          username: p.username || null,
          character: p.character,
          isAlive: p.isAlive,
          isBot: p.isBot,
          isHost: p.id === room.hostId
        }))
      });
    }
    return summary;
  }

  closeRoom(code) {
    if (this.rooms.has(code)) {
      this.io.to(code).emit('roomClosedByAdmin', { message: 'Комната была закрыта администратором' });
      this.rooms.delete(code);
      return true;
    }
    return false;
  }

  updatePlayerProfile(username, userProfile) {
    if (!username || !userProfile) return;
    const targetKey = username.trim().toLowerCase();
    const updatedChar = resolvePlayerCharacter(userProfile);

    for (const [code, room] of this.rooms.entries()) {
      let changed = false;
      room.players.forEach(p => {
        if ((p.username && p.username.toLowerCase() === targetKey) || p.name.toLowerCase() === targetKey) {
          p.character = updatedChar;
          changed = true;
        }
      });
      if (changed) {
        this.broadcastRoom(code);
      }
    }
  }
}

module.exports = GameManager;
