import type { ShapeName } from '../three/shapes'

export const services: { title: string; body: string; tags: string[]; shape: ShapeName }[] = [
  {
    title: 'Web apps and sites',
    body: 'Fast, accessible websites and React apps, designed and built end to end. The kind of site you are looking at.',
    tags: ['React', 'TypeScript', 'Django'],
    shape: 'browser',
  },
  {
    title: 'Data and machine learning',
    body: 'Models, dashboards and analysis that answer a real question, from messy data to a result you can act on.',
    tags: ['Python', 'PyTorch', 'Power BI'],
    shape: 'lattice',
  },
  {
    title: 'Pipelines and mobile apps',
    body: 'Automated data pipelines, cloud and GPU setups that keep running, and native Android apps.',
    tags: ['AWS', 'Docker', 'Kotlin'],
    shape: 'knot',
  },
]

// From the résumé, newest first.
export const experience = [
  {
    role: 'Data Scientist',
    company: 'IndiskaAI',
    dates: 'Feb 2026 – now',
    summary:
      'Deep-learning pipelines for AI-driven drug discovery: benchmarking structure-prediction models, interaction modelling, automated preprocessing, visualisation tooling, and an offline analysis app.',
  },
  {
    role: 'Associate Technical Consultant',
    company: 'RNS Technology',
    dates: 'Nov 2025 – Feb 2026',
    summary:
      'Identity and access management on Saviynt and SailPoint: identity governance, provisioning, access certification, and Active Directory administration.',
  },
  {
    role: 'Software Developer Intern',
    company: 'FORSTU',
    dates: 'Jun – Dec 2024',
    summary:
      'Automated test scripts that cut testing time by 35%, a telemetry monitoring tool with 15% better accuracy, Power BI dashboards, AWS deployments and React and Django features.',
  },
]

export const research = [
  {
    title: 'Antibody structure prediction accuracy depends on the superposition protocol: a comparison of nine models',
    role: 'First author',
    status: 'Manuscript in preparation, 2026',
  },
  {
    title: 'Antibody developability: a critical determinant in therapeutic advancement',
    role: 'Co-author',
    status: 'Under review at Springer, 2026',
  },
]

export const skillGroups = [
  { group: 'Languages', items: ['Python', 'SQL', 'TypeScript', 'JavaScript', 'Java', 'C / C++', 'Kotlin', 'Bash'] },
  { group: 'ML and data', items: ['PyTorch', 'TensorFlow', 'scikit-learn', 'pandas', 'NumPy', 'LLMs and RAG', 'Power BI'] },
  { group: 'Web and apps', items: ['React', 'Next.js', 'FastAPI', 'Django', 'Flask', 'Jetpack Compose'] },
  { group: 'Infrastructure', items: ['AWS (EC2, S3)', 'Docker', 'Git', 'Linux / HPC', 'MySQL', 'MongoDB'] },
  { group: 'Computational biology', items: ['AlphaFold 2 / 3', 'Boltz-2', 'ESMFold2', 'IgFold', 'GROMACS', 'PyMOL'] },
  { group: 'Identity and security', items: ['Saviynt', 'SailPoint', 'Active Directory', 'RBAC'] },
]

export const certifications = [
  'Build Real World AI Applications with Gemini and Imagen, Google Cloud, 2025',
  'Machine Learning, Coursera, 2024',
  'Power BI with DAX, Microsoft, 2024',
]

export const education = [
  { title: 'B.E. Computer Engineering', place: 'Vishwakarma University, Pune. CGPA 8.1 / 10', dates: '2022 – 2025' },
  { title: 'Diploma, Electronics and Telecommunication', place: 'MIT, Pune. First Class with Distinction', dates: '2020 – 2022' },
]
