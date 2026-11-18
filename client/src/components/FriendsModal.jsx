import React, { useState, useEffect, useRef } from 'react';
import { Users, UserPlus, Copy, Check, Send, Trash2, X, LogIn, Hash, MessageSquare, ArrowLeft } from 'lucide-react';
import { soundManager } from '../utils/audio';

function formatLocalTime(msg) {
  if (msg?.createdAt) {
    try {
      return new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (e) {}
  }
  return msg?.timestamp || '';
}

export default function FriendsModal({
  user,
  socket,
  currentRoomCode,
  initialChatFriend = null,
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

  // Direct Chat State
  const [activeChatFriend, setActiveChatFriend] = useState(initialChatFriend || null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadMap, setUnreadMap] = useState({});
  const chatEndRef = useRef(null);

  const loadFriends = (silent = false) => {
    if (!user?.username) return;
    if (!silent) setLoading(true);
    socket.emit('getFriends', { username: user.username }, (res) => {
      if (!silent) setLoading(false);
      if (res && res.success) {
        if (res.userId) setMyUserId(res.userId);
        const list = res.friends || [];
        setFriends(list);
        if (initialChatFriend) {
          const found = list.find(
            (f) => f.username.toLowerCase() === String(initialChatFriend.username || initialChatFriend).toLowerCase()
          );
          if (found) {
            setActiveChatFriend((prev) => prev || found);
          }
        }
      }
    });
  };

  useEffect(() => {
    loadFriends(false);
    const pollInterval = setInterval(() => loadFriends(true), 5000);

    if (initialChatFriend) {
      const fName = initialChatFriend.username || initialChatFriend;
      socket.emit(
        'getDirectMessages',
        { username: user?.username, friendUsername: fName },
        (res) => {
          if (res && res.success) {
            setChatMessages(res.messages || []);
          }
        }
      );
    }

    const handleFriendsUpdated = (data) => {
      if (data && data.targetUsername && user?.username && data.targetUsername.toLowerCase() === user.username.toLowerCase()) {
        setFriends(data.friends || []);
        soundManager.playBeep(1100, 0.08);
      }
    };

    const handleDirectMessage = (msg) => {
      if (!msg || !user?.username) return;
      const myLow = user.username.toLowerCase();
      const fromLow = (msg.from || '').toLowerCase();
      const toLow = (msg.to || '').toLowerCase();
      if (fromLow !== myLow && toLow !== myLow) return;

      const partner = fromLow === myLow ? toLow : fromLow;

      setActiveChatFriend((currFriend) => {
        if (currFriend && (currFriend.username || '').toLowerCase() === partner) {
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        } else if (fromLow !== myLow) {
          setUnreadMap((prev) => ({ ...prev, [partner]: (prev[partner] || 0) + 1 }));
          soundManager.playBeep(1050, 0.08);
        }
        return currFriend;
      });
    };

    socket.on('friendsUpdated', handleFriendsUpdated);
    socket.on('directMessageReceived', handleDirectMessage);
    return () => {
      clearInterval(pollInterval);
      socket.off('friendsUpdated', handleFriendsUpdated);
      socket.off('directMessageReceived', handleDirectMessage);
    };
  }, [user?.username]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeChatFriend]);

  const openDirectChat = (friend) => {
    setActiveChatFriend(friend);
    const partnerLow = friend.username.toLowerCase();
    setUnreadMap((prev) => ({ ...prev, [partnerLow]: 0 }));
    socket.emit(
      'getDirectMessages',
      { username: user?.username, friendUsername: friend.username },
      (res) => {
        if (res && res.success) {
          setChatMessages(res.messages || []);
        }
      }
    );
  };

  const handleSendDirectMessage = (e) => {
    e.preventDefault();
    const clean = chatInput.trim();
    if (!clean || !activeChatFriend || !user?.username) return;

    setChatInput('');
    soundManager.playBeep(900, 0.04);
    socket.emit(
      'sendDirectMessage',
      {
        fromUsername: user.username,
        toUsername: activeChatFriend.username,
        text: clean
      },
      (res) => {
        if (res && res.success && res.message) {
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === res.message.id)) return prev;
            return [...prev, res.message];
          });
        }
      }
    );
  };

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
          ? "Do'stingizning ID raqamini yoki ismini kiriting!"
          : lang === 'en'
          ? "Enter your friend's Player ID or username!"
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
          ? "Avval xona yarating va keyin do'stingizni chaqiring!"
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

  const liveChatFriend = activeChatFriend
    ? friends.find(
        (f) => f.username.toLowerCase() === (activeChatFriend.username || '').toLowerCase()
      ) || activeChatFriend
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-950 border-2 border-cyan-500/60 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[90vh] overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            {liveChatFriend ? (
              <button
                type="button"
                onClick={() => setActiveChatFriend(null)}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-cyan-400 transition cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-400">
                <Users className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-base sm:text-lg font-display font-bold text-white tracking-wide">
                {liveChatFriend
                  ? (lang === 'uz' ? `💬 ${liveChatFriend.username} bilan chat` : lang === 'en' ? `💬 Chat with ${liveChatFriend.username}` : `💬 Чат с ${liveChatFriend.username}`)
                  : lang === 'uz'
                  ? "DO'STLAR, CHAT VA ID"
                  : lang === 'en'
                  ? 'FRIENDS, DIRECT CHAT & ID'
                  : 'ДРУЗЬЯ ПО ID И ЛИЧНЫЙ ЧАТ'}
              </h2>
              <p className="text-[11px] text-zinc-400 font-mono">
                {liveChatFriend
                  ? `ID: #${liveChatFriend.userId || '------'} • ${liveChatFriend.isOnline ? (lang === 'uz' ? '🟢 Onlayn' : lang === 'en' ? '🟢 Online' : '🟢 Онлайн') : (lang === 'uz' ? '⚫ Oflayn' : lang === 'en' ? '⚫ Offline' : '⚫ Оффлайн')}`
                  : lang === 'uz'
                  ? "ID orqali do'st qo'shing, yozishing va birga o'ynang"
                  : lang === 'en'
                  ? 'Add friends by ID, chat directly, and invite to rooms'
                  : 'Переписывайтесь с друзьями напрямую и зовите в бункер'}
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

        {/* DIRECT CHAT VIEW WITH A FRIEND */}
        {liveChatFriend ? (
          <div className="flex-1 flex flex-col min-h-[340px] max-h-[65vh]">
            <div className="flex-1 overflow-y-auto space-y-2.5 p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800 mb-3">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 font-mono text-xs">
                  {lang === 'uz' 
                    ? <>Do'stingiz <strong className="text-cyan-400">{liveChatFriend.username}</strong> ga birinchi xabarni yozing!</>
                    : lang === 'en'
                    ? <>Send the first message to your friend <strong className="text-cyan-400">{liveChatFriend.username}</strong>!</>
                    : <>Напишите первое сообщение другу <strong className="text-cyan-400">{liveChatFriend.username}</strong>!</>}
                </div>
              ) : (
                chatMessages.map((m) => {
                  const isMine = (m.from || '').toLowerCase() === (user?.username || '').toLowerCase();
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[82%] px-3.5 py-2 rounded-2xl text-xs font-mono break-words ${
                          isMine
                            ? 'bg-cyan-500 text-black font-semibold rounded-br-none'
                            : 'bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-bl-none'
                        }`}
                      >
                        <div>{m.text}</div>
                        <div className={`text-[9px] mt-0.5 ${isMine ? 'text-black/70 text-right' : 'text-zinc-400'}`}>
                          {formatLocalTime(m)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendDirectMessage} className="flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={
                  lang === 'uz'
                    ? `${activeChatFriend.username} ga xabar yozing...`
                    : lang === 'en'
                    ? `Message ${activeChatFriend.username}...`
                    : `Написать сообщение ${activeChatFriend.username}...`
                }
                maxLength={350}
                className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 font-mono outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-display font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>{lang === 'uz' ? 'Yuborish' : lang === 'en' ? 'Send' : 'Отправить'}</span>
              </button>
            </form>
          </div>
        ) : (
          <>
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
                      : 'Спросите у друга его 6-значный ID (например #482910), введите выше и общайтесь!'}
                  </div>
                </div>
              ) : (
                friends.map((f) => {
                  const unread = unreadMap[f.username.toLowerCase()] || 0;
                  return (
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
                              <span className="text-emerald-400 font-bold">● {lang === 'uz' ? 'Onlayn' : lang === 'en' ? 'Online' : 'Онлайн'}</span>
                            ) : (
                              <span className="text-zinc-500">● {lang === 'uz' ? 'Oflayn' : lang === 'en' ? 'Offline' : 'Оффлайн'}</span>
                            )}
                            {f.currentRoomCode && (
                              <span className={f.currentRoomStatus === 'LOBBY' ? 'text-amber-400 font-bold' : 'text-red-400 font-bold'}>
                                {f.currentRoomStatus === 'LOBBY'
                                  ? `• ${lang === 'uz' ? `Lobbi #${f.currentRoomCode}` : lang === 'en' ? `In Lobby #${f.currentRoomCode}` : `В лобби #${f.currentRoomCode}`}`
                                  : `• 🔒 ${lang === 'uz' ? `O'yinda (#${f.currentRoomCode})` : lang === 'en' ? `In Game (#${f.currentRoomCode})` : `В игре (#${f.currentRoomCode})`}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 flex-wrap">
                        {/* Direct Chat Button */}
                        <button
                          type="button"
                          onClick={() => openDirectChat(f)}
                          className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-cyan-500 hover:text-black text-cyan-300 border border-cyan-500/40 font-mono font-bold text-xs flex items-center gap-1 transition cursor-pointer relative"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{lang === 'uz' ? 'Chat' : lang === 'en' ? 'Chat' : 'Чат'}</span>
                          {unread > 0 && (
                            <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-bold">
                              {unread}
                            </span>
                          )}
                        </button>

                        {/* Invite friend to OUR current room */}
                        {currentRoomCode && (
                          <button
                            type="button"
                            onClick={() => handleInviteFriend(f)}
                            className={`px-2.5 py-1.5 rounded-xl font-mono font-bold text-xs flex items-center gap-1 transition cursor-pointer ${
                              invitedMap[f.username]
                                ? 'bg-emerald-600 text-white'
                                : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-md shadow-cyan-500/20'
                            }`}
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>
                              {invitedMap[f.username]
                                ? (lang === 'uz' ? 'Yuborildi!' : lang === 'en' ? 'Sent!' : 'Отправлено!')
                                : (lang === 'uz' ? 'Chaqirish' : lang === 'en' ? 'Invite' : 'Позвать')}
                            </span>
                          </button>
                        )}

                        {/* Join friend's room ONLY if they are in LOBBY (before game starts) */}
                        {f.currentRoomCode && f.currentRoomCode !== currentRoomCode && f.currentRoomStatus === 'LOBBY' && onJoinFriendRoom && (
                          <button
                            type="button"
                            onClick={() => {
                              onJoinFriendRoom(f.currentRoomCode);
                              onClose();
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs flex items-center gap-1 transition cursor-pointer"
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
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
