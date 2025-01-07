import React from 'react';
import { BlogPost } from '../../types/blog';
import { formatDate } from '../../utils/dateUtils';

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <article 
      className="bg-gray-900/50 rounded-lg overflow-hidden hover:transform hover:scale-[1.02] transition-all duration-300"
      data-categories={post.categories.map(cat => cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')).join(',')}
    >
      <img
        src={post.image}
        alt={post.title}
        className="w-full h-64 object-cover"
      />
      <div className="p-6">
        <div className="flex justify-between items-center text-sm text-gray-400 mb-3">
          <span>{formatDate(post.date)}</span>
          <span>{post.readTime}</span>
        </div>
        <h2 className="text-2xl font-semibold mb-3 text-white hover:text-purple-400 transition-colors">
          <a href={`/blog/${post.slug}`}>{post.title}</a>
        </h2>
        <p className="text-gray-300 mb-4">{post.excerpt}</p>
        <div className="flex items-center justify-between">
          <a
            href={`/blog/${post.slug}`}
            className="text-purple-400 hover:text-purple-300 inline-flex items-center"
          >
            Read more
            <svg
              className="w-4 h-4 ml-2"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
          <div className="flex gap-2">
            {post.categories.map((category) => (
              <span
                key={category}
                className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}