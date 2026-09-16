import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ExternalLink, ShieldCheck, FileText, Lock } from 'lucide-react';
import TermsPolicyModal from './TermsPolicyModal';

const FacebookIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TwitterIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
  </svg>
);

const InstagramIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const AuthFooter = () => {
  const [showTermsModal, setShowTermsModal] = useState(false);

  return (
    <footer className="relative z-20 w-full bg-[#0a0102] border-t border-white/10 pt-12 pb-6 px-4 sm:px-6 lg:px-8 text-white/80">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Section: Multi-column links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Col 1: Brand / Description */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37]">
                <img src="/gasan-logo.png" alt="Gasan Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-lg text-white leading-tight">G-TRAMS</span>
                <span className="text-xs text-[#D4AF37] font-bold uppercase tracking-widest">Gasan Municipality</span>
              </div>
            </div>
            <p className="text-sm text-white/60 leading-relaxed max-w-xs mt-2">
              Simple, secure, and open access to local municipal services for every operator and citizen of Gasan, Marinduque.
            </p>
            <div className="flex gap-3 pt-2">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#1877F2] border border-white/10 hover:border-[#1877F2] flex items-center justify-center transition-all">
                <FacebookIcon size={16} className="text-white" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#1DA1F2] border border-white/10 hover:border-[#1DA1F2] flex items-center justify-center transition-all">
                <TwitterIcon size={16} className="text-white" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#E1306C] border border-white/10 hover:border-[#E1306C] flex items-center justify-center transition-all">
                <InstagramIcon size={16} className="text-white" />
              </a>
              <a href="https://gasan.gov.ph" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/5 hover:bg-emerald-600 border border-white/10 hover:border-emerald-600 flex items-center justify-center transition-all">
                <ExternalLink size={16} className="text-white" />
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Quick Links</h3>
            <ul className="space-y-3 text-sm text-white/60">
              <li><Link to="/" className="hover:text-[#D4AF37] transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#7A1B22]" /> Landing Page</Link></li>
              <li><Link to="/login" className="hover:text-[#D4AF37] transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#7A1B22]" /> Sign In</Link></li>
              <li><Link to="/register" className="hover:text-[#D4AF37] transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#7A1B22]" /> Create Account</Link></li>
              <li><a href="https://marinduque.gov.ph" target="_blank" rel="noreferrer" className="hover:text-[#D4AF37] transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Provincial Government</a></li>
            </ul>
          </div>

          {/* Col 3: Legal */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Legal</h3>
            <ul className="space-y-3 text-sm text-white/60">
              <li><button onClick={() => setShowTermsModal(true)} className="hover:text-[#D4AF37] transition-colors flex items-center gap-2 cursor-pointer"><Lock size={14} className="text-emerald-500" /> Privacy Policy</button></li>
              <li><button onClick={() => setShowTermsModal(true)} className="hover:text-[#D4AF37] transition-colors flex items-center gap-2 cursor-pointer"><FileText size={14} className="text-blue-400" /> Terms of Service</button></li>
              <li><button onClick={() => setShowTermsModal(true)} className="hover:text-[#D4AF37] transition-colors flex items-center gap-2 cursor-pointer"><ShieldCheck size={14} className="text-amber-500" /> Data Privacy Act</button></li>
            </ul>
          </div>

          {/* Col 4: Contact */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Contact</h3>
            <ul className="space-y-4 text-sm text-white/60">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-[#7A1B22] shrink-0 mt-0.5" />
                <span>Municipal Hall Compound,<br/>Gasan, Marinduque, Philippines</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-[#D4AF37] shrink-0" />
                <span>(042) 342-1234</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-emerald-500 shrink-0" />
                <span>bplo@gasan.gov.ph</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Section: Copyright */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40 font-medium">
          <p>© 2026 Municipality of Gasan. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs bg-white/5 px-2 py-1 rounded text-white/60">v2.4.0</span>
          </div>
        </div>
      </div>

      <TermsPolicyModal 
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        defaultLang="en"
        showAcceptButton={false}
      />
    </footer>
  );
};

export default AuthFooter;
