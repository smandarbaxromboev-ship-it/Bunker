import React, { useState } from 'react';
import { User, Link as LinkIcon, Sparkles, X, Check, Trophy, Shield, Coins, Trash2 } from 'lucide-react';
import CharacterAvatar from './CharacterAvatar';
import { soundManager } from '../utils/audio';
import { translations } from '../utils/translations';

export default function ProfileModal({ user, socket, lang = 'ru', onClose, onProfileUpdated }) {
  const t = translations[lang] || translations.ru;
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSavePhoto = (e) => {
    e.preventDefault();
    if (!user?.username) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    socket.emit('updateProfile', {
      username: user.username,
      avatarUrl: avatarUrl.trim()
    }, (res) => {
      setLoading(false);
      if (res && res.success && res.user) {
        soundManager.playBeep(880, 0.1);
        setSuccessMsg(t.profilePhotoSaved || 'Фото профиля успешно сохранено!');
        if (onProfileUpdated) onProfileUpdated(res.user);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(res?.error || t.profilePhotoError || 'Ошибка при сохранении фото');
      }
    });
  };

  const handleClearPhoto = () => {
    setAvatarUrl('');
    if (!user?.username) return;
    setLoading(true);
    socket.emit('updateProfile', {
      username: user.username,
      avatarUrl: ''
    }, (res) => {
      setLoading(false);
      if (res && res.success && res.user) {
        soundManager.playBeep(600, 0.08);
        setSuccessMsg(t.profilePhotoRemoved || 'Фото удалено. Используется персонаж из магазина.');
        if (onProfileUpdated) onProfileUpdated(res.user);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-zinc-900 border-2 border-amber-500/70 rounded-3xl shadow-2xl p-5 sm:p-6 text-zinc-100 font-sans overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-5 border-b border-zinc-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-500/60 flex items-center justify-center text-amber-400 shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display text-white">
              {t.profileTitle}
            </h2>
            <p className="text-xs font-mono text-amber-400">
              @{user?.username}
            </p>
          </div>
        </div>

        {/* Avatar Showcase & Live Preview */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 mb-5 relative">
          <CharacterAvatar
            character={{
              ...(user?.characterDetails || {}),
              avatarUrl: avatarUrl || user?.avatarUrl
            }}
            size="lg"
            lang={lang}
            showTitle={true}
          />
          <div className="mt-2 text-[11px] font-mono text-zinc-400 text-center">
            {avatarUrl ? t.profileCustomPhotoActive : t.profileSkinActive}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center">
            <div className="flex items-center justify-center text-amber-400 mb-0.5">
              <Coins className="w-4 h-4" />
            </div>
            <div className="text-sm font-bold font-mono text-amber-400">
              {user?.bunCoins || 0}
            </div>
            <div className="text-[10px] text-zinc-400 uppercase font-mono">
              BunCoins
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center">
            <div className="flex items-center justify-center text-emerald-400 mb-0.5">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="text-sm font-bold font-mono text-emerald-400">
              {user?.stats?.wins || 0}
            </div>
            <div className="text-[10px] text-zinc-400 uppercase font-mono">
              {t.profileWins}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center">
            <div className="flex items-center justify-center text-cyan-400 mb-0.5">
              <Shield className="w-4 h-4" />
            </div>
            <div className="text-sm font-bold font-mono text-cyan-400">
              {user?.stats?.gamesPlayed || 0}
            </div>
            <div className="text-[10px] text-zinc-400 uppercase font-mono">
              {t.profileGames}
            </div>
          </div>
        </div>

        {/* Photo URL Form */}
        <form onSubmit={handleSavePhoto} className="space-y-3">
          <div>
            <label className="block text-xs font-mono text-zinc-300 mb-1 flex items-center justify-between">
              <span>{t.profilePhotoLabel}</span>
              {user?.avatarUrl && (
                <button
                  type="button"
                  onClick={handleClearPhoto}
                  className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                  title={t.profileRemovePhoto}
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{t.profileRemovePhoto}</span>
                </button>
              )}
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 outline-none transition font-mono"
              />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1 font-mono">
              {t.profilePhotoHint}
            </p>
          </div>

          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-mono">
              {errorMsg}
            </div>
          )}

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold font-display text-xs uppercase tracking-wider rounded-xl transition shadow cursor-pointer disabled:opacity-50"
            >
              {loading ? t.profileSaving : t.profileSavePhoto}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-mono text-xs rounded-xl transition cursor-pointer"
            >
              {t.btnClose || 'Закрыть'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
