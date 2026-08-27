import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowLeft, Plus } from 'lucide-react';
import Navbar from '../components/Navbar';
import EventGrid from '../components/EventGrid';
import Pagination from '../components/Pagination';
import CreateEventModal from '../components/CreateEventModal';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

export default function MyEventsPage() {
  const [myEvents, setMyEvents] = useState([]);
  const [myEventsPagination, setMyEventsPagination] = useState(null);
  const [myEventsPage, setMyEventsPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { user, isAuthenticated, promptLoginForBooking } = useAuth();

  const fetchMyEvents = async (pageNum = myEventsPage) => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const params = { page: pageNum, limit: 6 };
      const response = await axiosClient.get('/api/events/my-events', { params });
      if (response.data && response.data.events) {
        setMyEvents(response.data.events);
        setMyEventsPagination(response.data.pagination);
      } else {
        setMyEvents(Array.isArray(response.data) ? response.data : []);
        setMyEventsPagination(null);
      }
    } catch (err) {
      console.error('Failed to fetch my events:', err);
      setError(err.response?.data?.error || 'Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvents(myEventsPage);
  }, [myEventsPage, isAuthenticated]);

  const handleMyEventsPageChange = (newPage) => {
    setMyEventsPage(newPage);
    fetchMyEvents(newPage);
  };

  const handleCreateClick = () => {
    if (!user) {
      promptLoginForBooking(null);
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleEventCreated = () => {
    setIsCreateModalOpen(false);
    fetchMyEvents(1);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen text-[#0F0F14] flex flex-col font-sans">
      <Navbar onCreateClick={handleCreateClick} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 flex-1 w-full">
        {/* Hero Banner */}
        <div className="mb-10 text-center font-sans">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F4F3F8] text-[#0F0F14] text-xs font-bold mb-4 border border-[#E8E7EF]">
            <Calendar className="w-3.5 h-3.5 text-[#0F0F14]" />
            <span>Host Organizer Dashboard</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0F0F14] tracking-tight mb-3 leading-tight">
            My Created Events
          </h2>
          <p className="text-[#68677A] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-bold">
            Manage and view all community gatherings and events you have posted.
          </p>
        </div>

        <div>
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4 border-b border-[#E8E7EF] pb-4">
            <h3 className="text-xl font-black text-[#0F0F14] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0F0F14]" />
              <span>Events Created by You ({myEventsPagination?.total ?? myEvents.length})</span>
            </h3>
            <Link
              to="/"
              className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-[#0F0F14] text-xs font-extrabold border border-[#E8E7EF] transition flex items-center gap-1.5 shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to All Events</span>
            </Link>
          </div>

          {myEvents.length === 0 && !loading ? (
            <div className="bg-white border border-dashed border-[#D5D3E5] rounded-3xl p-12 text-center max-w-lg mx-auto my-8 shadow-xs">
              <Calendar className="w-10 h-10 text-[#68677A] mx-auto mb-3" />
              <h4 className="text-lg font-bold text-[#0F0F14] mb-2">No Events Created Yet</h4>
              <p className="text-[#68677A] text-xs sm:text-sm font-medium mb-6">
                You haven't posted any community events. Click below to share your first gathering!
              </p>
              <button
                onClick={handleCreateClick}
                className="px-6 py-2.5 rounded-full bg-[#0F0F14] hover:bg-black text-white text-xs font-extrabold transition shadow-md flex items-center gap-1.5 mx-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Post First Event</span>
              </button>
            </div>
          ) : (
            <>
              <EventGrid
                events={myEvents}
                loading={loading}
                error={error}
                showOwnerControls={true}
                onRetry={() => fetchMyEvents(myEventsPage)}
                onRsvpUpdate={() => fetchMyEvents(myEventsPage)}
                onEventUpdated={() => fetchMyEvents(myEventsPage)}
                onEventDeleted={() => fetchMyEvents(1)}
              />

              {myEventsPagination && myEventsPagination.total > 0 && (
                <Pagination
                  currentPage={myEventsPagination.page}
                  totalPages={myEventsPagination.totalPages}
                  totalItems={myEventsPagination.total}
                  itemsPerPage={myEventsPagination.limit}
                  onPageChange={handleMyEventsPageChange}
                />
              )}
            </>
          )}
        </div>
      </main>

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={handleEventCreated}
      />

      <footer className="border-t border-[#E8E7EF] bg-white py-8 text-center text-[#68677A] text-xs font-bold mt-16">
        <p>© 2026 Local Event Bulletin Board. Designed with visual polish & discovery layout.</p>
      </footer>
    </div>
  );
}
