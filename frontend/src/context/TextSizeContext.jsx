import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const TextSizeContext = createContext({
  textScale: 'normal', // 'normal' (100%), 'large' (112.5%), 'xlarge' (125%)
  setTextScale: () => {},
  cycleTextScale: () => {},
  scaleLabel: 'Karaniwan',
});

export const TextSizeProvider = ({ children }) => {
  const [textScale, setTextScaleState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gtrams_text_scale');
      if (saved === 'large' || saved === 'xlarge' || saved === 'normal') {
        return saved;
      }
    }
    return 'normal';
  });

  const applyScale = useCallback((scale) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (scale === 'normal') {
      root.removeAttribute('data-text-scale');
    } else {
      root.setAttribute('data-text-scale', scale);
    }
  }, []);

  const setTextScale = useCallback((scale) => {
    const validScale = scale === 'large' || scale === 'xlarge' ? scale : 'normal';
    setTextScaleState(validScale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gtrams_text_scale', validScale);
    }
    applyScale(validScale);
  }, [applyScale]);

  const cycleTextScale = useCallback(() => {
    setTextScaleState((prev) => {
      let next = 'large';
      if (prev === 'large') next = 'xlarge';
      else if (prev === 'xlarge') next = 'normal';
      else next = 'large';

      if (typeof window !== 'undefined') {
        localStorage.setItem('gtrams_text_scale', next);
      }
      applyScale(next);
      return next;
    });
  }, [applyScale]);

  useEffect(() => {
    applyScale(textScale);
  }, [applyScale, textScale]);

  const scaleLabel = textScale === 'xlarge' ? 'Napakalaki (125%)' : textScale === 'large' ? 'Malaki (112.5%)' : 'Karaniwan (100%)';

  return (
    <TextSizeContext.Provider
      value={{
        textScale,
        setTextScale,
        cycleTextScale,
        scaleLabel,
      }}
    >
      {children}
    </TextSizeContext.Provider>
  );
};

export const useTextSize = () => useContext(TextSizeContext);
export default TextSizeContext;
