import { education } from '../../../data/education';
import EducationCard from '../cards/EducationCard';
import FadeInSection from '../../animations/FadeInSection';

export default function EducationSection() {
  return (
    <section id="education" className="mb-20">
      <h2 className="section-header text-4xl font-bold mb-12 text-center">
        Education
      </h2>
      <div className="grid grid-cols-1 gap-8">
        {education.map((edu, index) => (
          <FadeInSection key={edu.degree} delay={0.2 + index * 0.1}>
            <EducationCard {...edu} />
          </FadeInSection>
        ))}
      </div>
    </section>
  );
}