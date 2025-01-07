import { useState } from 'react';
import { BlogPost } from '../types/blog';
import { blogService } from '../services/blogService';

export function useBlogActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPost = async (post: Partial<BlogPost>) => {
    setIsLoading(true);
    setError(null);
    try {
      const newPost: Omit<BlogPost, 'id'> = {
        title: post.title || '',
        slug: post.title?.toLowerCase().replace(/\s+/g, '-') || '',
        excerpt: post.excerpt || '',
        content: post.content || '',
        date: new Date().toISOString(),
        readTime: '5 min read',
        image: post.image || '/images/default-blog.jpg',
        categories: post.categories || ['Uncategorized'],
        author: {
          name: 'Atharva Shirke',
          avatar: '/images/me.jpg'
        }
      };
      
      return await blogService.createPost(newPost);
    } catch (err) {
      setError('Failed to create post');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePost = async (post: BlogPost) => {
    setIsLoading(true);
    setError(null);
    try {
      return await blogService.updatePost(post.id, {
        ...post,
        slug: post.title.toLowerCase().replace(/\s+/g, '-'),
      });
    } catch (err) {
      setError('Failed to update post');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePost = async (postId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await blogService.deletePost(postId);
      if (!success) {
        throw new Error('Failed to delete post');
      }
    } catch (err) {
      setError('Failed to delete post');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createPost,
    updatePost,
    deletePost,
    isLoading,
    error
  };
}