interface EducationCardProps {
  degree: string;
  institution: string;
  duration: string;
  description: string[];
  specialization?: string;
  thesis?: string;
  grade?: string;
}

export default function EducationCard({
  degree,
  institution,
  duration,
  description,
  specialization,
  thesis,
  grade
}: EducationCardProps) {
  return (
    <div className="hover-card bg-black/30 backdrop-blur-sm rounded-xl p-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">{degree}</h3>
        <span className="text-purple-400">{duration}</span>
      </div>
      
      <p className="text-lg mb-2">{institution}</p>
      
      {specialization && (
        <p className="text-gray-300 mb-2">
          Specialization in {specialization}
        </p>
      )}
      
      {thesis && (
        <p className="text-gray-300 mb-2">
          Thesis on "{thesis}"
        </p>
      )}
      
      {grade && (
        <p className="text-gray-300 mb-2">{grade}</p>
      )}
      
      {description.map((item, index) => (
        <p key={index} className="text-gray-400 mb-1">{item}</p>
      ))}
    </div>
  );
}