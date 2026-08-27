import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, ArrowLeft, Archive, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import BookingPassCard from '../components/BookingPassCard';
import Pagination from '../components/Pagination';
import CreateEventModal from '../components/CreateEventModal';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

export default function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived'
  const [myBookings, setMyBookings] = useState([]);
  const [myBookingsPagination, setMyBookingsPagination] = useState(null);
  const [myBookingsPage, setMyBookingsPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { user, isAuthenticated, promptLoginForBooking } = useAuth();

  const fetchMyBookings = async (pageNum = myBookingsPage) => {
    if (!isAuthenticated) return;
    try {
      const params = { page: pageNum, limit: 6 };
      const response = await axiosClient.get('/api/events/my-bookings', { params });
      setMyBookings(response.data.bookings || []);
      setMyBookingsPagination(response.data.pagination || null);
    } catch (err) {
      console.error('Failed to fetch my bookings:', err);
      setError(err.response?.data?.error || 'Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  // Automated Real-Time Heartbeat Poller (Every 5 seconds)
  useEffect(() => {
    setLoading(true);
    fetchMyBookings(myBookingsPage);

    const interval = setInterval(() => {
      fetchMyBookings(myBookingsPage);
    }, 5000);

    return () => clearInterval(interval);
  }, [myBookingsPage, isAuthenticated]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMyBookingsPage(1);
    setLoading(true);
    fetchMyBookings(1);
  };

  const handleMyBookingsPageChange = (newPage) => {
    setMyBookingsPage(newPage);
    fetchMyBookings(newPage);
  };

  const handleCreateClick = () => {
    if (!user) {
      promptLoginForBooking(null);
      return;
    }
    setIsCreateModalOpen(true);
  };

  if (!isAuthenticated) return null;

  // Real-time client-side filter for Active vs Completed Bookings
  const displayedBookings = myBookings.filter((b) => {
    const isPast = b.event?.is_expired || (b.event?.event_datetime && new Date(b.event.event_datetime) <= new Date());
    return activeTab === 'archived' ? isPast : !isPast;
  });

  return (
    <div className="min-h-screen text-[#0F0F14] flex flex-col font-sans">
      <Navbar onCreateClick={handleCreateClick} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 flex-1 w-full">
        {/* Hero Banner */}
        <div className="mb-8 text-center font-sans">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F4F3F8] text-[#0F0F14] text-xs font-bold mb-4 border border-[#E8E7EF]">
            <Ticket className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Reserved Pass Management</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0F0F14] tracking-tight mb-3 leading-tight">
            My Booked Ticket Passes
          </h2>
          <p className="text-[#68677A] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-bold">
            View all your active event reservations and completed pass history in real-time.
          </p>
        </div>

        {/* Tab Switcher: Active Bookings vs Completed Bookings */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#E8E7EF] pb-4 mb-8">
          <div className="bg-[#F1F5F9] p-1 rounded-full border border-[#E2E8F0] flex items-center gap-1">
            <button
              onClick={() => handleTabChange('active')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'active'
                  ? 'bg-[#0F172A] text-white shadow-md font-extrabold'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/80'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Active Passes</span>
            </button>

            <button
              onClick={() => handleTabChange('archived')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'archived'
                  ? 'bg-[#0F172A] text-white shadow-md font-extrabold'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/80'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Completed Passes</span>
            </button>
          </div>

          <Link
            to="/"
            className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-[#0F172A] text-xs font-extrabold border border-[#E8E7EF] transition flex items-center gap-1.5 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Events</span>
          </Link>
        </div>

        <div>
          {displayedBookings.length === 0 && !loading ? (
            <div className="bg-white border border-dashed border-[#D5D3E5] rounded-3xl p-12 text-center max-w-lg mx-auto my-8 shadow-xs">
              {activeTab === 'active' ? (
                <>
                  <Ticket className="w-10 h-10 text-[#68677A] mx-auto mb-3" />
                  <h4 className="text-lg font-bold text-[#0F0F14] mb-2">No Active Ticket Passes</h4>
                  <p className="text-[#68677A] text-xs sm:text-sm font-bold mb-6">
                    You don't have any active upcoming bookings right now. Browse nearby events to reserve your spot!
                  </p>
                  <Link
                    to="/"
                    className="px-6 py-2.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-extrabold transition shadow-md inline-block"
                  >
                    Browse Nearby Events
                  </Link>
                </>
              ) : (
                <>
                  <Archive className="w-10 h-10 text-[#68677A] mx-auto mb-3" />
                  <h4 className="text-lg font-bold text-[#0F0F14] mb-2">No Completed Passes</h4>
                  <p className="text-[#68677A] text-xs sm:text-sm font-bold mb-2">
                    When your registered events pass their scheduled date and time, your ticket passes will automatically appear here as completed records.
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
                {displayedBookings.map((b) => (
                  <BookingPassCard
                    key={b.event.id}
                    booking={b}
                    onBookingCancelled={() => {
                      fetchMyBookings(myBookingsPage);
                    }}
                  />
                ))}
              </div>

              {myBookingsPagination && myBookingsPagination.total > 0 && (
                <Pagination
                  currentPage={myBookingsPagination.page}
                  totalPages={myBookingsPagination.totalPages}
                  totalItems={myBookingsPagination.total}
                  itemsPerPage={myBookingsPagination.limit}
                  onPageChange={handleMyBookingsPageChange}
                />
              )}
            </>
          )}
        </div>
      </main>

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={() => fetchMyBookings(1)}
      />

      <footer className="border-t border-[#E8E7EF] py-8 text-center text-[#68677A] text-xs font-bold mt-16">
        <p>© 2026 Local Event Bulletin Board. Designed with visual polish & discovery layout.</p>
      </footer>
    </div>
  );
}
