import { Code, Cpu, Database, Shield, Cloud, LineChart, MonitorCheck, Gamepad2 } from 'lucide-react';
import FadeInSection from '../animations/FadeInSection';

const skills = [
  {
    title: 'Full Stack Development',
    description: 'Building responsive and dynamic websites',
    icon: Code,
  },
  {
    title: 'Software Development',
    description: 'Designing robust software solutions',
    icon: Database,
  },
  {
    title: 'AI/ML',
    description: 'Developing intelligent systems and machine learning models',
    icon: Cpu,
  },
  {
    title: 'Data Analysis',
    description: 'Interpreting complex data sets',
    icon: LineChart,
  },
  {
    title: 'Cybersecurity',
    description: 'Ensuring data protection and privacy',
    icon: Shield,
  },
  {
    title: 'Cloud Computing',
    description: 'Leveraging cloud technologies',
    icon: Cloud,
  },
  {
    title: 'Software Testing',
    description: 'Ensuring software reliability and performance',
    icon: MonitorCheck,
  },
  {
    title: 'Game Testing',
    description: 'Testing and quality assurance for games',
    icon: Gamepad2,
  },
];

export default function ExpertiseSection() {
  return (
    <section id="expertise" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <FadeInSection delay={0.4}>
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold font-playfair mb-4">
            Expertise & Offerings
          </h2>
          <p className="text-xl text-gray-300">
            Comprehensive solutions for your digital needs
          </p>
        </div>
      </FadeInSection>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {skills.map((skill, index) => (
          <FadeInSection key={skill.title} delay={0.6 + index * 0.2}>
            <div className="p-6 rounded-lg border border-gray-800 hover:border-purple-500 transition-colors">
              <skill.icon className="w-8 h-8 text-purple-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{skill.title}</h3>
              <p className="text-gray-400">{skill.description}</p>
            </div>
          </FadeInSection>
        ))}
      </div>
    </section>
  );
}
