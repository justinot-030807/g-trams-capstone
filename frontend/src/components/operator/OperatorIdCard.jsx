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
          className="absolute inset-0 w-full h-full bg-[#1C1917] border-2 border-[#D4AF37] rounded-lg overflow-hidden shadow-md flex flex-col"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Header */}
          <div className="bg-[#9E2A2B] p-4 flex items-center justify-between border-b-2 border-[#D4AF37]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-[#D4AF37]" size={22} />
              <div>
                <h3 className="text-white font-bold text-xs leading-tight tracking-wider uppercase">LGU Gasan</h3>
                <p className="text-[#D4AF37] text-[11px] font-semibold uppercase tracking-widest">Digital Operator ID</p>
              </div>
            </div>
            <img src="/gasan-logo.png" alt="LGU Gasan" className="w-9 h-9 object-contain opacity-90" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>

          {/* Photo & Name */}
          <div className="flex-1 flex flex-col items-center justify-center p-5 relative">
            <div className="w-24 h-24 rounded-full border-2 border-[#D4AF37] bg-[#14110F] flex items-center justify-center mb-3 shadow-inner overflow-hidden relative z-10">
              {safeUser.profilePic ? (
                <img src={safeUser.profilePic} alt={safeUser.name} className="w-full h-full object-cover" />
              ) : (
                <User size={42} className="text-[#D4AF37]/60" />
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#F6F5F3] text-center tracking-tight mb-1 relative z-10">{safeUser.name}</h2>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 relative z-10">
              <Award size={12} className="text-[#D4AF37]" />
              <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
                {safeUser.role === 'toda president' ? 'TODA President' : 'Registered Operator'}
              </span>
            </div>
          </div>

          {/* Footer Info */}
          <div className="bg-[#14110F] p-3.5 border-t border-[#2E2A27]">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-xs text-[#EAE7E1]">
                  <MapPin size={12} className="text-[#D4AF37]" /> {safeUser.todaAssociation}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-[#A8A29E]">
                  <Smartphone size={12} className="text-[#D4AF37]" /> {safeUser.contact || 'No Contact'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-[#A8A29E] uppercase tracking-widest mb-0.5">Tap to flip</p>
                <RefreshCw size={13} className="text-[#D4AF37] inline-block animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Back of ID */}
        <div 
          className="absolute inset-0 w-full h-full bg-white dark:bg-[#1C1917] border-2 border-[#D4AF37] rounded-lg overflow-hidden shadow-md flex flex-col items-center justify-center p-6"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="text-center mb-4">
            <h3 className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3] uppercase tracking-wider text-xs sm:text-sm mb-0.5">Official LGU QR Code</h3>
            <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">Scan to verify operator credentials</p>
          </div>
          
          <div className="bg-white p-3.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-2xs mb-4">
            <QRCodeSVG value={qrData} size={150} level="H" includeMargin={false} />
          </div>

          <div className="w-full bg-[#F6F5F3] dark:bg-[#14110F] rounded-lg p-2.5 text-center border border-[#E4E1DC] dark:border-[#2E2A27]">
            <p className="text-[10px] text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider mb-0.5">In case of emergency</p>
            <p className="text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3] flex items-center justify-center gap-1">
              <Phone size={12} className="text-[#B91C1C]" /> {safeUser.emergencyContact || 'Not Provided'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorIdCard;
