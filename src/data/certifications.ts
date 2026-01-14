import { Certificate } from '../types/certificates';
import { CERTIFICATE_PATHS, ORGANIZATIONS } from '../constants/certificates';

export const certifications: Certificate[] = [
  // Identity & Security
  {
    id: 'saviynt-identity-security',
    title: 'Saviynt Identity Security for AI Age',
    organization: ORGANIZATIONS.SAVIYNT,
    imagePath: CERTIFICATE_PATHS.SAVIYNT,
  },

  // Technology & Programming Workshops
  {
    id: 'c-cpp-workshop',
    title: 'C & C++ Workshop',
    organization: ORGANIZATIONS.MIT_WPU,
    imagePath: CERTIFICATE_PATHS.MIT_WPU,
  },
  {
    id: 'robotics-automation',
    title: 'Robotics and Automation Workshop',
    organization: ORGANIZATIONS.MIT_WPU,
    imagePath: CERTIFICATE_PATHS.MIT_WPU,
  },
  {
    id: 'intro-ml',
    title: 'Introduction to Machine Learning',
    organization: ORGANIZATIONS.DUKE,
    imagePath: CERTIFICATE_PATHS.DUKE,
  },
  {
    id: 'ml-projects',
    title: 'Managing Machine Learning Projects',
    organization: ORGANIZATIONS.DUKE,
    imagePath: CERTIFICATE_PATHS.DUKE,
  },

  // Data & Analytics
  {
    id: 'power-bi-dax',
    title: 'Skills Enhancement Using Power BI with DAX',
    organization: ORGANIZATIONS.VISHWAKARMA,
    imagePath: CERTIFICATE_PATHS.VISHWAKARMA,
  },
  {
    id: 'analyze-data',
    title: 'Analyze Data to Answer Questions',
    organization: ORGANIZATIONS.GOOGLE,
    imagePath: CERTIFICATE_PATHS.GOOGLE,
  },
  {
    id: 'foundations-data',
    title: 'Foundations Data, Data Everywhere',
    organization: ORGANIZATIONS.GOOGLE,
    imagePath: CERTIFICATE_PATHS.GOOGLE,
  },
  {
    id: 'data-decisions',
    title: 'Make Data-Driven Decisions',
    organization: ORGANIZATIONS.GOOGLE,
    imagePath: CERTIFICATE_PATHS.GOOGLE,
  },
  {
    id: 'data-exploration',
    title: 'Prepare Data for Exploration',
    organization: ORGANIZATIONS.GOOGLE,
    imagePath: CERTIFICATE_PATHS.GOOGLE,
  },
  {
    id: 'data-cleaning',
    title: 'Process Data from Dirty to Clean',
    organization: ORGANIZATIONS.GOOGLE,
    imagePath: CERTIFICATE_PATHS.GOOGLE,
  },

  // Events & Miscellaneous
  {
    id: 'hackathon',
    title: 'Hackathon Participation Certificate',
    organization: ORGANIZATIONS.VISHWAKARMA,
    imagePath: CERTIFICATE_PATHS.VISHWAKARMA,
  },
];
