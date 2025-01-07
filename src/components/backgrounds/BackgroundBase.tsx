import { ReactNode } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

interface BackgroundBaseProps {
  className: string;
  children?: ReactNode;
}

export function BackgroundBase({ className, children }: BackgroundBaseProps) {
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true,
  });

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <div className={`${className}-background ${isVisible ? 'visible' : ''}`} />
      <div className={`${className}-grid ${isVisible ? 'visible' : ''}`} />
      <div className={`${className}-glow glow-1 ${isVisible ? 'visible' : ''}`} />
      <div className={`${className}-glow glow-2 ${isVisible ? 'visible' : ''}`} />
      {children}
    </div>
  );
}