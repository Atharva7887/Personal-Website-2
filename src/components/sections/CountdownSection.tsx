import { useEffect, useState } from 'react';
import FadeInSection from '../animations/FadeInSection';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

interface CountItem {
  number: number;
  label: string;
  link?: string;
}

const countItems: CountItem[] = [
  { number: 11, label: 'Certificates', link: 'more.html' },
  { number: 3, label: 'Achievements', link: 'more.html' },
  { number: 4, label: 'Projects', link: '#projects' },
  { number: 1, label: 'Experience', link: '#experience' }
];

export default function CountdownSection() {
  const [counts, setCounts] = useState<number[]>(countItems.map(() => 0));
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 });

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000; // 2 seconds for the counting animation
    const steps = 60; // Number of steps in the animation
    const interval = duration / steps;

    const incrementValues = countItems.map(item => item.number / steps);
    let currentStep = 0;

    const timer = setInterval(() => {
      if (currentStep >= steps) {
        // Ensure we reach the exact final numbers
        setCounts(countItems.map(item => item.number));
        clearInterval(timer);
        return;
      }

      setCounts(prevCounts => 
        prevCounts.map((count, index) => {
          const targetValue = countItems[index].number;
          const newValue = Math.min(count + incrementValues[index], targetValue);
          return Math.round(newValue * 10) / 10; // Round to 1 decimal place
        })
      );

      currentStep++;
    }, interval);

    return () => clearInterval(timer);
  }, [isVisible]);

  const handleClick = (link?: string) => {
    if (!link) return;
    
    if (link.startsWith('#')) {
      const element = document.querySelector(link);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.location.href = link;
    }
  };

  return (
    <section ref={ref} className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {countItems.map((item, index) => (
            <FadeInSection key={item.label} delay={0.2 * index}>
              <div 
                className={`text-center ${item.link ? 'cursor-pointer hover:opacity-80' : ''}`}
                onClick={() => handleClick(item.link)}
              >
                <div className="text-4xl md:text-5xl font-bold text-purple-500 mb-2">
                  {counts[index].toFixed(0)}+
                </div>
                <div className="text-gray-300">{item.label}</div>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}