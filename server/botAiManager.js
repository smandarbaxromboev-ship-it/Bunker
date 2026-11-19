// Advanced Human-Like Bot AI Engine for "Бункер: 7 Раундов Откровений"
// Features strict anti-repetition memory (never repeats templates or phrases in a match),
// 180+ short, natural gamer phrases (RU, UZ, EN), disaster awareness, and smart card voting.

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

  // Строгий фильтр уникальности: гарантирует, что один и тот же шаблон или текст НЕ повторится в комнате
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
      return null; // Лучше промолчать, чем повторять одно и то же!
    }

    const chosen = unused[Math.floor(Math.random() * unused.length)];
    room.usedBotPhrases.add(chosen._tplKey);
    room.usedBotPhrases.add(chosen.ru);
    return { ru: chosen.ru, uz: chosen.uz, en: chosen.en };
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

  // Определение ключевой определяющей карты игрока
  findKeyTrait(player) {
    if (!player || !player.deck) return null;
    const revealed = player.deck.filter(c => c.revealed);
    if (revealed.length === 0) return null;

    // 1. Опасные болезни
    for (const c of revealed) {
      if ((c.type || c.id) === 'health') {
        const text = `${c.value?.ru || c.value || ''}`.toLowerCase();
        if (this.badHealthTerms.some(t => text.includes(t))) {
          return { type: 'bad_health', card: c };
        }
      }
    }

    // 2. Бесполезные профессии
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

    // 3. Плохой багаж
    for (const c of revealed) {
      if ((c.type || c.id) === 'luggage') {
        const text = `${c.value?.ru || c.value || ''}`.toLowerCase();
        if (this.badLuggageTerms.some(t => text.includes(t))) {
          return { type: 'bad_luggage', card: c };
        }
      }
    }

    // 4. Критический возраст
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

  // Умный выбор цели голосования с памятью и оценкой карт
  chooseVotingTarget(room, bot) {
    const aliveTargets = room.players.filter(p => p.isAlive && p.id !== bot.id && !p.hasLeft && !p.hasImmunityThisRound);
    if (aliveTargets.length === 0) return null;

    const ranked = aliveTargets.map(player => {
      let risk = this.evaluatePlayerRisk(player, room.disaster, room.currentRound || 1);

      if (player.lastRoundVotedFor === bot.id) {
        risk += 25;
      }
      if (Array.isArray(bot.lastVotedAgainstBy) && bot.lastVotedAgainstBy.includes(player.id)) {
        risk += 22;
      }
      if (player.votedFor === bot.id) {
        risk += 20;
      }

      if (bot.lastRoundVotedFor && bot.lastRoundVotedFor === player.id) {
        risk -= 22;
      }

      const noise = (Math.random() - 0.5) * 14;
      return { player, finalScore: risk + noise };
    });

    ranked.sort((a, b) => b.finalScore - a.finalScore);

    if (ranked.length > 1 && Math.random() < 0.22) {
      return ranked[1].player;
    }
    return ranked[0].player;
  }

  // Разнообразные короткие реакции на вскрытие своей карты (никогда не повторяются в рамках матча)
  generateRevealReaction(bot, card, room) {
    const type = card.type || card.id;
    const valRu = card.value?.ru || card.value || '';
    const valUz = card.value?.uz || valRu;
    const valEn = card.value?.en || valRu;

    if (type === 'profession') {
      const goodProf = ['врач', 'инженер', 'строитель', 'агроном', 'военный', 'повар', 'электрик', 'хирург', 'медик', 'механик', 'биолог', 'химик', 'пожарный', 'фермер'];
      const isGood = goodProf.some(p => valRu.toLowerCase().includes(p));

      if (isGood) {
        const phrases = [
          {
            ru: `«${valRu}» — без меня бункер долго не протянет.`,
            uz: `«${valUz}» — mensiz bunker uzoqqa bormaydi.`,
            en: `"${valEn}" — the shelter won't last long without me.`
          },
          {
            ru: `Я «${valRu}», такие руки на станции на вес золота.`,
            uz: `Men «${valUz}»man, bunday mutaxassis oltinaga teng.`,
            en: `I'm a "${valEn}", skills like mine are pure gold down here.`
          },
          {
            ru: `Повезло с профессией: «${valRu}». Точно пригожусь.`,
            uz: `Kasbim zo'r chiqdi: «${valUz}». Aniq foydam tegadi.`,
            en: `Lucky profession: "${valEn}". Definitely useful.`
          },
          {
            ru: `«${valRu}» в команде — плюс к выживанию всех.`,
            uz: `Jamoada «${valUz}» borligi — hammamiz uchun plyus.`,
            en: `Having a "${valEn}" boosts survival for everyone.`
          },
          {
            ru: `С профессией «${valRu}» меня сливать точно нельзя.`,
            uz: `«${valUz}» kasbi bilan meni chiqarib yuborish xato bo'ladi.`,
            en: `With "${valEn}", voting me out would be a huge mistake.`
          },
          {
            ru: `Опа, «${valRu}». Буду держать бункер в порядке.`,
            uz: `Opa, «${valUz}». Bunkerni tartibda ushlab turaman.`,
            en: `Nice, "${valEn}". I'll keep the shelter running smoothly.`
          },
          {
            ru: `Профессия «${valRu}» — база для выживания.`,
            uz: `«${valUz}» kasbi — omon qolish uchun asos.`,
            en: `"${valEn}" is fundamental for survival.`
          },
          {
            ru: `Кем-кем, а картой «${valRu}» разбрасываться глупо.`,
            uz: `«${valUz}» kabi mutaxassisni yo'qotish aqlsizlik.`,
            en: `Throwing away a "${valEn}" would be reckless.`
          },
          {
            ru: `Специальность «${valRu}» закроет кучу проблем под землёй.`,
            uz: `«${valUz}» yer ostida ko'p muammolarni hal qiladi.`,
            en: `"${valEn}" will solve plenty of underground problems.`
          },
          {
            ru: `Навыки «${valRu}» спасут нам жизнь после закрытия шлюза.`,
            uz: `«${valUz}» mahorati eshiklar yopilgach hayotimizni saqlaydi.`,
            en: `"${valEn}" skills will save our lives once the hatch closes.`
          }
        ];
        return this.pickUniquePhrase(room, phrases, 'rev_prof_good');
      } else {
        const phrases = [
          {
            ru: `Да, я «${valRu}», зато остальные карты у меня мощные.`,
            uz: `Ha, «${valUz}»man, lekin qolgan kartalarim kuchli.`,
            en: `Yeah, I'm a "${valEn}", but my other cards are strong.`
          },
          {
            ru: `Не судите только по профессии, багаж и здоровье вытянут.`,
            uz: `Faqat kasbga qaramanglar, yukim va sog'ligim zo'r.`,
            en: `Don't judge just by the job, my health and gear make up for it.`
          },
          {
            ru: `Профессия мирная («${valRu}»), но работать руками умею.`,
            uz: `Kasbim tinch («${valUz}»), lekin mehnatdan qochmayman.`,
            en: `Peaceful job ("${valEn}"), but I know how to work hard.`
          },
          {
            ru: `Карта «${valRu}» не приговор, дождитесь следующих раундов.`,
            uz: `«${valUz}» hukm emas, keyingi raundlarni ko'ringlar.`,
            en: `"${valEn}" isn't the end, wait for my next cards.`
          },
          {
            ru: `В бункере не только технари нужны, я быстро учусь.`,
            uz: `Bunkerda tez o'rganadigan odamlar ham kerak.`,
            en: `I'm a fast learner, every extra pair of hands counts.`
          },
          {
            ru: `С профессией не повезло, но сливать меня рано.`,
            uz: `Kasbdan omad kelmadi, lekin meni chiqarishga erta.`,
            en: `Unlucky job roll, but it's too early to vote me out.`
          },
          {
            ru: `Зато у меня козыри в запасе, не спешите с выводами.`,
            uz: `Zaxiramda kuchli kartalar bor, shoshilmanglar.`,
            en: `I've got strong cards in reserve, don't rush.`
          },
          {
            ru: `«${valRu}» — звучит спорно, но я полностью здоров.`,
            uz: `«${valUz}» — bahsli, lekin sog'ligim joyida.`,
            en: `"${valEn}" sounds questionable, but I'm fit and ready.`
          }
        ];
        return this.pickUniquePhrase(room, phrases, 'rev_prof_weak');
      }
    }

    if (type === 'health') {
      const isBad = this.badHealthTerms.some(term => valRu.toLowerCase().includes(term));
      if (isBad) {
        const phrases = [
          {
            ru: `Диагноз «${valRu}» не заразный, работать смогу.`,
            uz: `«${valUz}» yuqumli emas, ishlay olaman.`,
            en: `"${valEn}" isn't contagious, I can still work.`
          },
          {
            ru: `Со здоровьем не идеал, но на ногах стою крепко.`,
            uz: `Sog'liq ideal emas, lekin oyoqda mahkam turibman.`,
            en: `Health isn't perfect, but I'm standing strong.`
          },
          {
            ru: `С этим живут годами, для бункера я не угроза.`,
            uz: `Bu bilan yillar davomida yashasa bo'ladi, xavfli emasman.`,
            en: `People live with this for years, I'm not a threat.`
          },
          {
            ru: `Главное, если в бункере есть врач — меня подлечат.`,
            uz: `Bunkerda shifokor bo'lsa, meni davolab oladi.`,
            en: `If we keep a doctor in the shelter, this is easily managed.`
          },
          {
            ru: `Болячка неприятная, зато мои навыки всё окупят.`,
            uz: `Kasallik yoqimsiz, lekin mahoratim buni qoplaydi.`,
            en: `Unpleasant condition, but my skills compensate for it.`
          },
          {
            ru: `Не паникуйте из-за карты «${valRu}», я под контролем.`,
            uz: `«${valUz}» deb vahima qilmanglar, hammasi nazoratda.`,
            en: `Don't panic over "${valEn}", it's under control.`
          },
          {
            ru: `Да, «${valRu}», но руки и голова работают отлично.`,
            uz: `Ha, «${valUz}», lekin qo'lim va boshim yaxshi ishlaydi.`,
            en: `Yes, "${valEn}", but my hands and head work fine.`
          }
        ];
        return this.pickUniquePhrase(room, phrases, 'rev_health_bad');
      } else {
        const phrases = [
          {
            ru: `По здоровью — «${valRu}». Никакой угрозы для команды.`,
            uz: `Sog'ligim — «${valUz}». Jamoa uchun hech qanday xavf yo'q.`,
            en: `Health status: "${valEn}". Zero threat to the team.`
          },
          {
            ru: `Медкарта отличная, лекарства на меня тратить не придётся.`,
            uz: `Tibbiy kartam a'lo, menga dori sarflash shart emas.`,
            en: `Medical record is clean, won't waste any meds on me.`
          },
          {
            ru: `Здоров, вынослив, готов пахать в две смены.`,
            uz: `Sog'lomman, ikki smenada ishlashga tayyorman.`,
            en: `Healthy and tough, ready to work double shifts.`
          },
          {
            ru: `«${valRu}» — в закрытом бункере это огромный плюс.`,
            uz: `«${valUz}» — yopiq bunkerda bu katta ustunlik.`,
            en: `"${valEn}" is a massive advantage in an enclosed shelter.`
          },
          {
            ru: `Ни вирусов, ни хроники. Чистое здоровье.`,
            uz: `Na virus, na surunkali kasallik bor. Top-toza.`,
            en: `No viruses, no chronic issues. Clean health.`
          },
          {
            ru: `Организм крепкий («${valRu}»), переживу любую зиму.`,
            uz: `Organizm baquvvat («${valUz}»), har qanday qishdan chiqaman.`,
            en: `Strong constitution ("${valEn}"), built to survive.`
          },
          {
            ru: `За моё здоровье можете не переживать, обузой не стану.`,
            uz: `Sog'ligimdan xavotir olmang, ortiqcha yuk bo'lmayman.`,
            en: `No need to worry about my health, I won't be a burden.`
          }
        ];
        return this.pickUniquePhrase(room, phrases, 'rev_health_good');
      }
    }

    if (type === 'luggage') {
      const isBad = this.badLuggageTerms.some(term => valRu.toLowerCase().includes(term));
      if (isBad) {
        const phrases = [
          {
            ru: `В спешке схватил «${valRu}», зато сам я полезный.`,
            uz: `Shoshilib «${valUz}» olibman, lekin o'zim foydaliman.`,
            en: `Grabbed "${valEn}" in a rush, but my skills are solid.`
          },
          {
            ru: `Багаж не очень, но ведь в бункер берут людей, а не сумки.`,
            uz: `Yukim oddiy, lekin bunkerga sumkani emas, odamni olasizlar.`,
            en: `Weak luggage, but you're picking survivors, not bags.`
          },
          {
            ru: `Да, «${valRu}» не спасёт, компенсирую работой.`,
            uz: `Ha, «${valUz}» yordam bermaydi, mehnat bilan qoplayman.`,
            en: `Sure, "${valEn}" won't save us, I'll make up for it with work.`
          },
          {
            ru: `С багажом не фартануло, смотрите на мои основные карты.`,
            uz: `Yukdan omad kelmadi, asosiy kartalarimga qaranglar.`,
            en: `Unlucky luggage roll, look at my primary traits instead.`
          },
          {
            ru: `«${valRu}» — мелочь, главное что я здоров и адекватен.`,
            uz: `«${valUz}» — mayda narsa, asosiysi sog'lomman.`,
            en: `"${valEn}" is minor, what matters is I'm healthy and capable.`
          }
        ];
        return this.pickUniquePhrase(room, phrases, 'rev_lug_bad');
      } else {
        const phrases = [
          {
            ru: `Взял с собой «${valRu}» — отдаю в общий фонд бункера.`,
            uz: `O'zim bilan «${valUz}» oldim — umumiy foydalanishga beraman.`,
            en: `Brought "${valEn}" — sharing it with the whole shelter.`
          },
          {
            ru: `«${valRu}» в багаже. Под землёй вещь незаменимая.`,
            uz: `Yukimda «${valUz}» bor. Yer ostida juda zarur narsa.`,
            en: `"${valEn}" in my luggage. Essential underground.`
          },
          {
            ru: `С моим багажом («${valRu}») шансы выжить куда выше.`,
            uz: `Mening yukim («${valUz}») bilan omon qolish osonlashadi.`,
            en: `With my gear ("${valEn}"), our survival odds jump up.`
          },
          {
            ru: `«${valRu}» — отличный бонус к моим навыкам.`,
            uz: `«${valUz}» — mahoratimga ajoyib qo'shimcha.`,
            en: `"${valEn}" is a great bonus on top of my skills.`
          },
          {
            ru: `Кто меня выгонит — лишит бункер «${valRu}». Думайте.`,
            uz: `Meni haydasangiz, bunkerni «${valUz}»siz qoldirasiz.`,
            en: `Exile me and you lose "${valEn}". Think twice.`
          },
          {
            ru: `Багаж «${valRu}» точно пригодится в первые месяцы.`,
            uz: `«${valUz}» birinchi oylarda juda qo'l keladi.`,
            en: `"${valEn}" will come in clutch during the first months.`
          },
          {
            ru: `Вот это подгон для команды: «${valRu}».`,
            uz: `Jamoa uchun zo'r sovg'a: «${valUz}».`,
            en: `Huge asset for the group: "${valEn}".`
          }
        ];
        return this.pickUniquePhrase(room, phrases, 'rev_lug_good');
      }
    }

    if (type === 'age') {
      const phrases = [
        {
          ru: `Возраст «${valRu}» — сил и опыта предостаточно.`,
          uz: `Yoshim «${valUz}» — kuch va tajriba yetarli.`,
          en: `Age "${valEn}" — plenty of strength and experience.`
        },
        {
          ru: `Самый рабочий возраст («${valRu}»), выдержу любые нагрузки.`,
          uz: `Ayni ishlaydigan yosh («${valUz}»), har qanday yukka chidayman.`,
          en: `Prime working condition ("${valEn}"), ready for heavy duty.`
        },
        {
          ru: `По возрасту («${valRu}») никаких проблем, голова ясная.`,
          uz: `Yosh bo'yicha («${valUz}») muammo yo'q, fikrim tiniq.`,
          en: `At "${valEn}", my mind is sharp and steady.`
        },
        {
          ru: `«${valRu}» — жизненного опыта хватит на весь бункер.`,
          uz: `«${valUz}» — hayotiy tajribam butun bunkerga yetadi.`,
          en: `"${valEn}" — enough life experience for the whole bunker.`
        }
      ];
      return this.pickUniquePhrase(room, phrases, 'rev_age');
    }

    // Хобби / Факт / Биология
    const otherPhrases = [
      {
        ru: `«${valRu}» — ещё один плюс в мою копилку.`,
        uz: `«${valUz}» — mening foydamga yana bir plyus.`,
        en: `"${valEn}" — one more point in my favor.`
      },
      {
        ru: `Карта «${valRu}» в долгой изоляции точно выручит.`,
        uz: `«${valUz}» uzoq izolyatsiyada aniq asqotadi.`,
        en: `"${valEn}" will definitely help during long isolation.`
      },
      {
        ru: `Неплохая характеристика («${valRu}»), лишней не будет.`,
        uz: `Yaxshi xususiyat («${valUz}»), ortiqchalik qilmaydi.`,
        en: `Solid trait ("${valEn}"), always good to have.`
      },
      {
        ru: `Как видите, с картой «${valRu}» я вполне надёжный сосед.`,
        uz: `Ko'rib turganingizdek, «${valUz}» bilan ishonchli sherikman.`,
        en: `As you can see with "${valEn}", I'm a reliable teammate.`
      },
      {
        ru: `«${valRu}» — интересный штрих к моему профилю.`,
        uz: `«${valUz}» — profilimga qiziqarli qo'shimcha.`,
        en: `"${valEn}" adds a nice edge to my profile.`
      }
    ];
    return this.pickUniquePhrase(room, otherPhrases, 'rev_other');
  }

  // Разнообразные короткие аргументы при голосовании (100% без повторов шаблонов в матче)
  generateVotingArgument(bot, target, room) {
    const keyTrait = this.findKeyTrait(target);
    const cardRu = keyTrait?.card ? (keyTrait.card.value?.ru || keyTrait.card.value) : '';
    const cardUz = keyTrait?.card ? (keyTrait.card.value?.uz || cardRu) : '';
    const cardEn = keyTrait?.card ? (keyTrait.card.value?.en || cardRu) : '';
    const cap = room.bunkerCapacity || 2;

    // 1. Ответка, если цель голосовала против бота
    if (target.lastRoundVotedFor === bot.id || target.votedFor === bot.id) {
      const revengePhrases = [
        {
          ru: `Ответный голос в ${target.name}. Не надо было меня топить.`,
          uz: `${target.name}ga javob ovozi. Menga qarshi chiqmaslik kerak edi.`,
          en: `Return vote on ${target.name}. Shouldn't have targeted me.`
        },
        {
          ru: `${target.name} голосует против меня — я возвращаю должок.`,
          uz: `${target.name} menga ovoz berdi — men ham javob qaytaraman.`,
          en: `${target.name} voted against me — returning the favor.`
        },
        {
          ru: `Летит ответка в ${target.name}. Мои карты полезнее твоих.`,
          uz: `${target.name}ga javob. Mening kartalarim senikidan foydaliroq.`,
          en: `Hitting back at ${target.name}. My deck is stronger than yours.`
        },
        {
          ru: `Против ${target.name}. Самооборона, ничего личного.`,
          uz: `${target.name}ga qarshi. O'zimni himoya qilyapman.`,
          en: `Against ${target.name}. Pure self-defense.`
        },
        {
          ru: `Раз ${target.name} хочет меня слить, голосую взаимно.`,
          uz: `${target.name} meni chiqarmoqchi bo'lsa, ovozim unga.`,
          en: `Since ${target.name} wants me out, my vote goes right back.`
        }
      ];
      const pick = this.pickUniquePhrase(room, revengePhrases, 'vote_revenge');
      if (pick) return pick;
    }

    // 2. Плохое здоровье
    if (keyTrait?.type === 'bad_health') {
      const phrases = [
        {
          ru: `Голос в ${target.name}. Болезнь «${cardRu}» опасна для бункера.`,
          uz: `${target.name}ga ovoz. «${cardUz}» kasalligi bunkerga xavf tug'diradi.`,
          en: `Voting ${target.name}. "${cardEn}" is too dangerous for the shelter.`
        },
        {
          ru: `Сливаю ${target.name}. С диагнозом «${cardRu}» под землёй не выжить.`,
          uz: `${target.name}ni chiqaramiz. «${cardUz}» bilan yer ostida yashab bo'lmaydi.`,
          en: `Eliminating ${target.name}. Can't survive underground with "${cardEn}".`
        },
        {
          ru: `Против ${target.name}. На «${cardRu}» у нас не хватит медикаментов.`,
          uz: `${target.name}ga qarshi. «${cardUz}» uchun dori-darmon yetmaydi.`,
          en: `Against ${target.name}. We don't have enough medical supplies for "${cardEn}".`
        },
        {
          ru: `Убираем ${target.name}, здоровье («${cardRu}») подведёт в критический момент.`,
          uz: `${target.name}ni olib tashlaymiz, «${cardUz}» og'ir paytda pand beradi.`,
          en: `Cutting ${target.name}, "${cardEn}" will fail us at a critical moment.`
        },
        {
          ru: `Мой голос — ${target.name}. Рисковать с «${cardRu}» в замкнутом пространстве нельзя.`,
          uz: `Ovozim — ${target.name}. Yopiq joyda «${cardUz}» bilan tavakkal qilib bo'lmaydi.`,
          en: `My vote is ${target.name}. Can't risk "${cardEn}" in tight quarters.`
        },
        {
          ru: `Извини, ${target.name}, но карта «${cardRu}» — это слабейшее место.`,
          uz: `Uzr, ${target.name}, lekin «${cardUz}» — eng zaif nuqta.`,
          en: `Sorry ${target.name}, but "${cardEn}" is a major liability.`
        },
        {
          ru: `${target.name}, без обид, в бункер нужны полностью здоровые.`,
          uz: `${target.name}, xafa bo'lma, bunkerga sog'lom odamlar kerak.`,
          en: `No hard feelings ${target.name}, we need healthy survivors.`
        },
        {
          ru: `Кидаю голос в ${target.name} из-за проблемы со здоровьем («${cardRu}»).`,
          uz: `Sog'ligidagi muammo («${cardUz}») sababli ovozim ${target.name}ga.`,
          en: `Putting my vote on ${target.name} due to "${cardEn}".`
        }
      ];
      const pick = this.pickUniquePhrase(room, phrases, 'vote_health');
      if (pick) return pick;
    }

    // 3. Бесполезная профессия
    if (keyTrait?.type === 'bad_profession') {
      const phrases = [
        {
          ru: `Голосую за ${target.name}. «${cardRu}» нам в бункере не поможет.`,
          uz: `${target.name}ga ovoz. «${cardUz}» bunkerda yordam bermaydi.`,
          en: `Voting ${target.name}. "${cardEn}" won't help us down there.`
        },
        {
          ru: `${target.name}, сорян, но профессия «${cardRu}» бесполезна для базы.`,
          uz: `${target.name}, uzr, lekin «${cardUz}» kasbi baza uchun keraksiz.`,
          en: `${target.name}, sorry, but "${cardEn}" has zero value for the base.`
        },
        {
          ru: `Против ${target.name}. Вместо «${cardRu}» лучше оставить технарей.`,
          uz: `${target.name}ga qarshi. «${cardUz}» o'rniga texniklarni qoldirgan ma'qul.`,
          en: `Against ${target.name}. Better to keep technicians than a "${cardEn}".`
        },
        {
          ru: `Сливаю ${target.name}, от специальности «${cardRu}» выживаемости ноль.`,
          uz: `${target.name}ni chiqaramiz, «${cardUz}» kasbidan foyda yo'q.`,
          en: `Voting out ${target.name}, "${cardEn}" adds zero survival value.`
        },
        {
          ru: `Мой выбор — ${target.name}. «${cardRu}» не починит фильтры и генератор.`,
          uz: `Tanlovim — ${target.name}. «${cardUz}» filtr va generatorni tuzatolmaydi.`,
          en: `My pick is ${target.name}. A "${cardEn}" can't fix filters or generators.`
        },
        {
          ru: `${target.name} на выход. С картой «${cardRu}» в катастрофу делать нечего.`,
          uz: `${target.name} chiqsin. «${cardUz}» bilan falokatda ish bitmaydi.`,
          en: `${target.name} has to go. "${cardEn}" won't cut it in an apocalypse.`
        },
        {
          ru: `Голос против ${target.name}. Нужны практические профессии, а не «${cardRu}».`,
          uz: `${target.name}ga qarshi ovoz. Amaliy kasblar kerak, «${cardUz}» emas.`,
          en: `Vote against ${target.name}. We need practical skills, not "${cardEn}".`
        },
        {
          ru: `Убираем ${target.name}, профессия слишком слабая для нашего расклада.`,
          uz: `${target.name}ni chiqaramiz, kasbi bizning vaziyat uchun juda zaif.`,
          en: `Removing ${target.name}, profession is too weak for our setup.`
        }
      ];
      const pick = this.pickUniquePhrase(room, phrases, 'vote_prof');
      if (pick) return pick;
    }

    // 4. Плохой багаж
    if (keyTrait?.type === 'bad_luggage') {
      const phrases = [
        {
          ru: `Голос в ${target.name}. Багаж «${cardRu}» — просто лишний груз.`,
          uz: `${target.name}ga ovoz. «${cardUz}» yuki — ortiqcha yuk.`,
          en: `Vote on ${target.name}. "${cardEn}" is just dead weight.`
        },
        {
          ru: `Против ${target.name}, с багажом «${cardRu}» проку мало.`,
          uz: `${target.name}ga qarshi, «${cardUz}» bilan foyda kam.`,
          en: `Against ${target.name}, "${cardEn}" brings nothing to the table.`
        },
        {
          ru: `Сливаю ${target.name}, даже в багаже пусто («${cardRu}»).`,
          uz: `${target.name}ni chiqaramiz, hatto yukida ham foydali narsa yo'q («${cardUz}»).`,
          en: `Voting ${target.name}, even their luggage ("${cardEn}") is useless.`
        },
        {
          ru: `Выбираю ${target.name}. Карта «${cardRu}» вообще ни о чём.`,
          uz: `${target.name}ni tanlayman. «${cardUz}» kartasi umuman befoyda.`,
          en: `Picking ${target.name}. Card "${cardEn}" doesn't help at all.`
        }
      ];
      const pick = this.pickUniquePhrase(room, phrases, 'vote_lug');
      if (pick) return pick;
    }

    // 5. Возраст
    if (keyTrait?.type === 'old_age') {
      const phrases = [
        {
          ru: `Против ${target.name}. Возраст «${cardRu}» слишком рискован для тяжёлых работ.`,
          uz: `${target.name}ga qarshi. «${cardUz}» yoshi og'ir ishlar uchun xavfli.`,
          en: `Against ${target.name}. Age "${cardEn}" is risky for heavy labor.`
        },
        {
          ru: `Голосую за ${target.name}, по возрасту («${cardRu}») будет тяжело.`,
          uz: `${target.name}ga ovoz beraman, yoshi («${cardUz}») sababli qiyin bo'ladi.`,
          en: `Voting ${target.name}, age ("${cardEn}") will be tough underground.`
        }
      ];
      const pick = this.pickUniquePhrase(room, phrases, 'vote_age');
      if (pick) return pick;
    }

    // 6. Универсальные тактические аргументы (12 совершенно разных формулировок)
    const genericPhrases = [
      {
        ru: `Мой голос за ${target.name}. Мест всего ${cap}, оставляем сильнейших.`,
        uz: `Mening ovozim ${target.name}ga. Joy atigi ${cap} ta, eng kuchlilarni qoldiramiz.`,
        en: `My vote goes to ${target.name}. Only ${cap} spots, keeping the strongest.`
      },
      {
        ru: `Сливаю ${target.name}, по открытым картам наименьшая польза.`,
        uz: `${target.name}ni chiqaramiz, ochilgan kartalari eng kam foyda beradi.`,
        en: `Voting ${target.name}, lowest utility among revealed cards.`
      },
      {
        ru: `Против ${target.name}. Остальные кандидаты сейчас выглядят надёжнее.`,
        uz: `${target.name}ga qarshi. Qolgan nomzodlar hozir ishonchliroq ko'rinyapti.`,
        en: `Against ${target.name}. Other candidates look more reliable right now.`
      },
      {
        ru: `Кидаю голос в ${target.name}. Ничего личного, чистая математика.`,
        uz: `Ovozimni ${target.name}ga tashlayman. Shaxsiy adovat yo'q, faqat hisob-kitob.`,
        en: `Casting my vote on ${target.name}. Nothing personal, pure math.`
      },
      {
        ru: `В этом раунде голосую против ${target.name}, слабый набор.`,
        uz: `Bu raundda ${target.name}ga qarshi ovoz beraman, kartalari kuchsiz.`,
        en: `Voting against ${target.name} this round, weak card combo.`
      },
      {
        ru: `Выбираю ${target.name}. Бункеру нужны более полезные специалисты.`,
        uz: `${target.name}ni tanlayman. Bunkerga foydaliroq mutaxassislar kerak.`,
        en: `Choosing ${target.name}. The shelter needs stronger specialists.`
      },
      {
        ru: `Пусть будет ${target.name}, пока не убедил своей полезностью.`,
        uz: `Mayli ${target.name} bo'lsin, hozircha foydali ekaniga ishontirmadi.`,
        en: `Going with ${target.name}, hasn't proven their utility yet.`
      },
      {
        ru: `Голос против ${target.name}. Пора сокращать лишних пассажиров.`,
        uz: `${target.name}ga qarshi ovoz. Ortiqcha yo'lovchilarni kamaytirish vaqti.`,
        en: `Vote against ${target.name}. Time to trim extra passengers.`
      },
      {
        ru: `На данный момент ${target.name} — самое слабое звено за столом.`,
        uz: `Hozircha ${target.name} — davradagi eng zaif bo'g'in.`,
        en: `Right now ${target.name} is the weakest link at the table.`
      },
      {
        ru: `${target.name}, сорян, но по сумме характеристик ты уступаешь.`,
        uz: `${target.name}, uzr, lekin xususiyatlar yig'indisi bo'yicha yutqazyapsan.`,
        en: `Sorry ${target.name}, your overall stats fall short.`
      },
      {
        ru: `Отдаю голос в ${target.name}. Для выживания нужны другие карты.`,
        uz: `Ovozimni ${target.name}ga beraman. Omon qolish uchun boshqa kartalar kerak.`,
        en: `Giving my vote to ${target.name}. We need different traits to survive.`
      },
      {
        ru: `Поддержу слив ${target.name}, так у команды больше шансов.`,
        uz: `${target.name}ni chiqarishni qo'llayman, shunda jamoada imkoniyat ko'proq.`,
        en: `Supporting the vote on ${target.name}, gives our team better odds.`
      }
    ];
    return this.pickUniquePhrase(room, genericPhrases, 'vote_generic');
  }

  // Разнообразные реакции на изгнание
  generateExileReaction(exiledPlayer, isBotExiled, room = null) {
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
        },
        {
          ru: `Ещё пожалеете, когда в бункере всё начнёт ломаться.`,
          uz: `Bunkerda hamma narsa buzilganda hali afsuslanasizlar.`,
          en: `You'll regret this when things start breaking down.`
        },
        {
          ru: `Ладно, посмотрим на вас из чата призраков.`,
          uz: `Mayli, arvohlar chatidan sizlarni kuzataman.`,
          en: `Fine, I'll watch how you do from the ghost chat.`
        },
        {
          ru: `Слили полезного игрока, а балласт оставили. Гениально.`,
          uz: `Foydali o'yinchini chiqarib, keraksizlarni qoldirdingiz. Qoyil.`,
          en: `Voted out a useful player and kept dead weight. Genius.`
        },
        {
          ru: `Несправедливо, у меня в закрытых картах был топ.`,
          uz: `Adolatsizlik, yopiq kartalarim juda kuchli edi.`,
          en: `Unfair, my unrevealed cards were top tier.`
        },
        {
          ru: `Ну и оставайтесь в своём бункере, удачи выжить.`,
          uz: `Bunkeringizda qolavering, omon qolishda omad.`,
          en: `Keep your shelter then, good luck surviving.`
        }
      ];
      return this.pickUniquePhrase(room, phrases, 'exile_self');
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
          ru: `Минус один конкурент. Смотрим на оставшихся.`,
          uz: `Raqobatchi kamaydi. Qolganlarga qaraymiz.`,
          en: `One less competitor. Watch the remaining players.`
        },
        {
          ru: `Всё по делу, с такими картами в бункере было бы туго.`,
          uz: `To'g'ri qaror, bunday kartalar bilan qiyin bo'lardi.`,
          en: `Fair call, those cards would have dragged us down.`
        },
        {
          ru: `Жестоко, но выживание требует холодного расчёта.`,
          uz: `Shafqatsiz, lekin omon qolish sovuq aqlni talab qiladi.`,
          en: `Harsh, but survival requires cold calculation.`
        },
        {
          ru: `Отбор становится всё жёстче. Готовимся к следующему кругу.`,
          uz: `Saralash qiyinlashyapti. Keyingi davraga tayyorlanamiz.`,
          en: `Selection is getting tougher. Ready for the next round.`
        },
        {
          ru: `Справедливый итог голосования. Двигаемся дальше.`,
          uz: `Ovoz berish adolatli yakunlandi. Davom etamiz.`,
          en: `Fair voting result. Let's keep moving.`
        },
        {
          ru: `Команда становится крепче. Посмотрим следующие карты.`,
          uz: `Jamoa kuchaymoqda. Keyingi kartalarni ko'ramiz.`,
          en: `The team is getting stronger. Let's see the next cards.`
        }
      ];
      return this.pickUniquePhrase(room, phrases, 'exile_other');
    }
  }

  // Живые реплики в чате дискуссии (собирает все подходящие по контексту варианты и берёт уникальный!)
  generateDiscussionRemark(bot, room) {
    const aliveOthers = room.players.filter(p => p.isAlive && p.id !== bot.id && !p.hasLeft);
    if (aliveOthers.length === 0) return null;

    const candidates = [];
    const disType = this.getDisasterType(room.disaster);
    const cap = room.bunkerCapacity || 2;

    // 1. Наблюдения по игрокам с опасной болезнью
    const diseased = aliveOthers.find(p => {
      const hCard = (p.deck || []).find(c => c.revealed && (c.type || c.id) === 'health');
      if (!hCard) return false;
      const text = `${hCard.value?.ru || hCard.value || ''}`.toLowerCase();
      return this.badHealthTerms.some(t => text.includes(t));
    });

    if (diseased) {
      candidates.push(
        {
          _tplKey: 'disc_dis_0',
          ru: `Обратите внимание на ${diseased.name}, с такой болезнью в бункер нельзя.`,
          uz: `${diseased.name}ga e'tibor bering, bu kasallik bilan bunkerga kirib bo'lmaydi.`,
          en: `Look at ${diseased.name}, that illness cannot enter the shelter.`
        },
        {
          _tplKey: 'disc_dis_1',
          ru: `У ${diseased.name} серьёзные проблемы со здоровьем, это риск для всех.`,
          uz: `${diseased.name}ning sog'lig'ida jiddiy muammo bor, bu hamma uchun xavf.`,
          en: `${diseased.name} has serious health issues, that's a risk for everyone.`
        },
        {
          _tplKey: 'disc_dis_2',
          ru: `Если возьмём ${diseased.name}, вся аптечка уйдёт на одного человека.`,
          uz: `Agar ${diseased.name}ni olsak, butun dorilar bir kishiga ketadi.`,
          en: `If we take ${diseased.name}, all our medical supplies go to one person.`
        },
        {
          _tplKey: 'disc_dis_3',
          ru: `Здоровье ${diseased.name} вызывает больше всего вопросов.`,
          uz: `${diseased.name}ning salomatligi eng ko'p savol uyg'otyapti.`,
          en: `${diseased.name}'s health raises the biggest red flags.`
        }
      );
    }

    // 2. Наблюдения по игрокам с бесполезной профессией
    const uselessProf = aliveOthers.find(p => {
      const pCard = (p.deck || []).find(c => c.revealed && (c.type || c.id) === 'profession');
      if (!pCard) return false;
      const text = `${pCard.value?.ru || pCard.value || ''}`.toLowerCase();
      return Object.entries(this.professionRanks).some(([k, w]) => w >= 28 && (text.includes(k) || this.matchesProfessionKey(text, k)));
    });

    if (uselessProf) {
      candidates.push(
        {
          _tplKey: 'disc_prof_0',
          ru: `Зачем нам ${uselessProf.name}? Нам инженеры и медики нужны.`,
          uz: `${uselessProf.name} bunkerda nima qiladi? Bizga muhandis va shifokorlar kerak.`,
          en: `Why do we need ${uselessProf.name}? We need engineers and medics.`
        },
        {
          _tplKey: 'disc_prof_1',
          ru: `Профессия ${uselessProf.name} под землёй вообще не пригодится.`,
          uz: `${uselessProf.name}ning kasbi yer ostida umuman kerak bo'lmaydi.`,
          en: `${uselessProf.name}'s profession won't help underground at all.`
        },
        {
          _tplKey: 'disc_prof_2',
          ru: `У ${uselessProf.name} очень слабая первая карта, надо думать.`,
          uz: `${uselessProf.name}ning birinchi kartasi juda zaif, o'ylab ko'rish kerak.`,
          en: `${uselessProf.name} has a very weak profession card, think about it.`
        }
      );
    }

    // 3. Реплики под конкретную катастрофу
    if (disType === 'virus') {
      candidates.push(
        {
          _tplKey: 'disc_cat_v0',
          ru: `Снаружи эпидемия — больных и без иммунитета брать опасно.`,
          uz: `Tashqarida epidemiya — kasallarni bunkerga olish juda xavfli.`,
          en: `Epidemic outside — taking sick players into the bunker is fatal.`
        },
        {
          _tplKey: 'disc_cat_v1',
          ru: `При вирусе врач и биолог — главные люди в бункере.`,
          uz: `Virus paytida shifokor va biolog — bunkerdagi eng muhim odamlar.`,
          en: `During a virus outbreak, doctors and biologists are our top priority.`
        }
      );
    } else if (disType === 'radiation') {
      candidates.push(
        {
          _tplKey: 'disc_cat_r0',
          ru: `Кругом радиация — цените тех, у кого есть фильтры, защита и медицина.`,
          uz: `Atrofda radiatsiya — filtr, himoya va dorisi borlarni qadrlang.`,
          en: `Radiation everywhere — prioritize filters, suits, and medicine.`
        },
        {
          _tplKey: 'disc_cat_r1',
          ru: `После ядерного удара сидеть под землёй долго, нужны спецы по технике.`,
          uz: `Yadro zarbasidan keyin uzoq o'tiramiz, texnik mutaxassislar kerak.`,
          en: `After a nuclear strike we'll be sealed in for years, keep the engineers.`
        }
      );
    } else if (disType === 'ice_age') {
      candidates.push(
        {
          _tplKey: 'disc_cat_i0',
          ru: `Снаружи дикий мороз — без инженера и генератора замёрзнем.`,
          uz: `Tashqarida qattiq sovuq — muhandis va generatorsiz muzlab qolamiz.`,
          en: `Extreme freeze outside — without an engineer and generator we freeze.`
        }
      );
    }

    // 4. Общие тактические наблюдения (10 разных вариантов)
    candidates.push(
      {
        _tplKey: 'disc_gen_0',
        ru: `Мест в бункере всего ${cap}, голосуем с холодной головой.`,
        uz: `Bunkerda joy atigi ${cap} ta, aql bilan ovoz beringlar.`,
        en: `Only ${cap} spots in the shelter, vote with a cool head.`
      },
      {
        _tplKey: 'disc_gen_1',
        ru: `Кого сливаем в этом круге? Кто самый слабый по картам?`,
        uz: `Bu davrada kimni chiqaramiz? Kartalari bo'yicha kim eng zaif?`,
        en: `Who are we voting out this round? Who has the weakest cards?`
      },
      {
        _tplKey: 'disc_gen_2',
        ru: `Врачей и техников не трогаем, это основа выживания.`,
        uz: `Shifokor va texniklarga tegmanglar, ular tirik qolish asosi.`,
        en: `Don't touch doctors or technicians, they are the backbone of survival.`
      },
      {
        _tplKey: 'disc_gen_3',
        ru: `Смотрите не только на профессию, но и на здоровье с багажом.`,
        uz: `Faqat kasbga emas, salomatlik va yukka ham qaranglar.`,
        en: `Look closely at health and luggage, not just professions.`
      },
      {
        _tplKey: 'disc_gen_4',
        ru: `Не голосуйте наугад, сравнивайте пользу каждого игрока.`,
        uz: `Tavakkal ovoz bermang, har bir o'yinchining foydasini solishtiring.`,
        en: `Don't vote randomly, compare what each survivor brings.`
      },
      {
        _tplKey: 'disc_gen_5',
        ru: `У кого остались сильные закрытые карты — самое время сказать.`,
        uz: `Kimda kuchli yopiq kartalar qolgan bo'lsa — aytish vaqti keldi.`,
        en: `If anyone has strong unrevealed cards, speak up now.`
      },
      {
        _tplKey: 'disc_gen_6',
        ru: `Нам нужна сбалансированная команда: медик, техник и рабочие руки.`,
        uz: `Bizga muvozanatli jamoa kerak: shifokor, texnik va ishchi qo'llar.`,
        en: `We need a balanced crew: medic, engineer, and capable hands.`
      },
      {
        _tplKey: 'disc_gen_7',
        ru: `Раунд за раундом всё интереснее. Кого считаете балластом?`,
        uz: `O'yin qiziyapti. Kimni ortiqcha yuk deb hisoblaysiz?`,
        en: `Getting intense round by round. Who's the biggest liability?`
      },
      {
        _tplKey: 'disc_gen_8',
        ru: `Давайте без эмоций — оставляем только тех, с кем реально выжить.`,
        uz: `Hissiyotlarsiz — faqat haqiqatan omon qolishga yordam beradiganlarni qoldiramiz.`,
        en: `Keep emotions out of it — only keep those who help us survive.`
      },
      {
        _tplKey: 'disc_gen_9',
        ru: `Проверьте открытые карты всех игроков перед тем как кидать голос.`,
        uz: `Ovoz berishdan oldin barcha o'yinchilarning ochiq kartalarini tekshiring.`,
        en: `Check everyone's revealed cards before locking in your vote.`
      }
    );

    return this.pickUniquePhrase(room, candidates, 'disc');
  }

  // Разнообразные живые ответы бота на сообщение реального игрока в чате
  generateChatReply(bot, sender, incomingText, room) {
    if (!incomingText) return null;
    const txt = incomingText.toLowerCase();

    // 1. Игрок спрашивает кого выгонять ("кого", "кто", "кому", "кикаем", "сливаем", "голос", "kim", "who", "vote")
    if (txt.includes('кого') || txt.includes('кто') || txt.includes('кому') || txt.includes('слива') || txt.includes('кика') || txt.includes('голос') || txt.includes('who') || txt.includes('kim') || txt.includes('ovoz')) {
      const target = this.chooseVotingTarget(room, bot);
      if (target) {
        const keyTrait = this.findKeyTrait(target);
        const cardRu = keyTrait?.card ? (keyTrait.card.value?.ru || keyTrait.card.value) : '';
        const cardUz = keyTrait?.card ? (keyTrait.card.value?.uz || cardRu) : '';
        const cardEn = keyTrait?.card ? (keyTrait.card.value?.en || cardRu) : '';

        const whoPhrases = [];
        if (keyTrait?.type === 'bad_health' && cardRu) {
          whoPhrases.push(
            {
              _tplKey: 'rep_who_h0',
              ru: `Думаю, надо убирать ${target.name}. Болезнь «${cardRu}» слишком опасна.`,
              uz: `Menimcha ${target.name}ni chiqarish kerak. «${cardUz}» kasalligi xavfli.`,
              en: `I think we should vote out ${target.name}. "${cardEn}" is too hazardous.`
            },
            {
              _tplKey: 'rep_who_h1',
              ru: `Я за слив ${target.name}, с диагнозом «${cardRu}» в бункере делать нечего.`,
              uz: `Men ${target.name}ga qarshiman, «${cardUz}» bilan bunkerda joy yo'q.`,
              en: `I'm voting ${target.name}, "${cardEn}" doesn't belong in the shelter.`
            }
          );
        }
        if (keyTrait?.type === 'bad_profession' && cardRu) {
          whoPhrases.push(
            {
              _tplKey: 'rep_who_p0',
              ru: `Сливаем ${target.name}. От «${cardRu}» толку в бункере ноль.`,
              uz: `${target.name}ni chiqaramiz. «${cardUz}» kasbining foydasi yo'q.`,
              en: `Vote out ${target.name}. Zero shelter utility from "${cardEn}".`
            },
            {
              _tplKey: 'rep_who_p1',
              ru: `Голосуем против ${target.name}, профессия «${cardRu}» нас не спасёт.`,
              uz: `${target.name}ga qarshi ovoz beramiz, «${cardUz}» bizni qutqarmaydi.`,
              en: `Let's vote ${target.name}, a "${cardEn}" won't save us.`
            }
          );
        }

        whoPhrases.push(
          {
            _tplKey: 'rep_who_g0',
            ru: `Думаю, надо голосовать за ${target.name}, самый слабый расклад.`,
            uz: `Menimcha ${target.name}ga ovoz berish kerak, kartalari eng zaif.`,
            en: `I say we vote ${target.name}, weakest cards by far.`
          },
          {
            _tplKey: 'rep_who_g1',
            ru: `Я кидаю голос в ${target.name}. По открытым картам меньше всего пользы.`,
            uz: `Men ${target.name}ga ovoz beraman. Ochiq kartalari bo'yicha foydasi kam.`,
            en: `I'm putting my vote on ${target.name}. Least utility so far.`
          },
          {
            _tplKey: 'rep_who_g2',
            ru: `Присмотрись к ${target.name} — пока главный кандидат на выход.`,
            uz: `${target.name}ga qara — hozircha chiqishga asosiy nomzod.`,
            en: `Look at ${target.name} — main candidate for exile right now.`
          },
          {
            _tplKey: 'rep_who_g3',
            ru: `Мой выбор — ${target.name}. Остальные игроки нужнее команде.`,
            uz: `Mening tanlovim — ${target.name}. Qolganlar jamoaga kerakliroq.`,
            en: `My pick is ${target.name}. The others are more useful to the crew.`
          },
          {
            _tplKey: 'rep_who_g4',
            ru: `Давайте ${target.name}, у остальных карты выглядят сильнее.`,
            uz: `Kelinglar ${target.name}ni tanlaymiz, qolganlarning kartasi kuchliroq.`,
            en: `Let's go with ${target.name}, everyone else has stronger traits.`
          }
        );

        const pick = this.pickUniquePhrase(room, whoPhrases, 'rep_who');
        if (pick) return pick;
      }
    }

    // 2. Вопрос "почему", "за что", "зачем"
    if (txt.includes('почему') || txt.includes('за что') || txt.includes('зачем') || txt.includes('nima uchun') || txt.includes('nega') || txt.includes('why')) {
      const whyPhrases = [
        {
          ru: `Чисто холодный расчёт. Смотрю на полезность для базы.`,
          uz: `Faqat sovuq hisob-kitob. Bunkerga kim foydali ekanligiga qarayapman.`,
          en: `Pure calculation. Looking strictly at shelter utility.`
        },
        {
          ru: `Ничего личного, просто сравниваю открытые карты за столом.`,
          uz: `Shaxsiy narsa yo'q, shunchaki ochiq kartalarni solishtiryapman.`,
          en: `Nothing personal, just comparing the revealed cards on the table.`
        },
        {
          ru: `Мест в бункере мало, приходится выбирать самых надёжных.`,
          uz: `Bunkerda joy kam, eng ishonchlilarni tanlashga majburmiz.`,
          en: `Spots are tight, we have to pick the most reliable survivors.`
        },
        {
          ru: `Потому что с слабыми картами мы все погибнем под землёй.`,
          uz: `Chunki kuchsiz kartalar bilan yer ostida hammamiz halok bo'lamiz.`,
          en: `Because weak cards will get us all killed underground.`
        },
        {
          ru: `Логика простая: у кого больше рисков по картам — тот и уходит.`,
          uz: `Mantiq oddiy: kimning kartasida xavf ko'p bo'lsa, o'sha ketadi.`,
          en: `Simple logic: highest risk on revealed cards goes out.`
        },
        {
          ru: `Так выгоднее для выживания всей группы, без обид.`,
          uz: `Butun guruh omon qolishi uchun shunday foydaliroq, xafa bo'lma.`,
          en: `It's the best move for group survival, no hard feelings.`
        }
      ];
      const pick = this.pickUniquePhrase(room, whyPhrases, 'rep_why');
      if (pick) return pick;
    }

    // 3. Игрок защищается ("не сливайте", "не меня", "я полезен", "meni tegmang", "don't vote")
    if (txt.includes('не слива') || txt.includes('не голосуй') || txt.includes('не меня') || txt.includes('я полез') || txt.includes('я нуж') || txt.includes('meni tegmang') || txt.includes('dont vote') || txt.includes('don\'t vote')) {
      const defPhrases = [
        {
          ru: `Покажи следующие карты. Пока доверия мало.`,
          uz: `Keyingi kartalaringni och. Hozircha xavfli ko'rinyapsan.`,
          en: `Show your next cards. Risky bet so far.`
        },
        {
          ru: `Словами бункер не спасёшь, всё решают открытые характеристики.`,
          uz: `Gap bilan bunkerni qutqarib bo'lmaydi, hamma narsani kartalar hal qiladi.`,
          en: `Words won't save the shelter, revealed traits decide everything.`
        },
        {
          ru: `Если у тебя реально сильный багаж или здоровье — вскрывай в следующем ходу.`,
          uz: `Agar rostdan kuchli yuking yoki sog'lig'ing bo'lsa — keyingi yurishda och.`,
          en: `If you really have great gear or health — reveal it next turn.`
        },
        {
          ru: `Каждый хочет в бункер, но мест на всех не хватит.`,
          uz: `Hamma bunkerga kirishni xohlaydi, lekin joy hammaga yetmaydi.`,
          en: `Everyone wants in, but there aren't enough spots for all of us.`
        },
        {
          ru: `Ладно, посмотрим как проголосуют остальные.`,
          uz: `Mayli, qolganlar qanday ovoz berishini ko'ramiz.`,
          en: `Alright, let's see how the rest of the table votes.`
        },
        {
          ru: `Докажи картами, тогда никто тебя трогать не будет.`,
          uz: `Kartalar bilan isbotla, shunda hech kim senga tegmaydi.`,
          en: `Prove it with your cards and nobody will touch you.`
        }
      ];
      const pick = this.pickUniquePhrase(room, defPhrases, 'rep_def');
      if (pick) return pick;
    }

    // 4. Игрок упомянул бота по имени или словом "бот"
    if (txt.includes(bot.name.toLowerCase()) || txt.includes('бот') || txt.includes('bot')) {
      const botPhrases = [
        {
          ru: `Я на месте. Карты сильные, играю на победу команды.`,
          uz: `Shu yerdaman. Kartalarim kuchli, jamoa g'alabasi uchun o'ynayman.`,
          en: `Right here. Strong deck, playing for team survival.`
        },
        {
          ru: `Чего меня обсуждать? Мои характеристики бункеру только в плюс.`,
          uz: `Meni muhokama qilishga hojat yo'q, kartalarim bunkerga faqat foyda.`,
          en: `Why question me? My traits are a straight asset to the shelter.`
        },
        {
          ru: `Я внимательно слежу за столом и голосую строго по фактам.`,
          uz: `O'yinni diqqat bilan kuzatyapman va faqat faktlar bo'yicha ovoz beraman.`,
          en: `I'm watching the table closely and voting strictly on facts.`
        },
        {
          ru: `Со мной в бункере проблем точно не возникнет, гарантирую.`,
          uz: `Men bilan bunkerda muammo bo'lmaydi, kafolat beraman.`,
          en: `You won't have any trouble with me in the shelter, guaranteed.`
        },
        {
          ru: `Меня сливать нет смысла — лучше посмотрите на больных за столом.`,
          uz: `Meni chiqarishdan ma'no yo'q — yaxshisi kasallarga qaranglar.`,
          en: `No point targeting me — look at the sick players at the table instead.`
        },
        {
          ru: `Тут каждый сам за себя, но я готов работать на общую базу.`,
          uz: `Bu yerda hamma o'zi uchun, lekin men jamoa uchun ishlashga tayyorman.`,
          en: `Everyone wants to survive, and I'm ready to pull my weight.`
        }
      ];
      const pick = this.pickUniquePhrase(room, botPhrases, 'rep_bot');
      if (pick) return pick;
    }

    // 5. Разговор о врачах / инженерах
    if (txt.includes('врач') || txt.includes('доктор') || txt.includes('медик') || txt.includes('shifokor') || txt.includes('doctor') || txt.includes('инженер') || txt.includes('muhandis')) {
      const medPhrases = [
        {
          ru: `Медиков и инженеров бережём, без них бункер обречён.`,
          uz: `Shifokor va muhandislarni asraymiz, ularsiz bunker halok bo'ladi.`,
          en: `Keep medics and engineers alive, shelter is doomed without them.`
        },
        {
          ru: `Согласен, спецов трогать нельзя, особенно если у них здоровье в норме.`,
          uz: `Qo'shilaman, mutaxassislarga tegib bo'lmaydi, ayniqsa sog'lom bo'lsa.`,
          en: `Agreed, don't touch specialists, especially if they're healthy.`
        },
        {
          ru: `Врач и техник — два обязательных слота в любом бункере.`,
          uz: `Shifokor va texnik — har qanday bunkerda eng zarur ikki kishi.`,
          en: `A doctor and a technician are two mandatory slots in any bunker.`
        },
        {
          ru: `Да, но даже врачу нужно хорошее здоровье, чтобы лечить других.`,
          uz: `Ha, lekin boshqalarni davolash uchun shifokorning o'zi ham sog'lom bo'lishi kerak.`,
          en: `True, though even a doctor needs decent health to treat others.`
        },
        {
          ru: `Кто голосует против медика или инженера — играет против выживания.`,
          uz: `Shifokor yoki muhandisga qarshi ovoz berganlar — omon qolishga qarshi.`,
          en: `Anyone voting against a medic or engineer is sabotaging our survival.`
        }
      ];
      const pick = this.pickUniquePhrase(room, medPhrases, 'rep_med');
      if (pick) return pick;
    }

    // 6. Приветствия / смех / короткие эмоции
    if (txt.includes('привет') || txt.includes('салам') || txt.includes('salom') || txt.includes('ахах') || txt.includes('хаха') || txt.includes('лол') || txt.includes('lol') || txt.includes('😂') || txt.includes('))')) {
      const casualPhrases = [
        {
          ru: `Всем удачи, но в бункер пройдут только самые полезные.`,
          uz: `Hammaga omad, lekin bunkerga faqat eng foydalilar kiradi.`,
          en: `Good luck everyone, though only the most useful make it inside.`
        },
        {
          ru: `Смех смехом, а мест в бункере на всех не хватит.`,
          uz: `Kulgi o'z yo'liga, lekin bunkerda joy hammaga yetmaydi.`,
          en: `Laugh all you want, there still aren't enough seats for everyone.`
        },
        {
          ru: `Посмотрим, кто будет смеяться после закрытия гермодверей.`,
          uz: `Bunker eshiklari yopilgandan keyin kim kulishini ko'ramiz.`,
          en: `We'll see who's laughing once the blast doors seal shut.`
        },
        {
          ru: `Настрой боевой, давайте смотреть по картам.`,
          uz: `Kayfiyat jangovar, kelinglar kartalarga qaraylik.`,
          en: `Good energy, now let's focus on the cards.`
        },
        {
          ru: `Главное — без паники, выбираем состав с умом.`,
          uz: `Asosiysi — vahimasiz, tarkibni aql bilan tanlaymiz.`,
          en: `No panic, let's pick our roster wisely.`
        }
      ];
      const pick = this.pickUniquePhrase(room, casualPhrases, 'rep_casual');
      if (pick) return pick;
    }

    // 7. Универсальные живые ответы на реплики в чате (12 совершенно разных фраз)
    const generalReplies = [
      {
        ru: `Дельная мысль. Надо сопоставить все открытые карты.`,
        uz: `To'g'ri fikr. Barcha ochiq kartalarni solishtirish kerak.`,
        en: `Good point. We need to weigh all the revealed cards.`
      },
      {
        ru: `Согласен, сейчас важна каждая деталь в характеристиках.`,
        uz: `Qo'shilaman, hozir har bir xususiyat juda muhim.`,
        en: `Agreed, every single trait matters right now.`
      },
      {
        ru: `Вопрос спорный, надо смотреть у кого меньше рисков.`,
        uz: `Bahsli masala, kimda xavf kamroq ekaniga qarash kerak.`,
        en: `Debatable, we should check who carries the least risk.`
      },
      {
        ru: `Посмотрим, что покажет голосование в этом круге.`,
        uz: `Bu davradagi ovoz berish nimani ko'rsatishini ko'ramiz.`,
        en: `Let's see how the vote plays out this round.`
      },
      {
        ru: `Главное — не оставить бункер без рабочих рук и медицины.`,
        uz: `Asosiysi — bunkerni ishchi qo'llar va tibbiyotsiz qoldirmaslik.`,
        en: `Main thing is not leaving the shelter without labor and medicine.`
      },
      {
        ru: `Не забывайте учитывать условия нашей катастрофы.`,
        uz: `Falokatimiz sharoitlarini hisobga olishni unutmang.`,
        en: `Don't forget to factor in our specific disaster conditions.`
      },
      {
        ru: `Имеет смысл, но я бы ещё проверил багаж и возраст.`,
        uz: `Mantiq bor, lekin men yuk va yoshni ham tekshirgan bo'lardim.`,
        en: `Makes sense, though I'd also double-check luggage and age.`
      },
      {
        ru: `Тут каждый тянет одеяло на себя, доверяем только открытым фактам.`,
        uz: `Bu yerda hamma o'zini oqlaydi, faqat ochiq faktlarga ishonamiz.`,
        en: `Everyone defends themselves here, trust only the revealed cards.`
      },
      {
        ru: `Разумно. Осталось решить, кто сейчас приносит меньше всего пользы.`,
        uz: `Oqilona. Endi kim eng kam foyda keltirishini hal qilish qoldi.`,
        en: `Fair enough. Now we just decide who brings the least utility.`
      },
      {
        ru: `Времени на раздумья достаточно, не торопитесь с голосом.`,
        uz: `O'ylashga vaqt yetarli, ovoz berishga shoshilmang.`,
        en: `Plenty of time to think, don't rush your vote.`
      },
      {
        ru: `Я уже определился с кандидатом, смотрю чисто по пользе.`,
        uz: `Men nomzodimni tanlab bo'ldim, faqat foydasiga qarayapman.`,
        en: `I've already picked my target based purely on utility.`
      },
      {
        ru: `Интересный расклад получается, интрига до самого финала.`,
        uz: `Qiziqarli vaziyat bo'lyapti, finalgacha intriga saqlanadi.`,
        en: `Interesting setup we have here, tight race to the end.`
      }
    ];
    return this.pickUniquePhrase(room, generalReplies, 'rep_gen');
  }
}

const botAiManager = new BotAiManager();

module.exports = {
  BotAiManager,
  botAiManager
};
