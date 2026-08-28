import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CATEGORY_ITEMS = [
  { value: 'sports', label: 'Sports' },
  { value: 'music', label: 'Music' },
  { value: 'food', label: 'Food & Drink' },
  { value: 'yard_sale', label: 'Yard Sale' },
  { value: 'other', label: 'Other' },
];

export default function CustomCategorySelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedItem = CATEGORY_ITEMS.find((c) => c.value === value) || CATEGORY_ITEMS[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full font-sans ${isOpen ? 'z-[9999]' : 'z-10'}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#F4F3F8] hover:bg-[#E8E7EF] border border-[#E8E7EF] hover:border-[#0F172A] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#11112A] transition flex items-center justify-between gap-2 cursor-pointer focus:outline-none focus:border-[#0F172A] focus:bg-white shadow-2xs"
      >
        <span className="truncate">{selectedItem.label}</span>
        <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180 text-[#0F172A]' : ''}`} />
      </button>

      {/* Floating Popover Menu */}
      {isOpen && (
        <div className="absolute z-[9999] top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl p-1 space-y-0.5 animate-fade-in max-h-60 overflow-y-auto">
          {CATEGORY_ITEMS.map((item) => {
            const isSelected = item.value === value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  onChange(item.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F172A] text-white'
                    : 'text-[#0F172A] hover:bg-[#F1F5F9]'
                }`}
              >
                <span>{item.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
