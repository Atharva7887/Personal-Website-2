import indiskaShot from '../assets/indiskaai-site.webp'
import plantShot from '../assets/planthelper.webp'
import skinShot from '../assets/skin-demo.webp'
import unhazeFeature from '../assets/unhaze-feature.webp'
import unhazeStrip from '../assets/unhaze-overview.webp'
import type { ShapeName } from '../three/shapes'

export interface Img {
  src: string
  alt: string
  width: number
  height: number
}

export interface Project {
  slug: string
  name: string
  kind: string
  year: string
  /** One line for the list and link previews. */
  tagline: string
  summary: string
  stack: string
  role: string
  status?: string
  shape: ShapeName
  image?: Img
  gallery?: Img
  /** A screen recording of the product, shown on the case page (poster: `image`). Served from /public/video. */
  video?: { src: string; title: string; seconds: number }
  /** Headline numbers, shown big on the case page and in the Work panel. */
  metrics?: { value: string; label: string }[]
  /** The system as a left-to-right pipeline, one stage per step. */
  pipeline?: { stage: string; detail?: string }[]
  links: { label: string; href: string }[]
  /** Case-study page. Omit `sections` for projects without enough to say. */
  sections?: { title: string; points: string[] }[]
}

// Every fact below comes from the résumé, the repository README or the live
// site. Internal IndiskaAI work stays general (no internal model names or
// unpublished results).
export const projects: Project[] = [
  {
    slug: 'unhaze',
    name: 'Unhaze',
    kind: 'Android app',
    year: '2026',
    tagline: 'A gentle pause before distracting apps.',
    summary:
      'A screen-time app that puts a calm pause between you and the apps you open on autopilot. Your screen time becomes weather: every minute on a distracting app fills a little valley with haze, and stepping away clears the sky.',
    stack: 'Kotlin, Jetpack Compose, Android',
    role: 'Solo: product, design, illustration and development',
    status: 'Coming soon to Google Play',
    shape: 'cloud',
    image: {
      src: unhazeFeature,
      alt: 'Unhaze feature graphic: “Clear the scroll haze. Get your day back.” beside a cartoon cloud, sun and seedling',
      width: 1024,
      height: 500,
    },
    gallery: {
      src: unhazeStrip,
      alt: 'Eight Unhaze screens: the pause screen, home, focus sessions, breathing with Puff, bedtime, the cost of scrolling, night mode and the welcome screen',
      width: 1600,
      height: 344,
    },
    links: [],
    sections: [
      {
        title: 'What it does',
        points: [
          'Pick the apps that pull you in and a daily limit. Opening one shows a pause screen with how much of today’s limit is gone.',
          'Choose “keep my sky clear” and Puff the cloud blows the haze away, or breathe along for a moment and open the app for five minutes.',
          'Focus sessions keep paused apps closed for 15 to 60 minutes, with optional original ambient sound.',
          'A bedtime mode rests your paused apps behind a calm night screen from wind-down until morning.',
        ],
      },
      {
        title: 'How it’s built',
        points: [
          'Native Android in Kotlin with Jetpack Compose, including home-screen widgets and notifications.',
          'Usage data is processed on the device and never leaves it. No account needed.',
          'Characters, animations, haptics and sound designed for the app, with a night mode.',
        ],
      },
    ],
  },
  {
    slug: 'protein-ml-pipelines',
    name: 'Protein ML pipelines',
    kind: 'Data science, IndiskaAI',
    year: '2026',
    tagline: 'Deep-learning pipelines for antibody discovery, end to end.',
    summary:
      'Pipelines that predict and compare the 3D structures of antibodies and their targets, so the team can pick the most promising candidates. From data ingestion and training to evaluation and reports.',
    stack: 'Python, PyTorch, GROMACS, ANARCI, TMalign, Linux / HPC',
    role: 'Data Scientist',
    shape: 'lattice',
    links: [],
    sections: [
      {
        title: 'What I built',
        points: [
          'Benchmarked seven protein-folding models on curated antibody–antigen complexes to choose the predictors used in production.',
          'Engineered a deep-learning pipeline for antibody–antigen interaction modelling, from data ingestion through training and evaluation.',
          'Automated preprocessing of predicted structures from many models: residue renumbering, framework extraction, interface metrics and structural alignment.',
          'Built visualisation tooling (structural classifications, distributions, clustering dendrograms) that sped up benchmarking analysis.',
        ],
      },
    ],
  },
  {
    slug: 'interaction-analysis-app',
    name: 'Interaction analysis app',
    kind: 'Desktop app, IndiskaAI',
    year: '2026',
    tagline: 'An offline desktop tool for antibody–antigen analysis.',
    summary:
      'An offline desktop application that analyses how an antibody binds its target and writes the report for you.',
    stack: 'Python, FastAPI, React',
    role: 'Design and full-stack development',
    shape: 'antibody',
    links: [],
    sections: [
      {
        title: 'Features',
        points: [
          'Contact detection between antibody and antigen, validated against pdbe-arpeggio.',
          'CDR classification and side-by-side structure comparison.',
          'Molecular-dynamics analysis and automated reports.',
          'Runs fully offline: a FastAPI backend with a React interface.',
        ],
      },
    ],
  },
  {
    slug: 'indiskaai-website',
    name: 'IndiskaAI website',
    kind: 'Web design and build',
    year: '2026',
    tagline: 'The company’s public website, designed and shipped solo.',
    summary: 'Designed, built and deployed the company’s public website on my own, from first sketch to production.',
    stack: 'Next.js, Vercel',
    role: 'Solo: design, frontend and deployment',
    shape: 'browser',
    image: {
      src: indiskaShot,
      alt: 'IndiskaAI home page: the headline “From sequence to therapeutic, accelerated” beside a rendered DNA helix',
      width: 1200,
      height: 750,
    },
    links: [{ label: 'Visit indiskaai.com', href: 'https://www.indiskaai.com/' }],
    sections: [
      {
        title: 'Scope',
        points: [
          'Visual design, information architecture and copy layout for a drug-discovery company.',
          'Frontend build in Next.js, deployed on Vercel.',
        ],
      },
    ],
  },
  {
    slug: 'skin-lesion-classifier',
    name: 'Skin lesion classifier',
    kind: 'Computer vision',
    year: '2024 – 2026',
    tagline: '87% accuracy on an independent test set of 1,511 images.',
    summary:
      'A seven-class dermoscopy classifier. I rebuilt my college project into an ensemble of ImageNet-pretrained CNNs and transformers, served through a Flask web app. A research prototype, not a medical device.',
    stack: 'Python, PyTorch, timm (ConvNeXt-V2, EfficientNetV2, MaxViT), Flask, LangGraph',
    role: 'Solo',
    shape: 'grid',
    image: {
      src: skinShot,
      alt: 'Skin Cancer Awareness web app: “Screening for photos of skin spots”, with a quick photo check flagging a basal cell carcinoma',
      width: 1600,
      height: 900,
    },
    metrics: [
      { value: '87.0%', label: 'Accuracy, ISIC 2018 test' },
      { value: '0.812', label: 'Macro-F1' },
      { value: '89.5%', label: 'Melanomas flagged' },
      { value: '81 ms', label: 'Model time per photo (GPU)' },
    ],
    pipeline: [
      { stage: 'Photo', detail: 'Flask web app / API' },
      { stage: 'Quality check', detail: 'blank or tiny images stop here' },
      { stage: 'Scope gate', detail: 'kNN on model features refuses non-lesion photos' },
      { stage: 'Ensemble', detail: 'ConvNeXt-V2 + EfficientNetV2 + MaxViT, 8 views each' },
      { stage: 'Risk rule', detail: 'fixed rule in code decides when a clinician should look' },
      { stage: 'Explain', detail: 'Grad-CAM heat map and plain-language result (LangGraph)' },
    ],
    video: { src: '/video/skin-lesion-demo.mp4', title: 'Walkthrough of the screening web app: upload, result with Grad-CAM heat map, and care guidance', seconds: 36 },
    links: [{ label: 'Code on GitHub', href: 'https://github.com/Atharva7887/Skin-disease-detection-system-with-AI' }],
    sections: [
      {
        title: 'What changed in the rebuild',
        points: [
          'Trained on HAM10000 plus ISIC 2019, with lesion-grouped splits to remove data leakage.',
          'Class-weighted loss for the heavy class imbalance, plus probability calibration and Grad-CAM checks.',
          'A Flask web app and API with tests, and a LangGraph triage pipeline.',
        ],
      },
      {
        title: 'Result',
        points: [
          'The three-model ensemble reaches 87.0% accuracy and 0.812 macro-F1 on the independent ISIC 2018 test set (1,511 images).',
        ],
      },
    ],
  },
  {
    slug: 'network-threat-detection',
    name: 'Network threat detection',
    kind: 'Security analytics',
    year: '2025',
    tagline: 'Machine-learning intrusion detection on real traffic data.',
    summary:
      'Detects attacks in network traffic using the CIC-IDS2017 dataset: preprocessing, attack filtering, feature selection and a comparison of models.',
    stack: 'Python, Jupyter, scikit-learn',
    role: 'Solo',
    shape: 'network',
    links: [{ label: 'Code on GitHub', href: 'https://github.com/Atharva7887/Threat-Detection-in-Cyber-Security-Using-AI' }],
    sections: [
      {
        title: 'Steps',
        points: [
          'Cleaned and prepared the CIC-IDS2017 traffic captures.',
          'Filtered attack classes and selected the most informative features.',
          'Trained and compared several models for identifying threats.',
        ],
      },
    ],
  },
  {
    slug: 'plant-cultivation-helper',
    name: 'Plant Cultivation Helper',
    kind: 'Web app',
    year: '2025',
    tagline: 'Plant care, calculated for your plant.',
    summary:
      'Enter a plant’s name and height and it works out daily water, soil quantity and vermicompost needs for growing it at home.',
    stack: 'JavaScript, Netlify',
    role: 'Solo',
    shape: 'spiral',
    image: {
      src: plantShot,
      alt: 'Plant Cultivation Hub home page: “Cultivate your greenery” beside seedlings in a tray',
      width: 1200,
      height: 750,
    },
    links: [
      { label: 'Live demo', href: 'https://planthelper.netlify.app/' },
      { label: 'Code on GitHub', href: 'https://github.com/Atharva7887/Plant-Cultivation-Helper' },
    ],
    sections: [
      {
        title: 'Features',
        points: [
          'A simple form for the plant’s name and current height.',
          'Calculates daily water, soil quantity and vermicompost for home gardening.',
        ],
      },
    ],
  },
  {
    slug: 'robotic-arm',
    name: 'Metal-sorting robotic arm',
    kind: 'Robotics',
    year: '2024',
    tagline: 'Sorts metallic from non-metallic objects.',
    summary: 'A robotic arm that sorts metallic from non-metallic objects.',
    stack: 'Hardware',
    role: 'Team project',
    shape: 'knot',
    links: [{ label: 'Code on GitHub', href: 'https://github.com/Atharva7887/Robotic-arm-with-metallic-sorting' }],
  },
]

export const hasPage = (p: Project) => Boolean(p.sections)
export const projectUrl = (p: Project) => (hasPage(p) ? `/work/${p.slug}/` : p.links[0]?.href ?? '/#work')
