import { ReactNode } from 'react';
import { useDelayedAnimation } from '../../hooks/useDelayedAnimation';

interface FadeInSectionProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export default function FadeInSection({ children, delay = 0, className = '' }: FadeInSectionProps) {
  const { ref, isAnimated } = useDelayedAnimation({ delay });

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${
        isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } ${className}`}
    >
      {children}
    </div>
  );
}