import { useState } from 'react';
import FadeInSection from '../animations/FadeInSection';
import { ProjectsBackground } from '../backgrounds/ProjectsBackground';

const allProjects = [
  {
    id: 1,
    title: "Skin Disease Detection",
    description: "A CNN and Decision Tree-based system to identify skin diseases.",
    github: "https://github.com/Atharva7887/Skin-disease-detection-system-with-AI",
    demo: "",
    image: "https://www.tbsnews.net/sites/default/files/styles/big_3/public/images/2021/06/06/moods.jpg",
  },
  {
    id: 2,
    title: "Robotic Arm With Metallic sorter",
    description: "A robotic arm that sorts metallic and non-metallic objects.",
    github: "https://github.com/Atharva7887/Robotic-arm-with-metallic-sorting",
    demo: "",
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
    github: "https://github.com/Atharva7887/Threat-Detection-in-Cyber-Security-Using-AI",
    demo: "",
    image: "https://miro.medium.com/v2/resize:fit:1100/format:webp/0*UNj3S8SGwNxG029i",
  },
  {
    id: 5,
    title: "Stock Market Analyzer",
    description: "A dashboard to analyze stock market trends and provide insights.",
    github: "https://github.com/Atharva7887/Stock-Market-Analyzer",
    demo: "",
    image: "https://miro.medium.com/v2/resize:fit:1100/format:webp/1*_12VG957NJA854PvZFJNDA.png",
  }
];

export default function ProjectsSection() {
  const [showAll, setShowAll] = useState(false);
  const displayedProjects = showAll ? allProjects : allProjects.slice(0, 4);

  return (
    <section id="projects" className="relative min-h-screen">
      <ProjectsBackground />
      <div className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <FadeInSection delay={0.2}>
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold font-playfair mb-4">
              Project Highlights
            </h2>
            <p className="text-xl text-gray-300">A glimpse into my work</p>
          </div>
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {displayedProjects.map((project, index) => (
            <FadeInSection key={project.id} delay={0 + index * 0.2}>
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

        {/* Show More Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-white text-lg font-bold uppercase tracking-wide flex items-center justify-center transition-all duration-300 ease-in-out border-none bg-transparent p-4 cursor-pointer relative group"
          >
            <span className="absolute bottom-0 left-0 w-0 h-1 bg-white transition-all duration-300 ease-in-out group-hover:w-full"></span>
            {showAll ? "Show Less" : "More Projects..."}
          </button>
        </div>
      </div>
    </section>
  );
}
