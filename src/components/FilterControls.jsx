import React from 'react';
import CategoryFilterBar from './CategoryFilterBar';

export default function FilterControls({
  neighborhoodInput,
  onNeighborhoodChange,
  selectedCategory,
  onCategoryChange,
  datePreset,
  onDatePresetChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  sort,
  onSortChange,
  onClearFilters,
}) {
  const hasActiveFilters =
    neighborhoodInput.trim() !== '' ||
    selectedCategory !== '' ||
    (datePreset && datePreset !== 'all') ||
    startDate !== '' ||
    endDate !== '' ||
    (sort && sort !== 'datetime_asc');

  return (
    <div className="mb-10 space-y-5 max-w-5xl mx-auto">
      {/* Prominent Large Search Bar */}
      <div className="relative">
        <div className="relative flex items-center bg-white border border-[#E8E7EF] rounded-2xl shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:border-[#5B4BFF] transition duration-200 p-1.5 sm:p-2">
          <span className="pl-4 text-[#68677A] text-lg select-none">
            🔍
          </span>
          <input
            type="text"
            value={neighborhoodInput}
            onChange={(e) => onNeighborhoodChange(e.target.value)}
            placeholder="Search events by title, city, neighborhood, or keywords (e.g. Music, Bengaluru)..."
            className="w-full pl-3 pr-4 py-2.5 bg-transparent text-sm sm:text-base text-[#11112A] placeholder-[#9291A0] focus:outline-none font-medium"
          />
          {neighborhoodInput && (
            <button
              onClick={() => onNeighborhoodChange('')}
              className="mr-2 px-3 py-1 text-xs font-semibold text-[#68677A] hover:text-[#11112A] bg-[#F1EEFF] hover:bg-[#E4DEFF] rounded-full transition cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Date Presets & Sorting Filter Bar */}
      <div className="bg-white border border-[#E8E7EF] rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Date Filter Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#11112A] mr-1 flex items-center gap-1">
              <span>📅</span> Date:
            </span>

            {[
              { id: 'all', label: 'All Dates' },
              { id: 'today', label: 'Today' },
              { id: 'tomorrow', label: 'Tomorrow' },
              { id: 'this_weekend', label: 'This Weekend' },
              { id: 'this_week', label: 'Next 7 Days' },
              { id: 'custom', label: 'Custom Range 🗓️' },
            ].map((preset) => {
              const isActive = datePreset === preset.id || (!datePreset && preset.id === 'all');
              return (
                <button
                  key={preset.id}
                  onClick={() => onDatePresetChange(preset.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition border cursor-pointer ${
                    isActive
                      ? 'bg-[#5B4BFF] text-white border-[#5B4BFF] shadow-xs'
                      : 'bg-[#FAF9FC] text-[#68677A] hover:text-[#11112A] border-[#E8E7EF] hover:bg-[#F4F3F8]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Sort By Filter */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-bold text-[#11112A] flex items-center gap-1">
              <span>⚡</span> Sort:
            </span>
            <select
              value={sort || 'datetime_asc'}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-[#FAF9FC] border border-[#E8E7EF] focus:border-[#5B4BFF] text-xs font-bold text-[#11112A] rounded-xl px-3 py-1.5 outline-none cursor-pointer"
            >
              <option value="datetime_asc">Earliest Upcoming</option>
              <option value="datetime_desc">Furthest Date</option>
              <option value="created_desc">Newly Posted</option>
              <option value="popularity_desc">Most Popular (RSVP)</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Pickers (Visible when custom is chosen) */}
        {datePreset === 'custom' && (
          <div className="pt-3 border-t border-[#F0EFF6] flex flex-wrap items-center gap-4 bg-[#FAF9FC] p-3 rounded-xl border border-[#E8E7EF]">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-[#11112A]">From Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="bg-white border border-[#E8E7EF] focus:border-[#5B4BFF] rounded-lg px-3 py-1.5 text-xs text-[#11112A] outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-[#11112A]">To Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="bg-white border border-[#E8E7EF] focus:border-[#5B4BFF] rounded-lg px-3 py-1.5 text-xs text-[#11112A] outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Category Pills Bar & Clear Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
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
              className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-[#68677A] hover:text-[#11112A] text-xs font-bold border border-[#E8E7EF] hover:border-[#5B4BFF] transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>↺</span>
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
