import React, { useState } from 'react';
import { useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import { AlertCircle, Lock, Loader2, MessageSquare, ArrowLeft, ShieldAlert } from 'lucide-react';
import FeedbackModal from '../components/common/FeedbackModal';
import { useLanguage } from '../context/LanguageContext';

const AccountDeactivated = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const state = location.state;
  
  // If no state is passed, redirect to login
  if (!state || !state.contact) {
    return <Navigate to="/login" replace />;
  }

  const { contact, reason, appealStatus: initialAppealStatus } = state;
  const [appealStatus, setAppealStatus] = useState(initialAppealStatus);
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || appealStatus === 'pending') return;

    if (!message.trim() || !password) {
      setFeedback({ type: 'warning', message: 'Please provide both an appeal message and your password.' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/appeal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, password, message })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAppealStatus('pending');
        setFeedback({ 
          type: 'success', 
          title: 'Appeal Submitted',
          message: 'Your appeal has been submitted successfully. The administrator will review it.' 
        });
        setMessage('');
        setPassword('');
      } else {
        setFeedback({ 
          type: 'error', 
          message: data.message || 'Failed to submit appeal. Please check your password.' 
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Cannot connect to the server.' });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-4 py-2.5 text-xs sm:text-sm text-[#1F1D1B] dark:text-white placeholder-[#6B6761] dark:placeholder-[#A8A29E] outline-none focus:border-[#9E2A2B] focus:ring-1 focus:ring-[#9E2A2B] transition-all font-medium min-h-[44px]";

  return (
    <div className="min-h-[100dvh] bg-[#F6F5F3] dark:bg-[#14110F] flex flex-col items-center justify-center p-4">
      {feedback && (
        <FeedbackModal
          isOpen={true}
          type={feedback.type}
          title={feedback.title || (feedback.type === 'error' ? 'Error' : 'Notice')}
          message={feedback.message}
          onClose={() => setFeedback(null)}
          onConfirm={() => setFeedback(null)}
        />
      )}

      <div className="w-full max-w-md bg-white dark:bg-[#1C1917] rounded-lg shadow-xl overflow-hidden border border-[#E4E1DC] dark:border-[#2E2A27]">
        <div className="bg-red-500/10 p-5 sm:p-6 flex flex-col items-center text-center border-b border-red-500/20">
          <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mb-3">
            <ShieldAlert size={28} className="text-[#B91C1C]" />
          </div>
          <h1 className="text-lg font-bold text-[#B91C1C] mb-1.5">Account Deactivated</h1>
          <p className="text-xs text-[#1F1D1B] dark:text-[#EAE7E1] font-medium bg-white/70 dark:bg-black/30 px-3.5 py-1.5 rounded-md border border-red-500/20">
            Dahilan: {reason || 'No reason provided'}
          </p>
        </div>

        <div className="p-5 sm:p-6">
          {appealStatus === 'pending' ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500/15 rounded-full mb-3">
                <AlertCircle size={22} className="text-amber-700 dark:text-amber-400" />
              </div>
              <h2 className="text-base font-bold text-[#1F1D1B] dark:text-white mb-1.5">Kasalukuyang Sinusuri ang Apela</h2>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mb-6 leading-relaxed">
                Naipasa na ang inyong apela at kasalukuyan itong sinusuri ng Municipal Administrator. Magpapadala ng abiso sa inyong rehistradong contact number.
              </p>
              <Link 
                to="/login"
                className="inline-flex items-center gap-2 text-[#9E2A2B] dark:text-[#D4AF37] font-bold text-xs uppercase tracking-wider hover:underline min-h-[44px]"
              >
                <ArrowLeft size={16} /> Bumalik sa Log In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mb-3 text-center leading-relaxed">
                Kung sa tingin ninyo ay nagkaroon ng pagkakamali, maaari kayong magsumite ng opisyal na apela gamit ang form sa ibaba.
              </p>

              <div>
                <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] uppercase mb-1.5">
                  Mensahe ng Apela (Appeal Message)
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 text-[#6B6761] dark:text-[#A8A29E]">
                    <MessageSquare size={18} />
                  </div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ipaliwanag kung bakit dapat i-reactivate ang inyong account..."
                    className={`${inputClasses} pl-10 min-h-[100px] resize-none`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] uppercase mb-1.5">
                  Verify Password
                </label>
                <div className="relative">
                  <div className="absolute top-1/2 -translate-y-1/2 left-3 text-[#6B6761] dark:text-[#A8A29E]">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ilagay ang inyong password para sa verification"
                    className={`${inputClasses} pl-10`}
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link 
                  to="/login"
                  className="flex-1 flex justify-center items-center py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider bg-[#F6F5F3] hover:bg-[#E4E1DC] dark:bg-[#14110F] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#EAE7E1] border border-[#E4E1DC] dark:border-[#2E2A27] transition-colors min-h-[44px]"
                >
                  Kanselahin
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider text-white bg-[#9E2A2B] hover:bg-[#7A1B22] disabled:opacity-50 transition-colors shadow-xs min-h-[44px] cursor-pointer"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Ipasa ang Apela'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountDeactivated;
