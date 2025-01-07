import { useState } from 'react';

interface CategoryInputProps {
  categories: string[];
  onAddCategory: (category: string) => void;
  onRemoveCategory: (category: string) => void;
}

export default function CategoryInput({ 
  categories, 
  onAddCategory, 
  onRemoveCategory 
}: CategoryInputProps) {
  const [category, setCategory] = useState('');

  const handleAdd = () => {
    if (category && !categories.includes(category)) {
      onAddCategory(category);
      setCategory('');
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">Categories</label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="flex-1 px-4 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Add category"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors"
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <span
            key={cat}
            className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-300 rounded"
          >
            {cat}
            <button
              type="button"
              onClick={() => onRemoveCategory(cat)}
              className="text-purple-300 hover:text-purple-100"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}