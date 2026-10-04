import React from 'react';
import { Img, staticFile } from 'remotion';

interface MobileMockupProps {
  imageSrc: string;
  width?: number;
  height?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  scale?: number;
  translateY?: number;
  translateX?: number;
}

export const MobileMockup: React.FC<MobileMockupProps> = ({
  imageSrc,
  width = 340,
  height = 680,
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
        transform: `perspective(1200px) translateX(${translateX}px) translateY(${translateY}px) scale(${scale}) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
        transformStyle: 'preserve-3d',
        width,
        height,
      }}
    >
      {/* Smartphone Outer Chassis */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 44,
          padding: 10,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(30, 8, 12, 0.9) 60%, rgba(10, 2, 4, 0.98) 100%)',
          boxShadow: `
            0 30px 80px -15px rgba(0, 0, 0, 0.9),
            0 0 35px rgba(212, 175, 55, 0.25),
            0 0 0 2px rgba(212, 175, 55, 0.3)
          `,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Dynamic Island / Speaker Notch */}
        <div
          style={{
            position: 'absolute',
            top: 18,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 100,
            height: 22,
            backgroundColor: '#050102',
            borderRadius: 14,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#1A1820' }} />
          <div style={{ width: 10, height: 4, borderRadius: 2, backgroundColor: '#201A18' }} />
        </div>

        {/* Screen Display */}
        <div
          style={{
            flex: 1,
            borderRadius: 36,
            overflow: 'hidden',
            position: 'relative',
            backgroundColor: '#0F172A',
          }}
        >
          <Img
            src={staticFile(imageSrc)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
              display: 'block',
            }}
          />

          {/* Glass glare */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(125deg, rgba(255, 255, 255, 0.15) 0%, transparent 40%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
};
