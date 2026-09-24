import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, ChevronDown, Check, CheckCheck, Trash2, Sparkles, HelpCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { renderFormattedAnnouncement } from '../admin/AdminBroadcastCenter';

const ChatWidget = ({ inline = false }) => {
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(inline ? true : false);
  const [messages, setMessages] = useState([]);
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const toast = {
    success: (msg) => {
      setToastMsg({ msg, type: 'success' });
      setTimeout(() => setToastMsg(null), 3000);
    },
    error: (msg) => {
      setToastMsg({ msg, type: 'error' });
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  const API_URL = import.meta.env.VITE_API_URL || '';
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser._id || currentUser.id || localStorage.getItem('userId');

  const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  // Fetch threads
  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/chat/threads`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const threadList = data.threads || data;
        setThreads(threadList);
        // We want all users (admin and operators) to see the thread list first.
        // So we do not auto-select activeThread.

        // Calculate total unread
        const total = threadList.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
        setUnreadCount(total);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('chat_unread_updated', { detail: { count: total } }));
        }
      }
    } catch { /* silent */ }
  }, [API_URL]);

  // Fetch messages for active thread
  const fetchMessages = useCallback(async (threadId) => {
    if (!threadId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/chat/messages/${threadId}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || data);
      }
    } catch { /* silent */ }
    setIsLoading(false);
  }, [API_URL]);

  // Mark thread as read
  const markThreadRead = useCallback(async (threadId) => {
    try {
      await fetch(`${API_URL}/api/v1/chat/messages/${threadId}/read`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      setThreads(prev => prev.map(t => 
        t._id === threadId ? { ...t, unreadCount: 0 } : t
      ));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('chat_unread_updated', {}));
      }
      fetchThreads();
    } catch { /* silent */ }
  }, [API_URL, fetchThreads]);

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/chat/messages/${msgId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m._id !== msgId));
        toast.success('Message deleted');
      } else {
        toast.error('Failed to delete message');
      }
    } catch {
      toast.error('Network error while deleting');
    }
  };

  const handleDeleteThread = async (e, threadId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this entire conversation? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/chat/threads/${threadId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setThreads(prev => prev.filter(t => t._id !== threadId));
        if (activeThread && activeThread._id === threadId) {
          setActiveThread(null);
        }
        toast.success('Conversation deleted');
      } else {
        toast.error('Failed to delete conversation');
      }
    } catch {
      toast.error('Network error while deleting');
    }
  };

  // Send message
  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    
    const messageText = input.trim();
    setInput('');
    setIsSending(true);

    try {
      if (isBroadcast) {
        const res = await fetch(`${API_URL}/api/v1/chat/broadcast`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ message: messageText }),
        });
        
        if (res.ok) {
          toast.success('Announcement broadcasted to all channels!');
          setIsBroadcast(false);
          fetchThreads();
        } else {
          const rawText = await res.text().catch(() => '');
          toast.error(`Failed to broadcast: ${rawText.substring(0, 50)}`);
        }
        setIsSending(false);
        return;
      }

      const payload = { message: messageText };
      if (activeThread) {
        if (activeThread._id && activeThread._id !== 'new') {
          payload.threadId = activeThread._id;
        }
        const isCurrentAdmin = String(currentUser.role || '').toLowerCase().includes('admin');
        if (isCurrentAdmin) {
          const operatorParticipant = activeThread.participants?.find(p => {
            const role = String(p.role || '').toLowerCase();
            return !role.includes('admin');
          });
          if (operatorParticipant) {
            payload.recipientId = operatorParticipant._id || operatorParticipant;
          }
        }
      }

      const res = await fetch(`${API_URL}/api/v1/chat/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const newMsg = data.message || data;
        
        setMessages(prev => {
          if (prev.some(m => String(m._id) === String(newMsg._id))) return prev;
          const matchIdx = prev.findIndex(m => 
            m.message === newMsg.message &&
            String(m.sender?._id || m.sender) === String(currentUserId) &&
            Math.abs(new Date(m.createdAt || Date.now()) - new Date(newMsg.createdAt || Date.now())) < 20000
          );
          if (matchIdx !== -1) {
            const copy = [...prev];
            copy[matchIdx] = newMsg;
            return copy;
          }
          return [...prev, newMsg];
        });
        
        // If no active thread or drafting a new thread, set to returned thread
        if (data.thread && (!activeThread || activeThread._id === 'new')) {
          setActiveThread(data.thread);
        }

        // Refresh threads
        fetchThreads();
        scrollToBottom();
      } else {
        const rawText = await res.text().catch(() => '');
        let errData = {};
        try { errData = JSON.parse(rawText); } catch { errData = {}; }
        console.error('Chat error:', rawText);
        
        // Show detailed error
        const errMsg = errData.message || rawText.substring(0, 100) || res.statusText || 'Unknown error';
        toast.error(`Failed to send message: ${errMsg}`);
      }
    } catch (err) { 
      console.error('Network error:', err);
      toast.error('Network error sending message.');
    }
    
    setIsSending(false);
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handle scroll
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };

  // Socket.IO listeners
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (data) => {
      const incomingThreadId = typeof data.thread === 'object' ? data.thread?._id : data.thread;
      if (activeThread && (incomingThreadId === activeThread._id || String(incomingThreadId) === String(activeThread._id))) {
        setMessages(prev => {
          // Deduplicate by message ID
          if (prev.some(m => String(m._id) === String(data._id))) return prev;
          
          // Deduplicate self-sent messages (double bubble bug fix)
          const isSenderSelf = String(data.sender?._id || data.sender) === String(currentUserId);
          if (isSenderSelf) {
            const selfMatchIdx = prev.findIndex(m => 
              (m._id?.startsWith?.('temp_') || String(m.sender?._id || m.sender) === String(currentUserId)) &&
              m.message === data.message &&
              Math.abs(new Date(m.createdAt || Date.now()) - new Date(data.createdAt || Date.now())) < 20000
            );
            if (selfMatchIdx !== -1) {
              const copy = [...prev];
              copy[selfMatchIdx] = data;
              return copy;
            }
          }
          return [...prev, data];
        });
        markThreadRead(activeThread._id);
        scrollToBottom();
      }
      fetchThreads();
    };

    const handleTyping = (data) => {
      if (activeThread && data.threadId === activeThread._id) {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2500);
      }
    };

    socket.on('chat_message', handleChatMessage);
    socket.on('chat_typing', handleTyping);

    return () => {
      socket.off('chat_message', handleChatMessage);
      socket.off('chat_typing', handleTyping);
    };
  }, [socket, activeThread, markThreadRead, fetchThreads]);

  // Fetch threads on open
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchThreads();
    }
  }, [isOpen, fetchThreads]);

  // Load messages when thread selected
  useEffect(() => {
    if (activeThread?._id && activeThread._id !== 'new') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchMessages(activeThread._id);
      markThreadRead(activeThread._id);
    }
  }, [activeThread, fetchMessages, markThreadRead]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial unread count fetch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchThreads();
  }, [fetchThreads]);

  // Emit typing specifically to relevant participants
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (socket && activeThread && activeThread._id !== 'new') {
      if (isCurrentUserAdmin) {
        // Admin typing: send specifically to the operator
        const operatorParticipant = activeThread.participants?.find(p => {
          const role = String(p?.role || '').toLowerCase();
          return role && !role.includes('admin');
        });
        if (operatorParticipant) {
          socket.emit('chat_typing', { 
            threadId: activeThread._id, 
            recipientId: operatorParticipant._id || operatorParticipant 
          });
        }
      } else {
        // Operator typing: notify admins
        const admins = activeThread.participants?.filter(p => {
          const role = String(p?.role || '').toLowerCase();
          return role.includes('admin');
        }) || [];
        admins.forEach(admin => {
          socket.emit('chat_typing', { 
            threadId: activeThread._id, 
            recipientId: admin._id || admin 
          });
        });
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + 
           d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const isCurrentUser = (senderId) => {
    const sid = typeof senderId === 'object' && senderId !== null ? senderId._id : senderId;
    return String(sid) === String(currentUserId);
  };

  const isCurrentUserAdmin = String(currentUser?.role || localStorage.getItem('role') || '').toLowerCase().includes('admin');

  const getThreadTitle = (t) => {
    if (!t) return 'GTRAMS Support';
    if (t.isAnnouncement) {
      return '📢 Official Announcements';
    }
    if (isCurrentUserAdmin) {
      // For Admin: ONLY show Operator's name. Never list other admins!
      const operator = t.participants?.find(p => {
        if (!p) return false;
        const role = String(p.role || '').toLowerCase();
        return role && !role.includes('admin');
      });
      return operator?.name || 'Operator';
    } else {
      // For Operator: always show GTRAMS Support
      return 'GTRAMS Support';
    }
  };

  const getSenderName = (sender) => {
    if (!sender) return 'User';
    const sRole = String(sender.role || '').toLowerCase();
    if (sRole.includes('admin')) {
      return 'GTRAMS Support';
    }
    return sender.name || 'Operator';
  };

  if (!inline && isCurrentUserAdmin) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!inline && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`fixed z-[90] bottom-20 md:bottom-6 right-4 md:right-6 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer print:hidden ${
            isOpen 
              ? 'bg-slate-800 dark:bg-slate-700 text-white rotate-0'
              : 'bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 hover:scale-105'
          }`}
          title="Chat with GTRAMS Admin"
        >
          {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
          {!isOpen && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[22px] h-5.5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center px-1.5 shadow-md animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Backdrop with Blur */}
      {!inline && isOpen && (
        <div 
          className="fixed inset-0 z-[94] bg-slate-950/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200 print:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Chat Panel - Enlarge operator floating widget and inline container */}
      {isOpen && (
        <div className={inline 
          ? "w-full h-full min-h-[620px] max-h-[740px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-sm" 
          : "fixed z-[95] bottom-4 sm:bottom-6 md:bottom-8 left-4 right-4 sm:left-auto sm:right-6 w-auto sm:w-[500px] md:w-[540px] max-w-[560px] h-[85vh] max-h-[720px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 print:hidden"
        }>
          
          {/* Toast Notification */}
          {toastMsg && (
            <div className={`absolute top-16 left-4 right-4 z-50 p-3 rounded-2xl text-xs sm:text-sm font-bold text-center shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
              toastMsg.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {toastMsg.msg}
            </div>
          )}
          
          {/* Header */}
          <div className="bg-[#7A1B22] dark:bg-slate-800 text-white px-5 py-4 flex items-center justify-between shrink-0 shadow-sm">
            <div className="min-w-0 pr-3">
              <h3 className="font-bold text-sm sm:text-base tracking-tight truncate">
                {isBroadcast 
                  ? 'Broadcast Announcement' 
                  : activeThread 
                    ? getThreadTitle(activeThread)
                    : 'Messages'}
              </h3>
              <p className="text-xs text-white/75 font-medium truncate mt-0.5">
                {isBroadcast 
                  ? 'Send to all operators & TODA' 
                  : activeThread 
                    ? (activeThread.isAnnouncement ? 'Official broadcast channel' : (isCurrentUserAdmin ? 'Support with Operator' : 'Online • Admin Support')) 
                    : 'GTRAMS Communications'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {(activeThread || isBroadcast) && (
                <button
                  onClick={() => { setActiveThread(null); setIsBroadcast(false); }}
                  className="text-xs font-bold px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl transition-colors cursor-pointer"
                >
                  Back to List
                </button>
              )}
              {!inline && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close chat"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Messages Container */}
          <div 
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/80 dark:bg-slate-950/50 relative"
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={28} className="animate-spin text-slate-400 dark:text-slate-500" />
              </div>
            ) : !activeThread && !isBroadcast ? (
              // Thread list for all users
              <div className="space-y-2.5">
                {isCurrentUserAdmin && (
                  <button
                    onClick={() => setIsBroadcast(true)}
                    className="w-full mb-3 flex items-center justify-center gap-2 p-3.5 bg-[#7A1B22]/10 dark:bg-[#D4AF37]/10 text-[#7A1B22] dark:text-[#D4AF37] hover:bg-[#7A1B22]/20 dark:hover:bg-[#D4AF37]/20 rounded-2xl font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-xs"
                  >
                    <MessageCircle size={18} /> Broadcast Announcement
                  </button>
                )}
                {!isCurrentUserAdmin && !threads.some(t => !t.isAnnouncement) && (
                  <button
                    onClick={() => setActiveThread({ _id: 'new', participants: [], isAnnouncement: false })}
                    className="w-full mb-3 flex items-center justify-center gap-2 p-3.5 bg-[#7A1B22]/10 dark:bg-[#D4AF37]/10 text-[#7A1B22] dark:text-[#D4AF37] hover:bg-[#7A1B22]/20 dark:hover:bg-[#D4AF37]/20 rounded-2xl font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-xs"
                  >
                    <MessageCircle size={18} /> Start Chat with Admin Support
                  </button>
                )}
                {threads.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <MessageCircle size={28} />
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No active conversations</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      {isCurrentUserAdmin ? 'Incoming messages from operators will appear here.' : 'Click start chat to message admin support.'}
                    </p>
                  </div>
                ) : (
                  threads.map(t => {
                    const title = getThreadTitle(t);
                    return (
                      <div
                        key={t._id}
                        onClick={() => setActiveThread(t)}
                        className="w-full text-left p-3.5 sm:p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-[#7A1B22] dark:hover:border-[#D4AF37] transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                      >
                        <div className="overflow-hidden pr-3">
                          <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">{t.lastMessage || 'No messages yet'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isCurrentUserAdmin && !t.isAnnouncement && (
                            <button
                              onClick={(e) => handleDeleteThread(e, t._id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all cursor-pointer"
                              title="Delete conversation"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          {t.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full shrink-0">
                              {t.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : isBroadcast || messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
                <div className="w-16 h-16 bg-[#7A1B22]/10 dark:bg-[#D4AF37]/10 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle size={30} className="text-[#7A1B22] dark:text-[#D4AF37]" />
                </div>
                <p className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1.5">
                  {isBroadcast ? 'Broadcast Announcement' : (isCurrentUserAdmin ? 'Conversation with Operator' : 'GTRAMS Admin Support')}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5 max-w-sm">
                  {isBroadcast 
                    ? 'Type your announcement below. It will be sent as a direct message to all Operators and TODA Presidents.' 
                    : (isCurrentUserAdmin 
                      ? 'Reply to assist this operator with franchise concerns or inquiries.' 
                      : 'Send a message to GTRAMS Support. Our administrators will assist you shortly.')}
                </p>
                {!isBroadcast && !isCurrentUserAdmin && (
                  <div className="w-full max-w-md space-y-2 mt-2">
                    {['Paano mag-renew ng prangkisa?', 'Ano ang requirements para sa bagong prangkisa?', 'Saan kukunin ang Claim Stub?'].map((q, i) => (
                      <button
                        key={i}
                        onClick={() => { setInput(q); }}
                        className="block w-full p-2.5 sm:p-3 text-xs sm:text-sm text-left font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-[#7A1B22] dark:hover:border-[#D4AF37] transition-all cursor-pointer shadow-2xs"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => {
                  const isMine = isCurrentUser(msg.sender);
                  return (
                    <div key={msg._id || idx} className={`flex group ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[80%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isMine
                          ? 'bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 rounded-br-md shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-md shadow-xs'
                      }`}>
                        {!isMine && msg.sender && (
                          <p className={`text-xs font-bold mb-1 ${
                            isMine ? 'text-white/70 dark:text-slate-950/60' : 'text-[#7A1B22] dark:text-[#D4AF37]'
                          }`}>
                            {getSenderName(msg.sender)}
                          </p>
                        )}
                        {activeThread?.isAnnouncement || String(msg.message || '').startsWith('[ANNOUNCEMENT]') ? (
                          <div className="text-xs sm:text-sm">
                            {renderFormattedAnnouncement(String(msg.message || '').replace(/^\[ANNOUNCEMENT\]\s*/i, ''))}
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap break-words">
                            {renderFormattedAnnouncement(msg.message)}
                          </div>
                        )}
                        <div className={`flex items-center gap-1.5 mt-1.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-[10px] font-medium ${
                            isMine ? 'text-white/70 dark:text-slate-950/60' : 'text-slate-400 dark:text-slate-400'
                          }`}>
                            {formatTime(msg.createdAt)}
                          </span>
                          {isMine && (
                            msg.isRead 
                              ? <CheckCheck size={12} className="text-white/80 dark:text-slate-950/70" />
                              : <Check size={12} className="text-white/50 dark:text-slate-950/50" />
                          )}
                          {(isMine || isCurrentUserAdmin) && (
                            <button
                              onClick={() => handleDeleteMessage(msg._id)}
                              className={`ml-2 text-[10px] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ${
                                isMine ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-red-500'
                              }`}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-2xl rounded-bl-md shadow-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}

            {/* Scroll to bottom button */}
            {showScrollBtn && (
              <button
                onClick={scrollToBottom}
                className="sticky bottom-2 left-1/2 -translate-x-1/2 w-9 h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronDown size={18} className="text-slate-600 dark:text-slate-300" />
              </button>
            )}
          </div>

          {/* Input Area - Only when actively in a chat thread or composing broadcast */}
          {(
            isBroadcast ||
            (activeThread && !activeThread.isAnnouncement)
          ) && (
            <div className="border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 bg-white dark:bg-slate-900 shrink-0">
              {/* Persistent Horizontal Quick-Reply Carousel for Operators */}
              {!isCurrentUserAdmin && !isBroadcast && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-1.5 scrollbar-none overscroll-contain">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1 pl-1">
                    <Sparkles size={12} className="text-[#D4AF37]" /> Tanong:
                  </span>
                  {[
                    'Kailan ang release ng MTOP plate?',
                    'Magkano ang babayarang renewal fee?',
                    'Ano ang requirements para sa renewal?',
                    'Paano kung nawala ang aking OR/CR?',
                    'Saan kukunin ang Claim Stub?',
                    'Kailan ang schedule ng inspeksyon?',
                    'Paano mag-renew ng prangkisa?'
                  ].map((faq, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setInput(faq)}
                      className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 hover:border-[#7A1B22] dark:hover:border-[#D4AF37] hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer whitespace-nowrap active:scale-95"
                    >
                      {faq}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2.5">
                <textarea
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  rows={1}
                  className="flex-1 resize-none border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7A1B22]/30 dark:focus:ring-[#D4AF37]/30 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] min-h-[46px] max-h-[120px] transition-colors leading-relaxed"
                  style={{ fieldSizing: 'content' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isSending}
                  className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                    input.trim() && !isSending
                      ? 'bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 hover:opacity-90 active:scale-90 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                  title="Send message"
                >
                  {isSending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ChatWidget;
