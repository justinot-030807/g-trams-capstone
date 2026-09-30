import React, { useState, useRef, useEffect } from 'react';

/**
 * Interactive 3D Flip Municipal Medallion
 * - Front face: G-TRAMS official tricycle emblem (/gtrams-logo.png)
 * - Back face: Sangguniang Bayan Gasan Official Seal (/gasan-logo.png)
 * - Desktop: Smooth 3D coin flip on hover
 * - Mobile / Touch: Flips on click/tap, holds for 2.8s, then smoothly returns to front
 */
const InteractiveLogo = ({ 
  size = "w-10 h-10 sm:w-11 sm:h-11", 
  className = "",
  showBadgeHint = false,
  onClick
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  const handlePointerEnter = () => {
    setIsHovered(true);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
  };

  const handleClick = (e) => {
    // Stop propagation so parent <a> or container doesn't navigate instantly
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    clearTimer();

    setIsFlipped(prev => {
      const next = !prev;
      if (next) {
        // Automatically flip back to front after 2.8 seconds on mobile
        timerRef.current = setTimeout(() => {
          setIsFlipped(false);
        }, 2800);
      }
      return next;
    });

    if (onClick) onClick(e);
  };

  const active = isHovered || isFlipped;

  return (
    <div 
      className={`relative inline-flex items-center justify-center select-none cursor-pointer group ${className}`}
      onMouseEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={active ? "Seal of Sangguniang Bayan Gasan" : "G-TRAMS Official Logo"}
      title={active ? "Seal ng Sangguniang Bayan Gasan" : "G-TRAMS Logo (Hover / Tap to view SB Seal)"}
      style={{ perspective: '1000px' }}
    >
      <div 
        className={`relative ${size} rounded-full transition-transform duration-700 ease-out`}
        style={{
          transformStyle: 'preserve-3d',
          transform: active ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* FRONT: G-TRAMS OFFICIAL LOGO */}
        <div 
          className="absolute inset-0 w-full h-full rounded-full bg-white p-0.5 border-2 border-[#D4AF37] shadow-[0_4px_16px_rgba(212,175,55,0.4)] flex items-center justify-center overflow-hidden ring-2 ring-[#D4AF37]/35 group-hover:ring-[#D4AF37] group-hover:scale-105 transition-all duration-300"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <img 
            src="/gtrams-logo.png" 
            alt="G-TRAMS Official Logo" 
            className="w-full h-full object-cover scale-105"
            draggable="false"
          />
        </div>

        {/* BACK: SANGGUNIANG BAYAN GASAN SEAL */}
        <div 
          className="absolute inset-0 w-full h-full rounded-full bg-white p-0.5 border-2 border-[#D4AF37] shadow-[0_4px_16px_rgba(212,175,55,0.5)] flex items-center justify-center overflow-hidden ring-2 ring-[#9E2A2B]/40 group-hover:ring-[#9E2A2B] group-hover:scale-105 transition-all duration-300"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <img 
            src="/gasan-logo.png" 
            alt="Sangguniang Bayan Gasan Official Seal" 
            className="w-full h-full object-cover scale-105"
            draggable="false"
          />
        </div>
      </div>

      {/* Optional micro hint badge */}
      {showBadgeHint && (
        <span className="hidden sm:inline-block absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-black uppercase tracking-widest text-[#D4AF37] opacity-80 group-hover:opacity-100 transition-opacity">
          {active ? 'SB SEAL' : 'G-TRAMS'}
        </span>
      )}
    </div>
  );
};

export default InteractiveLogo;
