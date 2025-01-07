import FadeInSection from '../animations/FadeInSection';

export default function AchievementsSection() {
  return (
    <FadeInSection delay={0.8}>
      <div className="grid gap-6 mt-16">
        <div>
          <h2 className="text-purple-400 text-2xl md:text-[1.875rem] font-playfair font-black mb-4">
            Celebrating Achievements
          </h2>
          <h3 className="text-4xl md:text-5xl font-playfair font-black text-white mb-6">
            Crafting Digital Solutions
          </h3>
        </div>
        <div>
          <p className="text-gray-300 text-lg leading-relaxed">
            Welcome to my portfolio. I am a dedicated computer engineer with a passion 
            for creating innovative solutions. My expertise spans across various domains, 
            ensuring that I can tackle any challenge with confidence.
            <br />
            <br />
            Explore my projects and skills to see how I can contribute to your next big idea. 
            Let's build something amazing together.
          </p>
        </div>
      </div>
    </FadeInSection>
  );
}