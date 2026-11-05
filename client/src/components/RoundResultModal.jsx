import React, { useEffect } from 'react';
import { Skull, ArrowRight, ShieldCheck, UserX, Trophy } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { translations } from '../utils/translations';

export default function RoundResultModal({ roomState, myPlayerId, onNextRound, lang = 'ru' }) {
  const t = translations[lang] || translations.ru;
  const isHost = roomState?.hostId === myPlayerId;
  const results = roomState?.votingResults;
  const exiled = results?.exiledPlayer;
  const voteCounts = results?.voteCounts || {};
  const remainingAlive = (roomState?.players || []).filter(p => p.isAlive).length;
  const willEndNow = remainingAlive <= 2 || roomState?.currentRound >= 7;

  useEffect(() => {
    if (exiled) {
      soundManager.playAlarm();
    } else {
      soundManager.playBeep(880, 0.15);
    }
  }, [exiled]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-950 border-2 border-red-600 rounded-3xl max-w-md w-full p-5 sm:p-7 shadow-[0_0_50px_rgba(239,68,68,0.3)] flex flex-col text-center">
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-600 text-red-500 mx-auto flex items-center justify-center mb-3 animate-bounce">
          {exiled ? <UserX className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7 text-emerald-400" />}
        </div>

        <div className="text-xs uppercase tracking-wider text-red-500 font-bold font-mono">
          {t.stageResult} #{results?.round || roomState?.currentRound}
        </div>

        <h2 className="text-xl sm:text-2xl font-display font-bold text-white mt-1">
          {exiled ? t.survivorExiledTitle : t.nobodyExiledTitle}
        </h2>

        {exiled ? (
          <div className="my-4 p-4 rounded-2xl bg-red-950/40 border border-red-800/60">
            <div className="text-xl font-bold font-display text-red-400">
              {exiled.name}
            </div>
            <div className="text-xs text-purple-300 mt-1 font-mono">
              {t.exiledStatus}
            </div>
          </div>
        ) : (
          <div className="my-4 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 text-xs">
            {t.tieVotesNotice}
          </div>
        )}

        {/* Remaining info */}
        <div className="text-xs text-amber-400 font-mono bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 mb-4">
          {t.remainingAliveInBunker} <strong>{remainingAlive}</strong> / {t.spotsLabel} <strong>2</strong>
        </div>

        {/* Next Button */}
        {isHost ? (
          <button
            onClick={() => {
              soundManager.playBeep(900, 0.08);
              onNextRound();
            }}
            className="w-full py-3 rounded-xl font-display font-bold text-sm tracking-wide flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            {willEndNow ? (
              <>
                <Trophy className="w-4 h-4" />
                <span>{t.btnDetermineWinners}</span>
              </>
            ) : (
              <>
                <span>{t.btnNextRound} {roomState.currentRound + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        ) : (
          <div className="text-xs text-zinc-400 font-mono">
            {t.waitingHost}
          </div>
        )}
      </div>
    </div>
  );
}
