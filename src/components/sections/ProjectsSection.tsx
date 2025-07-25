import { useState } from 'react';
import FadeInSection from '../animations/FadeInSection';
import { ProjectsBackground } from '../backgrounds/ProjectsBackground';
import { ExternalLink, Github, Star } from 'lucide-react';

const allProjects = [
  {
    id: 1,
    title: "Skin Disease Detection",
    description: "A CNN and Decision Tree-based system to identify skin diseases.",
    longDescription: "Advanced machine learning system using Convolutional Neural Networks and Decision Trees to accurately identify various skin conditions. Features real-time image processing and high accuracy diagnosis.",
    github: "https://github.com/Atharva7887/Skin-disease-detection-system-with-AI",
    demo: "",
    image: "https://www.tbsnews.net/sites/default/files/styles/big_3/public/images/2021/06/06/moods.jpg",
    tags: ["Python", "CNN", "Machine Learning", "Healthcare"],
    featured: true
  },
  {
    id: 2,
    title: "Robotic Arm With Metallic sorter",
    description: "A robotic arm that sorts metallic and non-metallic objects.",
    longDescription: "Intelligent robotic system with computer vision capabilities to automatically detect and sort metallic from non-metallic objects using advanced sensors and machine learning algorithms.",
    github: "https://github.com/Atharva7887/Robotic-arm-with-metallic-sorting",
    demo: "",
    image: "https://www.wlkata.com/cdn/shop/products/wlkataconveyorbelt-0.jpg?v=1678337862&width=823",
    tags: ["Robotics", "Computer Vision", "Arduino", "Automation"],
    featured: true
  },
  {
    id: 3,
    title: "Plant Cultivation Helper",
    description: "The Plant Cultivation Helper Website assists gardening enthusiasts in nurturing their plants effectively.",
    longDescription: "Comprehensive web application providing personalized plant care recommendations, weather integration, and cultivation tracking to help gardeners optimize their plant growth.",
    github: "https://github.com/Atharva7887/Plant-Cultivation-Helper",
    demo: "https://planthelper.netlify.app/",
    image: "https://kj1bcdn.b-cdn.net/media/75868/crops.jpg",
    tags: ["React", "Node.js", "API Integration", "Agriculture"],
    featured: false
  },
  {
    id: 4,
    title: "Threat Detection in Cyber Security Using AI",
    description: "Uses Machine learning to preprocess data, filter attacks, select features, and evaluate models for identifying threats.",
    longDescription: "Sophisticated cybersecurity solution leveraging artificial intelligence to detect and prevent various types of cyber threats in real-time with high accuracy and minimal false positives.",
    github: "https://github.com/Atharva7887/Threat-Detection-in-Cyber-Security-Using-AI",
    demo: "",
    image: "https://miro.medium.com/v2/resize:fit:1100/format:webp/0*UNj3S8SGwNxG029i",
    tags: ["AI", "Cybersecurity", "Python", "Data Analysis"],
    featured: true
  },
  {
    id: 5,
    title: "Stock Market Analyzer",
    description: "A dashboard to analyze stock market trends and provide insights.",
    longDescription: "Real-time stock market analysis platform with advanced charting, technical indicators, and AI-powered predictions to help investors make informed decisions.",
    github: "https://github.com/Atharva7887/Stock-Market-Analyzer",
    demo: "",
    image: "https://miro.medium.com/v2/resize:fit:1100/format:webp/1*_12VG957NJA854PvZFJNDA.png",
    tags: ["React", "Python", "Data Visualization", "Finance"],
    featured: false
  }
];

export default function ProjectsSection() {
  const [showAll, setShowAll] = useState(false);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const displayedProjects = showAll ? allProjects : allProjects.slice(0, 4);

  return (
    <section id="projects" className="relative min-h-screen">
      <ProjectsBackground />
      <div className="relative z-10 py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <FadeInSection delay={0.2}>
          <div className="text-center mb-20">
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold text-purple-400 tracking-wider uppercase">Portfolio</span>
            </div>
            <h2 className="text-5xl sm:text-7xl font-bold font-playfair mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Featured Projects
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mb-6"></div>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Showcasing innovative solutions and cutting-edge technology implementations
            </p>
          </div>
        </FadeInSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {displayedProjects.map((project, index) => (
            <FadeInSection key={project.id} delay={0.4 + index * 0.2}>
              <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 hover:border-purple-500/50 transition-all duration-700 hover:transform hover:scale-[1.02]">
                {/* Featured badge */}
                {project.featured && (
                  <div className="absolute top-4 right-4 z-30">
                    <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-xs font-bold text-black">
                      <Star size={12} fill="currentColor" />
                      Featured
                    </div>
                  </div>
                )}
                
                {/* Image container */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                  
                  {/* Overlay content */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="flex gap-4">
                      {project.demo && (
                        <a
                          href={project.demo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all duration-300 hover:scale-110"
                        >
                          <ExternalLink size={16} />
                          Live Demo
                        </a>
                      )}
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all duration-300 hover:scale-110"
                      >
                        <Github size={16} />
                        Code
                      </a>
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                    {project.title}
                  </h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    {selectedProject === project.id ? project.longDescription : project.description}
                  </p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-xs font-medium bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedProject(selectedProject === project.id ? null : project.id)}
                      className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-300"
                    >
                      {selectedProject === project.id ? 'Show Less' : 'Learn More'}
                    </button>
                    
                    <div className="flex gap-3">
                    {project.demo && (
                      <a
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all duration-300 hover:scale-110"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-all duration-300 hover:scale-110"
                    >
                      <Github size={16} />
                    </a>
                    </div>
                  </div>
                </div>
                
                {/* Animated border */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-[1px]">
                    <div className="h-full w-full rounded-3xl bg-gradient-to-br from-gray-900 to-black"></div>
                  </div>
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>

        {/* Show More/Less Button */}
        <div className="text-center mt-16">
          <button
            onClick={() => setShowAll(!showAll)}
            className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
          >
            <span className="relative z-10">
            {showAll ? "Show Less" : "More Projects..."}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>
    </section>
  );
}
