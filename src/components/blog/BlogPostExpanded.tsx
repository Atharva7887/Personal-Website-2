import { formatDate } from '../../utils/dateUtils';
import { BlogPost } from '../../types/blog';
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface BlogPostExpandedProps {
  post: BlogPost;
  onClose: () => void;
}

export default function BlogPostExpanded({ post, onClose }: BlogPostExpandedProps) {
  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleEscape);

    // Prevent scrolling of the background
    document.body.style.overflow = 'hidden';

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-lg shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-64 object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent" />
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
            <span>{formatDate(post.date)}</span>
            <span>{post.readTime}</span>
          </div>

          <h2 className="text-3xl font-bold mb-6">{post.title}</h2>

          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-gray-300 mb-6">{post.excerpt}</p>
            <div className="text-gray-300 space-y-4">
              {post.content.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800">
            <div className="flex flex-wrap gap-2">
              {post.categories.map((category) => (
                <span
                  key={category}
                  className="px-3 py-1 text-sm bg-purple-500/20 text-purple-300 rounded"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}