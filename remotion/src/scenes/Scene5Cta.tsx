import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS, SPRING_FAST, SPRING_SMOOTH } from '../tokens/designTokens';
import { KineticText } from '../components/KineticWord';

export const Scene5Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const enterSpring = spring({
    frame,
    fps,
    config: SPRING_SMOOTH,
  });

  // Action block spring
  const actionSpring = spring({
    frame: frame - 25,
    fps,
    config: SPRING_FAST,
  });

  // URL block spring
  const urlSpring = spring({
    frame: frame - 38,
    fps,
    config: SPRING_FAST,
  });

  // Camera push-in
  const cameraScale = interpolate(frame, [0, 180], [1.0, 1.03], {
    extrapolateRight: 'clamp',
  });

  // Outro subtle fade on final 15 frames
  const outroFade = interpolate(frame, [165, 180], [1, 0.95], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: COLORS.bg,
        opacity: outroFade,
        transform: `scale(${cameraScale})`,
        padding: '90px 100px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: FONTS.family,
        zIndex: 10,
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${COLORS.border}`,
          paddingBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              padding: '4px 12px',
              border: `1.5px solid ${COLORS.accent}`,
              borderRadius: 4,
              fontSize: 12,
              fontWeight: FONTS.weightBold,
              color: COLORS.accent,
              letterSpacing: 1.5,
            }}
          >
            05 // GET STARTED
          </div>
          <span style={{ fontSize: 14, color: COLORS.muted }}>
            OFFICIAL LGU GASAN WEB APPLICATION
          </span>
        </div>

        <div style={{ fontSize: 13, color: COLORS.accent, fontWeight: FONTS.weightBold }}>
          SIMULAN NA NGAYON
        </div>
      </div>

      {/* Main Content Area (Asymmetric Editorial Focus) */}
      <div style={{ maxWidth: 1200 }}>
        {/* Line 1: BYAHE NANG LEGAL. */}
        <div style={{ overflow: 'hidden', height: 115 }}>
          <KineticText
            text="BYAHE NANG LEGAL."
            startFrame={6}
            fontSize={110}
            lineHeight={0.95}
            letterSpacing={-3}
            color={COLORS.text}
          />
        </div>

        {/* Line 2: WALANG PILA. */}
        <div style={{ overflow: 'hidden', height: 120 }}>
          <KineticText
            text="WALANG PILA."
            startFrame={16}
            fontSize={110}
            lineHeight={0.95}
            letterSpacing={-3}
            color={COLORS.accent}
          />
        </div>

        <p
          style={{
            marginTop: 20,
            fontSize: 22,
            color: COLORS.muted,
            lineHeight: 1.45,
            fontWeight: FONTS.weightRegular,
            opacity: enterSpring,
          }}
        >
          G-TRAMS: Serbisyong mabilis, malinis, at diretsahan para sa bawat operator at mamamayan.
        </p>

        {/* Action Button & Direct URL Block */}
        <div
          style={{
            marginTop: 36,
            display: 'flex',
            alignItems: 'center',
            gap: 28,
          }}
        >
          {/* Flat High-Contrast Action Button */}
          <div
            style={{
              backgroundColor: COLORS.accent,
              color: '#0B0B0F',
              padding: '18px 38px',
              borderRadius: 8,
              fontSize: 18,
              fontWeight: FONTS.weightBold,
              letterSpacing: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transform: `scale(${actionSpring})`,
              opacity: actionSpring,
            }}
          >
            <span>MAG-APPLY NGAYON</span>
            <span style={{ fontSize: 20 }}>➔</span>
          </div>

          {/* Clean Monospace Style URL Callout */}
          <div
            style={{
              padding: '16px 28px',
              backgroundColor: COLORS.surface,
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transform: `scale(${urlSpring})`,
              opacity: urlSpring,
            }}
          >
            <span style={{ fontSize: 13, color: COLORS.accent, fontWeight: FONTS.weightBold }}>WEB</span>
            <span
              style={{
                fontSize: 22,
                fontWeight: FONTS.weightBold,
                color: COLORS.text,
                letterSpacing: 0.5,
              }}
            >
              g-trams-web2.vercel.app
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Details */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: `1px solid ${COLORS.border}`,
          paddingTop: 18,
          fontSize: 13,
          color: COLORS.muted,
        }}
      >
        <div>MUNICIPAL TRICYCLE FRANCHISING AND REGULATORY BOARD • BAYAN NG GASAN</div>
        <div>POWERED BY LGU GASAN DIGITAL INITIATIVE</div>
      </div>
    </div>
  );
};
