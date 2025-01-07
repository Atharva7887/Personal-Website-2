import { certificates } from '../../data/certificates';
import CertificationCard from './CertificationCard';
import FadeInSection from '../animations/FadeInSection';

export default function CertificationsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {certificates.map((cert, index) => (
        <FadeInSection key={cert.id} delay={0.2 + index * 0.1}>
          <CertificationCard certificate={cert} />
        </FadeInSection>
      ))}
    </div>
  );
}