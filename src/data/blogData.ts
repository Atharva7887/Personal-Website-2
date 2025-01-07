import { BlogPost } from '../types/blog';

export const blogData: BlogPost[] = [
  {
    id: 1,
    title: 'Getting Started with Machine Learning',
    slug: 'getting-started-with-ml',
    excerpt: 'A beginner\'s guide to understanding the basics of machine learning and its applications.',
    content: '...',
    date: '2024-03-15',
    readTime: '5 min read',
    image: 'https://stackblitz.com/storage/blobs/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBd0JwTVE9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--870030bfe5125a4c9ce0cb4fbe49fa158f902a52/ml-blog.jpg',
    categories: ['Technology', 'AI & ML'],
    author: {
      name: 'Atharva Shirke',
      avatar: 'https://stackblitz.com/storage/blobs/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBd05wTVE9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--3f6755e52ec74e96d7d079716f3d38f55456059c/me.jpg'
    }
  },
  {
    id: 2,
    title: 'Web Development Best Practices',
    slug: 'web-dev-best-practices',
    excerpt: 'Essential practices every web developer should follow for better code quality.',
    content: '...',
    date: '2024-03-10',
    readTime: '4 min read',
    image: 'https://stackblitz.com/storage/blobs/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBd0JwTVE9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--870030bfe5125a4c9ce0cb4fbe49fa158f902a52/webdev-blog.jpg',
    categories: ['Programming', 'Web Development'],
    author: {
      name: 'Atharva Shirke',
      avatar: 'https://stackblitz.com/storage/blobs/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBd05wTVE9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--3f6755e52ec74e96d7d079716f3d38f55456059c/me.jpg'
    }
  },
  {
    id: 3,
    title: 'The Future of AI',
    slug: 'future-of-ai',
    excerpt: 'Exploring the potential impact of artificial intelligence on various industries.',
    content: '...',
    date: '2024-03-05',
    readTime: '6 min read',
    image: 'https://stackblitz.com/storage/blobs/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBd0JwTVE9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--870030bfe5125a4c9ce0cb4fbe49fa158f902a52/ai-blog.jpg',
    categories: ['Technology', 'AI & ML'],
    author: {
      name: 'Atharva Shirke',
      avatar: 'https://stackblitz.com/storage/blobs/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBd05wTVE9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--3f6755e52ec74e96d7d079716f3d38f55456059c/me.jpg'
    }
  }
];