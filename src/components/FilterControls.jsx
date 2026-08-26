import React from 'react';
import CategoryFilterBar from './CategoryFilterBar';

export default function FilterControls({
  neighborhoodInput,
  onNeighborhoodChange,
  selectedCategory,
  onCategoryChange,
  onClearFilters,
}) {
  const hasActiveFilters = neighborhoodInput.trim() !== '' || selectedCategory !== '';

  return (
    <div className="mb-10 space-y-6 max-w-4xl mx-auto">
      {/* Prominent Large Horizontal Search Bar */}
      <div className="relative">
        <div className="relative flex items-center bg-white border border-[#E8E7EF] rounded-full shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:border-[#5B4BFF] transition duration-200 p-1.5 sm:p-2">
          <span className="pl-4 text-[#68677A] text-lg select-none">
            🔍
          </span>
          <input
            type="text"
            value={neighborhoodInput}
            onChange={(e) => onNeighborhoodChange(e.target.value)}
            placeholder="Search events by city, district, or neighborhood (e.g. Bengaluru, Koramangala)..."
            className="w-full pl-3 pr-4 py-2.5 bg-transparent text-sm sm:text-base text-[#11112A] placeholder-[#9291A0] focus:outline-none font-medium"
          />
          {neighborhoodInput && (
            <button
              onClick={() => onNeighborhoodChange('')}
              className="mr-2 px-3 py-1 text-xs font-semibold text-[#68677A] hover:text-[#11112A] bg-[#F1EEFF] hover:bg-[#E4DEFF] rounded-full transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Bar & Clear Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex-1 overflow-hidden">
          <CategoryFilterBar
            selectedCategory={selectedCategory}
            onSelectCategory={onCategoryChange}
          />
        </div>

        {hasActiveFilters && (
          <div className="flex justify-end pt-1 sm:pt-0 shrink-0">
            <button
              onClick={onClearFilters}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 text-[#68677A] hover:text-[#11112A] text-xs font-semibold border border-[#E8E7EF] transition flex items-center gap-1.5 shadow-sm"
            >
              <span>↺</span>
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

