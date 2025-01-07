import { activities } from '../../../data/activities';
import ActivityCard from '../cards/ActivityCard';

export default function ActivitiesSection() {
  return (
    <section id="extra-curricular">
      <h2 className="section-header text-4xl font-bold mb-12 text-center">
        Extra Curricular Activities
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {activities.map((activity) => (
          <ActivityCard key={activity.title} {...activity} />
        ))}
      </div>
    </section>
  );
}