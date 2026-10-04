import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS, SPRING_FAST, SPRING_SMOOTH } from '../tokens/designTokens';
import { KineticText } from '../components/KineticWord';

export const Scene4Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const enterSpring = spring({
    frame,
    fps,
    config: SPRING_SMOOTH,
  });

  // Table entrance
  const tableSpring = spring({
    frame: frame - 15,
    fps,
    config: SPRING_FAST,
  });

  // Floating verification badge entrance
  const badgeSpring = spring({
    frame: frame - 55,
    fps,
    config: SPRING_FAST,
  });

  // Camera push-in
  const cameraScale = interpolate(frame, [0, 180], [1.0, 1.03], {
    extrapolateRight: 'clamp',
  });

  // Overlap exit transition (last 20 frames)
  const exitProgress = interpolate(frame, [160, 180], [0, 1], {
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
              border: `1.5px solid ${COLORS.green}`,
              borderRadius: 4,
              fontSize: 12,
              fontWeight: FONTS.weightBold,
              color: COLORS.green,
              letterSpacing: 1.5,
            }}
          >
            04 // REGULATORY INTEGRITY
          </div>
          <span style={{ fontSize: 14, color: COLORS.muted }}>
            MUNICIPAL FRANCHISE MASTERLIST &amp; VERIFICATION
          </span>
        </div>

        <div style={{ fontSize: 13, color: COLORS.green, fontWeight: FONTS.weightBold }}>
          LIVE MUNICIPAL REPOSITORY
        </div>
      </div>

      {/* Main Content Split */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 60,
        }}
      >
        {/* Left Side: Proof Headline */}
        <div style={{ width: 620 }}>
          <div style={{ overflow: 'hidden', height: 100 }}>
            <KineticText
              text="0 COLORUM."
              startFrame={6}
              fontSize={96}
              lineHeight={0.98}
              letterSpacing={-3}
              color={COLORS.text}
            />
          </div>

          <div style={{ overflow: 'hidden', height: 105 }}>
            <KineticText
              text="100% VERIFIED."
              startFrame={14}
              fontSize={96}
              lineHeight={0.98}
              letterSpacing={-3}
              color={COLORS.accent}
            />
          </div>

          <p
            style={{
              marginTop: 24,
              fontSize: 22,
              color: COLORS.muted,
              lineHeight: 1.5,
              fontWeight: FONTS.weightRegular,
              opacity: enterSpring,
            }}
          >
            Sentralisadong masterlist para sa MTFRB at LGU. Bawat byahe sa bayan ng Gasan, rehistrado, ligtas, at may pananagutan.
          </p>

          {/* Metric Summary Pill */}
          <div
            style={{
              marginTop: 30,
              padding: '14px 22px',
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              display: 'flex',
              gap: 24,
            }}
          >
            <div>
              <div style={{ fontSize: 22, fontWeight: FONTS.weightBold, color: COLORS.text }}>248</div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>AUTHORIZED UNITS</div>
            </div>
            <div style={{ width: 1, backgroundColor: COLORS.border }} />
            <div>
              <div style={{ fontSize: 22, fontWeight: FONTS.weightBold, color: COLORS.accent }}>10</div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>TODA ASSOCIATIONS</div>
            </div>
            <div style={{ width: 1, backgroundColor: COLORS.border }} />
            <div>
              <div style={{ fontSize: 22, fontWeight: FONTS.weightBold, color: COLORS.green }}>0</div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>COLORUM TOLERANCE</div>
            </div>
          </div>
        </div>

        {/* Right Side: Code-Rendered Live Ledger Table */}
        <div
          style={{
            width: 820,
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 16,
            padding: 26,
            opacity: tableSpring,
            transform: `translateY(${interpolate(tableSpring, [0, 1], [40, 0])}px)`,
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: `1px solid ${COLORS.border}`,
              paddingBottom: 14,
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: FONTS.weightBold, color: COLORS.muted, letterSpacing: 1 }}>
              LIVE FRANCHISE LEDGER // MUNICIPAL AUDIT
            </span>
            <span style={{ fontSize: 11, color: COLORS.green, fontWeight: FONTS.weightBold }}>
              ● SYNCED LIVE
            </span>
          </div>

          {/* Table Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { mtop: 'MTOP-2026-0042', name: 'Juan Dela Cruz', toda: 'GASAN CENTRAL TODA', status: 'ACTIVE', color: COLORS.green },
              { mtop: 'MTOP-2026-0089', name: 'Ricardo Santos', toda: 'POB-BAC TODA', status: 'FOR SIGNING', color: COLORS.accent },
              { mtop: 'MTOP-2026-0105', name: 'Elena Reyes', toda: 'DAWIS-LIBAS TODA', status: 'READY FOR PICKUP', color: '#FBBF24' },
              { mtop: 'MTOP-2026-0122', name: 'Mateo Villanueva', toda: 'BANGBANG TODA', status: 'ACTIVE', color: COLORS.green },
            ].map((row, idx) => {
              const rowSpring = spring({
                frame: frame - 20 - idx * 4,
                fps,
                config: SPRING_FAST,
              });
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: COLORS.surfaceLight,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 8,
                    padding: '12px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transform: `translateX(${interpolate(rowSpring, [0, 1], [30, 0])}px)`,
                    opacity: rowSpring,
                  }}
                >
                  <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: FONTS.weightBold, color: COLORS.text, fontFamily: FONTS.family }}>
                      {row.mtop}
                    </span>
                    <span style={{ fontSize: 13, color: COLORS.muted }}>
                      {row.name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: COLORS.muted }}>
                      {row.toda}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: FONTS.weightBold,
                        color: row.color,
                        border: `1px solid ${row.color}`,
                        padding: '3px 8px',
                        borderRadius: 4,
                        letterSpacing: 0.5,
                      }}
                    >
                      {row.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating Verified QR Pill Badge */}
          <div
            style={{
              position: 'absolute',
              right: 28,
              bottom: -22,
              backgroundColor: '#0F261C',
              border: `1.5px solid ${COLORS.green}`,
              borderRadius: 30,
              padding: '10px 22px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              transform: `scale(${badgeSpring})`,
              opacity: badgeSpring,
            }}
          >
            <span style={{ color: COLORS.green, fontSize: 16, fontWeight: 'bold' }}>✓</span>
            <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: FONTS.weightBold, letterSpacing: 0.5 }}>
              QR SCAN: VERIFIED LGU CREDENTIAL
            </span>
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
        <div>PASSENGER SAFETY &amp; ENFORCEMENT COMPLIANCE</div>
        <div>MUNICIPAL TRICYCLE FRANCHISING AND REGULATORY BOARD</div>
      </div>
    </div>
  );
};
