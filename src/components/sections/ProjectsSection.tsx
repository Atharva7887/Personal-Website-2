import FadeInSection from '../animations/FadeInSection';
import { ProjectsBackground } from '../backgrounds/ProjectsBackground';

const projects = [
  {
    id: 1,
    title: "Skin Disease Detection",
    description: "A CNN and Decision Tree-based system to identify skin diseases.",
    github: "https://github.com/Atharva7887/Skin-disease-detection-system-with-AI",
    demo: "", // No demo link
    image: "https://storage.googleapis.com/gweb-uniblog-publish-prod/images/derm_-_hero_image_2_1.width-1600.format-webp.webp",
  },
  {
    id: 2,
    title: "Robotic Arm With Metallic sorter",
    description: "A robotic arm that sorts metallic and non-metallic objects.",
    github: "https://github.com/Atharva7887/Robotic-arm-with-metallic-sorting",
    demo: "", // No demo link
    image: "https://www.wlkata.com/cdn/shop/products/wlkataconveyorbelt-0.jpg?v=1678337862&width=823",
  },
  {
    id: 3,
    title: "Plant Cultivation Helper",
    description: "The Plant Cultivation Helper Website assists gardening enthusiasts in nurturing their plants effectively.",
    github: "https://github.com/Atharva7887/Plant-Cultivation-Helper",
    demo: "https://planthelper.netlify.app/",
    image: "https://kj1bcdn.b-cdn.net/media/75868/crops.jpg",
  },
  {
    id: 4,
    title: "Threat Detection in Cyber Security Using AI",
    description: "Uses Machine learning to preprocess data, filter attacks, select features, and evaluate models for identifying threats.",
    github: "https://miro.medium.com/v2/resize:fit:1100/format:webp/0*UNj3S8SGwNxG029i",
    demo: "", // No demo link
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
                  <div className="flex gap-4">
                    {project.demo && (
                      <a
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                      >
                        Live Demo
                      </a>
                    )}
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                    >
                      GitHub
                    </a>
                  </div>
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}
