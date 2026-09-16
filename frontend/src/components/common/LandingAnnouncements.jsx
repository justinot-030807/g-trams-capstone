import React from 'react';
import { Megaphone, Calendar, AlertTriangle } from 'lucide-react';

const announcements = [
  {
    id: 1,
    type: 'alert',
    date: 'Dec 15, 2024',
    title: 'Deadline for 2025 Renewal',
    desc: 'All existing MTOP holders must submit their renewal applications before December 31, 2024 to avoid penalties.',
    icon: <AlertTriangle size={16} />
  },
  {
    id: 2,
    type: 'info',
    date: 'Nov 20, 2024',
    title: 'New Online Claim Stub System',
    desc: 'Operators can now directly print their claim stubs from the dashboard without visiting the BPLO office initially.',
    icon: <Megaphone size={16} />
  },
  {
    id: 3,
    type: 'event',
    date: 'Oct 05, 2024',
    title: 'Holiday Schedule Notice',
    desc: 'The Municipal Office will be closed on Oct 31 to Nov 1. Online submissions will still be accepted but validated next working day.',
    icon: <Calendar size={16} />
  }
];

const LandingAnnouncements = () => {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative z-10">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase mb-1">
            BPLO <span className="text-[#D4AF37]">Bulletin Board</span>
          </h2>
          <p className="text-white/60 text-xs sm:text-sm">Latest advisories and updates from the LGU.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {announcements.map((item) => (
          <div 
            key={item.id} 
            className="flex flex-col p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors"
          >
            <div className="flex justify-between items-center mb-3">
              <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                item.type === 'alert' ? 'bg-red-500/20 text-red-300' :
                item.type === 'info' ? 'bg-blue-500/20 text-blue-300' :
                'bg-[#D4AF37]/20 text-[#D4AF37]'
              }`}>
                {item.icon}
                {item.type}
              </span>
              <span className="text-[10px] text-white/40 font-semibold">{item.date}</span>
            </div>
            
            <h3 className="font-bold text-white text-sm mb-2">{item.title}</h3>
            <p className="text-white/60 text-xs leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

    </div>
  );
};

export default LandingAnnouncements;
