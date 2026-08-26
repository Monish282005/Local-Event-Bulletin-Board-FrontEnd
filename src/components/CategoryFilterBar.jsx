import React from 'react';
import CategoryBadge, { CATEGORY_CONFIG } from './CategoryBadge';

export default function CategoryFilterBar({ selectedCategory, onSelectCategory }) {
  const categories = Object.keys(CATEGORY_CONFIG);

  return (
    <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
      <button
        onClick={() => onSelectCategory('')}
        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition duration-150 ${
          selectedCategory === ''
            ? 'bg-[#11112A] text-white border-[#11112A] shadow-md'
            : 'bg-white text-[#68677A] border-[#E8E7EF] hover:border-[#D5D3E0] hover:text-[#11112A]'
        }`}
      >
        <span>✨</span>
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

