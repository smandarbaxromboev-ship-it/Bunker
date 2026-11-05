// Game Manager for "Бункер: 7 Раундов Откровений"
// Sequential Turn-Based Card Reveals (60s each with auto-pick)
// 20-Minute Round Discussion & Voting (with auto-exile on timeout)
const { generateDecksForPlayers } = require('./cardGenerator');

const DISASTERS = [
  {
    title: { ru: "Ядерный взрыв", en: "Nuclear Fallout", uz: "Yadroviy portlash" },
    desc: { 
      ru: "Высокая радиация на поверхности. В живых останутся только те двое, кто займет места в бункере.",
      en: "Extreme radiation above. Only the two survivors inside the bunker will make it.",
      uz: "Tashqarida o'ta yuqori radiatsiya. Faqat bunkerga kirgan 2 kishi tirik qoladi."
    }
  },
  {
    title: { ru: "Смертельный вирус", en: "Deadly Virus Outbreak", uz: "O'limli virus epidemiyasi" },
    desc: { 
      ru: "Планета заражена мутагеном. В бункере стерильный воздух и ровно 2 спальных места.",
      en: "Air is contaminated with mutagen. The bunker has clean air for exactly 2 people.",
      uz: "Havo zaharli virus bilan to'lgan. Bunkerda faqat 2 kishi uchun joy bor."
    }
  },
  {
    title: { ru: "Ледниковый период", en: "Ice Age -70°C", uz: "Muzlik davri -70°C" },
    desc: { 
      ru: "Температура снаружи упала до -70°C. Теплогенератор бункера рассчитан ровно на 2 выживших.",
      en: "Temperature outside dropped to -70°C. Shelter heater can support exactly 2 people.",
      uz: "Tashqarida havo harorati -70°C ga tushdi. Isitgich faqat 2 kishini isita oladi."
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

  createRoom(hostPlayerName, socketId) {
    const code = this.generateRoomCode();
    const playerId = 'p_' + Math.random().toString(36).substring(2, 9);
    const disaster = DISASTERS[Math.floor(Math.random() * DISASTERS.length)];

    const room = {
      code,
      hostId: playerId,
      status: 'LOBBY',
      currentRound: 1,
      maxRounds: 7,
      disaster,
      bunkerCapacity: 2, // Строго 2 выигрышных места!
      createdAt: Date.now(),
      timerExpiresAt: null,
      timerDuration: null,
      timerType: null,
      activeTurnPlayerId: null,
      currentRevealingPlayerIndex: 0,
      players: [
        {
          id: playerId,
          name: hostPlayerName.trim().substring(0, 20) || 'Командир',
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
            ru: `Комната #${code} готова. Ожидание игроков (мест в бункере ровно 2!).`,
            en: `Room #${code} is ready. Waiting for players (exactly 2 bunker spots!).`,
            uz: `#${code} xona tayyor. O'yinchilar kutilmoqda (bunkerda roppa-rosa 2 ta joy!).`
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

  joinRoom(code, playerName, socketId) {
    const room = this.rooms.get(code);
    if (!room) {
      return { error: 'Комната с таким цифровым кодом не найдена.' };
    }

    if (room.status !== 'LOBBY') {
      return { error: 'Игра в этом бункере уже началась!' };
    }

    if (room.players.length >= 10) {
      return { error: 'Бункер переполнен (максимум 10 человек).' };
    }

    const playerId = 'p_' + Math.random().toString(36).substring(2, 9);
    const newPlayer = {
      id: playerId,
      name: playerName.trim().substring(0, 20) || `Игрок_${room.players.length + 1}`,
      socketId,
      isHost: false,
      isAlive: true,
      isBot: false,
      deck: [],
      revealedCardId: null,
      votedFor: null
    };

    room.players.push(newPlayer);
    this.addSystemMessage(room, {
      ru: `Игрок ${newPlayer.name} подключился к комнате.`,
      en: `Player ${newPlayer.name} connected to the room.`,
      uz: `${newPlayer.name} xonaga qo'shildi.`
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

  addBot(code, requesterId) {
    const room = this.rooms.get(code);
    if (!room || room.status !== 'LOBBY') return;
    if (room.hostId !== requesterId) return;
    if (room.players.length >= 10) return;

    const botNames = [
      'Алексей', 'Дмитрий', 'Марина', 'Сардор',
      'Елена', 'Тимур', 'Анна', 'Рустам',
      'Ольга', 'Жасур'
    ];
    const availableNames = botNames.filter(name => !room.players.some(p => p.name === name));
    const botName = availableNames[0] || `Бот_${room.players.length + 1}`;

    const botId = 'bot_' + Math.random().toString(36).substring(2, 9);
    room.players.push({
      id: botId,
      name: botName,
      socketId: null,
      isHost: false,
      isAlive: true,
      isBot: true,
      deck: [],
      revealedCardId: null,
      votedFor: null
    });

    this.addSystemMessage(room, {
      ru: `Бот ${botName} вошел в лобби.`,
      en: `Bot ${botName} joined the lobby.`,
      uz: `${botName} boti lobbiga kirdi.`
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
      this.addSystemMessage(room, {
        ru: `Бот ${removed.name} удален из комнаты.`,
        en: `Bot ${removed.name} removed from the room.`,
        uz: `${removed.name} boti xonadan o'chirildi.`
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

    room.currentRound = 1;
    room.bunkerCapacity = 2; // Строго 2 выигрышных места!

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

    this.addSystemMessage(room, {
      ru: `ИГРА НАЧАЛАСЬ! Раунд 1 из 7. В бункере спасутся ровно 2 человека.`,
      en: `GAME STARTED! Round 1 of 7. Exactly 2 people will survive in the bunker.`,
      uz: `O'YIN BOSHLANDI! 7 raunddan 1-raund. Bunkerda roppa-rosa 2 kishi saqlanib qoladi.`
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
      ru: `Началось Тайное голосование! Призраки видят все голоса в реальном времени.`,
      en: `Secret voting has begun! Ghosts see all votes in real-time.`,
      uz: `Yashirin ovoz berish boshlandi! Arvohlar barcha ovozlarni jonli ko'radi.`
    });

    this.handleBotVotes(room);
    this.broadcastRoom(code);
  }

  handleBotVotes(room) {
    const bots = room.players.filter(p => p.isBot && p.isAlive);
    const aliveTargets = room.players.filter(p => p.isAlive);

    bots.forEach(bot => {
      const possibleTargets = aliveTargets.filter(p => p.id !== bot.id);
      if (possibleTargets.length > 0) {
        const target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
        bot.votedFor = target.id;
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

    const alivePlayers = room.players.filter(p => p.isAlive);
    const allVoted = alivePlayers.every(p => p.votedFor !== null);

    if (allVoted && room.status === 'ROUND_VOTING') {
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

    // 1. ПЕРЕПИСЫВАНИЕ / ЗАМЕНА ЛЮБОЙ КАРТЫ СВОИМИ РУКАМИ
    if (ability === 'swap_card' || ability === 'rewrite_card') {
      const targetCardId = payload.targetCardId;
      const customValue = (payload.customValue || "").trim();
      const customDesc = (payload.customDesc || "").trim();

      if (!targetCardId) return { error: "Выберите карту для замены" };
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

    // 5. ШПИОН / СКАНЕР ДОСЬЕ
    if (ability === 'inspect') {
      const targetPlayer = room.players.find(p => p.id === payload.targetPlayerId);
      if (!targetPlayer) return { error: "Выберите игрока для проверки" };

      specialCard.used = true;
      specialCard.revealed = true;
      this.addSystemMessage(room, {
        ru: `🔍 [КОЗЫРЬ]: ${player.name} применил Сканер и тайно изучил закрытые карты игрока ${targetPlayer.name}!`,
        en: `🔍 [TRUMP]: ${player.name} deployed Scanner and secretly inspected ${targetPlayer.name}'s hidden dossier!`,
        uz: `🔍 [KOZIR]: ${player.name} skanerdan foydalanib, ${targetPlayer.name}ning maxfiy kartalarini ko'rib chiqdi!`
      });
      this.broadcastRoom(code);

      return { 
        success: true, 
        inspectedPlayer: {
          id: targetPlayer.id,
          name: targetPlayer.name,
          deck: targetPlayer.deck
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
    const alivePlayers = room.players.filter(p => p.isAlive);
    const voteCounts = {};
    alivePlayers.forEach(p => { voteCounts[p.id] = 0; });

    let totalVotesCast = 0;
    alivePlayers.forEach(p => {
      if (p.votedFor && voteCounts[p.votedFor] !== undefined) {
        const weight = p.voteWeight || 1;
        voteCounts[p.votedFor] += weight;
        totalVotesCast += weight;
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
        this.addSystemMessage(room, {
          ru: `РЕШЕНИЕМ БОЛЬШИНСТВА (${maxVotes} голосов): ${exiledPlayer.name} ИЗГНАН ИЗ БУНКЕРА! Теперь он Призрак 👻.`,
          en: `BY MAJORITY VOTE (${maxVotes} votes): ${exiledPlayer.name} HAS BEEN EXILED FROM THE BUNKER! Now a Ghost 👻.`,
          uz: `KO'PCHILIK OVOZI BILAN (${maxVotes} ovoz): ${exiledPlayer.name} BUNKERDAN HAYDALDI! Endi u Arvoh 👻.`
        });
      }
    } else if (isTimeout) {
      // Никто не проголосовал за 20 минут: случайно изгоняется 1 выживший
      const nonImmune = alivePlayers.filter(p => !p.hasImmunityThisRound);
      const chosen = nonImmune.length > 0 ? nonImmune : alivePlayers;
      exiledPlayer = chosen[Math.floor(Math.random() * chosen.length)];
      if (exiledPlayer) {
        exiledPlayer.isAlive = false;
        this.addSystemMessage(room, {
          ru: `⏰ Таймер 20 минут истек, а голосов не было! Терминал случайно выбрал на изгнание: ${exiledPlayer.name}! 👻`,
          en: `⏰ 20-minute timer expired with zero votes! Terminal randomly chose for exile: ${exiledPlayer.name}! 👻`,
          uz: `⏰ 20 daqiqalik taymer tugadi va ovozlar bo'lmadi! Terminal tasodifan haydashga tanladi: ${exiledPlayer.name}! 👻`
        });
      }
    } else {
      this.addSystemMessage(room, {
        ru: `Голоса разделились поровну, никто не был изгнан.`,
        en: `Votes were split evenly, nobody was exiled.`,
        uz: `Ovozlar teng bo'ldi, hech kim haydalmadi.`
      });
    }

    // Сбрасываем временные иммунитеты
    alivePlayers.forEach(p => { p.hasImmunityThisRound = false; });

    room.votingResults = {
      round: room.currentRound,
      voteCounts,
      exiledPlayer: exiledPlayer ? { id: exiledPlayer.id, name: exiledPlayer.name } : null
    };

    room.status = 'ROUND_RESULT';
    room.timerExpiresAt = null;

    // Проверяем: осталось ли РОВНО 2 человека?
    const remainingAlive = room.players.filter(p => p.isAlive);
    if (remainingAlive.length <= 2) {
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

    // Если осталось ровно 2 человека или раунд 7 завершен -> КОНЕЦ ИГРЫ
    if (alivePlayers.length <= 2 || room.currentRound >= 7) {
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
    room.players.forEach(p => {
      p.deck.forEach(c => { c.revealed = true; });
    });

    const winners = room.players.filter(p => p.isAlive);
    const winnerNames = winners.map(w => w.name).join(' & ');
    this.addSystemMessage(room, {
      ru: `ИГРА ОКОНЧЕНА! В бункер успешно попали 2 победителя: ${winnerNames}!`,
      en: `GAME OVER! Exactly 2 winners made it into the bunker: ${winnerNames}!`,
      uz: `O'YIN YAKUNLANDI! Bunkerga 2 ta g'olib muvaffaqiyatli kirdi: ${winnerNames}!`
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

  addChatMessage(code, senderId, text) {
    const room = this.rooms.get(code);
    if (!room) return;

    const sender = room.players.find(p => p.id === senderId);
    if (!sender) return;

    if (!sender.isAlive) return; // Изгнанные не могут писать в чат живых
    if (room.status === 'ROUND_VOTING' || room.status === 'ROUND_RESULT') return;

    const msg = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      senderId: sender.id,
      senderName: sender.name,
      text: text.trim().substring(0, 300),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: false
    };

    room.messages.push(msg);
    if (room.messages.length > 100) room.messages.shift();
    this.io.to(code).emit('chatMessage', msg);
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
      bunkerCapacity: 2, // Строго 2 места!
      votingResults: room.votingResults,
      ghostVotes,
      timerExpiresAt: room.timerExpiresAt,
      timerType: room.timerType,
      activeTurnPlayerId: room.activeTurnPlayerId,
      players: room.players.map(p => {
        const isSelf = p.id === forPlayerId;

        return {
          id: p.id,
          name: p.name,
          isHost: p.isHost,
          isAlive: p.isAlive,
          isBot: p.isBot,
          revealedCardId: p.revealedCardId,
          hasRevealedThisRound: p.revealedCardId !== null,
          hasVoted: p.votedFor !== null,
          votedFor: isSelf ? p.votedFor : null,
          deck: p.deck.map(card => {
            if (isSelf || card.revealed || isGameOver) {
              return card;
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
      messages: room.messages
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
}

module.exports = GameManager;
