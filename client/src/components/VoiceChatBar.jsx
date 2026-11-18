import React, { useState } from 'react';
import { Mic, MicOff, Radio, Volume2, VolumeX, ChevronUp, ChevronDown, Users, PhoneOff } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { translations, getLocalized } from '../utils/translations';

export default function VoiceChatBar({
  voiceManager,
  isConnected,
  isMuted,
  isSpeaking,
  peers = [],
  myPlayerId,
  lang = 'ru',
  onToggleVoice,
  onToggleMute,
  onOpenModal
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mutedPeers, setMutedPeers] = useState(new Set());
  const t = translations[lang] || translations.ru;

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

  const totalConnected = (isConnected ? 1 : 0) + peers.length;

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-sm font-sans select-none animate-fadeIn">
      <div className="bg-slate-900/95 dark:bg-zinc-950/95 border border-slate-700/80 dark:border-zinc-800 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
        {/* Main Bar */}
        <div className="p-2 sm:p-2.5 flex items-center gap-2">
          {/* Radio Status / Join Button */}
          {!isConnected ? (
            <button
              onClick={() => {
                soundManager.playBeep(800, 0.05);
                onToggleVoice();
              }}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 active:scale-98 transition cursor-pointer"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>{t.voiceConnect || (lang === 'uz' ? "Ratsiyaga ulanish" : lang === 'en' ? "Join Voice" : "Включить рацию")}</span>
            </button>
          ) : (
            <>
              {/* Mic Toggle Button */}
              <button
                onClick={() => {
                  soundManager.playBeep(isMuted ? 850 : 500, 0.05);
                  onToggleMute();
                }}
                className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md ${
                  isMuted
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40'
                    : isSpeaking
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/40 animate-pulse border border-emerald-400'
                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40'
                }`}
                title={isMuted ? (t.voiceMicOff || "Микрофон выключен") : (t.voiceMicOn || "Микрофон включен")}
              >
                {isMuted ? (
                  <MicOff className="w-4 h-4 text-red-400" />
                ) : (
                  <Mic className={`w-4 h-4 ${isSpeaking ? 'animate-bounce' : ''}`} />
                )}
              </button>

              {/* Status Info (clickable to open full Telegram Voice Chat modal) */}
              <div 
                onClick={onOpenModal}
                className="flex-1 min-w-0 pr-1 cursor-pointer hover:opacity-90 transition"
                title="Нажмите, чтобы открыть окно голосового чата (Telegram)"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="truncate">{lang === 'uz' ? 'Ovozli chat' : lang === 'en' ? 'Voice Chat' : 'Голосовой чат'}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 flex items-center gap-1 mt-0.5">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>
                    {totalConnected} {t.voiceOnlineCount || (lang === 'uz' ? "efirda" : lang === 'en' ? "online" : "в эфире")}
                  </span>
                  {isSpeaking && (
                    <span className="text-emerald-400 font-bold ml-1 animate-pulse">
                      • {t.voiceSpeaking || "Говорите..."}
                    </span>
                  )}
                </div>
              </div>

              {/* Expand / Collapse Participants Button */}
              {peers.length > 0 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="Список участников"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              )}

              {/* Leave Voice Button */}
              <button
                onClick={() => {
                  soundManager.playBeep(450, 0.05);
                  onToggleVoice();
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/70 text-slate-400 hover:text-red-400 border border-slate-700/60 hover:border-red-800 transition cursor-pointer"
                title={t.voiceDisconnect || "Отключить рацию"}
              >
                <PhoneOff className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Expanded Participants Drawer */}
        {isConnected && isExpanded && peers.length > 0 && (
          <div className="border-t border-slate-800 p-2 space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-1">
              {t.voiceOnlineCount || "Участники в эфире"}:
            </div>
            {peers.map((peer) => {
              const isPeerMuted = mutedPeers.has(peer.socketId);
              return (
                <div
                  key={peer.socketId}
                  className="flex items-center justify-between p-1.5 rounded-xl bg-slate-800/60 border border-slate-700/40 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        peer.isSpeaking
                          ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)] animate-ping'
                          : peer.isMuted
                          ? 'bg-red-500/80'
                          : 'bg-emerald-600/70'
                      }`}
                    />
                    <span className="font-medium text-slate-200 truncate max-w-[120px]">
                      {peer.playerName}
                    </span>
                    {peer.isSpeaking && (
                      <span className="text-[9px] text-emerald-400 font-mono animate-pulse">
                        🎙️
                      </span>
                    )}
                  </div>

                  {/* Individual Mute Toggle */}
                  <button
                    onClick={() => togglePeerMute(peer.socketId)}
                    className={`p-1 rounded-lg transition cursor-pointer ${
                      isPeerMuted
                        ? 'text-red-400 bg-red-950/60 hover:bg-red-900/60'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                    title={isPeerMuted ? "Включить звук" : "Заглушить для себя"}
                  >
                    {isPeerMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
