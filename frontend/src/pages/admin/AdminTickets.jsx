import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { Mail, CheckCircle, Clock, Search, XCircle, Send, MessageSquare } from 'lucide-react';

const AdminTickets = () => {
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
    fetchTickets();
  }, []);

  const handleStatusUpdate = async (ticketId, newStatus, responseMessage = '') => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, adminResponse: responseMessage })
      });
      if (res.ok) {
        setAdminResponse('');
        setSelectedTicket(null);
        fetchTickets();
      } else {
        alert('Failed to update ticket');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.operator?.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="w-full space-y-6 pb-24">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Help & Support Tickets</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage inquiries and support requests from operators.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search tickets..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#7A1B22] dark:focus:border-[#D4AF37]"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No tickets found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Operator</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTickets.map(ticket => (
                    <tr key={ticket._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{ticket.operator?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{ticket.contactNumber}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{ticket.subject}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{ticket.message}</p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          ticket.status === 'Open' ? 'bg-amber-100 text-amber-700' :
                          ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                          ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => setSelectedTicket(ticket)}
                          className="text-xs font-bold text-white bg-[#7A1B22] dark:bg-[#D4AF37] px-3 py-1.5 rounded-lg hover:brightness-110 transition-all"
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
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#7A1B22] dark:text-[#D4AF37]" />
                Ticket Details
              </h3>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-5 sm:p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{selectedTicket.operator?.name || 'Unknown'}</h4>
                    <p className="text-xs text-slate-500">{selectedTicket.contactNumber}</p>
                  </div>
                  <span className="text-xs text-slate-400">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                </div>
                <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-2 mb-1">{selectedTicket.subject}</h5>
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.message}
                </p>
              </div>

              {selectedTicket.adminResponse && (
                <div className="bg-[#7A1B22]/5 dark:bg-[#D4AF37]/5 p-4 rounded-2xl border border-[#7A1B22]/20 dark:border-[#D4AF37]/20">
                  <h4 className="font-bold text-xs text-[#7A1B22] dark:text-[#D4AF37] uppercase tracking-wide mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Previous Admin Response
                  </h4>
                  <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                    {selectedTicket.adminResponse}
                  </p>
                </div>
              )}

              {selectedTicket.status !== 'Resolved' && selectedTicket.status !== 'Closed' && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Reply to Ticket / Update Response</label>
                  <textarea 
                    rows="3" 
                    placeholder="Type your response here. This will be sent as a notification to the operator."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl p-3 text-sm outline-none focus:border-[#7A1B22] dark:focus:border-[#D4AF37] resize-none"
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                  ></textarea>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleStatusUpdate(selectedTicket._id, 'In Progress', adminResponse)}
                      disabled={isUpdating}
                      className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 font-bold text-sm rounded-xl transition-colors"
                    >
                      Mark In Progress
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(selectedTicket._id, 'Resolved', adminResponse)}
                      disabled={isUpdating || !adminResponse.trim()}
                      className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-300 font-bold text-sm rounded-xl transition-colors disabled:opacity-50"
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
