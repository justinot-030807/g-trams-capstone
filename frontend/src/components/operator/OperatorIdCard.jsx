import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../../context/LanguageContext';
import { ShieldCheck, MapPin, Phone, Award, User, RefreshCw, Smartphone } from 'lucide-react';

const OperatorIdCard = ({ user }) => {
  const { t } = useLanguage();
  const [isFlipped, setIsFlipped] = useState(false);

  const safeUser = user || {
    name: 'Operator Name',
    todaAssociation: 'NON-TODA',
    address: 'Municipality of Gasan',
    contact: 'N/A',
    role: 'operator',
    emergencyContact: 'Not Provided'
  };

  const qrData = `${window.location.origin}/verify/${safeUser._id || 'demo-id'}`;

  return (
    <div className="w-full max-w-sm mx-auto group" style={{ perspective: '1000px' }}>
      <div 
        className={"relative w-full h-[400px] transition-transform duration-700 cursor-pointer "}
        style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front of ID */}
        <div 
          className="absolute inset-0 w-full h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-[#D4AF37] rounded-3xl overflow-hidden shadow-xl flex flex-col"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Header */}
          <div className="bg-[#7A1B22] p-4 flex items-center justify-between border-b-4 border-[#D4AF37]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-[#D4AF37]" size={24} />
              <div>
                <h3 className="text-white font-bold text-xs leading-tight tracking-wider uppercase">LGU Gasan</h3>
                <p className="text-[#D4AF37] text-[10px] font-semibold uppercase tracking-widest">Digital Operator ID</p>
              </div>
            </div>
            <img src="/gasan-logo.png" alt="LGU Gasan" className="w-10 h-10 object-contain opacity-90" onError={(e) => e.target.style.display = 'none'} />
          </div>

          {/* Photo & Name */}
          <div className="flex-1 flex flex-col items-center justify-center p-5 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl" />
            <div className="w-28 h-28 rounded-full border-4 border-[#D4AF37] bg-slate-800 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(212,175,55,0.3)] overflow-hidden relative z-10">
              {safeUser.profilePic ? (
                <img src={safeUser.profilePic} alt={safeUser.name} className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-[#D4AF37]/50" />
              )}
            </div>
            <h2 className="text-xl font-bold text-white text-center tracking-tight mb-1 relative z-10">{safeUser.name}</h2>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 relative z-10">
              <Award size={12} className="text-[#D4AF37]" />
              <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                {safeUser.role === 'toda president' ? 'TODA President' : 'Registered Operator'}
              </span>
            </div>
          </div>

          {/* Footer Info */}
          <div className="bg-slate-900/80 p-4 border-t border-slate-700 backdrop-blur-sm">
            <div className="flex justify-between items-end">
              <div className="space-y-1.5">
                <p className="flex items-center gap-1.5 text-xs text-slate-300">
                  <MapPin size={12} className="text-[#D4AF37]" /> {safeUser.todaAssociation}
                </p>
                <p className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <Smartphone size={12} className="text-[#D4AF37]" /> {safeUser.contact || 'No Contact'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-0.5">Tap to flip</p>
                <RefreshCw size={14} className="text-slate-400 inline-block animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Back of ID */}
        <div 
          className="absolute inset-0 w-full h-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-xl flex flex-col items-center justify-center p-6"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="text-center mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Official LGU QR Code</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Scan to verify operator credentials</p>
          </div>
          
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6">
            <QRCodeSVG value={qrData} size={160} level="H" includeMargin={false} />
          </div>

          <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-700">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">In case of emergency</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
              <Phone size={12} className="text-red-500" /> {safeUser.emergencyContact || 'Not Provided'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorIdCard;
