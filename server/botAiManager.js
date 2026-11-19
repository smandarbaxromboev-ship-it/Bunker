// Ultra-Short Human-Like Bot AI Engine for "Бункер: 7 Раундов Откровений"
// Bots write rarely, very briefly (2-5 words max, like real players in chat),
// never repeat phrases in a match, understand disasters/cards, and vote smartly.

class BotAiManager {
  constructor() {
    this.professionRanks = {
      doctor: -35, surgeon: -35, therapist: -30, paramedic: -28, medic: -30,
      engineer: -30, builder: -25, electrician: -25, mechanic: -25,
      agronomist: -30, farmer: -25, botanist: -25,
      military: -22, security: -18, firefighter: -22,
      chemist: -22, physicist: -20, biologist: -24,
      cook: -18, baker: -15, plumber: -18,

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

  pickUniquePhrase(room, phrases, categoryKey = 'gen') {
    if (!Array.isArray(phrases) || phrases.length === 0) return null;

    const tagged = phrases.map((p, idx) => ({
      ...p,
      _tplKey: p._tplKey || `${categoryKey}_${idx}`
    }));

    if (!room) {
      const pick = tagged[Math.floor(Math.random() * tagged.length)];
      return { ru: pick.ru, uz: pick.uz, en: pick.en };
    }

    if (!room.usedBotPhrases) {
      room.usedBotPhrases = new Set();
    }

    const unused = tagged.filter(p => !room.usedBotPhrases.has(p._tplKey) && !room.usedBotPhrases.has(p.ru));
    if (unused.length === 0) {
      return null;
    }

    const chosen = unused[Math.floor(Math.random() * unused.length)];
    room.usedBotPhrases.add(chosen._tplKey);
    room.usedBotPhrases.add(chosen.ru);
    return { ru: chosen.ru, uz: chosen.uz, en: chosen.en };
  }

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

      if (type === 'profession') {
        let matched = false;
        for (const [key, weight] of Object.entries(this.professionRanks)) {
          if (rawText.includes(key) || this.matchesProfessionKey(rawText, key)) {
            let modWeight = weight;
            if (disType === 'virus' && (key.includes('doctor') || key.includes('chemist') || key.includes('biologist'))) {
              modWeight -= 20;
            } else if (disType === 'ice_age' && (key.includes('electrician') || key.includes('engineer') || key.includes('mechanic'))) {
              modWeight -= 15;
            } else if (disType === 'radiation' && (key.includes('physicist') || key.includes('chemist') || key.includes('military'))) {
              modWeight -= 15;
            }
            score += modWeight * freshFactor;
            matched = true;
            break;
          }
        }
        if (!matched) score += 5 * freshFactor;
      } else if (type === 'health') {
        const isBad = this.badHealthTerms.some(term => rawText.includes(term));
        const isGood = this.goodHealthTerms.some(term => rawText.includes(term));
        if (isBad) {
          score += ((disType === 'virus') ? 50 : 35) * freshFactor;
        } else if (isGood) {
          score += ((disType === 'virus') ? -30 : -22) * freshFactor;
        } else {
          score += 5 * freshFactor;
        }
      } else if (type === 'age') {
        const num = parseInt(rawText, 10);
        if (!isNaN(num)) {
          if (num >= 70) score += 30 * freshFactor;
          else if (num >= 55) score += 15 * freshFactor;
          else if (num <= 14) score += 18 * freshFactor;
          else if (num >= 20 && num <= 35) score -= 15 * freshFactor;
        }
      } else if (type === 'luggage') {
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
      } else if (type === 'fact' || type === 'biology') {
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

  findKeyTrait(player) {
    if (!player || !player.deck) return null;
    const revealed = player.deck.filter(c => c.revealed);
    if (revealed.length === 0) return null;

    for (const c of revealed) {
      if ((c.type || c.id) === 'health') {
        const text = `${c.value?.ru || c.value || ''}`.toLowerCase();
        if (this.badHealthTerms.some(t => text.includes(t))) {
          return { type: 'bad_health', card: c };
        }
      }
    }

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

    for (const c of revealed) {
      if ((c.type || c.id) === 'luggage') {
        const text = `${c.value?.ru || c.value || ''}`.toLowerCase();
        if (this.badLuggageTerms.some(t => text.includes(t))) {
          return { type: 'bad_luggage', card: c };
        }
      }
    }

    for (const c of revealed) {
      if ((c.type || c.id) === 'age') {
        const num = parseInt(`${c.value?.ru || c.value || ''}`, 10);
        if (!isNaN(num) && num >= 68) {
          return { type: 'old_age', card: c };
        }
      }
    }

    return { type: 'generic', card: revealed[revealed.length - 1] };
  }

  chooseVotingTarget(room, bot) {
    const aliveTargets = room.players.filter(p => p.isAlive && p.id !== bot.id && !p.hasLeft && !p.hasImmunityThisRound);
    if (aliveTargets.length === 0) return null;

    const ranked = aliveTargets.map(player => {
      let risk = this.evaluatePlayerRisk(player, room.disaster, room.currentRound || 1);

      if (player.lastRoundVotedFor === bot.id) risk += 25;
      if (Array.isArray(bot.lastVotedAgainstBy) && bot.lastVotedAgainstBy.includes(player.id)) risk += 22;
      if (player.votedFor === bot.id) risk += 20;
      if (bot.lastRoundVotedFor && bot.lastRoundVotedFor === player.id) risk -= 22;

      const noise = (Math.random() - 0.5) * 14;
      return { player, finalScore: risk + noise };
    });

    ranked.sort((a, b) => b.finalScore - a.finalScore);

    if (ranked.length > 1 && Math.random() < 0.22) {
      return ranked[1].player;
    }
    return ranked[0].player;
  }

  // Короткие реплики при вскрытии карты (2-5 слов макс)
  generateRevealReaction(bot, card, room) {
    const type = card.type || card.id;
    const valRu = card.value?.ru || card.value || '';

    if (type === 'profession') {
      const goodProf = ['врач', 'инженер', 'строитель', 'агроном', 'военный', 'повар', 'электрик', 'хирург', 'медик', 'механик', 'биолог', 'химик', 'пожарный', 'фермер'];
      const isGood = goodProf.some(p => valRu.toLowerCase().includes(p));

      if (isGood) {
        const phrases = [
          { ru: `Топ профессия, я нужен.`, uz: `Zo'r kasb, men kerakman.`, en: `Top job, you need me.` },
          { ru: `Без меня бункер встанет.`, uz: `Mensiz bunker ishlamaydi.`, en: `Bunker needs my skills.` },
          { ru: `Полезная роль, не сливайте.`, uz: `Foydali kasb, tegmanglar.`, en: `Useful role, keep me.` },
          { ru: `Спец в команде — плюс.`, uz: `Mutaxassis borligi plyus.`, en: `Big plus for the team.` },
          { ru: `Опа, имба для бункера.`, uz: `Bunker uchun juda kerak.`, en: `Essential for the shelter.` },
          { ru: `Хорошая карта выпала.`, uz: `Yaxshi karta tushdi.`, en: `Pulled a great card.` },
          { ru: `Таких спецов сливать нельзя.`, uz: `Bunday ustani haydab bo'lmaydi.`, en: `Can't lose this skill.` },
          { ru: `Для выживания самое то.`, uz: `Omon qolish uchun ayni muddao.`, en: `Perfect for survival.` }
        ];
        return this.pickUniquePhrase(room, phrases, 'rev_prof_good');
      } else {
        const phrases = [
          { ru: `Зато остальные карты топ.`, uz: `Qolgan kartalarim kuchli.`, en: `My other cards are strong.` },
          { ru: `Не спешите меня сливать.`, uz: `Meni chiqarishga shoshilmang.`, en: `Don't vote me yet.` },
          { ru: `Дальше карты получше будут.`, uz: `Keyingi kartalarim zo'r.`, en: `Better cards coming next.` },
          { ru: `Профессия так себе, сорян.`, uz: `Kasbdan omad kelmadi.`, en: `Unlucky job roll.` },
          { ru: `Зато здоровье и багаж норм.`, uz: `Sog'ligim va yukim zo'r.`, en: `Health and gear are solid.` },
          { ru: `Работать руками тоже умею.`, uz: `Mehnatdan qochmayman.`, en: `I can still work hard.` }
        ];
        return this.pickUniquePhrase(room, phrases, 'rev_prof_weak');
      }
    }

    if (type === 'health') {
      const isBad = this.badHealthTerms.some(term => valRu.toLowerCase().includes(term));
      if (isBad) {
        const phrases = [
          { ru: `Не заразно, жить буду.`, uz: `Yuqumli emas, yashayman.`, en: `Not contagious, I'm fine.` },
          { ru: `Работать смогу без проблем.`, uz: `Bemalol ishlay olaman.`, en: `Can still work fine.` },
          { ru: `Врач в бункере подлечит.`, uz: `Shifokor davolab oladi.`, en: `Medic can fix this.` },
          { ru: `Ничего страшного, терпимо.`, uz: `Qo'rqinchli emas, chidasa bo'ladi.`, en: `Nothing fatal, manageable.` },
          { ru: `На работу не влияет.`, uz: `Ishga xalaqit bermaydi.`, en: `Won't affect my work.` }
        ];
        return this.pickUniquePhrase(room, phrases, 'rev_health_bad');
      } else {
        const phrases = [
          { ru: `Здоровье чистое, нулячий риск.`, uz: `Sog'ligim top-toza.`, en: `Clean health, zero risk.` },
          { ru: `Полностью здоров, это плюс.`, uz: `Mutlaqo sog'lomman.`, en: `Fully healthy, big plus.` },
          { ru: `Аптечку тратить не придётся.`, uz: `Menga dori ketmaydi.`, en: `Won't waste any meds.` },
          { ru: `Иммунитет в полном порядке.`, uz: `Immunitetim joyida.`, en: `Immunity is rock solid.` },
          { ru: `Медкарта идеальная.`, uz: `Tibbiy kartam a'lo.`, en: `Medical record is clean.` }
        ];
        return this.pickUniquePhrase(room, phrases, 'rev_health_good');
      }
    }

    if (type === 'luggage') {
      const isBad = this.badLuggageTerms.some(term => valRu.toLowerCase().includes(term));
      if (isBad) {
        const phrases = [
          { ru: `Багаж пустой, зато я полезен.`, uz: `Yuk oddiy, o'zim foydaliman.`, en: `Weak bag, useful skills.` },
          { ru: `С багажом не повезло.`, uz: `Yukdan omad kelmadi.`, en: `Unlucky luggage roll.` },
          { ru: `Зато навыки хорошие.`, uz: `Lekin mahoratim yaxshi.`, en: `My skills make up for it.` }
        ];
        return this.pickUniquePhrase(room, phrases, 'rev_lug_bad');
      } else {
        const phrases = [
          { ru: `Багаж топ, всем пригодится.`, uz: `Yukim zo'r, hammaga kerak.`, en: `Great gear for everyone.` },
          { ru: `Полезная вещь для бункера.`, uz: `Bunker uchun zarur narsa.`, en: `Useful item for the bunker.` },
          { ru: `Отдаю в общий запас.`, uz: `Umumiy zaxiraga beraman.`, en: `Sharing with the group.` },
          { ru: `Под землёй очень выручит.`, uz: `Yer ostida aniq asqotadi.`, en: `Will help underground.` }
        ];
        return this.pickUniquePhrase(room, phrases, 'rev_lug_good');
      }
    }

    const shortOther = [
      { ru: `Норм карта, пойдёт.`, uz: `Yaxshi karta, bo'ladi.`, en: `Decent card, works.` },
      { ru: `Тоже в плюс команде.`, uz: `Jamoaga yana bir plyus.`, en: `Another plus for us.` },
      { ru: `Неплохой бонус.`, uz: `Yaxshi bonus.`, en: `Nice little bonus.` },
      { ru: `Пригодится под землёй.`, uz: `Yer ostida kerak bo'ladi.`, en: `Useful down there.` }
    ];
    return this.pickUniquePhrase(room, shortOther, 'rev_other');
  }

  // Очень короткие фразы при голосовании (2-5 слов макс)
  generateVotingArgument(bot, target, room) {
    const keyTrait = this.findKeyTrait(target);

    // 1. Ответка
    if (target.lastRoundVotedFor === bot.id || target.votedFor === bot.id) {
      const revengePhrases = [
        { ru: `Ответка в ${target.name}.`, uz: `${target.name}ga javob ovozi.`, en: `Return vote on ${target.name}.` },
        { ru: `${target.name}, взаимный голос.`, uz: `${target.name}, o'zaro ovoz.`, en: `${target.name}, returning the vote.` },
        { ru: `Против ${target.name}, защищаюсь.`, uz: `${target.name}ga qarshi, himoya.`, en: `Against ${target.name}, self-defense.` },
        { ru: `${target.name} первый начал.`, uz: `${target.name} birinchi boshladi.`, en: `${target.name} started it.` }
      ];
      const pick = this.pickUniquePhrase(room, revengePhrases, 'vote_revenge');
      if (pick) return pick;
    }

    // 2. Болезнь
    if (keyTrait?.type === 'bad_health') {
      const phrases = [
        { ru: `Голос в ${target.name}, болезнь.`, uz: `${target.name}ga ovoz, kasal.`, en: `Voting ${target.name}, bad health.` },
        { ru: `Против ${target.name}, опасный диагноз.`, uz: `${target.name}ga qarshi, xavfli dard.`, en: `Against ${target.name}, risky illness.` },
        { ru: `Сливаю ${target.name}, здоровье слабое.`, uz: `${target.name}ni chiqaramiz, sog'lig'i zaif.`, en: `Out with ${target.name}, weak health.` },
        { ru: `${target.name} не выживет с болезнью.`, uz: `${target.name} kasallik bilan yasholmaydi.`, en: `${target.name} won't survive that illness.` },
        { ru: `Убираем ${target.name}, риск заразы.`, uz: `${target.name}ni olamiz, kasallik xavfi.`, en: `Cutting ${target.name}, health risk.` },
        { ru: `${target.name}, сорян, здоровье подводит.`, uz: `${target.name}, uzr, sog'lig'ing yomon.`, en: `Sorry ${target.name}, bad health card.` }
      ];
      const pick = this.pickUniquePhrase(room, phrases, 'vote_health');
      if (pick) return pick;
    }

    // 3. Слабая профессия
    if (keyTrait?.type === 'bad_profession') {
      const phrases = [
        { ru: `Голос в ${target.name}, бесполезная роль.`, uz: `${target.name}ga ovoz, foydasiz kasb.`, en: `Voting ${target.name}, useless job.` },
        { ru: `Против ${target.name}, нужны спецы.`, uz: `${target.name}ga qarshi, ustalar kerak.`, en: `Against ${target.name}, need specialists.` },
        { ru: `Сливаю ${target.name}, профессия слабая.`, uz: `${target.name}ni chiqaramiz, kasbi zaif.`, en: `Voting ${target.name}, weak profession.` },
        { ru: `${target.name} бункеру не поможет.`, uz: `${target.name} bunkerga yordam bermaydi.`, en: `${target.name} can't help the bunker.` },
        { ru: `${target.name} на выход, балласт.`, uz: `${target.name} chiqsin, foydasi kam.`, en: `${target.name} out, zero utility.` },
        { ru: `Минус ${target.name}, роль не для бункера.`, uz: `Minus ${target.name}, bunkerbop emas.`, en: `Minus ${target.name}, bad role.` }
      ];
      const pick = this.pickUniquePhrase(room, phrases, 'vote_prof');
      if (pick) return pick;
    }

    // 4. Короткие общие (2-4 слова)
    const genericPhrases = [
      { ru: `Голосую против ${target.name}.`, uz: `${target.name}ga qarshi ovoz.`, en: `Voting against ${target.name}.` },
      { ru: `Мой голос в ${target.name}.`, uz: `Ovozim ${target.name}ga.`, en: `My vote is ${target.name}.` },
      { ru: `Сливаем ${target.name}, слабые карты.`, uz: `${target.name}ni chiqaramiz, kartasi zaif.`, en: `Voting ${target.name}, weak cards.` },
      { ru: `${target.name}, ничего личного.`, uz: `${target.name}, xafa bo'lma.`, en: `${target.name}, nothing personal.` },
      { ru: `Пусть будет ${target.name}.`, uz: `Mayli, ${target.name} bo'lsin.`, en: `Going with ${target.name}.` },
      { ru: `Кидаю голос в ${target.name}.`, uz: `${target.name}ni tanladim.`, en: `Putting vote on ${target.name}.` },
      { ru: `Против ${target.name}, мало пользы.`, uz: `${target.name}ga qarshi, foydasi kam.`, en: `Against ${target.name}, low utility.` },
      { ru: `${target.name} — слабое звено.`, uz: `${target.name} — eng zaif nomzod.`, en: `${target.name} is the weakest link.` },
      { ru: `Выбираю ${target.name} в этом круге.`, uz: `Bu safar ${target.name}.`, en: `Picking ${target.name} this round.` },
      { ru: `${target.name}, сорян, мест мало.`, uz: `${target.name}, uzr, joy kam.`, en: `Sorry ${target.name}, no room.` }
    ];
    return this.pickUniquePhrase(room, genericPhrases, 'vote_generic');
  }

  // Короткие реакции на изгнание (2-4 слова)
  generateExileReaction(exiledPlayer, isBotExiled, room = null) {
    if (isBotExiled) {
      const phrases = [
        { ru: `Зря вы так, удачи.`, uz: `Bekor qildingiz, omad.`, en: `Big mistake, good luck.` },
        { ru: `Ошиблись вы, ребята.`, uz: `Adashdinglar, bolalar.`, en: `Wrong move, guys.` },
        { ru: `Без меня не выживете.`, uz: `Mensiz qiynalasizlar.`, en: `Good luck without me.` },
        { ru: `Ну ладно, посмотрим.`, uz: `Mayli, ko'ramiz.`, en: `Alright, we'll see.` },
        { ru: `Зря слили полезного.`, uz: `Foydali odamni haydadingiz.`, en: `Wasted a good survivor.` },
        { ru: `Удачи в бункере.`, uz: `Bunkerda omad.`, en: `Good luck down there.` }
      ];
      return this.pickUniquePhrase(room, phrases, 'exile_self');
    } else {
      const phrases = [
        { ru: `Логично, идём дальше.`, uz: `Mantiqiy, davom etamiz.`, en: `Makes sense, moving on.` },
        { ru: `Минус один.`, uz: `Minus bitta.`, en: `One down.` },
        { ru: `Справедливо.`, uz: `Adolatli qaror.`, en: `Fair enough.` },
        { ru: `Мест всё меньше.`, uz: `Joy kamayib boryapti.`, en: `Fewer spots left.` },
        { ru: `Правильный выбор.`, uz: `To'g'ri tanlov.`, en: `Right choice.` },
        { ru: `Едем дальше.`, uz: `Keyingi raundga.`, en: `Onto the next.` }
      ];
      return this.pickUniquePhrase(room, phrases, 'exile_other');
    }
  }

  // Короткие реплики в дискуссии (2-5 слов)
  generateDiscussionRemark(bot, room) {
    const aliveOthers = room.players.filter(p => p.isAlive && p.id !== bot.id && !p.hasLeft);
    if (aliveOthers.length === 0) return null;

    const candidates = [];

    const diseased = aliveOthers.find(p => {
      const hCard = (p.deck || []).find(c => c.revealed && (c.type || c.id) === 'health');
      if (!hCard) return false;
      const text = `${hCard.value?.ru || hCard.value || ''}`.toLowerCase();
      return this.badHealthTerms.some(t => text.includes(t));
    });

    if (diseased) {
      candidates.push(
        { _tplKey: 'd_h0', ru: `У ${diseased.name} опасная болезнь.`, uz: `${diseased.name}da xavfli kasallik bor.`, en: `${diseased.name} has a bad illness.` },
        { _tplKey: 'd_h1', ru: `${diseased.name} по здоровью не проходит.`, uz: `${diseased.name} sog'lig'i bo'yicha o'tmaydi.`, en: `${diseased.name} fails the health check.` }
      );
    }

    const uselessProf = aliveOthers.find(p => {
      const pCard = (p.deck || []).find(c => c.revealed && (c.type || c.id) === 'profession');
      if (!pCard) return false;
      const text = `${pCard.value?.ru || pCard.value || ''}`.toLowerCase();
      return Object.entries(this.professionRanks).some(([k, w]) => w >= 28 && (text.includes(k) || this.matchesProfessionKey(text, k)));
    });

    if (uselessProf) {
      candidates.push(
        { _tplKey: 'd_p0', ru: `У ${uselessProf.name} слабая профессия.`, uz: `${uselessProf.name}ning kasbi kuchsiz.`, en: `${uselessProf.name} has a weak job.` },
        { _tplKey: 'd_p1', ru: `Зачем нам ${uselessProf.name}?`, uz: `${uselessProf.name} bizga nega kerak?`, en: `Why keep ${uselessProf.name}?` }
      );
    }

    candidates.push(
      { _tplKey: 'd_g0', ru: `Кого сливаем в этом круге?`, uz: `Bu safar kimni chiqaramiz?`, en: `Who are we voting out?` },
      { _tplKey: 'd_g1', ru: `Врачей и техников оставляем.`, uz: `Shifokor va ustalarni qoldiramiz.`, en: `Keep medics and engineers.` },
      { _tplKey: 'd_g2', ru: `Смотрите на здоровье и профессии.`, uz: `Sog'liq va kasbga qaranglar.`, en: `Check health and jobs.` },
      { _tplKey: 'd_g3', ru: `Кто сейчас самый слабый?`, uz: `Hozir kim eng zaif?`, en: `Who's the weakest now?` },
      { _tplKey: 'd_g4', ru: `Голосуем по фактам.`, uz: `Faktlar bo'yicha ovoz beramiz.`, en: `Vote based on cards.` },
      { _tplKey: 'd_g5', ru: `Балласт надо убирать.`, uz: `Ortiqchalarni chiqarish kerak.`, en: `Time to cut dead weight.` }
    );

    return this.pickUniquePhrase(room, candidates, 'disc');
  }

  // Короткие ответы игрокам (2-5 слов)
  generateChatReply(bot, sender, incomingText, room) {
    if (!incomingText) return null;
    const txt = incomingText.toLowerCase();

    // 1. "кого", "кто", "сливаем", "голос", "kim", "who"
    if (txt.includes('кого') || txt.includes('кто') || txt.includes('кому') || txt.includes('слива') || txt.includes('кика') || txt.includes('голос') || txt.includes('who') || txt.includes('kim') || txt.includes('ovoz')) {
      const target = this.chooseVotingTarget(room, bot);
      if (target) {
        const whoPhrases = [
          { ru: `Думаю, ${target.name}.`, uz: `Menimcha, ${target.name}.`, en: `I think ${target.name}.` },
          { ru: `Голосуем за ${target.name}.`, uz: `${target.name}ga ovoz beramiz.`, en: `Let's vote ${target.name}.` },
          { ru: `Я против ${target.name}.`, uz: `Men ${target.name}ga qarshiman.`, en: `I'm voting ${target.name}.` },
          { ru: `Сливаем ${target.name}, слабые карты.`, uz: `${target.name}ni chiqaramiz, kartasi zaif.`, en: `Vote ${target.name}, weak cards.` },
          { ru: `${target.name} — главный кандидат.`, uz: `${target.name} — asosiy nomzod.`, en: `${target.name} is the main target.` },
          { ru: `Давайте ${target.name}.`, uz: `Kelinglar, ${target.name}.`, en: `Let's go with ${target.name}.` }
        ];
        const pick = this.pickUniquePhrase(room, whoPhrases, 'rep_who');
        if (pick) return pick;
      }
    }

    // 2. "почему", "за что", "nega", "why"
    if (txt.includes('почему') || txt.includes('за что') || txt.includes('зачем') || txt.includes('nima uchun') || txt.includes('nega') || txt.includes('why')) {
      const whyPhrases = [
        { ru: `Слабые карты для бункера.`, uz: `Bunker uchun kartasi zaif.`, en: `Weak cards for the bunker.` },
        { ru: `Чисто по характеристикам.`, uz: `Faqat kartalarga qarab.`, en: `Purely based on stats.` },
        { ru: `Мест на всех не хватит.`, uz: `Joy hammaga yetmaydi.`, en: `Not enough spots.` },
        { ru: `У других карты полезнее.`, uz: `Boshqalarning kartasi foydaliroq.`, en: `Others have better cards.` },
        { ru: `Ничего личного, расчёт.`, uz: `Xafa bo'lish yo'q, hisob-kitob.`, en: `Nothing personal, just math.` }
      ];
      const pick = this.pickUniquePhrase(room, whyPhrases, 'rep_why');
      if (pick) return pick;
    }

    // 3. "не сливайте", "не меня", "meni tegmang"
    if (txt.includes('не слива') || txt.includes('не голосуй') || txt.includes('не меня') || txt.includes('я полез') || txt.includes('я нуж') || txt.includes('meni tegmang') || txt.includes('dont vote') || txt.includes('don\'t vote')) {
      const defPhrases = [
        { ru: `Покажи следующие карты.`, uz: `Keyingi kartangni och.`, en: `Show your next cards.` },
        { ru: `Посмотрим на твои карты.`, uz: `Kartalaringga qaraymiz.`, en: `We'll judge by your cards.` },
        { ru: `Докажи пользой на столе.`, uz: `Amalda isbotla.`, en: `Prove it on the table.` },
        { ru: `Пока доверия мало.`, uz: `Hozircha ishonch kam.`, en: `Not convinced yet.` }
      ];
      const pick = this.pickUniquePhrase(room, defPhrases, 'rep_def');
      if (pick) return pick;
    }

    // 4. Упоминание бота
    if (txt.includes(bot.name.toLowerCase()) || txt.includes('бот') || txt.includes('bot')) {
      const botPhrases = [
        { ru: `Я тут, играю по картам.`, uz: `Shu yerdaman, o'ynayapman.`, en: `I'm here, playing smart.` },
        { ru: `У меня хорошие карты.`, uz: `Kartalarim yaxshi.`, en: `My deck is solid.` },
        { ru: `Меня сливать нет смысла.`, uz: `Meni chiqarish xato.`, en: `No point voting me.` },
        { ru: `Я бункеру точно пригожусь.`, uz: `Bunkerga foydam tegadi.`, en: `I'm useful to the bunker.` }
      ];
      const pick = this.pickUniquePhrase(room, botPhrases, 'rep_bot');
      if (pick) return pick;
    }

    // 5. Короткие общие ответы (1-3 слова)
    const generalReplies = [
      { ru: `Согласен.`, uz: `Qo'shilaman.`, en: `Agreed.` },
      { ru: `По факту.`, uz: `To'g'ri gap.`, en: `Facts.` },
      { ru: `Логично.`, uz: `Mantiqiy.`, en: `Makes sense.` },
      { ru: `Посмотрим по голосам.`, uz: `Ovozlarni ko'ramiz.`, en: `We'll see in the vote.` },
      { ru: `Есть такое.`, uz: `Shunaqa.`, en: `True that.` },
      { ru: `Спорно, конечно.`, uz: `Bahsli masala.`, en: `Debatable.` },
      { ru: `Надо думать.`, uz: `O'ylab ko'rish kerak.`, en: `Need to think.` },
      { ru: `Время покажет.`, uz: `Vaqt ko'rsatadi.`, en: `Time will tell.` }
    ];
    return this.pickUniquePhrase(room, generalReplies, 'rep_gen');
  }
}

const botAiManager = new BotAiManager();

module.exports = {
  BotAiManager,
  botAiManager
};
