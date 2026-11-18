// Secret Bot AI Engine for "Бункер: 7 Раундов Откровений"
// Generates natural, human-like reactions, smart card evaluation, and believable voting behavior
// Supports RU, UZ, EN with automatic localization

class BotAiManager {
  constructor() {
    // Scoring weights for card evaluations
    this.professionRanks = {
      // Top tier (crucial for bunker survival) - negative risk
      doctor: -35, surgeon: -35, therapist: -30, paramedic: -28,
      engineer: -30, builder: -25, electrician: -25, mechanic: -25,
      agronomist: -30, farmer: -25, botanist: -25,
      military: -20, security: -15, firefighter: -22,
      chemist: -20, physicist: -18, biologist: -22,
      cook: -18, baker: -15, plumber: -18,

      // Low utility / high risk in post-apocalypse - positive risk
      blogger: 35, influencer: 35, astrologer: 40, psychic: 40,
      actor: 25, comedian: 22, model: 28, stylist: 25,
      gamer: 25, stream: 25, politician: 30, lawyer: 20,
      banker: 20, broker: 22, critic: 25, sommelier: 28,
      unemployed: 30, prisoner: 28, gambler: 32
    };

    this.badHealthTerms = [
      'рак', 'чума', 'вич', 'туберкулез', 'инфаркт', 'психоз', 'шизофрения',
      'слепота', 'кома', 'лихорадка', 'паралич', 'эпилепсия', 'бешенство',
      'cancer', 'plague', 'hiv', 'tuberculosis', 'psychosis', 'schizophrenia',
      'blindness', 'coma', 'fever', 'paralysis', 'epilepsy', 'rabies',
      'saraton', 'vabo', 'oits', 'sil', 'infarkt', 'psixoz', 'shizofreniya',
      'ko\'rlik', 'falaj', 'tutqanoq', 'quturish'
    ];

    this.goodHealthTerms = [
      'абсолютно здоров', 'идеальное', 'спортсмен', 'крепкий иммунитет', 'вынослив',
      'completely healthy', 'perfect health', 'athlete', 'strong immunity', 'endurance',
      'mutlaqo sog\'lom', 'ideal salomatlik', 'sportchi', 'kuchli immunitet', 'bardoshli'
    ];

    this.badLuggageTerms = [
      'пустая', 'сломан', 'песок', 'мусор', 'яд', 'радиоактив', 'кирпич', 'доллары', 'фантики',
      'empty', 'broken', 'sand', 'trash', 'poison', 'radioactive', 'brick', 'cash', 'useless',
      'bo\'sh', 'singan', 'qum', 'chiqindi', 'zahar', 'radioaktiv', 'g\'isht', 'keraksiz'
    ];

    this.goodLuggageTerms = [
      'аптечка', 'оружие', 'семена', 'генератор', 'фильтр', 'инструменты', 'консервы', 'вода', 'рация',
      'first aid', 'weapon', 'seeds', 'generator', 'filter', 'tools', 'canned food', 'water', 'radio',
      'dori-darmon', 'qurol', 'urug\'lar', 'generator', 'filtr', 'asboblar', 'konserva', 'suv', 'ratsiya'
    ];
  }

  // Оценка риска одного игрока на основе всех его открытых карт
  // Чем выше число — тем выше риск и тем сильнее боты захотят выгнать игрока
  evaluatePlayerRisk(player) {
    if (!player || !player.deck) return 0;
    let score = 0;

    const revealedCards = player.deck.filter(c => c.revealed);

    revealedCards.forEach(card => {
      const type = card.type || card.id;
      const rawText = `${card.value?.ru || card.value || ''} ${card.description?.ru || card.description || ''}`.toLowerCase();

      // 1. Профессия
      if (type === 'profession') {
        let matched = false;
        for (const [key, weight] of Object.entries(this.professionRanks)) {
          if (rawText.includes(key) || this.matchesProfessionKey(rawText, key)) {
            score += weight;
            matched = true;
            break;
          }
        }
        if (!matched) score += 5; // Нейтральная профессия
      }

      // 2. Здоровье
      else if (type === 'health') {
        const isBad = this.badHealthTerms.some(term => rawText.includes(term));
        const isGood = this.goodHealthTerms.some(term => rawText.includes(term));
        if (isBad) score += 35;
        else if (isGood) score -= 25;
        else score += 5;
      }

      // 3. Возраст
      else if (type === 'age') {
        const num = parseInt(rawText, 10);
        if (!isNaN(num)) {
          if (num >= 70) score += 30;
          else if (num >= 55) score += 15;
          else if (num <= 14) score += 18;
          else if (num >= 20 && num <= 35) score -= 15;
        }
      }

      // 4. Багаж
      else if (type === 'luggage') {
        const isBad = this.badLuggageTerms.some(term => rawText.includes(term));
        const isGood = this.goodLuggageTerms.some(term => rawText.includes(term));
        if (isBad) score += 25;
        else if (isGood) score -= 20;
      }

      // 5. Биология / Факт
      else if (type === 'fact' || type === 'biology') {
        if (rawText.includes('бесплод') || rawText.includes('infert') || rawText.includes('bepusht')) score += 12;
        if (rawText.includes('преступ') || rawText.includes('убий') || rawText.includes('crim') || rawText.includes('jinoyat')) score += 25;
        if (rawText.includes('гений') || rawText.includes('наград') || rawText.includes('genius') || rawText.includes('chempion')) score -= 15;
      }
    });

    return score;
  }

  matchesProfessionKey(text, key) {
    const dict = {
      doctor: ['врач', 'доктор', 'медик', 'хирург', 'терапевт', 'shifokor', 'doktor'],
      engineer: ['инженер', 'механик', 'строитель', 'электрик', 'muhandis', 'quruvchi'],
      agronomist: ['агроном', 'фермер', 'ботаник', 'agronom', 'fermer'],
      military: ['военный', 'солдат', 'офицер', 'спецназ', 'harbiy', 'askor'],
      blogger: ['блогер', 'тиктокер', 'инфлюенсер', 'strimer', 'bloger'],
      actor: ['актер', 'артист', 'модель', 'aktrisa', 'aktyor'],
      psychic: ['экстрасенс', 'астролог', 'гадалка', 'munajjim', 'folbin']
    };
    return (dict[key] || []).some(k => text.includes(k));
  }

  // Выбор наилучшей цели для голосования конкретного бота
  chooseVotingTarget(room, bot) {
    const aliveTargets = room.players.filter(p => p.isAlive && p.id !== bot.id && !p.hasLeft);
    if (aliveTargets.length === 0) return null;

    // Считаем полезность/опасность каждого кандидата
    const ranked = aliveTargets.map(player => {
      let risk = this.evaluatePlayerRisk(player);

      // Самозащита: если этот игрок голосовал против бота в прошлом раунде, бот помнит об этом!
      if (player.lastRoundVotedFor === bot.id) {
        risk += 22;
      }

      // Небольшая индивидуальная вариативность у каждого бота (10-15%), чтобы не все голосовали одинаково
      const noise = (Math.random() - 0.5) * 8;
      return { player, finalScore: risk + noise };
    });

    ranked.sort((a, b) => b.finalScore - a.finalScore);

    // 80% времени выбираем самую опасную цель, 20% — вторую по опасности
    if (ranked.length > 1 && Math.random() < 0.2) {
      return ranked[1].player;
    }
    return ranked[0].player;
  }

  // Генерация естественного сообщения от бота при вскрытии карты
  generateRevealReaction(bot, card, room) {
    const type = card.type || card.id;
    const valRu = card.value?.ru || card.value || '';
    const valUz = card.value?.uz || valRu;
    const valEn = card.value?.en || valRu;

    if (type === 'profession') {
      const goodProf = ['врач', 'инженер', 'строитель', 'агроном', 'военный', 'повар', 'электрик'];
      const isGood = goodProf.some(p => valRu.toLowerCase().includes(p));

      if (isGood) {
        return {
          ru: `Моя профессия «${valRu}» — это критически важный навык. Без таких людей бункер просто не протянет.`,
          uz: `Mening kasbim «${valUz}» — bu bunker uchun juda muhim soha. Mensiz uzoqqa borib bo'lmaydi.`,
          en: `My profession is "${valEn}" — absolutely vital for the bunker. We need functional skills to survive.`
        };
      } else {
        return {
          ru: `Да, у меня «${valRu}», но не спешите делать выводы — подождите, пока я открою багаж и здоровье!`,
          uz: `Ha, menda «${valUz}», lekin shoshilmang — qolgan kartalarim va yukimni ham ko'ring!`,
          en: `Yes, I got "${valEn}", but don't jump to conclusions yet — wait until you see my luggage and health!`
        };
      }
    }

    if (type === 'health') {
      const isBad = this.badHealthTerms.some(term => valRu.toLowerCase().includes(term));
      if (isBad) {
        return {
          ru: `Да, по здоровью есть нюансы («${valRu}»), но я всё ещё полностью дееспособен и полезен команде.`,
          uz: `Salomatligimda biroz muammo bor («${valUz}»), lekin men baribir jamoaga juda ko'p foyda bera olaman.`,
          en: `I have a health condition ("${valEn}"), but I can still work hard and contribute to our survival.`
        };
      } else {
        return {
          ru: `Отличное здоровье («${valRu}»)! Никаких заразных болезней, крепкий организм для выживания.`,
          uz: `Salomatligim a'lo darajada («${valUz}»)! Hech qanday yuqumli kasallik yo'q, baquvvatman.`,
          en: `Clean health record ("${valEn}")! No infectious risks, robust constitution for the bunker.`
        };
      }
    }

    if (type === 'luggage') {
      return {
        ru: `В моём багаже: «${valRu}». Это обязательно пригодится при обустройстве убежища.`,
        uz: `Yukimda: «${valUz}». Bu buyum bunker ichida barchamizga asqotadi.`,
        en: `In my luggage: "${valEn}". This will be extremely useful for establishing the shelter.`
      };
    }

    return null;
  }

  // Генерация сообщения аргументации при голосовании
  generateVotingArgument(bot, target, room) {
    const revealedCards = (target.deck || []).filter(c => c.revealed);
    const targetCard = revealedCards.find(c => c.revealedInRound === room.currentRound) || revealedCards[0];

    const cardValRu = targetCard ? (targetCard.value?.ru || targetCard.value) : '';
    const cardValUz = targetCard ? (targetCard.value?.uz || cardValRu) : '';
    const cardValEn = targetCard ? (targetCard.value?.en || cardValRu) : '';

    const templates = [
      {
        ru: `Голосую против ${target.name}. Карта «${cardValRu}» несёт слишком большой риск для нашей команды.`,
        uz: `${target.name}ga qarshi ovoz beraman. «${cardValUz}» kartasi jamoamiz uchun xavfli.`,
        en: `Voting against ${target.name}. The card "${cardValEn}" poses too much risk for our shelter.`
      },
      {
        ru: `Посмотрел на карты ${target.name} (${cardValRu}). Сейчас это самый слабый участник для бункера.`,
        uz: `${target.name}ning kartalarini ko'rib chiqdim (${cardValUz}). Hozir u eng zaif ishtirokchi bo'lib turibdi.`,
        en: `Looking at ${target.name}'s cards (${cardValEn}), they currently have the least utility for our bunker.`
      },
      {
        ru: `Нам нужно беречь ресурсы базы. Мой голос против ${target.name}.`,
        uz: `Bunker resurslarini asrashimiz kerak. Ovozim ${target.name}ga qarshi.`,
        en: `We need to conserve our supplies. My vote goes against ${target.name}.`
      },
      {
        ru: `Ничего личного, но у ${target.name} с «${cardValRu}» шансы вытащить бункер минимальные. Отдаю голос за изгнание.`,
        uz: `Shaxsiy adovatim yo'q, lekin ${target.name} «${cardValUz}» bilan jamoani torta olmaydi. Uni chiqarishga ovoz beraman.`,
        en: `Nothing personal, but ${target.name} with "${cardValEn}" won't pull their weight. Voting them out.`
      }
    ];

    const idx = Math.floor(Math.random() * templates.length);
    return templates[idx];
  }

  // Реакция на изгнание
  generateExileReaction(exiledPlayer, isBotExiled) {
    if (isBotExiled) {
      const botExiledPhrases = [
        {
          ru: `Серьёзно?! Вы совершаете критическую ошибку. Удачи выжить без моих навыков!`,
          uz: `Rostdanmi?! Katta xatoga yo'l qo'yyapsizlar. Mensiz omon qolishga omad!`,
          en: `Seriously?! You're making a massive mistake. Good luck surviving without my skills!`
        },
        {
          ru: `Зря вы так... Я был готов сделать всё для бункера. Пустошь меня не сломает!`,
          uz: `Bekor qildingiz... Men bunker uchun hamma narsaga tayyor edim. Tashqarida ham yashab ketaman!`,
          en: `Big mistake... I was ready to do whatever it takes for our base. The wasteland won't break me!`
        },
        {
          ru: `Что ж, посмотрим, как долго вы протянете без меня, когда закончатся припасы!`,
          uz: `Mayli, zaxiralar tugaganda mensiz qancha vaqt chidashingizni ko'ramiz!`,
          en: `Well, let's see how long you last once your supplies run out without me!`
        }
      ];
      return botExiledPhrases[Math.floor(Math.random() * botExiledPhrases.length)];
    } else {
      const spectatorPhrases = [
        {
          ru: `Решение тяжёлое, но места в бункере строго ограничены. Двигаемся дальше.`,
          uz: `Qiyin qaror bo'ldi, lekin bunkerda joylar juda cheklangan. Davom etamiz.`,
          en: `Tough decision, but bunker spots are strictly limited. Moving forward.`
        },
        {
          ru: `Логичный выбор большинства. Бункер стал безопаснее.`,
          uz: `Ko'pchilikning mantiqiy tanlovi. Bunker ancha xavfsizroq bo'ldi.`,
          en: `Logical choice by the majority. The bunker is safer now.`
        },
        {
          ru: `Гермошлюз закрыт. Теперь нужно внимательно оценивать оставшихся.`,
          uz: `Eshiklar yopildi. Endi qolganlarni diqqat bilan tahlil qilishimiz kerak.`,
          en: `The airlock is sealed. Now we must evaluate the remaining survivors carefully.`
        }
      ];
      return spectatorPhrases[Math.floor(Math.random() * spectatorPhrases.length)];
    }
  }

  // Обсуждение между выжившими в фазе дискуссии (живой чат)
  generateDiscussionRemark(bot, room) {
    const aliveOthers = room.players.filter(p => p.isAlive && p.id !== bot.id && !p.hasLeft);
    if (aliveOthers.length === 0) return null;

    const target = aliveOthers[Math.floor(Math.random() * aliveOthers.length)];
    const revealedCards = (target.deck || []).filter(c => c.revealed);
    if (revealedCards.length === 0) return null;

    const randomCard = revealedCards[Math.floor(Math.random() * revealedCards.length)];
    const cardValRu = randomCard.value?.ru || randomCard.value || '';
    const cardValUz = randomCard.value?.uz || cardValRu;
    const cardValEn = randomCard.value?.en || cardValRu;

    const remarks = [
      {
        ru: `Кто что думает про карту ${target.name} («${cardValRu}»)? Насколько это безопасно?`,
        uz: `${target.name}ning «${cardValUz}» kartasi haqida kim nima deb o'ylaydi? Bu qanchalik xavfsiz?`,
        en: `What does everyone think about ${target.name}'s "${cardValEn}"? Is that safe enough?`
      },
      {
        ru: `Нам в первую очередь нужны специалисты для жизнеобеспечения. Давайте взвешивать факты спокойно.`,
        uz: `Bizga birinchi navbatda hayotni saqlab qoluvchi mutaxassislar kerak. Keling, barchasini xotirjam tahlil qilaylik.`,
        en: `We primarily need life-support specialists. Let's weigh the facts calmly.`
      },
      {
        ru: `Учтите, что мест в бункере всего ${room.bunkerCapacity}. Слабые карты нам сейчас ни к чему.`,
        uz: `Yodda tuting, bunkerda atigi ${room.bunkerCapacity} ta joy bor. Kuchli bo'lmagan kartalar bizga xalal beradi.`,
        en: `Keep in mind there are only ${room.bunkerCapacity} spots in the bunker. We cannot carry passengers.`
      }
    ];

    return remarks[Math.floor(Math.random() * remarks.length)];
  }
}

const botAiManager = new BotAiManager();

module.exports = {
  BotAiManager,
  botAiManager
};
