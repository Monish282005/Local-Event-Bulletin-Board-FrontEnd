import React from 'react';
import { Sparkles } from 'lucide-react';
import CategoryBadge, { CATEGORY_CONFIG } from './CategoryBadge';

export default function CategoryFilterBar({ selectedCategory, onSelectCategory }) {
  const categories = Object.keys(CATEGORY_CONFIG);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => onSelectCategory('')}
        className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border transition duration-150 whitespace-nowrap ${
          selectedCategory === ''
            ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-md font-extrabold'
            : 'bg-white text-[#0F172A] border-[#E2E8F0] hover:bg-[#F1F5F9]'
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
