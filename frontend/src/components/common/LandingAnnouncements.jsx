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
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#1F1D1B] dark:text-[#F6F5F3] tracking-tight uppercase mb-2">
            Municipal <span className="text-[#9E2A2B]">Bulletin Board</span>
          </h2>
          <p className="text-[#6B6761] dark:text-[#A8A29E] text-xs sm:text-sm font-medium">Latest advisories and updates from the LGU.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {announcements.map((item) => (
          <motion.div 
            key={item.id} 
            variants={cardVariants}
            className="flex flex-col p-6 rounded-lg bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] hover:border-[#D4AF37] shadow-xs transition-colors relative overflow-hidden group"
          >
            <div className="flex justify-between items-center mb-4 relative z-10">
              <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                item.type === 'alert' ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60' :
                item.type === 'info' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60' :
                'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
              }`}>
                {item.icon}
                {item.type}
              </span>
              <span className="text-[10px] text-[#6B6761] dark:text-[#A8A29E] font-medium tracking-wider">{item.date}</span>
            </div>
            
            <h3 className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3] text-base mb-2.5 relative z-10">{item.title}</h3>
            <p className="text-[#6B6761] dark:text-[#A8A29E] text-xs sm:text-sm leading-relaxed font-normal relative z-10">{item.desc}</p>
          </motion.div>
        ))}
      </div>

    </motion.div>
  );
};

export default LandingAnnouncements;
