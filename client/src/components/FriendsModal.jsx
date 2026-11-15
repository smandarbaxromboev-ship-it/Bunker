import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Copy, Check, Send, Trash2, X, Radio, LogIn, Sparkles, Hash } from 'lucide-react';
import { soundManager } from '../utils/audio';

export default function FriendsModal({
  user,
  socket,
  currentRoomCode,
  onJoinFriendRoom,
  onClose,
  onUserUpdated,
  lang = 'ru'
}) {
  const [friends, setFriends] = useState([]);
  const [myUserId, setMyUserId] = useState(user?.userId || '');
  const [targetIdInput, setTargetIdInput] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [invitedMap, setInvitedMap] = useState({});
  const [loading, setLoading] = useState(false);

  const loadFriends = () => {
    if (!user?.username) return;
    setLoading(true);
    socket.emit('getFriends', { username: user.username }, (res) => {
      setLoading(false);
      if (res && res.success) {
        if (res.userId) setMyUserId(res.userId);
        setFriends(res.friends || []);
      }
    });
  };

  useEffect(() => {
    loadFriends();

    const handleFriendsUpdated = (data) => {
      if (data && data.targetUsername && user?.username && data.targetUsername.toLowerCase() === user.username.toLowerCase()) {
        setFriends(data.friends || []);
        soundManager.playBeep(1100, 0.08);
      }
    };

    socket.on('friendsUpdated', handleFriendsUpdated);
    return () => {
      socket.off('friendsUpdated', handleFriendsUpdated);
    };
  }, [user?.username]);

  const handleCopyMyId = () => {
    if (!myUserId) return;
    navigator.clipboard.writeText(String(myUserId));
    setCopiedId(true);
    soundManager.playBeep(1000, 0.05);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleAddFriend = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setFeedback('');

    const query = targetIdInput.trim();
    if (!query) {
      setErrorMsg(
        lang === 'uz'
          ? 'Do\'stingizning ID raqamini yoki ismini kiriting!'
          : lang === 'en'
          ? 'Enter your friend\'s Player ID or username!'
          : 'Введите ID игрока (например: 482910) или его ник!'
      );
      return;
    }

    socket.emit('addFriend', { username: user?.username, targetQuery: query }, (res) => {
      if (res?.error) {
        soundManager.playBeep(400, 0.1);
        setErrorMsg(res.error);
        return;
      }
      soundManager.playBeep(1150, 0.1);
      setTargetIdInput('');
      setFriends(res.friends || []);
      if (res.user && onUserUpdated) {
        onUserUpdated(res.user);
      }
      const addedName = res.friend?.username || query;
      setFeedback(
        lang === 'uz'
          ? `✓ ${addedName} do'stlar ro'yxatiga qo'shildi!`
          : lang === 'en'
          ? `✓ ${addedName} added to your friends list!`
          : `✓ Игрок ${addedName} (ID: #${res.friend?.userId || ''}) добавлен в друзья!`
      );
      setTimeout(() => setFeedback(''), 4000);
    });
  };

  const handleRemoveFriend = (friendUsername) => {
    socket.emit('removeFriend', { username: user?.username, friendUsername }, (res) => {
      if (res && res.success) {
        setFriends(res.friends || []);
        if (res.user && onUserUpdated) onUserUpdated(res.user);
      }
    });
  };

  const handleInviteFriend = (friend) => {
    if (!currentRoomCode) {
      setErrorMsg(
        lang === 'uz'
          ? 'Avval xona yarating va keyin do\'stingizni chaqiring!'
          : lang === 'en'
          ? 'Create or join a room first to invite friends!'
          : 'Сначала создайте комнату, чтобы позвать в неё друга!'
      );
      return;
    }

    socket.emit(
      'inviteFriendToRoom',
      {
        fromUsername: user?.username,
        targetUsername: friend.username,
        targetUserId: friend.userId,
        roomCode: currentRoomCode
      },
      (res) => {
        if (res?.error) {
          setErrorMsg(res.error);
          return;
        }
        soundManager.playBeep(1200, 0.08);
        setInvitedMap((prev) => ({ ...prev, [friend.username]: true }));
        setFeedback(
          lang === 'uz'
            ? `📨 ${friend.username} ga #${currentRoomCode} xonasiga taklif yuborildi!`
            : lang === 'en'
            ? `📨 Invite to room #${currentRoomCode} sent to ${friend.username}!`
            : `📨 Приглашение в бункер #${currentRoomCode} отправлено игроку ${friend.username}!`
        );
        setTimeout(() => {
          setInvitedMap((prev) => ({ ...prev, [friend.username]: false }));
        }, 4000);
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-950 border-2 border-cyan-500/60 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[90vh] overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-display font-bold text-white tracking-wide">
                {lang === 'uz' ? "DO'STLAR VA ID ORQALI O'YIN" : lang === 'en' ? 'FRIENDS & PLAY BY ID' : 'ДРУЗЬЯ ПО ID И ПРИГЛАШЕНИЯ'}
              </h2>
              <p className="text-[11px] text-zinc-400 font-mono">
                {lang === 'uz'
                  ? "ID orqali do'st qo'shing va bir xonada o'ynang"
                  : lang === 'en'
                  ? 'Add friends by Player ID and invite them to your room'
                  : 'Добавляйте друзей по ID и зовите их в одну комнату'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* My Player ID Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-zinc-900 to-amber-950/40 border border-cyan-500/40 mb-4 flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-1">
              <Hash className="w-3 h-3" />
              <span>{lang === 'uz' ? 'SIZNING SHAXSIY ID RAQAMINGIZ:' : lang === 'en' ? 'YOUR PERSONAL PLAYER ID:' : 'ВАШ ЛИЧНЫЙ ID ИГРОКА:'}</span>
            </div>
            <div className="text-2xl sm:text-3xl font-display font-black text-amber-400 tracking-widest mt-0.5">
              #{myUserId || '------'}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono">
              {lang === 'uz' ? "Do'stingizga ushbu ID ni yuboring" : lang === 'en' ? 'Share this ID with your friends' : 'Отправьте этот ID другу, чтобы он добавил вас'}
            </div>
          </div>

          <button
            onClick={handleCopyMyId}
            className="px-3.5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-cyan-500/20 shrink-0"
          >
            {copiedId ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedId ? (lang === 'uz' ? 'Nusxalandi!' : lang === 'en' ? 'Copied!' : 'Скопировано!') : (lang === 'uz' ? 'ID nusxalash' : lang === 'en' ? 'Copy ID' : 'Копировать ID')}</span>
          </button>
        </div>

        {/* Add Friend by ID Form */}
        <form onSubmit={handleAddFriend} className="mb-4 shrink-0">
          <label className="text-[11px] font-mono font-bold text-zinc-300 uppercase block mb-1.5">
            {lang === 'uz' ? "DO'ST QO'SHISH (ID RAQAMI YOKI NIK):" : lang === 'en' ? 'ADD FRIEND BY PLAYER ID (OR NAME):' : 'ДОБАВИТЬ ДРУГА ПО ID ИГРОКА (ИЛИ НИКУ):'}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={targetIdInput}
              onChange={(e) => setTargetIdInput(e.target.value)}
              placeholder={lang === 'uz' ? 'Masalan: 482910 yoki ism...' : lang === 'en' ? 'e.g. 482910 or username...' : 'Введите ID друга (например: 482910)...'}
              className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 font-mono outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-display font-bold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              <span>{lang === 'uz' ? "Qo'shish" : lang === 'en' ? 'Add' : 'Добавить'}</span>
            </button>
          </div>
        </form>

        {/* Feedback / Error */}
        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-red-950/70 border border-red-600/60 text-red-300 text-xs font-mono shrink-0">
            ⚠️ {errorMsg}
          </div>
        )}
        {feedback && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 text-xs font-mono shrink-0">
            {feedback}
          </div>
        )}

        {/* Friends List */}
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2 shrink-0">
          <span>
            {lang === 'uz' ? `DO'STLAR RO'YXATI (${friends.length}):` : lang === 'en' ? `YOUR FRIENDS (${friends.length}):` : `ВАШИ ДРУЗЬЯ (${friends.length}):`}
          </span>
          <button
            type="button"
            onClick={loadFriends}
            className="text-cyan-400 hover:underline text-[11px] cursor-pointer"
          >
            {loading ? '...' : (lang === 'uz' ? '↻ Yangilash' : lang === 'en' ? '↻ Refresh' : '↻ Обновить статус')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {friends.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 text-zinc-400 font-mono text-xs space-y-1.5">
              <Users className="w-8 h-8 text-zinc-600 mx-auto mb-1" />
              <div className="font-bold text-zinc-300">
                {lang === 'uz' ? "Hozircha do'stlar yo'q" : lang === 'en' ? 'No friends added yet' : 'У вас пока нет добавленных друзей'}
              </div>
              <div className="text-[11px] text-zinc-500">
                {lang === 'uz'
                  ? "Do'stingizdan 6 xonali ID raqamini so'rang va yuqoridagi maydonga kiriting!"
                  : lang === 'en'
                  ? 'Ask your friend for their 6-digit Player ID and enter it above to play together!'
                  : 'Спросите у друга его 6-значный ID (например #482910), введите выше и зовите его в свою комнату!'}
              </div>
            </div>
          ) : (
            friends.map((f) => (
              <div
                key={f.username}
                className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    {f.avatarUrl ? (
                      <img
                        src={f.avatarUrl}
                        alt={f.username}
                        className="w-10 h-10 rounded-xl object-cover border border-cyan-500/40"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl">
                        {f.characterDetails?.avatar || '🥷'}
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-950 ${
                        f.isOnline ? 'bg-emerald-400' : 'bg-zinc-600'
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-sm text-white truncate">
                        {f.username}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono font-bold">
                        ID: #{f.userId}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono flex items-center gap-2 mt-0.5">
                      {f.isOnline ? (
                        <span className="text-emerald-400 font-bold">● Онлайн</span>
                      ) : (
                        <span className="text-zinc-500">● Оффлайн</span>
                      )}
                      {f.currentRoomCode && (
                        <span className="text-amber-400 font-bold">
                          • В комнате #{f.currentRoomCode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  {/* Invite friend to OUR current room */}
                  {currentRoomCode && (
                    <button
                      type="button"
                      onClick={() => handleInviteFriend(f)}
                      className={`px-3 py-1.5 rounded-xl font-mono font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                        invitedMap[f.username]
                          ? 'bg-emerald-600 text-white'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-md shadow-cyan-500/20'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {invitedMap[f.username]
                          ? (lang === 'uz' ? 'Yuborildi!' : lang === 'en' ? 'Sent!' : 'Отправлено!')
                          : (lang === 'uz' ? 'Xonaga chaqirish' : lang === 'en' ? 'Invite to Room' : 'Позвать в комнату')}
                      </span>
                    </button>
                  )}

                  {/* Join friend's room if they are in one and we aren't in that room */}
                  {f.currentRoomCode && f.currentRoomCode !== currentRoomCode && onJoinFriendRoom && (
                    <button
                      type="button"
                      onClick={() => {
                        onJoinFriendRoom(f.currentRoomCode);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{lang === 'uz' ? 'Kirish' : lang === 'en' ? 'Join' : `Войти (#${f.currentRoomCode})`}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveFriend(f.username)}
                    title={lang === 'uz' ? "Do'stlardan o'chirish" : lang === 'en' ? 'Remove friend' : 'Удалить из друзей'}
                    className="p-1.5 rounded-xl bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 border border-zinc-700 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
