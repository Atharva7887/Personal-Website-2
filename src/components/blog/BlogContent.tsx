import { useState } from 'react';
import { useBlogSearch } from '../../hooks/useBlogSearch';
import BlogHeader from './sections/BlogHeader';
import BlogGrid from './sections/BlogGrid';
import BlogSidebarSection from './sections/BlogSidebarSection';
import BlogList from './BlogList';

export default function BlogContent() {
  const { searchQuery, setSearchQuery } = useBlogSearch();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <BlogHeader 
        searchQuery={searchQuery}
        onQueryChange={setSearchQuery}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <BlogList 
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
          />
        </div>
        <div className="lg:col-span-4">
          <BlogSidebarSection 
            onCategoryChange={setSelectedCategory}
            selectedCategory={selectedCategory}
          />
        </div>
      </div>
    </div>
  );
}