import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS, SPRING_FAST } from '../tokens/designTokens';

interface KineticTextProps {
  text: string;
  startFrame?: number;
  staggerFrames?: number; // frames between each word
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  color?: string;
  accentIndices?: number[]; // indices of words that get accent color #FF5A1F
  fontWeight?: number;
  style?: React.CSSProperties;
}

export const KineticText: React.FC<KineticTextProps> = ({
  text,
  startFrame = 0,
  staggerFrames = 4,
  fontSize = 96,
  lineHeight = 1.0,
  letterSpacing = -2,
  color = COLORS.text,
  accentIndices = [],
  fontWeight = FONTS.weightBold,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = text.split(' ');

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: `${fontSize * 0.28}px`,
        fontFamily: FONTS.family,
        fontWeight,
        fontSize,
        lineHeight,
        letterSpacing,
        ...style,
      }}
    >
      {words.map((word, idx) => {
        const wordDelay = startFrame + idx * staggerFrames;
        const progress = spring({
          frame: frame - wordDelay,
          fps,
          config: SPRING_FAST,
        });

        const translateY = interpolate(progress, [0, 1], [115, 0]);
        const isAccent = accentIndices.includes(idx);

        return (
          <span
            key={idx}
            style={{
              display: 'inline-block',
              overflow: 'hidden',
              verticalAlign: 'top',
              paddingBottom: `${fontSize * 0.08}px`,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                transform: `translateY(${translateY}%)`,
                color: isAccent ? COLORS.accent : color,
              }}
            >
              {word}
            </span>
          </span>
        );
      })}
    </div>
  );
};
