import FadeInSection from '../animations/FadeInSection';
import { ProjectsBackground } from '../backgrounds/ProjectsBackground';

const projects = [
  {
    id: 1,
    title: "Skin Disease Detection",
    description: "A CNN and Decision Tree-based system to identify skin diseases.",
    link: "https://github.com/Atharva7887/Skin-disease-detection-system-with-AI",
    image: "https://atharva7887.s3.us-east-1.amazonaws.com/images/skin-disease-detection.jpg",
  },
  {
    id: 2,
    title: "Robotic Arm With Metallic sorter",
    description: "A robotic arm that sorts metallic and non-metallic objects.",
    link: "https://github.com/Atharva7887/Robotic-arm-with-metallic-sorting",
    image: "https://www.wlkata.com/cdn/shop/products/wlkataconveyorbelt-0.jpg?v=1678337862&width=823",
  },
  {
    id: 3,
    title: "Plant Cultivation Helper",
    description: "The Plant Cultivation Helper Website is designed to assist gardening enthusiasts in nurturing their plants effectively.",
    link: "https://github.com/Atharva7887/Plant-Cultivation-Helper",
    image: "https://kj1bcdn.b-cdn.net/media/75868/crops.jpg",
  },
  {
    id: 4,
    title: "Threat Detection in Cyber Security Using AI",
    description: "Uses Machine learning to preprocess data, filter attacks, select features, and evaluate models for identifying threats.",
    link: "https://github.com/Atharva7887/Threat-Detection-in-Cyber-Security-Using-AI",
    image: "https://www.acronyms.co.uk/wp-content/uploads/2024/04/ai-robot-cybersecurity-1024x560-1024x585.webp",
  },
];

export default function ProjectsSection() {
  return (
    <section id="projects" className="relative min-h-screen">
      <ProjectsBackground />
      <div className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <FadeInSection delay={0.4}>
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold font-playfair mb-4">
              Project Highlights
            </h2>
            <p className="text-xl text-gray-300">A glimpse into my work</p>
          </div>
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <FadeInSection key={project.id} delay={0.6 + index * 0.2}>
              <div className="relative group p-6 rounded-lg border border-gray-800 overflow-hidden transition-transform transform hover:scale-105">
                <img
                  src={project.image}
                  alt={project.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <div className="relative z-10 bg-black bg-opacity-80 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                  <p className="text-gray-400 mb-4">{project.description}</p>
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-pink-400 underline"
                  >
                    Learn more
                  </a>
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}
