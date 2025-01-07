import { useBlogPosts } from '../../hooks/useBlogPosts';
import { useBlogSearch } from '../../hooks/useBlogSearch';
import BlogPostCard from './BlogPostCard';
import { useAuth } from '../../hooks/useAuth';
import FadeScale from './animations/FadeScale';

interface BlogListProps {
  searchQuery?: string;
  selectedCategory?: string | null;
}

export default function BlogList({ searchQuery = '', selectedCategory = null }: BlogListProps) {
  const { posts, isLoading, error, refreshPosts } = useBlogPosts();
  const { filterPosts } = useBlogSearch();
  const { isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 rounded-lg bg-red-100/10">
        Error loading blog posts. Please try again later.
      </div>
    );
  }

  // Filter posts based on search query and selected category
  let filteredPosts = filterPosts(posts, searchQuery);
  if (selectedCategory) {
    filteredPosts = filteredPosts.filter(post =>
      post.categories.some(cat => 
        cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-') === selectedCategory
      )
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold font-playfair">
          {selectedCategory 
            ? `${selectedCategory.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Posts`
            : 'All Posts'
          }
        </h1>
        {isAuthenticated && (
          <button
            onClick={refreshPosts}
            className="text-purple-400 hover:text-purple-300"
          >
            Refresh
          </button>
        )}
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No posts found in this category.</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {filteredPosts.map((post, index) => (
            <FadeScale key={post.id} delay={0.2 + index * 0.1}>
              <BlogPostCard post={post} />
            </FadeScale>
          ))}
        </div>
      )}
    </div>
  );
}