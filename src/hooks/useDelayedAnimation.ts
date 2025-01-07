import { useEffect, useState } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';

interface DelayedAnimationOptions {
  threshold?: number;
  delay?: number;
  once?: boolean;
}

export function useDelayedAnimation({
  threshold = 0.1,
  delay = 0,
  once = true
}: DelayedAnimationOptions = {}) {
  const [isAnimated, setIsAnimated] = useState(false);
  const { ref, isVisible } = useIntersectionObserver({ threshold, freezeOnceVisible: once });

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsAnimated(true);
      }, delay * 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isVisible, delay]);

  return { ref, isAnimated };
}