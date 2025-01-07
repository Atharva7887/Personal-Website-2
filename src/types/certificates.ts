export interface Certificate {
  id: string;
  title: string;
  organization: string;
  imagePath: string;
  pdfUrl?: string;
}

export type CertificateOrganization = 'MIT WPU' | 'Vishwakarma University' | 'Google' | 'Duke University';