import { BlogPost } from '../types/blog';

const STORAGE_KEY = 'blog_posts';

class BlogService {
  private static instance: BlogService;
  private posts: Map<number, BlogPost>;

  private constructor() {
    this.posts = new Map();
    this.loadFromStorage();
  }

  static getInstance(): BlogService {
    if (!BlogService.instance) {
      BlogService.instance = new BlogService();
    }
    return BlogService.instance;
  }

  private loadFromStorage() {
    try {
      const savedPosts = localStorage.getItem(STORAGE_KEY);
      if (savedPosts) {
        const posts = JSON.parse(savedPosts) as BlogPost[];
        posts.forEach(post => this.posts.set(post.id, post));
      }
    } catch (error) {
      console.error('Error loading posts from storage:', error);
      // Don't initialize sample data if there's an error loading
    }
  }

  private saveToStorage() {
    try {
      const posts = Array.from(this.posts.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch (error) {
      console.error('Error saving posts to storage:', error);
    }
  }

  async getAllPosts(): Promise<BlogPost[]> {
    return Array.from(this.posts.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getPost(id: number): Promise<BlogPost | undefined> {
    return this.posts.get(id);
  }

  async createPost(post: Omit<BlogPost, 'id'>): Promise<BlogPost> {
    const id = Date.now();
    const newPost: BlogPost = {
      ...post,
      id,
      date: new Date().toISOString(),
      readTime: this.calculateReadTime(post.content),
      author: {
        name: 'Atharva Shirke',
        avatar: '/images/me.jpg'
      }
    };
    
    this.posts.set(id, newPost);
    this.saveToStorage();
    return newPost;
  }

  async updatePost(id: number, post: BlogPost): Promise<BlogPost> {
    if (!this.posts.has(id)) {
      throw new Error('Post not found');
    }
    
    const updatedPost = {
      ...post,
      readTime: this.calculateReadTime(post.content)
    };
    
    this.posts.set(id, updatedPost);
    this.saveToStorage();
    return updatedPost;
  }

  async deletePost(id: number): Promise<boolean> {
    const deleted = this.posts.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  private calculateReadTime(content: string): string {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  }
}

export const blogService = BlogService.getInstance();