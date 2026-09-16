import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, ShieldCheck, FileCheck, CreditCard, Award } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: "Create an Account",
    desc: "Register using your email or Google Account. Fill in your basic details, Barangay, and TODA affiliation.",
    icon: <UserPlus size={24} className="text-[#D4AF37]" />
  },
  {
    id: 2,
    title: "Submit Documents",
    desc: "Apply for a new franchise online. Upload clear pictures of your OR/CR, Driver's License, and Barangay Clearance.",
    icon: <FileCheck size={24} className="text-[#D4AF37]" />
  },
  {
    id: 3,
    title: "Validation",
    desc: "Wait for the Admin to verify your submitted documents and approve your application. Track it on your dashboard.",
    icon: <ShieldCheck size={24} className="text-[#D4AF37]" />
  },
  {
    id: 4,
    title: "Print Claim Stub",
    desc: "Once marked as 'Ready for Pickup', print your official claim stub from the system and proceed to the Treasury.",
    icon: <CreditCard size={24} className="text-[#D4AF37]" />
  },
  {
    id: 5,
    title: "Claim Franchise",
    desc: "Present your claim stub and pay the required fees at the Munisipyo to officially receive your Mayor's Permit and MTOP.",
    icon: <Award size={24} className="text-[#D4AF37]" />
  }
];

const LandingGuideCarousel = () => {
  const carouselRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let intervalId;

    if (!isPaused) {
      intervalId = setInterval(() => {
        if (carouselRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
          const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 20;

          if (isAtEnd) {
            // Smoothly rewind to the beginning
            carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            // Scroll right by approximately one card width
            carouselRef.current.scrollBy({ left: 300, behavior: 'smooth' });
          }
        }
      }, 3500); // 3.5 seconds per slide
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPaused]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ type: "spring", stiffness: 60, damping: 20 }}
      className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-white/5 relative z-10"
    >
      
      <div className="text-center mb-10 sm:mb-14">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight uppercase mb-3 drop-shadow-md">
          Citizen's <span className="text-[#D4AF37]">Charter</span>
        </h2>
        <p className="text-white/60 text-xs sm:text-sm max-w-2xl mx-auto font-medium">
          Simplifying the tricycle franchise application process in Gasan. Follow this 5-step digital flow.
        </p>
      </div>

      {/* Horizontal Snap Carousel */}
      <div 
        ref={carouselRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-6 pb-8 hide-scrollbar scroll-smooth" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {steps.map((step, index) => (
          <motion.div 
            key={step.id} 
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="snap-center shrink-0 w-[260px] sm:w-[280px] flex flex-col p-6 rounded-3xl bg-linear-to-b from-[#1a0507]/90 to-[#120204]/90 backdrop-blur-xl border border-white/10 hover:border-[#D4AF37]/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_40px_-10px_rgba(212,175,55,0.2)] transition-all relative group"
          >
            {/* Step Number Badge */}
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-[#7A1B22] to-[#4A0D12] text-white rounded-full flex items-center justify-center font-black text-lg border-4 border-[#120204] shadow-[0_0_15px_rgba(122,27,34,0.6)] group-hover:rotate-12 transition-transform duration-300">
              {step.id}
            </div>

            <div className="w-14 h-14 bg-gradient-to-br from-[#7A1B22]/20 to-transparent border border-[#7A1B22]/40 rounded-2xl flex items-center justify-center mb-5 group-hover:from-[#7A1B22]/40 transition-colors">
              {step.icon}
            </div>
            
            <h3 className="font-bold text-white text-base mb-2 uppercase tracking-wide">{step.title}</h3>
            <p className="text-white/60 text-xs leading-relaxed font-medium">{step.desc}</p>
            
            {/* Progress Connector (Visible on Desktop if not last) */}
            {index !== steps.length - 1 && (
              <div className="hidden lg:block absolute top-[60px] -right-[12px] w-[24px] h-[2px] bg-gradient-to-r from-white/20 to-transparent" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Mobile Swipe Hint */}
      <motion.div 
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="flex items-center justify-center gap-2 text-white/40 text-[10px] uppercase font-bold tracking-widest mt-2 sm:hidden"
      >
        <span>← Swipe to see steps →</span>
      </motion.div>

    </motion.div>
  );
};

export default LandingGuideCarousel;
