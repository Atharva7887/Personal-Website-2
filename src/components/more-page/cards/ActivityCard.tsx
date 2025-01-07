interface ActivityCardProps {
  title: string;
  description: string;
  icon: string;
}

export default function ActivityCard({ title, description, icon }: ActivityCardProps) {
  return (
    <div className="hover-card bg-black/30 backdrop-blur-sm rounded-xl p-8">
      <div className="flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-lg mb-6">
        <span dangerouslySetInnerHTML={{ __html: icon }} />
      </div>
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}