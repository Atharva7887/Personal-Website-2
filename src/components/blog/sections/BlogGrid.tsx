import { BlogPost } from '../../../types/blog';
import BlogPostCard from '../BlogPostCard';
import FadeScale from '../animations/FadeScale';

interface BlogGridProps {
  posts: BlogPost[];
}

export default function BlogGrid({ posts }: BlogGridProps) {
  return (
    <div className="grid gap-8">
      {posts.map((post, index) => (
        <FadeScale key={post.id} delay={0.4 + index * 0.2}>
          <BlogPostCard post={post} />
        </FadeScale>
      ))}
    </div>
  );
}