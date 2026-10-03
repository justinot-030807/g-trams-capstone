import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Sparkles, ArrowRight, ArrowLeft, X, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const SpotlightTour = ({ isOpen, onClose, steps = [] }) => {
  const { language } = useLanguage();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const isFilipino = language === 'fil';
  const currentStep = steps[currentStepIndex];

  // Calculate and update target rectangle position
  const updateTargetRect = useCallback(() => {
    if (!isOpen || !currentStep) return;

    const el = document.getElementById(currentStep.targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const measure = () => {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right
        });
      };
      measure();
      const t1 = setTimeout(measure, 150);
      const t2 = setTimeout(measure, 350);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(updateTargetRect, 200);

    const handleScrollOrResize = () => {
      updateTargetRect();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, currentStepIndex, updateTargetRect]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleFinish();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, steps.length]);

  if (!isOpen || !currentStep) return null;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleFinish();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('gtrams_operator_tour_done', 'true');
    localStorage.setItem('gtrams_operator_tour_done_global', 'true');
    onClose();
  };

  const StepIcon = currentStep.icon || Sparkles;

  // Responsive dynamic positioning
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : true;
  let dialogStyle = {};
  let mobilePositionClass = 'bottom-24 inset-x-3.5 max-w-sm mx-auto';

  if (targetRect && typeof window !== 'undefined') {
    const vh = window.innerHeight;
    const targetCenterY = (targetRect.top + targetRect.bottom) / 2;
    const isTargetInLowerHalf = targetCenterY > vh * 0.45;

    if (isMobile) {
      mobilePositionClass = isTargetInLowerHalf
        ? 'top-4 inset-x-3.5 max-w-sm mx-auto'
        : 'bottom-24 inset-x-3.5 max-w-sm mx-auto';
    } else {
      const spaceBelow = vh - targetRect.bottom;
      const spaceAbove = targetRect.top;
      const dialogHeight = 220;

      if (spaceBelow >= dialogHeight + 20) {
        dialogStyle = {
          top: `${Math.min(targetRect.bottom + 16, vh - dialogHeight - 16)}px`,
          left: `${Math.max(20, Math.min(targetRect.left, window.innerWidth - 420))}px`
        };
      } else if (spaceAbove >= dialogHeight + 20) {
        dialogStyle = {
          bottom: `${Math.min(vh - targetRect.top + 16, vh - 30)}px`,
          left: `${Math.max(20, Math.min(targetRect.left, window.innerWidth - 420))}px`
        };
      } else {
        dialogStyle = {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
      }
    }
  } else if (isMobile) {
    mobilePositionClass = 'bottom-24 inset-x-3.5 max-w-sm mx-auto';
  } else {
    dialogStyle = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    };
  }

  const tourPortalContent = (
    <div className="fixed inset-0 z-[99999] pointer-events-auto overflow-hidden">
      {/* 1. Backdrop with Spotlight Hole */}
      {targetRect ? (
        <div 
          className="fixed transition-all duration-300 pointer-events-none rounded-lg ring-2 ring-[#D4AF37] ring-offset-2 ring-offset-[#1C1917] shadow-[0_0_20px_rgba(212,175,55,0.35)]"
          style={{
            top: `${Math.max(0, targetRect.top - 8)}px`,
            left: `${Math.max(0, targetRect.left - 8)}px`,
            width: `${targetRect.width + 16}px`,
            height: `${targetRect.height + 16}px`,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)'
          }}
        />
      ) : (
        <div 
          className="fixed inset-0 bg-black/60 transition-opacity duration-300"
          onClick={handleFinish}
        />
      )}

      {/* 2. Interactive Dialog Tooltip Card */}
      <div 
        className={`fixed z-[100000] pointer-events-auto transition-all duration-300 ${
          isMobile 
            ? mobilePositionClass 
            : 'max-w-md w-full'
        }`}
        style={dialogStyle}
      >
        <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg shadow-xl p-4 sm:p-5 relative overflow-hidden flex flex-col">
          {/* Subtle top gold accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#9E2A2B]" />

          {/* Header Row: Step counter pill & Close button */}
          <div className="flex items-center justify-between mb-2.5 pt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
              <StepIcon size={12} />
              <span>
                {`Step ${currentStepIndex + 1} of ${steps.length}`}
              </span>
            </span>

            <button
              type="button"
              onClick={handleFinish}
              className="text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#EAE7E1] p-1.5 rounded-lg hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Skip Tour"
            >
              <X size={16} />
            </button>
          </div>

          {/* Step Title & Description */}
          <div className="mb-3.5">
            <h3 className="text-sm sm:text-base font-bold text-[#1F1D1B] dark:text-white tracking-tight mb-1">
              {isFilipino ? (currentStep.titleFil || currentStep.title) : currentStep.title}
            </h3>
            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] leading-relaxed font-medium">
              {isFilipino ? (currentStep.descriptionFil || currentStep.description) : currentStep.description}
            </p>
          </div>

          {/* Stepper Dots & Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E4E1DC] dark:border-[#2E2A27] gap-3">
            {/* Dots indicator */}
            <div className="flex items-center gap-1">
              {steps.map((_, sIdx) => (
                <div
                  key={sIdx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    sIdx === currentStepIndex
                      ? 'w-5 bg-[#9E2A2B] dark:bg-[#D4AF37]'
                      : 'w-1.5 bg-[#E4E1DC] dark:bg-[#2E2A27]'
                  }`}
                />
              ))}
            </div>

            {/* Next / Back / Finish Buttons */}
            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3 py-2 rounded-lg font-bold text-xs text-[#6B6761] dark:text-[#A8A29E] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] transition-colors active:scale-95 flex items-center gap-1 cursor-pointer min-h-[44px]"
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 rounded-lg font-bold text-xs text-white bg-[#9E2A2B] hover:bg-[#7A1B22] transition-all shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <span>
                  {isLastStep ? 'Finish' : 'Next'}
                </span>
                {isLastStep ? <Check size={14} className="stroke-[3]" /> : <ArrowRight size={14} className="stroke-[2.5]" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? ReactDOM.createPortal(tourPortalContent, document.body)
    : null;
};

export default SpotlightTour;
