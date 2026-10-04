import React from "react";
import { Composition } from "remotion";
import { PromoVideo30s } from "./PromoVideo30s";
import { PromoVideo } from "./PromoVideo";

export const MyComposition: React.FC = () => {
  return (
    <>
      {/* 30-Second High-Energy Clean Promo Video (900 frames @ 30fps) */}
      <Composition
        id="PromoVideo30s"
        component={PromoVideo30s}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />

      {/* 20-Second Legacy Showcase Video (600 frames @ 30fps) */}
      <Composition
        id="PromoVideo"
        component={PromoVideo}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
