import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { DeviceMockup } from '../components/DeviceMockup';
import { MobileMockup } from '../components/MobileMockup';

export const FeatureShowcaseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Local frame for this scene (90 - 450 frames = 0 - 360 local)
  // Sub-sequence 1: 0 - 120
  // Sub-sequence 2: 120 - 240
  // Sub-sequence 3: 240 - 360

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        overflow: 'hidden',
      }}
    >
      {/* ================= SEQUENCE 1: ONLINE APPLICATION ================= */}
      {frame >= 0 && frame < 128 && (
        <Sequence1 localFrame={frame} fps={fps} />
      )}

      {/* ================= SEQUENCE 2: MASTERLIST & MONITORING ================= */}
      {frame >= 115 && frame < 248 && (
        <Sequence2 localFrame={frame - 120} fps={fps} />
      )}

      {/* ================= SEQUENCE 3: SMART QR VERIFICATION ================= */}
      {frame >= 235 && frame <= 360 && (
        <Sequence3 localFrame={frame - 240} fps={fps} />
      )}
    </div>
  );
};

// -------------------------------------------------------------
// Sequence 1 Component
// -------------------------------------------------------------
const Sequence1: React.FC<{ localFrame: number; fps: number }> = ({ localFrame, fps }) => {
  const enterSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 13, mass: 0.6, stiffness: 110 },
  });

  const exitOpacity = interpolate(localFrame, [105, 120], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 3D camera pan & tilt
  const rotY = interpolate(localFrame, [0, 120], [-12, -4]);
  const rotX = interpolate(localFrame, [0, 120], [8, 4]);
  const zoom = interpolate(localFrame, [0, 120], [1.02, 1.15]);
  const panY = interpolate(localFrame, [0, 120], [0, -6]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: exitOpacity,
        display: 'flex',
        alignItems: 'center',
        padding: '0 90px',
        justifyContent: 'space-between',
      }}
    >
      {/* Left Column: Kinetic Text & Feature Highlights */}
      <div
        style={{
          width: 580,
          transform: `translateX(${interpolate(enterSpring, [0, 1], [-80, 0])}px)`,
          opacity: enterSpring,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 20,
            background: 'rgba(212, 175, 55, 0.15)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            marginBottom: 20,
          }}
        >
          <span style={{ color: '#D4AF37', fontSize: 13, fontWeight: 800, letterSpacing: 2 }}>
            FEATURE 01 // CITIZEN &amp; OPERATOR PORTAL
          </span>
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: 48,
            fontWeight: 900,
            color: '#FFFFFF',
            lineHeight: 1.15,
            letterSpacing: -0.5,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Streamlined Online MTOP Application
        </h2>

        <p
          style={{
            fontSize: 18,
            color: 'rgba(255, 255, 255, 0.75)',
            lineHeight: 1.5,
            marginTop: 16,
            marginBottom: 28,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Submit new franchise permits or renew existing licenses in minutes without physical municipal hall lines.
        </p>

        {/* Highlight Bullets with Staggered Entrance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { title: 'Digital Requirements Upload', desc: 'Secure OR/CR, License & Barangay clearance processing' },
            { title: 'Live Milestone Tracking', desc: 'Real-time SMS & web status from review to signing' },
            { title: 'Cashier & Treasury Integration', desc: 'Direct over-the-counter payment processing & receipt logging' },
          ].map((item, idx) => {
            const itemSpring = spring({
              frame: localFrame - 15 - idx * 8,
              fps,
              config: { damping: 12, stiffness: 120 },
            });
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '12px 18px',
                  borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transform: `translateX(${interpolate(itemSpring, [0, 1], [40, 0])}px)`,
                  opacity: itemSpring,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: '#9E2A2B',
                    border: '1px solid #D4AF37',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F4D03F',
                    fontSize: 13,
                    fontWeight: 'bold',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  ✓
                </div>
                <div>
                  <div style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 700 }}>{item.title}</div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 13, marginTop: 2 }}>{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: 3D Tilting Device Mockup */}
      <div
        style={{
          transform: `translateX(${interpolate(enterSpring, [0, 1], [100, 0])}px)`,
          opacity: enterSpring,
        }}
      >
        <DeviceMockup
          imageSrc="screen2_application.png"
          width={1050}
          height={640}
          rotateX={rotX}
          rotateY={rotY}
          rotateZ={-1}
          zoom={zoom}
          panY={panY}
          title="g-trams-web2.vercel.app/apply-franchise"
        />
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Sequence 2 Component
// -------------------------------------------------------------
const Sequence2: React.FC<{ localFrame: number; fps: number }> = ({ localFrame, fps }) => {
  const enterSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 13, mass: 0.6, stiffness: 110 },
  });

  const exitOpacity = interpolate(localFrame, [105, 120], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Reverse 3D tilt & dynamic zoom
  const rotY = interpolate(localFrame, [0, 120], [14, 5]);
  const rotX = interpolate(localFrame, [0, 120], [7, 3]);
  const zoom = interpolate(localFrame, [0, 120], [1.0, 1.18]);
  const panX = interpolate(localFrame, [0, 120], [0, -4]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: exitOpacity,
        display: 'flex',
        alignItems: 'center',
        padding: '0 90px',
        justifyContent: 'space-between',
      }}
    >
      {/* Left Column: 3D Tilting Device Mockup */}
      <div
        style={{
          transform: `translateX(${interpolate(enterSpring, [0, 1], [-100, 0])}px)`,
          opacity: enterSpring,
        }}
      >
        <DeviceMockup
          imageSrc="screen3_masterlist.png"
          width={1050}
          height={640}
          rotateX={rotX}
          rotateY={rotY}
          rotateZ={1}
          zoom={zoom}
          panX={panX}
          title="g-trams-web2.vercel.app/franchise-masterlist"
        />
      </div>

      {/* Right Column: Kinetic Feature Text */}
      <div
        style={{
          width: 580,
          transform: `translateX(${interpolate(enterSpring, [0, 1], [80, 0])}px)`,
          opacity: enterSpring,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 20,
            background: 'rgba(158, 42, 43, 0.25)',
            border: '1px solid rgba(158, 42, 43, 0.6)',
            marginBottom: 20,
          }}
        >
          <span style={{ color: '#F87171', fontSize: 13, fontWeight: 800, letterSpacing: 2 }}>
            FEATURE 02 // MUNICIPAL REGULATORY OVERSIGHT
          </span>
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: 48,
            fontWeight: 900,
            color: '#FFFFFF',
            lineHeight: 1.15,
            letterSpacing: -0.5,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Real-Time Franchise Masterlist &amp; Auditing
        </h2>

        <p
          style={{
            fontSize: 18,
            color: 'rgba(255, 255, 255, 0.75)',
            lineHeight: 1.5,
            marginTop: 16,
            marginBottom: 28,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Equip the MTFRB and LGU administrators with instant visibility over every registered tricycle unit in Gasan.
        </p>

        {/* Highlight Bullets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { title: 'Live Semantic Status Filters', desc: 'Instant breakdown of Active, Pending, For Signing & Expired permits' },
            { title: 'TODA Association Route Quotas', desc: 'Prevent route saturation and ensure balanced zone coverage' },
            { title: 'Automated Revocation & Compliance', desc: 'Accurate record keeping and municipal audit trails' },
          ].map((item, idx) => {
            const itemSpring = spring({
              frame: localFrame - 15 - idx * 8,
              fps,
              config: { damping: 12, stiffness: 120 },
            });
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '12px 18px',
                  borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transform: `translateX(${interpolate(itemSpring, [0, 1], [-40, 0])}px)`,
                  opacity: itemSpring,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: '#D4AF37',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1A080A',
                    fontSize: 13,
                    fontWeight: 'bold',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  ★
                </div>
                <div>
                  <div style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 700 }}>{item.title}</div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 13, marginTop: 2 }}>{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Sequence 3 Component
// -------------------------------------------------------------
const Sequence3: React.FC<{ localFrame: number; fps: number }> = ({ localFrame, fps }) => {
  const enterSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 13, mass: 0.6, stiffness: 110 },
  });

  const exitOpacity = interpolate(localFrame, [105, 120], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Dual-device 3D movement
  const phoneScale = interpolate(enterSpring, [0, 1], [0.8, 1]);
  const phoneTilt = interpolate(localFrame, [0, 120], [6, -4]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: exitOpacity,
        display: 'flex',
        alignItems: 'center',
        padding: '0 90px',
        justifyContent: 'space-between',
      }}
    >
      {/* Left Column: Text Highlights */}
      <div
        style={{
          width: 580,
          transform: `translateX(${interpolate(enterSpring, [0, 1], [-80, 0])}px)`,
          opacity: enterSpring,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 20,
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            marginBottom: 20,
          }}
        >
          <span style={{ color: '#4ADE80', fontSize: 13, fontWeight: 800, letterSpacing: 2 }}>
            FEATURE 03 // SAFETY &amp; VERIFICATION
          </span>
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: 48,
            fontWeight: 900,
            color: '#FFFFFF',
            lineHeight: 1.15,
            letterSpacing: -0.5,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Instant QR Code Public Verification
        </h2>

        <p
          style={{
            fontSize: 18,
            color: 'rgba(255, 255, 255, 0.75)',
            lineHeight: 1.5,
            marginTop: 16,
            marginBottom: 28,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Protect commuters and verify legitimate operators on the road with quick smartphone QR scanning.
        </p>

        {/* Feature Highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { title: 'Anti-Counterfeit Digital Badge', desc: 'Real-time credentials linked directly to municipal records' },
            { title: 'TODA & Driver Verification', desc: 'Instant confirmation of route zone, unit number and validity' },
            { title: 'Commuter Safety & Transparency', desc: 'Zero unfranchised or illegal colorum tricycles' },
          ].map((item, idx) => {
            const itemSpring = spring({
              frame: localFrame - 15 - idx * 8,
              fps,
              config: { damping: 12, stiffness: 120 },
            });
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '12px 18px',
                  borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transform: `translateX(${interpolate(itemSpring, [0, 1], [40, 0])}px)`,
                  opacity: itemSpring,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: '#15803D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 'bold',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  ✓
                </div>
                <div>
                  <div style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 700 }}>{item.title}</div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 13, marginTop: 2 }}>{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Layered Desktop & Smartphone Mockups */}
      <div
        style={{
          position: 'relative',
          width: 1050,
          height: 640,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Background Desktop Landing Hub */}
        <div style={{ opacity: 0.6, transform: 'scale(0.88) translateX(-40px) perspective(1200px) rotateY(-8deg)' }}>
          <DeviceMockup
            imageSrc="screen1_landing.png"
            width={950}
            height={580}
            title="g-trams-web2.vercel.app"
          />
        </div>

        {/* Foreground Smartphone Mockup with QR Verification Card */}
        <div
          style={{
            position: 'absolute',
            right: 120,
            transform: `scale(${phoneScale}) perspective(1000px) rotateY(${phoneTilt}deg) rotateX(4deg)`,
            filter: 'drop-shadow(0 30px 60px rgba(0, 0, 0, 0.8))',
          }}
        >
          <MobileMockup
            imageSrc="screen4_verify.png"
            width={310}
            height={620}
          />
        </div>
      </div>
    </div>
  );
};
