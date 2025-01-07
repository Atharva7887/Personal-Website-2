import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import '../../styles/backgrounds/experience-background.css';

export function ExperienceBackground() {
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true
  });

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <div className={`experience-background ${isVisible ? 'visible' : ''}`} />
      <div className={`experience-grid ${isVisible ? 'visible' : ''}`} />
      <div className={`experience-glow glow-1 ${isVisible ? 'visible' : ''}`} />
      <div className={`experience-glow glow-2 ${isVisible ? 'visible' : ''}`} />
    </div>
  );
}