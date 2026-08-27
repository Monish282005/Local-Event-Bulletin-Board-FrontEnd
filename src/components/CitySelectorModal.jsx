import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { POPULAR_CITIES, detectUserCity } from '../utils/locationHelper';
import Swal from 'sweetalert2';

export default function CitySelectorModal({ isOpen, onClose, selectedCity, onSelectCity }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [detecting, setDetecting] = useState(false);

  if (!isOpen) return null;

  const filteredCities = POPULAR_CITIES.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    item.state.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleDetectLocation = async () => {
    setDetecting(true);
    try {
      const city = await detectUserCity();
      onSelectCity(city);
      onClose();
      Swal.fire({
        title: 'Location Detected! 📍',
        text: `Showing events for ${city}`,
        icon: 'success',
        timer: 1800,
        showConfirmButton: false,
        customClass: { popup: 'rounded-3xl p-4 font-sans text-xs' },
      });
    } catch (err) {
      console.error('Failed to detect location:', err);
    } finally {
      setDetecting(false);
    }
  };

  const handleCustomCitySubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSelectCity(searchQuery.trim());
      onClose();
      setSearchQuery('');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#E8E7EF] max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#F4F3F8] hover:bg-[#E8E7EF] text-[#68677A] font-bold text-sm flex items-center justify-center transition cursor-pointer"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] text-xs font-bold mb-2">
            <span>Location Selector</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#11112A] tracking-tight">
            Select Your City
          </h2>
          <p className="text-[#68677A] text-xs sm:text-sm font-medium mt-1">
            Choose your city to discover top picks, events, and community gatherings nearby.
          </p>
        </div>

        {/* Detect My Location Button & Search Bar */}
        <div className="space-y-4 mb-8">
          <button
            onClick={handleDetectLocation}
            disabled={detecting}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#0F172A] hover:bg-[#1E293B] active:scale-[0.99] text-white font-bold text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <span>{detecting ? '⏳' : '🎯'}</span>
            <span>{detecting ? 'Detecting your current location...' : 'Detect My Location (GPS / IP)'}</span>
          </button>

          <form onSubmit={handleCustomCitySubmit} className="relative">
            <input
              type="text"
              placeholder="Search for your city (e.g. Coimbatore, Bengaluru, Mumbai)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-24 py-3.5 rounded-2xl bg-[#F4F3F8] border border-[#E8E7EF] text-[#11112A] text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#0F172A] focus:bg-white transition"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#68677A] text-base">🔍</span>
            {searchQuery.trim() && (
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl bg-[#5B4BFF] text-white text-xs font-bold hover:bg-[#4C3CE6] transition cursor-pointer"
              >
                Select
              </button>
            )}
          </form>
        </div>

        {/* Popular Cities Grid */}
        <div>
          <h3 className="text-xs font-extrabold text-[#68677A] uppercase tracking-wider mb-4">
            Popular Cities
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-1">
            {filteredCities.map((c) => {
              const isSelected = selectedCity?.toLowerCase() === c.name.toLowerCase();
              return (
                <button
                  key={c.name}
                  onClick={() => {
                    onSelectCity(c.name);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${isSelected
                    ? 'bg-[#F1EEFF] border-[#5B4BFF] text-[#5B4BFF] font-bold shadow-xs'
                    : 'bg-white hover:bg-[#F4F3F8] border-[#E8E7EF] text-[#11112A] font-semibold'
                    }`}
                >
                  <span className="text-xl">{c.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs truncate">{c.name}</div>
                    <div className="text-[10px] text-[#68677A] font-medium truncate">{c.state}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
