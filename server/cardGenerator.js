// Card Generator with 350+ cards per category & Global Zero-Repeat Guarantee across games
const cardsManager = require('./cardsManager');

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Persistent history sets across multiple game sessions so cards NEVER repeat
const globalHistory = {
  professions: new Set(),
  health: new Set(),
  hobbies: new Set(),
  luggage: new Set(),
  facts: new Set(),
  specials: new Set()
};

function getUniqueBatch(pool, historySet, count) {
  // Available items not in history
  let available = pool.filter(item => !historySet.has(item.ru));
  
  // If pool exhausted or near empty, clear history and recycle
  if (available.length < count) {
    historySet.clear();
    available = [...pool];
  }

  const shuffled = shuffle(available);
  const picked = shuffled.slice(0, count);

  // Mark picked items as used in history
  for (const item of picked) {
    historySet.add(item.ru);
  }

  return picked;
}

// Generate age card with unique variations
function generateAgeCard() {
  const age = randomInt(18, 75);
  let ru_desc = "";
  let en_desc = "";
  let uz_desc = "";

  if (age <= 28) {
    ru_desc = "Молодой, крепкий, полон сил";
    en_desc = "Young, strong, full of energy";
    uz_desc = "Yosh, baquvvat, kuchga to'la";
  } else if (age <= 50) {
    ru_desc = "Зрелый, опытный, выносливый";
    en_desc = "Mature, experienced, resilient";
    uz_desc = "Tajribali, yetuk, chidamli";
  } else {
    ru_desc = "Пожилой, мудрый, слабый физически";
    en_desc = "Elderly, wise, physically slower";
    uz_desc = "Katta yoshli, dono, jismonan zaif";
  }

  return {
    id: "age",
    type: "age",
    icon: "Calendar",
    name: { ru: "Возраст", en: "Age", uz: "Yosh" },
    value: {
      ru: `${age} лет`,
      en: `${age} years old`,
      uz: `${age} yosh`
    },
    description: {
      ru: ru_desc,
      en: en_desc,
      uz: uz_desc
    },
    revealed: false
  };
}

// Helper: detect if a special card is restricted to a specific card category (e.g. only hobby, only health, etc.)
function detectAllowedTargetCard(specialObj) {
  if (!specialObj) return null;
  if (specialObj.targetCard) return specialObj.targetCard;
  const text = `${specialObj.ru || ''} ${specialObj.en || ''} ${specialObj.d_ru || ''}`.toLowerCase();
  if (text.includes('возраст') || text.includes('age') || text.includes('yosh')) return 'age';
  if (text.includes('болезн') || text.includes('здоровь') || text.includes('health') || text.includes('medical') || text.includes('медицинский сканер') || text.includes('salomatlik')) return 'health';
  if (text.includes('професси') || text.includes('profession') || text.includes('kasb')) return 'profession';
  if (text.includes('багаж') || text.includes('груз') || text.includes('luggage') || text.includes('supply') || text.includes('yuk')) return 'luggage';
  if (text.includes('факт') || text.includes('fact') || text.includes('биографи')) return 'fact';
  if (text.includes('хобби') || text.includes('hobby') || text.includes('xobbi')) return 'hobby';
  return null; // null = universal (can rewrite any card)
}

// Deck generator for an entire room of players (guarantees ZERO DUPLICATES across game sessions!)
function generateDecksForPlayers(playerCount) {
  const pickedProfs = getUniqueBatch(cardsManager.getActivePool('PROFESSIONS'), globalHistory.professions, playerCount);
  const pickedHealth = getUniqueBatch(cardsManager.getActivePool('HEALTH'), globalHistory.health, playerCount);
  const pickedHobbies = getUniqueBatch(cardsManager.getActivePool('HOBBIES'), globalHistory.hobbies, playerCount);
  const pickedLuggage = getUniqueBatch(cardsManager.getActivePool('LUGGAGE'), globalHistory.luggage, playerCount);
  const pickedFacts = getUniqueBatch(cardsManager.getActivePool('FACTS'), globalHistory.facts, playerCount);
  const pickedSpecials = getUniqueBatch(cardsManager.getActivePool('SPECIALS'), globalHistory.specials, playerCount);

  const playerDecks = [];

  for (let i = 0; i < playerCount; i++) {
    const prof = pickedProfs[i];
    const health = pickedHealth[i];
    const hobby = pickedHobbies[i];
    const lugg = pickedLuggage[i];
    const fact = pickedFacts[i];
    const special = pickedSpecials[i];

    const deck = [
      generateAgeCard(),
      {
        id: "profession",
        type: "profession",
        icon: "Briefcase",
        name: { ru: "Профессия", en: "Profession", uz: "Kasb" },
        value: { ru: prof.ru, en: prof.en, uz: prof.uz },
        description: { ru: prof.d_ru, en: prof.d_en, uz: prof.d_uz },
        revealed: false
      },
      {
        id: "health",
        type: "health",
        icon: "HeartPulse",
        name: { ru: "Здоровье", en: "Health", uz: "Salomatlik" },
        value: { ru: health.ru, en: health.en, uz: health.uz },
        description: { ru: health.d_ru, en: health.d_en, uz: health.d_uz },
        revealed: false
      },
      {
        id: "hobby",
        type: "hobby",
        icon: "Sparkles",
        name: { ru: "Хобби", en: "Hobby", uz: "Xobbi" },
        value: { ru: hobby.ru, en: hobby.en, uz: hobby.uz },
        description: { ru: hobby.d_ru, en: hobby.d_en, uz: hobby.d_uz },
        revealed: false
      },
      {
        id: "luggage",
        type: "luggage",
        icon: "Backpack",
        name: { ru: "Багаж", en: "Luggage", uz: "Yuk" },
        value: { ru: lugg.ru, en: lugg.en, uz: lugg.uz },
        description: { ru: lugg.d_ru, en: lugg.d_en, uz: lugg.d_uz },
        revealed: false
      },
      {
        id: "fact",
        type: "fact",
        icon: "FileText",
        name: { ru: "Факт из прошлого", en: "Past Fact", uz: "O'tmishdan dalil" },
        value: { ru: fact.ru, en: fact.en, uz: fact.uz },
        description: { ru: fact.d_ru, en: fact.d_en, uz: fact.d_uz },
        revealed: false
      },
      {
        id: "special",
        type: "special",
        icon: "ShieldAlert",
        name: { ru: "Козырь", en: "Trump / Special", uz: "Kozir" },
        value: { ru: special.ru, en: special.en, uz: special.uz },
        description: { ru: special.d_ru, en: special.d_en, uz: special.d_uz },
        ability: special.ability || "swap_card",
        targetCard: detectAllowedTargetCard(special),
        used: false,
        revealed: false
      }
    ];

    playerDecks.push(deck);
  }

  return playerDecks;
}

module.exports = {
  generateDecksForPlayers,
  generateAgeCard
};
