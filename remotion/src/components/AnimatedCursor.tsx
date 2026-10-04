import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { COLORS } from '../tokens/designTokens';

interface AnimatedCursorProps {
  x: number;
  y: number;
  clickFrame?: number; // frame at which click ripple triggers
  label?: string;
}

export const AnimatedCursor: React.FC<AnimatedCursorProps> = ({
  x,
  y,
  clickFrame = -1,
  label,
}) => {
  const frame = useCurrentFrame();

  const isClicked = clickFrame > 0 && frame >= clickFrame && frame <= clickFrame + 18;
  const clickProgress = isClicked ? (frame - clickFrame) / 18 : 0;

  const rippleScale = interpolate(clickProgress, [0, 1], [0.5, 2.2]);
  const rippleOpacity = interpolate(clickProgress, [0, 1], [0.8, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-2px, -2px)',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {/* Click ripple */}
      {isClicked && (
        <div
          style={{
            position: 'absolute',
            left: 2,
            top: 2,
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: `2px solid ${COLORS.accent}`,
            transform: `translate(-50%, -50%) scale(${rippleScale})`,
            opacity: rippleOpacity,
          }}
        />
      )}

      {/* Modern geometric vector cursor */}
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 2L10 21L13.5 13.5L21 10L3 2Z"
          fill={COLORS.accent}
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      {/* Optional cursor tracking pill */}
      {label && (
        <div
          style={{
            position: 'absolute',
            left: 20,
            top: 20,
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            padding: '3px 8px',
            borderRadius: 4,
            fontSize: 11,
            color: COLORS.text,
            fontWeight: 700,
            letterSpacing: 0.5,
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};
