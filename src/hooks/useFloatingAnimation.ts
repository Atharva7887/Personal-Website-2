import { useRef, useEffect, useState } from 'react';

export function useFloatingAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({});

  useEffect(() => {
    let animationFrame: number;
    let time = 0;
    
    const animate = () => {
      time += 0.005;
      
      // Create a floating animation using sin waves
      const translateY = Math.sin(time) * 10;
      const rotateX = Math.sin(time * 0.5) * 2;
      const rotateY = Math.cos(time * 0.5) * 2;
      
      setStyle({
        transform: `translateY(${translateY}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: 'transform 0.1s ease-out',
      });
      
      animationFrame = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return { ref, style };
}