import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile } from 'remotion';

export const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance springs
  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 11, mass: 0.6, stiffness: 120 },
  });

  const titleSpring = spring({
    frame: frame - 15,
    fps,
    config: { damping: 12, mass: 0.5, stiffness: 130 },
  });

  const taglineSpring = spring({
    frame: frame - 28,
    fps,
    config: { damping: 14, mass: 0.5, stiffness: 110 },
  });

  const ctaButtonSpring = spring({
    frame: frame - 42,
    fps,
    config: { damping: 10, mass: 0.4, stiffness: 140 },
  });

  const urlSpring = spring({
    frame: frame - 55,
    fps,
    config: { damping: 12, mass: 0.5, stiffness: 110 },
  });

  // Glowing halo rotation & pulse
  const haloRotate = frame * 1.5;
  const buttonPulse = interpolate(Math.sin(frame * 0.1), [-1, 1], [0.98, 1.03]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 80px',
      }}
    >
      {/* Animated Brand Logos with Glowing Gold Rings */}
      <div
        style={{
          position: 'relative',
          width: 170,
          height: 170,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${logoSpring})`,
          opacity: logoSpring,
          marginBottom: 24,
        }}
      >
        {/* Outer Rotating Glowing Ring */}
        <div
          style={{
            position: 'absolute',
            inset: -14,
            borderRadius: '50%',
            border: '2px dashed rgba(212, 175, 55, 0.6)',
            transform: `rotate(${haloRotate}deg)`,
            boxShadow: '0 0 45px rgba(212, 175, 55, 0.35)',
          }}
        />

        {/* Inner Solid Gold Glow Aura */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, transparent 70%)',
          }}
        />

        {/* Dual Seal Badges */}
        <div
          style={{
            position: 'relative',
            width: 140,
            height: 140,
            borderRadius: '50%',
            backgroundColor: '#1E060A',
            border: '3px solid #D4AF37',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <Img
            src={staticFile('gtrams-logo.png')}
            style={{ width: '85%', height: '85%', objectFit: 'contain' }}
          />
        </div>

        {/* Secondary Municipal Seal Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: -6,
            right: -6,
            width: 52,
            height: 52,
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            border: '2px solid #D4AF37',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: 3,
          }}
        >
          <Img
            src={staticFile('gasan-logo.png')}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
      </div>

      {/* Main Title: G-TRAMS */}
      <h1
        style={{
          margin: 0,
          fontSize: 68,
          fontWeight: 950,
          color: '#FFFFFF',
          letterSpacing: 2,
          lineHeight: 1,
          transform: `translateY(${interpolate(titleSpring, [0, 1], [30, 0])}px)`,
          opacity: titleSpring,
          textShadow: '0 6px 35px rgba(0, 0, 0, 0.8)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        G-TRAMS
      </h1>

      {/* Spelled-Out Name */}
      <div
        style={{
          marginTop: 10,
          fontSize: 20,
          fontWeight: 700,
          color: '#D4AF37',
          letterSpacing: 2.5,
          textTransform: 'uppercase',
          transform: `translateY(${interpolate(titleSpring, [0, 1], [25, 0])}px)`,
          opacity: titleSpring,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        Gasan Tricycle Records &amp; Application Management System
      </div>

      {/* Tagline */}
      <p
        style={{
          marginTop: 18,
          fontSize: 24,
          fontWeight: 500,
          color: 'rgba(255, 255, 255, 0.85)',
          maxWidth: 780,
          lineHeight: 1.4,
          transform: `translateY(${interpolate(taglineSpring, [0, 1], [25, 0])}px)`,
          opacity: taglineSpring,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        Empowering Operators. Modernizing Municipal Services.
      </p>

      {/* Prominent Call to Action Button */}
      <div
        style={{
          marginTop: 32,
          transform: `scale(${ctaButtonSpring * buttonPulse}) translateY(${interpolate(ctaButtonSpring, [0, 1], [30, 0])}px)`,
          opacity: ctaButtonSpring,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 16,
            padding: '18px 50px',
            borderRadius: 30,
            background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 50%, #C49826 100%)',
            boxShadow: `
              0 15px 40px rgba(212, 175, 55, 0.4),
              0 0 30px rgba(244, 208, 63, 0.3)
            `,
            color: '#1A0609',
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            cursor: 'pointer',
          }}
        >
          <span>GET STARTED NOW</span>
          <span style={{ fontSize: 26, fontWeight: 'bold' }}>➔</span>
        </div>
      </div>

      {/* Official URL Callout Banner */}
      <div
        style={{
          marginTop: 26,
          transform: `translateY(${interpolate(urlSpring, [0, 1], [25, 0])}px)`,
          opacity: urlSpring,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 28px',
            borderRadius: 16,
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
          }}
        >
          <span style={{ fontSize: 18, color: '#D4AF37' }}>🌐</span>
          <span
            style={{
              color: '#FFFFFF',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 1,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            https://g-trams-web2.vercel.app
          </span>
        </div>
      </div>

      {/* Footer LGU credentials */}
      <div
        style={{
          marginTop: 30,
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: 14,
          letterSpacing: 1,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        Official Municipal Portal • Local Government Unit of Gasan, Marinduque
      </div>
    </div>
  );
};
