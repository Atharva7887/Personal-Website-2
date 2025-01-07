import { certificates } from '../data/certificates';
import { renderCertificateCard } from '../utils/certificateRenderer';

export function initializeCertificates() {
  const certificationsGrid = document.getElementById('certifications-grid');
  if (!certificationsGrid) return;

  certificates.forEach(cert => {
    const card = renderCertificateCard(cert);
    certificationsGrid.appendChild(card);
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeCertificates);