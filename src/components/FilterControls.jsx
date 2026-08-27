import React from 'react';
import { Search, Calendar, Zap, RotateCcw, X } from 'lucide-react';
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
    <div className="mb-12 space-y-5 max-w-5xl mx-auto font-sans">
      {/* Large Search Bar */}
      <div className="relative">
        <div className="relative flex items-center bg-white border border-[#E8E7EF] rounded-full shadow-lg shadow-slate-900/5 hover:shadow-xl focus-within:shadow-2xl focus-within:border-[#0F0F14] transition duration-200 p-2">
          <span className="pl-4 text-[#68677A] select-none">
            <Search className="w-5 h-5 text-[#68677A]" />
          </span>
          <input
            type="text"
            value={neighborhoodInput}
            onChange={(e) => onNeighborhoodChange(e.target.value)}
            placeholder="Search events by title, city, neighborhood, or keywords (e.g. Music, Coimbatore)..."
            className="w-full pl-3 pr-4 py-2.5 bg-transparent text-sm sm:text-base text-[#0F0F14] placeholder-[#9291A0] focus:outline-none font-bold truncate"
          />
          {neighborhoodInput && (
            <button
              onClick={() => onNeighborhoodChange('')}
              className="mr-2 px-3.5 py-1 text-xs font-bold text-[#0F0F14] bg-[#F4F3F8] hover:bg-[#EAE8F5] rounded-full transition cursor-pointer flex items-center gap-1 whitespace-nowrap"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Presets & Sorting Filter Bar (Solid White Container) */}
      <div className="bg-white border border-[#E8E7EF] rounded-3xl p-5 shadow-lg shadow-slate-900/5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Date Filter Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-[#0F0F14] mr-1 flex items-center gap-1 uppercase tracking-wider whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5 text-[#0F0F14]" />
              <span>Date:</span>
            </span>

            {[
              { id: 'all', label: 'All Dates' },
              { id: 'today', label: 'Today' },
              { id: 'tomorrow', label: 'Tomorrow' },
              { id: 'this_weekend', label: 'This Weekend' },
              { id: 'this_week', label: 'Next 7 Days' },
              { id: 'custom', label: 'Custom Range' },
            ].map((preset) => {
              const isActive = datePreset === preset.id || (!datePreset && preset.id === 'all');
              return (
                <button
                  key={preset.id}
                  onClick={() => onDatePresetChange(preset.id)}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold transition border cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#0F0F14] text-white border-[#0F0F14] shadow-md font-extrabold'
                      : 'bg-white text-[#68677A] hover:text-[#0F0F14] border-[#E8E7EF] hover:bg-[#F4F3F8]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Sort By Filter */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-black text-[#0F0F14] flex items-center gap-1 uppercase tracking-wider whitespace-nowrap">
              <Zap className="w-3.5 h-3.5 text-[#0F0F14]" />
              <span>Sort:</span>
            </span>
            <select
              value={sort || 'datetime_asc'}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-white border border-[#E8E7EF] focus:border-[#0F0F14] text-xs font-bold text-[#0F0F14] rounded-full px-4 py-2 outline-none cursor-pointer shadow-2xs whitespace-nowrap"
            >
              <option value="datetime_asc">Earliest Upcoming</option>
              <option value="datetime_desc">Furthest Date</option>
              <option value="created_desc">Newly Posted</option>
              <option value="popularity_desc">Most Popular (RSVP)</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Pickers */}
        {datePreset === 'custom' && (
          <div className="pt-3 border-t border-[#F0EFF6] flex flex-wrap items-center gap-4 bg-[#F4F3F8] p-3 rounded-2xl border border-[#E8E7EF]">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-[#0F0F14] whitespace-nowrap">From Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="bg-white border border-[#E8E7EF] focus:border-[#0F0F14] rounded-full px-3 py-1.5 text-xs text-[#0F0F14] font-bold outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-[#0F0F14] whitespace-nowrap">To Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="bg-white border border-[#E8E7EF] focus:border-[#0F0F14] rounded-full px-3 py-1.5 text-xs text-[#0F0F14] font-bold outline-none"
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
              className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-[#0F0F14] text-xs font-extrabold border border-[#E8E7EF] hover:border-[#0F0F14] transition flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
