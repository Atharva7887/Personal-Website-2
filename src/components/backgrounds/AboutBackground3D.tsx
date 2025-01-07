import { useRef } from 'react';
import { useThreeAnimation } from '../../hooks/useThreeAnimation';

export default function AboutBackground3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  useThreeAnimation(containerRef);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-0"
      style={{ 
        pointerEvents: 'none',
        mixBlendMode: 'screen'
      }} 
    />
  );
}