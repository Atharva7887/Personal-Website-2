import CategoryList from './CategoryList';

interface BlogSidebarProps {
  onCategoryChange: (category: string | null) => void;
  selectedCategory: string | null;
}

export default function BlogSidebar({ onCategoryChange, selectedCategory }: BlogSidebarProps) {
  return (
    <div className="space-y-8">
      <CategoryList 
        onCategorySelect={onCategoryChange}
        selectedCategory={selectedCategory}
      />
    </div>
  );
}