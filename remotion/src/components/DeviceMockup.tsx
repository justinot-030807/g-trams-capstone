import React from 'react';
import { Img, staticFile } from 'remotion';

interface DeviceMockupProps {
  imageSrc: string;
  width?: number;
  height?: number;
  panX?: number; // percentage offset
  panY?: number;
  zoom?: number; // scale factor of image inside screen
  title?: string;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  scale?: number;
  translateY?: number;
  translateX?: number;
}

export const DeviceMockup: React.FC<DeviceMockupProps> = ({
  imageSrc,
  width = 1100,
  height = 680,
  panX = 0,
  panY = 0,
  zoom = 1,
  title = 'g-trams-web2.vercel.app',
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  scale = 1,
  translateY = 0,
  translateX = 0,
}) => {
  return (
    <div
      style={{
        transform: `perspective(1400px) translateX(${translateX}px) translateY(${translateY}px) scale(${scale}) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
        transformStyle: 'preserve-3d',
        transition: 'transform 0.1s ease-out',
        width,
        height,
      }}
    >
      {/* Outer Device Chassis Frame */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 22,
          padding: 8,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(60, 20, 24, 0.6) 40%, rgba(20, 5, 8, 0.95) 100%)',
          boxShadow: `
            0 40px 90px -20px rgba(0, 0, 0, 0.85),
            0 15px 40px rgba(158, 42, 43, 0.3),
            0 0 0 1px rgba(212, 175, 55, 0.25)
          `,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Edge Glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 22,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            pointerEvents: 'none',
          }}
        />

        {/* Browser Top Header */}
        <div
          style={{
            height: 38,
            backgroundColor: '#170E10',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Window control buttons */}
          <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
            <div style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#EF4444' }} />
            <div style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#F59E0B' }} />
            <div style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#10B981' }} />
          </div>

          {/* Browser Address Pill */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderRadius: 8,
              padding: '3px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span style={{ color: '#D4AF37', fontSize: 11 }}>🔒</span>
            <span
              style={{
                color: 'rgba(255, 255, 255, 0.75)',
                fontSize: 12,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontWeight: 500,
                letterSpacing: 0.3,
              }}
            >
              https://{title}
            </span>
          </div>
        </div>

        {/* Viewport Screen Content */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#0F172A',
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Screenshot Image with Smooth Pan & Zoom */}
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: `scale(${zoom}) translate(${panX}%, ${panY}%)`,
              transformOrigin: 'center center',
              transition: 'transform 0.05s linear',
            }}
          >
            <Img
              src={staticFile(imageSrc)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'top center',
                display: 'block',
              }}
            />
          </div>

          {/* Cinematic Glass Reflection Sheen */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(130deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 45%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
};
