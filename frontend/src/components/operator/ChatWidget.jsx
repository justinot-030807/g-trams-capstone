import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, ChevronDown, Check, CheckCheck } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const ChatWidget = () => {
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
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
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

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
        
        // Auto-select thread for operator if they have one
        const role = String(currentUser.role || '').toLowerCase().replace(/_/g, ' ');
        const isAdmin = role === 'admin' || role === 'administrator';
        if (!isAdmin && threadList.length > 0 && !activeThread) {
          setActiveThread(threadList[0]);
        }

        // Calculate total unread
        const total = threadList.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
        setUnreadCount(total);
      }
    } catch (err) { /* silent */ }
  }, [API_URL, currentUser.role, activeThread]);

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
    } catch (err) { /* silent */ }
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
      fetchThreads();
    } catch (err) { /* silent */ }
  }, [API_URL, fetchThreads]);

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
          alert('Broadcast sent successfully!');
          setIsBroadcast(false);
          fetchThreads();
        } else {
          const rawText = await res.text().catch(() => '');
          alert(`Failed to broadcast: ${rawText.substring(0, 50)}`);
        }
        setIsSending(false);
        return;
      }

      const payload = { message: messageText };
      if (activeThread) {
        const otherParticipant = activeThread.participants?.find(p => String(p._id || p) !== String(currentUserId));
        if (otherParticipant) {
          payload.recipientId = otherParticipant._id || otherParticipant;
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
        
        setMessages(prev => [...prev, newMsg]);
        
        // If no active thread, set it
        if (data.thread && !activeThread) {
          setActiveThread(data.thread);
        }

        // Refresh threads
        fetchThreads();
        scrollToBottom();
      } else {
        const rawText = await res.text().catch(() => '');
        let errData = {};
        try { errData = JSON.parse(rawText); } catch(e) {}
        console.error('Chat error:', rawText);
        
        // Show detailed error
        const errMsg = errData.message || rawText.substring(0, 100) || res.statusText || 'Unknown error';
        alert(`Failed to send message (${res.status}): ${errMsg}`);
      }
    } catch (err) { 
      console.error('Network error:', err);
      alert('Network error sending message.');
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
      if (activeThread && data.thread === activeThread._id) {
        setMessages(prev => [...prev, data]);
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
      fetchThreads();
    }
  }, [isOpen, fetchThreads]);

  // Load messages when thread selected
  useEffect(() => {
    if (activeThread?._id) {
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
    fetchThreads();
  }, [fetchThreads]);

  // Emit typing
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (socket && activeThread) {
      const admin = activeThread.participants?.find(p => {
        const role = String(p.role || '').toLowerCase().replace(/_/g, ' ');
        return role === 'admin' || role === 'administrator';
      });
      if (admin) {
        socket.emit('chat_typing', { 
          threadId: activeThread._id, 
          recipientId: admin._id 
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

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed z-[90] bottom-20 md:bottom-6 right-4 md:right-6 w-13 h-13 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer print:hidden ${
          isOpen 
            ? 'bg-slate-800 dark:bg-slate-700 text-white rotate-0'
            : 'bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 hover:scale-105'
        }`}
        title="Chat with GTRAMS Admin"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-md animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed z-[95] bottom-20 md:bottom-20 right-3 md:right-6 w-[calc(100vw-24px)] max-w-[380px] h-[70vh] max-h-[520px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300 print:hidden">
          
          {/* Header */}
          <div className="bg-[#7A1B22] dark:bg-slate-800 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-bold text-sm">
                {isBroadcast ? 'Broadcast Announcement' : activeThread ? (String(currentUser.role).toLowerCase().includes('admin') ? 'Chat with Operator' : 'GTRAMS Admin Support') : 'Messages'}
              </h3>
              <p className="text-[10px] text-white/70 font-medium">
                {isBroadcast ? 'Send to all operators & TODA' : activeThread ? 'Online' : 'GTRAMS Communications'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(activeThread || isBroadcast) && String(currentUser.role).toLowerCase().includes('admin') && (
                <button
                  onClick={() => { setActiveThread(null); setIsBroadcast(false); }}
                  className="text-[10px] font-medium px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors cursor-pointer"
                >
                  Back to List
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50 dark:bg-slate-950/50 relative"
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={24} className="animate-spin text-slate-400" />
              </div>
            ) : !activeThread && !isBroadcast && String(currentUser.role).toLowerCase().includes('admin') ? (
              // Thread list for admin
              <div className="space-y-2">
                <button
                  onClick={() => setIsBroadcast(true)}
                  className="w-full mb-3 flex items-center justify-center gap-2 p-3 bg-[#7A1B22]/10 dark:bg-[#D4AF37]/10 text-[#7A1B22] dark:text-[#D4AF37] rounded-xl font-bold text-xs hover:bg-[#7A1B22]/20 transition-colors"
                >
                  <MessageCircle size={16} /> Broadcast Announcement
                </button>
                {threads.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 mt-4">No active conversations.</p>
                ) : (
                  threads.map(t => {
                    let names = 'Unknown User';
                    if (t.isAnnouncement) {
                      names = '📢 Official Announcements';
                    } else {
                      const otherParticipants = t.participants?.filter(p => String(p._id || p) !== String(currentUserId)) || [];
                      names = otherParticipants.map(p => p.name).join(', ') || 'Unknown User';
                    }
                    return (
                      <button
                        key={t._id}
                        onClick={() => setActiveThread(t)}
                        className="w-full text-left p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#7A1B22] dark:hover:border-[#D4AF37] transition-all flex items-center justify-between"
                      >
                        <div className="overflow-hidden pr-2">
                          <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{names}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{t.lastMessage || 'No messages yet'}</p>
                        </div>
                        {t.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                            {t.unreadCount}
                          </span>
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            ) : isBroadcast || messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-14 h-14 bg-[#7A1B22]/10 dark:bg-[#D4AF37]/10 rounded-full flex items-center justify-center mb-3">
                  <MessageCircle size={24} className="text-[#7A1B22] dark:text-[#D4AF37]" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                  {isBroadcast ? 'Broadcast Announcement' : 'Start a Conversation'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  {isBroadcast 
                    ? 'Type your announcement below. It will be sent as a direct message to all Operators and TODA Presidents.' 
                    : 'Send a message to GTRAMS Admin. They\'ll respond during office hours.'}
                </p>
                {!isBroadcast && !String(currentUser.role).toLowerCase().includes('admin') && (
                  <div className="w-full space-y-2 mt-2">
                    {['Paano mag-renew ng prangkisa?', 'Ano ang requirements para sa bagong prangkisa?', 'Saan kukunin ang Claim Stub?'].map((q, i) => (
                      <button
                        key={i}
                        onClick={() => { setInput(q); }}
                        className="block w-full p-2 text-[11px] text-left text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-[#7A1B22] dark:hover:border-[#D4AF37] transition-colors"
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
                    <div key={msg._id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                        isMine
                          ? 'bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 rounded-br-md'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-md shadow-xs'
                      }`}>
                        {!isMine && msg.sender?.name && (
                          <p className={`text-[10px] font-bold mb-0.5 ${
                            isMine ? 'text-white/70 dark:text-slate-950/60' : 'text-[#7A1B22] dark:text-[#D4AF37]'
                          }`}>
                            {msg.sender.name}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-[9px] font-medium ${
                            isMine ? 'text-white/60 dark:text-slate-950/50' : 'text-slate-400'
                          }`}>
                            {formatTime(msg.createdAt)}
                          </span>
                          {isMine && (
                            msg.isRead 
                              ? <CheckCheck size={11} className="text-white/60 dark:text-slate-950/50" />
                              : <Check size={11} className="text-white/40 dark:text-slate-950/30" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-2xl rounded-bl-md shadow-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                className="sticky bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronDown size={16} className="text-slate-600 dark:text-slate-300" />
              </button>
            )}
          </div>

          {/* Input Area */}
          {(
            isBroadcast ||
            (activeThread && !activeThread.isAnnouncement) || 
            (!activeThread && !String(currentUser.role).toLowerCase().includes('admin'))
          ) && (
            <div className="border-t border-slate-200 dark:border-slate-800 p-2.5 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  rows={1}
                  className="flex-1 resize-none border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7A1B22]/30 dark:focus:ring-[#D4AF37]/30 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] min-h-[38px] max-h-[80px] transition-colors"
                  style={{ fieldSizing: 'content' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isSending}
                  className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    input.trim() && !isSending
                      ? 'bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 hover:opacity-90 active:scale-90 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isSending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
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
