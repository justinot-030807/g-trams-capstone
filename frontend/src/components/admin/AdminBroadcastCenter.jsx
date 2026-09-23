import React, { useState, useEffect, useCallback } from 'react';
import { Radio, Send, Loader2, Megaphone, Trash2, CheckCircle, AlertCircle, Users, Clock } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const AdminBroadcastCenter = () => {
  const { socket } = useSocket();
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [announcementThreadId, setAnnouncementThreadId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || '';

  const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch the official announcements thread & its history
  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/chat/threads`, { headers: getHeaders() });
      if (res.ok) {
        const threads = await res.json();
        const threadList = Array.isArray(threads) ? threads : (threads.threads || []);
        const annThread = threadList.find(t => t.isAnnouncement);
        
        if (annThread) {
          setAnnouncementThreadId(annThread._id);
          const msgRes = await fetch(`${API_URL}/api/v1/chat/messages/${annThread._id}`, { headers: getHeaders() });
          if (msgRes.ok) {
            const msgs = await msgRes.json();
            const msgList = Array.isArray(msgs) ? msgs : (msgs.messages || []);
            // Reverse so newest broadcasts are at the top of the history list
            setAnnouncements([...msgList].reverse());
          }
        } else {
          setAnnouncements([]);
        }
      }
    } catch (err) {
      console.error('Error fetching broadcast history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Socket listener for new announcements
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      const threadId = typeof msg.thread === 'object' ? msg.thread?._id : msg.thread;
      if (announcementThreadId && String(threadId) === String(announcementThreadId)) {
        setAnnouncements(prev => {
          if (prev.some(m => String(m._id) === String(msg._id))) return prev;
          return [msg, ...prev];
        });
      }
    };

    const handleMessageDeleted = ({ messageId }) => {
      setAnnouncements(prev => prev.filter(m => String(m._id) !== String(messageId)));
    };

    socket.on('chat_message', handleNewMessage);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('chat_message', handleNewMessage);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [socket, announcementThreadId]);

  // Submit broadcast
  const handleBroadcast = async (e) => {
    e.preventDefault();
    const text = broadcastMessage.trim();
    if (!text || isBroadcasting) return;

    if (!window.confirm('Are you sure you want to broadcast this announcement to all operators and TODA presidents?')) {
      return;
    }

    setIsBroadcasting(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/chat/broadcast`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: text })
      });

      if (res.ok) {
        setBroadcastMessage('');
        showToast('Announcement successfully broadcasted to all operators and TODA presidents!');
        fetchAnnouncements();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Failed to broadcast announcement', 'error');
      }
    } catch (err) {
      console.error('Broadcast error:', err);
      showToast('Network error while broadcasting', 'error');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleDeleteBroadcast = async (msgId) => {
    if (!window.confirm('Delete this broadcast announcement from history?')) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/chat/messages/${msgId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setAnnouncements(prev => prev.filter(m => String(m._id) !== String(msgId)));
        showToast('Announcement removed from broadcast channel.');
      } else {
        alert('Failed to delete announcement');
      }
    } catch {
      alert('Network error deleting announcement');
    }
  };

  const cleanMessageText = (raw) => {
    if (!raw) return '';
    return raw.replace(/^\[ANNOUNCEMENT\]\s*/i, '').trim();
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
          toastMessage.type === 'error' 
            ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60' 
            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
        }`}>
          {toastMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Broadcast Composer Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#7A1B22]/10 dark:bg-[#D4AF37]/15 text-[#7A1B22] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
            <Megaphone size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Create System Broadcast Announcement
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dispatches an immediate notification and announcement to all registered operators and TODA associations.
            </p>
          </div>
        </div>

        {/* Target Audience Banner */}
        <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-2.5 text-xs">
          <Users size={16} className="text-[#7A1B22] dark:text-[#D4AF37] shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-bold text-slate-700 dark:text-slate-200">Recipients: </span>
            <span className="text-slate-600 dark:text-slate-400">All Tricycle Operators &amp; TODA Presidents across Gasan</span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] uppercase tracking-wider shrink-0">
            All Channels
          </span>
        </div>

        {/* Composer Form */}
        <form onSubmit={handleBroadcast} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Announcement Message
            </label>
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              rows={4}
              placeholder="Type your official announcement here... (e.g. Please be reminded of the upcoming annual franchise inspection at the Municipal Hall grounds.)"
              required
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#7A1B22] dark:focus:border-[#D4AF37] transition-all resize-none leading-relaxed"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <span className="text-xs text-slate-400 order-2 sm:order-1">
              {broadcastMessage.length} characters
            </span>

            <button
              type="submit"
              disabled={!broadcastMessage.trim() || isBroadcasting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#7A1B22] hover:bg-[#5A1419] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] text-white dark:text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer order-1 sm:order-2"
            >
              {isBroadcasting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Broadcasting Announcement...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Send Broadcast to All</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Broadcast History Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-[#7A1B22] dark:text-[#D4AF37]" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Broadcast History ({announcements.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Past announcements sent to operators
          </span>
        </div>

        {isLoadingHistory ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            <Loader2 size={20} className="animate-spin mx-auto mb-2" />
            Loading previous announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Megaphone size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-700" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No broadcasts sent yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Use the composer above to broadcast an official announcement.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann._id}
                className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 hover:border-slate-300 transition-colors relative group"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#7A1B22] dark:bg-[#D4AF37]" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {ann.sender?.name || 'Municipal Administrator'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#7A1B22]/10 dark:bg-[#D4AF37]/15 text-[#7A1B22] dark:text-[#D4AF37] font-bold text-[10px] uppercase">
                      Official Broadcast
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {new Date(ann.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <button
                      onClick={() => handleDeleteBroadcast(ann._id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-1 rounded cursor-pointer"
                      title="Delete announcement"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {cleanMessageText(ann.message)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminBroadcastCenter;
