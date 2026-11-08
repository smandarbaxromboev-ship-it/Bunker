// Cards Manager & Persistent Store for "Бункер: 7 Раундов Откровений"
// Loads base cards and handles Admin CRUD operations with disk persistence
const fs = require('fs');
const path = require('path');
const baseDatabase = require('./cardsDatabase');

const CUSTOM_FILE = path.join(__dirname, 'customCardsData.json');

class CardsManager {
  constructor() {
    this.categories = ['PROFESSIONS', 'HEALTH', 'HOBBIES', 'LUGGAGE', 'FACTS', 'SPECIALS'];
    this.cards = {
      PROFESSIONS: [...baseDatabase.PROFESSIONS],
      HEALTH: [...baseDatabase.HEALTH],
      HOBBIES: [...baseDatabase.HOBBIES],
      LUGGAGE: [...baseDatabase.LUGGAGE],
      FACTS: [...baseDatabase.FACTS],
      SPECIALS: [...baseDatabase.SPECIALS]
    };
    this.loadCustomData();
  }

  loadCustomData() {
    try {
      if (fs.existsSync(CUSTOM_FILE)) {
        const raw = fs.readFileSync(CUSTOM_FILE, 'utf8');
        const data = JSON.parse(raw);
        if (data.cards) {
          for (const cat of this.categories) {
            if (Array.isArray(data.cards[cat])) {
              this.cards[cat] = data.cards[cat];
            }
          }
        }
        console.log('[CARDS] Кастомная база карт успешно загружена');
      }
    } catch (e) {
      console.error('[CARDS] Ошибка загрузки customCardsData.json:', e);
    }
  }

  saveCustomData() {
    try {
      fs.writeFileSync(CUSTOM_FILE, JSON.stringify({ cards: this.cards }, null, 2), 'utf8');
      console.log('[CARDS] База карт успешно сохранена на диск');
    } catch (e) {
      console.error('[CARDS] Ошибка сохранения customCardsData.json:', e);
    }
  }

  getCards(category, search = '') {
    const cat = (category || 'ALL').toUpperCase();
    const q = (search || '').trim().toLowerCase();

    if (cat === 'ALL') {
      let allList = [];
      for (const c of this.categories) {
        const catCards = (this.cards[c] || []).map((card, idx) => ({ ...card, _idx: idx, _category: c }));
        allList = allList.concat(catCards);
      }
      if (q) {
        allList = allList.filter(c =>
          (c.ru && c.ru.toLowerCase().includes(q)) ||
          (c.en && c.en.toLowerCase().includes(q)) ||
          (c.uz && c.uz.toLowerCase().includes(q)) ||
          (c.d_ru && c.d_ru.toLowerCase().includes(q)) ||
          (c.d_en && c.d_en.toLowerCase().includes(q)) ||
          (c.d_uz && c.d_uz.toLowerCase().includes(q)) ||
          (c.ability && c.ability.toLowerCase().includes(q))
        );
      }
      return allList;
    }

    if (!this.cards[cat]) return [];
    
    let list = this.cards[cat].map((card, idx) => ({ ...card, _idx: idx, _category: cat }));
    if (q) {
      list = list.filter(c => 
        (c.ru && c.ru.toLowerCase().includes(q)) ||
        (c.en && c.en.toLowerCase().includes(q)) ||
        (c.uz && c.uz.toLowerCase().includes(q)) ||
        (c.d_ru && c.d_ru.toLowerCase().includes(q)) ||
        (c.d_en && c.d_en.toLowerCase().includes(q)) ||
        (c.d_uz && c.d_uz.toLowerCase().includes(q)) ||
        (c.ability && c.ability.toLowerCase().includes(q))
      );
    }
    return list;
  }

  getStats() {
    const stats = {};
    for (const cat of this.categories) {
      stats[cat] = this.cards[cat].length;
    }
    return stats;
  }

  addCard(category, cardData) {
    const cat = (category || '').toUpperCase();
    if (!this.cards[cat]) return { error: `Категория ${category} не существует` };

    const newCard = {
      ru: cardData.ru || 'Новая карта',
      en: cardData.en || 'New Card',
      uz: cardData.uz || 'Yangi karta',
      d_ru: cardData.d_ru || cardData.ru || '',
      d_en: cardData.d_en || cardData.en || '',
      d_uz: cardData.d_uz || cardData.uz || ''
    };

    if (cat === 'SPECIALS') {
      newCard.ability = cardData.ability || 'reroll_self';
    }

    this.cards[cat].unshift(newCard); // Добавляем в начало
    this.saveCustomData();
    return { success: true, card: newCard, total: this.cards[cat].length };
  }

  updateCard(category, index, cardData) {
    const cat = (category || '').toUpperCase();
    if (!this.cards[cat]) return { error: `Категория ${category} не существует` };

    const idx = parseInt(index, 10);
    if (isNaN(idx) || idx < 0 || idx >= this.cards[cat].length) {
      return { error: 'Неверный индекс карты' };
    }

    const existing = this.cards[cat][idx];
    this.cards[cat][idx] = {
      ...existing,
      ru: cardData.ru !== undefined ? cardData.ru : existing.ru,
      en: cardData.en !== undefined ? cardData.en : existing.en,
      uz: cardData.uz !== undefined ? cardData.uz : existing.uz,
      d_ru: cardData.d_ru !== undefined ? cardData.d_ru : existing.d_ru,
      d_en: cardData.d_en !== undefined ? cardData.d_en : existing.d_en,
      d_uz: cardData.d_uz !== undefined ? cardData.d_uz : existing.d_uz,
      ability: cardData.ability !== undefined ? cardData.ability : existing.ability
    };

    this.saveCustomData();
    return { success: true, card: this.cards[cat][idx] };
  }

  deleteCard(category, index) {
    const cat = (category || '').toUpperCase();
    if (!this.cards[cat]) return { error: `Категория ${category} не существует` };

    const idx = parseInt(index, 10);
    if (isNaN(idx) || idx < 0 || idx >= this.cards[cat].length) {
      return { error: 'Неверный индекс карты' };
    }

    const removed = this.cards[cat].splice(idx, 1);
    this.saveCustomData();
    return { success: true, removed: removed[0], total: this.cards[cat].length };
  }

  getActivePool(category) {
    const cat = (category || '').toUpperCase();
    return this.cards[cat] || [];
  }
}

const cardsManager = new CardsManager();
module.exports = cardsManager;

