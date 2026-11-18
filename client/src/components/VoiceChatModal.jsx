import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, X, Users, GripHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { translations, getLocalized } from '../utils/translations';
import CharacterAvatar from './CharacterAvatar';

export default function VoiceChatModal({
  isOpen,
  onClose,
  voiceManager,
  isConnected,
  isMuted,
  isSpeaking,
  isLoud = false,
  peers = [],
  myPlayerId,
  players = [],
  lang = 'ru',
  onToggleVoice,
  onToggleMute
}) {
  const [mutedPeers, setMutedPeers] = useState(new Set());
  const [position, setPosition] = useState({ x: null, y: null });
  const [isMinimized, setIsMinimized] = useState(false);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 });
  const windowRef = useRef(null);

  const t = translations[lang] || translations.ru;

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!dragRef.current.isDragging) return;
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      const newX = Math.max(10, Math.min(window.innerWidth - 320, dragRef.current.initialLeft + deltaX));
      const newY = Math.max(10, Math.min(window.innerHeight - 100, dragRef.current.initialTop + deltaY));

      setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      dragRef.current.isDragging = false;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  if (!isOpen) return null;

  const handlePointerDown = (e) => {
    if (e.target.closest('button')) return; // don't drag when clicking buttons
    const node = windowRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left,
      initialTop: rect.top
    };
  };

  const togglePeerMute = (socketId) => {
    soundManager.playBeep(650, 0.04);
    const next = new Set(mutedPeers);
    if (next.has(socketId)) {
      next.delete(socketId);
      voiceManager?.setPeerVolume(socketId, 1.0);
    } else {
      next.add(socketId);
      voiceManager?.setPeerVolume(socketId, 0.0);
    }
    setMutedPeers(next);
  };

  const totalInVoice = (isConnected ? 1 : 0) + peers.length;
  const myPlayerObj = players.find(p => p.id === myPlayerId);

  return (
    <div 
      ref={windowRef}
      style={{
        left: position.x !== null ? `${position.x}px` : (typeof window !== 'undefined' && window.innerWidth < 640 ? '4vw' : undefined),
        top: position.y !== null ? `${position.y}px` : (typeof window !== 'undefined' && window.innerWidth < 640 ? '60px' : undefined),
        right: position.x === null && (typeof window === 'undefined' || window.innerWidth >= 640) ? '16px' : undefined,
        bottom: position.y === null && (typeof window === 'undefined' || window.innerWidth >= 640) ? '80px' : undefined,
        touchAction: 'none'
      }}
      className="fixed z-50 w-[92vw] sm:w-[380px] rounded-3xl bg-zinc-950/95 border-2 border-emerald-500/50 shadow-[0_15px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl overflow-hidden flex flex-col transition-shadow animate-fadeIn select-none"
    >
      {/* Draggable Header */}
      <div 
        onPointerDown={handlePointerDown}
        className="p-3 sm:p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80 cursor-grab active:cursor-grabbing hover:bg-zinc-850 transition"
        title={lang === 'uz' ? "Oynani siljitish uchun tutib torting" : lang === 'en' ? "Drag to move window" : "Зажмите и перетащите окно"}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <GripHorizontal className="w-4 h-4 text-zinc-500 shrink-0" />
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            isConnected 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
          }`}>
            <Mic className={`w-4 h-4 ${isConnected && isSpeaking ? (isLoud ? 'animate-mic-loud text-amber-400' : 'animate-mic-calm text-emerald-400') : isConnected ? 'text-emerald-400' : ''}`} />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-extrabold text-sm text-white flex items-center gap-1.5 truncate">
              <span>{lang === 'uz' ? 'Ovozli chat' : lang === 'en' ? 'Voice Chat' : 'Голосовой чат'}</span>
              {isConnected && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              )}
            </h3>
            <p className="text-[10px] font-mono text-zinc-400 flex items-center gap-1 truncate">
              <Users className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>
                {isConnected 
                  ? `${totalInVoice} ${lang === 'uz' ? 'kishi efirda' : lang === 'en' ? 'online' : 'в эфире'}`
                  : (lang === 'uz' ? 'Ulanmagan' : lang === 'en' ? 'Disconnected' : 'Не подключен')}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            title={isMinimized 
              ? (lang === 'uz' ? "Kattalashtirish" : lang === 'en' ? "Expand" : "Развернуть") 
              : (lang === 'uz' ? "Kichraytirish" : lang === 'en' ? "Minimize" : "Свернуть")}
          >
            {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              soundManager.playBeep(600, 0.04);
              onClose();
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition cursor-pointer"
            title={lang === 'uz' ? "Yopish" : lang === 'en' ? "Close" : "Закрыть окно"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Central Microphone Control */}
          <div className="p-4 sm:p-5 flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900/40 to-zinc-950">
            {!isConnected ? (
              <button
                onClick={() => {
                  soundManager.playBeep(850, 0.06);
                  onToggleVoice();
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-display font-extrabold text-sm tracking-wide shadow-xl shadow-emerald-500/25 active:scale-98 transition flex items-center justify-center gap-2.5 cursor-pointer animate-pulse"
              >
                <Mic className="w-5 h-5" />
                <span>{t.voiceConnect || (lang === 'uz' ? 'Audiochatga ulanish' : lang === 'en' ? 'Connect to Audio Chat' : 'Подключиться к аудиочату')}</span>
              </button>
            ) : (
              <div className="flex flex-col items-center w-full">
                {/* Circular Pulsing Big Mic with Speaking Animation (Normal vs Loud) */}
                <div className="relative flex items-center justify-center my-2">
                  {/* Outer Ripple Rings when speaking */}
                  {isSpeaking && (
                    <>
                      <span className={`absolute rounded-full animate-ping ${
                        isLoud 
                          ? 'w-44 h-44 bg-orange-500/30 [animation-duration:0.6s]' 
                          : 'w-36 h-36 bg-emerald-500/15 [animation-duration:1.5s]'
                      }`} />
                      <span className={`absolute rounded-full animate-pulse ${
                        isLoud 
                          ? 'w-36 h-36 bg-amber-500/40' 
                          : 'w-28 h-28 bg-emerald-500/20'
                      }`} />
                    </>
                  )}

                  {/* Animated Equalizer Waves on sides when speaking */}
                  {isSpeaking && (
                    <div className="absolute -left-10 flex items-center gap-1 h-8">
                      <span className={`w-1 rounded-full ${isLoud ? 'bg-amber-400 animate-wave-loud-1' : 'bg-emerald-400 animate-wave-calm-1'}`} />
                      <span className={`w-1 rounded-full ${isLoud ? 'bg-orange-400 animate-wave-loud-2' : 'bg-emerald-400 animate-wave-calm-2'}`} />
                      <span className={`w-1 rounded-full ${isLoud ? 'bg-amber-300 animate-wave-loud-3' : 'bg-emerald-400 animate-wave-calm-3'}`} />
                    </div>
                  )}
                  {isSpeaking && (
                    <div className="absolute -right-10 flex items-center gap-1 h-8">
                      <span className={`w-1 rounded-full ${isLoud ? 'bg-amber-300 animate-wave-loud-3' : 'bg-emerald-400 animate-wave-calm-3'}`} />
                      <span className={`w-1 rounded-full ${isLoud ? 'bg-orange-400 animate-wave-loud-2' : 'bg-emerald-400 animate-wave-calm-2'}`} />
                      <span className={`w-1 rounded-full ${isLoud ? 'bg-amber-400 animate-wave-loud-1' : 'bg-emerald-400 animate-wave-calm-1'}`} />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playBeep(isMuted ? 880 : 500, 0.05);
                      onToggleMute();
                    }}
                    className={`w-20 h-20 rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer shadow-2xl relative z-10 ${
                      isMuted
                        ? 'bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/60 text-red-400 shadow-red-500/20 scale-100'
                        : isSpeaking
                        ? isLoud
                          ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-black border-4 border-amber-300 shadow-[0_0_50px_rgba(245,158,11,0.9)] scale-110'
                          : 'bg-emerald-500 text-black border-4 border-emerald-300 shadow-[0_0_35px_rgba(16,185,129,0.7)] scale-105'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-2 border-emerald-500/60 text-emerald-400 shadow-emerald-500/20 hover:scale-105'
                    }`}
                  >
                    {isMuted ? (
                      <MicOff className="w-8 h-8" />
                    ) : (
                      <Mic className={`w-8 h-8 ${isSpeaking ? (isLoud ? 'animate-mic-loud' : 'animate-mic-calm') : ''}`} />
                    )}
                  </button>
                </div>

                {/* Status Text under Mic */}
                <div className="mt-2 text-center">
                  <div className={`font-display font-extrabold text-xs sm:text-sm ${
                    isSpeaking 
                      ? isLoud 
                        ? 'text-amber-400 animate-bounce' 
                        : 'text-emerald-400 animate-pulse' 
                      : isMuted 
                      ? 'text-red-400' 
                      : 'text-emerald-400'
                  }`}>
                    {isSpeaking 
                      ? isLoud
                        ? (lang === 'uz' ? '🔥 Baland ovozda gapiryapsiz!' : lang === 'en' ? '🔥 Speaking loud!' : '🔥 Громкий голос!')
                        : (lang === 'uz' ? 'Siz gapiryapsiz...' : lang === 'en' ? 'You are speaking...' : 'Вы говорите...') 
                      : isMuted 
                      ? (lang === 'uz' ? 'Mikrofon o\'chiq (yoqish uchun bosing)' : lang === 'en' ? 'Muted (tap to unmute)' : 'Микрофон выключен (нажмите для включения)')
                      : (lang === 'uz' ? 'Mikrofon yoniq (efirdasiz)' : lang === 'en' ? 'Microphone on (broadcasting)' : 'Микрофон включен (в эфире)')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Participants List */}
          <div className="p-3 border-t border-zinc-800 space-y-1.5 max-h-[180px] overflow-y-auto custom-scrollbar">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center justify-between px-1">
              <span>{lang === 'uz' ? 'Xonadagi o\'yinchilar' : lang === 'en' ? 'Participants' : 'Участники в чате'}</span>
              <span className="text-emerald-400 font-bold">{totalInVoice}</span>
            </div>

            {/* Myself */}
            {isConnected && (
              <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <CharacterAvatar 
                    character={myPlayerObj?.character} 
                    isAlive={true} 
                    isSpeaking={isSpeaking}
                    size="sm" 
                    lang={lang} 
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-white truncate flex items-center gap-1">
                      <span>{myPlayerObj?.name || (lang === 'uz' ? 'Siz' : lang === 'en' ? 'You' : 'Вы')}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 font-mono">
                        {lang === 'uz' ? 'SIZ' : lang === 'en' ? 'YOU' : 'ВЫ'}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                      {isSpeaking ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span>{lang === 'uz' ? 'Gapirmoqda...' : lang === 'en' ? 'Speaking...' : 'Говорит...'}</span>
                        </span>
                      ) : isMuted ? (
                        <span className="text-red-400">{lang === 'uz' ? 'O\'chiq' : lang === 'en' ? 'Muted' : 'Микрофон выключен'}</span>
                      ) : (
                        <span className="text-emerald-500">{lang === 'uz' ? 'Tayyor' : lang === 'en' ? 'Ready' : 'Готов'}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-1.5 rounded-xl bg-zinc-800 text-zinc-300">
                  {isMuted ? (
                    <MicOff className="w-4 h-4 text-red-400" />
                  ) : (
                    <Mic className={`w-4 h-4 ${isSpeaking ? (isLoud ? 'text-amber-400 animate-mic-loud' : 'text-emerald-400 animate-mic-calm') : 'text-emerald-400'}`} />
                  )}
                </div>
              </div>
            )}

            {/* Other Connected Peers */}
            {peers.map((peer) => {
              const isPeerMuted = mutedPeers.has(peer.socketId);
              const peerPlayerObj = players.find(p => p.id === peer.playerId);

              return (
                <div
                  key={peer.socketId}
                  className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CharacterAvatar 
                      character={peerPlayerObj?.character} 
                      isAlive={true} 
                      isSpeaking={peer.isSpeaking}
                      size="sm" 
                      lang={lang} 
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-zinc-200 truncate">
                        {peer.playerName}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                        {peer.isSpeaking ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            <span>{lang === 'uz' ? 'Gapirmoqda...' : lang === 'en' ? 'Speaking...' : 'Говорит...'}</span>
                          </span>
                        ) : peer.isMuted ? (
                          <span className="text-red-400">{lang === 'uz' ? 'Mikrofon o\'chiq' : lang === 'en' ? 'Muted' : 'Заглушен'}</span>
                        ) : (
                          <span className="text-emerald-500">{lang === 'uz' ? 'Efirda' : lang === 'en' ? 'Online' : 'В эфире'}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {peer.isSpeaking && (
                      <Mic className={`w-4 h-4 mr-1 ${peer.isLoud ? 'text-amber-400 animate-mic-loud' : 'text-emerald-400 animate-mic-calm'}`} />
                    )}
                    <button
                      onClick={() => togglePeerMute(peer.socketId)}
                      className={`p-1.5 rounded-xl border transition cursor-pointer ${
                        isPeerMuted
                          ? 'bg-red-950/60 border-red-800 text-red-400 hover:bg-red-900'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700'
                      }`}
                      title={isPeerMuted 
                        ? (lang === 'uz' ? "O'yinchining ovozini yoqish" : lang === 'en' ? "Unmute player" : "Включить звук игрока") 
                        : (lang === 'uz' ? "O'yinchi ovozini o'zim uchun o'chirish" : lang === 'en' ? "Mute player for me" : "Заглушить этого игрока для себя")}
                    >
                      {isPeerMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}

            {peers.length === 0 && isConnected && (
              <div className="text-center py-2 text-xs font-mono text-zinc-500">
                {lang === 'uz' ? 'Hozircha efirda faqat sizsiz.' : lang === 'en' ? 'You are currently alone in audio chat.' : 'Вы пока один в голосовом чате.'}
              </div>
            )}
          </div>

          {/* Footer with Leave button */}
          {isConnected && (
            <div className="p-2.5 border-t border-zinc-800 bg-zinc-900/40">
              <button
                onClick={() => {
                  soundManager.playBeep(450, 0.05);
                  onToggleVoice();
                }}
                className="w-full py-2 px-3 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800/80 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <PhoneOff className="w-3.5 h-3.5 text-red-400" />
                <span>{t.voiceDisconnect || (lang === 'uz' ? 'Audiochatdan chiqish' : lang === 'en' ? 'Leave Audio Chat' : 'Покинуть аудиочат')}</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
