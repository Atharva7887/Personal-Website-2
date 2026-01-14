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

              {/* Hover popup with summarized responsibilities */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="transform scale-95 opacity-0 translate-y-4 group-hover:scale-100 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-auto transition-all duration-300 ease-out w-full h-full flex items-center justify-center">
                  <div className="bg-gradient-to-br from-black/85 to-black/75 border border-purple-600/40 rounded-2xl p-6 max-w-3xl shadow-2xl">
                    <h4 className="text-lg font-semibold text-white mb-2">Responsibilities</h4>
                    <p className="text-sm text-gray-200 leading-snug">
                      Built automated test suites that cut testing cycles by ~35%, designed real-time Power BI dashboards for KPI tracking, engineered a monitoring tool (+15% accuracy), managed AWS deployments and optimized MySQL queries, and contributed full-stack features (React.js + Django).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </FadeInSection>

          <FadeInSection delay={0.8}>
            <div className="group relative bg-black p-6 rounded-2xl border border-purple-500/20 hover:shadow-xl transition-all">
              <div className="flex items-center gap-6">
                <img
                  src="https://www.rnstechnology.com/wp-content/uploads/2020/01/cropped-RNS-HIGH-RES-Logo.png"
                  alt="RNS Logo"
                  className="w-36 h-auto rounded-md bg-white/5 p-2"
                />
                <div>
                  <h3 className="text-2xl font-semibold">RNS</h3>
                  <p className="text-sm text-gray-300">Associate Technical Consultant</p>
                  <p className="text-sm text-gray-400 mt-1">Oct 2025 – Present</p>
                  <p className="text-sm text-gray-400 mt-1">Core Tech: Identity Access Management (Saviynt)</p>
                </div>
              </div>

              {/* Hover popup with summarized responsibilities for RNS */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="transform scale-95 opacity-0 translate-y-4 group-hover:scale-100 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-auto transition-all duration-300 ease-out w-full h-full flex items-center justify-center">
                  <div className="bg-gradient-to-br from-black/90 to-black/80 border border-purple-600/40 rounded-2xl p-6 max-w-3xl shadow-2xl">
                    <h4 className="text-lg font-semibold text-white mb-2">Responsibilities</h4>
                    <p className="text-sm text-gray-200 leading-snug">
                      Implemented Saviynt-based IAM, automated provisioning workflows, improved UAR/SoD governance, integrated Saviynt with AD/SAP/cloud targets, and troubleshot identity sync/connectors to ensure reliable access management.
                    </p>
                  </div>
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