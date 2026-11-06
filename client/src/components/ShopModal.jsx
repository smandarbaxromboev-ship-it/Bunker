import React, { useState, useEffect } from 'react';
import { translations, getLocalized } from '../utils/translations';
import { ShoppingBag, Coins, Sparkles, Check, X, AlertCircle } from 'lucide-react';

export default function ShopModal({ socket, lang, user, onClose, onUserUpdated }) {
  const t = translations[lang] || translations.ru;
  const [tab, setTab] = useState('character'); // 'character' | 'frame' | 'title'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    socket.emit('getShopCatalog', (res) => {
      if (res && res.items) {
        setItems(res.items);
      }
      setLoading(false);
    });
  }, [socket]);

  const handleBuy = (itemId) => {
    if (!user || !user.username) {
      setErrorMsg(lang === 'uz' ? 'Xarid qilish uchun avval hisobingizga kiring!' : lang === 'en' ? 'Log in first to make purchases!' : 'Сначала войдите в аккаунт, чтобы покупать предметы!');
      return;
    }

    setErrorMsg('');
    setActionMsg('');
    socket.emit('buyShopItem', { username: user.username, itemId }, (res) => {
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.success && res.user) {
        setActionMsg(lang === 'uz' ? 'Muvaffaqiyatli sotib olindi!' : lang === 'en' ? 'Purchased successfully!' : 'Успешно приобретено!');
        onUserUpdated(res.user);
      }
    });
  };

  const handleEquip = (itemId) => {
    if (!user || !user.username) return;

    setErrorMsg('');
    setActionMsg('');
    socket.emit('equipShopItem', { username: user.username, itemId }, (res) => {
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.success && res.user) {
        setActionMsg(lang === 'uz' ? 'Taqildi!' : lang === 'en' ? 'Equipped!' : 'Экипировано!');
        onUserUpdated(res.user);
      }
    });
  };

  const filteredItems = items.filter(i => i.type === tab);
  const bunCoins = user ? user.bunCoins : 0;
  const inventory = (user && user.inventory) || [];
  const equipped = (user && user.equipped) || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-zinc-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl p-6 text-zinc-100 font-sans overflow-hidden flex flex-col max-h-[90vh]">
        {/* Amber cyber ambient glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-4 border-b border-zinc-800 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono tracking-wide text-amber-400">
                {t.shopTitle}
              </h2>
              <p className="text-xs text-zinc-400">
                {user ? `${user.username}` : t.guestContinue}
              </p>
            </div>
          </div>

          {/* Balance */}
          <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/40 px-3.5 py-1.5 rounded-xl self-start sm:self-auto shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <Coins className="w-5 h-5 text-amber-400 animate-spin-slow" />
            <span className="font-mono text-xs text-zinc-400">{t.shopCoinsBalance}</span>
            <span className="font-mono text-sm font-extrabold text-amber-400">
              🪙 {bunCoins}
            </span>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-3 p-2.5 bg-red-950/60 border border-red-500/60 rounded-xl flex items-center space-x-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {actionMsg && (
          <div className="mb-3 p-2.5 bg-emerald-950/60 border border-emerald-500/60 rounded-xl flex items-center space-x-2 text-xs text-emerald-300">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{actionMsg}</span>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex bg-zinc-800/80 p-1 rounded-xl mb-4 border border-zinc-700/60">
          <button
            type="button"
            onClick={() => setTab('character')}
            className={`flex-1 py-1.5 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
              tab === 'character' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.shopTabCharacters}
          </button>
          <button
            type="button"
            onClick={() => setTab('frame')}
            className={`flex-1 py-1.5 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
              tab === 'frame' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.shopTabFrames}
          </button>
          <button
            type="button"
            onClick={() => setTab('title')}
            className={`flex-1 py-1.5 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
              tab === 'title' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.shopTabTitles}
          </button>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[50vh]">
          {loading ? (
            <div className="text-center py-10 font-mono text-zinc-500 text-xs">
              Загрузка каталога...
            </div>
          ) : (
            filteredItems.map((item) => {
              const isOwned = inventory.includes(item.id) || item.price === 0;
              const isEquipped =
                equipped.character === item.id ||
                equipped.frame === item.id ||
                equipped.title === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isEquipped
                      ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : isOwned
                      ? 'bg-zinc-800/80 border-zinc-700/80 hover:border-zinc-600'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-750'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    {/* Item Icon / Preview */}
                    {item.type === 'character' && (
                      <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-700 flex items-center justify-center text-2xl shadow">
                        {item.avatar}
                      </div>
                    )}
                    {item.type === 'frame' && (
                      <div className={`w-12 h-12 rounded-xl bg-zinc-950 border-2 ${item.borderClass || ''} flex items-center justify-center text-xl shadow`}>
                        🥷
                      </div>
                    )}
                    {item.type === 'title' && (
                      <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-700 flex items-center justify-center text-amber-400">
                        <Sparkles className="w-6 h-6" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`font-mono text-sm font-bold truncate ${item.color || 'text-zinc-100'}`}>
                          {getLocalized(item.name, lang)}
                        </span>
                        {isEquipped && (
                          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/50 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
                            {t.shopEquippedBadge}
                          </span>
                        )}
                      </div>
                      {item.desc && (
                        <p className="text-xs text-zinc-400 truncate mt-0.5">
                          {getLocalized(item.desc, lang)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {isEquipped ? (
                      <div className="flex items-center space-x-1 text-emerald-400 text-xs font-mono font-bold px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl">
                        <Check className="w-4 h-4" />
                        <span>{t.shopEquippedBadge}</span>
                      </div>
                    ) : isOwned ? (
                      <button
                        onClick={() => handleEquip(item.id)}
                        className="px-3.5 py-1.5 bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-amber-400 font-mono text-xs font-bold rounded-xl border border-amber-500/40 transition shadow"
                      >
                        {t.shopBtnEquip}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuy(item.id)}
                        className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-mono text-xs font-bold rounded-xl transition shadow flex items-center space-x-1.5"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>{item.price > 0 ? `${item.price}` : t.shopFree}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

