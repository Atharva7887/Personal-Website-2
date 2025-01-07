import { ReactNode } from 'react';
import { useDelayedAnimation } from '../../../hooks/useDelayedAnimation';

interface FadeScaleProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export default function FadeScale({ children, delay = 0, className = '' }: FadeScaleProps) {
  const { ref, isAnimated } = useDelayedAnimation({ delay });

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isAnimated 
          ? 'opacity-100 scale-100' 
          : 'opacity-0 scale-95'
      } ${className}`}
    >
      {children}
    </div>
  );
}