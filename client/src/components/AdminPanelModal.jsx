import React, { useState, useEffect } from 'react';
import { translations, getLocalized } from '../utils/translations';
import { ShieldCheck, Key, Plus, Trash2, Edit3, Search, X, Check, AlertCircle, Coins } from 'lucide-react';

export default function AdminPanelModal({ socket, lang, onClose }) {
  const t = translations[lang] || translations.ru;

  // Admin auth state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminLogin, setAdminLogin] = useState('Samandar');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Dashboard state
  const [activeCategory, setActiveCategory] = useState('PROFESSIONS');
  const [search, setSearch] = useState('');
  const [cards, setCards] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Add / Edit Modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // null = new, number = edit
  const [cardRu, setCardRu] = useState('');
  const [cardEn, setCardEn] = useState('');
  const [cardUz, setCardUz] = useState('');
  const [descRu, setDescRu] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descUz, setDescUz] = useState('');
  const [ability, setAbility] = useState('reroll_self');

  // Coin grant state
  const [coinTargetUser, setCoinTargetUser] = useState('');
  const [coinAmount, setCoinAmount] = useState('500');

  const categories = [
    { key: 'PROFESSIONS', label: t.adminTabProfessions || 'Профессии' },
    { key: 'HEALTH', label: t.adminTabHealth || 'Здоровье' },
    { key: 'HOBBIES', label: t.adminTabHobbies || 'Хобби' },
    { key: 'LUGGAGE', label: t.adminTabLuggage || 'Багаж' },
    { key: 'FACTS', label: t.adminTabFacts || 'Факты' },
    { key: 'SPECIALS', label: t.adminTabSpecials || 'Козыри' }
  ];

  const handleAdminLoginSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    socket.emit('adminLogin', { login: adminLogin.trim(), password: adminPassword.trim() }, (res) => {
      if (res && res.success) {
        setIsAdminLoggedIn(true);
        setStats(res.stats || {});
        loadCategoryCards('PROFESSIONS', '');
      } else {
        setAuthError((res && res.error) || 'Неверный логин или пароль администратора');
      }
    });
  };

  const loadCategoryCards = (cat, query) => {
    setLoading(true);
    socket.emit('adminGetCards', {
      login: adminLogin.trim(),
      password: adminPassword.trim(),
      category: cat,
      search: query
    }, (res) => {
      setLoading(false);
      if (res && res.success) {
        setCards(res.cards || []);
        if (res.stats) setStats(res.stats);
      }
    });
  };

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setSearch('');
    loadCategoryCards(cat, '');
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    loadCategoryCards(activeCategory, val);
  };

  // Open Editor for new or existing
  const openNewCardModal = () => {
    setEditingIndex(null);
    setCardRu('');
    setCardEn('');
    setCardUz('');
    setDescRu('');
    setDescEn('');
    setDescUz('');
    setAbility('reroll_self');
    setIsEditorOpen(true);
  };

  const openEditCardModal = (card) => {
    setEditingIndex(card._idx);
    setCardRu(card.ru || '');
    setCardEn(card.en || '');
    setCardUz(card.uz || '');
    setDescRu(card.d_ru || '');
    setDescEn(card.d_en || '');
    setDescUz(card.d_uz || '');
    setAbility(card.ability || 'reroll_self');
    setIsEditorOpen(true);
  };

  const handleSaveCard = (e) => {
    e.preventDefault();
    if (!cardRu.trim()) return;

    const payload = {
      ru: cardRu.trim(),
      en: cardEn.trim() || cardRu.trim(),
      uz: cardUz.trim() || cardRu.trim(),
      d_ru: descRu.trim() || cardRu.trim(),
      d_en: descEn.trim() || cardEn.trim() || cardRu.trim(),
      d_uz: descUz.trim() || cardUz.trim() || cardRu.trim(),
      ability
    };

    if (editingIndex === null) {
      // Add
      socket.emit('adminAddCard', {
        login: adminLogin.trim(),
        password: adminPassword.trim(),
        category: activeCategory,
        cardData: payload
      }, (res) => {
        if (res.success) {
          setFeedback('Карта успешно добавлена!');
          setIsEditorOpen(false);
          loadCategoryCards(activeCategory, search);
          setTimeout(() => setFeedback(''), 3000);
        }
      });
    } else {
      // Update
      socket.emit('adminUpdateCard', {
        login: adminLogin.trim(),
        password: adminPassword.trim(),
        category: activeCategory,
        index: editingIndex,
        cardData: payload
      }, (res) => {
        if (res.success) {
          setFeedback('Карта успешно обновлена!');
          setIsEditorOpen(false);
          loadCategoryCards(activeCategory, search);
          setTimeout(() => setFeedback(''), 3000);
        }
      });
    }
  };

  const handleDeleteCard = (cardIndex) => {
    if (!window.confirm('Вы действительно хотите удалить эту карту из базы?')) return;

    socket.emit('adminDeleteCard', {
      login: adminLogin.trim(),
      password: adminPassword.trim(),
      category: activeCategory,
      index: cardIndex
    }, (res) => {
      if (res.success) {
        setFeedback('Карта удалена!');
        loadCategoryCards(activeCategory, search);
        setTimeout(() => setFeedback(''), 3000);
      }
    });
  };

  const handleGrantCoins = (e) => {
    e.preventDefault();
    if (!coinTargetUser.trim()) return;

    socket.emit('adminAddCoins', {
      login: adminLogin.trim(),
      password: adminPassword.trim(),
      targetUsername: coinTargetUser.trim(),
      amount: parseInt(coinAmount, 10) || 500
    }, (res) => {
      if (res.success) {
        setFeedback(`Успешно начислено ${coinAmount} BunCoins пользователю ${coinTargetUser}!`);
        setCoinTargetUser('');
        setTimeout(() => setFeedback(''), 4000);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-zinc-900 border-2 border-red-500/70 rounded-2xl shadow-2xl p-6 text-zinc-100 font-sans overflow-hidden flex flex-col max-h-[92vh]">
        {/* Red & Amber glow */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 pb-4 mb-4 border-b border-zinc-800">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-mono tracking-wide text-red-400 flex items-center space-x-2">
              <span>{t.adminTitle}</span>
              <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/40">
                ROOT ACCESS
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Управление картами, базой данных и экономикой BunCoins
            </p>
          </div>
        </div>

        {/* FEEDBACK TOAST */}
        {feedback && (
          <div className="mb-3 p-2.5 bg-emerald-950/70 border border-emerald-500/60 rounded-xl flex items-center space-x-2 text-xs text-emerald-300">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{feedback}</span>
          </div>
        )}

        {/* STEP 1: AUTHENTICATION (if not logged in) */}
        {!isAdminLoggedIn ? (
          <div className="max-w-md mx-auto my-auto w-full p-6 bg-zinc-950/80 border border-zinc-800 rounded-2xl">
            <div className="text-center mb-5">
              <Key className="w-10 h-10 text-red-400 mx-auto mb-2 animate-pulse" />
              <h3 className="font-mono font-bold text-sm text-zinc-200">
                {t.adminLoginPrompt}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                login: <span className="text-amber-400 font-bold">Samandar</span> | parol: <span className="text-amber-400 font-bold">05052013</span>
              </p>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-500/60 rounded-xl flex items-center space-x-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Логин администратора:
                </label>
                <input
                  type="text"
                  value={adminLogin}
                  onChange={(e) => setAdminLogin(e.target.value)}
                  placeholder="Samandar"
                  required
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Пароль доступа:
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="05052013"
                  required
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-[0_0_20px_rgba(239,68,68,0.35)]"
              >
                {t.adminBtnLogin}
              </button>
            </form>
          </div>
        ) : (
          /* STEP 2: LOGGED-IN ADMIN DASHBOARD */
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            {/* Quick Coin Grant Bar */}
            <form onSubmit={handleGrantCoins} className="flex flex-wrap items-center gap-2 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
              <Coins className="w-4 h-4 text-amber-400 shrink-0 ml-1" />
              <span className="text-xs font-mono text-zinc-400">{t.adminGiveCoins}</span>
              <input
                type="text"
                placeholder="Имя игрока"
                value={coinTargetUser}
                onChange={(e) => setCoinTargetUser(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-200 outline-none font-mono focus:border-amber-500 w-36"
              />
              <input
                type="number"
                placeholder="500"
                value={coinAmount}
                onChange={(e) => setCoinAmount(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-200 outline-none font-mono focus:border-amber-500 w-20"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg font-mono text-xs font-bold transition shadow"
              >
                {t.adminGiveCoinsBtn}
              </button>
            </form>

            {/* Category Pills with Card Counts */}
            <div className="flex flex-wrap gap-1.5 bg-zinc-950/60 p-1.5 rounded-xl border border-zinc-800">
              {categories.map((cat) => {
                const count = stats[cat.key] || 0;
                const isActive = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => handleCategoryChange(cat.key)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                      isActive
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold ${
                      isActive ? 'bg-red-800 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Controls Bar: Search & Add Button */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder={t.adminSearchPlaceholder}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-500 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 outline-none font-mono"
                />
              </div>

              <button
                onClick={openNewCardModal}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-mono text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>{t.adminBtnAddCard}</span>
              </button>
            </div>

            {/* Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[46vh]">
              {loading ? (
                <div className="text-center py-10 font-mono text-xs text-zinc-500">
                  Загрузка базы карт...
                </div>
              ) : cards.length === 0 ? (
                <div className="text-center py-10 font-mono text-xs text-zinc-500">
                  Карты не найдены
                </div>
              ) : (
                cards.map((c) => (
                  <div
                    key={c._idx}
                    className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl hover:border-zinc-700 transition flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-zinc-100">
                          {c.ru}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          / {c.en} / {c.uz}
                        </span>
                        {c.ability && (
                          <span className="text-[10px] bg-purple-950/60 border border-purple-500/40 text-purple-300 px-1.5 py-0.2 rounded font-mono">
                            {c.ability}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-sans">
                        {c.d_ru || c.ru}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => openEditCardModal(c)}
                        className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-lg transition"
                        title={t.adminEdit}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(c._idx)}
                        className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition"
                        title={t.adminDelete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SUB-MODAL: CARD ADD / EDIT MODAL */}
        {isEditorOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-zinc-900 border-2 border-red-500/80 rounded-2xl p-5 w-full max-w-lg shadow-2xl space-y-3 font-sans">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="font-mono font-bold text-sm text-red-400">
                  {editingIndex === null ? t.adminBtnAddCard : t.adminEdit} [{activeCategory}]
                </h3>
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="p-1 rounded text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCard} className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 font-mono mb-1">{t.adminCardTitleRu}</label>
                  <input
                    type="text"
                    value={cardRu}
                    onChange={(e) => setCardRu(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 outline-none focus:border-red-500 font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-400 font-mono mb-1">{t.adminCardTitleEn}</label>
                    <input
                      type="text"
                      value={cardEn}
                      onChange={(e) => setCardEn(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-mono mb-1">{t.adminCardTitleUz}</label>
                    <input
                      type="text"
                      value={cardUz}
                      onChange={(e) => setCardUz(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 font-mono mb-1">{t.adminCardDescRu}</label>
                  <textarea
                    rows={2}
                    value={descRu}
                    onChange={(e) => setDescRu(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 outline-none focus:border-red-500 font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-400 font-mono mb-1">{t.adminCardDescEn}</label>
                    <textarea
                      rows={2}
                      value={descEn}
                      onChange={(e) => setDescEn(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-mono mb-1">{t.adminCardDescUz}</label>
                    <textarea
                      rows={2}
                      value={descUz}
                      onChange={(e) => setDescUz(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                </div>

                {activeCategory === 'SPECIALS' && (
                  <div>
                    <label className="block text-zinc-400 font-mono mb-1">{t.adminAbilityLabel}</label>
                    <select
                      value={ability}
                      onChange={(e) => setAbility(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 outline-none focus:border-red-500 font-mono"
                    >
                      <option value="reroll_self">reroll_self (Замена своей карты на любую)</option>
                      <option value="swap_cards">swap_cards (Обмен картами)</option>
                      <option value="immunity">immunity (Дипломатический иммунитет)</option>
                      <option value="veto">veto (Право ВЕТО)</option>
                      <option value="double_vote">double_vote (Двойной голос)</option>
                      <option value="revote">revote (Приказ о переголосовании)</option>
                      <option value="bodyguard">bodyguard (Телохранитель)</option>
                      <option value="inspect">inspect (Шпионский взлом)</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg font-mono hover:bg-zinc-700 transition"
                  >
                    {t.adminCancel}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-mono font-bold transition shadow"
                  >
                    {t.adminSave}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

