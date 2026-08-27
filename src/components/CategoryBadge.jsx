import React from 'react';
import { Dumbbell, Music, Utensils, Tag, Compass } from 'lucide-react';

export const CATEGORY_CONFIG = {
  sports: {
    label: 'Sports',
    icon: Dumbbell,
    colorClass: 'bg-white text-[#0F172A] border-[#E2E8F0] hover:bg-[#F1F5F9]',
    activeClass: 'bg-[#0F172A] text-white border-[#0F172A] shadow-md font-extrabold',
  },
  music: {
    label: 'Music',
    icon: Music,
    colorClass: 'bg-white text-[#0F172A] border-[#E2E8F0] hover:bg-[#F1F5F9]',
    activeClass: 'bg-[#0F172A] text-white border-[#0F172A] shadow-md font-extrabold',
  },
  food: {
    label: 'Food & Drink',
    icon: Utensils,
    colorClass: 'bg-white text-[#0F172A] border-[#E2E8F0] hover:bg-[#F1F5F9]',
    activeClass: 'bg-[#0F172A] text-white border-[#0F172A] shadow-md font-extrabold',
  },
  yard_sale: {
    label: 'Yard Sale',
    icon: Tag,
    colorClass: 'bg-white text-[#0F172A] border-[#E2E8F0] hover:bg-[#F1F5F9]',
    activeClass: 'bg-[#0F172A] text-white border-[#0F172A] shadow-md font-extrabold',
  },
  other: {
    label: 'Other',
    icon: Compass,
    colorClass: 'bg-white text-[#0F172A] border-[#E2E8F0] hover:bg-[#F1F5F9]',
    activeClass: 'bg-[#0F172A] text-white border-[#0F172A] shadow-md font-extrabold',
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
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition duration-150 whitespace-nowrap ${baseClass} ${className}`}
    >
      <IconComponent className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </Component>
  );
}
