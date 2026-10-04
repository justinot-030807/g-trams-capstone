import React from 'react';

/**
 * TricycleIcon
 * Official Philippine Tricycle icon component matching the G-TRAMS municipal design system.
 * Uses the official user-provided artwork:
 * - Maroon (/tricycle-icon-maroon.png) for Light Mode
 * - Gold / Dilaw (/tricycle-icon-gold.png) for Dark Mode
 * 
 * Supports:
 * - size: number (pixels) or string (e.g. 18, 24, 48)
 * - variant: 'auto' (default: maroon in light, gold in dark), 'maroon', 'gold'
 * - className: additional Tailwind or CSS classes
 */
export const TricycleIcon = ({
  size = 18,
  className = '',
  raw = false,
  variant = 'auto',
  alt = 'Tricycle',
  ...props
}) => {
  const pixelWidth = typeof size === 'number' ? `${size}px` : size;
  const pixelHeight = typeof size === 'number' ? `${Math.round(size * (589 / 892))}px` : 'auto';

  // Explicit maroon variant
  if (variant === 'maroon') {
    return (
      <img
        src="/tricycle-icon-maroon.png"
        alt={alt}
        style={{
          width: pixelWidth,
          height: pixelHeight,
          aspectRatio: '892 / 589',
        }}
        className={`inline-block object-contain select-none pointer-events-none ${className}`}
        draggable="false"
        {...props}
      />
    );
  }

  // Explicit gold / dilaw variant
  if (variant === 'gold' || variant === 'yellow') {
    return (
      <img
        src="/tricycle-icon-gold.png"
        alt={alt}
        style={{
          width: pixelWidth,
          height: pixelHeight,
          aspectRatio: '892 / 589',
        }}
        className={`inline-block object-contain select-none pointer-events-none ${className}`}
        draggable="false"
        {...props}
      />
    );
  }

  // Default 'auto' mode: automatically switches between Maroon (light) and Dilaw (dark)
  return (
    <span
      role="img"
      aria-label={alt}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: pixelWidth,
        height: pixelHeight,
        aspectRatio: '892 / 589',
        verticalAlign: 'middle',
      }}
      className={`shrink-0 select-none pointer-events-none ${className}`}
      {...props}
    >
      <img
        src="/tricycle-icon-maroon.png"
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        className="inline-block dark:hidden"
        draggable="false"
      />
      <img
        src="/tricycle-icon-gold.png"
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        className="hidden dark:inline-block"
        draggable="false"
      />
    </span>
  );
};

export default TricycleIcon;
