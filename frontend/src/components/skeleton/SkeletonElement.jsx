import React from 'react';

/**
 * Primitive skeleton placeholder element.
 * Supports custom shapes, dimensions, and staggered top-to-bottom animation delay.
 */
const SkeletonElement = ({
  className = '',
  width,
  height,
  rounded = 'rounded-xl',
  delay = 0,
  style = {}
}) => {
  const customStyles = {
    ...style,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...(delay > 0 ? { animationDelay: `${delay}ms` } : {})
  };

  return (
    <div
      className={`skeleton-shimmer ${rounded} ${className}`}
      style={customStyles}
    />
  );
};

export default SkeletonElement;
