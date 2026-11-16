import React, { useState, useRef, useEffect } from 'react';
import { translations } from '../utils/translations';
import { Shield, Lock, User, Sparkles, X, AlertCircle, Upload, Link as LinkIcon, CheckCircle2, Trash2, ArrowLeft } from 'lucide-react';
import { soundManager } from '../utils/audio';

const STORAGE_KEY_GOOGLE_USER = 'bunker_saved_google_user';

export default function AuthModal({ 
  socket, 
  lang, 
  setLang, 
  onClose, 
  onAuthSuccess, 
  isMandatory = false, 
  defaultTab = 'register' 
}) {
  const t = translations[lang] || translations.ru;
  const [tab, setTab] = useState(defaultTab); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Google Direct Auth Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleInput, setGoogleInput] = useState('');
  const [savedGoogleUser, setSavedGoogleUser] = useState(null);
  const [googleClientId, setGoogleClientId] = useState(null);

  // Читаем сохраненный Google профиль из localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_GOOGLE_USER);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.email || parsed.name)) {
          setSavedGoogleUser(parsed);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Получаем Google Client ID с сервера (если настроен)
  useEffect(() => {
    let cancelled = false;
    socket.emit('getGoogleConfig', {}, (cfg) => {
      if (!cancelled && cfg && cfg.clientId) setGoogleClientId(cfg.clientId);
    });
    return () => { cancelled = true; };
  }, [socket]);

  // Выполнение входа через Google
  const executeGoogleLogin = ({ email, name, avatarUrl, googleId }) => {
    setLoading(true);
    setError('');

    socket.emit('googleDirectLogin', { email, name, avatarUrl, googleId }, (res) => {
      setLoading(false);
      if (res && res.error) {
        setError(res.error);
      } else if (res && res.success && res.user) {
        soundManager.playBeep(880, 0.1);
        try {
          localStorage.setItem(STORAGE_KEY_GOOGLE_USER, JSON.stringify({
            email: res.user.googleEmail || email || '',
            name: res.user.username || name || '',
            avatarUrl: res.user.avatarUrl || avatarUrl || '',
            googleId: res.user.googleId || googleId || ''
          }));
        } catch (e) {
          // ignore
        }
        setShowGoogleModal(false);
        onAuthSuccess(res.user, Boolean(res.isNewRegistration));
        if (onClose) onClose();
      } else {
        setError(lang === 'uz' ? 'Xatolik yuz berdi' : lang === 'en' ? 'Unexpected error' : 'Произошла непредвиденная ошибка');
      }
    });
  };

  const handleGoogleBtnClick = () => {
    setError('');
    // Если есть сохраненный аккаунт, сразу входим им в 1 клик!
    if (savedGoogleUser && (savedGoogleUser.email || savedGoogleUser.name)) {
      executeGoogleLogin({
        email: savedGoogleUser.email,
        name: savedGoogleUser.name,
        avatarUrl: savedGoogleUser.avatarUrl,
        googleId: savedGoogleUser.googleId
      });
      return;
    }
    // Иначе открываем быстрое окно входа Google
    setShowGoogleModal(true);
  };

  const handleGoogleDirectSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const val = googleInput.trim();
    if (!val) {
      setError(lang === 'uz' ? 'Gmail manzilingiz yoki ismingizni kiriting!' : lang === 'en' ? 'Enter your Gmail address or name!' : 'Укажите ваш Gmail или имя!');
      return;
    }

    const isEmail = val.includes('@');
    const email = isEmail ? val : `${val.toLowerCase().replace(/\s+/g, '')}@gmail.com`;
    const name = isEmail ? val.split('@')[0] : val;
    executeGoogleLogin({ email, name });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(lang === 'uz' ? 'Faqat rasm fayllari qabul qilinadi!' : lang === 'en' ? 'Only image files are allowed!' : 'Пожалуйста, выберите файл изображения!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 300;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAvatarUrl(dataUrl);
        soundManager.playBeep(900, 0.05);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError(lang === 'uz' ? 'Barcha maydonlarni to\'ldiring!' : lang === 'en' ? 'Fill in all fields!' : 'Заполните все поля!');
      return;
    }

    setLoading(true);
    setError('');

    const eventName = tab === 'login' ? 'login' : 'register';
    const payload = tab === 'register' 
      ? { username: username.trim(), password: password.trim(), avatarUrl: avatarUrl.trim() }
      : { username: username.trim(), password: password.trim() };

    socket.emit(eventName, payload, (res) => {
      setLoading(false);
      if (res && res.error) {
        setError(res.error);
      } else if (res && res.success && res.user) {
        soundManager.playBeep(880, 0.1);
        onAuthSuccess(res.user, tab === 'register');
        if (onClose) onClose();
      } else {
        setError(lang === 'uz' ? 'Xatolik yuz berdi' : lang === 'en' ? 'Unexpected error' : 'Произошла непредвиденная ошибка');
      }
    });
  };

  // Google SVG Icon Helper
  const GoogleIcon = ({ className = "w-5 h-5 shrink-0" }) => (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.07.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.41 7.34 24 12 24z"/>
      <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.24C.45 8.14 0 9.99 0 12s.45 3.86 1.24 5.42l4.04-3.13z"/>
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.59 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z"/>
    </svg>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-zinc-900 border-2 border-amber-500/60 rounded-3xl shadow-2xl p-5 sm:p-6 text-zinc-100 font-sans overflow-hidden">
        {/* Amber cyber ambient glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Right Controls: Language Switcher & Optional Close Button */}
        <div className="flex items-center justify-end gap-2 mb-3">
          {setLang && (
            <div className="flex items-center bg-zinc-950 rounded-xl p-0.5 border border-zinc-800 text-[11px] font-mono font-bold">
              <button
                type="button"
                onClick={() => setLang('ru')}
                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                  lang === 'ru' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                RU
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                  lang === 'en' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('uz')}
                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                  lang === 'uz' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                UZ
              </button>
            </div>
          )}

          {!isMandatory && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-500/60 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)] shrink-0">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display tracking-wide text-amber-400">
              {t.authModalTitle || 'ТЕРМИНАЛ ДОСТУПА В БУНКЕР'}
            </h2>
            <p className="text-xs text-zinc-400">
              {tab === 'register' ? (t.authRegisterSubtitle || 'Создайте профиль для участия в игре') : (t.authLoginSubtitle || 'Вход в систему выживания')}
            </p>
          </div>
        </div>

        {/* ===================== GOOGLE 1-CLICK AUTH BUTTON ===================== */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleGoogleBtnClick}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-zinc-100 active:scale-[0.99] text-zinc-900 font-semibold text-sm flex items-center justify-center gap-3 transition shadow-lg border border-zinc-200 cursor-pointer disabled:opacity-60 group"
          >
            <GoogleIcon className="w-5 h-5 shrink-0" />
            <span className="truncate">
              {savedGoogleUser
                ? `${t.authContinueAsGoogle || 'Продолжить как'} ${savedGoogleUser.name || savedGoogleUser.email}`
                : (t.authContinueGoogle || 'Продолжить с Google')}
            </span>
          </button>

          {savedGoogleUser && (
            <div className="text-center mt-1.5">
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                className="text-[11px] font-mono text-zinc-400 hover:text-amber-400 transition underline cursor-pointer"
              >
                {t.authGoogleChangeAccount || 'Сменить Google-аккаунт'}
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 mt-3 text-[10px] font-mono text-zinc-500 uppercase">
            <span className="flex-1 h-px bg-zinc-800" />
            <span>{t.authGoogleOr || 'или с логином и паролем'}</span>
            <span className="flex-1 h-px bg-zinc-800" />
          </div>
        </div>

        {/* Tabs: Login / Register */}
        <div className="flex bg-zinc-950/80 p-1 rounded-2xl mb-4 border border-zinc-800">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer ${
              tab === 'login'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.authLoginTab || 'Вход'}
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer ${
              tab === 'register'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.authRegisterTab || 'Регистрация'}</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-500/60 rounded-xl flex items-center space-x-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Registration gift badge */}
        {tab === 'register' && (
          <div className="mb-4 p-3 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex items-center justify-between text-xs text-amber-300">
            <span className="flex items-center space-x-1.5 font-mono font-bold">
              <span>🎁</span>
              <span>{t.authStarterBonus || 'Бонус новичку:'}</span>
            </span>
            <span className="font-mono bg-amber-500/20 px-2 py-0.5 rounded text-amber-400 font-bold border border-amber-500/40">
              🪙 500 BunCoins
            </span>
          </div>
        )}

        {/* Standard Form: Login / Password */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">
              {t.authUsername || 'Имя пользователя:'}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Alex_Stalker"
                maxLength={20}
                required
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">
              {t.authPassword || 'Пароль:'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition font-mono"
              />
            </div>
          </div>

          {/* Photo / Avatar (File upload or direct URL) */}
          {tab === 'register' && (
            <div className="pt-1 space-y-2">
              <label className="block text-xs font-mono text-zinc-400 flex items-center justify-between">
                <span>{t.authPhotoUrlLabel || 'Фото профиля (файл или ссылка):'}</span>
                <span className="text-[10px] text-amber-400 font-normal">{t.authOptional || '(по желанию)'}</span>
              </label>

              {/* Upload Buttons Row */}
              <div className="flex gap-2 items-center">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono font-medium text-amber-300 hover:text-amber-200 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span className="truncate">{t.authUploadPhoto || '📁 Загрузить с устройства'}</span>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    title={t.authClearPhoto || 'Очистить'}
                    className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-400 transition cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Live Preview Avatar */}
                <div className="w-9 h-9 rounded-xl bg-zinc-950 border-2 border-amber-500/60 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-base select-none">🥷</span>
                  )}
                </div>
              </div>

              {/* URL Input Fallback */}
              <div className="relative">
                <LinkIcon className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="url"
                  value={avatarUrl.startsWith('data:') ? '' : avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 outline-none transition font-mono"
                />
              </div>

              <p className="text-[10px] text-zinc-500 font-mono">
                {t.authPhotoHint || 'Загрузите любую фотку со смартфона/ПК, вставьте ссылку или оставьте пустым.'}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold font-display text-sm tracking-wide uppercase rounded-xl transition shadow-[0_0_20px_rgba(245,158,11,0.35)] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (t.authProcessing || 'Обработка...') : tab === 'login' ? (t.authBtnLogin || 'Войти в бункер') : (t.authBtnRegister || 'Зарегистрироваться')}
          </button>
        </form>

        {/* Notice: mandatory registration */}
        <div className="mt-4 pt-3 border-t border-zinc-800 text-center">
          <p className="text-[11px] font-mono text-zinc-400 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{t.mandatoryAccountNotice || 'Для участия в игре требуется аккаунт. Регистрация бесплатна!'}</span>
          </p>
        </div>

        {/* ===================== GOOGLE DIRECT PROMPT SUB-MODAL ===================== */}
        {showGoogleModal && (
          <div className="absolute inset-0 bg-black/92 backdrop-blur-md z-20 p-5 flex flex-col justify-center animate-fadeIn">
            <div className="bg-zinc-950 border border-zinc-700/80 rounded-2xl p-5 shadow-2xl relative">
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="absolute top-3 right-3 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow">
                  <GoogleIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {t.authGoogleModalTitle || 'Вход через Google'}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {t.authGoogleModalSubtitle || 'Мгновенный вход в 1 клик • +500 BunCoins'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleGoogleDirectSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                    {t.authGoogleInputLabel || 'Ваш адрес Gmail или имя:'}
                  </label>
                  <div className="relative">
                    <GoogleIcon className="absolute left-3 top-2.5 w-4 h-4 opacity-80" />
                    <input
                      type="text"
                      autoFocus
                      value={googleInput}
                      onChange={(e) => setGoogleInput(e.target.value)}
                      placeholder={t.authGooglePlaceholder || 'alex@gmail.com'}
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 outline-none transition font-mono"
                    />
                  </div>
                </div>

                {/* Quick preset chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Alex', 'Stalker', 'Samandar', 'Player'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setGoogleInput(`${preset.toLowerCase()}@gmail.com`)}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer transition"
                    >
                      +{preset}
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGoogleModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono font-bold transition border border-zinc-800 cursor-pointer"
                  >
                    {t.authGoogleCancel || 'Назад'}
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono tracking-wide transition shadow-[0_0_15px_rgba(37,99,235,0.4)] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <GoogleIcon className="w-4 h-4" />
                    <span>{loading ? '...' : (t.authGoogleBtnSubmit || 'Войти через Google')}</span>
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
