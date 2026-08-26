import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onCreateClick, selectedCity, onOpenCitySelector }) {
  const { user, isAuthenticated, logout, setIsAuthModalOpen } = useAuth();

  return (
    <header className="border-b border-[#E8E7EF] bg-white/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2">
        {/* Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-[#5B4BFF] text-white flex items-center justify-center font-black text-xl shadow-md shadow-[#5B4BFF]/30 group-hover:scale-105 transition-transform duration-200">
            📍
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-black text-[#11112A] tracking-tight group-hover:text-[#5B4BFF] transition leading-none">
              LOCAL COMMUNITY
            </h1>
            <span className="text-[10px] font-bold text-[#68677A] uppercase tracking-wider leading-tight">
              Event Bulletin Board
            </span>
          </div>
        </Link>

        {/* BookMyShow Style Location / City Selector Button */}
        {onOpenCitySelector && (
          <button
            onClick={onOpenCitySelector}
            className="px-3.5 py-2 rounded-full bg-[#F4F3F8] hover:bg-[#EAE8F5] border border-[#E8E7EF] hover:border-[#5B4BFF] text-[#11112A] text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs group"
            title="Click to select your city or detect location"
          >
            <span className="text-[#5B4BFF] text-base group-hover:scale-110 transition-transform">📍</span>
            <span className="max-w-[130px] sm:max-w-[180px] truncate">{selectedCity || 'Coimbatore'}</span>
            <span className="text-[10px] text-[#68677A] group-hover:text-[#5B4BFF] transition">▼</span>
          </button>
        )}

        {/* Navigation & User Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated && (
            <>
              <NavLink
                to="/my-bookings"
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-full font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 border ${
                    isActive
                      ? 'bg-[#F1EEFF] text-[#5B4BFF] border-[#5B4BFF]'
                      : 'bg-white text-[#68677A] hover:text-[#11112A] border-[#E8E7EF] hover:bg-[#F4F3F8]'
                  }`
                }
              >
                <span>🎟️</span>
                <span className="hidden md:inline">My Bookings</span>
              </NavLink>

              <NavLink
                to="/my-events"
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-full font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 border ${
                    isActive
                      ? 'bg-[#F1EEFF] text-[#5B4BFF] border-[#5B4BFF]'
                      : 'bg-white text-[#68677A] hover:text-[#11112A] border-[#E8E7EF] hover:bg-[#F4F3F8]'
                  }`
                }
              >
                <span>📅</span>
                <span className="hidden md:inline">My Events</span>
              </NavLink>
            </>
          )}

          <button
            onClick={onCreateClick}
            className="px-4 py-2 rounded-full bg-[#5B4BFF] hover:bg-[#4C3CE6] active:bg-[#3F2FD1] text-white font-semibold text-xs sm:text-sm transition shadow-md shadow-[#5B4BFF]/20 flex items-center gap-1.5 cursor-pointer"
          >
            <span>+</span>
            <span className="hidden sm:inline">Post Event</span>
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2 bg-[#F4F3F8] hover:bg-[#EAE8F5] border border-[#E8E7EF] hover:border-[#5B4BFF] rounded-full pl-3 pr-3 py-1.5 transition cursor-pointer group"
                title="View Profile Dashboard"
              >
                <div className="w-6 h-6 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-xs font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-bold text-[#11112A] group-hover:text-[#5B4BFF] transition hidden sm:inline">
                  {user?.name}
                </span>
              </Link>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-full bg-white hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-bold transition border border-[#E8E7EF] cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 rounded-full bg-[#F4F3F8] hover:bg-[#E8E7EF] text-[#11112A] font-semibold text-xs sm:text-sm transition border border-[#E8E7EF] cursor-pointer"
            >
              Log In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
