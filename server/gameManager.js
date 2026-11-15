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
    this.botTimers = new Map(); // roomCode -> array of timeout handles for staggered bot actions
  }

  generateRoomCode() {
    let code;
    do {
      code = Math.floor(10000 + Math.random() * 90000).toString();
    } while (this.rooms.has(code));
    return code;
  }

  clearBotTimers(code) {
    if (this.botTimers.has(code)) {
      const handles = this.botTimers.get(code) || [];
      handles.forEach(h => clearTimeout(h));
      this.botTimers.delete(code);
    }
  }

  clearRoomTimer(code) {
    this.clearBotTimers(code);
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
    if (this.io) {
      this.io.emit('publicRoomsUpdated', this.getPublicLobbyRooms());
    }
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
    if (!player || player.hasLeft) return { error: 'Игрок не найден.' };

    player.socketId = socketId;
    return { code, playerId, room: this.getSanitizedRoomState(room, playerId) };
  }

  leaveRoom(code, playerId, socketId) {
    const cleanCode = (code || '').trim();
    const room = this.rooms.get(cleanCode);
    if (!room) return;

    const player = room.players.find(p => (playerId && p.id === playerId) || (socketId && p.socketId === socketId));
    if (!player) return;

    // Отвязываем сокет, чтобы сервер больше НИКОГДА не возвращал вышедшего игрока обратно в комнату!
    player.socketId = null;
    player.hasLeft = true;

    if (room.status === 'LOBBY') {
      room.players = room.players.filter(p => p.id !== player.id);
      room.bunkerCapacity = calculateBunkerCapacity(room.players.length);
    } else if (player.isAlive && room.status !== 'GAME_OVER') {
      player.isAlive = false;
      this.addSystemMessage(room, {
        ru: `🚪 ${player.name} покинул бункер и вышел в главное меню.`,
        en: `🚪 ${player.name} left the bunker and returned to main menu.`,
        uz: `🚪 ${player.name} bunkerni tark etib asosiy menyuga chiqdi.`
      });
    }

    // Если в комнате больше не осталось живых подключенных людей — закрываем комнату и очищаем таймеры
    const connectedHumans = room.players.filter(p => !p.isBot && p.socketId && !p.hasLeft);
    if (connectedHumans.length === 0) {
      this.clearRoomTimer(room.code);
      this.rooms.delete(room.code);
      if (this.io) {
        this.io.emit('publicRoomsUpdated', this.getPublicLobbyRooms());
      }
      return;
    }

    // Если вышел хост — передаем права хоста следующему человеку в комнате
    if (room.hostId === player.id) {
      room.players.forEach(p => { p.isHost = false; });
      const newHost = connectedHumans[0];
      newHost.isHost = true;
      room.hostId = newHost.id;
    }

    this.broadcastRoom(room.code);
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

    if (room.currentRound === 1) {
      this.addSystemMessage(room, {
        ru: `💼 РАУНД 1: ПО ПРАВИЛАМ БУНКЕРА ПЕРВЫМ ВСЕГДА ОТКРЫВАЕТСЯ КАРТА «ПРОФЕССИЯ»! Каждому дается 1 минута.`,
        en: `💼 ROUND 1: BY BUNKER RULES, THE "PROFESSION" CARD IS ALWAYS REVEALED FIRST! Each player has 60 seconds.`,
        uz: `💼 1-RAUND: BUNKER QOIDALARIGA KO'RA BIRINCHI BO'LIB HAR DOIM "KASB" KARTASI OCHILADI! Har biriga 1 daqiqa beriladi.`
      });
    } else {
      this.addSystemMessage(room, {
        ru: `НАЧИНАЕТСЯ ПООЧЕРЕДНОЕ ВСКРЫТИЕ КАРТ РАУНДА ${room.currentRound}! Каждому дается ровно 1 минута на выбор.`,
        en: `SEQUENTIAL CARD REVEAL BEGINS FOR ROUND ${room.currentRound}! Each player has 60 seconds to choose.`,
        uz: `${room.currentRound}-RAUND UCHUN NAVBAT BILAN KARTALARNI OCHISH BOSHLANDI! Har biriga 1 daqiqa beriladi.`
      });
    }
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
      ru: `🔔 Очередь хода: ${currentPlayer.name}! У вас есть 60 секунд, чтобы показать карту${room.currentRound === 1 ? ' ПРОФЕССИИ' : ''}.`,
      en: `🔔 Current turn: ${currentPlayer.name}! You have 60 seconds to reveal ${room.currentRound === 1 ? 'your PROFESSION card' : 'a card'}.`,
      uz: `🔔 Navbat: ${currentPlayer.name}! ${room.currentRound === 1 ? 'KASB kartasini' : 'Kartani'} ochish uchun sizda 60 soniya bor.`
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
      // В 1-м раунде ВСЕГДА первым открывается Профессия!
      const profCard = unrevealed.find(c => c.id === 'profession' || c.type === 'profession');
      // В остальных раундах сначала открываем обычные характеристики, а козырь — в последнюю очередь
      const regularUnrevealed = unrevealed.filter(c => c.type !== 'special');
      const pool = regularUnrevealed.length > 0 ? regularUnrevealed : unrevealed;
      const chosen = (room.currentRound === 1 && profCard)
        ? profCard
        : pool[Math.floor(Math.random() * pool.length)];
      chosen.revealed = true;
      chosen.revealedInRound = room.currentRound;
      bot.revealedCardId = chosen.id;

      // Если бот открыл козырь — активируем его способность!
      if (chosen.type === 'special' && !chosen.used) {
        chosen.used = true;
        if (chosen.ability === 'immunity' || chosen.ability === 'bodyguard') {
          bot.hasImmunityThisRound = true;
        } else if (chosen.ability === 'double_vote') {
          bot.voteWeight = 2;
        }
      }

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
        const profCard = unrevealed.find(c => c.id === 'profession' || c.type === 'profession');
        const randomCard = (room.currentRound === 1 && profCard)
          ? profCard
          : unrevealed[Math.floor(Math.random() * unrevealed.length)];
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
          ru: `⏱️ Время 1 минута истекло! У ${player.name} открыта карта: [${nameRu}] — "${valRu}"`,
          en: `⏱️ 1 minute expired! A card was revealed for ${player.name}: [${nameEn}] — "${valEn}"`,
          uz: `⏱️ 1 daqiqa vaqt tugadi! ${player.name} uchun karta ochildi: [${nameUz}] — "${valUz}"`
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

    // В 1-м раунде ВСЕГДА первым открывается Профессия!
    const profCard = currentPlayer.deck.find(c => (c.id === 'profession' || c.type === 'profession') && !c.revealed);
    const card = (room.currentRound === 1 && profCard)
      ? profCard
      : currentPlayer.deck.find(c => c.id === cardId);
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
    room.players.forEach(p => { p.votedFor = null; });

    this.addSystemMessage(room, {
      ru: `📢 ВСЕ КАРТЫ ВСКРЫТЫ! Любой игрок уже сейчас может голосовать на карточках игроков или открыть окно голосования (не нужно ждать создателя комнаты)!`,
      en: `📢 ALL CARDS REVEALED! Any player can vote right now on player cards or open the voting window (no need to wait for the room host)!`,
      uz: `📢 BARCHA KARTALAR OCHILDI! Har bir o'yinchi xona yaratuvchisini kutmasdan hoziroq ovoz berishi mumkin!`
    });

    this.broadcastRoom(room.code);

    // Если все оставшиеся в живых игроки — боты (а человек стал Призраком 👻), автоматически переходим к голосованию через 3 секунды!
    const aliveHumans = room.players.filter(p => p.isAlive && !p.isBot && !p.hasLeft);
    if (aliveHumans.length === 0) {
      this.setRoomTimer(room.code, 3000, () => {
        this.startVotingPhase(room.code, room.hostId);
      });
      return;
    }

    // Таймер на 20 минут: по истечении выбывает набравший больше голосов или случайный игрок!
    this.setRoomTimer(room.code, 20 * 60 * 1000, () => {
      this.handleRoundTimeout(room.code);
    });

    // Запускаем реалистичное поведение ботов: они думают, обсуждают новые карты в чате и голосуют по очереди!
    this.scheduleRealisticBotVotes(room);
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
    if (!room || (room.status !== 'ROUND_DISCUSSION' && room.status !== 'ROUND_VOTING')) return;
    if (room.status === 'ROUND_VOTING') {
      this.broadcastRoom(code);
      return;
    }

    room.status = 'ROUND_VOTING';
    // НЕ сбрасываем голоса тех, кто уже проголосовал во время обсуждения!
    this.addSystemMessage(room, {
      ru: `🗳️ Голосование активно для всех! По окончании голосования всем будет открыта полная таблица — кто против кого голосовал!`,
      en: `🗳️ Voting is active for everyone! Once finished, everyone will see the full table of who voted against whom!`,
      uz: `🗳️ Ovoz berish barcha uchun faol! Yakunda kim kimga qarshi ovoz bergani barchaga ochiq ko'rsatiladi!`
    });

    this.broadcastRoom(code);

    // Если какие-то боты еще думают — пусть завершат голосование в реалистичном темпе
    const unvotedBots = room.players.filter(p => p.isBot && p.isAlive && !p.votedFor);
    if (unvotedBots.length > 0 && !this.botTimers.has(code)) {
      this.scheduleRealisticBotVotes(room, true);
    }

    // Если все живые игроки уже проголосовали (например, человек — Призрак 👻, а живы только боты), сразу подводим итоги!
    const alivePlayers = room.players.filter(p => p.isAlive && !p.hasLeft);
    if (alivePlayers.length > 0 && alivePlayers.every(p => p.votedFor !== null)) {
      this.setRoomTimer(code, 1200, () => {
        this.resolveVoting(room, false);
      });
    }
  }

  // Детальная оценка одной открытой карты (положительное число = опасная/слабая карта, отрицательное = полезная для бункера)
  evaluateSingleCardRisk(card) {
    if (!card) return 0;
    const val = `${card.value?.ru || card.value || ''} ${card.description?.ru || card.description || ''}`.toLowerCase();

    if (card.type === 'age') {
      const ageNum = parseInt(val, 10);
      if (!isNaN(ageNum)) {
        if (ageNum >= 65) return 32;
        if (ageNum >= 52) return 18;
        if (ageNum >= 40) return 6;
        if (ageNum <= 32) return -12;
      }
      return 4;
    }

    if (card.type === 'health') {
      if (val.includes('идеальн') || val.includes('100%') || val.includes('полностью здоров') || val.includes('иммунитет') || val.includes('космонавт') || val.includes('богатыр') || val.includes('вынослив')) {
        return -22;
      }
      if (val.includes('зараз') || val.includes('вирус') || val.includes('инфекц') || val.includes('туберкулез') || val.includes('чума') || val.includes('радиац') || val.includes('мутац') || val.includes('смертельн') || val.includes('неизлечим') || val.includes('шизофрен') || val.includes('психоз')) {
        return 36;
      }
      if (val.includes('астма') || val.includes('диабет') || val.includes('слепот') || val.includes('глухот') || val.includes('паралич') || val.includes('сердц') || val.includes('эпилепс') || val.includes('аллерг') || val.includes('перелом') || val.includes('рана')) {
        return 24;
      }
      return 14;
    }

    if (card.type === 'profession') {
      if (val.includes('хирург') || val.includes('врач') || val.includes('медик') || val.includes('инженер') || val.includes('агроном') || val.includes('биолог') || val.includes('спецназ') || val.includes('военн') || val.includes('электрик') || val.includes('механик') || val.includes('химик') || val.includes('фармацевт') || val.includes('спасател') || val.includes('строител')) {
        return -24;
      }
      if (val.includes('блогер') || val.includes('тикток') || val.includes('астролог') || val.includes('таролог') || val.includes('безработн') || val.includes('мошенник') || val.includes('вор') || val.includes('критик') || val.includes('стример') || val.includes('мим') || val.includes('клоун')) {
        return 28;
      }
      return 8;
    }

    if (card.type === 'luggage') {
      if (val.includes('аптечк') || val.includes('генератор') || val.includes('оружи') || val.includes('автомат') || val.includes('пистолет') || val.includes('семена') || val.includes('вода') || val.includes('фильтр') || val.includes('инструмент') || val.includes('раци') || val.includes('антибиотик') || val.includes('противогаз') || val.includes('патрон') || val.includes('консерв')) {
        return -18;
      }
      if (val.includes('пуст') || val.includes('сломан') || val.includes('бесполезн') || val.includes('плюшев') || val.includes('косметик') || val.includes('фантик') || val.includes('мусор') || val.includes('бомб') || val.includes('яд') || val.includes('вирус')) {
        return 24;
      }
      return 6;
    }

    if (card.type === 'hobby') {
      if (val.includes('выживан') || val.includes('охот') || val.includes('стрельб') || val.includes('медицин') || val.includes('радио') || val.includes('ремонт') || val.includes('садовод') || val.includes('боевые') || val.includes('кулинар') || val.includes('шитье') || val.includes('хими')) {
        return -14;
      }
      if (val.includes('азарт') || val.includes('казино') || val.includes('сплетн') || val.includes('сериал') || val.includes('сон') || val.includes('коллекционир') || val.includes('игр')) {
        return 18;
      }
      return 5;
    }

    if (card.type === 'fact') {
      if (val.includes('спас') || val.includes('герой') || val.includes('построил') || val.includes('выжил') || val.includes('награжден') || val.includes('изобрел') || val.includes('лидер')) {
        return -14;
      }
      if (val.includes('тюрьм') || val.includes('судим') || val.includes('предал') || val.includes('украл') || val.includes('фоби') || val.includes('боится') || val.includes('паник') || val.includes('убил') || val.includes('поджег') || val.includes('обман')) {
        return 26;
      }
      return 8;
    }

    return 4;
  }

  // Индивидуальная оценка кандидата конкретным ботом (каждый бот думает сам, учитывая карту текущего раунда, память и самозащиту!)
  evaluateCandidateForBot(room, bot, candidate, botIdx = 0) {
    let score = 15;
    const revealed = (candidate.deck || []).filter(c => c.revealed);

    if (revealed.length === 0) {
      score += 20;
    }

    // Личный характер бота (чтобы разные боты обращали внимание на разные слабые стороны!)
    const focusTypes = ['health', 'profession', 'luggage', 'fact', 'age', 'hobby'];
    const botFocusType = focusTypes[botIdx % focusTypes.length];

    revealed.forEach(card => {
      const cardRisk = this.evaluateSingleCardRisk(card);
      // Карта, открытая ИМЕННО В ЭТОМ РАУНДЕ, имеет решающий вес (x2.4), чтобы боты реагировали на новые открытия!
      const isCurrentRoundCard = card.revealedInRound === room.currentRound;
      const roundMultiplier = isCurrentRoundCard ? 2.4 : 0.75;
      // Если эта категория совпадает с "характером" бота — еще x1.35 внимания
      const personalityMultiplier = card.type === botFocusType ? 1.35 : 1.0;

      score += cardRisk * roundMultiplier * personalityMultiplier;
    });

    // 1. ЗАЩИТА ОТ ПОВТОРОВ: если бот голосовал против этого игрока в прошлом раунде и тот выжил — бот переключается на других кандидатов!
    if (bot.lastRoundVotedFor && bot.lastRoundVotedFor === candidate.id) {
      score -= 38;
    }

    // 2. САМОЗАЩИТА / ОТВЕТНЫЙ ГОЛОС: если этот кандидат голосовал против этого бота в прошлом раунде (или прямо сейчас голосует против него!)
    if (Array.isArray(bot.lastVotedAgainstBy) && bot.lastVotedAgainstBy.includes(candidate.id)) {
      score += 22;
    }
    if (candidate.votedFor === bot.id) {
      score += 25;
    }

    // 3. Не тратим голос впустую на игрока с открытым иммунитетом в этом раунде
    if (candidate.hasImmunityThisRound) {
      score -= 60;
    }

    // 4. Независимое "человеческое мнение" конкретного бота
    score += (Math.random() * 26) - 10;

    return score;
  }

  // Выбор цели для одного конкретного бота
  chooseTargetForSingleBot(room, bot, botIdx = 0) {
    let aliveTargets = room.players.filter(p => p.isAlive && !p.hasLeft && p.id !== bot.id);
    if (aliveTargets.length === 0) return null;
    if (aliveTargets.length === 1) return aliveTargets[0];

    // Если сейчас идет переголосование после НИЧЬЕЙ (+5 минут) и есть список спорных кандидатов — боты выбирают среди них, чтобы разрешить спор!
    if (room.isExtraTime && Array.isArray(room.tiedCandidateIds) && room.tiedCandidateIds.length > 1) {
      const tiedTargets = aliveTargets.filter(p => room.tiedCandidateIds.includes(p.id));
      if (tiedTargets.length > 0) {
        aliveTargets = tiedTargets;
      }
    }

    // Считаем личный рейтинг подозрительности от лица ЭТОГО бота
    const scored = aliveTargets.map(t => ({
      player: t,
      score: this.evaluateCandidateForBot(room, bot, t, botIdx)
    })).sort((a, b) => b.score - a.score);

    const top1 = scored[0].player;
    const top2 = scored[1]?.player || top1;

    // При переголосовании после ничьей боты голосуют более решительно, чтобы выявить одного проигравшего
    if (room.isExtraTime) {
      return Math.random() < 0.8 ? top1 : top2;
    }

    const pickSecond = (botIdx % 3 === 1) || (Math.random() < 0.28);
    return pickSecond ? top2 : top1;
  }

  // Живое, поэтапное голосование ботов с аргументами в чате (как реальные люди!)
  scheduleRealisticBotVotes(room, fastMode = false) {
    if (!room) return;
    this.clearBotTimers(room.code);

    const bots = room.players.filter(p => p.isBot && p.isAlive && !p.votedFor);
    if (bots.length === 0) return;

    const handles = [];
    // Случайно перемешиваем порядок ботов в каждом раунде, чтобы они никогда не ходили в одном и том же порядке!
    const shuffledBots = [...bots].sort(() => Math.random() - 0.5);

    shuffledBots.forEach((bot, orderIdx) => {
      // Реалистичная задержка: от 2.2 сек до 8.5 сек (или быстрее, если запущено ускоренное голосование)
      const baseDelay = fastMode
        ? 900 + orderIdx * 800 + Math.floor(Math.random() * 500)
        : 2400 + orderIdx * 2100 + Math.floor(Math.random() * 1200);

      const handle = setTimeout(() => {
        const currentRoom = this.rooms.get(room.code);
        if (!currentRoom) return;
        if (currentRoom.status !== 'ROUND_DISCUSSION' && currentRoom.status !== 'ROUND_VOTING') return;
        if (!bot.isAlive || bot.votedFor) return;

        const target = this.chooseTargetForSingleBot(currentRoom, bot, orderIdx);
        if (!target) return;

        bot.votedFor = target.id;

        // В каждом раунде 1-2 бота пишут живой комментарий в чат, объясняя свой голос по открытой карте!
        if (orderIdx === 0 || (orderIdx === 2 && Math.random() < 0.65)) {
          const currentRoundCard = (target.deck || []).find(c => c.revealed && c.revealedInRound === currentRoom.currentRound)
            || (target.deck || []).find(c => c.revealed);
          const cardValRu = currentRoundCard ? (currentRoundCard.value?.ru || currentRoundCard.value) : '';
          const cardValEn = currentRoundCard ? (currentRoundCard.value?.en || cardValRu) : '';
          const cardValUz = currentRoundCard ? (currentRoundCard.value?.uz || cardValRu) : '';

          const phrasesRu = [
            `Хм, у ${target.name} открылась карта «${cardValRu}» — для бункера это слабовато. Голосую против ${target.name}.`,
            `В этом раунде больше всего сомнений вызывает ${target.name} (${cardValRu}). Мой голос против него.`,
            `Я проанализировал открытые карты этого раунда: голосую против ${target.name}.`
          ];
          const phrasesEn = [
            `Hmm, ${target.name} revealed "${cardValEn}" — looks risky for the bunker. Voting against ${target.name}.`,
            `In this round ${target.name} (${cardValEn}) raises the most doubts. My vote goes to them.`,
            `Looking at this round's cards, I'm voting against ${target.name}.`
          ];
          const phrasesUz = [
            `Hmm, ${target.name}da «${cardValUz}» kartasi ochildi — bunker uchun xavfli. ${target.name}ga qarshi ovoz beraman.`,
            `Bu raundda ${target.name} (${cardValUz}) eng ko'p shubha uyg'otdi. Ovozni unga qarshi beraman.`,
            `Ushbu raundda ochilgan kartalarga qarab, ${target.name}ga qarshi ovoz beraman.`
          ];
          const pIdx = (currentRoom.currentRound + orderIdx) % phrasesRu.length;

          currentRoom.messages.push({
            id: 'msg_bot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            senderId: bot.id,
            senderName: bot.name,
            senderAvatar: bot.character?.avatar || '🤖',
            text: {
              ru: phrasesRu[pIdx],
              en: phrasesEn[pIdx],
              uz: phrasesUz[pIdx]
            },
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSystem: false,
            isGhost: false
          });
        }

        // Проверяем: если ВСЕ живые игроки (и люди, и боты) уже отдали свои голоса — завершаем голосование!
        const alivePlayers = currentRoom.players.filter(p => p.isAlive && !p.hasLeft);
        const allVoted = alivePlayers.length > 0 && alivePlayers.every(p => p.votedFor !== null);

        if (allVoted) {
          currentRoom.status = 'ROUND_VOTING';
          this.resolveVoting(currentRoom, false);
        } else {
          this.broadcastRoom(currentRoom.code);
        }
      }, baseDelay);

      handles.push(handle);
    });

    this.botTimers.set(room.code, handles);
  }

  handleBotVotes(room) {
    const bots = room.players.filter(p => p.isBot && p.isAlive);
    if (bots.length === 0) return;

    bots.forEach((bot, idx) => {
      if (bot.votedFor) return;
      const chosen = this.chooseTargetForSingleBot(room, bot, idx);
      if (chosen) {
        bot.votedFor = chosen.id;
      }
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

    // Проверяем всех живых реальных людей (которые не покинули игру)
    const aliveHumans = room.players.filter(p => p.isAlive && !p.isBot && !p.hasLeft);
    const allHumansVoted = aliveHumans.length > 0 && aliveHumans.every(p => p.votedFor !== null);

    const alivePlayers = room.players.filter(p => p.isAlive && !p.hasLeft);
    const allVoted = alivePlayers.every(p => p.votedFor !== null);

    if (allVoted) {
      room.status = 'ROUND_VOTING';
      this.resolveVoting(room, false);
    } else if (allHumansVoted) {
      // Все живые люди уже проголосовали! Если какие-то боты еще "думают", ускоряем оставшихся ботов (по очереди через 0.7 сек), чтобы не ждать долго
      this.broadcastRoom(code);
      this.scheduleRealisticBotVotes(room, true);
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

      targetCard.revealed = true; // Обновленная карта видна на досье, но в чате НЕ пишется, какая именно карта была изменена и какой она была!
      specialCard.used = true;
      specialCard.revealed = true;

      this.addSystemMessage(room, {
        ru: `⚡ [КОЗЫРЬ]: ${player.name} использовал свой Козырь!`,
        en: `⚡ [TRUMP]: ${player.name} used their Trump card!`,
        uz: `⚡ [KOZIR]: ${player.name} o'z Koziridan foydalandi!`
      });
      this.broadcastRoom(code);
      return { success: true, message: `Козырь применен! Карта [${cardTitle}] обновлена без оглашения в чате!` };
    }

    // 2. ДИПЛОМАТИЧЕСКИЙ ИММУНИТЕТ НА ТЕКУЩИЙ РАУНД
    if (ability === 'immunity') {
      player.hasImmunityThisRound = true;
      specialCard.used = true;
      specialCard.revealed = true;
      this.addSystemMessage(room, {
        ru: `⚡ [КОЗЫРЬ]: ${player.name} использовал свой Козырь!`,
        en: `⚡ [TRUMP]: ${player.name} used their Trump card!`,
        uz: `⚡ [KOZIR]: ${player.name} o'z Koziridan foydalandi!`
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
        ru: `⚡ [КОЗЫРЬ]: ${player.name} использовал свой Козырь!`,
        en: `⚡ [TRUMP]: ${player.name} used their Trump card!`,
        uz: `⚡ [KOZIR]: ${player.name} o'z Koziridan foydalandi!`
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
        ru: `⚡ [КОЗЫРЬ]: ${player.name} использовал свой Козырь!`,
        en: `⚡ [TRUMP]: ${player.name} used their Trump card!`,
        uz: `⚡ [KOZIR]: ${player.name} o'z Koziridan foydalandi!`
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
        ru: `⚡ [КОЗЫРЬ]: ${player.name} использовал свой Козырь!`,
        en: `⚡ [TRUMP]: ${player.name} used their Trump card!`,
        uz: `⚡ [KOZIR]: ${player.name} o'z Koziridan foydalandi!`
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
        ru: `⚡ [КОЗЫРЬ]: ${player.name} использовал свой Козырь!`,
        en: `⚡ [TRUMP]: ${player.name} used their Trump card!`,
        uz: `⚡ [KOZIR]: ${player.name} o'z Koziridan foydalandi!`
      });
      this.broadcastRoom(code);
      return { success: true, message: `Игрок ${targetPlayer.name} под вашей защитой!` };
    }

    // 7. ПЕРЕГОЛОСОВАНИЕ
    if (ability === 'revote') {
      room.players.forEach(p => {
        if (p.votedFor) p.lastRoundVotedFor = p.votedFor;
        p.votedFor = null;
      });
      specialCard.used = true;
      specialCard.revealed = true;
      this.addSystemMessage(room, {
        ru: `🔄 [КОЗЫРЬ]: ${player.name} потребовал немедленное ПЕРЕГОЛОСОВАНИЕ! Все голоса сброшены.`,
        en: `🔄 [TRUMP]: ${player.name} ordered an immediate REVOTE! All votes cleared.`,
        uz: `🔄 [KOZIR]: ${player.name} darhol QAYTA OVOZ BERISHNI talab qildi! Barcha ovozlar bekor qilindi.`
      });
      this.broadcastRoom(code);
      this.scheduleRealisticBotVotes(room);
      return { success: true, message: "Голоса сброшены, голосуйте заново!" };
    }

    return { error: "Неизвестная способность" };
  }

  resolveVoting(room, isTimeout = false) {
    this.clearRoomTimer(room.code);

    // Если кто-то из живых ботов еще не проголосовал — боты отдают голоса перед подсчетом!
    this.handleBotVotes(room);

    const alivePlayers = room.players.filter(p => p.isAlive);

    // Сохраняем память ботов и игроков о том, кто против кого голосовал в этом голосовании (чтобы в следующем раунде не повторяться и помнить атакующих!)
    alivePlayers.forEach(p => {
      p.lastVotedAgainstBy = alivePlayers.filter(v => v.votedFor === p.id).map(v => v.id);
      if (p.votedFor) {
        p.lastRoundVotedFor = p.votedFor;
      }
    });

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

    // НИЧЬЯ (равенство голосов) — если кандидатов несколько или никто не проголосовал:
    // ВСЕГДА добавляем +5 МИНУТ дополнительного времени до тех пор, пока НЕ БУДЕТ ВЫБРАН СТРОГО ОДИН ИГРОК!
    const isTie = !room.vetoActive && (candidatesToExile.length !== 1 || maxVotes <= 0 || totalVotesCast === 0);

    if (isTie) {
      // Бесконечное дополнительное время по +5 МИНУТ до тех пор, пока голосованием не выберут строго 1 игрока!
      room.isExtraTime = true;
      room.tieCount = (room.tieCount || 0) + 1;
      room.tiedCandidateIds = candidatesToExile.length > 1 ? candidatesToExile : alivePlayers.map(p => p.id);
      room.timerType = 'EXTRA_TIME';
      room.timerExpiresAt = Date.now() + 5 * 60 * 1000;
      room.status = 'ROUND_DISCUSSION';
      room.lastTieBreakdown = voteBreakdown;
      // Сбрасываем голоса для повторного голосования
      alivePlayers.forEach(p => { p.votedFor = null; });

      const tiedNames = (candidatesToExile.length > 1 ? candidatesToExile : alivePlayers.map(p => p.id))
        .map(id => room.players.find(p => p.id === id)?.name)
        .filter(Boolean)
        .join(' vs ');

      this.addSystemMessage(room, {
        ru: `⚖️ НИЧЬЯ В ГОЛОСОВАНИИ #${room.tieCount} (${tiedNames} — по ${Math.max(0, maxVotes)} гол.)! Добавлено еще +5 МИНУТ для переголосования. Голосование продолжается, пока не выберут строго одного кандидата!`,
        en: `⚖️ TIE IN VOTING #${room.tieCount} (${tiedNames} — ${Math.max(0, maxVotes)} votes each)! +5 MINUTES added for revoting until strictly one player is chosen!`,
        uz: `⚖️ OVOZLAR TENG KELDI #${room.tieCount} (${tiedNames} — ${Math.max(0, maxVotes)} tadan ovoz)! Aniq 1 ta o'yinchi tanlanguncha qayta ovoz berish uchun yana +5 DAQIQA qo'shildi!`
      });

      this.setRoomTimer(room.code, 5 * 60 * 1000, () => {
        this.resolveVoting(room, true);
      });

      this.broadcastRoom(room.code);
      this.scheduleRealisticBotVotes(room);
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
    } else if (totalVotesCast > 0 && maxVotes > 0 && candidatesToExile.length === 1) {
      // Строго один выбранный большинством кандидат на изгнание
      const exiledId = candidatesToExile[0];
      const candidate = room.players.find(p => p.id === exiledId);

      if (candidate && candidate.hasImmunityThisRound) {
        this.addSystemMessage(room, {
          ru: `🛡️ ИММУНИТЕТ! ${candidate.name} набрал большинство голосов (${maxVotes}), но защищен ИММУНИТЕТОМ! Он остается в бункере.`,
          en: `🛡️ IMMUNITY! ${candidate.name} got majority votes (${maxVotes}), but is shielded by IMMUNITY! They stay in the bunker.`,
          uz: `🛡️ DAXLSIZLIK! ${candidate.name} eng ko'p ovoz oldi (${maxVotes}), lekin DAXLSIZLIK bilan himoyalangan! U bunkerda qoladi.`
        });
        candidate.hasImmunityThisRound = false;
      } else if (candidate) {
        exiledPlayer = candidate;
        exiledPlayer.isAlive = false;
        
        const extraNote = room.isExtraTime ? ' [ПО ИТОГАМ ДОП. ВРЕМЕНИ]' : '';
        this.addSystemMessage(room, {
          ru: `РЕШЕНИЕМ БОЛЬШИНСТВА (${maxVotes} голосов)${extraNote}: ${exiledPlayer.name} ИЗГНАН ИЗ БУНКЕРА! Теперь он Призрак 👻.`,
          en: `BY MAJORITY VOTE (${maxVotes} votes)${extraNote}: ${exiledPlayer.name} HAS BEEN EXILED FROM THE BUNKER! Now a Ghost 👻.`,
          uz: `KO'PCHILIK OVOZI BILAN (${maxVotes} ovoz)${extraNote}: ${exiledPlayer.name} BUNKERDAN HAYDALDI! Endi u Arvoh 👻.`
        });
      }
    }

    const wasExtraTime = Boolean(room.isExtraTime);
    room.isExtraTime = false;
    room.tieCount = 0;
    room.tiedCandidateIds = [];
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

    // Проверяем: осталось ли выживших <= bunkerCapacity человек или завершен 7 раунд?
    const remainingAlive = room.players.filter(p => p.isAlive);
    const capacity = room.bunkerCapacity || calculateBunkerCapacity(room.players.length);
    if (remainingAlive.length <= capacity || room.currentRound >= 7) {
      this.setRoomTimer(room.code, 3500, () => {
        this.endGame(room);
      });
    } else {
      // Если человек стал Призраком 👻 и в живых остались только боты — автоматически запускаем следующий раунд через 4 секунды!
      const aliveHumans = remainingAlive.filter(p => !p.isBot && !p.hasLeft);
      if (aliveHumans.length === 0) {
        this.setRoomTimer(room.code, 4000, () => {
          this.nextRoundOrEnd(room.code, room.hostId);
        });
      }
    }

    this.broadcastRoom(room.code);
  }

  nextRoundOrEnd(code, requesterId) {
    const room = this.rooms.get(code);
    if (!room || room.status !== 'ROUND_RESULT') return;

    this.clearRoomTimer(code);
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
    if (!room || room.status === 'GAME_OVER') return;
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

    this.clearRoomTimer(code);
    room.status = 'LOBBY';
    room.currentRound = 1;
    room.timerExpiresAt = null;
    room.activeTurnPlayerId = null;
    // Оставляем только подключенных игроков и ботов (удаляем тех, кто уже вышел в главное меню)
    room.players = room.players.filter(p => p.isBot || !p.hasLeft);
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
            // Секретность Козыря: другие живые игроки НИКОГДА не видят, какой именно Козырь был у игрока и какую карту он изменил!
            if (card.type === 'special' && !isSelf && !isGameOver && !isSpectatorOrGhost) {
              if (card.used || card.revealed) {
                return {
                  id: card.id,
                  type: card.type,
                  name: card.name,
                  icon: card.icon,
                  revealed: true,
                  used: Boolean(card.used),
                  value: {
                    ru: '⚡ Козырь использован',
                    en: '⚡ Trump Card Used',
                    uz: '⚡ Kozir ishlatildi'
                  },
                  description: {
                    ru: 'Игрок тайно применил свой козырь (эффект засекречен)',
                    en: 'Player secretly activated their trump card (effect classified)',
                    uz: "O'yinchi o'z kozirini maxfiy ishlatdi (ta'siri sir saqlanadi)"
                  }
                };
              }
            }

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

    if (this.io) {
      this.io.emit('publicRoomsUpdated', this.getPublicLobbyRooms());
    }
  }

  getPublicLobbyRooms() {
    const publicRooms = [];
    for (const [code, room] of this.rooms.entries()) {
      const host = room.players.find(p => p.id === room.hostId) || room.players[0];
      publicRooms.push({
        code: room.code,
        status: room.status,
        hostName: host ? host.name : 'Командир',
        hostAvatar: host?.character?.avatar || '🥷',
        totalPlayers: room.players.length,
        maxPlayers: 12,
        bunkerCapacity: room.bunkerCapacity || calculateBunkerCapacity(room.players.length),
        disasterTitle: room.disaster ? room.disaster.title : null,
        canJoin: room.status === 'LOBBY' && room.players.length < 12
      });
    }
    return publicRooms;
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
