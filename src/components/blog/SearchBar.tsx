import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export default function SearchBar({ query, onQueryChange }: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search posts..."
        className="w-full px-4 py-2 pl-10 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
      <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
    </form>
  );
}