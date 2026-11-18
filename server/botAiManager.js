// Advanced Human-Like Bot AI Engine for "Бункер: 7 Раундов Откровений"
// Generates short, punchy, realistic human gamer chat messages,
// deep disaster awareness, card evaluation, and intelligent voting behavior.
// Supports RU, UZ, EN with authentic gaming tone.

class BotAiManager {
  constructor() {
    this.professionRanks = {
      // Crucial skills in post-apocalypse (negative risk = highly valuable)
      doctor: -35, surgeon: -35, therapist: -30, paramedic: -28, medic: -30,
      engineer: -30, builder: -25, electrician: -25, mechanic: -25,
      agronomist: -30, farmer: -25, botanist: -25,
      military: -22, security: -18, firefighter: -22,
      chemist: -22, physicist: -20, biologist: -24,
      cook: -18, baker: -15, plumber: -18,

      // Low utility / high liability in bunker (positive risk = vote target)
      blogger: 35, influencer: 35, astrologer: 40, psychic: 40,
      actor: 25, comedian: 22, model: 28, stylist: 25,
      gamer: 25, streamer: 25, politician: 30, lawyer: 20,
      banker: 20, broker: 22, critic: 25, sommelier: 28,
      unemployed: 30, prisoner: 28, gambler: 32
    };

    this.badHealthTerms = [
      'рак', 'чума', 'вич', 'туберкулез', 'инфаркт', 'психоз', 'шизофрения',
      'слепота', 'кома', 'лихорадка', 'паралич', 'эпилепсия', 'бешенство', 'кашель', 'зараза',
      'cancer', 'plague', 'hiv', 'tuberculosis', 'psychosis', 'schizophrenia',
      'blindness', 'coma', 'fever', 'paralysis', 'epilepsy', 'rabies', 'cough', 'infection',
      'saraton', 'vabo', 'oits', 'sil', 'infarkt', 'psixoz', 'shizofreniya',
      'ko\'rlik', 'falaj', 'tutqanoq', 'quturish', 'yo\'tal', 'yuqumli'
    ];

    this.goodHealthTerms = [
      'абсолютно здоров', 'идеальное', 'спортсмен', 'крепкий иммунитет', 'вынослив', 'здоров',
      'completely healthy', 'perfect health', 'athlete', 'strong immunity', 'endurance', 'healthy',
      'mutlaqo sog\'lom', 'ideal salomatlik', 'sportchi', 'kuchli immunitet', 'bardoshli', 'sog\'lom'
    ];

    this.badLuggageTerms = [
      'пустая', 'сломан', 'песок', 'мусор', 'яд', 'радиоактив', 'кирпич', 'доллары', 'фантики', 'плюшев', 'косметика',
      'empty', 'broken', 'sand', 'trash', 'poison', 'radioactive', 'brick', 'cash', 'useless', 'makeup',
      'bo\'sh', 'singan', 'qum', 'chiqindi', 'zahar', 'radioaktiv', 'g\'isht', 'keraksiz', 'pardoz'
    ];

    this.goodLuggageTerms = [
      'аптечка', 'оружие', 'семена', 'генератор', 'фильтр', 'инструменты', 'консервы', 'вода', 'рация', 'костюм',
      'first aid', 'weapon', 'seeds', 'generator', 'filter', 'tools', 'canned food', 'water', 'radio', 'suit',
      'dori-darmon', 'qurol', 'urug\'lar', 'generator', 'filtr', 'asboblar', 'konserva', 'suv', 'ratsiya', 'kostyum'
    ];
  }

  // Определение типа катастрофы (радиация / вирус / ледниковый период / потоп / общая)
  getDisasterType(disaster) {
    if (!disaster) return 'generic';
    const text = `${disaster.title?.ru || disaster.title || ''} ${disaster.desc?.ru || disaster.desc || ''}`.toLowerCase();
    if (text.includes('радиац') || text.includes('ядерн') || text.includes('radiation') || text.includes('nuclear') || text.includes('yadro')) {
      return 'radiation';
    }
    if (text.includes('вирус') || text.includes('эпидеми') || text.includes('мутаген') || text.includes('virus') || text.includes('outbreak') || text.includes('infeksiy')) {
      return 'virus';
    }
    if (text.includes('ледник') || text.includes('холод') || text.includes('-70') || text.includes('ice') || text.includes('cold') || text.includes('muzlik')) {
      return 'ice_age';
    }
    if (text.includes('потоп') || text.includes('наводнен') || text.includes('flood') || text.includes('suv toshqini')) {
      return 'flood';
    }
    return 'generic';
  }

  // Оценка опасности/бесполезности игрока с учетом конкретной катастрофы и свежести открытых карт
  evaluatePlayerRisk(player, disaster = null, currentRound = 1) {
    if (!player || !player.deck) return 0;
    let score = 0;
    const disType = this.getDisasterType(disaster);
    const revealedCards = player.deck.filter(c => c.revealed);

    revealedCards.forEach(card => {
      const type = card.type || card.id;
      const rawText = `${card.value?.ru || card.value || ''} ${card.description?.ru || card.description || ''}`.toLowerCase();
      const isFresh = card.revealedInRound === currentRound;
      const freshFactor = isFresh ? 1.5 : 1.0;

      // 1. Профессия
      if (type === 'profession') {
        let matched = false;
        for (const [key, weight] of Object.entries(this.professionRanks)) {
          if (rawText.includes(key) || this.matchesProfessionKey(rawText, key)) {
            let modWeight = weight;
            // Коррекция под катастрофу
            if (disType === 'virus' && (key.includes('doctor') || key.includes('chemist') || key.includes('biologist'))) {
              modWeight -= 20; // Врач при эпидемии ещё важнее
            } else if (disType === 'ice_age' && (key.includes('electrician') || key.includes('engineer') || key.includes('mechanic'))) {
              modWeight -= 15; // Инженер при холоде спасает генератор
            } else if (disType === 'radiation' && (key.includes('physicist') || key.includes('chemist') || key.includes('military'))) {
              modWeight -= 15;
            }
            score += modWeight * freshFactor;
            matched = true;
            break;
          }
        }
        if (!matched) score += 5 * freshFactor;
      }

      // 2. Здоровье
      else if (type === 'health') {
        const isBad = this.badHealthTerms.some(term => rawText.includes(term));
        const isGood = this.goodHealthTerms.some(term => rawText.includes(term));
        if (isBad) {
          const delta = (disType === 'virus') ? 50 : 35;
          score += delta * freshFactor;
        } else if (isGood) {
          const delta = (disType === 'virus') ? -30 : -22;
          score += delta * freshFactor;
        } else {
          score += 5 * freshFactor;
        }
      }

      // 3. Возраст
      else if (type === 'age') {
        const num = parseInt(rawText, 10);
        if (!isNaN(num)) {
          if (num >= 70) score += 30 * freshFactor;
          else if (num >= 55) score += 15 * freshFactor;
          else if (num <= 14) score += 18 * freshFactor;
          else if (num >= 20 && num <= 35) score -= 15 * freshFactor;
        }
      }

      // 4. Багаж
      else if (type === 'luggage') {
        const isBad = this.badLuggageTerms.some(term => rawText.includes(term));
        const isGood = this.goodLuggageTerms.some(term => rawText.includes(term));
        if (isBad) {
          score += 25 * freshFactor;
        } else if (isGood) {
          let bonus = 20;
          if (disType === 'ice_age' && (rawText.includes('генератор') || rawText.includes('generator') || rawText.includes('обогрев'))) {
            bonus = 40;
          } else if (disType === 'radiation' && (rawText.includes('фильтр') || rawText.includes('filter') || rawText.includes('костюм'))) {
            bonus = 35;
          } else if (disType === 'virus' && (rawText.includes('аптечка') || rawText.includes('first aid') || rawText.includes('dori'))) {
            bonus = 35;
          }
          score -= bonus * freshFactor;
        }
      }

      // 5. Биология / Факт
      else if (type === 'fact' || type === 'biology') {
        if (rawText.includes('бесплод') || rawText.includes('infert') || rawText.includes('bepusht')) score += 18 * freshFactor;
        if (rawText.includes('преступ') || rawText.includes('убий') || rawText.includes('crim') || rawText.includes('jinoyat')) score += 32 * freshFactor;
        if (rawText.includes('гений') || rawText.includes('наград') || rawText.includes('genius') || rawText.includes('chempion')) score -= 16 * freshFactor;
      }
    });

    return score;
  }

  matchesProfessionKey(text, key) {
    const dict = {
      doctor: ['врач', 'доктор', 'медик', 'хирург', 'терапевт', 'shifokor', 'doktor', 'physician', 'surgeon'],
      engineer: ['инженер', 'механик', 'строитель', 'электрик', 'muhandis', 'quruvchi', 'engineer', 'mechanic'],
      agronomist: ['агроном', 'фермер', 'ботаник', 'agronom', 'fermer', 'farmer', 'botanist'],
      military: ['военный', 'солдат', 'офицер', 'спецназ', 'harbiy', 'askor', 'military', 'officer'],
      blogger: ['блогер', 'тиктокер', 'инфлюенсер', 'strimer', 'bloger', 'blogger', 'influencer'],
      actor: ['актер', 'артист', 'модель', 'aktrisa', 'aktyor', 'actor', 'model'],
      psychic: ['экстрасенс', 'астролог', 'гадалка', 'munajjim', 'folbin', 'psychic', 'astrologer']
    };
    return (dict[key] || []).some(k => text.includes(k));
  }

  // Определение ключевой определяющей карты игрока (для точных аргументов в чате)
  findKeyTrait(player) {
    if (!player || !player.deck) return null;
    const revealed = player.deck.filter(c => c.revealed);
    if (revealed.length === 0) return null;

    // Сначала ищем опасные болезни
    for (const c of revealed) {
      if ((c.type || c.id) === 'health') {
        const text = `${c.value?.ru || c.value || ''}`.toLowerCase();
        if (this.badHealthTerms.some(t => text.includes(t))) {
          return { type: 'bad_health', card: c };
        }
      }
    }

    // Затем бесполезные профессии
    for (const c of revealed) {
      if ((c.type || c.id) === 'profession') {
        const text = `${c.value?.ru || c.value || ''}`.toLowerCase();
        for (const [key, weight] of Object.entries(this.professionRanks)) {
          if (weight >= 25 && (text.includes(key) || this.matchesProfessionKey(text, key))) {
            return { type: 'bad_profession', card: c };
          }
        }
      }
    }

    // Затем плохой багаж
    for (const c of revealed) {
      if ((c.type || c.id) === 'luggage') {
        const text = `${c.value?.ru || c.value || ''}`.toLowerCase();
        if (this.badLuggageTerms.some(t => text.includes(t))) {
          return { type: 'bad_luggage', card: c };
        }
      }
    }

    // Иначе берем последнюю открытую
    return { type: 'generic', card: revealed[revealed.length - 1] };
  }

  // Умный выбор цели голосования с памятью и оценкой карт
  chooseVotingTarget(room, bot) {
    const aliveTargets = room.players.filter(p => p.isAlive && p.id !== bot.id && !p.hasLeft && !p.hasImmunityThisRound);
    if (aliveTargets.length === 0) return null;

    const ranked = aliveTargets.map(player => {
      let risk = this.evaluatePlayerRisk(player, room.disaster, room.currentRound || 1);

      // Ответка: если этот игрок голосовал против бота в прошлых раундах, бот отвечает тем же
      if (player.lastRoundVotedFor === bot.id) {
        risk += 25;
      }
      if (Array.isArray(bot.lastVotedAgainstBy) && bot.lastVotedAgainstBy.includes(player.id)) {
        risk += 22;
      }
      if (player.votedFor === bot.id) {
        risk += 20;
      }

      // Не голосовать повторно против того же выжившего кандидата, если есть другие цели
      if (bot.lastRoundVotedFor && bot.lastRoundVotedFor === player.id) {
        risk -= 22;
      }

      // Небольшая индивидуальная вариация у ботов
      const noise = (Math.random() - 0.5) * 8;
      return { player, finalScore: risk + noise };
    });

    ranked.sort((a, b) => b.finalScore - a.finalScore);

    // 85% выбираем самую слабую/опасную цель
    if (ranked.length > 1 && Math.random() < 0.15) {
      return ranked[1].player;
    }
    return ranked[0].player;
  }

  // Короткая, человеческая реакция на вскрытие своей карты (макс 5-8 слов)
  generateRevealReaction(bot, card, room) {
    const type = card.type || card.id;
    const valRu = card.value?.ru || card.value || '';
    const valUz = card.value?.uz || valRu;
    const valEn = card.value?.en || valRu;

    if (type === 'profession') {
      const goodProf = ['врач', 'инженер', 'строитель', 'агроном', 'военный', 'повар', 'электрик', 'хирург'];
      const isGood = goodProf.some(p => valRu.toLowerCase().includes(p));

      if (isGood) {
        const phrases = [
          {
            ru: `«${valRu}» — это база, бункер без меня встанет.`,
            uz: `«${valUz}» — bu baza, mensiz stansiya ishlamaydi.`,
            en: `"${valEn}" is vital, shelter won't run without me.`
          },
          {
            ru: `Я «${valRu}», берегите меня для финала.`,
            uz: `Men «${valUz}»man, final uchun asranglar.`,
            en: `I am a "${valEn}", keep me around for the end.`
          },
          {
            ru: `Отличная профессия: «${valRu}». Не сливайте.`,
            uz: `Ajoyib kasb: «${valUz}». Ovoz bermanglar.`,
            en: `Top tier job: "${valEn}". Don't vote me out.`
          }
        ];
        return phrases[Math.floor(Math.random() * phrases.length)];
      } else {
        const phrases = [
          {
            ru: `Профессия средняя, но здоровье топ.`,
            uz: `Kasb o'rtacha, lekin sog'ligim a'lo.`,
            en: `Average profession, but my health is solid.`
          },
          {
            ru: `Не спешите сливать, дальше мощные карты.`,
            uz: `Shoshilmanglar, keyingi kartalarim kuchli.`,
            en: `Don't rush to vote me, my next cards are strong.`
          }
        ];
        return phrases[Math.floor(Math.random() * phrases.length)];
      }
    }

    if (type === 'health') {
      const isBad = this.badHealthTerms.some(term => valRu.toLowerCase().includes(term));
      if (isBad) {
        return {
          ru: `Есть нюанс со здоровьем, но работать смогу на все 100%.`,
          uz: `Salomatlikda nuqson bor, lekin to'liq ishlay olaman.`,
          en: `Minor health issue, but I can work at 100%.`
        };
      } else {
        return {
          ru: `Здоровье чистое («${valRu}»), нулевой риск заразы.`,
          uz: `Salomatlik a'lo («${valUz}»), hech qanday yuqumli xavf yo'q.`,
          en: `Clean health record ("${valEn}"), zero infection risk.`
        };
      }
    }

    if (type === 'luggage') {
      const isBad = this.badLuggageTerms.some(term => valRu.toLowerCase().includes(term));
      if (isBad) {
        return {
          ru: `Багаж так себе, зато навыки полезные.`,
          uz: `Yuk oddiy, lekin kasbim foydali.`,
          en: `Luggage is simple, but my skills compensate.`
        };
      }
      return {
        ru: `Полезный багаж: «${valRu}». Всем пригодится.`,
        uz: `Foydali yuk: «${valUz}». Hammamizga kerak.`,
        en: `Great item: "${valEn}". We will definitely use it.`
      };
    }

    return null;
  }

  // Короткий, точный аргумент при голосовании (5-10 слов, четко по картам)
  generateVotingArgument(bot, target, room) {
    const keyTrait = this.findKeyTrait(target);
    const cardRu = keyTrait?.card ? (keyTrait.card.value?.ru || keyTrait.card.value) : '';
    const cardUz = keyTrait?.card ? (keyTrait.card.value?.uz || cardRu) : '';
    const cardEn = keyTrait?.card ? (keyTrait.card.value?.en || cardRu) : '';

    if (keyTrait?.type === 'bad_health') {
      const phrases = [
        {
          ru: `Голос в ${target.name}. Болезнь «${cardRu}» опасна для бункера.`,
          uz: `${target.name}ga ovoz. «${cardUz}» kasalligi bunkerga xavf tug'diradi.`,
          en: `Voting ${target.name}. That disease ("${cardEn}") is dangerous for us.`
        },
        {
          ru: `Сливаю ${target.name}. С такой болезнью не выживем.`,
          uz: `${target.name}ni chiqaramiz. Bu kasallik bilan omon qolmaymiz.`,
          en: `Eliminating ${target.name}. Shelter won't survive that infection.`
        }
      ];
      return phrases[Math.floor(Math.random() * phrases.length)];
    }

    if (keyTrait?.type === 'bad_profession') {
      const phrases = [
        {
          ru: `Голосую за ${target.name}. «${cardRu}» нам в бункере не поможет.`,
          uz: `${target.name}ga ovoz. «${cardUz}» bunkerda yordam bermaydi.`,
          en: `Voting ${target.name}. "${cardEn}" won't help us down there.`
        },
        {
          ru: `${target.name}, сорян, но профессия бесполезна для базы.`,
          uz: `${target.name}, xafa bo'lma, lekin bu kasb baza uchun keraksiz.`,
          en: `${target.name}, sorry, but that job has zero value for the bunker.`
        }
      ];
      return phrases[Math.floor(Math.random() * phrases.length)];
    }

    const genericPhrases = [
      {
        ru: `Мой голос за ${target.name}. Мест всего ${room.bunkerCapacity || 2}, надо чистить слабых.`,
        uz: `Mening ovozim ${target.name}ga. Joy atigi ${room.bunkerCapacity || 2} ta, zaiflarni chiqaramiz.`,
        en: `My vote goes to ${target.name}. Only ${room.bunkerCapacity || 2} spots left, cutting weak cards.`
      },
      {
        ru: `Сливаю ${target.name}, по картам наименьшая польза.`,
        uz: `${target.name}ni chiqaramiz, kartalari eng kam foyda beradi.`,
        en: `Voting ${target.name}, lowest utility for the team.`
      }
    ];
    return genericPhrases[Math.floor(Math.random() * genericPhrases.length)];
  }

  // Живая эмоциональная реакция на изгнание
  generateExileReaction(exiledPlayer, isBotExiled) {
    if (isBotExiled) {
      const phrases = [
        {
          ru: `Серьёзно?! Без моих навыков станция не вытянет.`,
          uz: `Rostdanmi?! Mensiz bunker uzoqqa bormaydi.`,
          en: `Seriously?! You won't last long without my skills.`
        },
        {
          ru: `Критическая ошибка команды. Удачи в пустоши.`,
          uz: `Katta xato qildinglar. Qolganlarga omad.`,
          en: `Huge mistake, guys. Good luck in the wasteland.`
        },
        {
          ru: `Зря слили... Я бы вытащил команду до победы.`,
          uz: `Bekor qildingiz... Men komandani g'alabagacha tortardim.`,
          en: `Wrong call... I could have carried us to victory.`
        }
      ];
      return phrases[Math.floor(Math.random() * phrases.length)];
    } else {
      const phrases = [
        {
          ru: `Шлюз закрыт. Мест мало, идём дальше.`,
          uz: `Eshiklar yopildi. Joy kam qoldi, davom etamiz.`,
          en: `Airlock sealed. Spots running out, moving on.`
        },
        {
          ru: `Логичное решение большинства.`,
          uz: `Ko'pchilikning mantiqiy qarori.`,
          en: `Logical choice by the majority.`
        },
        {
          ru: `Минус балласт. Смотрим на оставшихся.`,
          uz: `Baland kamaydi. Qolganlarga qaraymiz.`,
          en: `One less liability. Watch the remaining players.`
        }
      ];
      return phrases[Math.floor(Math.random() * phrases.length)];
    }
  }

  // Короткие, живые реплики в чате дискуссии (макс 6-10 слов)
  generateDiscussionRemark(bot, room) {
    const aliveOthers = room.players.filter(p => p.isAlive && p.id !== bot.id && !p.hasLeft);
    if (aliveOthers.length === 0) return null;

    // Ищем игрока с опасной болезнью
    const diseased = aliveOthers.find(p => {
      const hCard = (p.deck || []).find(c => c.revealed && (c.type || c.id) === 'health');
      if (!hCard) return false;
      const text = `${hCard.value?.ru || hCard.value || ''}`.toLowerCase();
      return this.badHealthTerms.some(t => text.includes(t));
    });

    if (diseased) {
      return {
        ru: `Смотрите на ${diseased.name}. С такой болезнью в бункер нельзя.`,
        uz: `${diseased.name}ga qaranglar. Bu kasallik bilan bunkerga kirib bo'lmaydi.`,
        en: `Look at ${diseased.name}. That illness cannot enter the shelter.`
      };
    }

    // Ищем игрока с бесполезной профессией
    const uselessProf = aliveOthers.find(p => {
      const pCard = (p.deck || []).find(c => c.revealed && (c.type || c.id) === 'profession');
      if (!pCard) return false;
      const text = `${pCard.value?.ru || pCard.value || ''}`.toLowerCase();
      return Object.entries(this.professionRanks).some(([k, w]) => w >= 30 && text.includes(k));
    });

    if (uselessProf) {
      return {
        ru: `Зачем нам ${uselessProf.name}? Нам инженеры и врачи нужны.`,
        uz: `${uselessProf.name} bunkerda nima qilib beradi? Bizga mutaxassislar kerak.`,
        en: `Why do we need ${uselessProf.name}? We need engineers and doctors.`
      };
    }

    const generalRemarks = [
      {
        ru: `Мест всего ${room.bunkerCapacity || 2}, голосуем с холодной головой.`,
        uz: `Joy atigi ${room.bunkerCapacity || 2} ta, aql bilan ovoz beringlar.`,
        en: `Only ${room.bunkerCapacity || 2} spots left, vote carefully.`
      },
      {
        ru: `Кого сливаем? Кто самый слабый по картам?`,
        uz: `Kimni chiqaramiz? Kartalari bo'yicha kim eng zaif?`,
        en: `Who are we voting out? Who has the lowest utility?`
      },
      {
        ru: `Врачей и техников не трогаем, это база выживания.`,
        uz: `Shifokor va muhandislarga tegmanglar, ular tirik qolish asosi.`,
        en: `Don't touch doctors or technicians, they are vital.`
      }
    ];
    return generalRemarks[Math.floor(Math.random() * generalRemarks.length)];
  }

  // Живой ответ бота на сообщение реального игрока в чате
  generateChatReply(bot, sender, incomingText, room) {
    if (!incomingText) return null;
    const txt = incomingText.toLowerCase();

    // 1. Игрок спрашивает кого выгонять ("кого", "кто", "кому", "кикаем", "сливаем", "kimni", "who", "vote")
    if (txt.includes('кого') || txt.includes('кто') || txt.includes('кому') || txt.includes('слива') || txt.includes('кика') || txt.includes('who') || txt.includes('kim')) {
      const target = this.chooseVotingTarget(room, bot);
      if (target) {
        const keyTrait = this.findKeyTrait(target);
        const cardRu = keyTrait?.card ? (keyTrait.card.value?.ru || keyTrait.card.value) : '';
        const cardUz = keyTrait?.card ? (keyTrait.card.value?.uz || cardRu) : '';
        const cardEn = keyTrait?.card ? (keyTrait.card.value?.en || cardRu) : '';

        if (keyTrait?.type === 'bad_health' && cardRu) {
          return {
            ru: `Думаю, надо убирать ${target.name}. Болезнь «${cardRu}» слишком опасна.`,
            uz: `Menimcha ${target.name}ni chiqarish kerak. «${cardUz}» kasalligi xavfli.`,
            en: `I think we should vote out ${target.name}. "${cardEn}" is too hazardous.`
          };
        }

        if (keyTrait?.type === 'bad_profession' && cardRu) {
          return {
            ru: `Сливаем ${target.name}. От «${cardRu}» толку в бункере ноль.`,
            uz: `${target.name}ni chiqaramiz. «${cardUz}» kasbining foydasi yo'q.`,
            en: `Vote out ${target.name}. Zero shelter utility from "${cardEn}".`
          };
        }

        return {
          ru: `Думаю, надо голосовать за ${target.name}, слабый расклад.`,
          uz: `Menimcha ${target.name}ga ovoz berish kerak, kartalari zaif.`,
          en: `I say we vote ${target.name}, weakest cards by far.`
        };
      }
    }

    // 2. Вопрос "почему", "за что"
    if (txt.includes('почему') || txt.includes('за что') || txt.includes('nima uchun') || txt.includes('nega') || txt.includes('why')) {
      return {
        ru: `Чисто холодный расчёт. Смотрю на полезность для базы.`,
        uz: `Faqat sovuq hisob-kitob. Bunkerga kim foydali ekanligiga qarayapman.`,
        en: `Pure calculation. Looking strictly at shelter utility.`
      };
    }

    // 3. Игрок защищается ("не сливайте", "meni tegmang", "don't vote")
    if (txt.includes('не слива') || txt.includes('не голосуй') || txt.includes('meni tegmang') || txt.includes('dont vote') || txt.includes('don\'t vote')) {
      return {
        ru: `Покажи следующие карты. Пока доверия мало.`,
        uz: `Keyingi kartalaringni och. Hozircha xavfli ko'rinyapsan.`,
        en: `Show your next cards. Risky bet so far.`
      };
    }

    // 4. Игрок упомянул бота по имени или словом "бот"
    if (txt.includes(bot.name.toLowerCase()) || txt.includes('бот') || txt.includes('bot')) {
      return {
        ru: `Я в игре. Карты топовые, играю на командную победу.`,
        uz: `O'yindaman. Kartalarim zo'r, jamoaviy g'alaba uchun o'ynayman.`,
        en: `I'm here. Strong deck, playing for team survival.`
      };
    }

    // 5. Разговор о врачах / инженерах
    if (txt.includes('врач') || txt.includes('доктор') || txt.includes('shifokor') || txt.includes('doctor') || txt.includes('инженер') || txt.includes('muhandis')) {
      return {
        ru: `Медиков и инженеров бережём, без них бункер умрёт.`,
        uz: `Shifokor va muhandislarni asraymiz, ularsiz bunker yashamaydi.`,
        en: `Keep medics and engineers alive, shelter dies without them.`
      };
    }

    // 6. Обычный реалистичный ответ игрока
    return {
      ru: `Согласен. Надо внимательно смотреть на болезни и багаж.`,
      uz: `Qo'shilaman. Kasalliklar va yuklarga diqqat bilan qarash kerak.`,
      en: `Agreed. Watch the health and luggage closely.`
    };
  }
}

const botAiManager = new BotAiManager();

module.exports = {
  BotAiManager,
  botAiManager
};
