import { useState, useEffect } from 'react';
import { BlogPost } from '../../../types/blog';
import { useBlogActions } from '../../../hooks/useBlogActions';
import { X } from 'lucide-react';
import Alert from '../../ui/Alert';

interface EditPostModalProps {
  post: BlogPost;
  onClose: () => void;
  onSave: () => void;
}

export default function EditPostModal({ post, onClose, onSave }: EditPostModalProps) {
  const [formData, setFormData] = useState(post);
  const [newCategory, setNewCategory] = useState('');
  const { updatePost, isLoading, error } = useBlogActions();
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePost(formData);
      setSuccessMessage('Post updated successfully!');
      setTimeout(() => {
        onSave();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to update post:', err);
    }
  };

  const handleAddCategory = () => {
    if (newCategory && !formData.categories.includes(newCategory)) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory]
      }));
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat !== categoryToRemove)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-gray-900 rounded-lg shadow-xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Edit Post</h2>

        {error && <Alert type="error" message={error} className="mb-4" />}
        {successMessage && <Alert type="success" message={successMessage} className="mb-4" />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Image URL</label>
            <input
              type="url"
              value={formData.image || ''}
              onChange={e => setFormData(prev => ({ ...prev, image: e.target.value }))}
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Excerpt</label>
            <textarea
              value={formData.excerpt}
              onChange={e => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-24"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea
              value={formData.content}
              onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-48"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Categories</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="flex-1 px-4 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Add category"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.categories.map(category => (
                <span
                  key={category}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-300 rounded"
                >
                  {category}
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(category)}
                    className="text-purple-300 hover:text-purple-100"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}