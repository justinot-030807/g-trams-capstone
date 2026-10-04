import React from 'react';
import { Sequence, AbsoluteFill } from 'remotion';
import { Background } from './components/Background';
import { HookScene } from './scenes/HookScene';
import { FeatureShowcaseScene } from './scenes/FeatureShowcaseScene';
import { CtaScene } from './scenes/CtaScene';

export const PromoVideo: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0204',
        overflow: 'hidden',
        fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Dynamic Ambient Background Mesh across all 600 frames */}
      <Background />

      {/* SCENE 1: The Hook (0s - 3s / Frames 0 - 90) */}
      <Sequence from={0} durationInFrames={90} name="Hook Scene">
        <HookScene />
      </Sequence>

      {/* SCENE 2: Feature Showcase (3s - 15s / Frames 90 - 450) */}
      <Sequence from={90} durationInFrames={360} name="Feature Showcase">
        <FeatureShowcaseScene />
      </Sequence>

      {/* SCENE 3: Call to Action (15s - 20s / Frames 450 - 600) */}
      <Sequence from={450} durationInFrames={150} name="Call to Action">
        <CtaScene />
      </Sequence>
    </AbsoluteFill>
  );
};
