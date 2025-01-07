import { useState } from 'react';
import { BlogPost } from '../types/blog';

export function usePopularPosts() {
  const [posts] = useState<Pick<BlogPost, 'id' | 'title' | 'slug' | 'image' | 'readTime'>[]>([
    {
      id: 1,
      title: 'Getting Started with Machine Learning',
      slug: 'getting-started-with-ml',
      image: '/images/ml-blog.jpg',
      readTime: '5 min read'
    },
    {
      id: 2,
      title: 'Web Development Best Practices',
      slug: 'web-dev-best-practices',
      image: '/images/webdev-blog.jpg',
      readTime: '4 min read'
    },
    {
      id: 3,
      title: 'The Future of AI',
      slug: 'future-of-ai',
      image: '/images/ai-blog.jpg',
      readTime: '6 min read'
    }
  ]);

  return { posts };
}