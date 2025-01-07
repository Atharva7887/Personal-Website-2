import { useState, useCallback } from 'react';
import { BlogPost } from '../types/blog';

export function useBlogSearch() {
  const [searchQuery, setSearchQuery] = useState('');

  const filterPosts = useCallback((posts: BlogPost[], query: string) => {
    const searchTerms = query.toLowerCase().split(' ').filter(Boolean);
    
    if (!searchTerms.length) return posts;

    return posts.filter(post => {
      const searchableText = `
        ${post.title} 
        ${post.excerpt} 
        ${post.categories.join(' ')}
      `.toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    filterPosts
  };
}