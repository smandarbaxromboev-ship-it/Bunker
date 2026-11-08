import React, { useState, useRef } from 'react';
import { translations } from '../utils/translations';
import { Shield, Lock, User, Sparkles, X, AlertCircle, Upload, Link as LinkIcon, CheckCircle2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { soundManager } from '../utils/audio';

export default function AuthModal({ socket, lang, onClose, onAuthSuccess }) {
  const t = translations[lang] || translations.ru;
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

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
        // Resize to max 300x300 for optimal fast websocket transfer
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
        onClose();
      } else {
        setError(lang === 'uz' ? 'Xatolik yuz berdi' : lang === 'en' ? 'Unexpected error' : 'Произошла непредвиденная ошибка');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-zinc-900 border-2 border-amber-500/60 rounded-3xl shadow-2xl p-5 sm:p-6 text-zinc-100 font-sans overflow-hidden">
        {/* Amber cyber ambient glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-5">
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

        {/* Tabs */}
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

        {/* Form */}
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
            {loading ? 'Обработка...' : tab === 'login' ? (t.authBtnLogin || 'Войти в бункер') : (t.authBtnRegister || 'Зарегистрироваться')}
          </button>
        </form>

        {/* Notice: mandatory registration */}
        <div className="mt-4 pt-3 border-t border-zinc-800 text-center">
          <p className="text-[11px] font-mono text-zinc-400 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{t.mandatoryAccountNotice || 'Для участия в игре требуется аккаунт. Регистрация бесплатна!'}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
