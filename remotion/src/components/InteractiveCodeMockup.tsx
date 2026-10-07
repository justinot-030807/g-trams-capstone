import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS, SPRING_FAST, SPRING_SMOOTH } from '../tokens/designTokens';
import { AnimatedCursor } from './AnimatedCursor';

interface InteractiveCodeMockupProps {
  localFrame: number;
}

export const InteractiveCodeMockup: React.FC<InteractiveCodeMockupProps> = ({ localFrame }) => {
  const { fps } = useVideoConfig();

  // Entrance spring
  const enterSpring = spring({
    frame: localFrame,
    fps,
    config: SPRING_SMOOTH,
  });

  // Cursor coordinates timeline:
  // 0 - 40: cursor enters from bottom right (x: 550, y: 480)
  // 40 - 70: cursor glides towards "Renew Permit" button (x: 380, y: 165)
  // 70: CLICK!
  // 70 - 130: cursor moves down to verify document upload (x: 420, y: 310)
  // 130 - 200: cursor glides to "Print Claim Voucher" (x: 460, y: 410)
  // 200: SECOND CLICK!

  const cursorX = interpolate(
    localFrame,
    [0, 30, 65, 80, 130, 150, 195],
    [650, 520, 395, 395, 430, 460, 460],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const cursorY = interpolate(
    localFrame,
    [0, 30, 65, 80, 130, 150, 195],
    [520, 360, 162, 162, 280, 385, 385],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Button click state around frame 65-78
  const isButtonClicked = localFrame >= 65;
  const buttonSpring = spring({
    frame: localFrame - 65,
    fps,
    config: { damping: 10, mass: 0.2, stiffness: 200 },
  });
  const buttonScale = isButtonClicked && localFrame < 82
    ? interpolate(buttonSpring, [0, 1], [0.94, 1.0])
    : 1.0;

  // Upload progress animation (frames 75 to 135)
  const uploadProgress = interpolate(localFrame, [75, 125], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Voucher Reveal spring (frames 140+)
  const voucherSpring = spring({
    frame: localFrame - 135,
    fps,
    config: SPRING_FAST,
  });

  // 3D subtle perspective and scroll simulation
  const rotateY = interpolate(localFrame, [0, 260], [-4, -1]);
  const rotateX = interpolate(localFrame, [0, 260], [3, 1]);
  const scrollOffset = interpolate(localFrame, [120, 260], [0, -45], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: 820,
        height: 540,
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transform: `perspective(1200px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateY(${interpolate(enterSpring, [0, 1], [60, 0])}px)`,
        opacity: enterSpring,
        position: 'relative',
        fontFamily: FONTS.family,
      }}
    >
      {/* 1. Browser Bar */}
      <div
        style={{
          height: 38,
          backgroundColor: '#0F0F14',
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#33333E' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#33333E' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#33333E' }} />
        </div>
        <div
          style={{
            fontSize: 12,
            color: COLORS.muted,
            letterSpacing: 0.5,
            fontFamily: FONTS.family,
          }}
        >
          g-trams-web2.vercel.app/operator-dashboard
        </div>
        <div
          style={{
            fontSize: 11,
            color: COLORS.accent,
            fontWeight: FONTS.weightBold,
            border: `1px solid ${COLORS.accent}`,
            padding: '2px 8px',
            borderRadius: 4,
          }}
        >
          LIVE RECORD
        </div>
      </div>

      {/* 2. Scrollable Dashboard Body */}
      <div
        style={{
          flex: 1,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          transform: `translateY(${scrollOffset}px)`,
          transition: 'transform 0.1s linear',
          position: 'relative',
        }}
      >
        {/* Unit Summary Header Card */}
        <div
          style={{
            backgroundColor: COLORS.surfaceLight,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
              REGISTERED UNIT #0042
            </div>
            <div style={{ fontSize: 24, fontWeight: FONTS.weightBold, color: COLORS.text, marginTop: 4 }}>
              MTOP-2026-0042
            </div>
            <div style={{ fontSize: 14, color: COLORS.muted, marginTop: 2 }}>
              Honda TMX 125 • Zone 1 Poblacion • Plate TR-8921
            </div>
          </div>

          {/* Action Trigger Button */}
          <div
            style={{
              padding: '10px 22px',
              backgroundColor: isButtonClicked ? COLORS.accent : 'transparent',
              color: isButtonClicked ? '#0B0B0F' : COLORS.accent,
              border: `1.5px solid ${COLORS.accent}`,
              borderRadius: 8,
              fontSize: 14,
              fontWeight: FONTS.weightBold,
              transform: `scale(${buttonScale})`,
              letterSpacing: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>RENEW PERMIT</span>
            <span>➔</span>
          </div>
        </div>

        {/* Requirements & Upload Card */}
        <div
          style={{
            backgroundColor: COLORS.surfaceLight,
            border: `1px solid ${uploadProgress === 100 ? COLORS.green : COLORS.border}`,
            borderRadius: 12,
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: FONTS.weightBold, color: COLORS.text }}>
              OR / CR &amp; CLEARANCE UPLOAD
            </span>
            <span
              style={{
                fontSize: 12,
                color: uploadProgress === 100 ? COLORS.green : COLORS.muted,
                fontWeight: FONTS.weightBold,
              }}
            >
              {uploadProgress < 100 ? `${Math.round(uploadProgress)}%` : 'VERIFIED ✓'}
            </span>
          </div>

          {/* Clean Flat Progress bar */}
          <div
            style={{
              width: '100%',
              height: 6,
              backgroundColor: '#101016',
              borderRadius: 3,
              marginTop: 10,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${uploadProgress}%`,
                height: '100%',
                backgroundColor: uploadProgress === 100 ? COLORS.green : COLORS.accent,
              }}
            />
          </div>
        </div>

        {/* Generated Payment Notice Pop */}
        {localFrame >= 135 && (
          <div
            style={{
              backgroundColor: '#121218',
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transform: `scale(${voucherSpring})`,
              opacity: voucherSpring,
            }}
          >
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {/* Minimal SVG QR Representation */}
              <div
                style={{
                  width: 54,
                  height: 54,
                  backgroundColor: '#FFFFFF',
                  padding: 4,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="46" height="46" viewBox="0 0 24 24" fill="#0B0B0F">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm8-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm11-2h3v3h-3v-3zm3 3h3v3h-3v-3zm-3 3h3v3h-3v-3zm-3-3h3v3h-3v-3z" />
                </svg>
              </div>

              <div>
                <div style={{ fontSize: 11, color: COLORS.accent, fontWeight: FONTS.weightBold }}>
                  OFFICIAL MUNICIPAL PAYMENT NOTICE
                </div>
                <div style={{ fontSize: 16, fontWeight: FONTS.weightBold, color: COLORS.text, marginTop: 2 }}>
                  GASAN-MTOP-2026-8812
                </div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>
                  Assessed Fee: ₱500.00 • Status: For Payment at Treasury
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#1E1E26',
                border: `1px solid ${COLORS.border}`,
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 12,
                color: COLORS.text,
                fontWeight: FONTS.weightBold,
              }}
            >
              DOWNLOAD VOUCHER
            </div>
          </div>
        )}
      </div>

      {/* 3. Dynamic Vector Cursor with Realistic Clicks */}
      <AnimatedCursor
        x={cursorX}
        y={cursorY}
        clickFrame={65}
      />
    </div>
  );
};
