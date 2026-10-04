import React from 'react';
import { AbsoluteFill, Sequence, Audio, staticFile, interpolate, useCurrentFrame } from 'remotion';
import { COLORS } from './tokens/designTokens';
import { Scene1Hook } from './scenes/Scene1Hook';
import { Scene2Problem } from './scenes/Scene2Problem';
import { Scene3Demo } from './scenes/Scene3Demo';
import { Scene4Proof } from './scenes/Scene4Proof';
import { Scene5Cta } from './scenes/Scene5Cta';

export const PromoVideo30s: React.FC = () => {
  const frame = useCurrentFrame();

  // Background music ducking calculation:
  // -18dB is approx 0.125 amplitude. Normal level: 0.22. Fade out at end.
  const bgmVolume = interpolate(
    frame,
    [0, 10, 850, 900],
    [0.12, 0.12, 0.12, 0.0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        width: 1920,
        height: 1080,
        overflow: 'hidden',
      }}
    >
      {/* ================= BACKGROUND MUSIC BED (Ducked to -18dB) ================= */}
      <Audio
        src={staticFile('audio/bgm_minimal.wav')}
        volume={bgmVolume}
        startFrom={0}
      />

      {/* ================= SFX TRANSITIONS & CLICKS ================= */}
      {/* Scene 1 Whoosh */}
      <Sequence from={2} durationInFrames={20}>
        <Audio src={staticFile('audio/whoosh.wav')} volume={0.2} />
      </Sequence>

      {/* Scene 2 Transition Whoosh */}
      <Sequence from={82} durationInFrames={20}>
        <Audio src={staticFile('audio/whoosh.wav')} volume={0.2} />
      </Sequence>

      {/* Scene 3 Transition Whoosh */}
      <Sequence from={258} durationInFrames={20}>
        <Audio src={staticFile('audio/whoosh.wav')} volume={0.2} />
      </Sequence>

      {/* Scene 3 Demo Cursor Click */}
      <Sequence from={325} durationInFrames={15}>
        <Audio src={staticFile('audio/click.wav')} volume={0.28} />
      </Sequence>

      {/* Scene 3 Voucher Reveal Tick */}
      <Sequence from={395} durationInFrames={15}>
        <Audio src={staticFile('audio/tick.wav')} volume={0.25} />
      </Sequence>

      {/* Scene 4 Transition Whoosh */}
      <Sequence from={528} durationInFrames={20}>
        <Audio src={staticFile('audio/whoosh.wav')} volume={0.2} />
      </Sequence>

      {/* Scene 4 Verified Chime/Tick */}
      <Sequence from={585} durationInFrames={15}>
        <Audio src={staticFile('audio/tick.wav')} volume={0.25} />
      </Sequence>

      {/* Scene 5 Transition Whoosh */}
      <Sequence from={708} durationInFrames={20}>
        <Audio src={staticFile('audio/whoosh.wav')} volume={0.2} />
      </Sequence>

      {/* Scene 5 CTA Button Click/Tick */}
      <Sequence from={748} durationInFrames={15}>
        <Audio src={staticFile('audio/click.wav')} volume={0.28} />
      </Sequence>


      {/* ================= SCENE 1: HOOK (0s - 3s / Frames 0 - 90) ================= */}
      <Sequence from={0} durationInFrames={90} name="Scene 1: Hook">
        <Audio src={staticFile('audio/scene1_hook.mp3')} volume={1.0} />
        <Scene1Hook />
      </Sequence>

      {/* ================= SCENE 2: PROBLEM (3s - 9s / Frames 82 - 268) ================= */}
      {/* 8-frame overlap with Scene 1 to ensure smooth slide-in transition */}
      <Sequence from={82} durationInFrames={186} name="Scene 2: Problem">
        <Audio src={staticFile('audio/scene2_problem.mp3')} volume={1.0} />
        <Scene2Problem />
      </Sequence>

      {/* ================= SCENE 3: DEMO (9s - 18s / Frames 260 - 536) ================= */}
      {/* 8-frame overlap with Scene 2 */}
      <Sequence from={260} durationInFrames={276} name="Scene 3: Solution & Demo">
        <Audio src={staticFile('audio/scene3_demo.mp3')} volume={1.0} />
        <Scene3Demo />
      </Sequence>

      {/* ================= SCENE 4: PROOF (18s - 24s / Frames 528 - 714) ================= */}
      {/* 8-frame overlap with Scene 3 */}
      <Sequence from={528} durationInFrames={186} name="Scene 4: Proof & Audit">
        <Audio src={staticFile('audio/scene4_proof.mp3')} volume={1.0} />
        <Scene4Proof />
      </Sequence>

      {/* ================= SCENE 5: CTA (24s - 30s / Frames 708 - 900) ================= */}
      {/* 6-frame overlap with Scene 4 */}
      <Sequence from={708} durationInFrames={192} name="Scene 5: Call to Action">
        <Audio src={staticFile('audio/scene5_cta.mp3')} volume={1.0} />
        <Scene5Cta />
      </Sequence>
    </AbsoluteFill>
  );
};
