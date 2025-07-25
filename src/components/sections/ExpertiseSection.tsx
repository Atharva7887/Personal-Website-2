import { Code, Database, Shield, Cloud, LineChart, Bot, FlaskConical, TestTube2, Gamepad2 } from 'lucide-react';
import FadeInSection from '../animations/FadeInSection';

const skills = [
  {
    title: 'Full Stack Development',
    description: 'Building responsive and dynamic websites',
    icon: Code,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20 hover:border-blue-500/50'
  },
  {
    title: 'Software Engineering',
    description: 'Designing robust software solutions',
    icon: Database,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20 hover:border-green-500/50'
  },
  {
    title: 'AI/ML',
    description: 'Developing intelligent algorithms and models',
    icon: FlaskConical,
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20 hover:border-purple-500/50'
  },
  {
    title: 'Data Analysis',
    description: 'Interpreting complex data sets',
    icon: LineChart,
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20 hover:border-orange-500/50'
  },
  {
    title: 'Robotics',
    description: 'Designing and programming robotic systems',
    icon: Bot,
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20 hover:border-pink-500/50'
  },
  {
    title: 'Cybersecurity',
    description: 'Ensuring data protection and privacy',
    icon: Shield,
    color: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20 hover:border-red-500/50'
  },
  {
    title: 'Cloud Computing',
    description: 'Leveraging cloud technologies',
    icon: Cloud,
    color: 'from-indigo-500 to-blue-500',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20 hover:border-indigo-500/50'
  },
  {
    title: 'Software Testing',
    description: 'Ensuring software quality and reliability',
    icon: TestTube2,
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/20 hover:border-teal-500/50'
  },
  {
    title: 'Game Testing',
    description: 'Testing and quality assurance for games',
    icon: Gamepad2,
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20 hover:border-yellow-500/50'
  }
];

export default function ExpertiseSection() {
  return (
    <section id="expertise" className="py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <FadeInSection delay={0.4}>
        <div className="text-center mb-20">
          <div className="inline-block mb-4">
            <span className="text-sm font-semibold text-purple-400 tracking-wider uppercase">What I Do</span>
          </div>
          <h2 className="text-5xl sm:text-7xl font-bold font-playfair mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Expertise & Services
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mb-6"></div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Transforming ideas into powerful digital solutions with cutting-edge technology
          </p>
        </div>
      </FadeInSection>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {skills.map((skill, index) => (
          <FadeInSection key={skill.title} delay={0.6 + index * 0.2}>
            <div className={`group relative p-8 rounded-2xl border ${skill.borderColor} ${skill.bgColor} backdrop-blur-sm transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl`}>
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${skill.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500`}></div>
              
              {/* Icon with gradient background */}
              <div className={`relative w-16 h-16 rounded-xl bg-gradient-to-br ${skill.color} p-0.5 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <div className="w-full h-full bg-black rounded-xl flex items-center justify-center">
                  <skill.icon className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 group-hover:bg-clip-text transition-all duration-300">
                {skill.title}
              </h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300 leading-relaxed">
                {skill.description}
              </p>
              
              {/* Animated border */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${skill.color} p-[1px]`}>
                  <div className="h-full w-full rounded-2xl bg-black/90"></div>
                </div>
              </div>
            </div>
          </FadeInSection>
        ))}
      </div>
    </section>
  );
}
