import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Search, Send, Loader2, Trash2, Check, CheckCheck, User, Sparkles } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const AdminLiveChat = () => {
  const { socket } = useSocket();
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  const API_URL = import.meta.env.VITE_API_URL || '';
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Fetch all threads excluding announcements for 1-on-1 chat
  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/chat/threads`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const threadList = Array.isArray(data) ? data : (data.threads || []);
        // Filter only operator conversations (non-announcements)
        const operatorThreads = threadList.filter(t => !t.isAnnouncement);
        setThreads(operatorThreads);

        const totalUnread = operatorThreads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('chat_unread_updated', { detail: { count: totalUnread } }));
        }
      }
    } catch (err) {
      console.error('Error fetching chat threads:', err);
    } finally {
      setIsLoadingThreads(false);
    }
  }, [API_URL]);

  // Fetch messages for selected thread
  const fetchMessages = useCallback(async (threadId) => {
    if (!threadId) return;
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/chat/messages/${threadId}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : (data.messages || []));
        setTimeout(() => scrollToBottom('auto'), 100);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [API_URL]);

  // Mark thread as read
  const markThreadRead = useCallback(async (threadId) => {
    if (!threadId) return;
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
    } catch { /* silent */ }
  }, [API_URL]);

  // Initial fetch
  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Fetch messages and mark read when active thread changes
  useEffect(() => {
    if (activeThread?._id) {
      fetchMessages(activeThread._id);
      markThreadRead(activeThread._id);
    } else {
      setMessages([]);
    }
  }, [activeThread, fetchMessages, markThreadRead]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      const threadId = typeof msg.thread === 'object' ? msg.thread?._id : msg.thread;

      // If viewing this thread, append message
      if (activeThread && (String(activeThread._id) === String(threadId))) {
        setMessages(prev => {
          if (prev.some(m => String(m._id) === String(msg._id))) return prev;
          return [...prev, msg];
        });
        markThreadRead(threadId);
        setTimeout(() => scrollToBottom('smooth'), 100);
      }

      // Update thread list
      setThreads(prev => {
        const exists = prev.some(t => String(t._id) === String(threadId));
        if (exists) {
          return prev.map(t => {
            if (String(t._id) === String(threadId)) {
              return {
                ...t,
                lastMessage: msg.message,
                lastMessageAt: msg.createdAt,
                unreadCount: (!activeThread || String(activeThread._id) !== String(threadId))
                  ? (t.unreadCount || 0) + 1
                  : 0
              };
            }
            return t;
          }).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        } else {
          fetchThreads();
          return prev;
        }
      });
    };

    const handleThreadDeleted = ({ threadId }) => {
      setThreads(prev => prev.filter(t => String(t._id) !== String(threadId)));
      if (activeThread && String(activeThread._id) === String(threadId)) {
        setActiveThread(null);
        setMessages([]);
      }
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => String(m._id) !== String(messageId)));
    };

    socket.on('chat_message', handleNewMessage);
    socket.on('chat_deleted', handleThreadDeleted);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('chat_message', handleNewMessage);
      socket.off('chat_deleted', handleThreadDeleted);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [socket, activeThread, markThreadRead, fetchThreads]);

  // Send message
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || isSending || !activeThread) return;

    setIsSending(true);
    setInput('');

    try {
      const otherParticipant = activeThread.participants?.find(p => 
        String(p._id || p) !== String(currentUser._id || currentUser.id)
      );

      const payload = {
        message: text,
        threadId: activeThread._id,
        recipientId: otherParticipant?._id || otherParticipant
      };

      const res = await fetch(`${API_URL}/api/v1/chat/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const sentMsg = data.message || data;
        setMessages(prev => [...prev, sentMsg]);
        setTimeout(() => scrollToBottom('smooth'), 100);

        setThreads(prev => prev.map(t => 
          String(t._id) === String(activeThread._id)
            ? { ...t, lastMessage: text, lastMessageAt: new Date().toISOString() }
            : t
        ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)));
      } else {
        alert('Failed to send message.');
        setInput(text);
      }
    } catch (err) {
      console.error('Send error:', err);
      alert('Network error sending message.');
      setInput(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteThread = async (e, threadId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this entire conversation with the operator?')) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/chat/threads/${threadId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setThreads(prev => prev.filter(t => String(t._id) !== String(threadId)));
        if (activeThread && String(activeThread._id) === String(threadId)) {
          setActiveThread(null);
          setMessages([]);
        }
      }
    } catch {
      alert('Failed to delete conversation');
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/chat/messages/${msgId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => String(m._id) !== String(msgId)));
      }
    } catch {
      alert('Failed to delete message');
    }
  };

  const getThreadOperator = (thread) => {
    if (!thread || !thread.participants) return { name: 'Operator', email: '', picture: '' };
    const op = thread.participants.find(p => String(p._id || p) !== String(currentUser._id || currentUser.id));
    return op || { name: 'Operator', email: '', picture: '' };
  };

  const filteredThreads = threads.filter(t => {
    const op = getThreadOperator(t);
    const opName = (op?.name || '').toLowerCase();
    const lastMsg = (t.lastMessage || '').toLowerCase();
    const query = search.toLowerCase();
    return opName.includes(query) || lastMsg.includes(query);
  });

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const activeOperator = activeThread ? getThreadOperator(activeThread) : null;

  return (
    <div className="w-full h-[660px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col md:flex-row">
      
      {/* LEFT COLUMN: Operator Conversations List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/30 ${
        activeThread ? 'hidden md:flex' : 'flex'
      }`}>
        
        {/* Search header */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search operators or messages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#7A1B22] dark:focus:border-[#D4AF37] transition-all"
            />
          </div>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {isLoadingThreads ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
              <Loader2 size={20} className="animate-spin mr-2" /> Loading conversations...
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="text-center py-16 px-4">
              <MessageSquare size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No conversations found</p>
              <p className="text-[11px] text-slate-400 mt-1">Inquiries from tricycle operators will appear here.</p>
            </div>
          ) : (
            filteredThreads.map(t => {
              const op = getThreadOperator(t);
              const isSelected = activeThread?._id === t._id;
              return (
                <div
                  key={t._id}
                  onClick={() => setActiveThread(t)}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors relative group ${
                    isSelected 
                      ? 'bg-white dark:bg-slate-800/90 border-l-4 border-[#7A1B22] dark:border-[#D4AF37] shadow-xs' 
                      : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Operator Avatar */}
                  <div className="relative shrink-0">
                    {op?.profilePic ? (
                      <img src={op.profilePic} alt={op.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-sm">
                        {(op?.name || 'O')[0].toUpperCase()}
                      </div>
                    )}
                    {t.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs">
                        {t.unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Thread Meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={`text-xs sm:text-sm truncate ${t.unreadCount > 0 ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-800 dark:text-slate-200'}`}>
                        {op?.name || 'Operator'}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatTime(t.lastMessageAt || t.updatedAt)}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${t.unreadCount > 0 ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {t.lastMessage || 'No messages yet'}
                    </p>
                  </div>

                  {/* Delete Button on Hover */}
                  <button
                    onClick={(e) => handleDeleteThread(e, t._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded-lg transition-opacity cursor-pointer shrink-0"
                    title="Delete conversation"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Conversation Pane */}
      <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 ${
        !activeThread ? 'hidden md:flex' : 'flex'
      }`}>
        {activeThread ? (
          <>
            {/* Conversation Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* Back button for mobile */}
                <button
                  onClick={() => setActiveThread(null)}
                  className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 rounded-lg"
                  aria-label="Back to conversations list"
                >
                  ←
                </button>

                <div className="relative shrink-0">
                  {activeOperator?.profilePic ? (
                    <img src={activeOperator.profilePic} alt={activeOperator.name} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#7A1B22]/10 dark:bg-[#D4AF37]/15 text-[#7A1B22] dark:text-[#D4AF37] font-bold flex items-center justify-center text-sm">
                      {(activeOperator?.name || 'O')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {activeOperator?.name || 'Operator'}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">
                    Operator Inquiries & Support Channel
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => handleDeleteThread(e, activeThread._id)}
                className="text-xs font-semibold text-slate-500 hover:text-red-500 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Delete thread"
              >
                <Trash2 size={13} />
                <span className="hidden sm:inline">Delete Thread</span>
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/50 dark:bg-slate-950/30"
            >
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                  <Loader2 size={24} className="animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                  <MessageSquare size={32} className="mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No messages in this conversation yet.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Send a message below to start assisting the operator.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = String(msg.sender?._id || msg.sender) === String(currentUser._id || currentUser.id);
                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group`}
                    >
                      <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm ${
                        isMine 
                          ? 'bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 rounded-br-xs shadow-xs' 
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-bl-xs shadow-xs'
                      }`}>
                        {!isMine && (
                          <p className="text-[10px] font-bold text-[#7A1B22] dark:text-[#D4AF37] mb-0.5">
                            {msg.sender?.name || activeOperator?.name || 'Operator'}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>
                      </div>

                      <div className={`flex items-center gap-1.5 mt-1 px-1 text-[10px] text-slate-400 ${
                        isMine ? 'justify-end' : 'justify-start'
                      }`}>
                        <span>{formatTime(msg.createdAt)}</span>
                        {isMine && (
                          msg.isRead 
                            ? <CheckCheck size={11} className="text-emerald-500" /> 
                            : <Check size={11} />
                        )}
                        <button
                          onClick={() => handleDeleteMessage(msg._id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity ml-1 cursor-pointer"
                          title="Delete message"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Footer */}
            <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={`Reply to ${activeOperator?.name || 'operator'}... (Press Enter to send)`}
                  rows={2}
                  className="flex-1 resize-none border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isSending}
                  className="h-10 px-4 rounded-xl bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-xs"
                >
                  {isSending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={14} />
                      <span className="hidden sm:inline">Send</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Empty State when no conversation is selected */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30 dark:bg-slate-950/20">
            <div className="w-16 h-16 rounded-2xl bg-[#7A1B22]/10 dark:bg-[#D4AF37]/10 flex items-center justify-center text-[#7A1B22] dark:text-[#D4AF37] mb-3">
              <MessageSquare size={30} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Operator Support Chat
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
              Select an operator conversation from the list to reply directly, provide assistance, and answer franchise inquiries.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminLiveChat;
