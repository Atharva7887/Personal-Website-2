import { useEffect, useRef } from 'react';
import { ScrollAnimationOptions } from '../types/animation';

export function useScrollAnimation({
  threshold = 0.1,
  animation = 'fade-up',
  delay = 0,
  duration = 0.6,
  once = true
}: ScrollAnimationOptions = {}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.style.animationDelay = `${delay}s`;
          element.style.animationDuration = `${duration}s`;
          element.classList.add('animate', animation);
          
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          element.classList.remove('animate', animation);
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [animation, delay, duration, once, threshold]);

  return ref;
}