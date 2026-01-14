import SlideInSection from '../animations/SlideInSection';
import CategoryList from '../CategoryList';

interface BlogSidebarSectionProps {
  onCategoryChange: (category: string | null) => void;
  selectedCategory: string | null;
}

export default function BlogSidebarSection({ 
  onCategoryChange, 
  selectedCategory 
}: BlogSidebarSectionProps) {
  return (
    <div className="space-y-8">
      <SlideInSection delay={0.4} direction="left">
        <CategoryList 
          onCategorySelect={onCategoryChange}
          selectedCategory={selectedCategory}
        />
      </SlideInSection>
    </div>
  );
}