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
            Municipal <span className="text-[#D4AF37]">Bulletin Board</span>
          </h2>
          <p className="text-white/60 text-xs sm:text-sm font-medium">Latest advisories and updates from the LGU.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {announcements.map((item) => (
          <motion.div 
            key={item.id} 
            variants={cardVariants}
            whileHover={{ y: -5, scale: 1.02 }}
            className="flex flex-col p-6 rounded-3xl bg-linear-to-bl from-white/10 to-white/5 backdrop-blur-lg border border-white/10 hover:border-white/30 shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-colors relative overflow-hidden group"
          >
            {/* Ambient glow effect inside card */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity ${
              item.type === 'alert' ? 'bg-red-500' :
              item.type === 'info' ? 'bg-blue-500' :
              'bg-[#D4AF37]'
            }`} />

            <div className="flex justify-between items-center mb-4 relative z-10">
              <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-sm ${
                item.type === 'alert' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                item.type === 'info' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30'
              }`}>
                {item.icon}
                {item.type}
              </span>
              <span className="text-[10px] text-white/50 font-bold tracking-wider">{item.date}</span>
            </div>
            
            <h3 className="font-bold text-white text-base mb-2.5 relative z-10">{item.title}</h3>
            <p className="text-white/60 text-xs sm:text-sm leading-relaxed font-medium relative z-10">{item.desc}</p>
          </motion.div>
        ))}
      </div>

    </motion.div>
  );
};

export default LandingAnnouncements;
