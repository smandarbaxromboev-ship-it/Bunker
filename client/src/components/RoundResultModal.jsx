import React, { useEffect } from 'react';
import { Skull, ArrowRight, ShieldCheck, UserX, Trophy, Clock, ArrowLeft, X, MessageSquare } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { translations, getLocalized } from '../utils/translations';
import CharacterAvatar from './CharacterAvatar';

export default function RoundResultModal({ 
  roomState, 
  myPlayerId, 
  onNextRound, 
  onClose,
  onLeaveRoom,
  lang = 'ru' 
}) {
  const t = translations[lang] || translations.ru;
  const isHost = roomState?.hostId === myPlayerId;
  const results = roomState?.votingResults;
  const exiled = results?.exiledPlayer;
  const isExtraTimeElimination = Boolean(results?.isExtraTime);
  const capacity = roomState?.bunkerCapacity || 2;
  const remainingAlive = (roomState?.players || []).filter(p => p.isAlive).length;
  const willEndNow = remainingAlive <= capacity || roomState?.currentRound >= 7;

  const myPlayer = (roomState?.players || []).find(p => p.id === myPlayerId);
  const isAlive = myPlayer ? myPlayer.isAlive : true;

  // Find exiled player's object to get avatar details if needed
  const exiledPlayerObj = exiled 
    ? (roomState?.players || []).find(p => p.id === exiled.id) || exiled
    : null;

  useEffect(() => {
    if (exiled) {
      soundManager.playAlarm();
    } else {
      soundManager.playBeep(880, 0.15);
    }
  }, [exiled]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-950 border-2 border-red-600 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-[0_0_60px_rgba(239,68,68,0.4)] flex flex-col text-center relative overflow-hidden max-h-[92vh]">
        {/* Top Control Bar: Back Button & Minimize Button */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-850 shrink-0">
          <div>
            {onLeaveRoom && isAlive && (
              <button
                onClick={() => {
                  soundManager.playBeep(600, 0.05);
                  if (window.confirm(lang === 'uz' ? 'Bunkerdan chiqishni xohlaysizmi?' : lang === 'en' ? 'Leave bunker and return to menu?' : 'Вы действительно хотите выйти из бункера в главное меню?')) {
                    onLeaveRoom();
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-red-950/60 text-zinc-300 hover:text-red-400 border border-zinc-800 text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.btnBack}</span>
              </button>
            )}

            {!isAlive && (
              <span className="text-[11px] font-mono text-purple-400 flex items-center gap-1">
                <span>👻</span>
                <span>{t.ghostLockedNotice ? 'Призрак (наблюдение)' : 'Призрак'}</span>
              </span>
            )}
          </div>

          <div>
            {onClose && (
              <button
                onClick={() => {
                  soundManager.playBeep(700, 0.05);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                title={t.btnMinimizeVoting || "Свернуть окно и писать в чат"}
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.btnMinimizeVoting || "Свернуть / Чат"}</span>
                <X className="w-3.5 h-3.5 ml-0.5 text-zinc-400" />
              </button>
            )}
          </div>
        </div>

        {/* Ambient red hazard glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Round result badge */}
        <div className="flex items-center justify-center space-x-2 text-xs uppercase tracking-widest text-red-400 font-mono font-bold mb-1 shrink-0">
          <span>{t.stageResult} #{results?.round || roomState?.currentRound}</span>
          {isExtraTimeElimination && (
            <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/40 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>+5М ОВЕРТАЙМ</span>
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {exiled ? (
            <>
              {/* BIG RED BIOHAZARD ELIMINATION STAMP */}
              <div className="inline-block mx-auto mb-2 px-4 py-1.5 bg-red-600 text-white font-mono font-extrabold text-sm sm:text-base uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.7)] rotate-[-1deg] border border-red-400 animate-pulse">
                ⚠️ {t.exiledHugeStamp || 'ИЗГНАН ИЗ БУНКЕРА'} ⚠️
              </div>

              {/* Exiled Character Avatar & Details */}
              <div className="my-2 p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-red-950/60 to-zinc-950 border-2 border-red-600/70 shadow-inner flex flex-col items-center">
                <CharacterAvatar 
                  character={exiledPlayerObj?.character}
                  isAlive={false}
                  isExiled={true}
                  size="xl"
                  lang={lang}
                  showTitle={true}
                />

                <div className="text-xl sm:text-2xl font-black font-display text-red-400 mt-2 line-through decoration-red-600 decoration-4">
                  {exiled.name}
                </div>

                {exiled.votesReceived !== undefined && (
                  <div className="mt-1 text-xs font-mono text-zinc-400 bg-red-950/40 px-2.5 py-0.5 rounded-full border border-red-700/50">
                    {isExtraTimeElimination ? t.exiledByExtraTime : `${t.exiledByMajority} (${exiled.votesReceived})`}
                  </div>
                )}

                <p className="text-xs text-purple-300 mt-2 font-mono flex items-center space-x-1">
                  <span>👻</span>
                  <span>{t.exiledStatus}</span>
                </p>
              </div>
            </>
          ) : (
            <div className="my-4 p-5 rounded-2xl bg-emerald-950/30 border-2 border-emerald-600/60 text-emerald-300 text-sm font-mono flex flex-col items-center">
              <ShieldCheck className="w-12 h-12 text-emerald-400 mb-2" />
              <span className="font-bold">{t.nobodyExiledTitle}</span>
              <span className="text-xs text-emerald-400/80 mt-1">{t.tieVotesNotice}</span>
            </div>
          )}

          {/* Remaining info */}
          <div className="text-xs text-amber-400 font-mono bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800 mb-3 flex items-center justify-between">
            <span className="text-zinc-400">{t.remainingAliveInBunker}</span>
            <span className="font-bold text-sm text-emerald-400">
              {remainingAlive} / {capacity}
            </span>
          </div>
        </div>

        {/* Next Round Button */}
        <div className="pt-2 border-t border-zinc-850 shrink-0">
          {isHost ? (
            <button
              onClick={() => {
                soundManager.playBeep(900, 0.08);
                onNextRound();
              }}
              className="w-full py-3 rounded-xl font-display font-bold text-sm tracking-wide flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/30 transition cursor-pointer"
            >
              {willEndNow ? (
                <>
                  <Trophy className="w-5 h-5" />
                  <span>{t.btnDetermineWinners}</span>
                </>
              ) : (
                <>
                  <span>{t.btnNextRound} {roomState.currentRound + 1}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          ) : (
            <div className="text-xs text-zinc-400 font-mono py-2 bg-zinc-900/50 rounded-xl border border-zinc-800/60">
              {t.waitingHost}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
