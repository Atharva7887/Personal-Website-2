import { Certificate } from '../types/certificates';

export function sortCertificatesByOrganization(certificates: Certificate[]): Certificate[] {
  return [...certificates].sort((a, b) => a.organization.localeCompare(b.organization));
}

export function filterCertificatesByOrganization(
  certificates: Certificate[],
  organization: string
): Certificate[] {
  return certificates.filter(cert => cert.organization === organization);
}

export function getDefaultImagePath(organization: string): string {
  return `/images/certificates/${organization.toLowerCase().replace(/ /g, '-')}.png`;
}