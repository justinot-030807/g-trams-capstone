import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile } from 'remotion';

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Badge entrance spring
  const badgeSpring = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.5, stiffness: 120 },
  });

  // Line 1: "TIRED OF ENDLESS QUEUES?"
  const line1Spring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 10, mass: 0.4, stiffness: 140 },
  });

  // Line 2: "LOST PAPERWORK & DELAYS?"
  const line2Spring = spring({
    frame: frame - 22,
    fps,
    config: { damping: 10, mass: 0.4, stiffness: 140 },
  });

  // Solution Pivot: "MODERNIZE WITH G-TRAMS"
  const pivotSpring = spring({
    frame: frame - 42,
    fps,
    config: { damping: 11, mass: 0.6, stiffness: 150 },
  });

  // Subtitle spring
  const subSpring = spring({
    frame: frame - 55,
    fps,
    config: { damping: 14, mass: 0.5, stiffness: 100 },
  });

  // Scene Exit transition (frames 76 - 90)
  const exitProgress = interpolate(frame, [76, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const sceneScale = interpolate(exitProgress, [0, 1], [1, 1.12]);
  const sceneOpacity = interpolate(exitProgress, [0, 1], [1, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${sceneScale})`,
        opacity: sceneOpacity,
        zIndex: 10,
        padding: '0 80px',
        textAlign: 'center',
      }}
    >
      {/* Municipal Seal & Pill Tag */}
      <div
        style={{
          transform: `scale(${badgeSpring}) translateY(${interpolate(badgeSpring, [0, 1], [-40, 0])}px)`,
          opacity: badgeSpring,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 24px',
          borderRadius: 40,
          background: 'rgba(212, 175, 55, 0.12)',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          boxShadow: '0 0 25px rgba(212, 175, 55, 0.25)',
          marginBottom: 36,
        }}
      >
        <Img
          src={staticFile('gasan-logo.png')}
          style={{ width: 28, height: 28, objectFit: 'contain' }}
        />
        <span
          style={{
            color: '#F4D03F',
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: 2.5,
            textTransform: 'uppercase',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          LGU Gasan • Motorized Tricycle Regulatory Board
        </span>
      </div>

      {/* Kinetic Problem Questions */}
      <div style={{ overflow: 'hidden', marginBottom: 12 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 58,
            fontWeight: 900,
            color: 'rgba(255, 255, 255, 0.95)',
            letterSpacing: -1,
            transform: `translateY(${interpolate(line1Spring, [0, 1], [80, 0])}px)`,
            opacity: line1Spring,
            textShadow: '0 4px 30px rgba(0, 0, 0, 0.8)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          TIRED OF ENDLESS QUEUES?
        </h2>
      </div>

      <div style={{ overflow: 'hidden', marginBottom: 30 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 58,
            fontWeight: 900,
            color: '#EF4444',
            letterSpacing: -1,
            transform: `translateY(${interpolate(line2Spring, [0, 1], [80, 0])}px)`,
            opacity: line2Spring,
            textShadow: '0 4px 30px rgba(239, 68, 68, 0.4)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          LOST PERMITS &amp; PAPERWORK DELAYS?
        </h2>
      </div>

      {/* Pivot Climax: G-TRAMS Solution */}
      <div
        style={{
          transform: `scale(${pivotSpring}) translateY(${interpolate(pivotSpring, [0, 1], [40, 0])}px)`,
          opacity: pivotSpring,
          marginTop: 10,
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: '14px 44px',
            borderRadius: 24,
            background: 'linear-gradient(135deg, #9E2A2B 0%, #7A1B22 100%)',
            boxShadow: '0 20px 50px rgba(158, 42, 43, 0.6), 0 0 0 2px rgba(212, 175, 55, 0.5)',
          }}
        >
          <span
            style={{
              fontSize: 64,
              fontWeight: 950,
              color: '#FFFFFF',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            MODERNIZE WITH{' '}
            <span style={{ color: '#F4D03F', textShadow: '0 0 35px rgba(244, 208, 63, 0.8)' }}>
              G-TRAMS
            </span>
          </span>
        </div>
      </div>

      {/* Value proposition subtext */}
      <p
        style={{
          marginTop: 28,
          fontSize: 22,
          color: 'rgba(255, 255, 255, 0.85)',
          maxWidth: 900,
          lineHeight: 1.5,
          fontWeight: 500,
          transform: `translateY(${interpolate(subSpring, [0, 1], [30, 0])}px)`,
          opacity: subSpring,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        The All-in-One Digital Franchise Licensing &amp; Monitoring System for Gasan, Marinduque
      </p>
    </div>
  );
};
