import { useState, useEffect, useCallback } from 'react';
import { BlogPost } from '../types/blog';
import { blogService } from '../services/blogService';

export function useBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const fetchedPosts = await blogService.getAllPosts();
      setPosts(fetchedPosts);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const refreshPosts = async () => {
    setIsLoading(true);
    setError(null);
    await fetchPosts();
  };

  return { posts, isLoading, error, refreshPosts };
}