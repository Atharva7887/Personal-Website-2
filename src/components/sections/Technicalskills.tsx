import FadeInSection from '../animations/FadeInSection';

export default function Technicalskills() {
  return (
    <FadeInSection delay={0.8}>
      <div className="grid gap-6 mt-16">
        <div>
          <h2 className="text-purple-400 text-2xl md:text-[1.875rem] font-playfair font-black mb-4">
            Technicall Skills
          </h2>
        </div>
        <div>
          <p className="text-gray-300 text-lg leading-relaxed">
            <strong style={{ color: '#cf46ff' }}>Core Expertise:</strong>
            Artificial Intelligence (AI), Machine Learning, Deep Learning,
            Natural Language Processing (NLP), Data Analysis, Data
            Visualization, and Cloud Computing with AWS.
            <br />
            <br />
            <strong style={{ color: '#cf46ff' }}>Programming Languages:</strong>
            Python, R, SQL, Java, C, C++, HTML, CSS.
            <br />
            <br />
            <strong style={{ color: '#cf46ff' }}>Databases:</strong>
            MySQL, MongoDB.
            <br />
            <br />
            <strong style={{ color: '#cf46ff' }}>Tools & Software:</strong>
            MySQL Workbench, Power BI, Tableau, Android Studio, Visual Studio,
            Eclipse, and Cisco Packet Tracer.
          </p>
        </div>
      </div>
    </FadeInSection>
  );
}
