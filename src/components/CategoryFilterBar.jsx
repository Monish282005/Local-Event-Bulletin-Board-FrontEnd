import React from 'react';
import { Sparkles } from 'lucide-react';
import CategoryBadge, { CATEGORY_CONFIG } from './CategoryBadge';

export default function CategoryFilterBar({ selectedCategory, onSelectCategory }) {
  const categories = Object.keys(CATEGORY_CONFIG);

  return (
    <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
      <button
        onClick={() => onSelectCategory('')}
        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border transition duration-150 whitespace-nowrap ${
          selectedCategory === ''
            ? 'bg-[#0F0F14] text-white border-[#0F0F14] shadow-md font-extrabold'
            : 'bg-[#F4F3F8] text-[#0F0F14] border-[#E8E7EF] hover:bg-[#EAE8F5]'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>All Events</span>
      </button>

      {categories.map((cat) => (
        <CategoryBadge
          key={cat}
          category={cat}
          active={selectedCategory === cat}
          onClick={() => onSelectCategory(selectedCategory === cat ? '' : cat)}
        />
      ))}
    </div>
  );
}
