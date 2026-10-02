import React, { useState, useEffect, useCallback } from 'react';
import { 
  Radio, Send, Loader2, Megaphone, Trash2, CheckCircle, 
  AlertCircle, Users, Clock, Bold, List, AlertTriangle, Eye, EyeOff, Filter
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { TODA_LIST } from '../../utils/constants';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Franchise Statuses' },
  { value: 'Pending', label: 'Pending Applications' },
  { value: 'For Signing', label: 'For Signing' },
  { value: 'Ready for Pickup', label: 'Ready for Pickup' },
  { value: 'Active', label: 'Active Franchises' },
  { value: 'Expired', label: 'Expired Franchises' },
  { value: 'Revoked', label: 'Revoked Franchises' },
];

// Export rich announcement renderer for use in chat and announcement feeds
export const renderFormattedAnnouncement = (text) => {
  if (!text) return null;
  const lines = text.split('\n');

  const parseBoldText = (str) => {
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-1.5 leading-relaxed text-xs sm:text-sm">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Important notice highlight banner
        if (
          trimmed.startsWith('🚨') || 
          trimmed.toUpperCase().includes('[IMPORTANT NOTICE]') || 
          trimmed.toUpperCase().includes('[PAALALA]') ||
          trimmed.toUpperCase().includes('[NOTICE]')
        ) {
          return (
            <div 
              key={idx} 
              className="my-1.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 font-bold flex items-start gap-2 shadow-xs"
            >
              <span className="text-base shrink-0 mt-0.5">🚨</span>
              <span className="flex-1">{trimmed.replace(/^🚨\s*/, '')}</span>
            </div>
          );
        }

        // Bullet point item
        if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = trimmed.replace(/^[•\-\*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-[#9E2A2B] dark:text-[#D4AF37] font-black text-sm shrink-0 leading-none mt-0.5">•</span>
              <span className="flex-1 text-slate-800 dark:text-slate-200">{parseBoldText(content)}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="text-slate-800 dark:text-slate-200">
            {parseBoldText(line)}
          </p>
        );
      })}
    </div>
  );
};

const AdminBroadcastCenter = () => {
  const { socket } = useSocket();
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [announcementThreadId, setAnnouncementThreadId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [targetToda, setTargetToda] = useState('ALL');
  const [targetStatus, setTargetStatus] = useState('ALL');

  const insertFormatting = (prefix, suffix = '') => {
    const textarea = document.getElementById('broadcast-composer-textarea');
    if (!textarea) {
      setBroadcastMessage(prev => prev + prefix + suffix);
      return;
    }
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const current = textarea.value;
    const selected = current.substring(start, end);
    const replacement = prefix + (selected || 'text') + suffix;
    const updated = current.substring(0, start) + replacement + current.substring(end);
    setBroadcastMessage(updated);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 50);
  };

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

    const audienceDesc = targetToda === 'ALL' && targetStatus === 'ALL'
      ? 'all registered operators and TODA presidents'
      : `${targetToda === 'ALL' ? 'All TODAs' : `TODA: ${targetToda}`}${targetStatus === 'ALL' ? '' : ` (${targetStatus} status)`}`;

    if (!window.confirm(`Are you sure you want to broadcast this announcement to ${audienceDesc}?`)) {
      return;
    }

    setIsBroadcasting(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/chat/broadcast`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ 
          message: text,
          targetToda,
          targetStatus
        })
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setBroadcastMessage('');
        showToast(data.message || `Announcement broadcasted to ${audienceDesc}!`);
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
        showToast('Failed to delete announcement', 'error');
      }
    } catch {
      showToast('Network error deleting announcement', 'error');
    }
  };

  const cleanMessageText = (raw) => {
    if (!raw) return '';
    return raw.replace(/^\[ANNOUNCEMENT[^\]]*\]\s*/i, '').trim();
  };

  const getTargetBadge = (ann) => {
    if (ann.targetToda && (ann.targetToda !== 'ALL' || (ann.targetStatus && ann.targetStatus !== 'ALL'))) {
      const parts = [];
      if (ann.targetToda && ann.targetToda !== 'ALL') parts.push(ann.targetToda);
      if (ann.targetStatus && ann.targetStatus !== 'ALL') parts.push(ann.targetStatus);
      return parts.join(' • ');
    }
    const match = ann.message?.match(/^\[ANNOUNCEMENT\s*-\s*([^\]]+)\]/i);
    if (match) {
      return match[1];
    }
    return null;
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`p-3.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 ${
          toastMessage.type === 'error' 
            ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60' 
            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
        }`}>
          {toastMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Broadcast Composer Section */}
      <div className="bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] p-4 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0 border border-[#9E2A2B]/20 dark:border-[#D4AF37]/30">
            <Megaphone size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
              Create System Broadcast Announcement
            </h2>
            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
              Dispatches an immediate notification and announcement to all registered operators and TODA associations.
            </p>
          </div>
        </div>

        {/* Target Audience Controls */}
        <div className="mb-4 p-3.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-[#9E2A2B] dark:text-[#D4AF37] shrink-0" />
              <span className="font-semibold text-xs text-[#1F1D1B] dark:text-[#F6F5F3]">
                Audience Targeting Filters
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-[#6B6761] dark:text-[#A8A29E]">Selected Scope:</span>
              <span className={`px-2 py-0.5 rounded font-semibold uppercase tracking-wider text-[10px] border ${
                targetToda === 'ALL' && targetStatus === 'ALL'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/60'
              }`}>
                {targetToda === 'ALL' && targetStatus === 'ALL' ? 'LGU-Wide (All Operators)' : 'Targeted Group'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] mb-1">
                Target TODA Association
              </label>
              <select
                value={targetToda}
                onChange={(e) => setTargetToda(e.target.value)}
                className="w-full bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3 py-1.5 text-xs font-medium text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] transition-colors cursor-pointer"
              >
                <option value="ALL">All TODA Associations (LGU-Wide)</option>
                {TODA_LIST.map((toda) => (
                  <option key={toda} value={toda}>{toda}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] mb-1">
                Target Franchise Status
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3 py-1.5 text-xs font-medium text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] transition-colors cursor-pointer"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {(targetToda !== 'ALL' || targetStatus !== 'ALL') && (
            <div className="flex items-center gap-2 pt-1 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/40">
              <AlertCircle size={14} className="shrink-0" />
              <span>
                Targeted Broadcast: Only operators registered in <strong>{targetToda === 'ALL' ? 'all TODAs' : targetToda}</strong> with status <strong>{targetStatus === 'ALL' ? 'any status' : targetStatus}</strong> will receive push notifications and inbox alerts.
              </span>
            </div>
          )}
        </div>

        {/* Composer Form */}
        <form onSubmit={handleBroadcast} className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <label className="block text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                Announcement Message
              </label>
              
              {/* Rich Formatting Toolbar */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => insertFormatting('**', '**')}
                  className="px-2 py-1 rounded text-xs font-medium bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#E4E1DC] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] border border-[#E4E1DC] dark:border-[#2E2A27] transition-colors flex items-center gap-1 cursor-pointer"
                  title="Make text bold (**text**)"
                >
                  <Bold size={13} />
                  <span>Bold</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('\n• ')}
                  className="px-2 py-1 rounded text-xs font-medium bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#E4E1DC] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] border border-[#E4E1DC] dark:border-[#2E2A27] transition-colors flex items-center gap-1 cursor-pointer"
                  title="Add bullet list (• item)"
                >
                  <List size={13} />
                  <span>List</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('\n🚨 [IMPORTANT NOTICE]: ')}
                  className="px-2 py-1 rounded text-xs font-medium bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Insert Important Notice callout"
                >
                  <AlertTriangle size={13} />
                  <span>Notice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer border ${
                    showPreview
                      ? 'bg-[#9E2A2B] text-white border-[#9E2A2B]'
                      : 'bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#E4E1DC] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] border-[#E4E1DC] dark:border-[#2E2A27]'
                  }`}
                  title="Toggle announcement preview"
                >
                  {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{showPreview ? 'Edit' : 'Preview'}</span>
                </button>
              </div>
            </div>

            {showPreview ? (
              <div className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-4 min-h-[110px]">
                <p className="text-[10px] font-semibold uppercase text-[#6B6761] dark:text-[#A8A29E] mb-2 tracking-wider">Live Preview</p>
                {broadcastMessage.trim() ? (
                  renderFormattedAnnouncement(broadcastMessage)
                ) : (
                  <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] italic">No announcement text typed yet...</p>
                )}
              </div>
            ) : (
              <textarea
                id="broadcast-composer-textarea"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={4}
                placeholder="Type your official announcement here... (e.g. Please be reminded of the upcoming annual franchise inspection at the Municipal Hall grounds.)"
                required
                className="w-full bg-white dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-3 text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3] placeholder-[#6B6761] dark:placeholder-[#A8A29E] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] transition-colors resize-none leading-relaxed"
              />
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <span className="text-xs text-[#6B6761] dark:text-[#A8A29E] order-2 sm:order-1 font-mono tabular-nums">
              {broadcastMessage.length} characters
            </span>

            <button
              type="submit"
              disabled={!broadcastMessage.trim() || isBroadcasting}
              className="w-full sm:w-auto px-5 py-2 rounded-lg bg-[#9E2A2B] hover:bg-[#7A1B22] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer order-1 sm:order-2"
            >
              {isBroadcasting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Broadcasting Announcement...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>{targetToda === 'ALL' && targetStatus === 'ALL' ? 'Send Broadcast to All' : 'Send Targeted Broadcast'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Broadcast History Section */}
      <div className="bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] p-4 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
            <h3 className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
              Broadcast History ({announcements.length})
            </h3>
          </div>
          <span className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
            Past announcements sent to operators
          </span>
        </div>

        {isLoadingHistory ? (
          <div className="text-center py-10 text-[#6B6761] dark:text-[#A8A29E] text-xs">
            <Loader2 size={18} className="animate-spin mx-auto mb-2" />
            Loading previous announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 text-[#6B6761] dark:text-[#A8A29E]">
            <Megaphone size={28} className="mx-auto mb-2 text-[#6B6761] dark:text-[#A8A29E]" />
            <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">No broadcasts sent yet</p>
            <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] mt-0.5">Use the composer above to broadcast an official announcement.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann._id}
                className="p-3.5 rounded-lg bg-[#F6F5F3]/60 dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] hover:border-[#9E2A2B]/40 transition-colors relative group"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-2 h-2 rounded-full bg-[#9E2A2B] dark:bg-[#D4AF37]" />
                    <span className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                      {ann.sender?.name || 'Municipal Administrator'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37] font-semibold text-[10px] uppercase border border-[#9E2A2B]/20 dark:border-[#D4AF37]/30">
                      Official Broadcast
                    </span>
                    {(() => {
                      const target = getTargetBadge(ann);
                      if (!target) return null;
                      return (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold text-[10px] border border-amber-300 dark:border-amber-800/60 flex items-center gap-1">
                          <Filter size={10} />
                          <span>{target}</span>
                        </span>
                      );
                    })()}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-mono tabular-nums">
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
                      className="opacity-0 group-hover:opacity-100 text-[#6B6761] hover:text-red-600 transition-opacity p-1 rounded cursor-pointer"
                      title="Delete announcement"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3] leading-relaxed">
                  {renderFormattedAnnouncement(cleanMessageText(ann.message))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminBroadcastCenter;
