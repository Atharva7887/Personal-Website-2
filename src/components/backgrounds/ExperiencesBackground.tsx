import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import '../../styles/backgrounds/experiences-background.css';

export function ExperiencesBackground() {
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true
  });

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <div className={`experiences-background ${isVisible ? 'visible' : ''}`} />
      <div className={`experiences-grid ${isVisible ? 'visible' : ''}`} />
      <div className={`experiences-glow glow-1 ${isVisible ? 'visible' : ''}`} />
      <div className={`experiences-glow glow-2 ${isVisible ? 'visible' : ''}`} />
    </div>
  );
}