import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, MessageSquare, AlertCircle, Vote, Ghost, Smile, Sparkles, X, 
  Mic, Trash2, Check, Loader2, Reply, Pencil, CornerDownRight 
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { translations, getLocalized } from '../utils/translations';
import VoiceMessagePlayer from './VoiceMessagePlayer';

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
  { id: 'rad', emoji: '☢️', label: { ru: 'РАДИАЦИЯ!', en: 'RADIATION!', uz: 'RADIATSIYA!' } },
  { id: 'survive', emoji: '🛡️', label: { ru: 'Я ВЫЖИВУ!', en: 'I WILL SURVIVE!', uz: 'TIRIK QOLAMAN!' } },
  { id: 'liar', emoji: '🤥', label: { ru: 'НЕ ВЕРЮ!', en: 'DON\'T BELIEVE!', uz: 'ISHONMAYMAN!' } },
  { id: 'dead', emoji: '💀', label: { ru: 'МНЕ КОНЕЦ', en: 'I AM FINISHED', uz: 'TAMOM BO\'LDIM' } },
  { id: 'vote', emoji: '🗳️', label: { ru: 'ГОЛОСУЕМ!', en: 'VOTE NOW!', uz: 'OVOZ BERAMIZ!' } },
  { id: 'hand', emoji: '🤝', label: { ru: 'СПАСИБО', en: 'THANK YOU', uz: 'RAHMAT' } },
  { id: 'win', emoji: '🏆', label: { ru: 'БУНКЕР НАШ', en: 'BUNKER IS OURS', uz: 'BUNKER BIZNIKI' } },
  { id: 'rat', emoji: '🐀', label: { ru: 'КТО КРЫСА?', en: 'WHO IS RAT?', uz: 'KIM SOTQIN?' } },
  { id: 'food', emoji: '🥫', label: { ru: 'ЕСТЬ ЕДА?', en: 'ANY FOOD?', uz: 'OVQAT BORMI?' } },
  { id: 'medic', emoji: '💉', label: { ru: 'Я МЕДИК', en: 'I AM MEDIC', uz: 'MEN SHIFOKORMAN' } },
  { id: 'bluff', emoji: '🎭', label: { ru: 'ЭТО БЛЕФ', en: 'IT\'S A BLUFF', uz: 'BU BLÖF' } },
  { id: 'fake', emoji: '🚫', label: { ru: 'ОН ВРЕТ!', en: 'THEY LIE!', uz: 'U ALDAYAPTI!' } },
  { id: 'ghost_hi', emoji: '👻', label: { ru: 'ИЗ АДА', en: 'FROM BEYOND', uz: 'NARIGI DUNYODAN' } },
  { id: 'ghost_eye', emoji: '👁️', label: { ru: 'СЛЕЖУ', en: 'WATCHING YOU', uz: 'KUZATYAPMAN' } },
  { id: 'popcorn', emoji: '🍿', label: { ru: 'ДРАМА', en: 'DRAMA', uz: 'TOMOSHA' } },
  { id: 'brain', emoji: '🧠', label: { ru: 'ГЕНИЙ', en: 'GENIUS', uz: 'DOHIY' } },
  { id: 'fire', emoji: '🔥', label: { ru: 'ПОЖАР', en: 'FIRE', uz: 'YONG\'IN' } },
  { id: 'bomb', emoji: '💣', label: { ru: 'БОМБА', en: 'BOMB', uz: 'BOMBA' } },
  { id: 'bread', emoji: '🍞', label: { ru: 'ХЛЕБ', en: 'BREAD', uz: 'NON' } },
  { id: 'shh', emoji: '🤫', label: { ru: 'ТИШИНА', en: 'SILENCE', uz: 'JIMLIK' } }
];

export default function ChatPanel({ 
  messages, 
  myPlayerId, 
  isAlive, 
  isChatLocked = false, 
  onSendMessage, 
  onEditMessage,
  onDeleteMessage,
  onTyping,
  typingUsers = {},
  onStartVoting,
  isHost,
  canStartVoting,
  onMarkMessagesRead,
  lang = 'ru'
}) {
  const [text, setText] = useState('');
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // { id, senderName, text, isVoice, isSticker }
  const [editingMessage, setEditingMessage] = useState(null); // { id, text }
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [isSendingVoice, setIsSendingVoice] = useState(false);
  const [micError, setMicError] = useState('');

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const streamRef = useRef(null);
  const inputRef = useRef(null);
  const lastTypingEmitRef = useRef(0);

  const t = translations[lang] || translations.ru;
  const phrases = QUICK_PHRASES[lang] || QUICK_PHRASES.ru;

  useEffect(() => {
    // Scroll ONLY the inner chat feed, never scrolling the main page window!
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, typingUsers]);

  useEffect(() => {
    if (!onMarkMessagesRead || !messages || messages.length === 0 || !myPlayerId) return;
    const unreadIds = messages
      .filter(m => m.senderId !== myPlayerId && (!m.readBy || !m.readBy.some(r => r.id === myPlayerId)))
      .map(m => m.id);
    if (unreadIds.length > 0) {
      onMarkMessagesRead(unreadIds);
    }
  }, [messages, myPlayerId, onMarkMessagesRead]);

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleInputChange = (e) => {
    setText(e.target.value);
    const now = Date.now();
    if (now - lastTypingEmitRef.current > 1500 && onTyping) {
      lastTypingEmitRef.current = now;
      onTyping();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (editingMessage && onEditMessage) {
      soundManager.playBeep(900, 0.04);
      onEditMessage(editingMessage.id, text.trim());
      setEditingMessage(null);
      setText('');
      return;
    }

    soundManager.playBeep(900, 0.04);
    onSendMessage(text, null, null, replyingTo);
    setText('');
    setReplyingTo(null);
    setShowStickerPicker(false);
  };

  const handleQuickPhrase = (phrase) => {
    soundManager.playBeep(900, 0.04);
    onSendMessage(phrase, null, null, replyingTo);
    setReplyingTo(null);
  };

  const handleSendSticker = (sticker) => {
    soundManager.playBeep(1100, 0.05);
    const labelText = getLocalized(sticker.label, lang) || sticker.label;
    onSendMessage(labelText, { ...sticker, label: labelText }, null, replyingTo);
    setShowStickerPicker(false);
    setReplyingTo(null);
  };

  const handleStartReply = (msg) => {
    soundManager.playBeep(850, 0.03);
    setEditingMessage(null);
    setReplyingTo({
      id: msg.id,
      senderName: getLocalized(msg.senderName, lang) || msg.senderName,
      text: msg.voice ? (lang === 'uz' ? '🎙️ Ovozli xabar' : lang === 'en' ? '🎙️ Voice message' : '🎙️ Голосовое сообщение')
            : msg.sticker ? `${msg.sticker.emoji || '☢️'} Стикер`
            : msg.text,
      isVoice: Boolean(msg.voice),
      isSticker: Boolean(msg.sticker)
    });
    inputRef.current?.focus();
  };

  const handleStartEdit = (msg) => {
    soundManager.playBeep(850, 0.03);
    setReplyingTo(null);
    setEditingMessage({
      id: msg.id,
      text: msg.text
    });
    setText(msg.text);
    inputRef.current?.focus();
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setText('');
  };

  // ===================== ГОЛОСОВЫЕ СООБЩЕНИЯ (БЕЗ ЛИМИТА В 1 МИНУТУ!) =====================
  const startRecording = async () => {
    try {
      setMicError('');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicError(t.micNotSupported || 'Запись аудио не поддерживается браузером');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordDuration(0);
      soundManager.playBeep(950, 0.05);

      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      let count = 0;
      recordTimerRef.current = setInterval(() => {
        count += 1;
        setRecordDuration(count);
        // Никакого искусственного ограничения в 1 минуту — записывайте сколько хотите!
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      soundManager.playBeep(350, 0.1);
      setMicError(t.micDenied || 'Разрешите доступ к микрофону в браузере для голосовых сообщений');
      setTimeout(() => setMicError(''), 5000);
    }
  };

  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setIsSendingVoice(true);
    soundManager.playBeep(850, 0.05);

    const recorder = mediaRecorderRef.current;
    const finalDuration = recordDuration;

    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (audioBlob.size > 0 && finalDuration >= 1) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result;
          onSendMessage('', null, { audioData: base64Data, duration: finalDuration }, replyingTo);
          setIsRecording(false);
          setRecordDuration(0);
          setIsSendingVoice(false);
          setReplyingTo(null);
        };
        reader.readAsDataURL(audioBlob);
      } else {
        setIsRecording(false);
        setRecordDuration(0);
        setIsSendingVoice(false);
      }
    };

    recorder.stop();
  };

  const cancelRecording = () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordDuration(0);
    setIsSendingVoice(false);
    soundManager.playBeep(450, 0.06);
  };

  const formatRecordTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Активные печатающие игроки (кроме меня)
  const activeTypers = Object.entries(typingUsers || {})
    .filter(([id, data]) => id !== myPlayerId && data.expiresAt > Date.now())
    .map(([, data]) => data.name);

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
              <span>{t.ghostsChatBadge || 'ПРИЗРАКИ'}</span>
            </span>
          )}
        </div>

        {/* Voting trigger button for ALL players (not just Host!) */}
        {canStartVoting && (
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

      {/* Error notification for Mic */}
      {micError && (
        <div className="px-3 py-2 bg-red-950/80 border-b border-red-800 text-red-200 text-xs font-mono flex items-center gap-2 animate-fadeIn shrink-0">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="truncate">{micError}</span>
        </div>
      )}

      {/* Messages Feed */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-2.5 sm:p-4 space-y-3 min-h-0">
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
                    [{getLocalized(msg.senderName, lang)}]:
                  </span>
                  <span>{getLocalized(msg.text, lang)}</span>
                </div>
              </div>
            );
          }

          const isMe = msg.senderId === myPlayerId;
          const isGhostMsg = Boolean(msg.isGhost);
          const canDelete = isMe || isHost;
          const canEdit = isMe && !msg.voice && !msg.sticker;
          const otherReaders = (msg.readBy || []).filter(r => r.id !== myPlayerId);

          return (
            <div
              key={msg.id}
              className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'} animate-fadeIn relative`}
            >
              {/* Sender Name, Time, Edited status and Action buttons */}
              <div className="flex items-center gap-1.5 mb-0.5 px-1 text-[10px] sm:text-[11px] font-mono text-zinc-400">
                {isGhostMsg && (
                  <span className="px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 font-bold border border-purple-700/60 text-[9px] flex items-center gap-0.5">
                    <span>👻</span>
                    <span>{t.ghostMsgBadge || 'ПРИЗРАК'}</span>
                  </span>
                )}
                <span className={isMe ? (isGhostMsg ? 'text-purple-400 font-bold' : 'text-amber-400 font-bold') : (isGhostMsg ? 'text-purple-300 font-semibold' : 'text-zinc-300 font-medium')}>
                  {getLocalized(msg.senderName, lang)} {isMe ? t.you : ''}
                </span>
                <span className="text-[9px] text-zinc-500">
                  {msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false })
                    : msg.timestamp}
                </span>
                {isMe && (
                  <span 
                    title={otherReaders.length > 0 
                      ? `${lang === 'uz' ? "O'qiganlar" : lang === 'en' ? 'Read by' : 'Прочитали'}: ${otherReaders.map(r => r.name).join(', ')}` 
                      : (lang === 'uz' ? 'Yuborildi' : lang === 'en' ? 'Sent' : 'Отправлено')}
                    className={`text-[10px] font-bold flex items-center gap-0.5 cursor-help ${
                      otherReaders.length > 0 ? 'text-emerald-400' : 'text-zinc-500'
                    }`}
                  >
                    {otherReaders.length > 0 ? (
                      <>
                        <span>✓✓</span>
                        <span className="text-[9px]">({otherReaders.length})</span>
                      </>
                    ) : (
                      <span>✓</span>
                    )}
                  </span>
                )}
                {msg.isEdited && (
                  <span className="text-[9px] text-zinc-400 italic">
                    ({lang === 'uz' ? 'tahrirlangan' : lang === 'en' ? 'edited' : 'изм.'})
                  </span>
                )}

                {/* Quick Message Actions: Reply, Edit, Delete on Hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-1 bg-zinc-950/80 px-1 py-0.5 rounded-md border border-zinc-800">
                  {/* Reply Button */}
                  <button
                    onClick={() => handleStartReply(msg)}
                    title={lang === 'uz' ? 'Javob berish' : lang === 'en' ? 'Reply' : 'Ответить'}
                    className="p-1 text-zinc-400 hover:text-amber-400 rounded hover:bg-zinc-800 transition"
                  >
                    <Reply className="w-3 h-3" />
                  </button>

                  {/* Edit Button (if author and text) */}
                  {canEdit && (
                    <button
                      onClick={() => handleStartEdit(msg)}
                      title={lang === 'uz' ? 'Tahrirlash' : lang === 'en' ? 'Edit' : 'Изменить'}
                      className="p-1 text-zinc-400 hover:text-cyan-400 rounded hover:bg-zinc-800 transition"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}

                  {/* Delete Button (if author or host) */}
                  {canDelete && (
                    <button
                      onClick={() => {
                        if (onDeleteMessage) {
                          soundManager.playBeep(500, 0.05);
                          onDeleteMessage(msg.id);
                        }
                      }}
                      title={lang === 'uz' ? "O'chirish" : lang === 'en' ? 'Delete' : 'Удалить'}
                      className="p-1 text-zinc-400 hover:text-red-400 rounded hover:bg-zinc-800 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quoted Message / Reply Preview if present */}
              {msg.replyTo && (
                <div className={`mb-1 px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-mono border-l-2 max-w-[85%] truncate flex items-center gap-1.5 ${
                  isMe 
                    ? 'bg-amber-500/10 border-amber-400 text-amber-200' 
                    : 'bg-zinc-800/80 border-cyan-400 text-zinc-300'
                }`}>
                  <CornerDownRight className="w-3 h-3 shrink-0 opacity-70" />
                  <span className="font-bold shrink-0">{msg.replyTo.senderName}:</span>
                  <span className="truncate opacity-90">{msg.replyTo.text}</span>
                </div>
              )}

              {/* Message Bubble: Voice Message, Sticker, or Plain Text */}
              {msg.voice ? (
                <VoiceMessagePlayer
                  audioData={msg.voice.audioData}
                  duration={msg.voice.duration}
                  isMe={isMe}
                  isGhost={isGhostMsg}
                />
              ) : msg.sticker ? (
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
                    {getLocalized(msg.sticker.label, lang) || getLocalized(msg.text, lang)}
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
                  {getLocalized(msg.text, lang)}
                </div>
              )}

              {/* Readers list badge for message author */}
              {isMe && otherReaders.length > 0 && (
                <div 
                  className="mt-0.5 px-1 text-[9px] font-mono text-emerald-400/90 flex items-center gap-1 select-none"
                  title={`${lang === 'uz' ? "O'qiganlar" : lang === 'en' ? 'Read by' : 'Прочитали'}: ${otherReaders.map(r => r.name).join(', ')}`}
                >
                  <span>👁️</span>
                  <span className="truncate max-w-[220px]">
                    {otherReaders.map(r => r.name).join(', ')}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Live Typing Indicator with 3 animated bouncing dots */}
        {activeTypers.length > 0 && (
          <div className="flex items-center gap-2 py-1 px-2 text-xs font-mono text-amber-400/90 animate-fadeIn">
            <span className="truncate">
              {activeTypers.join(', ')} {lang === 'uz' ? 'yozmoqda' : lang === 'en' ? 'is typing' : 'печатает'}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0ms]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:150ms]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:300ms]"></span>
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sticker Picker Popover */}
      {showStickerPicker && (
        <div className="absolute bottom-16 left-2 right-2 p-3 bg-zinc-950/95 border-2 border-amber-500/60 rounded-2xl shadow-2xl backdrop-blur-md z-30 animate-fadeIn">
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
                  {(getLocalized(st.label, lang) || st.label).replace(/[^A-Za-zА-Яа-яЁё0-9!? ']/g, '')}
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

      {/* Active Reply or Edit Banner above input */}
      {replyingTo && (
        <div className="px-3 py-1.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-300 shrink-0 animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <Reply className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-amber-400 font-bold shrink-0">{lang === 'uz' ? 'Javob:' : lang === 'en' ? 'Reply to:' : 'Ответ:'} {replyingTo.senderName}</span>
            <span className="text-zinc-400 truncate text-[11px]">«{replyingTo.text}»</span>
          </div>
          <button onClick={handleCancelReply} className="p-1 text-zinc-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {editingMessage && (
        <div className="px-3 py-1.5 bg-cyan-950/40 border-t border-cyan-800/60 flex items-center justify-between text-xs font-mono text-cyan-300 shrink-0 animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <Pencil className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-bold shrink-0">{lang === 'uz' ? 'Tahrirlash:' : lang === 'en' ? 'Editing message' : 'Редактирование сообщения'}</span>
          </div>
          <button onClick={handleCancelEdit} className="p-1 text-zinc-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input Form with Text, Stickers and Voice Recording */}
      <div className="p-2 sm:p-3 border-t border-zinc-800 bg-zinc-950/90 shrink-0">
        {isRecording ? (
          /* Live Voice Recording UI Bar (No limit, record as long as wanted!) */
          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-red-950/40 border-2 border-red-500/80 rounded-2xl animate-pulse">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
              <span className="text-xs sm:text-sm font-mono font-bold text-red-300">
                {formatRecordTime(recordDuration)}
              </span>
              <span className="text-[11px] text-zinc-400 hidden sm:inline truncate">
                {t.recordingVoice || 'Идет запись...'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Cancel Button */}
              <button
                type="button"
                onClick={cancelRecording}
                title={t.cancelVoice || "Отменить запись"}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-red-400 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Stop & Send Button */}
              <button
                type="button"
                onClick={stopAndSendRecording}
                disabled={isSendingVoice}
                title={t.sendVoiceTooltip || "Отправить голосовое сообщение"}
                className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-red-600/40 cursor-pointer"
              >
                {isSendingVoice ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{t.btnSendVoice || 'Отправить'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Normal Text + Sticker + Mic Input Form */
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
              ref={inputRef}
              type="text"
              value={text}
              onChange={handleInputChange}
              placeholder={
                editingMessage 
                  ? (lang === 'uz' ? 'Yangi matnni kiriting...' : lang === 'en' ? 'Edit message...' : 'Введите новый текст...')
                  : !isAlive 
                  ? (t.ghostChatPlaceholder || "👻 Чат призраков (видят только выбывшие)...") 
                  : t.chatPlaceholder
              }
              maxLength={300}
              className={`flex-1 border rounded-xl px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none font-mono ${
                editingMessage
                  ? 'bg-cyan-950/20 border-cyan-500 focus:border-cyan-400'
                  : !isAlive
                  ? 'bg-purple-950/30 border-purple-800 focus:border-purple-500'
                  : 'bg-zinc-900 border-zinc-700 focus:border-amber-500'
              }`}
            />

            {/* Voice Record Mic Button */}
            {!editingMessage && (
              <button
                type="button"
                onClick={startRecording}
                title={t.sendVoiceTooltip || "Записать голосовое сообщение"}
                className="p-2 sm:p-2.5 rounded-xl bg-zinc-900 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-zinc-700 hover:border-amber-500/60 transition flex items-center justify-center shrink-0 cursor-pointer shadow-sm active:scale-95"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}

            {/* Send Text Button */}
            <button
              type="submit"
              disabled={!text.trim()}
              className={`p-2 sm:p-2.5 rounded-xl font-bold transition flex items-center justify-center shrink-0 ${
                text.trim()
                  ? editingMessage
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-md shadow-cyan-500/30 cursor-pointer'
                    : !isAlive
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 cursor-pointer'
                    : 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 cursor-pointer'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
            >
              {editingMessage ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
