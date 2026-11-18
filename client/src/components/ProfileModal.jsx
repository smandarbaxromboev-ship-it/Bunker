import React, { useState, useRef } from 'react';
import { User, Link as LinkIcon, Sparkles, X, Check, Trophy, Shield, Coins, Trash2, Upload, Pencil } from 'lucide-react';
import CharacterAvatar from './CharacterAvatar';
import { soundManager } from '../utils/audio';
import { translations } from '../utils/translations';

export default function ProfileModal({ user, socket, lang = 'ru', onClose, onProfileUpdated }) {
  const t = translations[lang] || translations.ru;
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isEditingNick, setIsEditingNick] = useState(false);
  const [newNick, setNewNick] = useState(user?.username || '');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleSaveNick = (e) => {
    e?.preventDefault();
    const trimmed = newNick.trim();
    if (!trimmed || trimmed === user?.username) {
      setIsEditingNick(false);
      return;
    }
    if (trimmed.length < 2) {
      setErrorMsg(lang === 'uz' ? 'Nik kamida 2 ta belgidan iborat bo\'lishi kerak' : lang === 'en' ? 'Nickname must be at least 2 characters' : 'Никнейм должен быть не короче 2 символов');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    socket.emit('updateProfile', {
      username: user.username,
      newUsername: trimmed
    }, (res) => {
      setLoading(false);
      if (res && res.success && res.user) {
        soundManager.playBeep(880, 0.1);
        setIsEditingNick(false);
        setSuccessMsg(lang === 'uz' ? 'Nik muvaffaqiyatli saqlandi!' : lang === 'en' ? 'Nickname updated successfully!' : 'Никнейм успешно изменён!');
        if (onProfileUpdated) onProfileUpdated(res.user);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(res?.error || 'Ошибка при изменении ника');
      }
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg(lang === 'uz' ? 'Faqat rasm fayllari qabul qilinadi!' : lang === 'en' ? 'Only image files are allowed!' : 'Пожалуйста, выберите файл изображения!');
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
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold font-display text-white">
              {t.profileTitle}
            </h2>
            {isEditingNick ? (
              <form onSubmit={handleSaveNick} className="flex items-center gap-1.5 mt-1">
                <input
                  type="text"
                  value={newNick}
                  onChange={(e) => setNewNick(e.target.value)}
                  maxLength={16}
                  className="px-2 py-0.5 rounded bg-zinc-950 border border-amber-500/70 text-xs font-mono text-amber-300 w-36 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] transition cursor-pointer"
                  title={lang === 'uz' ? "Saqlash" : lang === 'en' ? "Save" : "Сохранить"}
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => { setIsEditingNick(false); setNewNick(user?.username || ''); }}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] transition cursor-pointer"
                  title={lang === 'uz' ? "Bekor qilish" : lang === 'en' ? "Cancel" : "Отмена"}
                >
                  ✕
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs font-mono text-amber-400 truncate max-w-[160px]">
                  @{user?.username}
                </p>
                <button
                  type="button"
                  onClick={() => { setNewNick(user?.username || ''); setIsEditingNick(true); }}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-amber-400 font-mono transition cursor-pointer px-1.5 py-0.5 rounded hover:bg-zinc-800"
                  title={lang === 'uz' ? "Nikni o'zgartirish" : lang === 'en' ? "Change nickname" : "Изменить никнейм"}
                >
                  <Pencil className="w-3 h-3 text-amber-500" />
                  <span>{lang === 'uz' ? "o'zgartirish" : lang === 'en' ? 'edit' : 'изменить'}</span>
                </button>
              </div>
            )}
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

            {/* Upload Buttons Row */}
            <div className="flex gap-2 items-center mb-2">
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
            </div>

            {/* Direct Link Input */}
            <div className="relative">
              <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="url"
                value={avatarUrl.startsWith('data:') ? '' : avatarUrl}
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
