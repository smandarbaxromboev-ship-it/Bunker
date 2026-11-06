// Comprehensive Shop Catalog for "Бункер: 7 Раундов Откровений"
// Over 150 items: 53 Characters, 52 Frames, 52 Titles with full RU, EN, UZ localization!

const SHOP_ITEMS = [
  // ==========================================
  // 1. CHARACTERS / SKINS (53 items)
  // ==========================================
  {
    id: 'char_stalker',
    type: 'character',
    name: { ru: 'Сталкер-Разведчик', en: 'Wasteland Stalker', uz: 'Yovvoyi Izquvar' },
    avatar: '🥷',
    price: 0,
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
  {
    id: 'char_bunker_chief',
    type: 'character',
    name: { ru: 'Главный Смотритель', en: 'Vault Overseer', uz: 'Bosh Nazoratchi' },
    avatar: '🏛️',
    price: 900,
    desc: { ru: 'Хранит ключи от гермодверей и реактора.', en: 'Holds keys to vault blast doors and reactor.', uz: 'Gipotetik eshiklar va reaktor kalitlari egasi.' }
  },
  {
    id: 'char_chemist',
    type: 'character',
    name: { ru: 'Токсиколог-Химик', en: 'Toxicologist Chemist', uz: 'Toksikolog Kimyogar' },
    avatar: '🧪',
    price: 400,
    desc: { ru: 'Нейтрализует любые яды и кислоты.', en: 'Neutralizes any poisons and acid.', uz: 'Har qanday zahar va kislotani zararsizlantiradi.' }
  },
  {
    id: 'char_hacker',
    type: 'character',
    name: { ru: 'Кибер-Взломщик', en: 'Cyber Infiltrator', uz: 'Kiber Xaker' },
    avatar: '💻',
    price: 650,
    desc: { ru: 'Вскрывает пароли любых терминалов.', en: 'Cracks any terminal passwords in seconds.', uz: 'Ixtiyoriy terminal kodlarini buzib kiradi.' }
  },
  {
    id: 'char_priest',
    type: 'character',
    name: { ru: 'Монах Конца Света', en: 'Doomsday Monk', uz: 'Qiyomat Rohibi' },
    avatar: '🕯️',
    price: 350,
    desc: { ru: 'Успокаивает дух перед лицом катастрофы.', en: 'Calms the spirits in front of apocalypse.', uz: 'Falokat oldida qalbga taskin beradi.' }
  },
  {
    id: 'char_robot',
    type: 'character',
    name: { ru: 'Автономный Дроид', en: 'Autonomous Droid', uz: 'Avtonom Droid' },
    avatar: '🦾',
    price: 550,
    desc: { ru: 'Работает без кислорода и еды годами.', en: 'Works without oxygen or food for years.', uz: 'Kislorodsiz va ovqatsiz yillab ishlaydi.' }
  },
  {
    id: 'char_pilot',
    type: 'character',
    name: { ru: 'Пилот Эвакуатора', en: 'Evac Pilot', uz: 'Evakuatsiya Uchuvchisi' },
    avatar: '🛩️',
    price: 600,
    desc: { ru: 'Летает сквозь радиоактивные грозы.', en: 'Flies through nuclear storm clouds.', uz: 'Yadro bo\'ronlari orqali ucha oladi.' }
  },
  {
    id: 'char_merchant',
    type: 'character',
    name: { ru: 'Торговец Пустошей', en: 'Wasteland Trader', uz: 'Sahro Savdogari' },
    avatar: '💰',
    price: 400,
    desc: { ru: 'Достанет батарейки и тушенку из-под земли.', en: 'Can procure batteries and rations anywhere.', uz: 'Yerdan bo\'lsa ham ovqat va batareya topadi.' }
  },
  {
    id: 'char_scavenger',
    type: 'character',
    name: { ru: 'Барахольщик Руин', en: 'Ruin Scavenger', uz: 'Vayrona Qidiruvchisi' },
    avatar: '🎒',
    price: 250,
    desc: { ru: 'Находит ценные детали в любых завалах.', en: 'Finds valuable parts in rubble.', uz: 'Xarobalar orasidan kerakli buyumlarni topadi.' }
  },
  {
    id: 'char_ninja',
    type: 'character',
    name: { ru: 'Теневой Шиноби', en: 'Shadow Shinobi', uz: 'Soya Shinobi' },
    avatar: '🗡️',
    price: 750,
    desc: { ru: 'Двигается абсолютно бесшумно.', en: 'Moves without making any sound.', uz: 'Mutlaqo tovushsiz harakatlanadi.' }
  },
  {
    id: 'char_samurai',
    type: 'character',
    name: { ru: 'Кибер-Самурай', en: 'Cyber Samurai', uz: 'Kiber Samuray' },
    avatar: '⚔️',
    price: 850,
    desc: { ru: 'Кодекс чести и клинок из плазмы.', en: 'Honor code and plasma katana.', uz: 'Or-nomus kodeksi va plazmali qilich.' }
  },
  {
    id: 'char_cosmonaut',
    type: 'character',
    name: { ru: 'Космонавт Орбиты', en: 'Orbital Cosmonaut', uz: 'Orbita Fazogiri' },
    avatar: '👨‍🚀',
    price: 700,
    desc: { ru: 'Выжил на орбите во время падения метеоритов.', en: 'Survived in orbit during asteroid strikes.', uz: 'Meteorit yomg\'irida orbitada omon qolgan.' }
  },
  {
    id: 'char_raider',
    type: 'character',
    name: { ru: 'Безумный Рейдер', en: 'Mad Raider', uz: 'Telba Bosqinchi' },
    avatar: '🪓',
    price: 500,
    desc: { ru: 'Привык выбивать двери силой.', en: 'Used to breaching doors with raw strength.', uz: 'Eshiklarni kuch bilan buzishga o\'rgangan.' }
  },
  {
    id: 'char_detective',
    type: 'character',
    name: { ru: 'Следователь Убежища', en: 'Bunker Detective', uz: 'Bunker Detektivi' },
    avatar: '🕵️',
    price: 450,
    desc: { ru: 'Раскроет любой блеф и тайный замысел.', en: 'Reveals any bluff or hidden agenda.', uz: 'Har qanday yolg\'on va yashirin rejalarni fosh qiladi.' }
  },
  {
    id: 'char_engineer',
    type: 'character',
    name: { ru: 'Главный Механик', en: 'Chief Engineer', uz: 'Bosh Muhandis' },
    avatar: '🛠️',
    price: 400,
    desc: { ru: 'Починит генератор даже проволокой.', en: 'Fixes generators with scraps and wires.', uz: 'Generatordan simlargacha hammasini tuzatadi.' }
  },
  {
    id: 'char_miner',
    type: 'character',
    name: { ru: 'Проходчик Глубин', en: 'Deep Tunnel Miner', uz: 'Chuqurlik Konchisi' },
    avatar: '⛏️',
    price: 350,
    desc: { ru: 'Ориентируется в полнейшей тьме.', en: 'Navigates through pitch-black darkness.', uz: 'Qorong\'ulikda yo\'l topa oladi.' }
  },
  {
    id: 'char_gladiator',
    type: 'character',
    name: { ru: 'Аренный Гладиатор', en: 'Arena Gladiator', uz: 'Arena Gladiatori' },
    avatar: '🛡️',
    price: 600,
    desc: { ru: 'Закален сотнями рукопашных дуэлей.', en: 'Hardened by hundreds of hand-to-hand duels.', uz: 'Yuzlab janglarda toblangan jangchi.' }
  },
  {
    id: 'char_wizard',
    type: 'character',
    name: { ru: 'Чернокнижник Атома', en: 'Atomic Sorcerer', uz: 'Atom Sehrgari' },
    avatar: '🧙',
    price: 800,
    desc: { ru: 'Управляет радиоактивным свечением.', en: 'Controls nuclear green luminescence.', uz: 'Yadroviy nurlar ustidan hukmronlik qiladi.' }
  },
  {
    id: 'char_necromancer',
    type: 'character',
    name: { ru: 'Повелитель Костей', en: 'Bone Necromancer', uz: 'Suyaklar Hukmdori' },
    avatar: '💀',
    price: 750,
    desc: { ru: 'Слышит голоса павших в апокалипсисе.', en: 'Hears voices of those fallen in apocalypse.', uz: 'Halok bo\'lganlar ruhini eshitadi.' }
  },
  {
    id: 'char_paladin',
    type: 'character',
    name: { ru: 'Защитник Анклава', en: 'Enclave Paladin', uz: 'Anklav Himoyachisi' },
    avatar: '⚔️',
    price: 850,
    desc: { ru: 'Щит надежды для последних выживших.', en: 'Shield of hope for last survivors.', uz: 'So\'nggi tiriklar uchun umid qalqoni.' }
  },
  {
    id: 'char_assassin',
    type: 'character',
    name: { ru: 'Наемный Ликвидатор', en: 'Silent Assassin', uz: 'Yashirin Qotil' },
    avatar: '👤',
    price: 700,
    desc: { ru: 'Одно точное движение решает исход спора.', en: 'One precise strike decides every conflict.', uz: 'Birgina aniq zarba bilan barchasini hal qiladi.' }
  },
  {
    id: 'char_soldier',
    type: 'character',
    name: { ru: 'Штурмовик Выживших', en: 'Stormtrooper', uz: 'Shturm Askar' },
    avatar: '🪖',
    price: 500,
    desc: { ru: 'Не отступает под шквальным огнем.', en: 'Never retreats under heavy suppression.', uz: 'O\'t ostida ham orqaga chekinmaydi.' }
  },
  {
    id: 'char_bounty_hunter',
    type: 'character',
    name: { ru: 'Охотник за Головами', en: 'Bounty Hunter', uz: 'Bosh Ovchisi' },
    avatar: '🤠',
    price: 650,
    desc: { ru: 'Выследит любую цель по радиоследу.', en: 'Tracks any target across fallout wasteland.', uz: 'Sahro bo\'ylab har qanday nishonni topadi.' }
  },
  {
    id: 'char_jester',
    type: 'character',
    name: { ru: 'Джокер Пустошей', en: 'Wasteland Jester', uz: 'Sahro Mazhagi' },
    avatar: '🃏',
    price: 600,
    desc: { ru: 'Смеется в лицо даже ядерному грибу.', en: 'Laughs right in the face of nuclear fallout.', uz: 'Yadro portlashiga ham kulib qaraydi.' }
  },
  {
    id: 'char_alien',
    type: 'character',
    name: { ru: 'Пришелец Зоны 51', en: 'Area 51 Alien', uz: 'Zona 51 O\'zgacha Jonzoti' },
    avatar: '👽',
    price: 1000,
    desc: { ru: 'Смотрит на землян с глубоким интересом.', en: 'Studies human survival with cosmic curiosity.', uz: 'Insoniyat omon qolishini qiziqish bilan kuzatadi.' }
  },
  {
    id: 'char_ghost_hunter',
    type: 'character',
    name: { ru: 'Ловец Призраков', en: 'Ghost Catcher', uz: 'Arvoh Ovchisi' },
    avatar: '👻',
    price: 550,
    desc: { ru: 'Улавливает эхо тех, кого уже изгнали.', en: 'Captures paranormal echoes of exiled souls.', uz: 'Haydalganlar aks sadosini ushlaydi.' }
  },
  {
    id: 'char_terminator',
    type: 'character',
    name: { ru: 'Инфильтратор Т-800', en: 'Infiltrator T-800', uz: 'Infiltrator T-800' },
    avatar: '🕶️',
    price: 1100,
    desc: { ru: 'Мне нужны твоя одежда и твой бункер.', en: 'I need your clothes and your bunker.', uz: 'Menga kiyimlaring va bunkering kerak.' }
  },
  {
    id: 'char_viking',
    type: 'character',
    name: { ru: 'Берсерк Ядерной Зимы', en: 'Nuclear Viking', uz: 'Yadro Qishi Vikingi' },
    avatar: '🪓',
    price: 750,
    desc: { ru: 'В Вальхаллу пускают только стойких.', en: 'Only the resilient enter Valhalla.', uz: 'Valxallaga faqat kuchlilar kiradi.' }
  },
  {
    id: 'char_spartan',
    type: 'character',
    name: { ru: 'Спартанец Бункера', en: 'Vault Spartan', uz: 'Bunker Spartaligi' },
    avatar: '🛡️',
    price: 800,
    desc: { ru: 'Со щитом или на щите.', en: 'With your shield or upon it.', uz: 'Qalqon bilan yoki qalqon ustida.' }
  },
  {
    id: 'char_witcher',
    type: 'character',
    name: { ru: 'Ведьмак Зоны', en: 'Zone Witcher', uz: 'Zona Ovchisi' },
    avatar: '🐺',
    price: 950,
    desc: { ru: 'Два меча: один для мутантов, второй для людей.', en: 'Two blades: silver for mutants, steel for men.', uz: 'Ikkita qilich: mutantlar va insonlar uchun.' }
  },
  {
    id: 'char_godfather',
    type: 'character',
    name: { ru: 'Крестный Отец Бункера', en: 'Bunker Godfather', uz: 'Bunker Cho\'qintirgan Otasi' },
    avatar: '🎩',
    price: 1200,
    desc: { ru: 'Сделает предложение, от которого нельзя отказаться.', en: 'Makes an offer you cannot refuse.', uz: 'Rad etib bo\'lmaydigan taklif kiritadi.' }
  },
  {
    id: 'char_cyberpunk',
    type: 'character',
    name: { ru: 'Беглец Найт-Сити', en: 'Night City Runner', uz: 'Kiber Shahar Qochqini' },
    avatar: '🕹️',
    price: 650,
    desc: { ru: 'Хром в венах и неон в глазах.', en: 'Chrome in veins and neon in eyes.', uz: 'Tomirlarda xrom, ko\'zlarda neon.' }
  },
  {
    id: 'char_biohazard',
    type: 'character',
    name: { ru: 'Носитель Штамма-Z', en: 'Strain-Z Carrier', uz: 'Shtamm-Z Tashuvchisi' },
    avatar: '🧫',
    price: 700,
    desc: { ru: 'Несет антитела ко всем известным вирусам.', en: 'Carries antibodies to all known viruses.', uz: 'Barcha viruslarga qarshi antitanalarga ega.' }
  },
  {
    id: 'char_android',
    type: 'character',
    name: { ru: 'Синтетик Gen-4', en: 'Synthetic Gen-4', uz: 'Sintetik Gen-4' },
    avatar: '🦿',
    price: 600,
    desc: { ru: 'Выглядит как человек, мыслит как суперкомпьютер.', en: 'Looks human, computes like supercomputer.', uz: 'Odamga o\'xshaydi, superkompyuterdek fikrlaydi.' }
  },
  {
    id: 'char_phantom',
    type: 'character',
    name: { ru: 'Теневой Фантом', en: 'Shadow Phantom', uz: 'Soya Fantomi' },
    avatar: '👥',
    price: 850,
    desc: { ru: 'Проходит сквозь запертые двери убежища.', en: 'Phases through locked steel airlocks.', uz: 'Qulflangan germoeshiqlardan o\'tib ketadi.' }
  },
  {
    id: 'char_reaper',
    type: 'character',
    name: { ru: 'Жнец Времени', en: 'Time Reaper', uz: 'Vaqt O\'roqchisi' },
    avatar: '⏳',
    price: 1300,
    desc: { ru: 'Отмеряет минуты до конца таймера.', en: 'Counts down minutes until extinction.', uz: 'Taymer tugashiga qolgan vaqtni sanaydi.' }
  },
  {
    id: 'char_spectre',
    type: 'character',
    name: { ru: 'Спектральный Страж', en: 'Spectral Warden', uz: 'Spektral Qo\'riqchi' },
    avatar: '👁️',
    price: 900,
    desc: { ru: 'Его взгляд пронзает любые стены бункера.', en: 'His gaze pierces bunker concrete walls.', uz: 'Bunker beton devorlarini ham teshib ko\'radi.' }
  },
  {
    id: 'char_warlord',
    type: 'character',
    name: { ru: 'Полевой Маршал', en: 'Iron Warlord', uz: 'Dala Marshali' },
    avatar: '👑',
    price: 1400,
    desc: { ru: 'Объединил выживших под одним знаменем.', en: 'United survivors under one iron banner.', uz: 'Tirik qolganlarni yagona bayroq ostida birlashtirgan.' }
  },
  {
    id: 'char_emperor',
    type: 'character',
    name: { ru: 'Император Подземелья', en: 'Underground Emperor', uz: 'Yerosti Imperatori' },
    avatar: '⚜️',
    price: 2000,
    desc: { ru: 'Правит самым глубоким убежищем на планете.', en: 'Rules the deepest bunker shelter on Earth.', uz: 'Sayyoradagi eng chuqur boshpanaga egalik qiladi.' }
  },
  {
    id: 'char_fireman',
    type: 'character',
    name: { ru: 'Ликвидатор Огня', en: 'Hazard Firefighter', uz: 'Olov Qutqaruvchisi' },
    avatar: '🧑‍🚒',
    price: 400,
    desc: { ru: 'Тушил взрыв реактора собственными руками.', en: 'Extinguished reactor meltdown with bare hands.', uz: 'Reaktor yong\'inini o\'z qo\'llari bilan o\'chirgan.' }
  },
  {
    id: 'char_diver',
    type: 'character',
    name: { ru: 'Батискафный Водолаз', en: 'Abyss Diver', uz: 'Suvosti G\'avvosi' },
    avatar: '🤿',
    price: 450,
    desc: { ru: 'Умеет находить чистые артезианские воды.', en: 'Can find underground pure aquifers.', uz: 'Yer osti toza suv zaxiralarini topa oladi.' }
  },
  {
    id: 'char_monk',
    type: 'character',
    name: { ru: 'Шаолиньский Аскет', en: 'Shaolin Ascetic', uz: 'Shaolin Asketi' },
    avatar: '🧘',
    price: 500,
    desc: { ru: 'Может обходиться одним глотком воды в сутки.', en: 'Can survive on single sip of water per day.', uz: 'Kuniga bir qultum suv bilan omon qoladi.' }
  },
  {
    id: 'char_chef',
    type: 'character',
    name: { ru: 'Мастер Пайков', en: 'Ration Master Chef', uz: 'Oziq-ovqat Ustasi' },
    avatar: '👨‍🍳',
    price: 350,
    desc: { ru: 'Приготовит деликатес из консервированных бобов.', en: 'Makes gourmet stew from canned beans.', uz: 'Konservalangan loviyadan ajoyib taom tayyorlaydi.' }
  },
  {
    id: 'char_nuclear_pioneer',
    type: 'character',
    name: { ru: 'Атомный Пионер', en: 'Nuclear Pioneer', uz: 'Atom Kashfiyotchisi' },
    avatar: '☢️',
    price: 1000,
    desc: { ru: 'Первый ступил на выжженную землю столицы.', en: 'First to step into scorched atomic capital.', uz: 'Kulga aylangan poytaxtga birinchi qadam qo\'ygan.' }
  },
  {
    id: 'char_space_marine',
    type: 'character',
    name: { ru: 'Орбитальный Десантник', en: 'Space Marine', uz: 'Koinot Desantchisi' },
    avatar: '🚀',
    price: 1500,
    desc: { ru: 'Высадился из капсулы прямо на купол бункера.', en: 'Dropped in escape pod right onto bunker dome.', uz: 'Kapsulada to\'g\'ridan-to\'g\'ri bunker gumbaziga tushgan.' }
  },
  {
    id: 'char_immortal_king',
    type: 'character',
    name: { ru: 'Бессмертный Правитель', en: 'Immortal Sovereign', uz: 'O\'lmas Hukmdor' },
    avatar: '🌟',
    price: 3000,
    desc: { ru: 'Видел рождение и закат пяти цивилизаций.', en: 'Witnessed birth and fall of five civilizations.', uz: 'Besh sivilizatsiyaning tug\'ilishi va halokatini ko\'rgan.' }
  },
  {
    id: 'char_bunker_cat',
    type: 'character',
    name: { ru: 'Талисман Бункера', en: 'Bunker Cat Mascot', uz: 'Bunker Mushugi' },
    avatar: '🐱',
    price: 500,
    desc: { ru: 'Ловит радиоактивных крыс и поднимает мораль.', en: 'Hunts radioactive rats and boosts bunker morale.', uz: 'Radiatsion kalamushlarni ovlaydi va kayfiyatni ko\'taradi.' }
  },

  // ==========================================
  // 2. AVATAR FRAMES / AURAS (52 items)
  // ==========================================
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
  {
    id: 'frame_blood',
    type: 'frame',
    name: { ru: 'Кровавый Рубин', en: 'Blood Ruby', uz: 'Qonli Yoqut' },
    borderClass: 'border-red-600 shadow-[0_0_20px_rgba(239,68,68,0.6)]',
    glowClass: 'ring-2 ring-red-500/80',
    price: 500
  },
  {
    id: 'frame_frost',
    type: 'frame',
    name: { ru: 'Ледяной Криоген', en: 'Cryo Frost', uz: 'Muzli Kriogen' },
    borderClass: 'border-sky-300 shadow-[0_0_20px_rgba(125,211,252,0.6)]',
    glowClass: 'ring-2 ring-sky-300',
    price: 450
  },
  {
    id: 'frame_cyber_cyan',
    type: 'frame',
    name: { ru: 'Неоновый Циан', en: 'Neon Cyan', uz: 'Neon Moviy' },
    borderClass: 'border-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.6)]',
    glowClass: 'ring-2 ring-teal-400',
    price: 400
  },
  {
    id: 'frame_void',
    type: 'frame',
    name: { ru: 'Черная Бездна', en: 'Void Singularity', uz: 'Qora Tub' },
    borderClass: 'border-zinc-950 shadow-[0_0_25px_rgba(0,0,0,0.9)] ring-2 ring-zinc-700',
    glowClass: 'shadow-inner',
    price: 700
  },
  {
    id: 'frame_laser',
    type: 'frame',
    name: { ru: 'Лазерная Сетка', en: 'Laser Grid', uz: 'Lazer Panjara' },
    borderClass: 'border-red-500 border-dashed animate-pulse',
    glowClass: 'ring-1 ring-red-400',
    price: 350
  },
  {
    id: 'frame_hazard_stripes',
    type: 'frame',
    name: { ru: 'Опасная Зона ⚠️', en: 'Hazard Zone Stripes', uz: 'Xavfli Hudud' },
    borderClass: 'border-yellow-500 border-double border-4 shadow-md',
    glowClass: 'ring-2 ring-amber-600',
    price: 300
  },
  {
    id: 'frame_neon_pink',
    type: 'frame',
    name: { ru: 'Токсичный Розовый', en: 'Toxic Pink', uz: 'Toksik Pushti' },
    borderClass: 'border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.6)]',
    glowClass: 'ring-2 ring-pink-400',
    price: 400
  },
  {
    id: 'frame_electric',
    type: 'frame',
    name: { ru: 'Электроразряд ⚡', en: 'Electric Surge', uz: 'Elektr Zaryadi' },
    borderClass: 'border-blue-400 shadow-[0_0_25px_rgba(96,165,250,0.8)] animate-pulse',
    glowClass: 'ring-2 ring-blue-300',
    price: 550
  },
  {
    id: 'frame_emerald_glow',
    type: 'frame',
    name: { ru: 'Изумрудный Ореол', en: 'Emerald Halo', uz: 'Zumrad Nur' },
    borderClass: 'border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.6)]',
    glowClass: 'ring-2 ring-green-300',
    price: 450
  },
  {
    id: 'frame_obsidian',
    type: 'frame',
    name: { ru: 'Обсидиановая Броня', en: 'Obsidian Armor', uz: 'Obsidian Zirh' },
    borderClass: 'border-stone-800 shadow-[0_0_15px_rgba(41,37,36,0.8)] border-4',
    glowClass: 'ring-1 ring-stone-600',
    price: 500
  },
  {
    id: 'frame_solar_flare',
    type: 'frame',
    name: { ru: 'Солнечная Вспышка ☀️', en: 'Solar Flare', uz: 'Quyosh Chaqnashi' },
    borderClass: 'border-orange-500 shadow-[0_0_25px_rgba(249,115,22,0.7)]',
    glowClass: 'ring-2 ring-orange-400',
    price: 650
  },
  {
    id: 'frame_toxic_sludge',
    type: 'frame',
    name: { ru: 'Кислотный Шлам 🧪', en: 'Acidic Sludge', uz: 'Kislotali Loyqa' },
    borderClass: 'border-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.7)]',
    glowClass: 'ring-2 ring-lime-300',
    price: 350
  },
  {
    id: 'frame_cosmic_starlight',
    type: 'frame',
    name: { ru: 'Звездная Туманность ✨', en: 'Cosmic Starlight', uz: 'Yulduz Tumani' },
    borderClass: 'border-indigo-400 shadow-[0_0_22px_rgba(129,140,248,0.7)]',
    glowClass: 'ring-2 ring-indigo-300',
    price: 700
  },
  {
    id: 'frame_rainbow_holo',
    type: 'frame',
    name: { ru: 'Радужная Голограмма 🌈', en: 'Rainbow Hologram', uz: 'Kamalak Gologramma' },
    borderClass: 'border-fuchsia-400 shadow-[0_0_25px_rgba(232,121,249,0.8)] animate-pulse',
    glowClass: 'ring-2 ring-cyan-400',
    price: 900
  },
  {
    id: 'frame_diamond',
    type: 'frame',
    name: { ru: 'Алмазный Блеск 💎', en: 'Diamond Shimmer', uz: 'Olmos Jilosi' },
    borderClass: 'border-cyan-200 shadow-[0_0_25px_rgba(165,243,252,0.9)]',
    glowClass: 'ring-2 ring-white',
    price: 1000
  },
  {
    id: 'frame_ruby',
    type: 'frame',
    name: { ru: 'Багровый Кристалл', en: 'Crimson Crystal', uz: 'Qizil Billur' },
    borderClass: 'border-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.6)]',
    glowClass: 'ring-2 ring-rose-400',
    price: 600
  },
  {
    id: 'frame_sapphire',
    type: 'frame',
    name: { ru: 'Глубокий Сапфир', en: 'Deep Sapphire', uz: 'Moviy Sapfir' },
    borderClass: 'border-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.6)]',
    glowClass: 'ring-2 ring-blue-400',
    price: 600
  },
  {
    id: 'frame_amethyst',
    type: 'frame',
    name: { ru: 'Мистический Аметист', en: 'Mystic Amethyst', uz: 'Sehrli Ametist' },
    borderClass: 'border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.6)]',
    glowClass: 'ring-2 ring-violet-400',
    price: 600
  },
  {
    id: 'frame_steampunk_brass',
    type: 'frame',
    name: { ru: 'Паровая Латунь ⚙️', en: 'Steampunk Brass', uz: 'Bug\'li Guruch' },
    borderClass: 'border-amber-700 border-4 shadow-md',
    glowClass: 'ring-1 ring-yellow-600',
    price: 400
  },
  {
    id: 'frame_carbon_fiber',
    type: 'frame',
    name: { ru: 'Карбоновое Волокно', en: 'Carbon Fiber', uz: 'Uglerod Tolasi' },
    borderClass: 'border-zinc-700 border-4 shadow-inner',
    glowClass: 'ring-1 ring-zinc-500',
    price: 450
  },
  {
    id: 'frame_dark_matter',
    type: 'frame',
    name: { ru: 'Темная Материя', en: 'Dark Matter', uz: 'Qorong\'u Materiya' },
    borderClass: 'border-purple-950 shadow-[0_0_30px_rgba(88,28,135,0.8)]',
    glowClass: 'ring-2 ring-purple-600',
    price: 850
  },
  {
    id: 'frame_magma',
    type: 'frame',
    name: { ru: 'Расплавленная Лава 🌋', en: 'Molten Lava', uz: 'Erib ketgan Magma' },
    borderClass: 'border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.8)] animate-pulse',
    glowClass: 'ring-2 ring-yellow-500',
    price: 750
  },
  {
    id: 'frame_glitch',
    type: 'frame',
    name: { ru: 'Цифровой Глитч 📺', en: 'Digital Glitch', uz: 'Raqamli Xatolik' },
    borderClass: 'border-emerald-400 border-dotted border-4 animate-bounce',
    glowClass: 'ring-1 ring-pink-500',
    price: 650
  },
  {
    id: 'frame_quantum',
    type: 'frame',
    name: { ru: 'Квантовое Поле', en: 'Quantum Field', uz: 'Kvant Maydoni' },
    borderClass: 'border-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.7)]',
    glowClass: 'ring-2 ring-indigo-400',
    price: 800
  },
  {
    id: 'frame_apocalypse_rust',
    type: 'frame',
    name: { ru: 'Ржавый Металл', en: 'Apocalypse Rust', uz: 'Zanglagan Temir' },
    borderClass: 'border-amber-900 border-4 shadow-sm',
    glowClass: 'ring-1 ring-amber-800',
    price: 200
  },
  {
    id: 'frame_angelic_white',
    type: 'frame',
    name: { ru: 'Священный Свет 🕊️', en: 'Angelic Radiance', uz: 'Muqaddas Nur' },
    borderClass: 'border-white shadow-[0_0_25px_rgba(255,255,255,0.9)]',
    glowClass: 'ring-2 ring-yellow-200',
    price: 950
  },
  {
    id: 'frame_demon_horns',
    type: 'frame',
    name: { ru: 'Адский Огонь 😈', en: 'Hellfire Core', uz: 'Do\'zax Olovi' },
    borderClass: 'border-rose-700 shadow-[0_0_25px_rgba(190,18,60,0.8)]',
    glowClass: 'ring-2 ring-red-600',
    price: 900
  },
  {
    id: 'frame_matrix_code',
    type: 'frame',
    name: { ru: 'Код Матрицы 🟩', en: 'Matrix Stream', uz: 'Matritsa Kodi' },
    borderClass: 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.7)]',
    glowClass: 'ring-2 ring-emerald-500',
    price: 550
  },
  {
    id: 'frame_aurora',
    type: 'frame',
    name: { ru: 'Полярное Сияние 🌌', en: 'Northern Aurora', uz: 'Shimol Yog\'dusi' },
    borderClass: 'border-emerald-300 shadow-[0_0_25px_rgba(110,231,183,0.7)]',
    glowClass: 'ring-2 ring-teal-300',
    price: 700
  },
  {
    id: 'frame_vortex',
    type: 'frame',
    name: { ru: 'Искривление Вихря 🌀', en: 'Vortex Rift', uz: 'Girdob Bukilishi' },
    borderClass: 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.7)]',
    glowClass: 'ring-2 ring-blue-500',
    price: 650
  },
  {
    id: 'frame_atomic',
    type: 'frame',
    name: { ru: 'Атомный Распад ⚛️', en: 'Atomic Fission', uz: 'Atom Parchalanishi' },
    borderClass: 'border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.8)] animate-pulse',
    glowClass: 'ring-2 ring-amber-500',
    price: 850
  },
  {
    id: 'frame_biohazard_pulse',
    type: 'frame',
    name: { ru: 'Био-Импульс ☣️', en: 'Biohazard Pulse', uz: 'Bio-Impuls' },
    borderClass: 'border-green-600 shadow-[0_0_20px_rgba(22,163,74,0.7)] animate-ping',
    glowClass: 'ring-2 ring-lime-500',
    price: 600
  },
  {
    id: 'frame_ultraviolet',
    type: 'frame',
    name: { ru: 'Ультрафиолет 🔮', en: 'Ultraviolet Beam', uz: 'Ultrabinafsha' },
    borderClass: 'border-fuchsia-600 shadow-[0_0_25px_rgba(192,38,211,0.7)]',
    glowClass: 'ring-2 ring-fuchsia-400',
    price: 600
  },
  {
    id: 'frame_synthwave',
    type: 'frame',
    name: { ru: 'Ретровейв 80-х 🌆', en: 'Synthwave 80s', uz: 'Sintveyv 80-yillar' },
    borderClass: 'border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.7)]',
    glowClass: 'ring-2 ring-cyan-400',
    price: 550
  },
  {
    id: 'frame_deep_abyss',
    type: 'frame',
    name: { ru: 'Глубокая Впадина 🌊', en: 'Mariana Trench', uz: 'Okean Tubi' },
    borderClass: 'border-blue-900 shadow-[0_0_20px_rgba(30,58,138,0.7)]',
    glowClass: 'ring-2 ring-blue-700',
    price: 400
  },
  {
    id: 'frame_supernova',
    type: 'frame',
    name: { ru: 'Взрыв Сверхновой 💥', en: 'Supernova Blast', uz: 'Supernova Portlashi' },
    borderClass: 'border-amber-300 shadow-[0_0_35px_rgba(252,211,77,0.9)] animate-pulse',
    glowClass: 'ring-4 ring-orange-500',
    price: 1200
  },
  {
    id: 'frame_prism',
    type: 'frame',
    name: { ru: 'Хрустальная Призма 💠', en: 'Prismatic Crystal', uz: 'Billur Prizma' },
    borderClass: 'border-violet-300 shadow-[0_0_20px_rgba(196,181,253,0.8)]',
    glowClass: 'ring-2 ring-pink-300',
    price: 750
  },
  {
    id: 'frame_inferno',
    type: 'frame',
    name: { ru: 'Адское Пекло 🔥', en: 'Infernal Blaze', uz: 'Olovli Do\'zax' },
    borderClass: 'border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.9)]',
    glowClass: 'ring-2 ring-yellow-400',
    price: 900
  },
  {
    id: 'frame_thunder',
    type: 'frame',
    name: { ru: 'Грозовой Шторм 🌩️', en: 'Thunderstorm', uz: 'Chaqmoq Bo\'roni' },
    borderClass: 'border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.8)]',
    glowClass: 'ring-2 ring-sky-300',
    price: 650
  },
  {
    id: 'frame_dragon_fire',
    type: 'frame',
    name: { ru: 'Драконье Пламя 🐉', en: 'Dragon Breath', uz: 'Ajdaho Nafasi' },
    borderClass: 'border-orange-600 shadow-[0_0_25px_rgba(234,88,12,0.8)]',
    glowClass: 'ring-2 ring-red-500',
    price: 850
  },
  {
    id: 'frame_spectral_mist',
    type: 'frame',
    name: { ru: 'Призрачный Туман 👻', en: 'Spectral Fog', uz: 'Arvohli Tuman' },
    borderClass: 'border-purple-400 shadow-[0_0_25px_rgba(192,132,252,0.8)] animate-pulse',
    glowClass: 'ring-2 ring-purple-300',
    price: 700
  },
  {
    id: 'frame_galactic',
    type: 'frame',
    name: { ru: 'Галактическое Ядро 🪐', en: 'Galactic Core', uz: 'Galaktika Yadrosi' },
    borderClass: 'border-fuchsia-500 shadow-[0_0_30px_rgba(217,70,239,0.8)]',
    glowClass: 'ring-2 ring-indigo-400',
    price: 1100
  },
  {
    id: 'frame_infinity',
    type: 'frame',
    name: { ru: 'Знак Бесконечности ♾️', en: 'Infinity Loop', uz: 'Cheksizlik Belgisi' },
    borderClass: 'border-teal-300 shadow-[0_0_30px_rgba(94,234,212,0.9)]',
    glowClass: 'ring-2 ring-cyan-200',
    price: 1500
  },
  {
    id: 'frame_champion_aegis',
    type: 'frame',
    name: { ru: 'Эгида Чемпиона 🏆', en: 'Champion Aegis', uz: 'Chempion Qalqoni' },
    borderClass: 'border-yellow-300 shadow-[0_0_35px_rgba(253,224,71,0.9)] animate-pulse',
    glowClass: 'ring-4 ring-amber-400',
    price: 2000
  },
  {
    id: 'frame_bunker_zero',
    type: 'frame',
    name: { ru: 'Бункер Нулевой 🏛️', en: 'Vault Zero', uz: 'Nolinchi Bunker' },
    borderClass: 'border-emerald-400 border-4 shadow-2xl',
    glowClass: 'ring-2 ring-emerald-300',
    price: 1800
  },
  {
    id: 'frame_godlike',
    type: 'frame',
    name: { ru: 'Божественный Нимб 👑', en: 'Godlike Halo', uz: 'Ilohiy Toj' },
    borderClass: 'border-yellow-200 shadow-[0_0_40px_rgba(254,240,138,1)] animate-bounce',
    glowClass: 'ring-4 ring-yellow-400',
    price: 3500
  },

  // ==========================================
  // 3. SURVIVOR TITLES / RANKS (52 items)
  // ==========================================
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
  },
  {
    id: 'title_terminator',
    type: 'title',
    name: { ru: 'Стальной Терминатор', en: 'Steel Terminator', uz: 'Po\'lat Terminator' },
    color: 'text-rose-500 font-black',
    price: 800
  },
  {
    id: 'title_god',
    type: 'title',
    name: { ru: 'Бог Бункера', en: 'God of Vault', uz: 'Bunker Tangrisi' },
    color: 'text-amber-300 font-black uppercase tracking-widest',
    price: 2500
  },
  {
    id: 'title_architect',
    type: 'title',
    name: { ru: 'Архитектор Убежища', en: 'Vault Architect', uz: 'Boshpana Me\'mori' },
    color: 'text-teal-400 font-bold',
    price: 450
  },
  {
    id: 'title_whisperer',
    type: 'title',
    name: { ru: 'Шепчущий с Призраками', en: 'Ghost Whisperer', uz: 'Arvohlar Bilan Gaplashuvchi' },
    color: 'text-fuchsia-400 font-semibold',
    price: 500
  },
  {
    id: 'title_bluff_king',
    type: 'title',
    name: { ru: 'Король Блефа', en: 'King of Bluff', uz: 'Yolg\'on Qiroli' },
    color: 'text-yellow-500 font-extrabold',
    price: 600
  },
  {
    id: 'title_tactician',
    type: 'title',
    name: { ru: 'Гений Тактики', en: 'Tactical Genius', uz: 'Taktik Daho' },
    color: 'text-blue-400 font-bold',
    price: 500
  },
  {
    id: 'title_diplomat',
    type: 'title',
    name: { ru: 'Главный Дипломат', en: 'Chief Diplomat', uz: 'Bosh Diplomat' },
    color: 'text-emerald-400 font-bold',
    price: 350
  },
  {
    id: 'title_infiltrator',
    type: 'title',
    name: { ru: 'Невидимый Шпион', en: 'Phantom Infiltrator', uz: 'Ko\'rinmas Josus' },
    color: 'text-zinc-400 font-medium',
    price: 400
  },
  {
    id: 'title_shadow',
    type: 'title',
    name: { ru: 'Тень Апокалипсиса', en: 'Apocalypse Shadow', uz: 'Qiyomat Soyasi' },
    color: 'text-indigo-400 font-bold',
    price: 550
  },
  {
    id: 'title_overlord',
    type: 'title',
    name: { ru: 'Владыка Сектора', en: 'Sector Overlord', uz: 'Sektor Hukmdori' },
    color: 'text-purple-500 font-black',
    price: 900
  },
  {
    id: 'title_savior',
    type: 'title',
    name: { ru: 'Спаситель Человечества', en: 'Savior of Humanity', uz: 'Insoniyat Najotkori' },
    color: 'text-amber-300 font-extrabold',
    price: 1500
  },
  {
    id: 'title_slayer',
    type: 'title',
    name: { ru: 'Истребитель Мутантов', en: 'Mutant Slayer', uz: 'Mutantlar Kushandasi' },
    color: 'text-red-500 font-bold',
    price: 700
  },
  {
    id: 'title_king',
    type: 'title',
    name: { ru: 'Король Пустошей', en: 'Wasteland King', uz: 'Sahro Qiroli' },
    color: 'text-yellow-400 font-black tracking-wide',
    price: 1200
  },
  {
    id: 'title_ace',
    type: 'title',
    name: { ru: 'Туз в Рукаве', en: 'Ace in Hole', uz: 'Yashirin Qozir' },
    color: 'text-amber-500 font-bold',
    price: 450
  },
  {
    id: 'title_samurai',
    type: 'title',
    name: { ru: 'Ронин Бункера', en: 'Bunker Ronin', uz: 'Bunker Ronini' },
    color: 'text-cyan-300 font-bold',
    price: 650
  },
  {
    id: 'title_scout',
    type: 'title',
    name: { ru: 'Атомный Скаут', en: 'Atomic Scout', uz: 'Atom Skauti' },
    color: 'text-lime-400 font-bold',
    price: 350
  },
  {
    id: 'title_overseer',
    type: 'title',
    name: { ru: 'Смотритель Блока', en: 'Block Overseer', uz: 'Blok Nazoratchisi' },
    color: 'text-orange-400 font-bold',
    price: 500
  },
  {
    id: 'title_last_human',
    type: 'title',
    name: { ru: 'Последний Человек', en: 'The Last Human', uz: 'So\'nggi Odam' },
    color: 'text-slate-200 font-black',
    price: 800
  },
  {
    id: 'title_lone_wolf',
    type: 'title',
    name: { ru: 'Одинокий Волк', en: 'Lone Wolf', uz: 'Yolg\'iz Bo\'ri' },
    color: 'text-zinc-300 font-bold',
    price: 400
  },
  {
    id: 'title_iron_will',
    type: 'title',
    name: { ru: 'Железная Воля', en: 'Iron Will', uz: 'Temir Iroda' },
    color: 'text-slate-300 font-extrabold',
    price: 550
  },
  {
    id: 'title_mastermind',
    type: 'title',
    name: { ru: 'Серый Кардинал', en: 'The Mastermind', uz: 'Parda Ortidagi Daho' },
    color: 'text-violet-400 font-black',
    price: 850
  },
  {
    id: 'title_prophet',
    type: 'title',
    name: { ru: 'Пророк Катастрофы', en: 'Doomsday Prophet', uz: 'Qiyomat Payg\'ambari' },
    color: 'text-amber-400 font-semibold',
    price: 600
  },
  {
    id: 'title_biohazard',
    type: 'title',
    name: { ru: 'Биологическая Угроза', en: 'Biohazard Entity', uz: 'Biologik Xavf' },
    color: 'text-emerald-500 font-extrabold',
    price: 650
  },
  {
    id: 'title_radioactive',
    type: 'title',
    name: { ru: 'Радиоактивный Изотоп', en: 'Radioactive Core', uz: 'Radiatsion Izotop' },
    color: 'text-green-400 font-black',
    price: 700
  },
  {
    id: 'title_oracle',
    type: 'title',
    name: { ru: 'Оракул Судьбы', en: 'Oracle of Fate', uz: 'Taqdir Folbini' },
    color: 'text-sky-300 font-bold',
    price: 750
  },
  {
    id: 'title_executioner',
    type: 'title',
    name: { ru: 'Верховный Палач', en: 'Supreme Executioner', uz: 'Bosh Jallod' },
    color: 'text-red-600 font-black',
    price: 900
  },
  {
    id: 'title_peacemaker',
    type: 'title',
    name: { ru: 'Миротворец Зоны', en: 'Zone Peacemaker', uz: 'Zona Tinchlikparvari' },
    color: 'text-blue-300 font-medium',
    price: 350
  },
  {
    id: 'title_rebel',
    type: 'title',
    name: { ru: 'Мятежник Сектора', en: 'Sector Rebel', uz: 'Sektor Isyonchisi' },
    color: 'text-orange-500 font-bold',
    price: 450
  },
  {
    id: 'title_bounty_ace',
    type: 'title',
    name: { ru: 'Элитный Наемник', en: 'Elite Mercenary', uz: 'Elita Yollanmasi' },
    color: 'text-yellow-600 font-bold',
    price: 600
  },
  {
    id: 'title_phantom_lord',
    type: 'title',
    name: { ru: 'Повелитель Фантомов', en: 'Phantom Lord', uz: 'Fantomlar Lordi' },
    color: 'text-purple-300 font-black',
    price: 1100
  },
  {
    id: 'title_prepper',
    type: 'title',
    name: { ru: 'Выживальщик 100 LVL', en: '100 LVL Prepper', uz: '100-Daraja Omon Qoluvchi' },
    color: 'text-lime-300 font-extrabold',
    price: 800
  },
  {
    id: 'title_titan',
    type: 'title',
    name: { ru: 'Несокрушимый Титан', en: 'Unbreakable Titan', uz: 'Yengilmas Titan' },
    color: 'text-cyan-200 font-black',
    price: 1300
  },
  {
    id: 'title_phoenix',
    type: 'title',
    name: { ru: 'Ядерный Феникс', en: 'Nuclear Phoenix', uz: 'Atom Feniksi' },
    color: 'text-orange-400 font-black tracking-wider',
    price: 1400
  },
  {
    id: 'title_conqueror',
    type: 'title',
    name: { ru: 'Завоеватель Бункеров', en: 'Vault Conqueror', uz: 'Bunkerlar Fotixi' },
    color: 'text-red-400 font-extrabold',
    price: 1200
  },
  {
    id: 'title_night_hunter',
    type: 'title',
    name: { ru: 'Ночной Хищник', en: 'Night Predator', uz: 'Tungi Yirtqich' },
    color: 'text-indigo-300 font-bold',
    price: 700
  },
  {
    id: 'title_silent_death',
    type: 'title',
    name: { ru: 'Бесшумная Смерть', en: 'Silent Death', uz: 'Ovozsiz O\'lim' },
    color: 'text-rose-400 font-black',
    price: 950
  },
  {
    id: 'title_supreme',
    type: 'title',
    name: { ru: 'Верховный Лидер', en: 'Supreme Leader', uz: 'Oliy Rahbar' },
    color: 'text-amber-200 font-black uppercase tracking-widest',
    price: 2200
  },
  {
    id: 'title_radiation_eater',
    type: 'title',
    name: { ru: 'Пожиратель Радиации', en: 'Radiation Devourer', uz: 'Radiatsiya Yutuvchisi' },
    color: 'text-green-300 font-extrabold',
    price: 850
  },
  {
    id: 'title_zen',
    type: 'title',
    name: { ru: 'Дзен-Аскет', en: 'Zen Ascetic', uz: 'Dzen Asketi' },
    color: 'text-emerald-300 font-medium',
    price: 400
  },
  {
    id: 'title_galaxy',
    type: 'title',
    name: { ru: 'Звездный Скиталец', en: 'Starlight Wanderer', uz: 'Yulduzlar Sayyohi' },
    color: 'text-purple-200 font-extrabold',
    price: 1300
  },
  {
    id: 'title_eternal',
    type: 'title',
    name: { ru: 'Вечный Страж', en: 'Eternal Sentinel', uz: 'Abadiy Qo\'riqchi' },
    color: 'text-cyan-100 font-black',
    price: 1600
  },
  {
    id: 'title_sovereign',
    type: 'title',
    name: { ru: 'Суверен Глубин', en: 'Deep Sovereign', uz: 'Chuqurlik Hukmdori' },
    color: 'text-blue-200 font-black',
    price: 1700
  },
  {
    id: 'title_alpha',
    type: 'title',
    name: { ru: 'Альфа-Выживший', en: 'Alpha Survivor', uz: 'Alfa Tirik Qoluvchi' },
    color: 'text-yellow-300 font-extrabold',
    price: 1100
  },
  {
    id: 'title_omega',
    type: 'title',
    name: { ru: 'Финальная Омега', en: 'Final Omega', uz: 'Yakuniy Omega' },
    color: 'text-rose-300 font-black',
    price: 1800
  },
  {
    id: 'title_bunker_hero',
    type: 'title',
    name: { ru: 'Народный Герой', en: 'People Hero', uz: 'Xalq Qahramoni' },
    color: 'text-amber-400 font-black',
    price: 1500
  },
  {
    id: 'title_predator',
    type: 'title',
    name: { ru: 'Высший Хищник', en: 'Apex Predator', uz: 'Eng Kuchli Yirtqich' },
    color: 'text-red-500 font-black tracking-widest',
    price: 2400
  }
];

module.exports = SHOP_ITEMS;

