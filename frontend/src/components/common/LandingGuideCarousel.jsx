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
  const resumeTimeoutRef = useRef(null);

  // Reliable 6-second auto-play timer
  useEffect(() => {
    if (isInteracting) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === steps.length - 1 ? 0 : prev + 1));
    }, 6000); // Strictly every 6 seconds

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
    }, 2500); // 2.5s buffer after user stops touching/interacting before auto-scroll resumes
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
    // Left Card
    if (diff === -1 || (currentIndex === 0 && index === steps.length - 1)) {
      return {
        x: '-58%',
        scale: 0.82,
        zIndex: 5,
        opacity: 0.55,
        filter: 'blur(5px)',
      };
    }
    // Right Card
    if (diff === 1 || (currentIndex === steps.length - 1 && index === 0)) {
      return {
        x: '58%',
        scale: 0.82,
        zIndex: 5,
        opacity: 0.55,
        filter: 'blur(5px)',
      };
    }
    // Hidden Cards
    return {
      x: diff > 0 ? '110%' : '-110%',
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
      className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-white/10 relative z-10"
    >
      <div className="text-center mb-12 sm:mb-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight uppercase mb-3 drop-shadow-md">
          Citizen's <span className="text-[#D4AF37]">Charter</span>
        </h2>
        <p className="text-white/60 text-sm sm:text-base max-w-2xl mx-auto font-medium">
          Simplifying the motorized tricycle franchise application process in Gasan. Follow this 5-step digital flow.
        </p>
      </div>

      <div 
        className="relative w-full min-h-[380px] sm:min-h-[420px] flex items-center justify-center overflow-hidden py-4"
        onMouseEnter={pauseInteraction}
        onMouseLeave={resumeInteraction}
        onTouchStart={pauseInteraction}
        onTouchEnd={resumeInteraction}
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
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="absolute w-[280px] sm:w-[330px] min-h-[300px] sm:min-h-[340px] flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#7A1B22]/95 via-[#5A1419]/95 to-[#120204]/95 backdrop-blur-xl border border-[#D4AF37]/30 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)] text-center cursor-pointer select-none"
                onClick={() => {
                  pauseInteraction();
                  setCurrentIndex(index);
                  resumeInteraction();
                }}
              >
                {/* Step Badge */}
                <div className="absolute -top-5 w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#B8972E] text-[#120204] rounded-full flex items-center justify-center font-black text-xl border-4 border-[#120204] shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                  {step.id}
                </div>

                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-5 shadow-inner backdrop-blur-sm border border-white/10">
                  {step.icon}
                </div>
                
                <h3 className="font-bold text-white text-base sm:text-lg mb-2 uppercase tracking-wide leading-snug">
                  {step.title}
                </h3>
                <p className="text-white/80 text-xs sm:text-sm leading-relaxed font-normal">
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
          className="absolute left-2 sm:left-6 z-20 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-[#120204]/90 hover:bg-[#7A1B22] text-white hover:text-[#D4AF37] backdrop-blur-md transition-all duration-300 border border-[#D4AF37]/40 hover:border-[#D4AF37] shadow-lg cursor-pointer active:scale-95"
        >
          <ChevronLeft size={22} />
        </button>
        <button 
          type="button"
          onClick={handleNext}
          aria-label="Next Slide"
          className="absolute right-2 sm:right-6 z-20 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-[#120204]/90 hover:bg-[#7A1B22] text-white hover:text-[#D4AF37] backdrop-blur-md transition-all duration-300 border border-[#D4AF37]/40 hover:border-[#D4AF37] shadow-lg cursor-pointer active:scale-95"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Dots & Progress Indicator */}
      <div className="flex justify-center items-center gap-2.5 mt-8">
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
                ? 'w-8 h-2.5 bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.6)]' 
                : 'w-2.5 h-2.5 bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>

    </motion.div>
  );
};

export default LandingGuideCarousel;
