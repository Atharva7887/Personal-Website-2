import { useState, useCallback } from 'react';
import AdminNavbar from '../components/admin/AdminNavbar';
import BlogPostList from '../components/admin/BlogPostList';
import BlogPostEditor from '../components/admin/BlogPostEditor';
import { BlogBackground } from '../components/backgrounds/BlogBackground';
import { useAuth } from '../hooks/useAuth';
import { BlogPost } from '../types/blog';

export default function AdminPage() {
  const { isAuthenticated } = useAuth();
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const handleSave = useCallback(() => {
    // Reset selected post and refresh the list
    setSelectedPost(null);
  }, []);

  if (!isAuthenticated) {
    return <div>Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminNavbar />
      <main className="relative pt-24 pb-20">
        <BlogBackground />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <BlogPostList onSelectPost={setSelectedPost} />
              <button
                onClick={() => setSelectedPost(null)}
                className="w-full mt-4 px-6 py-2 bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors"
              >
                Create New Post
              </button>
            </div>
            <div className="lg:col-span-8">
              <BlogPostEditor post={selectedPost} onSave={handleSave} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}