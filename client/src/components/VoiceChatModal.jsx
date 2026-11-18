import React, { useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, X, Users, Radio, Sparkles } from 'lucide-react';
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
  peers = [],
  myPlayerId,
  players = [],
  lang = 'ru',
  onToggleVoice,
  onToggleMute
}) {
  const [mutedPeers, setMutedPeers] = useState(new Set());
  const t = translations[lang] || translations.ru;

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div 
        className="w-full max-w-md rounded-3xl bg-zinc-950/95 border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col transition-all duration-300"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isConnected 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}>
              <Mic className={`w-5 h-5 ${isConnected && isSpeaking ? 'animate-mic-dance text-emerald-400' : isConnected ? 'text-emerald-400' : ''}`} />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-white flex items-center gap-2">
                <span>{lang === 'uz' ? 'Ovozli chat' : lang === 'en' ? 'Voice Chat' : 'Голосовой чат'}</span>
                {isConnected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </h3>
              <p className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {isConnected 
                    ? `${totalInVoice} ${lang === 'uz' ? 'kishi efirda' : lang === 'en' ? 'participants online' : 'участников в эфире'}`
                    : (lang === 'uz' ? 'Ulanmagan' : lang === 'en' ? 'Disconnected' : 'Не подключен')}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playBeep(600, 0.04);
              onClose();
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            title={lang === 'uz' ? "Yopish" : lang === 'en' ? "Close" : "Свернуть"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Central Microphone Control */}
        <div className="p-6 flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900/40 to-zinc-950">
          {!isConnected ? (
            <button
              onClick={() => {
                soundManager.playBeep(850, 0.06);
                onToggleVoice();
              }}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-display font-extrabold text-sm tracking-wide shadow-xl shadow-emerald-500/25 active:scale-98 transition flex items-center gap-2.5 cursor-pointer animate-pulse"
            >
              <Mic className="w-5 h-5" />
              <span>{t.voiceConnect || (lang === 'uz' ? 'Audiochatga ulanish' : lang === 'en' ? 'Connect to Audio Chat' : 'Подключиться к аудиочату')}</span>
            </button>
          ) : (
            <div className="flex flex-col items-center">
              {/* Circular Pulsing Big Mic with Speaking Animation */}
              <div className="relative flex items-center justify-center my-3">
                {/* Outer Ripple Rings when speaking */}
                {isSpeaking && (
                  <>
                    <span className="absolute w-40 h-40 rounded-full bg-emerald-500/15 animate-ping [animation-duration:1.2s]" />
                    <span className="absolute w-32 h-32 rounded-full bg-emerald-500/25 animate-pulse" />
                  </>
                )}

                {/* Animated Equalizer Waves on sides when speaking */}
                {isSpeaking && (
                  <div className="absolute -left-12 flex items-center gap-1 h-8">
                    <span className="w-1 bg-emerald-400 rounded-full animate-wave-1" />
                    <span className="w-1 bg-emerald-400 rounded-full animate-wave-2" />
                    <span className="w-1 bg-emerald-400 rounded-full animate-wave-3" />
                  </div>
                )}
                {isSpeaking && (
                  <div className="absolute -right-12 flex items-center gap-1 h-8">
                    <span className="w-1 bg-emerald-400 rounded-full animate-wave-3" />
                    <span className="w-1 bg-emerald-400 rounded-full animate-wave-2" />
                    <span className="w-1 bg-emerald-400 rounded-full animate-wave-4" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playBeep(isMuted ? 880 : 500, 0.05);
                    onToggleMute();
                  }}
                  className={`w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer shadow-2xl relative z-10 ${
                    isMuted
                      ? 'bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/60 text-red-400 shadow-red-500/20 scale-100'
                      : isSpeaking
                      ? 'bg-emerald-500 text-black border-4 border-emerald-300 shadow-[0_0_40px_rgba(16,185,129,0.7)] scale-105'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-2 border-emerald-500/60 text-emerald-400 shadow-emerald-500/20 hover:scale-105'
                  }`}
                >
                  {isMuted ? (
                    <MicOff className="w-9 h-9" />
                  ) : (
                    <Mic className={`w-9 h-9 ${isSpeaking ? 'animate-mic-dance' : ''}`} />
                  )}
                </button>
              </div>

              {/* Status Text under Mic */}
              <div className="mt-3 text-center">
                <div className={`font-display font-extrabold text-sm ${
                  isSpeaking ? 'text-emerald-400 animate-pulse' : isMuted ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {isSpeaking 
                    ? (lang === 'uz' ? 'Siz gapiryapsiz...' : lang === 'en' ? 'You are speaking...' : 'Вы говорите...') 
                    : isMuted 
                    ? (lang === 'uz' ? 'Mikrofon o\'chiq (yoqish uchun bosing)' : lang === 'en' ? 'Muted (tap to unmute)' : 'Микрофон выключен (нажмите, чтобы включить)')
                    : (lang === 'uz' ? 'Mikrofon yoniq (efirdasiz)' : lang === 'en' ? 'Microphone on (broadcasting)' : 'Микрофон включен (в эфире)')}
                </div>
                <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                  {lang === 'uz' ? 'Barcha tirik o\'yinchilar sizni eshitmoqda' : lang === 'en' ? 'All alive survivors can hear you' : 'Вас слышат все участники бункера'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Participants List */}
        <div className="flex-1 overflow-y-auto p-4 border-t border-zinc-800/80 space-y-2 min-h-[160px] max-h-[260px] custom-scrollbar">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center justify-between px-1">
            <span>{lang === 'uz' ? 'Xonadagi o\'yinchilar' : lang === 'en' ? 'Voice Participants' : 'Участники в голосовом чате'}</span>
            <span className="text-emerald-400 font-bold">{totalInVoice}</span>
          </div>

          {/* Myself */}
          {isConnected && (
            <div className="p-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  <CharacterAvatar 
                    character={myPlayerObj?.character} 
                    isAlive={true} 
                    isSpeaking={isSpeaking}
                    size="sm" 
                    lang={lang} 
                  />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-white truncate flex items-center gap-1.5">
                    <span>{myPlayerObj?.name || 'Вы'}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 font-mono">
                      {lang === 'uz' ? 'SIZ' : lang === 'en' ? 'YOU' : 'ВЫ'}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1 mt-0.5">
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
                  <Mic className={`w-4 h-4 text-emerald-400 ${isSpeaking ? 'animate-mic-dance' : ''}`} />
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
                className="p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between hover:border-zinc-700 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
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
                    <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1 mt-0.5">
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
                    <Mic className="w-4 h-4 text-emerald-400 animate-mic-dance mr-1" />
                  )}
                  <button
                    onClick={() => togglePeerMute(peer.socketId)}
                    className={`p-1.5 rounded-xl border transition cursor-pointer ${
                      isPeerMuted
                        ? 'bg-red-950/60 border-red-800 text-red-400 hover:bg-red-900'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700'
                    }`}
                    title={isPeerMuted ? "Включить звук игрока" : "Заглушить этого игрока для себя"}
                  >
                    {isPeerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}

          {peers.length === 0 && isConnected && (
            <div className="text-center py-4 text-xs font-mono text-zinc-500">
              {lang === 'uz' ? 'Hozircha efirda faqat sizsiz. Boshqalar ham mikrofonni yoqishi mumkin!' : lang === 'en' ? 'You are currently alone in audio chat. Others can join anytime!' : 'Вы пока один в голосовом чате. Другие игроки могут подключиться в любой момент!'}
            </div>
          )}
        </div>

        {/* Footer with Leave button */}
        {isConnected && (
          <div className="p-3 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
            <button
              onClick={() => {
                soundManager.playBeep(450, 0.05);
                onToggleVoice();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800/80 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <PhoneOff className="w-4 h-4 text-red-400" />
              <span>{t.voiceDisconnect || (lang === 'uz' ? 'Audiochatdan chiqish' : lang === 'en' ? 'Leave Audio Chat' : 'Покинуть аудиочат')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
