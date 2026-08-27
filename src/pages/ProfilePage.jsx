import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';
import AttendeesModal from '../components/AttendeesModal';
import EditEventModal from '../components/EditEventModal';
import EventCard from '../components/EventCard';
import CitySelectorModal from '../components/CitySelectorModal';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import {
  fetchCountriesFromApi,
  fetchStatesFromApi,
  fetchCitiesFromApi,
} from '../data/locationData';
import { validatePhoneNumber, validateName } from '../utils/validationHelper';

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export default function ProfilePage() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'events' | 'bookings'
  const [selectedCity, setSelectedCity] = useState(
    localStorage.getItem('selectedCity') || user?.city || 'Coimbatore'
  );
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [country, setCountry] = useState(user?.country || 'India');
  const [state, setState] = useState(user?.state || 'Karnataka');
  const [district, setDistrict] = useState(user?.district || 'Bengaluru Urban');
  const [city, setCity] = useState(user?.city || 'Bengaluru');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Location Options for Settings Form
  const [countryOptions, setCountryOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);

  // Data for Hosted Events & Bookings
  const [hostedEvents, setHostedEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modals for Events Tab
  const [selectedAttendeesEventId, setSelectedAttendeesEventId] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  // Sync user state to form
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setCountry(user.country || 'India');
      setState(user.state || 'Karnataka');
      setDistrict(user.district || 'Bengaluru Urban');
      setCity(user.city || 'Bengaluru');
    }
  }, [user]);

  // Load Location Cascading Options
  useEffect(() => {
    fetchCountriesFromApi().then((res) => {
      if (res && res.length) setCountryOptions(res);
    });
  }, []);

  useEffect(() => {
    if (country) {
      fetchStatesFromApi(country).then((res) => setStateOptions(res || []));
    } else {
      setStateOptions([]);
    }
  }, [country]);

  useEffect(() => {
    if (country && state) {
      fetchCitiesFromApi(country, state).then((res) => setDistrictOptions(res || []));
    } else {
      setDistrictOptions([]);
    }
  }, [country, state]);

  // Load User Data (Events & Bookings)
  const fetchUserData = async () => {
    setLoadingData(true);
    try {
      const [eventsRes, bookingsRes] = await Promise.all([
        axiosClient.get('/api/events/my-events?limit=50'),
        axiosClient.get('/api/events/my-bookings?limit=50'),
      ]);

      setHostedEvents(eventsRes.data.events || []);
      setBookings(bookingsRes.data.bookings || []);
    } catch (err) {
      console.error('Failed to load profile dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Save Profile Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    if (!validateName(name)) {
      setSaveError('Full Name is required (minimum 2 characters).');
      setSaving(false);
      return;
    }

    if (phone && !validatePhoneNumber(phone)) {
      setSaveError('Please enter a valid 10-digit to 15-digit mobile phone number (e.g. +91 9876543210).');
      setSaving(false);
      return;
    }

    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        country: country.trim(),
        state: state.trim(),
        district: district.trim(),
        city: city.trim(),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);

      // Update localStorage city if updated
      if (city) {
        setSelectedCity(city);
        localStorage.setItem('selectedCity', city);
      }

      Swal.fire({
        title: 'Profile Updated! 🎉',
        text: 'Your personal details and home location have been saved.',
        icon: 'success',
        confirmButtonColor: '#5B4BFF',
        customClass: {
          popup: 'rounded-3xl p-6 font-sans',
          confirmButton: 'px-6 py-2.5 rounded-full text-xs font-bold shadow-md shadow-[#5B4BFF]/25',
        },
      });
    } catch (err) {
      console.error('Failed to update profile:', err);
      setSaveError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // Cancel Booking Handler
  const handleCancelBooking = async (eventId, title, qty) => {
    const result = await Swal.fire({
      title: 'Cancel Booking?',
      text: `Are you sure you want to cancel your ${qty} ticket(s) for "${title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#68677A',
      confirmButtonText: 'Yes, Cancel Tickets',
      cancelButtonText: 'Keep Tickets',
      customClass: {
        popup: 'rounded-3xl p-6 font-sans',
        confirmButton: 'px-5 py-2.5 rounded-full text-xs font-bold shadow-md',
        cancelButton: 'px-5 py-2.5 rounded-full text-xs font-bold',
      },
    });

    if (!result.isConfirmed) return;

    try {
      await axiosClient.delete(`/api/events/${eventId}/rsvp`);
      Swal.fire({
        title: 'Booking Cancelled',
        text: 'Your tickets have been cancelled and capacity restored.',
        icon: 'success',
        confirmButtonColor: '#5B4BFF',
      });
      fetchUserData();
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: err.response?.data?.error || 'Failed to cancel booking.',
        icon: 'error',
      });
    }
  };

  const totalTicketsBooked = bookings.reduce((sum, b) => sum + (b.total_user_tickets || 0), 0);

  return (
    <div className="min-h-screen bg-[#FAF9FC] text-[#11112A] flex flex-col font-sans">
      <Navbar
        selectedCity={selectedCity}
        onOpenCitySelector={() => setIsCityModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Profile Hero Card */}
        <div className="bg-white border border-[#E8E7EF] rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Gradient Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-[#5B4BFF] via-[#7B61FF] to-[#9E8BFF] text-white flex items-center justify-center text-2xl sm:text-3xl font-black shadow-lg shadow-[#5B4BFF]/25 flex-shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#11112A] tracking-tight">
                    {user?.name || 'Member Profile'}
                  </h1>
                  <span className="px-3 py-0.5 rounded-full bg-[#F1EEFF] text-[#5B4BFF] text-xs font-bold border border-[#E0D9FF]">
                    Verified Member
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#68677A] font-medium">
                  <span className="flex items-center gap-1">✉️ {user?.email}</span>
                  <span className="flex items-center gap-1 font-semibold text-[#5B4BFF]">
                    📞 {user?.phone || 'No Phone Added'}
                  </span>
                  <span className="flex items-center gap-1">
                    📍 {user?.city || 'Bengaluru'}, {user?.state || 'Karnataka'}
                  </span>
                  <span className="flex items-center gap-1 text-[#9291A0]">
                    📅 Joined {formatDate(user?.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="px-5 py-2.5 rounded-full bg-[#F4F3F8] hover:bg-red-50 text-[#68677A] hover:text-red-600 text-xs font-bold transition border border-[#E8E7EF] flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Executive Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div
            onClick={() => setActiveTab('events')}
            className={`bg-white border p-6 rounded-3xl shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-1 ${
              activeTab === 'events' ? 'border-[#5B4BFF] ring-2 ring-[#5B4BFF]/10' : 'border-[#E8E7EF]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase text-[#68677A] tracking-wider">Hosted Events</span>
              <span className="w-8 h-8 rounded-xl bg-[#F1EEFF] text-[#5B4BFF] flex items-center justify-center text-sm font-bold">
                📅
              </span>
            </div>
            <div className="text-3xl font-black text-[#11112A] mb-1">{hostedEvents.length}</div>
            <p className="text-[11px] text-[#68677A] font-medium">Active events posted by you</p>
          </div>

          <div
            onClick={() => setActiveTab('bookings')}
            className={`bg-white border p-6 rounded-3xl shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-1 ${
              activeTab === 'bookings' ? 'border-[#5B4BFF] ring-2 ring-[#5B4BFF]/10' : 'border-[#E8E7EF]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase text-[#68677A] tracking-wider">My Bookings</span>
              <span className="w-8 h-8 rounded-xl bg-[#F1EEFF] text-[#5B4BFF] flex items-center justify-center text-sm font-bold">
                🎟️
              </span>
            </div>
            <div className="text-3xl font-black text-[#11112A] mb-1">{bookings.length}</div>
            <p className="text-[11px] text-[#68677A] font-medium">Event reservations claimed</p>
          </div>

          <div className="bg-white border border-[#E8E7EF] p-6 rounded-3xl shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase text-[#68677A] tracking-wider">Total Tickets</span>
              <span className="w-8 h-8 rounded-xl bg-[#10B981]/10 text-[#10B981] flex items-center justify-center text-sm font-bold">
                ⚡
              </span>
            </div>
            <div className="text-3xl font-black text-[#10B981] mb-1">{totalTicketsBooked}</div>
            <p className="text-[11px] text-[#68677A] font-medium">Total passes across all bookings</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#E8E7EF] pb-4 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm transition flex items-center gap-2 border cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#5B4BFF] text-white border-[#5B4BFF] shadow-md shadow-[#5B4BFF]/20'
                : 'bg-white text-[#68677A] hover:text-[#11112A] border-[#E8E7EF] hover:bg-[#F4F3F8]'
            }`}
          >
            <span>⚙️</span>
            <span>Profile & Location Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm transition flex items-center gap-2 border cursor-pointer ${
              activeTab === 'events'
                ? 'bg-[#5B4BFF] text-white border-[#5B4BFF] shadow-md shadow-[#5B4BFF]/20'
                : 'bg-white text-[#68677A] hover:text-[#11112A] border-[#E8E7EF] hover:bg-[#F4F3F8]'
            }`}
          >
            <span>📅</span>
            <span>My Hosted Events ({hostedEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm transition flex items-center gap-2 border cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-[#5B4BFF] text-white border-[#5B4BFF] shadow-md shadow-[#5B4BFF]/20'
                : 'bg-white text-[#68677A] hover:text-[#11112A] border-[#E8E7EF] hover:bg-[#F4F3F8]'
            }`}
          >
            <span>🎟️</span>
            <span>My Ticket Bookings ({bookings.length})</span>
          </button>
        </div>

        {/* Tab Content 1: Profile & Location Settings Form */}
        {activeTab === 'settings' && (
          <div className="bg-white border border-[#E8E7EF] rounded-3xl p-6 sm:p-8 shadow-xs max-w-3xl">
            <h3 className="text-xl font-extrabold text-[#11112A] mb-1">Personal Details & Home Location</h3>
            <p className="text-xs text-[#68677A] mb-6">
              Update your mobile phone number and home location to personalize your local event discovery feed.
            </p>

            {saveSuccess && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <span>✅</span>
                <span>Profile details updated successfully!</span>
              </div>
            )}

            {saveError && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                {saveError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[#11112A] mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#FAF9FC] border border-[#E8E7EF] rounded-xl px-4 py-3 text-sm text-[#11112A] focus:bg-white focus:outline-none focus:border-[#5B4BFF] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#11112A] mb-2">Mobile Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#FAF9FC] border border-[#E8E7EF] rounded-xl px-4 py-3 text-sm text-[#11112A] focus:bg-white focus:outline-none focus:border-[#5B4BFF] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#11112A] mb-2">Email Address (Account ID)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-4 py-3 text-sm text-[#68677A] cursor-not-allowed"
                />
              </div>

              <hr className="border-[#F0EFF6] my-6" />

              <div>
                <h4 className="text-sm font-bold text-[#11112A] mb-1">Home Location Preference</h4>
                <p className="text-xs text-[#68677A] mb-4">
                  Select your home country, state, district, and city to align your top picks feed.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Country */}
                  <div>
                    <label className="block text-xs font-semibold text-[#11112A] mb-1.5">Country *</label>
                    <select
                      value={country}
                      onChange={(e) => {
                        setCountry(e.target.value);
                        setState('');
                        setDistrict('');
                        setCity('');
                      }}
                      className="w-full bg-[#FAF9FC] border border-[#E8E7EF] rounded-xl px-4 py-2.5 text-xs text-[#11112A] focus:bg-white focus:outline-none focus:border-[#5B4BFF]"
                    >
                      <option value="">Select Country</option>
                      {countryOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-xs font-semibold text-[#11112A] mb-1.5">State *</label>
                    <select
                      value={state}
                      disabled={!country}
                      onChange={(e) => {
                        setState(e.target.value);
                        setDistrict('');
                        setCity('');
                      }}
                      className="w-full bg-[#FAF9FC] border border-[#E8E7EF] rounded-xl px-4 py-2.5 text-xs text-[#11112A] focus:bg-white focus:outline-none focus:border-[#5B4BFF]"
                    >
                      <option value="">Select State</option>
                      {stateOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* District */}
                  <div>
                    <label className="block text-xs font-semibold text-[#11112A] mb-1.5">District *</label>
                    <select
                      value={district}
                      disabled={!state}
                      onChange={(e) => {
                        setDistrict(e.target.value);
                        setCity(e.target.value);
                      }}
                      className="w-full bg-[#FAF9FC] border border-[#E8E7EF] rounded-xl px-4 py-2.5 text-xs text-[#11112A] focus:bg-white focus:outline-none focus:border-[#5B4BFF]"
                    >
                      <option value="">Select District</option>
                      {districtOptions.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-semibold text-[#11112A] mb-1.5">City / Locality *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Bengaluru"
                      className="w-full bg-[#FAF9FC] border border-[#E8E7EF] rounded-xl px-4 py-2.5 text-xs text-[#11112A] focus:bg-white focus:outline-none focus:border-[#5B4BFF]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 rounded-full bg-[#5B4BFF] hover:bg-[#4C3CE6] text-white font-bold text-xs sm:text-sm transition shadow-md shadow-[#5B4BFF]/25 cursor-pointer flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <span className="animate-spin text-sm">⏳</span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Content 2: My Hosted Events */}
        {activeTab === 'events' && (
          <div>
            {loadingData ? (
              <div className="py-16 text-center text-[#68677A] text-xs font-medium">
                <span className="inline-block animate-spin text-2xl mb-2">⏳</span>
                <p>Loading your hosted events...</p>
              </div>
            ) : hostedEvents.length === 0 ? (
              <div className="bg-white border border-dashed border-[#D5D3E5] rounded-3xl p-12 text-center my-6 shadow-xs">
                <div className="text-4xl mb-3">📅</div>
                <h3 className="text-lg font-bold text-[#11112A] mb-1">No Events Hosted Yet</h3>
                <p className="text-xs text-[#68677A] max-w-md mx-auto mb-6">
                  You haven't posted any community gatherings yet. Click "+ Post Event" to host your first event!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {hostedEvents.map((ev) => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    onRsvpUpdate={fetchUserData}
                    onEventUpdated={fetchUserData}
                    onEventDeleted={fetchUserData}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 3: My Ticket Bookings */}
        {activeTab === 'bookings' && (
          <div>
            {loadingData ? (
              <div className="py-16 text-center text-[#68677A] text-xs font-medium">
                <span className="inline-block animate-spin text-2xl mb-2">⏳</span>
                <p>Loading your bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white border border-dashed border-[#D5D3E5] rounded-3xl p-12 text-center my-6 shadow-xs">
                <div className="text-4xl mb-3">🎟️</div>
                <h3 className="text-lg font-bold text-[#11112A] mb-1">No Active Ticket Bookings</h3>
                <p className="text-xs text-[#68677A] max-w-md mx-auto mb-6">
                  You haven't reserved tickets for any events yet. Explore top picks on the homepage!
                </p>
                <Link
                  to="/"
                  className="px-6 py-2.5 rounded-full bg-[#5B4BFF] hover:bg-[#4C3CE6] text-white text-xs font-bold transition shadow-md shadow-[#5B4BFF]/20 inline-block"
                >
                  Explore Events
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((b, idx) => (
                  <div
                    key={b.event?.id || idx}
                    className="bg-white border border-[#E8E7EF] hover:border-[#5B4BFF]/40 rounded-3xl p-6 shadow-xs transition flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-[#F1EEFF] text-[#5B4BFF] text-xs font-bold border border-[#E0D9FF]">
                          🎟️ {b.total_user_tickets} {b.total_user_tickets === 1 ? 'Ticket Reserved' : 'Tickets Reserved'}
                        </span>
                        <span className="text-xs font-bold text-[#68677A] bg-[#F4F3F8] px-3 py-1 rounded-full border border-[#E8E7EF]">
                          📍 {b.event?.city || 'Bengaluru'}
                        </span>
                      </div>

                      <h3 className="text-xl font-extrabold text-[#11112A]">
                        <Link to={`/event/${b.event?.id}`} className="hover:text-[#5B4BFF] transition">
                          {b.event?.title}
                        </Link>
                      </h3>

                      <p className="text-xs text-[#68677A] flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>📍 {b.event?.location}, {b.event?.neighborhood}</span>
                        <span>📅 {formatDate(b.event?.event_datetime)}</span>
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
                      <div className="bg-[#FAF9FC] border border-[#E8E7EF] p-3 rounded-2xl text-right w-full sm:w-auto">
                        <span className="text-[10px] font-extrabold text-[#68677A] uppercase block">Ticket Passes</span>
                        <span className="text-xs font-bold text-[#5B4BFF]">
                          #{b.ticket_numbers?.join(', #')}
                        </span>
                      </div>

                      {b.event?.allow_cancellation !== false && (
                        <button
                          onClick={() => handleCancelBooking(b.event.id, b.event.title, b.total_user_tickets)}
                          className="px-4 py-2.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition border border-red-200 cursor-pointer w-full sm:w-auto text-center"
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Attendees Modal */}
      {selectedAttendeesEventId && (
        <AttendeesModal
          isOpen={!!selectedAttendeesEventId}
          onClose={() => setSelectedAttendeesEventId(null)}
          eventId={selectedAttendeesEventId}
        />
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <EditEventModal
          isOpen={!!editingEvent}
          onClose={() => setEditingEvent(null)}
          event={editingEvent}
          onEventUpdated={fetchUserData}
        />
      )}

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

      <footer className="border-t border-[#E8E7EF] bg-white py-8 text-center text-[#68677A] text-xs font-medium mt-16">
        <p>© 2026 Local Event Bulletin Board. User Profile & Account Settings Dashboard.</p>
      </footer>
    </div>
  );
}
