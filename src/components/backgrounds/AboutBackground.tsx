import { useEffect, useState } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import '../../styles/backgrounds/about-background.css';

export function AboutBackground() {
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true
  });

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <div className={`about-background ${isVisible ? 'visible' : ''}`} />
      <div className={`about-grid ${isVisible ? 'visible' : ''}`} />
      <div className={`about-glow glow-1 ${isVisible ? 'visible' : ''}`} />
      <div className={`about-glow glow-2 ${isVisible ? 'visible' : ''}`} />
    </div>
  );
}