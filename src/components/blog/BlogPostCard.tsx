import { useState } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { BlogPost } from '../../types/blog';
import { useAuth } from '../../hooks/useAuth';
import BlogPostExpanded from './BlogPostExpanded';
import EditPostModal from './modals/EditPostModal';
import { useBlogActions } from '../../hooks/useBlogActions';
import FadeScale from './animations/FadeScale';
import Alert from '../ui/Alert';

interface BlogPostCardProps {
  post: BlogPost;
}

export default function BlogPostCard({ post }: BlogPostCardProps) {
  const { isAuthenticated } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { deletePost, isLoading } = useBlogActions();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await deletePost(post.id);
      setSuccessMessage('Post deleted successfully!');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError('Failed to delete post. Please try again.');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setSuccessMessage('Post updated successfully!');
    setTimeout(() => window.location.reload(), 1500);
  };

  const defaultImage = '/images/default-blog.jpg';

  return (
    <>
      <article className="blog-card bg-gray-900/50 rounded-lg overflow-hidden">
        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}
        {successMessage && (
          <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
        )}
        
        {(post.image || defaultImage) && (
          <img
            src={post.image || defaultImage}
            alt={post.title}
            className="w-full h-64 object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = defaultImage;
            }}
          />
        )}
        <div className="p-6">
          <div className="flex justify-between items-center text-sm text-gray-400 mb-3">
            <span>{formatDate(post.date)}</span>
            <span>{post.readTime}</span>
          </div>
          <h2 className="text-2xl font-semibold mb-3 text-white hover:text-purple-400 transition-colors">
            {post.title}
          </h2>
          <p className="text-gray-300 mb-4">{post.excerpt}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {post.categories.map((category) => (
                <span
                  key={category}
                  className="category-item text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded"
                >
                  {category}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsExpanded(true)}
                className="text-purple-400 hover:text-purple-300 inline-flex items-center"
              >
                Read more
                <svg
                  className="w-4 h-4 ml-2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>

              {isAuthenticated && (
                <div className="flex gap-2">
                  <button
                    onClick={handleEdit}
                    className="px-3 py-1 text-sm bg-purple-500 rounded hover:bg-purple-600 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="px-3 py-1 text-sm bg-red-500 rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </article>

      {isExpanded && (
        <BlogPostExpanded 
          post={post} 
          onClose={() => setIsExpanded(false)} 
        />
      )}

      {isEditing && (
        <EditPostModal
          post={post}
          onClose={() => setIsEditing(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}