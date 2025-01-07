interface LanguageCardProps {
  name: string;
  level: string;
  proficiency: number;
}

export default function LanguageCard({ name, level, proficiency }: LanguageCardProps) {
  return (
    <div className="hover-card bg-black/30 backdrop-blur-sm rounded-xl p-8">
      <h3 className="text-xl font-semibold mb-4">{name}</h3>
      <p className="text-gray-400 mb-4">{level}</p>
      <div className="proficiency-bar">
        <div 
          className="proficiency-level" 
          style={{ width: `${proficiency}%` }}
        />
      </div>
    </div>
  );
}