import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import '../../styles/backgrounds/blog-background.css';

export function BlogBackground() {
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true
  });

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <div className={`blog-background ${isVisible ? 'visible' : ''}`} />
      <div className={`blog-grid ${isVisible ? 'visible' : ''}`} />
      <div className={`blog-glow glow-1 ${isVisible ? 'visible' : ''}`} />
      <div className={`blog-glow glow-2 ${isVisible ? 'visible' : ''}`} />
    </div>
  );
}