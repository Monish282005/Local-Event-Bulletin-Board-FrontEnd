import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, MapPin, Phone, Mail, Calendar, Ticket, Zap, CheckCircle2, Save, LogOut, ShieldCheck } from 'lucide-react';
import PhoneInputWithCountry from '../components/PhoneInputWithCountry';
import Navbar from '../components/Navbar';
import CitySelectorModal from '../components/CitySelectorModal';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import {
  getCountries,
  getStates,
  getDistricts,
} from '../data/locationData';

export default function ProfilePage() {
  const { user, logout, updateProfile } = useAuth();

  // Profile Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');

  // Dashboard Stats States
  const [hostedEventsCount, setHostedEventsCount] = useState(0);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [totalTicketsBooked, setTotalTicketsBooked] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  // Status & Feedback States
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [selectedCity, setSelectedCity] = useState(localStorage.getItem('selectedCity') || 'Coimbatore');
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);

  // Location Dropdown Options
  const countryOptions = getCountries();
  const stateOptions = getStates(country);
  const districtOptions = getDistricts(country, state);
  const cityOptions = getDistricts(country, state);

  // Load User Data & Stats
  const fetchUserData = async () => {
    setLoadingData(true);
    try {
      if (user) {
        setName(user.name || '');
        setPhone(user.phone || '');
        setCountry(user.country || 'India');
        setState(user.state || 'Karnataka');
        setDistrict(user.district || 'Bengaluru Urban');
        setCity(user.city || 'Bengaluru');
      }

      // Fetch Stats
      const [hostedRes, bookingsRes] = await Promise.allSettled([
        axiosClient.get('/api/events/my-events'),
        axiosClient.get('/api/events/my-bookings'),
      ]);

      if (hostedRes.status === 'fulfilled' && hostedRes.value.data) {
        const eventsList = hostedRes.value.data.events || hostedRes.value.data || [];
        setHostedEventsCount(eventsList.length);
      }

      if (bookingsRes.status === 'fulfilled' && bookingsRes.value.data) {
        const bookingsList = bookingsRes.value.data.bookings || bookingsRes.value.data || [];
        setBookingsCount(bookingsList.length);
        const totalPasses = bookingsList.reduce((sum, b) => sum + (b.total_user_tickets || 1), 0);
        setTotalTicketsBooked(totalPasses);
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  // Handle Save Profile & Location Settings
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    try {
      const response = await axiosClient.put('/api/auth/me', {
        name,
        phone,
        country,
        state,
        district,
        city,
      });

      if (response.data && response.data.user) {
        updateProfile(response.data.user);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Save profile error:', err);
      setSaveError(err.response?.data?.error || 'Failed to update profile settings.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen text-[#0F0F14] flex flex-col font-sans">
      <Navbar
        onCreateClick={() => {}}
        selectedCity={selectedCity}
        onOpenCitySelector={() => setIsCityModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 flex-1 w-full">
        {/* Profile Header Banner */}
        <div className="bg-white border border-[#E8E7EF] rounded-3xl p-6 sm:p-8 shadow-xs mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#0F0F14] text-white flex items-center justify-center text-2xl sm:text-3xl font-black shadow-md">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-[#0F0F14] tracking-tight">{user?.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Member
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#68677A] font-semibold">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#68677A]" /> {user?.email}
                </span>
                {user?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#68677A]" /> {user?.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#68677A]" /> {city}, {state}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#68677A]" /> Joined {formatDate(user?.created_at || new Date()).split(',')[0]}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="px-5 py-2.5 rounded-full bg-[#F4F3F8] hover:bg-red-50 text-[#0F0F14] hover:text-red-600 border border-[#E8E7EF] font-bold text-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>

        {/* Dashboard Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-[#E8E7EF] p-6 rounded-3xl shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase text-[#68677A] tracking-wider">Hosted Events</span>
              <span className="w-8 h-8 rounded-xl bg-[#0F0F14] text-white flex items-center justify-center text-sm font-bold">
                <Calendar className="w-4 h-4 text-white" />
              </span>
            </div>
            <div className="text-3xl font-black text-[#0F0F14] mb-1">{hostedEventsCount}</div>
            <p className="text-[11px] text-[#68677A] font-bold">Active events posted by you</p>
          </div>

          <div className="bg-white border border-[#E8E7EF] p-6 rounded-3xl shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase text-[#68677A] tracking-wider">My Bookings</span>
              <span className="w-8 h-8 rounded-xl bg-[#0F0F14] text-white flex items-center justify-center text-sm font-bold">
                <Ticket className="w-4 h-4 text-white" />
              </span>
            </div>
            <div className="text-3xl font-black text-[#0F0F14] mb-1">{bookingsCount}</div>
            <p className="text-[11px] text-[#68677A] font-bold">Event reservations claimed</p>
          </div>

          <div className="bg-white border border-[#E8E7EF] p-6 rounded-3xl shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase text-[#68677A] tracking-wider">Total Tickets</span>
              <span className="w-8 h-8 rounded-xl bg-[#0F0F14] text-white flex items-center justify-center text-sm font-bold">
                <Zap className="w-4 h-4 text-white" />
              </span>
            </div>
            <div className="text-3xl font-black text-emerald-600 mb-1">{totalTicketsBooked}</div>
            <p className="text-[11px] text-[#68677A] font-bold">Total passes across all bookings</p>
          </div>
        </div>

        {/* Section Title */}
        <div className="border-b border-[#E8E7EF] pb-4 mb-8">
          <h3 className="text-xl font-black text-[#0F0F14] flex items-center gap-2">
            <User className="w-5 h-5 text-[#0F0F14]" />
            <span>Profile & Location Settings</span>
          </h3>
        </div>

        {/* Profile & Location Settings Form */}
        <div className="bg-white border border-[#E8E7EF] rounded-3xl p-6 sm:p-8 shadow-xs max-w-3xl">
          <h3 className="text-xl font-black text-[#0F0F14] mb-1">Personal Details & Home Location</h3>
          <p className="text-xs text-[#68677A] font-bold mb-6">
            Update your mobile phone number and home location to personalize your local event discovery feed.
          </p>

          {saveSuccess && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Profile details updated successfully!</span>
            </div>
          )}

          {saveError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold">
              {saveError}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#0F0F14] mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#FAF9FC] border border-[#E8E7EF] rounded-full px-4 py-3 text-sm font-bold text-[#0F0F14] focus:bg-white focus:outline-none focus:border-[#0F0F14] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F0F14] mb-2">Mobile Phone Number *</label>
                <PhoneInputWithCountry
                  value={phone}
                  onChange={(fullVal) => setPhone(fullVal)}
                  selectedCountryName={country}
                  placeholder="Enter mobile phone number"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F0F14] mb-2">Email Address (Account ID)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-full px-4 py-3 text-sm font-bold text-[#68677A] cursor-not-allowed"
              />
            </div>

            <hr className="border-[#F0EFF6] my-6" />

            <div>
              <h4 className="text-sm font-black text-[#0F0F14] mb-1">Home Location Preference</h4>
              <p className="text-xs text-[#68677A] font-bold mb-4">
                Select your home country, state, district, and city to align your top picks feed.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Country */}
                <div>
                  <label className="block text-xs font-bold text-[#0F0F14] mb-1.5">Country *</label>
                  <select
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      setState('');
                      setDistrict('');
                      setCity('');
                    }}
                    className="w-full bg-[#FAF9FC] border border-[#E8E7EF] rounded-full px-4 py-2.5 text-xs font-bold text-[#0F0F14] focus:bg-white focus:outline-none focus:border-[#0F0F14]"
                  >
                    <option value="">Select Country</option>
                    {countryOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* State */}
                <div>
                  <label className="block text-xs font-bold text-[#0F0F14] mb-1.5">State *</label>
                  <select
                    value={state}
                    disabled={!country}
                    onChange={(e) => {
                      setState(e.target.value);
                      setDistrict('');
                      setCity('');
                    }}
                    className="w-full bg-[#FAF9FC] border border-[#E8E7EF] rounded-full px-4 py-2.5 text-xs font-bold text-[#0F0F14] focus:bg-white focus:outline-none focus:border-[#0F0F14] disabled:opacity-50"
                  >
                    <option value="">Select State</option>
                    {stateOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className="block text-xs font-bold text-[#0F0F14] mb-1.5">District *</label>
                  <select
                    value={district}
                    disabled={!state}
                    onChange={(e) => {
                      setDistrict(e.target.value);
                      setCity('');
                    }}
                    className="w-full bg-[#FAF9FC] border border-[#E8E7EF] rounded-full px-4 py-2.5 text-xs font-bold text-[#0F0F14] focus:bg-white focus:outline-none focus:border-[#0F0F14] disabled:opacity-50"
                  >
                    <option value="">Select District</option>
                    {districtOptions.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-bold text-[#0F0F14] mb-1.5">City *</label>
                  <select
                    value={city}
                    disabled={!district}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-[#FAF9FC] border border-[#E8E7EF] rounded-full px-4 py-2.5 text-xs font-bold text-[#0F0F14] focus:bg-white focus:outline-none focus:border-[#0F0F14] disabled:opacity-50"
                  >
                    <option value="">Select City</option>
                    {cityOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-full bg-[#0F0F14] hover:bg-black text-white font-extrabold text-xs transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <span>Saving Changes...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* City Selector Modal */}
      <CitySelectorModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        selectedCity={selectedCity}
        onSelectCity={(c) => {
          setSelectedCity(c);
          localStorage.setItem('selectedCity', c);
        }}
      />

      <footer className="border-t border-[#E8E7EF] py-8 text-center text-[#68677A] text-xs font-medium mt-16">
        <p>© 2026 Local Event Bulletin Board. User Profile & Account Settings Dashboard.</p>
      </footer>
    </div>
  );
}
