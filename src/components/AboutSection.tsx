import { AboutBackground } from './backgrounds/AboutBackground';
import AboutBackground3D from './backgrounds/AboutBackground3D';
import Card3DSection from './sections/Card3DSection';
import AchievementsSection from './sections/AchievementsSection';
import FadeInSection from './animations/FadeInSection';
import GlowingText from './ui/GlowingText';
import ParticleField from './ui/ParticleField';

export default function AboutSection() {
  return (
    <section id="about" className="relative min-h-screen overflow-hidden">
      <AboutBackground />
      <AboutBackground3D />
      <ParticleField />
      <div className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-20">
          <FadeInSection delay={0.2}>
            <div className="text-center mt-16 space-y-8">
              <div className="inline-block">
                <h2 className="text-3xl md:text-4xl font-light text-gray-300 mb-4 tracking-wide">
                  Hello, I'm
                </h2>
                <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent leading-tight">
                  Atharva Shirke
                </h1>
                <div className="mt-6 h-1 w-32 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
              </div>
              <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                Computer Engineer & Full-Stack Developer crafting innovative digital solutions
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <span className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium border border-purple-500/30">
                  AI/ML Engineer
                </span>
                <span className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30">
                  Full-Stack Developer
                </span>
                <span className="px-4 py-2 bg-pink-500/20 text-pink-300 rounded-full text-sm font-medium border border-pink-500/30">
                  Data Scientist
                </span>
              </div>
              </h1>
            </div>
          </FadeInSection>

          <Card3DSection />
          <AchievementsSection />
        </div>
      </div>
    </section>
  );
}
