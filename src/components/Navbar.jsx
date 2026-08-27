import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { MapPin, LayoutDashboard, Calendar, Ticket, Plus, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onCreateClick, selectedCity, onOpenCitySelector }) {
  const { user, isAuthenticated, logout, setIsAuthModalOpen } = useAuth();

  return (
    <header className="sticky top-0 z-40 py-3 px-3 sm:px-6 max-w-7xl mx-auto">
      <div className="bg-white border border-[#E8E7EF] rounded-full px-4 py-2.5 shadow-xl shadow-slate-900/10 flex items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full bg-[#0F0F14] text-white flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-sm font-black text-[#0F0F14] tracking-tight hover:text-black transition leading-none whitespace-nowrap">
                LOCAL BULLETIN
              </h1>
              <span className="text-[9px] font-extrabold text-[#68677A] uppercase tracking-widest leading-none block mt-0.5 whitespace-nowrap">
                Event Platform
              </span>
            </div>
          </Link>

          {/* Location Selector Pill */}
          {onOpenCitySelector && (
            <button
              onClick={onOpenCitySelector}
              className="px-3.5 py-1.5 rounded-full bg-[#F4F3F8] hover:bg-[#EAE8F5] border border-[#E8E7EF] text-[#0F0F14] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs group whitespace-nowrap"
              title="Click to select your city or detect location"
            >
              <MapPin className="w-3.5 h-3.5 text-[#0F0F14] group-hover:scale-110 transition-transform" />
              <span className="max-w-[110px] sm:max-w-[160px] truncate">{selectedCity || 'Coimbatore'}</span>
              <ChevronDown className="w-3 h-3 text-[#68677A] group-hover:text-[#0F0F14] transition" />
            </button>
          )}
        </div>

        {/* Black Nav Capsule Container */}
        <div className="bg-[#0F0F14] p-1 rounded-full text-white shadow-xl border border-white/10 flex items-center gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? 'bg-white text-[#0F0F14] shadow-md font-extrabold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </NavLink>

          {isAuthenticated && (
            <>
              <NavLink
                to="/my-events"
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-[#0F0F14] shadow-md font-extrabold'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden md:inline">My Events</span>
              </NavLink>

              <NavLink
                to="/my-bookings"
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-[#0F0F14] shadow-md font-extrabold'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <Ticket className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Orders</span>
              </NavLink>
            </>
          )}

          {/* Post Event Action inside Capsule */}
          <button
            onClick={onCreateClick}
            className="px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-extrabold text-xs transition flex items-center gap-1 cursor-pointer whitespace-nowrap border border-white/15"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Post Event</span>
          </button>
        </div>

        {/* Right Side User Avatar & Auth */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5">
              <Link
                to="/profile"
                className="flex items-center gap-2 bg-[#F4F3F8] hover:bg-[#EAE8F5] border border-[#E8E7EF] rounded-full pl-2 pr-3 py-1 transition cursor-pointer group whitespace-nowrap"
                title="View Profile Dashboard"
              >
                <div className="w-6 h-6 rounded-full bg-[#0F0F14] text-white flex items-center justify-center text-xs font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                </div>
                <span className="text-xs font-bold text-[#0F0F14] group-hover:text-black transition hidden sm:inline max-w-[100px] truncate">
                  {user?.name}
                </span>
              </Link>

              <button
                onClick={logout}
                className="w-7 h-7 rounded-full bg-[#F4F3F8] hover:bg-red-100 text-red-600 hover:text-red-700 flex items-center justify-center transition border border-[#E8E7EF] cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 rounded-full bg-[#0F0F14] hover:bg-black text-white font-bold text-xs transition shadow-md cursor-pointer whitespace-nowrap"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
