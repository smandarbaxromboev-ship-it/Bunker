import React, { useState } from 'react';
import { translations } from '../utils/translations';
import { Shield, Lock, User, Sparkles, X, AlertCircle } from 'lucide-react';

export default function AuthModal({ socket, lang, onClose, onAuthSuccess }) {
  const t = translations[lang] || translations.ru;
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError(lang === 'uz' ? 'Barcha maydonlarni to\'ldiring!' : lang === 'en' ? 'Fill in all fields!' : 'Заполните все поля!');
      return;
    }

    setLoading(true);
    setError('');

    const eventName = tab === 'login' ? 'login' : 'register';
    socket.emit(eventName, { username: username.trim(), password: password.trim() }, (res) => {
      setLoading(false);
      if (res && res.error) {
        setError(res.error);
      } else if (res && res.success && res.user) {
        onAuthSuccess(res.user);
        onClose();
      } else {
        setError(lang === 'uz' ? 'Xatolik yuz berdi' : lang === 'en' ? 'Unexpected error' : 'Произошла непредвиденная ошибка');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-zinc-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl p-6 text-zinc-100 font-sans overflow-hidden">
        {/* Amber cyber ambient glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-mono tracking-wide text-amber-400">
              {t.authModalTitle}
            </h2>
            <p className="text-xs text-zinc-400">
              {tab === 'register' ? t.authRegisterBonus : t.subtitle}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-800/80 p-1 rounded-xl mb-5 border border-zinc-700/60">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.authLoginTab}
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all flex items-center justify-center space-x-1 ${
              tab === 'register'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.authRegisterTab}</span>
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
          <div className="mb-4 p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-center justify-between text-xs text-amber-300">
            <span className="flex items-center space-x-1.5 font-mono font-bold">
              <span>🎁</span>
              <span>{t.authRegisterBonus}</span>
            </span>
            <span className="font-mono bg-amber-500/20 px-2 py-0.5 rounded text-amber-400 font-bold border border-amber-500/40">
              🪙 500
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">
              {t.authUsername}
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
              {t.authPassword}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition shadow-[0_0_20px_rgba(245,158,11,0.35)] disabled:opacity-50"
          >
            {loading ? '...' : tab === 'login' ? t.authBtnLogin : t.authBtnRegister}
          </button>
        </form>

        {/* Guest continue */}
        <div className="mt-4 pt-4 border-t border-zinc-800 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition underline underline-offset-4"
          >
            {t.authGuestContinue} &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

