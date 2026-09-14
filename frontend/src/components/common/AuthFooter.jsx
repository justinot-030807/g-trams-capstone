import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ExternalLink, ShieldCheck, FileText, Lock } from 'lucide-react';
import PublicStats from './PublicStats';

const FacebookIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const AuthFooter = () => {
  return (
    <>
      <PublicStats />
      <footer className="relative z-20 w-full bg-[#0a0102] border-t border-white/10 pt-12 pb-6 px-4 sm:px-6 lg:px-8 text-white/80">

      <div className="max-w-7xl mx-auto">
        
        {/* Top Section: Multi-column links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Col 1: Brand / Description */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full p-1 border-2 border-[#D4AF37]">
                <img src="/gasan-logo.png" alt="Gasan Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-lg text-white leading-tight">G-TRAMS</span>
                <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">Gasan Municipality</span>
              </div>
            </div>
            <p className="text-sm text-white/60 leading-relaxed max-w-xs mt-2">
              Simple, ligtas, at bukas na access sa lokal na serbisyo para sa bawat operator at mamamayan ng Gasan, Marinduque.
            </p>
            <div className="flex gap-3 pt-2">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#1877F2] border border-white/10 hover:border-[#1877F2] flex items-center justify-center transition-all">
                <FacebookIcon size={16} className="text-white" />
              </a>
              <a href="https://gasan.gov.ph" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/5 hover:bg-emerald-600 border border-white/10 hover:border-emerald-600 flex items-center justify-center transition-all">
                <ExternalLink size={16} className="text-white" />
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Mabilis na Links</h3>
            <ul className="space-y-3 text-sm text-white/60">
              <li><Link to="/" className="hover:text-[#D4AF37] transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#7A1B22]" /> Landing Page</Link></li>
              <li><Link to="/login" className="hover:text-[#D4AF37] transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#7A1B22]" /> Mag-Login</Link></li>
              <li><Link to="/register" className="hover:text-[#D4AF37] transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#7A1B22]" /> Gumawa ng Account</Link></li>
              <li><a href="https://marinduque.gov.ph" target="_blank" rel="noreferrer" className="hover:text-[#D4AF37] transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Pamahalaang Panlalawigan</a></li>
            </ul>
          </div>

          {/* Col 3: Legal */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Legal</h3>
            <ul className="space-y-3 text-sm text-white/60">
              <li><button className="hover:text-[#D4AF37] transition-colors flex items-center gap-2 cursor-pointer"><Lock size={14} className="text-emerald-500" /> Patakaran sa Privacy</button></li>
              <li><button className="hover:text-[#D4AF37] transition-colors flex items-center gap-2 cursor-pointer"><FileText size={14} className="text-blue-400" /> Kasunduan sa Serbisyo</button></li>
              <li><button className="hover:text-[#D4AF37] transition-colors flex items-center gap-2 cursor-pointer"><ShieldCheck size={14} className="text-amber-500" /> Data Privacy Act</button></li>
            </ul>
          </div>

          {/* Col 4: Contact */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Kontak</h3>
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
          <p>© 2026 Pamahalaang Bayan ng Gasan. Lahat ng karapatan ay reserbado.</p>
          <div className="flex items-center gap-4">
            <span className="font-black text-white/80 tracking-widest uppercase">BAGONG PILIPINAS</span>
            <span className="font-mono text-[10px] bg-white/5 px-2 py-1 rounded">v2.4.0</span>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
};

export default AuthFooter;
