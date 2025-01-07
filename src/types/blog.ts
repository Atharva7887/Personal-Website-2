export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
  image?: string; // Made optional with ?
  categories: string[];
  author: {
    name: string;
    avatar: string;
  };
}

export interface BlogCategory {
  name: string;
  slug: string;
  count: number;
}