import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import BookingPassCard from '../components/BookingPassCard';
import Pagination from '../components/Pagination';
import CreateEventModal from '../components/CreateEventModal';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

export default function MyBookingsPage() {
  const [myBookings, setMyBookings] = useState([]);
  const [myBookingsPagination, setMyBookingsPagination] = useState(null);
  const [myBookingsPage, setMyBookingsPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { user, isAuthenticated, promptLoginForBooking } = useAuth();

  const fetchMyBookings = async (pageNum = myBookingsPage) => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
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

  useEffect(() => {
    fetchMyBookings(myBookingsPage);
  }, [myBookingsPage, isAuthenticated]);

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

  return (
    <div className="min-h-screen text-[#0F0F14] flex flex-col font-sans">
      <Navbar onCreateClick={handleCreateClick} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 flex-1 w-full">
        {/* Hero Banner */}
        <div className="mb-10 text-center font-sans">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F4F3F8] text-[#0F0F14] text-xs font-bold mb-4 border border-[#E8E7EF]">
            <Ticket className="w-3.5 h-3.5 text-[#0F0F14]" />
            <span>Reserved Pass Management</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0F0F14] tracking-tight mb-3 leading-tight">
            My Booked Ticket Passes
          </h2>
          <p className="text-[#68677A] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-bold">
            View all events you registered for with your issued ticket pass IDs.
          </p>
        </div>

        <div>
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4 border-b border-[#E8E7EF] pb-4">
            <h3 className="text-xl font-black text-[#0F0F14] flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#0F0F14]" />
              <span>Your Reserved Event Passes ({myBookingsPagination?.total ?? myBookings.length})</span>
            </h3>
            <Link
              to="/"
              className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-[#0F0F14] text-xs font-extrabold border border-[#E8E7EF] transition flex items-center gap-1.5 shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to All Events</span>
            </Link>
          </div>

          {myBookings.length === 0 && !loading ? (
            <div className="bg-white border border-dashed border-[#D5D3E5] rounded-3xl p-12 text-center max-w-lg mx-auto my-8 shadow-xs">
              <Ticket className="w-10 h-10 text-[#68677A] mx-auto mb-3" />
              <h4 className="text-lg font-bold text-[#0F0F14] mb-2">No Ticket Passes Reserved</h4>
              <p className="text-[#68677A] text-xs sm:text-sm font-bold mb-6">
                You haven't registered for any events yet. Explore upcoming community events to reserve your spot!
              </p>
              <Link
                to="/"
                className="px-6 py-2.5 rounded-full bg-[#0F0F14] hover:bg-black text-white text-xs font-extrabold transition shadow-md inline-block"
              >
                Browse Nearby Events
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
                {myBookings.map((b) => (
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
