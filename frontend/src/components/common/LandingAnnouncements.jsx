import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Calendar, AlertTriangle } from 'lucide-react';

const defaultAnnouncements = [
  {
    _id: 'default-1',
    type: 'alert',
    date: 'Annual Cycle',
    title: 'Franchise Renewal Schedule',
    desc: 'All registered tricycle operators must complete annual MTOP renewal before designated deadline to maintain active status.'
  },
  {
    _id: 'default-2',
    type: 'info',
    date: 'Portal Update',
    title: 'Digital MTOP & QR Verification',
    desc: 'Approved operators can now view and download their digitally signed MTOP certificates with verifiable QR codes directly from their dashboard.'
  },
  {
    _id: 'default-3',
    type: 'event',
    date: 'Advisory',
    title: 'Online Application Support',
    desc: 'Municipal Tricycle Franchising staff are available to assist operators with online registration, document scanning, and route zoning inquiries.'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 25, scale: 0.96 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 90, damping: 16 }
  }
};

const LandingAnnouncements = () => {
  const [announcements, setAnnouncements] = useState(defaultAnnouncements);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/settings`);
        if (res.ok) {
          const json = await res.json();
          if (json.data?.announcements && Array.isArray(json.data.announcements)) {
            const active = json.data.announcements.filter(a => a.isActive !== false);
            if (active.length > 0) {
              setAnnouncements(active);
            }
          }
        }
      } catch (err) {
        // Fallback to default announcements on network delay
      }
    };

    fetchAnnouncements();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle size={15} />;
      case 'event':
        return <Calendar size={15} />;
      default:
        return <Megaphone size={15} />;
    }
  };

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
          <p className="text-[#6B6761] dark:text-[#A8A29E] text-xs sm:text-sm font-medium">
            Official municipal advisories, renewal schedules, and system announcements from the LGU of Gasan.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {announcements.map((item, idx) => (
          <motion.div 
            key={item._id || item.id || idx} 
            variants={cardVariants}
            className="flex flex-col justify-between p-6 rounded-xl bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] hover:border-[#D4AF37] shadow-xs hover:shadow-md transition-all relative overflow-hidden group"
          >
            <div>
              <div className="flex justify-between items-center mb-4 relative z-10">
                <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                  item.type === 'alert' ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60' :
                  item.type === 'info' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60' :
                  'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                }`}>
                  {getIcon(item.type)}
                  <span>{item.type || 'info'}</span>
                </span>
                <span className="text-[10px] text-[#6B6761] dark:text-[#A8A29E] font-medium tracking-wider">
                  {item.date || 'Active Advisory'}
                </span>
              </div>
              
              <h3 className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3] text-base mb-2.5 relative z-10">
                {item.title}
              </h3>
              <p className="text-[#6B6761] dark:text-[#A8A29E] text-xs sm:text-sm leading-relaxed font-normal relative z-10">
                {item.desc}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E4E1DC]/60 dark:border-[#2E2A27]/60 flex items-center justify-between text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
              <span>Office of the Municipal Mayor / BPLO</span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold uppercase">● Verified</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default LandingAnnouncements;
