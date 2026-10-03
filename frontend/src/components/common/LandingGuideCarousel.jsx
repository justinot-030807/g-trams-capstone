import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, ShieldCheck, FileCheck, CreditCard, Award, ChevronLeft, ChevronRight } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: "Create an Account",
    desc: "Register using your email or Google Account. Fill in your basic details, Barangay, and TODA affiliation.",
    icon: <UserPlus size={32} className="text-[#D4AF37]" />
  },
  {
    id: 2,
    title: "Submit Documents",
    desc: "Apply for a new franchise online. Upload clear pictures of your OR/CR, Driver's License, and Barangay Clearance.",
    icon: <FileCheck size={32} className="text-[#D4AF37]" />
  },
  {
    id: 3,
    title: "Validation",
    desc: "Wait for the Admin to verify your submitted documents and approve your application. Track it on your dashboard.",
    icon: <ShieldCheck size={32} className="text-[#D4AF37]" />
  },
  {
    id: 4,
    title: "Print Claim Stub",
    desc: "Once marked as 'Ready for Pickup', print your official claim stub from the system and proceed to the Treasury.",
    icon: <CreditCard size={32} className="text-[#D4AF37]" />
  },
  {
    id: 5,
    title: "Claim Franchise",
    desc: "Present your claim stub and pay the required fees at the Munisipyo to officially receive your Mayor's Permit and MTOP.",
    icon: <Award size={32} className="text-[#D4AF37]" />
  }
];

const LandingGuideCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false);
  const resumeTimeoutRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reliable 6-second auto-play timer
  useEffect(() => {
    if (isInteracting) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === steps.length - 1 ? 0 : prev + 1));
    }, 6000);

    return () => clearInterval(timer);
  }, [isInteracting, currentIndex]);

  const pauseInteraction = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    setIsInteracting(true);
  };

  const resumeInteraction = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, 2500);
  };

  const handleNext = () => {
    pauseInteraction();
    setCurrentIndex((prev) => (prev === steps.length - 1 ? 0 : prev + 1));
    resumeInteraction();
  };

  const handlePrev = () => {
    pauseInteraction();
    setCurrentIndex((prev) => (prev === 0 ? steps.length - 1 : prev - 1));
    resumeInteraction();
  };

  const handleTouchStart = (e) => {
    pauseInteraction();
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current && touchEndX.current) {
      const diff = touchStartX.current - touchEndX.current;
      if (diff > 45) {
        handleNext();
      } else if (diff < -45) {
        handlePrev();
      }
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
    resumeInteraction();
  };

  const getCardStyles = (index) => {
    const diff = index - currentIndex;
    
    // Active Center Card
    if (diff === 0) {
      return {
        x: '0%',
        scale: 1,
        zIndex: 10,
        opacity: 1,
        filter: 'blur(0px)',
      };
    }
    // Left Card - Peeks in halved ("hati") on mobile screen edges
    if (diff === -1 || (currentIndex === 0 && index === steps.length - 1)) {
      return {
        x: isMobile ? '-76%' : '-60%',
        scale: isMobile ? 0.85 : 0.82,
        zIndex: 5,
        opacity: 0.55,
        filter: 'blur(5px)',
      };
    }
    // Right Card - Peeks in halved ("hati") on mobile screen edges
    if (diff === 1 || (currentIndex === steps.length - 1 && index === 0)) {
      return {
        x: isMobile ? '76%' : '60%',
        scale: isMobile ? 0.85 : 0.82,
        zIndex: 5,
        opacity: 0.55,
        filter: 'blur(5px)',
      };
    }
    // Hidden Cards
    return {
      x: diff > 0 ? '130%' : '-130%',
      scale: 0.5,
      zIndex: 1,
      opacity: 0,
      filter: 'blur(12px)',
    };
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-6xl mx-auto px-2 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-[#E4E1DC] dark:border-[#2E2A27] relative z-10 overflow-hidden"
    >
      <div className="text-center mb-10 sm:mb-16 px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1F1D1B] dark:text-[#F6F5F3] tracking-tight uppercase mb-3">
          Citizen's <span className="text-[#9E2A2B]">Charter</span>
        </h2>
        <p className="text-[#6B6761] dark:text-[#A8A29E] text-xs sm:text-base max-w-2xl mx-auto font-medium">
          Simplifying the motorized tricycle franchise application process in Gasan. Follow this 5-step digital flow.
        </p>
      </div>

      <div 
        className="relative w-full min-h-[370px] sm:min-h-[420px] flex items-center justify-center overflow-hidden py-4 touch-pan-y"
        onMouseEnter={pauseInteraction}
        onMouseLeave={resumeInteraction}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence initial={false}>
          {steps.map((step, index) => {
            const styles = getCardStyles(index);
            if (styles.opacity === 0) return null;

            return (
              <motion.div
                key={step.id}
                animate={{
                  x: styles.x,
                  scale: styles.scale,
                  zIndex: styles.zIndex,
                  opacity: styles.opacity,
                  filter: styles.filter,
                }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="absolute w-[250px] xs:w-[275px] sm:w-[330px] min-h-[290px] sm:min-h-[340px] flex flex-col items-center justify-center p-5 sm:p-8 rounded-lg bg-[#9E2A2B] text-white border border-[#D4AF37] shadow-md text-center cursor-pointer select-none shrink-0"
                onClick={() => {
                  pauseInteraction();
                  setCurrentIndex(index);
                  resumeInteraction();
                }}
              >
                {/* Step Badge */}
                <div className="absolute -top-4 w-9 h-9 sm:w-10 sm:h-10 bg-[#D4AF37] text-[#1C1917] rounded-full flex items-center justify-center font-black text-base sm:text-lg border-2 border-white shadow-sm">
                  {step.id}
                </div>

                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 rounded-lg flex items-center justify-center mb-4 sm:mb-5 shadow-inner border border-white/10">
                  {step.icon}
                </div>
                
                <h3 className="font-bold text-white text-base sm:text-lg mb-2 uppercase tracking-wide leading-snug">
                  {step.title}
                </h3>
                <p className="text-white/90 text-xs sm:text-sm leading-relaxed font-normal">
                  {step.desc}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button 
          type="button"
          onClick={handlePrev}
          aria-label="Previous Slide"
          className="absolute left-1 sm:left-6 z-20 w-11 h-11 flex items-center justify-center rounded-lg bg-white dark:bg-[#1C1917] hover:bg-[#9E2A2B] text-[#1F1D1B] dark:text-[#F6F5F3] hover:text-white transition-colors border border-[#E4E1DC] dark:border-[#2E2A27] hover:border-[#9E2A2B] shadow-xs cursor-pointer min-h-[44px] min-w-[44px]"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          type="button"
          onClick={handleNext}
          aria-label="Next Slide"
          className="absolute right-1 sm:right-6 z-20 w-11 h-11 flex items-center justify-center rounded-lg bg-white dark:bg-[#1C1917] hover:bg-[#9E2A2B] text-[#1F1D1B] dark:text-[#F6F5F3] hover:text-white transition-colors border border-[#E4E1DC] dark:border-[#2E2A27] hover:border-[#9E2A2B] shadow-xs cursor-pointer min-h-[44px] min-w-[44px]"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Dots & Progress Indicator */}
      <div className="flex justify-center items-center gap-2.5 mt-6 sm:mt-8">
        {steps.map((_, idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`Go to slide ${idx + 1}`}
            onClick={() => {
              pauseInteraction();
              setCurrentIndex(idx);
              resumeInteraction();
            }}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              currentIndex === idx 
                ? 'w-8 h-2.5 bg-[#9E2A2B] shadow-xs' 
                : 'w-2.5 h-2.5 bg-[#E4E1DC] dark:bg-[#2E2A27] hover:bg-[#D4AF37]'
            }`}
          />
        ))}
      </div>

      {/* Swipe Indicator on Mobile */}
      <div className="text-center mt-3 sm:hidden">
        <span className="text-[10px] text-[#6B6761] dark:text-[#A8A29E] uppercase font-bold tracking-widest">
          ← Swipe to navigate →
        </span>
      </div>

    </motion.div>
  );
};

export default LandingGuideCarousel;
