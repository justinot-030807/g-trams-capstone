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

  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-4 focus:ring-[#7A1B22]/10 transition-all font-medium";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      {feedback && (
        <FeedbackModal
          type={feedback.type}
          title={feedback.title}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="bg-red-50 dark:bg-red-900/30 p-6 flex flex-col items-center text-center border-b border-red-100 dark:border-red-800">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert size={32} className="text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Account Deactivated</h1>
          <p className="text-sm text-red-600 dark:text-red-300 font-medium bg-white/50 dark:bg-black/20 px-4 py-2 rounded-lg">
            Reason: {reason || 'No reason provided'}
          </p>
        </div>

        <div className="p-6">
          {appealStatus === 'pending' ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
                <AlertCircle size={24} className="text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Appeal Pending Review</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Your appeal has been submitted and is currently under review by an administrator. You will be notified of the decision.
              </p>
              <Link 
                to="/login"
                className="inline-flex items-center gap-2 text-[#7A1B22] dark:text-red-400 font-bold hover:underline"
              >
                <ArrowLeft size={16} /> Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 text-center">
                If you believe this is a mistake, you can submit an appeal using the form below.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Appeal Message
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 text-slate-400">
                    <MessageSquare size={18} />
                  </div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Explain why your account should be reactivated..."
                    className={`${inputClasses} pl-10 min-h-[100px] resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-white`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Verify Password
                </label>
                <div className="relative">
                  <div className="absolute top-1/2 -translate-y-1/2 left-3 text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password to verify"
                    className={`${inputClasses} pl-10 dark:bg-slate-900 dark:border-slate-700 dark:text-white`}
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link 
                  to="/login"
                  className="flex-1 flex justify-center items-center py-2.5 px-4 rounded-xl font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm text-white bg-[#7A1B22] hover:bg-[#8E2028] disabled:opacity-50 transition-colors shadow-md"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Submit Appeal'}
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
