import React, { useState, useEffect, useRef } from 'react';
import { Send, Lock, MessageSquare, AlertCircle, Vote, Ghost } from 'lucide-react';
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

export default function ChatPanel({ 
  messages, 
  myPlayerId, 
  isAlive, 
  isChatLocked, 
  onSendMessage, 
  onStartVoting,
  isHost,
  canStartVoting,
  lang = 'ru'
}) {
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);
  const t = translations[lang] || translations.ru;
  const phrases = QUICK_PHRASES[lang] || QUICK_PHRASES.ru;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || !isAlive || isChatLocked) return;
    soundManager.playBeep(900, 0.04);
    onSendMessage(text);
    setText('');
  };

  const handleQuickPhrase = (phrase) => {
    if (!isAlive || isChatLocked) return;
    soundManager.playBeep(900, 0.04);
    onSendMessage(phrase);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/90 border border-zinc-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-display font-bold text-xs sm:text-sm text-white tracking-wide truncate">
            {t.chatTitle}
          </span>
        </div>

        {/* Voting trigger button for Host */}
        {isHost && canStartVoting && !isChatLocked && (
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

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1 mb-0.5 px-1 text-[10px] sm:text-[11px] font-mono text-zinc-400">
                <span className={isMe ? 'text-amber-400 font-bold' : 'text-zinc-300 font-medium'}>
                  {msg.senderName} {isMe ? t.you : ''}
                </span>
                <span className="text-[9px] text-zinc-500">{msg.timestamp}</span>
              </div>
              <div
                className={`p-2.5 sm:p-3 rounded-2xl max-w-[90%] sm:max-w-[85%] text-xs sm:text-sm leading-relaxed break-words shadow-sm ${
                  isMe
                    ? 'bg-amber-500 text-black font-medium rounded-tr-none'
                    : 'bg-zinc-800 border border-zinc-700/60 text-zinc-100 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Mobile Phrases */}
      {isAlive && !isChatLocked && (
        <div className="px-2.5 py-1.5 bg-zinc-950/70 border-t border-zinc-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {phrases.map((phrase, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleQuickPhrase(phrase)}
              className="text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 active:bg-amber-500 active:text-black text-zinc-300 border border-zinc-700 whitespace-nowrap transition"
            >
              {phrase}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-2 sm:p-3 border-t border-zinc-800 bg-zinc-950/90 shrink-0">
        {!isAlive ? (
          <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-900/50 text-center text-xs font-mono text-purple-300 flex items-center justify-center gap-2">
            <Ghost className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="truncate">{t.ghostChatBlocked}</span>
          </div>
        ) : isChatLocked ? (
          <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-xs font-mono text-zinc-400 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">{t.chatLocked}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-center gap-1.5 sm:gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.chatPlaceholder}
              maxLength={300}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className={`p-2 sm:p-2.5 rounded-xl font-bold transition flex items-center justify-center shrink-0 ${
                text.trim()
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 cursor-pointer'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
