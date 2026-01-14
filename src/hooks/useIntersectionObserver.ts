import { useRef, useEffect, useState } from 'react';

interface IntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  options: IntersectionObserverOptions = { threshold: 0.1 }
) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { freezeOnceVisible = false, ...observerOptions } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // If we want to freeze the state once it becomes visible and it's already visible, do nothing
    if (freezeOnceVisible && isVisible) return;

    const observer = new IntersectionObserver(([entry]) => {
      const newIsVisible = entry.isIntersecting;
      setIsVisible(newIsVisible);
    }, observerOptions);

    observer.observe(element);
    return () => observer.disconnect();
  }, [freezeOnceVisible, isVisible, options.threshold]);

  return { ref, isVisible };
}