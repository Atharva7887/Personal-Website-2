import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import '../../styles/backgrounds/projects-background.css';

export function ProjectsBackground() {
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true
  });

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <div className={`projects-background ${isVisible ? 'visible' : ''}`} />
      <div className={`projects-grid ${isVisible ? 'visible' : ''}`} />
      <div className={`projects-glow glow-1 ${isVisible ? 'visible' : ''}`} />
      <div className={`projects-glow glow-2 ${isVisible ? 'visible' : ''}`} />
    </div>
  );
}