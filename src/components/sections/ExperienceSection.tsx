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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <FadeInSection delay={0.6}>
            <div className="group relative bg-black/30 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/20 hover:shadow-xl transition-all">
              <div className="flex items-center gap-6">
                <img
                  src="https://www.forstu.co/external/img/logo3.png"
                  alt="FORSTU"
                  className="w-36 h-auto rounded-md bg-white/5 p-2"
                />
                <div>
                  <h3 className="text-2xl font-semibold">FORSTU <span className="text-sm text-purple-300">(Startup)</span></h3>
                  <p className="text-sm text-gray-300">Software Developer Intern</p>
                  <p className="text-sm text-gray-400 mt-1">Pune | Jun 2024 – Dec 2024</p>
                </div>
              </div>

              {/* Hover overlay with responsibilities */}
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-hover:pointer-events-auto absolute inset-0 bg-gradient-to-b from-black/70 to-black/80 rounded-2xl p-6 flex items-center transition-opacity">
                <div className="max-h-[70%] overflow-y-auto text-sm text-gray-100">
                  <h4 className="text-lg font-semibold mb-3">Responsibilities</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Automated Testing:</strong> Developed automated scripts for embedded systems, cutting testing cycles by 35% and significantly increasing system reliability.</li>
                    <li><strong>Data Visualization:</strong> Architected real-time Power BI dashboards to track critical performance metrics and KPIs for stakeholders.</li>
                    <li><strong>System Monitoring:</strong> Engineered a custom monitoring tool that increased performance tracking accuracy by 15%.</li>
                    <li><strong>Cloud & Database:</strong> Managed AWS deployments and refactored MySQL queries to optimize database latency and speed.</li>
                    <li><strong>Full-Stack Development:</strong> Collaborated on cross-functional features using React.js and Django to enhance web application functionality.</li>
                  </ul>
                </div>
              </div>
            </div>
          </FadeInSection>

          <FadeInSection delay={0.8}>
            <div className="group relative bg-black/30 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/20 hover:shadow-xl transition-all">
              <div className="flex items-center gap-6">
                <div className="w-36 h-20 flex items-center justify-center bg-gradient-to-br from-purple-800 to-purple-600 rounded-md text-white font-semibold">RNS</div>
                <div>
                  <h3 className="text-2xl font-semibold">RNS</h3>
                  <p className="text-sm text-gray-300">Associate Technical Consultant</p>
                  <p className="text-sm text-gray-400 mt-1">Core Tech: Identity Access Management (Saviynt)</p>
                </div>
              </div>

              <div className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-hover:pointer-events-auto absolute inset-0 bg-gradient-to-b from-black/70 to-black/80 rounded-2xl p-6 flex items-center transition-opacity">
                <div className="max-h-[70%] overflow-y-auto text-sm text-gray-100">
                  <h4 className="text-lg font-semibold mb-3">Responsibilities</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>IAM Implementation:</strong> Configured and deployed Identity Access Management solutions using Saviynt to ensure secure and scalable user lifecycle management.</li>
                    <li><strong>Governance & Compliance:</strong> Streamlined User Access Reviews (UAR) and Segregation of Duties (SoD) policies to meet enterprise security standards.</li>
                    <li><strong>Workflow Automation:</strong> Designed and automated provisioning workflows to reduce manual overhead for onboarding/offboarding.</li>
                    <li><strong>Integration:</strong> Integrated Saviynt with target applications (AD, SAP, Cloud apps) to centralize identity governance.</li>
                    <li><strong>Troubleshooting:</strong> Resolved complex technical issues related to identity synchronization and connector configurations.</li>
                  </ul>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>

        <CountdownSection />
      </div>
    </section>
  );
}