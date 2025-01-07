import { useState, useEffect } from 'react';
import { BlogPost } from '../../types/blog';
import { useBlogActions } from '../../hooks/useBlogActions';
import CategoryInput from './blog-form/CategoryInput';
import FormField from './blog-form/FormField';
import Alert from '../ui/Alert';

interface BlogPostEditorProps {
  post: BlogPost | null;
  onSave: () => void;
}

export default function BlogPostEditor({ post, onSave }: BlogPostEditorProps) {
  const { updatePost, createPost, deletePost, isLoading, error } = useBlogActions();
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '',
    excerpt: '',
    content: '',
    image: '',
    categories: []
  });
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    if (post) {
      setFormData(post);
    } else {
      setFormData({
        title: '',
        excerpt: '',
        content: '',
        image: '',
        categories: []
      });
    }
  }, [post]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const postData = {
        ...formData,
        ...(formData.image === '' && { image: undefined })
      };

      if (post) {
        await updatePost({ ...post, ...postData });
        setSuccessMessage('Blog post updated successfully!');
      } else {
        await createPost(postData);
        setSuccessMessage('Blog post created successfully!');
      }
      onSave();
    } catch (err) {
      console.error('Failed to save post:', err);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    try {
      await deletePost(post.id);
      setSuccessMessage('Blog post deleted successfully!');
      onSave();
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const handleFieldChange = (field: keyof BlogPost, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: [...(prev.categories || []), category]
    }));
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories?.filter(c => c !== categoryToRemove) || []
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900/50 rounded-lg p-6 space-y-6">
      <h2 className="text-xl font-semibold mb-4">
        {post ? 'Edit Post' : 'New Post'}
      </h2>
      
      {error && (
        <Alert 
          type="error" 
          message={error} 
        />
      )}

      {successMessage && (
        <Alert 
          type="success" 
          message={successMessage}
          onClose={() => setSuccessMessage('')}
        />
      )}

      <FormField
        label="Title"
        value={formData.title || ''}
        onChange={(value) => handleFieldChange('title', value)}
        required
      />

      <FormField
        label="Image URL (Optional)"
        type="url"
        value={formData.image || ''}
        onChange={(value) => handleFieldChange('image', value)}
        placeholder="Leave empty to use default image"
      />

      <FormField
        label="Excerpt"
        type="textarea"
        value={formData.excerpt || ''}
        onChange={(value) => handleFieldChange('excerpt', value)}
        required
        className="h-24"
      />

      <FormField
        label="Content"
        type="textarea"
        value={formData.content || ''}
        onChange={(value) => handleFieldChange('content', value)}
        required
      />

      <CategoryInput
        categories={formData.categories || []}
        onAddCategory={handleAddCategory}
        onRemoveCategory={handleRemoveCategory}
      />

      <div className="flex justify-between pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : (post ? 'Update' : 'Create')}
        </button>
        
        {post && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="px-6 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>
    </form>
  );
}