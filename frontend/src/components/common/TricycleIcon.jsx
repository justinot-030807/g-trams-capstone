import React from 'react';

/**
 * TricycleIcon
 * Philippine Tricycle icon component matching the G-TRAMS municipal design system.
 * 
 * Supports two rendering modes:
 * 1. Default (mask / currentColor mode): behaves exactly like a Lucide icon
 *    e.g. <TricycleIcon size={18} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
 * 2. Raw image mode: renders the original high-resolution illustration
 *    e.g. <TricycleIcon raw size={48} />
 */
export const TricycleIcon = ({
  size = 18,
  className = '',
  raw = false,
  alt = 'Tricycle',
  ...props
}) => {
  // If raw is true, render direct image (preserving original maroon colors and stroke antialiasing)
  if (raw) {
    const widthStyle = typeof size === 'number' ? `${size}px` : size;
    return (
      <img
        src="/tricycle-icon.png"
        alt={alt}
        style={{
          width: widthStyle,
          height: 'auto',
          aspectRatio: '897 / 593',
        }}
        className={`inline-block object-contain select-none pointer-events-none ${className}`}
        {...props}
      />
    );
  }

  // Masked mode: uses currentColor so it responds to Tailwind text-* classes (e.g. text-[#9E2A2B], dark:text-[#D4AF37])
  const pixelWidth = typeof size === 'number' ? `${size}px` : size;
  const pixelHeight = typeof size === 'number' ? `${Math.round(size * (593 / 897))}px` : 'auto';

  return (
    <span
      role="img"
      aria-label={alt}
      style={{
        display: 'inline-block',
        width: pixelWidth,
        height: pixelHeight,
        aspectRatio: '897 / 593',
        maskImage: 'url(/tricycle-icon.png)',
        WebkitMaskImage: 'url(/tricycle-icon.png)',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        backgroundColor: 'currentColor',
        verticalAlign: 'middle',
      }}
      className={`shrink-0 select-none ${className}`}
      {...props}
    />
  );
};

export default TricycleIcon;
