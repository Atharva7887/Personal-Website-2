import { useBlogPosts } from '../../hooks/useBlogPosts';
import { BlogPost } from '../../types/blog';

interface BlogPostListProps {
  onSelectPost: (post: BlogPost) => void;
}

export default function BlogPostList({ onSelectPost }: BlogPostListProps) {
  const { posts, isLoading, error, refreshPosts } = useBlogPosts();

  if (isLoading) {
    return (
      <div className="bg-gray-900/50 rounded-lg p-6">
        <div className="animate-pulse text-center">Loading posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900/50 rounded-lg p-6">
        <div className="text-red-500">Error loading posts: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Blog Posts</h2>
        <button
          onClick={refreshPosts}
          className="text-purple-400 hover:text-purple-300"
        >
          Refresh
        </button>
      </div>
      <div className="space-y-4">
        {posts.length === 0 ? (
          <p className="text-center text-gray-400">No posts yet</p>
        ) : (
          posts.map((post) => (
            <button
              key={post.id}
              onClick={() => onSelectPost(post)}
              className="w-full text-left p-4 rounded-lg bg-black/30 hover:bg-black/50 transition-colors"
            >
              <h3 className="font-medium">{post.title}</h3>
              <p className="text-sm text-gray-400">{post.date}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}