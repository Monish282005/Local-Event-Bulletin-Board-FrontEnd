import React from 'react';
import { Dumbbell, Music, Utensils, Tag, Compass } from 'lucide-react';

export const CATEGORY_CONFIG = {
  sports: {
    label: 'Sports',
    icon: Dumbbell,
    colorClass: 'bg-[#F4F3F8] text-[#0F0F14] border-[#E8E7EF] hover:bg-[#EAE8F5]',
    activeClass: 'bg-[#0F0F14] text-white border-[#0F0F14] shadow-md',
  },
  music: {
    label: 'Music',
    icon: Music,
    colorClass: 'bg-[#F4F3F8] text-[#0F0F14] border-[#E8E7EF] hover:bg-[#EAE8F5]',
    activeClass: 'bg-[#0F0F14] text-white border-[#0F0F14] shadow-md',
  },
  food: {
    label: 'Food & Drink',
    icon: Utensils,
    colorClass: 'bg-[#F4F3F8] text-[#0F0F14] border-[#E8E7EF] hover:bg-[#EAE8F5]',
    activeClass: 'bg-[#0F0F14] text-white border-[#0F0F14] shadow-md',
  },
  yard_sale: {
    label: 'Yard Sale',
    icon: Tag,
    colorClass: 'bg-[#F4F3F8] text-[#0F0F14] border-[#E8E7EF] hover:bg-[#EAE8F5]',
    activeClass: 'bg-[#0F0F14] text-white border-[#0F0F14] shadow-md',
  },
  other: {
    label: 'Other',
    icon: Compass,
    colorClass: 'bg-[#F4F3F8] text-[#0F0F14] border-[#E8E7EF] hover:bg-[#EAE8F5]',
    activeClass: 'bg-[#0F0F14] text-white border-[#0F0F14] shadow-md',
  },
};

export default function CategoryBadge({ category, active = false, onClick, className = '' }) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
  const IconComponent = config.icon;
  const baseClass = active ? config.activeClass : config.colorClass;

  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition duration-150 whitespace-nowrap ${baseClass} ${className}`}
    >
      <IconComponent className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </Component>
  );
}
