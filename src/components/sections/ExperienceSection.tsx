import FadeInSection from '../animations/FadeInSection';
import { ExperienceBackground } from '../backgrounds/ExperienceBackground';
import CountdownSection from './CountdownSection';

export default function ExperienceSection() {
  return (
    <section id="experience" className="relative min-h-screen">
      <ExperienceBackground />
      <div className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <FadeInSection delay={0.4}>
          <h2 className="text-4xl font-bold mb-12 text-center">Experiences</h2>
        </FadeInSection>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <FadeInSection delay={0.6}>
            <div className="p-8 bg-black/30 backdrop-blur-sm rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition-colors">
              <img
                src="https://www.forstu.co/external/img/logo3.png"
                alt="Forstu Logo"
                className="max-w-[200px] sm:max-w-[250px] md:max-w-[338px] h-auto"
              />
            </div>
          </FadeInSection>

          <FadeInSection delay={0.8}>
            <div className="space-y-4 text-xl bg-black/30 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition-colors">
              <p className="text-purple-400">Data Analysis</p>
              <p className="text-purple-400">Data Manipulation</p>
              <p className="text-purple-400">Data Visualization</p>
              <p className="text-purple-400">AWS server</p>
              <p className="text-purple-400">Database Management System</p>
            </div>
          </FadeInSection>
        </div>

        <CountdownSection />
      </div>
    </section>
  );
}