import React, { useState, useEffect } from 'react';
import { translations, getLocalized } from '../utils/translations';
import { 
  ShieldCheck, Lock, Plus, Trash2, Edit3, 
  Search, X, Check, AlertCircle, Coins, ArrowLeft, LogOut, 
  RefreshCw, Users, Gamepad2, Ban, CheckCircle2, Radio, Layers
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

  // Main Admin Tab: 'CARDS' | 'USERS' | 'ROOMS'
  const [mainSection, setMainSection] = useState('CARDS');

  // CARDS STATE
  const [activeCategory, setActiveCategory] = useState('PROFESSIONS');
  const [search, setSearch] = useState('');
  const [cards, setCards] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Add / Edit Card Modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [cardRu, setCardRu] = useState('');
  const [cardEn, setCardEn] = useState('');
  const [cardUz, setCardUz] = useState('');
  const [descRu, setDescRu] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descUz, setDescUz] = useState('');
  const [ability, setAbility] = useState('reroll_self');

  // USERS & COINS STATE
  const [coinTargetUser, setCoinTargetUser] = useState('');
  const [coinAmount, setCoinAmount] = useState('500');
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  // ROOMS ONLINE STATE
  const [onlineRooms, setOnlineRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

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

  const loadOnlineRooms = (loginVal, passVal) => {
    setLoadingRooms(true);
    socket.emit('adminGetRooms', {
      login: (loginVal || adminLogin).trim(),
      password: (passVal || adminPassword).trim()
    }, (res) => {
      setLoadingRooms(false);
      if (res && res.success && Array.isArray(res.rooms)) {
        setOnlineRooms(res.rooms);
      }
    });
  };

  useEffect(() => {
    if (isAdminLoggedIn && adminLogin && adminPassword) {
      loadCategoryCards(activeCategory, '');
      loadRegisteredUsers(adminLogin, adminPassword);
      loadOnlineRooms(adminLogin, adminPassword);
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
        loadOnlineRooms(adminLogin.trim(), adminPassword.trim());
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

  const handleDeleteCard = (cardIdx) => {
    if (!window.confirm('Вы точно хотите удалить эту карту из базы бункера?')) return;

    socket.emit('adminDeleteCard', {
      login: adminLogin.trim(),
      password: adminPassword.trim(),
      category: activeCategory,
      index: cardIdx
    }, (res) => {
      if (res && res.success) {
        setFeedback('Карта успешно удалена из базы!');
        loadCategoryCards(activeCategory, search);
        setTimeout(() => setFeedback(''), 3000);
      }
    });
  };

  // Grant BunCoins
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

  // Block / Unblock User
  const handleToggleBlockUser = (username, currentBlocked) => {
    const actionName = currentBlocked ? 'разблокировать' : 'заблокировать';
    if (!window.confirm(`Вы уверены, что хотите ${actionName} игрока ${username}?`)) return;

    socket.emit('adminBlockUser', {
      login: adminLogin.trim(),
      password: adminPassword.trim(),
      username,
      isBlocked: !currentBlocked
    }, (res) => {
      if (res && res.success) {
        setFeedback(`✓ Игрок ${username} успешно ${!currentBlocked ? 'заблокирован 🚫' : 'разблокирован ✓'}!`);
        loadRegisteredUsers(adminLogin, adminPassword);
        setTimeout(() => setFeedback(''), 4000);
      }
    });
  };

  // Delete User
  const handleDeleteUser = (username) => {
    if (!window.confirm(`ВНИМАНИЕ: Вы точно хотите навсегда удалить аккаунт ${username}?`)) return;

    socket.emit('adminDeleteUser', {
      login: adminLogin.trim(),
      password: adminPassword.trim(),
      username
    }, (res) => {
      if (res && res.success) {
        setFeedback(`✓ Аккаунт ${username} успешно удален!`);
        loadRegisteredUsers(adminLogin, adminPassword);
        setTimeout(() => setFeedback(''), 4000);
      }
    });
  };

  // Force close active room
  const handleCloseRoom = (roomCode) => {
    if (!window.confirm(`Вы уверены, что хотите принудительно завершить игру в комнате #${roomCode}?`)) return;

    socket.emit('adminCloseRoom', {
      login: adminLogin.trim(),
      password: adminPassword.trim(),
      roomCode
    }, (res) => {
      if (res && res.success) {
        setFeedback(`✓ Комната #${roomCode} успешно завершена!`);
        loadOnlineRooms(adminLogin, adminPassword);
        setTimeout(() => setFeedback(''), 4000);
      }
    });
  };

  const filteredUsers = registeredUsers.filter(u => {
    if (!userSearch.trim()) return true;
    return u.username.toLowerCase().includes(userSearch.trim().toLowerCase());
  });

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
          <div className="mb-4 p-3 bg-emerald-950/70 border border-emerald-500/60 rounded-xl flex items-center space-x-2 text-xs text-emerald-300 animate-fadeIn">
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
          /* STEP 2: FULL ADMIN DASHBOARD */
          <div className="flex-1 flex flex-col min-h-0 space-y-4 bg-zinc-900/60 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-xl">
            {/* Top Navigation Mode Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div className="flex items-center bg-zinc-950 p-1 rounded-2xl border border-zinc-800 text-xs font-mono font-bold">
                <button
                  type="button"
                  onClick={() => setMainSection('CARDS')}
                  className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                    mainSection === 'CARDS'
                      ? 'bg-amber-500 text-zinc-950 shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>База Карт (6 категорий)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMainSection('USERS');
                    loadRegisteredUsers(adminLogin, adminPassword);
                  }}
                  className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                    mainSection === 'USERS'
                      ? 'bg-amber-500 text-zinc-950 shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Аккаунты Игроков</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${mainSection === 'USERS' ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-300'}`}>
                    {registeredUsers.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMainSection('ROOMS');
                    loadOnlineRooms(adminLogin, adminPassword);
                  }}
                  className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                    mainSection === 'ROOMS'
                      ? 'bg-amber-500 text-zinc-950 shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>Онлайн Игры</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${mainSection === 'ROOMS' ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-300'}`}>
                    {onlineRooms.length}
                  </span>
                </button>
              </div>

              {mainSection === 'ROOMS' && (
                <button
                  onClick={() => loadOnlineRooms(adminLogin, adminPassword)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingRooms ? 'animate-spin' : ''}`} />
                  <span>Обновить игры</span>
                </button>
              )}
            </div>

            {/* ==================================================== */}
            {/* SECTION 1: USERS & BUNCOINS MANAGEMENT */}
            {/* ==================================================== */}
            {mainSection === 'USERS' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-4">
                {/* Manual Grant Input */}
                <form onSubmit={(e) => handleGrantCoins(e)} className="bg-zinc-950/80 p-3 sm:p-4 rounded-2xl border border-zinc-800 flex flex-wrap items-center gap-2.5">
                  <Coins className="w-5 h-5 text-amber-400 shrink-0 ml-1" />
                  <span className="text-xs font-mono font-bold text-zinc-200">Выдать BunCoins:</span>
                  <input
                    type="text"
                    placeholder="Логин или имя игрока"
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
                    + Начислить
                  </button>

                  <div className="flex items-center gap-1.5 ml-auto">
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

                {/* Users List Filter & Count */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono font-bold text-zinc-300">
                      Зарегистрированные аккаунты ({filteredUsers.length} из {registeredUsers.length}):
                    </span>
                  </div>

                  <div className="relative w-56">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Поиск по имени..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                {/* Users Table / Grid */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-12 font-mono text-zinc-500 text-xs">
                      {registeredUsers.length === 0 ? 'Нет зарегистрированных аккаунтов. Создайте первый или войдите на сайте!' : 'Аккаунты не найдены по запросу.'}
                    </div>
                  ) : (
                    filteredUsers.map(u => (
                      <div
                        key={u.username}
                        className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          u.isBlocked
                            ? 'bg-red-950/20 border-red-800/60'
                            : 'bg-zinc-950/70 border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-black text-lg ${
                            u.isBlocked ? 'bg-red-950 text-red-400 border border-red-700' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}>
                            {u.isBlocked ? '🚫' : '👤'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-white">
                                {u.username}
                              </span>
                              {u.isBlocked ? (
                                <span className="bg-red-950 text-red-400 border border-red-700/80 px-2 py-0.2 rounded-full text-[10px] font-mono font-bold flex items-center gap-1">
                                  <Ban className="w-3 h-3" />
                                  <span>ЗАБЛОКИРОВАН</span>
                                </span>
                              ) : (
                                <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2 py-0.2 rounded-full text-[10px] font-mono font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>АКТИВЕН</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2 mt-0.5">
                              <span>🪙 Баланс: <strong className="text-amber-400 font-bold">{u.bunCoins}</strong></span>
                              <span>•</span>
                              <span>Игр: {u.stats?.gamesPlayed || 0}</span>
                              <span>•</span>
                              <span>Побед: {u.stats?.wins || 0}</span>
                            </div>
                          </div>
                        </div>

                        {/* User Actions: Add coins, Block, Delete */}
                        <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleGrantCoins(null, u.username, 500)}
                            className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-400 text-xs font-mono font-bold transition cursor-pointer"
                            title="Добавить +500 BunCoins"
                          >
                            +500 🪙
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGrantCoins(null, u.username, 1000)}
                            className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500 hover:text-black border border-amber-500/60 text-amber-300 text-xs font-mono font-bold transition cursor-pointer"
                            title="Добавить +1000 BunCoins"
                          >
                            +1000 🪙
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleBlockUser(u.username, u.isBlocked)}
                            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer ${
                              u.isBlocked
                                ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700'
                                : 'bg-red-950/80 hover:bg-red-900 text-red-400 border border-red-800'
                            }`}
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>{u.isBlocked ? 'Разблокировать' : 'Заблокировать'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.username)}
                            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-red-950 text-zinc-500 hover:text-red-400 border border-zinc-800 transition cursor-pointer"
                            title="Удалить аккаунт навсегда"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* SECTION 2: LIVE ACTIVE ROOMS MONITOR */}
            {/* ==================================================== */}
            {mainSection === 'ROOMS' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-zinc-200">
                      Активные комнаты на сервере ({onlineRooms.length}):
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {onlineRooms.length === 0 ? (
                    <div className="text-center py-16 font-mono text-zinc-500 text-xs space-y-2">
                      <Gamepad2 className="w-8 h-8 text-zinc-600 mx-auto" />
                      <div>Сейчас нет активных комнат онлайн.</div>
                      <div className="text-[11px] text-zinc-600">Создайте новую комнату на главной странице сайта!</div>
                    </div>
                  ) : (
                    onlineRooms.map(room => (
                      <div
                        key={room.code}
                        className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3 shadow-md"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-850 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-base font-display font-bold text-amber-400 tracking-wider">
                              БУНКЕР #{room.code}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-lg font-mono font-bold bg-zinc-850 text-zinc-300 border border-zinc-750">
                              {room.status}
                            </span>
                            <span className="text-xs font-mono text-amber-500">
                              Раунд {room.currentRound}/{room.maxRounds}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-zinc-400">
                              Хост: <strong className="text-white">{room.hostName}</strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCloseRoom(room.code)}
                              className="px-2.5 py-1 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-400 border border-red-800 text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Завершить игру</span>
                            </button>
                          </div>
                        </div>

                        {room.disaster && (
                          <div className="text-xs font-mono text-amber-300 bg-amber-950/20 px-3 py-1.5 rounded-xl border border-amber-900/30">
                            <strong>Катастрофа:</strong> {getLocalized(room.disaster.title, lang)}
                          </div>
                        )}

                        {/* Players Chips */}
                        <div>
                          <div className="text-[11px] font-mono text-zinc-400 mb-1.5">
                            Участники ({room.players?.length || 0} / 10):
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {(room.players || []).map(p => (
                              <div
                                key={p.id}
                                className={`px-2.5 py-1 rounded-xl border text-xs font-mono flex items-center gap-1.5 ${
                                  !p.isAlive
                                    ? 'bg-red-950/30 border-red-800 text-red-400 line-through'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-200'
                                }`}
                              >
                                <span>{p.character?.avatar || (p.isBot ? '🤖' : '🥷')}</span>
                                <span>{p.name}</span>
                                {p.isHost && <span className="text-[10px] text-amber-400">★</span>}
                                {p.isBot && <span className="text-[9px] text-cyan-400 font-bold">[BOT]</span>}
                                {!p.isAlive && <span className="text-[9px] text-red-500 font-bold">[ИЗГНАН]</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* SECTION 3: CARDS DATABASE CRUD */}
            {/* ==================================================== */}
            {mainSection === 'CARDS' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-4">
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
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isActive ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search Bar & Add Button */}
                <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder={t.adminSearchPlaceholder || 'Поиск по картам...'}
                      value={search}
                      onChange={handleSearchChange}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500 font-mono transition"
                    />
                  </div>

                  <button
                    onClick={openNewCardModal}
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition shadow flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.adminBtnAddCard}</span>
                  </button>
                </div>

                {/* Cards List Table */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                  {loading ? (
                    <div className="text-center py-12 font-mono text-zinc-500 text-xs">
                      Загрузка базы карт...
                    </div>
                  ) : cards.length === 0 ? (
                    <div className="text-center py-12 font-mono text-zinc-500 text-xs">
                      Карты не найдены.
                    </div>
                  ) : (
                    cards.map((c) => (
                      <div
                        key={c._idx}
                        className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl hover:border-zinc-700 transition flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-xs font-bold text-zinc-100 flex items-center space-x-2">
                            <span className="text-red-500 font-mono">#{c._idx + 1}</span>
                            <span className="truncate">{c.ru}</span>
                          </div>
                          {c.d_ru && (
                            <p className="text-[11px] text-zinc-400 font-sans mt-0.5 line-clamp-1">
                              {c.d_ru}
                            </p>
                          )}
                          <div className="text-[10px] text-zinc-500 font-mono mt-1 flex space-x-3">
                            <span className="truncate">EN: {c.en || '-'}</span>
                            <span className="truncate">UZ: {c.uz || '-'}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={() => openEditCardModal(c)}
                            className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                            title="Редактировать"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCard(c._idx)}
                            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                            title="Удалить"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Editor Modal for Adding/Editing Card */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-zinc-900 border-2 border-red-600/70 rounded-3xl max-w-lg w-full p-6 text-zinc-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditorOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-mono font-bold text-base text-red-400 mb-4 flex items-center space-x-2">
              <Edit3 className="w-4 h-4" />
              <span>
                {editingIndex === null ? 'Добавить новую карту' : `Редактирование карты #${editingIndex + 1}`}
              </span>
            </h3>

            <form onSubmit={handleSaveCard} className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="block text-zinc-400 mb-1">{t.adminCardTitleRu} *</label>
                <input
                  type="text"
                  required
                  value={cardRu}
                  onChange={(e) => setCardRu(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">{t.adminCardDescRu}</label>
                <textarea
                  rows={2}
                  value={descRu}
                  onChange={(e) => setDescRu(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-red-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 mb-1">{t.adminCardTitleEn}</label>
                  <input
                    type="text"
                    value={cardEn}
                    onChange={(e) => setCardEn(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">{t.adminCardTitleUz}</label>
                  <input
                    type="text"
                    value={cardUz}
                    onChange={(e) => setCardUz(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 mb-1">{t.adminCardDescEn}</label>
                  <textarea
                    rows={2}
                    value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-red-500 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">{t.adminCardDescUz}</label>
                  <textarea
                    rows={2}
                    value={descUz}
                    onChange={(e) => setDescUz(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-red-500 font-sans"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition cursor-pointer"
                >
                  {t.adminCancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl transition shadow cursor-pointer"
                >
                  {t.adminSave}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
