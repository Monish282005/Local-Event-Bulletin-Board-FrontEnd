import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { MapPin, LayoutDashboard, Calendar, Ticket, Plus, User, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onCreateClick, selectedCity, onOpenCitySelector }) {
  const { user, isAuthenticated, logout, setIsAuthModalOpen } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="relative sm:sticky sm:top-0 z-40 py-2.5 px-3 sm:px-6 max-w-7xl mx-auto font-sans">
      <div className="bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-full px-3.5 sm:px-5 py-2 shadow-md flex items-center justify-between gap-2 sm:gap-4">

        {/* Left Side: Brand Logo & City Selector */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div className="hidden lg:block">
              <h1 className="text-xs sm:text-sm font-black text-[#0F172A] tracking-tight leading-none whitespace-nowrap">
                LOCAL BULLETIN
              </h1>
              <span className="text-[8.5px] font-extrabold text-[#64748B] uppercase tracking-widest leading-none block mt-0.5 whitespace-nowrap">
                Event Platform
              </span>
            </div>
          </Link>

          {/* Location Selector Pill */}
          {onOpenCitySelector && (
            <button
              onClick={onOpenCitySelector}
              className="px-3 py-1.5 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[#0F172A] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs group whitespace-nowrap max-w-[140px] sm:max-w-[180px]"
              title="Click to select your city or detect location"
            >
              <MapPin className="w-3.5 h-3.5 text-[#0F172A] group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="truncate max-w-[80px] sm:max-w-[120px]">{selectedCity || 'Coimbatore'}</span>
              <ChevronDown className="w-3 h-3 text-[#64748B] group-hover:text-[#0F172A] transition flex-shrink-0" />
            </button>
          )}
        </div>

        {/* Center: Desktop Segmented Capsule Navigation (Hidden on Mobile < md) */}
        <div className="hidden md:flex bg-[#F1F5F9] p-1 rounded-full border border-[#E2E8F0] items-center gap-1 flex-shrink-0">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${isActive
                ? 'bg-[#0F172A] text-white shadow-md font-extrabold'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/80'
              }`
            }
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </NavLink>

          {isAuthenticated && (
            <>

              <NavLink
                to="/my-bookings"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${isActive
                    ? 'bg-[#0F172A] text-white shadow-md font-extrabold'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/80'
                  }`
                }
              >
                <Ticket className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Booking</span>
              </NavLink>
            </>
          )}

          <NavLink
            to="/my-events"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${isActive
                ? 'bg-[#0F172A] text-white shadow-md font-extrabold'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/80'
              }`
            }
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">My Events</span>
          </NavLink>

          {/* Post Event Button */}
          <button
            onClick={onCreateClick}
            className="px-3 py-1.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-extrabold text-xs transition flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Post Event</span>
          </button>
        </div>

        {/* Right Side Actions: Profile & Auth & Mobile Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5">
              {/* Post Event Quick Button for Mobile/Tablet */}
              <button
                onClick={onCreateClick}
                className="md:hidden p-2 rounded-full bg-[#0F172A] text-white transition cursor-pointer shadow-md flex items-center justify-center"
                title="Post a new event"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
              </button>

              <Link
                to="/profile"
                className="flex items-center gap-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] rounded-full p-1 sm:pl-2 sm:pr-3 transition cursor-pointer group whitespace-nowrap"
                title="View Profile Dashboard"
              >
                <div className="w-6 h-6 rounded-full bg-[#0F172A] text-white flex items-center justify-center text-xs font-bold shadow-xs flex-shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                </div>
                <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition hidden xl:inline max-w-[90px] truncate">
                  {user?.name}
                </span>
              </Link>

              <button
                onClick={logout}
                className="w-7 h-7 rounded-full bg-[#F1F5F9] hover:bg-red-50 text-red-600 flex items-center justify-center transition border border-[#E2E8F0] cursor-pointer hidden sm:flex"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs transition shadow-md cursor-pointer whitespace-nowrap"
            >
              Sign In
            </button>
          )}

          {/* Mobile Hamburger Menu Toggle (< md) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-8 h-8 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] flex items-center justify-center cursor-pointer transition hover:bg-[#E2E8F0]"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-3xl p-4 shadow-xl flex flex-col gap-2 font-sans">
          <NavLink
            to="/"
            end
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2.5 ${isActive ? 'bg-[#0F172A] text-white font-extrabold shadow-sm' : 'text-[#0F172A] hover:bg-[#F1F5F9]'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Feed</span>
          </NavLink>

          {isAuthenticated && (
            <>
              <NavLink
                to="/my-events"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2.5 ${isActive ? 'bg-[#0F172A] text-white font-extrabold shadow-sm' : 'text-[#0F172A] hover:bg-[#F1F5F9]'
                  }`
                }
              >
                <Calendar className="w-4 h-4" />
                <span>My Hosted Events</span>
              </NavLink>

              <NavLink
                to="/my-bookings"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2.5 ${isActive ? 'bg-[#0F172A] text-white font-extrabold shadow-sm' : 'text-[#0F172A] hover:bg-[#F1F5F9]'
                  }`
                }
              >
                <Ticket className="w-4 h-4" />
                <span>My Orders & Ticket Passes</span>
              </NavLink>

              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold text-[#0F172A] hover:bg-[#F1F5F9] transition flex items-center gap-2.5"
              >
                <User className="w-4 h-4 text-[#0F172A]" />
                <span>Profile Settings ({user?.name})</span>
              </Link>
            </>
          )}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onCreateClick();
            }}
            className="w-full mt-1 px-4 py-2.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post a New Event</span>
          </button>

          {isAuthenticated && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full mt-1 px-4 py-2 rounded-full bg-red-50 text-red-600 font-bold text-xs transition border border-red-200 flex items-center justify-center gap-2 cursor-pointer hover:bg-red-100"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout Account</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
