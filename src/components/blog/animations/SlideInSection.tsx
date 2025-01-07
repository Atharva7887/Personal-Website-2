import { ReactNode } from 'react';
import { useDelayedAnimation } from '../../../hooks/useDelayedAnimation';

interface SlideInSectionProps {
  children: ReactNode;
  delay?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  className?: string;
}

export default function SlideInSection({ 
  children, 
  delay = 0, 
  direction = 'up',
  className = '' 
}: SlideInSectionProps) {
  const { ref, isAnimated } = useDelayedAnimation({ delay });

  const getTransformValue = () => {
    const distance = '30px';
    switch (direction) {
      case 'left': return `translateX(${distance})`;
      case 'right': return `translateX(-${distance})`;
      case 'up': return `translateY(${distance})`;
      case 'down': return `translateY(-${distance})`;
      default: return `translateY(${distance})`;
    }
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${
        isAnimated 
          ? 'opacity-100 transform-none' 
          : `opacity-0 transform ${getTransformValue()}`
      } ${className}`}
    >
      {children}
    </div>
  );
}