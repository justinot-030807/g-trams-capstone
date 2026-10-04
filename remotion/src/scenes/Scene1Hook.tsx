import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS, SPRING_FAST, SPRING_SMOOTH } from '../tokens/designTokens';
import { KineticText } from '../components/KineticWord';

export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Camera push-in for cinematic depth
  const cameraScale = interpolate(frame, [0, 90], [1.0, 1.04], {
    extrapolateRight: 'clamp',
  });

  // Kicker badge entrance
  const kickerSpring = spring({
    frame,
    fps,
    config: SPRING_FAST,
  });

  // Subtext entrance
  const subtextSpring = spring({
    frame: frame - 25,
    fps,
    config: SPRING_SMOOTH,
  });

  // Scene overlap exit transition (frames 76 - 90)
  const exitProgress = interpolate(frame, [76, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sceneOpacity = interpolate(exitProgress, [0, 1], [1, 0]);
  const sceneTranslateY = interpolate(exitProgress, [0, 1], [0, -35]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: COLORS.bg,
        opacity: sceneOpacity,
        transform: `scale(${cameraScale}) translateY(${sceneTranslateY}px)`,
        padding: '100px 100px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: FONTS.family,
        zIndex: 10,
      }}
    >
      {/* Top 12-Column Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${COLORS.border}`,
          paddingBottom: 24,
          opacity: kickerSpring,
          transform: `translateY(${interpolate(kickerSpring, [0, 1], [-20, 0])}px)`,
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
            01 // LGU GASAN
          </div>
          <span style={{ fontSize: 14, color: COLORS.muted, letterSpacing: 1 }}>
            MUNICIPAL TRICYCLE FRANCHISING &amp; REGULATORY BOARD
          </span>
        </div>

        <div style={{ fontSize: 13, color: COLORS.muted, letterSpacing: 2 }}>
          FISCAL YEAR 2026 • OFFICIAL REFORM
        </div>
      </div>

      {/* Main Asymmetric Headline (Columns 1 to 8) */}
      <div style={{ maxWidth: 1100 }}>
        {/* Line 1: BAWAL */}
        <div style={{ overflow: 'hidden', height: 140 }}>
          <KineticText
            text="BAWAL"
            startFrame={6}
            fontSize={138}
            lineHeight={0.95}
            letterSpacing={-4}
            color={COLORS.text}
          />
        </div>

        {/* Line 2: PUMILA. */}
        <div style={{ overflow: 'hidden', height: 145 }}>
          <KineticText
            text="PUMILA."
            startFrame={14}
            fontSize={138}
            lineHeight={0.95}
            letterSpacing={-4}
            color={COLORS.accent}
          />
        </div>

        {/* Supporting Punchy Subtext */}
        <div
          style={{
            marginTop: 36,
            maxWidth: 720,
            fontSize: 24,
            fontWeight: FONTS.weightRegular,
            color: COLORS.muted,
            lineHeight: 1.45,
            opacity: subtextSpring,
            transform: `translateY(${interpolate(subtextSpring, [0, 1], [30, 0])}px)`,
          }}
        >
          Walang maghapon sa pila ng munisipyo. Ang prangkisa mo, nasa cellphone mo na.
        </div>
      </div>

      {/* Bottom Editorial Hairline Metadata */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderTop: `1px solid ${COLORS.border}`,
          paddingTop: 20,
          fontSize: 13,
          color: COLORS.muted,
        }}
      >
        <div>BAYAN NG GASAN, MARINDUQUE</div>
        <div>STREAMLINED DIGITAL REGISTRATION SYSTEM</div>
      </div>
    </div>
  );
};
