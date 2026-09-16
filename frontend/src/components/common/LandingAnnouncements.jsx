import React from 'react';
import { motion } from 'framer-motion';
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
    desc: 'Operators can now directly print their claim stubs from the dashboard without visiting the office initially.',
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 80, damping: 15 }
  }
};

const LandingAnnouncements = () => {
  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
      className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative z-10"
    >
      
      <motion.div variants={cardVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight uppercase mb-2 drop-shadow-md">
            Municipal <span className="text-[#ffbd00]">Bulletin Board</span>
          </h2>
          <p className="text-[#f3efd0]/80 text-xs sm:text-sm font-medium">Latest advisories and updates from the LGU.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {announcements.map((item) => (
          <motion.div 
            key={item.id} 
            variants={cardVariants}
            whileHover={{ y: -5, scale: 1.02 }}
            className="flex flex-col p-6 rounded-3xl bg-gradient-to-br from-[#9b000a] to-[#730000] border border-[#ffbd00]/10 hover:border-[#ffbd00]/40 shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_15px_40px_-10px_rgba(255,189,0,0.2)] transition-all relative overflow-hidden group"
          >
            {/* Ambient glow effect inside card */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-10 group-hover:opacity-30 transition-opacity ${
              item.type === 'alert' ? 'bg-[#ffbd00]' :
              item.type === 'info' ? 'bg-white' :
              'bg-[#ffbd00]'
            }`} />

            <div className="flex justify-between items-center mb-4 relative z-10">
              <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-sm ${
                item.type === 'alert' ? 'bg-[#ffbd00]/20 text-[#ffbd00] border border-[#ffbd00]/30' :
                item.type === 'info' ? 'bg-white/20 text-[#f3efd0] border border-white/30' :
                'bg-[#ffbd00]/20 text-[#ffbd00] border border-[#ffbd00]/30'
              }`}>
                {item.icon}
                {item.type}
              </span>
              <span className="text-[10px] text-[#f3efd0]/60 font-bold tracking-wider">{item.date}</span>
            </div>
            
            <h3 className="font-bold text-white text-base mb-2.5 relative z-10">{item.title}</h3>
            <p className="text-[#f3efd0]/80 text-xs sm:text-sm leading-relaxed font-medium relative z-10">{item.desc}</p>
          </motion.div>
        ))}
      </div>

    </motion.div>
  );
};

export default LandingAnnouncements;
