import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, AlertCircle, Vote, Ghost, Smile, Sparkles, X } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { translations, getLocalized } from '../utils/translations';

const QUICK_PHRASES = {
  ru: [
    "Я полезен бункеру!",
    "Кто скрывает болезнь?",
    "Голосуем против подозрительных!",
    "Мой багаж спасет жизнь!",
    "Я считаю, что он врет!"
  ],
  en: [
    "I am useful for bunker!",
    "Who hides an illness?",
    "Vote against suspicious ones!",
    "My luggage will save us!",
    "I think they are bluffing!"
  ],
  uz: [
    "Men bunker uchun foydaliman!",
    "Kim kasallikni yashiryapti?",
    "Shubhaliga qarshi ovoz beraylik!",
    "Yukim hayotimizni saqlaydi!",
    "U aldayapti deb o'ylayman!"
  ]
};

const BUNKER_STICKERS = [
  { id: 'rad', emoji: '☢️', label: 'РАДИАЦИЯ!' },
  { id: 'survive', emoji: '🛡️', label: 'Я ВЫЖИВУ!' },
  { id: 'liar', emoji: '🤥', label: 'НЕ ВЕРЮ!' },
  { id: 'dead', emoji: '💀', label: 'МНЕ КОНЕЦ' },
  { id: 'vote', emoji: '🗳️', label: 'ГОЛОСУЕМ!' },
  { id: 'hand', emoji: '🤝', label: 'СПАСИБО' },
  { id: 'win', emoji: '🏆', label: 'БУНКЕР НАШ' },
  { id: 'rat', emoji: '🐀', label: 'КТО КРЫСА?' },
  { id: 'food', emoji: '🥫', label: 'ЕСТЬ ЕДА?' },
  { id: 'medic', emoji: '💉', label: 'Я МЕДИК' },
  { id: 'bluff', emoji: '🎭', label: 'ЭТО БЛЕФ' },
  { id: 'fake', emoji: '🚫', label: 'ОН ВРЕТ!' },
  { id: 'ghost_hi', emoji: '👻', label: 'ИЗ АДА' },
  { id: 'ghost_eye', emoji: '👁️', label: 'СЛЕЖУ' },
  { id: 'popcorn', emoji: '🍿', label: 'ДРАМА' },
  { id: 'brain', emoji: '🧠', label: 'ГЕНИЙ' },
  { id: 'fire', emoji: '🔥', label: 'ПОЖАР' },
  { id: 'bomb', emoji: '💣', label: 'БОМБА' },
  { id: 'bread', emoji: '🍞', label: 'ХЛЕБ' },
  { id: 'shh', emoji: '🤫', label: 'ТИШИНА' }
];

export default function ChatPanel({ 
  messages, 
  myPlayerId, 
  isAlive, 
  isChatLocked = false, 
  onSendMessage, 
  onStartVoting,
  isHost,
  canStartVoting,
  lang = 'ru'
}) {
  const [text, setText] = useState('');
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const t = translations[lang] || translations.ru;
  const phrases = QUICK_PHRASES[lang] || QUICK_PHRASES.ru;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    soundManager.playBeep(900, 0.04);
    onSendMessage(text);
    setText('');
    setShowStickerPicker(false);
  };

  const handleQuickPhrase = (phrase) => {
    soundManager.playBeep(900, 0.04);
    onSendMessage(phrase);
  };

  const handleSendSticker = (sticker) => {
    soundManager.playBeep(1100, 0.05);
    onSendMessage(sticker.label, sticker);
    setShowStickerPicker(false);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/90 border border-zinc-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl relative">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-display font-bold text-xs sm:text-sm text-white tracking-wide truncate">
            {t.chatTitle}
          </span>
          {!isAlive && (
            <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-mono font-bold flex items-center gap-1">
              <span>👻</span>
              <span>ПРИЗРАКИ</span>
            </span>
          )}
        </div>

        {/* Voting trigger button for Host */}
        {isHost && canStartVoting && (
          <button
            onClick={() => {
              soundManager.playAlarm();
              onStartVoting();
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-display font-bold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30 flex items-center gap-1.5 transition animate-pulse cursor-pointer shrink-0"
          >
            <Vote className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.btnStartVoting}</span>
            <span className="sm:hidden">{t.votingShort}</span>
          </button>
        )}
      </div>

      {/* Ghost Chat Notification Bar for Eliminated Players */}
      {!isAlive && (
        <div className="px-3 py-1.5 bg-purple-950/70 border-b border-purple-900/60 text-[11px] font-mono text-purple-300 flex items-center gap-2 shrink-0 animate-fadeIn">
          <Ghost className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
          <span className="truncate">
            {t.ghostChatBanner || "👻 Призрачный чат: видят только выбывшие. Живые вас не слышат!"}
          </span>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 space-y-2.5 min-h-0">
        {messages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div
                key={msg.id}
                className="p-2 sm:p-2.5 rounded-xl bg-amber-950/25 border border-amber-900/40 text-[11px] sm:text-xs font-mono text-amber-300 flex items-start gap-2 shadow-sm"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-bold text-amber-400 uppercase tracking-wide mr-1">
                    [{getLocalized(msg.senderName, lang) || msg.senderName}]:
                  </span>
                  <span>{getLocalized(msg.text, lang) || msg.text}</span>
                </div>
              </div>
            );
          }

          const isMe = msg.senderId === myPlayerId;
          const isGhostMsg = Boolean(msg.isGhost);

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fadeIn`}
            >
              <div className="flex items-center gap-1 mb-0.5 px-1 text-[10px] sm:text-[11px] font-mono text-zinc-400">
                {isGhostMsg && (
                  <span className="px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 font-bold border border-purple-700/60 text-[9px] flex items-center gap-0.5">
                    <span>👻</span>
                    <span>ПРИЗРАК</span>
                  </span>
                )}
                <span className={isMe ? (isGhostMsg ? 'text-purple-400 font-bold' : 'text-amber-400 font-bold') : (isGhostMsg ? 'text-purple-300 font-semibold' : 'text-zinc-300 font-medium')}>
                  {msg.senderName} {isMe ? t.you : ''}
                </span>
                <span className="text-[9px] text-zinc-500">{msg.timestamp}</span>
              </div>

              {/* Message Bubble: either Sticker or Plain Text */}
              {msg.sticker ? (
                <div
                  className={`p-2 sm:p-2.5 rounded-2xl flex items-center gap-2 shadow-md border transition-transform hover:scale-105 ${
                    isMe
                      ? isGhostMsg
                        ? 'bg-purple-900/60 border-purple-500 text-white rounded-tr-none shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                        : 'bg-amber-500/20 border-amber-500/60 text-amber-300 rounded-tr-none shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : isGhostMsg
                      ? 'bg-purple-950/80 border-purple-700/70 text-purple-200 rounded-tl-none'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-100 rounded-tl-none'
                  }`}
                >
                  <span className="text-2xl sm:text-3xl filter drop-shadow">
                    {msg.sticker.emoji || '☢️'}
                  </span>
                  <div className="font-display font-extrabold text-xs sm:text-sm uppercase tracking-wide">
                    {msg.sticker.label || msg.text}
                  </div>
                </div>
              ) : (
                <div
                  className={`p-2.5 sm:p-3 rounded-2xl max-w-[90%] sm:max-w-[85%] text-xs sm:text-sm leading-relaxed break-words shadow-sm ${
                    isMe
                      ? isGhostMsg
                        ? 'bg-purple-800 text-white font-medium rounded-tr-none border border-purple-600/70 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                        : 'bg-amber-500 text-black font-medium rounded-tr-none'
                      : isGhostMsg
                      ? 'bg-purple-950/90 border border-purple-800/80 text-purple-200 rounded-tl-none'
                      : 'bg-zinc-800 border border-zinc-700/60 text-zinc-100 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Sticker Picker Popover */}
      {showStickerPicker && (
        <div className="absolute bottom-14 left-2 right-2 p-3 bg-zinc-950/95 border-2 border-amber-500/60 rounded-2xl shadow-2xl backdrop-blur-md z-30 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
            <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {t.stickersTitle || 'Стикеры бункера'}
            </span>
            <button
              onClick={() => setShowStickerPicker(false)}
              className="text-zinc-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-48 overflow-y-auto p-1">
            {BUNKER_STICKERS.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleSendSticker(st)}
                className="p-1.5 rounded-xl bg-zinc-900 hover:bg-amber-500/20 active:bg-amber-500 border border-zinc-800 hover:border-amber-500/50 flex flex-col items-center justify-center transition cursor-pointer group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">
                  {st.emoji}
                </span>
                <span className="text-[9px] font-mono text-zinc-400 group-hover:text-amber-300 truncate w-full text-center mt-0.5 font-bold">
                  {st.label.replace(/[^A-Za-zА-Яа-яЁё0-9!? ]/g, '')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Mobile Phrases */}
      <div className="px-2.5 py-1.5 bg-zinc-950/70 border-t border-zinc-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {phrases.map((phrase, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleQuickPhrase(phrase)}
            className="text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 active:bg-amber-500 active:text-black text-zinc-300 border border-zinc-700 whitespace-nowrap transition cursor-pointer"
          >
            {phrase}
          </button>
        ))}
      </div>

      {/* Input Form with Sticker Picker Button */}
      <div className="p-2 sm:p-3 border-t border-zinc-800 bg-zinc-950/90 shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5 sm:gap-2">
          {/* Sticker picker button */}
          <button
            type="button"
            onClick={() => setShowStickerPicker(!showStickerPicker)}
            title={t.btnStickers || "Отправить стикер"}
            className={`p-2 sm:p-2.5 rounded-xl border transition flex items-center justify-center shrink-0 cursor-pointer ${
              showStickerPicker
                ? 'bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-500/30'
                : 'bg-zinc-900 hover:bg-zinc-800 text-amber-400 border-zinc-700'
            }`}
          >
            <Smile className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={!isAlive ? (t.ghostChatPlaceholder || "👻 Чат призраков (видят только выбывшие)...") : t.chatPlaceholder}
            maxLength={300}
            className={`flex-1 border rounded-xl px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none font-mono ${
              !isAlive
                ? 'bg-purple-950/30 border-purple-800 focus:border-purple-500'
                : 'bg-zinc-900 border-zinc-700 focus:border-amber-500'
            }`}
          />

          <button
            type="submit"
            disabled={!text.trim()}
            className={`p-2 sm:p-2.5 rounded-xl font-bold transition flex items-center justify-center shrink-0 ${
              text.trim()
                ? !isAlive
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 cursor-pointer'
                  : 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 cursor-pointer'
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
