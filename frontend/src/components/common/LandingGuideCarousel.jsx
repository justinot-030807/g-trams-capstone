import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, ShieldCheck, FileCheck, CreditCard, Award, ChevronLeft, ChevronRight } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: "Create an Account",
    desc: "Register using your email or Google Account. Fill in your basic details, Barangay, and TODA affiliation.",
    icon: <UserPlus size={32} className="text-[#ffbd00]" />
  },
  {
    id: 2,
    title: "Submit Documents",
    desc: "Apply for a new franchise online. Upload clear pictures of your OR/CR, Driver's License, and Barangay Clearance.",
    icon: <FileCheck size={32} className="text-[#ffbd00]" />
  },
  {
    id: 3,
    title: "Validation",
    desc: "Wait for the Admin to verify your submitted documents and approve your application. Track it on your dashboard.",
    icon: <ShieldCheck size={32} className="text-[#ffbd00]" />
  },
  {
    id: 4,
    title: "Print Claim Stub",
    desc: "Once marked as 'Ready for Pickup', print your official claim stub from the system and proceed to the Treasury.",
    icon: <CreditCard size={32} className="text-[#ffbd00]" />
  },
  {
    id: 5,
    title: "Claim Franchise",
    desc: "Present your claim stub and pay the required fees at the Munisipyo to officially receive your Mayor's Permit and MTOP.",
    icon: <Award size={32} className="text-[#ffbd00]" />
  }
];

const LandingGuideCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === steps.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovered]);

  const handleNext = () => setCurrentIndex((prev) => (prev === steps.length - 1 ? 0 : prev + 1));
  const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? steps.length - 1 : prev - 1));

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
        x: '-60%',
        scale: 0.8,
        zIndex: 5,
        opacity: 0.6,
        filter: 'blur(4px)',
      };
    }
    // Right Card
    if (diff === 1 || (currentIndex === steps.length - 1 && index === 0)) {
      return {
        x: '60%',
        scale: 0.8,
        zIndex: 5,
        opacity: 0.6,
        filter: 'blur(4px)',
      };
    }
    // Hidden Cards
    return {
      x: diff > 0 ? '100%' : '-100%',
      scale: 0.5,
      zIndex: 1,
      opacity: 0,
      filter: 'blur(10px)',
    };
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ type: "spring", stiffness: 60, damping: 20 }}
      className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-white/10 relative z-10"
    >
      <div className="text-center mb-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#730000] tracking-tight uppercase mb-3 drop-shadow-md">
          Citizen's <span className="text-[#ffbd00]">Charter</span>
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto font-medium">
          Simplifying the tricycle franchise application process in Gasan. Follow this 5-step digital flow.
        </p>
      </div>

      <div 
        className="relative w-full h-[350px] sm:h-[400px] flex items-center justify-center overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}
      >
        <AnimatePresence initial={false}>
          {steps.map((step, index) => {
            const styles = getCardStyles(index);
            // Only render cards that are relatively close to avoid massive DOM
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
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute w-[280px] sm:w-[320px] h-[300px] sm:h-[340px] flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-b from-[#9b000a] to-[#730000] border border-[#ffbd00]/20 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)] text-center cursor-pointer"
                onClick={() => setCurrentIndex(index)}
              >
                {/* Step Badge */}
                <div className="absolute -top-5 w-12 h-12 bg-[#ffbd00] text-[#730000] rounded-full flex items-center justify-center font-black text-xl border-4 border-[#730000] shadow-lg">
                  {step.id}
                </div>

                <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-inner backdrop-blur-sm">
                  {step.icon}
                </div>
                
                <h3 className="font-bold text-white text-lg sm:text-xl mb-3 uppercase tracking-wide">{step.title}</h3>
                <p className="text-[#f3efd0] text-xs sm:text-sm leading-relaxed font-medium">{step.desc}</p>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button 
          onClick={handlePrev}
          className="absolute left-2 sm:left-10 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-[#730000] hover:bg-[#9b000a] text-white hover:text-[#ffbd00] transition-all border border-[#730000] hover:border-[#9b000a] shadow-lg"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={handleNext}
          className="absolute right-2 sm:right-10 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-[#730000] hover:bg-[#9b000a] text-white hover:text-[#ffbd00] transition-all border border-[#730000] hover:border-[#9b000a] shadow-lg"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center items-center gap-3 mt-8">
        {steps.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 rounded-full ${
              currentIndex === idx 
                ? 'w-8 h-2.5 bg-[#ffbd00] shadow-[0_0_10px_rgba(255,189,0,0.6)]' 
                : 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>

    </motion.div>
  );
};

export default LandingGuideCarousel;
