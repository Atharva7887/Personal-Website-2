import FadeInSection from '../animations/FadeInSection';

export default function AchievementsSection() {
  return (
    <div className="max-w-4xl mx-auto">
      <FadeInSection delay={0.8}>
        <div className="text-center space-y-8">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              Passionate about <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Innovation</span>
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed max-w-3xl mx-auto">
              I'm a dedicated computer engineer with a passion for creating innovative digital solutions. 
              My expertise spans across multiple domains, from AI/ML to full-stack development, 
              ensuring I can tackle any challenge with confidence and creativity.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <div className="text-3xl font-bold text-purple-400 mb-2">3+</div>
              <div className="text-gray-300">Years Experience</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <div className="text-3xl font-bold text-blue-400 mb-2">15+</div>
              <div className="text-gray-300">Projects Completed</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="text-3xl font-bold text-green-400 mb-2">10+</div>
              <div className="text-gray-300">Technologies Mastered</div>
            </div>
          </div>
        </div>
      </FadeInSection>
    </div>
  );
}