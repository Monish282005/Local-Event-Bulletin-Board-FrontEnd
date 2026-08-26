import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onCreateClick }) {
  const { user, isAuthenticated, logout, setIsAuthModalOpen } = useAuth();

  return (
    <header className="border-b border-[#E8E7EF] bg-white/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-[#5B4BFF] text-white flex items-center justify-center font-black text-xl shadow-md shadow-[#5B4BFF]/30 group-hover:scale-105 transition-transform duration-200">
            📍
          </div>
          <div>
            <h1 className="text-lg font-black text-[#11112A] tracking-tight group-hover:text-[#5B4BFF] transition leading-none">
              LOCAL COMMUNITY
            </h1>
            <span className="text-[10px] font-bold text-[#68677A] uppercase tracking-wider leading-tight">
              Event Bulletin Board
            </span>
          </div>
        </Link>

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
                <span>My Bookings</span>
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
                <span>My Events</span>
              </NavLink>
            </>
          )}

          <button
            onClick={onCreateClick}
            className="px-4 py-2 rounded-full bg-[#5B4BFF] hover:bg-[#4C3CE6] active:bg-[#3F2FD1] text-white font-semibold text-xs sm:text-sm transition shadow-md shadow-[#5B4BFF]/20 flex items-center gap-2 cursor-pointer"
          >
            <span>+</span>
            <span>Post Event</span>
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-3 bg-[#F4F3F8] border border-[#E8E7EF] rounded-full pl-3 pr-1.5 py-1">
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-[#11112A] leading-none">{user?.name}</div>
                <div className="text-[10px] text-[#68677A] font-medium leading-tight">
                  {user?.city ? `📍 ${user.city}` : 'Member'}
                </div>
              </div>
              <button
                onClick={logout}
                className="px-3 py-1 rounded-full bg-white hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-bold transition border border-[#E8E7EF] cursor-pointer"
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
