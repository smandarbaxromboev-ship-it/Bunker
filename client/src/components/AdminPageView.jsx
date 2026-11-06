import React, { useState, useEffect } from 'react';
import { translations, getLocalized } from '../utils/translations';
import { 
  ShieldCheck, Lock, Plus, Trash2, Edit3, 
  Search, X, Check, AlertCircle, Coins, ArrowLeft, LogOut, RefreshCw 
} from 'lucide-react';

export default function AdminPageView({ socket, lang = 'ru', onBack }) {
  const t = translations[lang] || translations.ru;

  // Stored session
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('bunker_admin_session') === 'active';
  });
  const [adminLogin, setAdminLogin] = useState(() => {
    return sessionStorage.getItem('bunker_admin_user') || '';
  });
  const [adminPassword, setAdminPassword] = useState(() => {
    return sessionStorage.getItem('bunker_admin_token') || '';
  });
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
  const [registeredUsers, setRegisteredUsers] = useState([]);

  const categories = [
    { key: 'PROFESSIONS', label: t.adminTabProfessions || 'Профессии' },
    { key: 'HEALTH', label: t.adminTabHealth || 'Здоровье' },
    { key: 'HOBBIES', label: t.adminTabHobbies || 'Хобби' },
    { key: 'LUGGAGE', label: t.adminTabLuggage || 'Багаж' },
    { key: 'FACTS', label: t.adminTabFacts || 'Факты' },
    { key: 'SPECIALS', label: t.adminTabSpecials || 'Козыри' }
  ];

  const loadRegisteredUsers = (loginVal, passVal) => {
    socket.emit('adminGetUsers', {
      login: (loginVal || adminLogin).trim(),
      password: (passVal || adminPassword).trim()
    }, (res) => {
      if (res && res.success && Array.isArray(res.users)) {
        setRegisteredUsers(res.users);
      }
    });
  };

  // If already logged in on mount, load cards & users
  useEffect(() => {
    if (isAdminLoggedIn && adminLogin && adminPassword) {
      loadCategoryCards(activeCategory, '');
      loadRegisteredUsers(adminLogin, adminPassword);
    }
  }, [isAdminLoggedIn]);

  const handleAdminLoginSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    if (!adminLogin.trim() || !adminPassword.trim()) {
      setAuthError('Введите логин и пароль администратора');
      return;
    }

    socket.emit('adminLogin', { login: adminLogin.trim(), password: adminPassword.trim() }, (res) => {
      if (res && res.success) {
        setIsAdminLoggedIn(true);
        sessionStorage.setItem('bunker_admin_session', 'active');
        sessionStorage.setItem('bunker_admin_user', adminLogin.trim());
        sessionStorage.setItem('bunker_admin_token', adminPassword.trim());
        setStats(res.stats || {});
        loadCategoryCards('PROFESSIONS', '');
        loadRegisteredUsers(adminLogin.trim(), adminPassword.trim());
      } else {
        setAuthError((res && res.error) || 'Доступ запрещен. Неверные учетные данные.');
      }
    });
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setAdminLogin('');
    setAdminPassword('');
    sessionStorage.removeItem('bunker_admin_session');
    sessionStorage.removeItem('bunker_admin_user');
    sessionStorage.removeItem('bunker_admin_token');
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
      } else if (res && res.error === 'Доступ запрещен') {
        handleAdminLogout();
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
      socket.emit('adminAddCard', {
        login: adminLogin.trim(),
        password: adminPassword.trim(),
        category: activeCategory,
        cardData: payload
      }, (res) => {
        if (res && res.success) {
          setFeedback('Карта успешно добавлена в базу данных!');
          setIsEditorOpen(false);
          loadCategoryCards(activeCategory, search);
          setTimeout(() => setFeedback(''), 3000);
        }
      });
    } else {
      socket.emit('adminUpdateCard', {
        login: adminLogin.trim(),
        password: adminPassword.trim(),
        category: activeCategory,
        index: editingIndex,
        cardData: payload
      }, (res) => {
        if (res && res.success) {
          setFeedback('Карта успешно сохранена!');
          setIsEditorOpen(false);
          loadCategoryCards(activeCategory, search);
          setTimeout(() => setFeedback(''), 3000);
        }
      });
    }
  };

  const handleDeleteCard = (cardIndex) => {
    if (!window.confirm('Удалить эту карту из колоды бункера?')) return;

    socket.emit('adminDeleteCard', {
      login: adminLogin.trim(),
      password: adminPassword.trim(),
      category: activeCategory,
      index: cardIndex
    }, (res) => {
      if (res && res.success) {
        setFeedback('Карта удалена!');
        loadCategoryCards(activeCategory, search);
        setTimeout(() => setFeedback(''), 3000);
      }
    });
  };

  const handleGrantCoins = (e, customTarget = null, customAmount = null) => {
    if (e) e.preventDefault();
    const target = (customTarget || coinTargetUser).trim();
    const amt = parseInt(customAmount || coinAmount, 10) || 500;
    if (!target) return;

    socket.emit('adminAddCoins', {
      login: adminLogin.trim(),
      password: adminPassword.trim(),
      targetUsername: target,
      amount: amt
    }, (res) => {
      if (res && res.success) {
        setFeedback(`✓ Успешно начислено ${amt} BunCoins игроку "${target}"! Новый баланс: ${res.newBalance} 🪙`);
        loadRegisteredUsers(adminLogin, adminPassword);
        setTimeout(() => setFeedback(''), 5000);
      } else {
        setFeedback(`Ошибка: ${(res && res.error) || 'Не удалось начислить монеты'}`);
      }
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-3 sm:p-6 flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between pb-4 border-b border-zinc-850">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.btnBack || '← На главную'}</span>
        </button>

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-600/50 flex items-center justify-center text-red-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-mono font-bold text-sm text-red-400 tracking-wider hidden sm:inline">
            BUNKER ROOT ADMIN
          </span>
        </div>

        {isAdminLoggedIn ? (
          <button
            onClick={handleAdminLogout}
            className="px-3.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-red-400 border border-red-800/60 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        ) : (
          <div className="text-xs font-mono text-zinc-600">
            PRIVATE CONSOLE
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full flex-1 my-4 flex flex-col min-h-0">
        {feedback && (
          <div className="mb-4 p-3 bg-emerald-950/70 border border-emerald-500/60 rounded-xl flex items-center space-x-2 text-xs text-emerald-300">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{feedback}</span>
          </div>
        )}

        {/* STEP 1: AUTH FORM (NO LEAKS, NO HINTS, EMPTY INPUTS) */}
        {!isAdminLoggedIn ? (
          <div className="max-w-md mx-auto my-auto w-full p-6 sm:p-8 bg-zinc-900/80 border-2 border-red-600/60 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-red-950/70 border border-red-600 text-red-400 mx-auto flex items-center justify-center mb-3 shadow">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="font-mono font-bold text-lg text-zinc-100 tracking-wide">
                Вход в терминал управления
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Доступ разрешен только уполномоченным администраторам
              </p>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-950/70 border border-red-500/60 rounded-xl flex items-center space-x-2 text-xs text-red-300">
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
                  placeholder="Введите логин"
                  autoComplete="off"
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-red-500 font-mono transition"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Пароль администратора:
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="off"
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-red-500 font-mono transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-[0_0_20px_rgba(239,68,68,0.4)] cursor-pointer"
              >
                ВОЙТИ В ПАНЕЛЬ
              </button>
            </form>
          </div>
        ) : (
          /* STEP 2: FULL DASHBOARD */
          <div className="flex-1 flex flex-col min-h-0 space-y-4 bg-zinc-900/60 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-xl">
            {/* Top Bar: Coin Grant & Quick Player Manager */}
            <div className="bg-zinc-950/80 p-3 sm:p-4 rounded-2xl border border-zinc-800 space-y-3">
              <form onSubmit={(e) => handleGrantCoins(e)} className="flex flex-wrap items-center gap-2.5">
                <Coins className="w-4 h-4 text-amber-400 shrink-0 ml-1" />
                <span className="text-xs font-mono font-bold text-zinc-300">{t.adminGiveCoins}</span>
                <input
                  type="text"
                  placeholder="Имя или логин игрока"
                  value={coinTargetUser}
                  onChange={(e) => setCoinTargetUser(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-100 outline-none font-mono focus:border-amber-500 w-48"
                />
                <input
                  type="number"
                  placeholder="500"
                  value={coinAmount}
                  onChange={(e) => setCoinAmount(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-100 outline-none font-mono focus:border-amber-500 w-24"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-mono text-xs font-bold transition shadow cursor-pointer"
                >
                  {t.adminGiveCoinsBtn}
                </button>

                {/* Quick amount presets */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">Быстро:</span>
                  {[500, 1000, 5000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCoinAmount(String(amt))}
                      className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-400 text-[10px] font-mono font-bold transition cursor-pointer"
                    >
                      +{amt} 🪙
                    </button>
                  ))}
                </div>
              </form>

              {/* Registered Players Quick List */}
              {registeredUsers.length > 0 && (
                <div className="pt-2 border-t border-zinc-850 flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase shrink-0">Игроки:</span>
                  {registeredUsers.map(u => (
                    <div 
                      key={u.username}
                      className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2 text-xs font-mono shrink-0"
                    >
                      <button
                        type="button"
                        onClick={() => setCoinTargetUser(u.username)}
                        className="text-zinc-200 hover:text-amber-400 font-bold transition cursor-pointer"
                        title="Выбрать этого игрока"
                      >
                        {u.username}
                      </button>
                      <span className="text-amber-400 font-bold text-[11px] bg-amber-500/10 px-1.5 py-0.2 rounded">
                        🪙 {u.bunCoins}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleGrantCoins(null, u.username, 1000)}
                        title={`Начислить +1000 BunCoins игроку ${u.username}`}
                        className="text-[10px] text-zinc-400 hover:text-emerald-400 bg-zinc-800 hover:bg-zinc-750 px-1.5 py-0.5 rounded transition cursor-pointer"
                      >
                        +1000
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Selector with Counts */}
            <div className="flex flex-wrap gap-2 bg-zinc-950/80 p-2 rounded-2xl border border-zinc-800">
              {categories.map((cat) => {
                const count = stats[cat.key] || 0;
                const isActive = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => handleCategoryChange(cat.key)}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                      isActive
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      isActive ? 'bg-red-800 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search and Add controls */}
            <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder={t.adminSearchPlaceholder}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-zinc-100 outline-none font-mono transition"
                />
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => loadCategoryCards(activeCategory, search)}
                  className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                  title="Обновить"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={openNewCardModal}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-mono text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.adminBtnAddCard}</span>
                </button>
              </div>
            </div>

            {/* Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[50vh]">
              {loading ? (
                <div className="text-center py-12 font-mono text-xs text-zinc-500">
                  Считывание базы данных...
                </div>
              ) : cards.length === 0 ? (
                <div className="text-center py-12 font-mono text-xs text-zinc-500">
                  Карты не найдены
                </div>
              ) : (
                cards.map((c) => (
                  <div
                    key={c._idx}
                    className="p-3.5 bg-zinc-950/70 border border-zinc-800/90 rounded-2xl hover:border-zinc-700 transition flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-zinc-100">
                          {c.ru}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                          / {c.en} / {c.uz}
                        </span>
                        {c.ability && (
                          <span className="text-[10px] bg-purple-950/60 border border-purple-500/40 text-purple-300 px-2 py-0.5 rounded-full font-mono">
                            {c.ability}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mt-1">
                        {c.d_ru || c.ru}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => openEditCardModal(c)}
                        className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-xl transition cursor-pointer"
                        title={t.adminEdit}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(c._idx)}
                        className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-xl transition cursor-pointer"
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
      </main>

      {/* Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 border-2 border-red-500/80 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-mono font-bold text-sm text-red-400">
                {editingIndex === null ? t.adminBtnAddCard : t.adminEdit} [{activeCategory}]
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-400 font-mono mb-1">{t.adminCardTitleRu}</label>
                <input
                  type="text"
                  value={cardRu}
                  onChange={(e) => setCardRu(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-red-500 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 font-mono mb-1">{t.adminCardTitleEn}</label>
                  <input
                    type="text"
                    value={cardEn}
                    onChange={(e) => setCardEn(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-red-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-mono mb-1">{t.adminCardTitleUz}</label>
                  <input
                    type="text"
                    value={cardUz}
                    onChange={(e) => setCardUz(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-mono mb-1">{t.adminCardDescRu}</label>
                <textarea
                  rows={2}
                  value={descRu}
                  onChange={(e) => setDescRu(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-red-500 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 font-mono mb-1">{t.adminCardDescEn}</label>
                  <textarea
                    rows={2}
                    value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-red-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-mono mb-1">{t.adminCardDescUz}</label>
                  <textarea
                    rows={2}
                    value={descUz}
                    onChange={(e) => setDescUz(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              {activeCategory === 'SPECIALS' && (
                <div>
                  <label className="block text-zinc-400 font-mono mb-1">{t.adminAbilityLabel}</label>
                  <select
                    value={ability}
                    onChange={(e) => setAbility(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-red-500 font-mono"
                  >
                    <option value="reroll_self">reroll_self (Замена карты)</option>
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

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl font-mono hover:bg-zinc-700 transition cursor-pointer"
                >
                  {t.adminCancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-mono font-bold transition shadow cursor-pointer"
                >
                  {t.adminSave}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-2 text-[10px] text-zinc-600 font-mono border-t border-zinc-850">
        BUNKER ROOT ADMIN PANEL • SECURE CONSOLE
      </footer>
    </div>
  );
}

