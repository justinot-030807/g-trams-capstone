import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { Mail, CheckCircle, Search, XCircle, MessageSquare, Megaphone } from 'lucide-react';
import AdminLiveChat from '../../components/admin/AdminLiveChat';
import AdminBroadcastCenter from '../../components/admin/AdminBroadcastCenter';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';

const AdminTickets = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setTickets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTickets();
  }, []);

  const handleStatusUpdate = async (ticketId, newStatus, responseMessage = '') => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const payload = { status: newStatus };
      if (responseMessage && responseMessage.trim()) {
        payload.adminResponse = responseMessage.trim();
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setAdminResponse('');
        setSelectedTicket(null);
        fetchTickets();
      } else {
        alert('Failed to update ticket');
      }
    } catch {
      alert('Network error');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredTickets = tickets.filter(t => 
    (t.subject || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.operator?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.status || '').toLowerCase().includes(search.toLowerCase())
  );

  const openTicketsCount = tickets.filter(t => t.status === 'Open').length;

  return (
    <MainLayout>
      <div className="w-full space-y-6 pb-24">
        {/* Page Header */}
        <PageHeader 
          title="Communications & Support"
          subtitle="Manage live operator chats, broadcast municipal announcements, and resolve tickets."
          actions={
            activeTab === 'tickets' ? (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6761] dark:text-[#A8A29E]" size={15} />
                <input 
                  type="text" 
                  placeholder="Search tickets..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-1.5 bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3] placeholder-[#6B6761] dark:placeholder-[#A8A29E] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] transition-colors"
                />
              </div>
            ) : null
          }
        />

        {/* Tab Navigation */}
        <div className="flex gap-2 sm:gap-4 border-b border-[#E4E1DC] dark:border-[#2E2A27] overflow-x-auto pb-px">
          <button 
            onClick={() => setActiveTab('chat')} 
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'chat' 
                ? 'border-[#9E2A2B] text-[#9E2A2B] dark:border-[#D4AF37] dark:text-[#D4AF37]' 
                : 'border-transparent text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
            }`}
          >
            <MessageSquare size={16} />
            <span>Live Chat</span>
          </button>
          <button 
            onClick={() => setActiveTab('broadcast')} 
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'broadcast' 
                ? 'border-[#9E2A2B] text-[#9E2A2B] dark:border-[#D4AF37] dark:text-[#D4AF37]' 
                : 'border-transparent text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
            }`}
          >
            <Megaphone size={16} />
            <span>Broadcast Announcements</span>
          </button>
          <button 
            onClick={() => setActiveTab('tickets')} 
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'tickets' 
                ? 'border-[#9E2A2B] text-[#9E2A2B] dark:border-[#D4AF37] dark:text-[#D4AF37]' 
                : 'border-transparent text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
            }`}
          >
            <Mail size={16} />
            <span>Support Tickets</span>
            {openTicketsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold tabular-nums bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                {openTicketsCount}
              </span>
            )}
          </button>
        </div>

        {/* Content by Active Tab */}
        {activeTab === 'chat' && (
          <div className="w-full">
            <AdminLiveChat />
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="w-full">
            <AdminBroadcastCenter />
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-[#6B6761] dark:text-[#A8A29E]">Loading tickets...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B6761] dark:text-[#A8A29E]">No tickets found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F6F5F3] dark:bg-[#14110F] border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                      <th className="p-3.5 text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Date</th>
                      <th className="p-3.5 text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Operator</th>
                      <th className="p-3.5 text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Subject</th>
                      <th className="p-3.5 text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider">Status</th>
                      <th className="p-3.5 text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
                    {filteredTickets.map(ticket => (
                      <tr key={ticket._id} className="hover:bg-[#F6F5F3]/60 dark:hover:bg-[#14110F]/60 transition-colors">
                        <td className="p-3.5 text-xs text-[#6B6761] dark:text-[#A8A29E] font-mono tabular-nums">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3.5">
                          <p className="text-sm font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{ticket.operator?.name || 'Unknown'}</p>
                          <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-mono">{ticket.contactNumber}</p>
                        </td>
                        <td className="p-3.5">
                          <p className="text-sm font-medium text-[#1F1D1B] dark:text-[#F6F5F3]">{ticket.subject}</p>
                          <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] truncate max-w-[240px]">{ticket.message}</p>
                        </td>
                        <td className="p-3.5">
                          <StatusBadge 
                            status={
                              ticket.status === 'Resolved' ? 'Active' :
                              ticket.status === 'Open' || ticket.status === 'In Progress' ? 'Pending' :
                              'Cancelled'
                            }
                            label={ticket.status}
                          />
                        </td>
                        <td className="p-3.5 text-right">
                          <button 
                            onClick={() => setSelectedTicket(ticket)}
                            className="text-xs font-medium text-white bg-[#9E2A2B] hover:bg-[#7A1B22] px-3 py-1.5 rounded-lg active:scale-95 transition-all shadow-xs cursor-pointer"
                          >
                            View / Reply
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-[#1C1917] rounded-lg w-full max-w-lg overflow-hidden border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xl">
            <div className="p-4 sm:p-5 border-b border-[#E4E1DC] dark:border-[#2E2A27] flex justify-between items-center bg-[#F6F5F3] dark:bg-[#14110F]">
              <h3 className="font-semibold text-base text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#9E2A2B] dark:text-[#D4AF37]" />
                Ticket Details
              </h3>
              <button 
                onClick={() => setSelectedTicket(null)} 
                className="text-[#6B6761] hover:text-[#9E2A2B] dark:text-[#A8A29E] dark:hover:text-[#D4AF37] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-5 space-y-4">
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-4 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-sm text-[#1F1D1B] dark:text-[#F6F5F3]">{selectedTicket.operator?.name || 'Unknown'}</h4>
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-mono">{selectedTicket.contactNumber}</p>
                  </div>
                  <span className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-mono tabular-nums">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                </div>
                <h5 className="font-semibold text-sm text-[#1F1D1B] dark:text-[#F6F5F3] mt-2 mb-1">{selectedTicket.subject}</h5>
                <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.message}
                </p>
              </div>

              {selectedTicket.adminResponse && (
                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900/40">
                  <h4 className="font-semibold text-xs text-amber-800 dark:text-amber-300 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Previous Admin Response
                  </h4>
                  <p className="text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3] whitespace-pre-wrap">
                    {selectedTicket.adminResponse}
                  </p>
                </div>
              )}

              {selectedTicket.status !== 'Resolved' && selectedTicket.status !== 'Closed' && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">Reply to Ticket / Update Response</label>
                  <textarea 
                    rows="3" 
                    placeholder="Type your response here. This will be sent as a notification to the operator."
                    className="w-full bg-white dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-3 text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] resize-none"
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                  ></textarea>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleStatusUpdate(selectedTicket._id, 'In Progress', adminResponse)}
                      disabled={isUpdating}
                      className="flex-1 py-2 bg-[#F6F5F3] hover:bg-[#E4E1DC] text-[#1F1D1B] dark:bg-[#2E2A27] dark:hover:bg-[#3D3834] dark:text-[#F6F5F3] border border-[#E4E1DC] dark:border-[#2E2A27] font-semibold text-xs sm:text-sm rounded-lg transition-colors cursor-pointer"
                    >
                      Mark In Progress
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(selectedTicket._id, 'Resolved', adminResponse)}
                      disabled={isUpdating || !adminResponse.trim()}
                      className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Resolve & Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default AdminTickets;
