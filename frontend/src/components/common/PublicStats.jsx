import React, { useEffect, useState, useRef } from 'react';
import { Users, Building2, FileCheck2 } from 'lucide-react';

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
  const [stats, setStats] = useState({ operators: 1250, todas: 24, franchises: 1540 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/public-stats`);
        if (response.ok) {
          const data = await response.json();
          setStats({
            operators: data.operators || 1250,
            todas: data.todas || 24,
            franchises: data.franchises || 1540
          });
        }
      } catch (err) {
        console.error('Failed to load public stats', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="w-full relative z-10 py-16 sm:py-24 border-t border-white/5 bg-gradient-to-b from-[#120204] to-[#1a0508] overflow-hidden select-none">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-[#7A1B22] to-transparent rounded-full blur-[80px] -translate-y-1/2" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-gradient-to-bl from-[#D4AF37] to-transparent rounded-full blur-[80px] -translate-y-1/2" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-wider mb-3">
            Gasan Tricycle <span className="text-[#D4AF37]">Ecosystem</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-medium max-w-2xl mx-auto">
            A unified ecosystem for a more organized, safe, and efficient transportation system in Gasan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {/* Stat 1 */}
          <div className="relative group bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 text-center transition-all duration-300 hover:bg-white/10 hover:-translate-y-2 hover:shadow-[0_15px_30px_-10px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/30">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#7A1B22] to-[#4A1015] rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Users className="text-white w-8 h-8" />
            </div>
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tighter mb-2">
              <CountUp end={stats.operators} />
              <span className="text-[#D4AF37]">+</span>
            </div>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">
              Registered Operators
            </h3>
          </div>

          {/* Stat 2 */}
          <div className="relative group bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 text-center transition-all duration-300 hover:bg-white/10 hover:-translate-y-2 hover:shadow-[0_15px_30px_-10px_rgba(122,27,34,0.2)] hover:border-[#7A1B22]/30">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#D4AF37] to-[#8C7323] rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Building2 className="text-[#120204] w-8 h-8" />
            </div>
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tighter mb-2">
              <CountUp end={stats.todas} />
            </div>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">
              TODA Associations
            </h3>
          </div>

          {/* Stat 3 */}
          <div className="relative group bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 text-center transition-all duration-300 hover:bg-white/10 hover:-translate-y-2 hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.2)] hover:border-emerald-500/30">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <FileCheck2 className="text-white w-8 h-8" />
            </div>
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tighter mb-2">
              <CountUp end={stats.franchises} />
              <span className="text-emerald-400">+</span>
            </div>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">
              Active Franchises
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicStats;
