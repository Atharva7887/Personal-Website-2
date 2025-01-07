import { useState, useEffect } from 'react';
import { BlogCategory } from '../types/blog';
import { useBlogPosts } from './useBlogPosts';

export function useBlogCategories() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const { posts } = useBlogPosts();

  useEffect(() => {
    // Calculate categories and their counts from actual posts
    const categoryMap = new Map<string, number>();
    
    posts.forEach(post => {
      post.categories.forEach(category => {
        const currentCount = categoryMap.get(category) || 0;
        categoryMap.set(category, currentCount + 1);
      });
    });

    const calculatedCategories: BlogCategory[] = Array.from(categoryMap.entries())
      .map(([name, count]) => ({
        name,
        slug: name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-'),
        count
      }))
      .sort((a, b) => b.count - a.count); // Sort by count in descending order

    setCategories(calculatedCategories);
  }, [posts]);

  return { categories };
}