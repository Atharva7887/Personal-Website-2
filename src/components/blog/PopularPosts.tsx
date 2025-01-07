import React from 'react';
import { usePopularPosts } from '../../hooks/usePopularPosts';

export default function PopularPosts() {
  const { posts } = usePopularPosts();

  return (
    <div className="bg-gray-900/50 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Popular Posts</h2>
      <div className="space-y-4">
        {posts.map((post) => (
          <a
            key={post.id}
            href={`/blog/${post.slug}`}
            className="flex items-start space-x-4 group"
          >
            <img
              src={post.image}
              alt={post.title}
              className="w-16 h-16 object-cover rounded"
            />
            <div>
              <h3 className="text-sm font-medium group-hover:text-purple-400 transition-colors">
                {post.title}
              </h3>
              <p className="text-xs text-gray-400">{post.readTime}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}