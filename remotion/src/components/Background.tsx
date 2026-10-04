import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export const Background: React.FC = () => {
  const frame = useCurrentFrame();

  // Floating ambient light coordinates
  const orb1X = interpolate(Math.sin(frame * 0.02), [-1, 1], [20, 35]);
  const orb1Y = interpolate(Math.cos(frame * 0.015), [-1, 1], [25, 40]);

  const orb2X = interpolate(Math.cos(frame * 0.025), [-1, 1], [65, 80]);
  const orb2Y = interpolate(Math.sin(frame * 0.018), [-1, 1], [55, 70]);

  const orb3X = interpolate(Math.sin(frame * 0.012), [-1, 1], [40, 55]);
  const orb3Y = interpolate(Math.cos(frame * 0.022), [-1, 1], [70, 85]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#0F0305',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {/* High-performance multi-stop radial velvet background (0 filter blur overhead) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at ${orb1X}% ${orb1Y}%, rgba(158, 42, 43, 0.5) 0%, rgba(158, 42, 43, 0.2) 30%, transparent 60%),
            radial-gradient(circle at ${orb2X}% ${orb2Y}%, rgba(212, 175, 55, 0.25) 0%, rgba(212, 175, 55, 0.08) 35%, transparent 65%),
            radial-gradient(circle at ${orb3X}% ${orb3Y}%, rgba(122, 27, 34, 0.4) 0%, rgba(122, 27, 34, 0.15) 35%, transparent 60%),
            radial-gradient(ellipse at 50% 50%, #3B090E 0%, #1A0306 65%, #080102 100%)
          `,
        }}
      />

      {/* Subtle modern geometric grid overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse at 50% 50%, black 40%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black 40%, transparent 85%)',
          pointerEvents: 'none',
        }}
      />

      {/* Cinematic Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 45%, rgba(5, 1, 2, 0.75) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
