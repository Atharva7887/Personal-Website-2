import { useBlogCategories } from '../../hooks/useBlogCategories';
import FadeScale from './animations/FadeScale';

interface CategoryListProps {
  onCategorySelect: (category: string | null) => void;
  selectedCategory: string | null;
}

export default function CategoryList({ onCategorySelect, selectedCategory }: CategoryListProps) {
  const { categories } = useBlogCategories();

  const handleCategoryClick = (slug: string | null) => {
    onCategorySelect(slug);
    
    // Handle URL hash for deep linking
    if (slug) {
      window.location.hash = slug;
    } else {
      history.pushState("", document.title, window.location.pathname + window.location.search);
    }
  };

  return (
    <div className="bg-gray-900/50 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Categories</h2>
      <div className="space-y-2">
        <FadeScale delay={0.1}>
          <button
            onClick={() => handleCategoryClick(null)}
            className={`block w-full text-left px-3 py-2 rounded transition-colors ${
              selectedCategory === null
                ? 'text-purple-400 bg-purple-500/10'
                : 'text-gray-300 hover:text-purple-400'
            }`}
          >
            All Posts
          </button>
        </FadeScale>

        {categories.map((category, index) => (
          <FadeScale key={category.slug} delay={0.2 + index * 0.1}>
            <button
              onClick={() => handleCategoryClick(category.slug)}
              className={`block w-full text-left px-3 py-2 rounded transition-colors ${
                selectedCategory === category.slug
                  ? 'text-purple-400 bg-purple-500/10'
                  : 'text-gray-300 hover:text-purple-400'
              }`}
            >
              {category.name} ({category.count})
            </button>
          </FadeScale>
        ))}
      </div>
    </div>
  );
}