import Card3D from '../Card3D';
import FadeInSection from '../animations/FadeInSection';

export default function Card3DSection() {
  return (
    <FadeInSection delay={0.6}>
      <Card3D />
    </FadeInSection>
  );
}