import React, { useEffect, useState, useRef } from 'react';
import { Users, Building2, FileCheck2 } from 'lucide-react';
import { motion } from 'framer-motion';

const CountUp = ({ end, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (countRef.current) {
      observer.observe(countRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime = null;
    const animateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      
      const easeOutQuart = 1 - Math.pow(1 - Math.min(progress / duration, 1), 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < duration) {
        requestAnimationFrame(animateCount);
      } else {
        setCount(end);
      }
    };
    
    requestAnimationFrame(animateCount);
  }, [end, duration, isVisible]);

  return <span ref={countRef}>{count.toLocaleString()}</span>;
};

const PublicStats = () => {
  const [stats, setStats] = useState({ operators: 0, todas: 0, franchises: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/public-stats`);
        if (response.ok) {
          const data = await response.json();
          setStats({
            operators: data.operators || 0,
            todas: data.todas || 0,
            franchises: data.franchises || 0
          });
        }
      } catch (err) {
        console.error('Failed to load public stats', err);
      }
    };
    fetchStats();
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  return (
    <div className="w-full relative z-10 py-16 sm:py-24 border-t border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] overflow-hidden select-none">
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
      >
        <motion.div variants={fadeIn} className="max-w-7xl mx-auto flex flex-col items-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1F1D1B] dark:text-[#F6F5F3] text-center tracking-tight uppercase mb-4">
            Public <span className="text-[#9E2A2B]">Stats</span>
          </h2>
          <p className="text-[#6B6761] dark:text-[#A8A29E] text-sm sm:text-base font-medium max-w-2xl mx-auto text-center">
            A unified ecosystem for a more organized, safe, and efficient transportation system in Gasan.
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {/* Stat 1 */}
          <motion.div variants={fadeIn} className="relative group bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-8 text-center transition-colors hover:border-[#D4AF37] shadow-xs">
            <div className="w-14 h-14 mx-auto bg-[#9E2A2B] rounded-lg flex items-center justify-center mb-6 shadow-xs">
              <Users className="text-white w-7 h-7" />
            </div>
            <div className="text-4xl sm:text-5xl font-black text-[#1F1D1B] dark:text-[#F6F5F3] tracking-tighter mb-2">
              <CountUp end={stats.operators} />
              <span className="text-[#9E2A2B]">+</span>
            </div>
            <h3 className="text-sm font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-widest">
              Registered Operators
            </h3>
          </motion.div>

          {/* Stat 2 */}
          <motion.div variants={fadeIn} className="relative group bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-8 text-center transition-colors hover:border-[#D4AF37] shadow-xs">
            <div className="w-14 h-14 mx-auto bg-[#D4AF37] rounded-lg flex items-center justify-center mb-6 shadow-xs">
              <Building2 className="text-[#1C1917] w-7 h-7" />
            </div>
            <div className="text-4xl sm:text-5xl font-black text-[#1F1D1B] dark:text-[#F6F5F3] tracking-tighter mb-2">
              <CountUp end={stats.todas} />
            </div>
            <h3 className="text-sm font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-widest">
              TODA Associations
            </h3>
          </motion.div>

          {/* Stat 3 */}
          <motion.div variants={fadeIn} className="relative group bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-8 text-center transition-colors hover:border-[#D4AF37] shadow-xs">
            <div className="w-14 h-14 mx-auto bg-[#9E2A2B] rounded-lg flex items-center justify-center mb-6 shadow-xs">
              <FileCheck2 className="text-white w-7 h-7" />
            </div>
            <div className="text-4xl sm:text-5xl font-black text-[#1F1D1B] dark:text-[#F6F5F3] tracking-tighter mb-2">
              <CountUp end={stats.franchises} />
              <span className="text-[#9E2A2B]">+</span>
            </div>
            <h3 className="text-sm font-bold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-widest">
              Active Franchises
            </h3>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PublicStats;
