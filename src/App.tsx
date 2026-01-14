import { useState } from 'react';
import Navbar from './components/navigation/Navbar';
import AboutSection from './components/AboutSection';
import ExpertiseSection from './components/sections/ExpertiseSection';
import ProjectsSection from './components/sections/ProjectsSection';
import ExperienceSection from './components/sections/ExperienceSection';
import Contact from './components/Contact';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';
import ScrollProgress from './components/ScrollProgress';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading && <LoadingScreen onLoadingComplete={() => setIsLoading(false)} />}
      <ScrollProgress />
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <AboutSection />
        <ExpertiseSection />
        <ProjectsSection />
        <ExperienceSection />
        <Contact />
        <Footer />
      </div>
    </>
  );
}