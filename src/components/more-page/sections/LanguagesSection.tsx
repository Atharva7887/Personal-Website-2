import { languages } from '../../../data/languages';
import LanguageCard from '../cards/LanguageCard';

export default function LanguagesSection() {
  return (
    <section id="languages" className="mb-20">
      <h2 className="section-header text-4xl font-bold mb-12 text-center">
        Language Proficiency
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {languages.map((language) => (
          <LanguageCard key={language.name} {...language} />
        ))}
      </div>
    </section>
  );
}