import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS, SPRING_FAST, SPRING_SMOOTH } from '../tokens/designTokens';
import { KineticText } from '../components/KineticWord';
import { InteractiveCodeMockup } from '../components/InteractiveCodeMockup';

export const Scene3Demo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const enterSpring = spring({
    frame,
    fps,
    config: SPRING_SMOOTH,
  });

  // Camera push-in for realistic UI depth
  const cameraScale = interpolate(frame, [0, 270], [1.0, 1.04], {
    extrapolateRight: 'clamp',
  });

  // Overlap exit transition (last 20 frames)
  const exitProgress = interpolate(frame, [250, 270], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sceneOpacity = interpolate(exitProgress, [0, 1], [1, 0]);
  const sceneTranslateY = interpolate(exitProgress, [0, 1], [0, -30]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: COLORS.bg,
        opacity: sceneOpacity,
        transform: `scale(${cameraScale}) translateY(${sceneTranslateY}px)`,
        padding: '80px 90px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: FONTS.family,
        zIndex: 10,
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${COLORS.border}`,
          paddingBottom: 18,
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
            03 // LIVE PRODUCT DEMO
          </div>
          <span style={{ fontSize: 14, color: COLORS.muted }}>
            OPERATOR SELF-SERVICE PORTAL
          </span>
        </div>

        <div style={{ fontSize: 13, color: COLORS.muted }}>
          SECURE MOBILE-OPTIMIZED APPLICATION
        </div>
      </div>

      {/* Main 12-Column Asymmetric Content */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 50,
        }}
      >
        {/* Left Side: Kinetic Headline and Feature Step Checklist */}
        <div style={{ width: 520 }}>
          <div style={{ overflow: 'hidden', height: 90 }}>
            <KineticText
              text="ISANG TAP."
              startFrame={6}
              fontSize={84}
              lineHeight={0.98}
              letterSpacing={-2.5}
              color={COLORS.text}
            />
          </div>

          <div style={{ overflow: 'hidden', height: 160 }}>
            <KineticText
              text="TAPOS ANG PRANGKISA."
              startFrame={14}
              fontSize={80}
              lineHeight={0.98}
              letterSpacing={-2.5}
              color={COLORS.accent}
            />
          </div>

          <p
            style={{
              marginTop: 18,
              fontSize: 19,
              color: COLORS.muted,
              lineHeight: 1.5,
              fontWeight: FONTS.weightRegular,
              opacity: enterSpring,
            }}
          >
            I-renew ang permit mula sa cellphone. I-upload ang OR/CR, at tanggapin ang opisyal na claim voucher nang walang abala.
          </p>

          {/* Staggered Step Indicators */}
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { num: '01', title: 'One-Click Permit Renewal' },
              { num: '02', title: 'Instant Document Attachment' },
              { num: '03', title: 'Direct Cashier Payment & MTOP' },
            ].map((step, idx) => {
              const stepSpring = spring({
                frame: frame - 25 - idx * 6,
                fps,
                config: SPRING_FAST,
              });
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '8px 14px',
                    borderRadius: 8,
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    transform: `translateX(${interpolate(stepSpring, [0, 1], [-20, 0])}px)`,
                    opacity: stepSpring,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: FONTS.weightBold,
                      color: COLORS.accent,
                      fontFamily: FONTS.family,
                    }}
                  >
                    {step.num}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: FONTS.weightBold, color: COLORS.text }}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Realistic In-Code Interactive Product Mockup */}
        <div style={{ width: 840 }}>
          <InteractiveCodeMockup localFrame={frame} />
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: `1px solid ${COLORS.border}`,
          paddingTop: 16,
          fontSize: 13,
          color: COLORS.muted,
        }}
      >
        <div>END-TO-END DIGITAL MOTORIZED TRICYCLE LICENSING</div>
        <div>TIME SAVED PER OPERATOR: &gt; 95%</div>
      </div>
    </div>
  );
};
