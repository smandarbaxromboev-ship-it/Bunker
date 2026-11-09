import React, { useState } from 'react';
import { Vote, Skull, CheckCircle, Ghost, ArrowLeft, X, MessageSquare } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { translations } from '../utils/translations';
import GhostVisionHUD from './GhostVisionHUD';

export default function VotingModal({ 
  roomState, 
  myPlayerId, 
  onCastVote, 
  onClose,
  onLeaveRoom,
  lang = 'ru' 
}) {
  const [selectedTargetId, setSelectedTargetId] = useState(null);
  const t = translations[lang] || translations.ru;
  const myPlayer = roomState?.players?.find(p => p.id === myPlayerId);
  const isAlive = myPlayer?.isAlive;
  const hasVoted = myPlayer?.hasVoted;
  const ghostVotes = roomState?.ghostVotes;

  const eligibleTargets = (roomState?.players || []).filter(
    p => p.isAlive && p.id !== myPlayerId
  );

  const alivePlayers = (roomState?.players || []).filter(p => p.isAlive);
  const votedCount = alivePlayers.filter(p => p.hasVoted).length;

  const handleVoteSubmit = () => {
    if (!selectedTargetId) return;
    soundManager.playVoteCast();
    onCastVote(selectedTargetId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-950 border-2 border-red-600/70 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-[0_0_50px_rgba(239,68,68,0.25)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Control Bar: Back Button & Minimize Button */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            {onLeaveRoom && (
              <button
                onClick={() => {
                  soundManager.playBeep(600, 0.05);
                  if (!isAlive) {
                    onLeaveRoom();
                  } else if (window.confirm(lang === 'uz' ? 'Bunkerdan chiqishni xohlaysizmi?' : lang === 'en' ? 'Leave bunker and return to menu?' : 'Вы действительно хотите выйти из бункера в главное меню?')) {
                    onLeaveRoom();
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-red-950/60 text-zinc-300 hover:text-red-400 border border-zinc-800 text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.btnLeaveGame || t.btnBack}</span>
              </button>
            )}

            {!isAlive && (
              <span className="text-[11px] font-mono text-purple-400 flex items-center gap-1">
                <span>👻</span>
                <span className="hidden sm:inline">{t.ghostObservationBadge || (lang === 'uz' ? 'Arvoh' : lang === 'en' ? 'Ghost' : 'Призрак')}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
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

        {/* Header */}
        <div className="border-b border-zinc-800 pb-3 mb-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-red-500 font-bold flex items-center gap-1.5 font-mono">
              <Skull className="w-4 h-4 text-red-500" />
              {t.stageVoting}: {t.round} {roomState?.currentRound}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
              {t.votesRecorded} {votedCount} / {alivePlayers.length}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-display font-bold text-white mt-1">
            {t.whoExileTitle}
          </h2>
          <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
            {lang === 'uz' ? "O'z vaqtingizda ovoz bering yoki oynani yashirib chatda gaplashing" : lang === 'en' ? "Vote at your own pace or minimize to chat and inspect cards" : "Голосуйте в любой момент или сверните окно, чтобы писать аргументы в чат"}
          </p>
        </div>

        {/* 👻 GHOST VISION HUD FOR ELIMINATED PLAYERS */}
        {!isAlive && (
          <GhostVisionHUD ghostVotes={ghostVotes} lang={lang} />
        )}

        {/* Voting options */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          {!isAlive ? (
            <div className="py-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-purple-950/60 border border-purple-700 text-purple-400 mx-auto flex items-center justify-center">
                <Ghost className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-purple-300">
                {t.ghostMutedNotice}
              </div>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                {t.ghostMutedDesc}
              </p>
            </div>
          ) : hasVoted ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center animate-pulse">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div className="text-base font-bold text-emerald-400 font-display">
                {t.yourVoteRecorded}
              </div>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                {t.waitingOtherVotes}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {eligibleTargets.map((target) => {
                const isSelected = selectedTargetId === target.id;
                const revealedCount = (target.deck || []).filter(c => c.revealed).length;

                return (
                  <div
                    key={target.id}
                    onClick={() => {
                      soundManager.playBeep(600, 0.05);
                      setSelectedTargetId(target.id);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-red-950/40 border-red-500 shadow-md ring-1 ring-red-500'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        {target.isHost ? '★' : '№'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">
                          {target.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          {typeof t.cardsRevealedCount === 'function' ? t.cardsRevealedCount(revealedCount) : `Открыто карт: ${revealedCount} из 7`}
                        </div>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-red-500 bg-red-600' : 'border-zinc-700 bg-zinc-800'
                    }`}>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Submit */}
        {isAlive && !hasVoted && (
          <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between gap-2 shrink-0">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-mono font-bold transition cursor-pointer"
              >
                {t.btnCancel || 'Свернуть'}
              </button>
            )}

            <button
              onClick={handleVoteSubmit}
              disabled={!selectedTargetId}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-display font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition ${
                selectedTargetId
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 cursor-pointer animate-pulse'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <Vote className="w-4 h-4" />
              {t.btnVote}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
