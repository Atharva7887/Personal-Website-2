import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import '../../styles/backgrounds/contact-background.css';

export function ContactBackground() {
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true
  });

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <div className={`contact-background ${isVisible ? 'visible' : ''}`} />
      <div className={`contact-grid ${isVisible ? 'visible' : ''}`} />
      <div className={`contact-glow glow-1 ${isVisible ? 'visible' : ''}`} />
      <div className={`contact-glow glow-2 ${isVisible ? 'visible' : ''}`} />
    </div>
  );
}