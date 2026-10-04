import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS, SPRING_FAST, SPRING_SMOOTH } from '../tokens/designTokens';
import { KineticText } from '../components/KineticWord';

export const Scene2Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const enterSpring = spring({
    frame,
    fps,
    config: SPRING_SMOOTH,
  });

  // Staggered cards entrance
  const cardSpring = spring({
    frame: frame - 25,
    fps,
    config: SPRING_FAST,
  });

  // Camera push-in
  const cameraScale = interpolate(frame, [0, 180], [1.0, 1.03], {
    extrapolateRight: 'clamp',
  });

  // Overlap exit transition
  const exitProgress = interpolate(frame, [160, 180], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sceneOpacity = interpolate(exitProgress, [0, 1], [1, 0]);
  const sceneTranslateY = interpolate(exitProgress, [0, 1], [0, -30]);

  // Strike-through line progress
  const strikeProgress = interpolate(frame, [60, 95], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: COLORS.bg,
        opacity: sceneOpacity,
        transform: `scale(${cameraScale}) translateY(${sceneTranslateY}px)`,
        padding: '90px 100px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: FONTS.family,
        zIndex: 10,
      }}
    >
      {/* Top Header */}
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
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: 4,
              fontSize: 12,
              fontWeight: FONTS.weightBold,
              color: COLORS.muted,
              letterSpacing: 1.5,
            }}
          >
            02 // THE FRICTION
          </div>
          <span style={{ fontSize: 14, color: COLORS.muted }}>
            TRADITIONAL PAPER PROCESS INEFFICIENCY
          </span>
        </div>

        <div style={{ fontSize: 13, color: COLORS.accent, fontWeight: FONTS.weightBold }}>
          TAPOS NA ANG LUMANG SISTEMA
        </div>
      </div>

      {/* Main 12-Column Asymmetric Content Split */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 60,
        }}
      >
        {/* Left Column (Columns 1-6): Kinetic Problem Statement */}
        <div style={{ width: 660 }}>
          <div style={{ overflow: 'hidden', height: 105 }}>
            <KineticText
              text="4 NA ORAS"
              startFrame={8}
              fontSize={96}
              lineHeight={0.98}
              letterSpacing={-3}
              color={COLORS.text}
            />
          </div>

          <div style={{ overflow: 'hidden', height: 110 }}>
            <KineticText
              text="PARA SA ISANG PAPEL?"
              startFrame={18}
              fontSize={96}
              lineHeight={0.98}
              letterSpacing={-3}
              color={COLORS.accent}
            />
          </div>

          <p
            style={{
              marginTop: 28,
              fontSize: 22,
              color: COLORS.muted,
              lineHeight: 1.5,
              fontWeight: FONTS.weightRegular,
              opacity: enterSpring,
              transform: `translateY(${interpolate(enterSpring, [0, 1], [30, 0])}px)`,
            }}
          >
            Nawawalang requirements. Colorum na byahe. Pabalik-balik sa munisipyo na sumasayang sa araw ng pamamasada.
          </p>
        </div>

        {/* Right Column (Columns 7-12): Flat Friction Breakdown Card */}
        <div
          style={{
            width: 780,
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 16,
            padding: 32,
            opacity: cardSpring,
            transform: `translateY(${interpolate(cardSpring, [0, 1], [50, 0])}px)`,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: COLORS.muted,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              marginBottom: 20,
              fontWeight: FONTS.weightBold,
            }}
          >
            SYSTEM AUDIT COMPARISON // LUMANG SISTEMA VS G-TRAMS
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[
              {
                label: 'ORAS SA PILA',
                oldVal: '240 MINUTO SA HALL',
                newVal: '3 MINUTO SA PHONE',
              },
              {
                label: 'DOKUMENTO',
                oldVal: 'PHOTOCOPY & NAWAWALANG FOLDER',
                newVal: 'DIGITAL UPLOAD & CLOUD STORAGE',
              },
              {
                label: 'PRANGKISA AUDIT',
                oldVal: 'MANUAL LOGBOOK (UNTRACKED)',
                newVal: '100% REAL-TIME MASTERLIST',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: COLORS.surfaceLight,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 10,
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: COLORS.muted, letterSpacing: 1, fontWeight: FONTS.weightBold }}>
                    {item.label}
                  </div>
                  {/* Old struck-through value */}
                  <div
                    style={{
                      fontSize: 14,
                      color: COLORS.muted,
                      marginTop: 4,
                      position: 'relative',
                      display: 'inline-block',
                    }}
                  >
                    <span>{item.oldVal}</span>
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        width: `${strikeProgress}%`,
                        height: 2,
                        backgroundColor: COLORS.accent,
                      }}
                    />
                  </div>
                </div>

                {/* New Modern Value */}
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: FONTS.weightBold,
                    color: COLORS.accent,
                    textAlign: 'right',
                  }}
                >
                  {item.newVal}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Hairline */}
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
        <div>LGU GASAN MODERNIZATION INITIATIVE</div>
        <div>ELIMINATING DELAYS • ZERO PAPER RED TAPE</div>
      </div>
    </div>
  );
};
