import CertificationsGrid from '../../certifications/CertificationsGrid';

export default function CertificationsSection() {
  return (
    <section id="certifications" className="mb-20">
      <h2 className="section-header text-4xl font-bold mb-12 text-center text-white">
        Professional Certifications
      </h2>
      <CertificationsGrid />
    </section>
  );
}