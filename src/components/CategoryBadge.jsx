import React from 'react';

export const CATEGORY_CONFIG = {
  sports: {
    label: 'Sports',
    icon: '⚽',
    colorClass: 'bg-blue-50 text-blue-600 border-blue-200/70 hover:bg-blue-100/80',
    activeClass: 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20',
  },
  music: {
    label: 'Music',
    icon: '🎵',
    colorClass: 'bg-purple-50 text-purple-600 border-purple-200/70 hover:bg-purple-100/80',
    activeClass: 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20',
  },
  food: {
    label: 'Food & Drink',
    icon: '🍔',
    colorClass: 'bg-amber-50 text-amber-700 border-amber-200/70 hover:bg-amber-100/80',
    activeClass: 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/20',
  },
  yard_sale: {
    label: 'Yard Sale',
    icon: '🏷️',
    colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/70 hover:bg-emerald-100/80',
    activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20',
  },
  other: {
    label: 'Other',
    icon: '📌',
    colorClass: 'bg-pink-50 text-pink-600 border-pink-200/70 hover:bg-pink-100/80',
    activeClass: 'bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-500/20',
  },
};

export default function CategoryBadge({ category, active = false, onClick, className = '' }) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
  const baseClass = active ? config.activeClass : config.colorClass;

  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition duration-150 ${baseClass} ${className}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </Component>
  );
}

