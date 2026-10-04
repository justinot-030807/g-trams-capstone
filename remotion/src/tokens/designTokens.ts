import { Easing } from 'remotion';

export const COLORS = {
  bg: '#0B0B0F',         // Matte Obsidian Canvas
  text: '#F5F5F0',       // Bone White Primary
  accent: '#FF5A1F',     // International Safety Orange (Signal)
  muted: '#8E8E93',      // Muted Gray Secondary
  surface: '#15151B',    // Dark Card Surface
  surfaceLight: '#1E1E26',
  border: '#282832',     // Crisp 1px Flat Border
  borderHighlight: '#FF5A1F',
  green: '#10B981',      // Status Verified Tag
};

export const FONTS = {
  family: "'Inter', system-ui, -apple-system, sans-serif",
  weightRegular: 400,
  weightBold: 700,
};

// Strict Easing Curve as specified in brief
export const BEZIER_EXPO = Easing.bezier(0.16, 1, 0.3, 1);

export const SPRING_FAST = {
  damping: 12,
  mass: 0.4,
  stiffness: 140,
};

export const SPRING_SMOOTH = {
  damping: 14,
  mass: 0.5,
  stiffness: 110,
};
