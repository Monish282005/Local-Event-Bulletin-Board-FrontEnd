import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowLeft, Plus, Archive, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import EventGrid from '../components/EventGrid';
import Pagination from '../components/Pagination';
import CreateEventModal from '../components/CreateEventModal';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

export default function MyEventsPage() {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived'
  const [myEvents, setMyEvents] = useState([]);
  const [myEventsPagination, setMyEventsPagination] = useState(null);
  const [myEventsPage, setMyEventsPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { user, isAuthenticated, promptLoginForBooking } = useAuth();

  const fetchMyEvents = async (pageNum = myEventsPage, tab = activeTab) => {
    if (!isAuthenticated) return;
    try {
      const params = { page: pageNum, limit: 6, status: tab };
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

  // Automated Real-Time Heartbeat Poller (Every 5 seconds)
  useEffect(() => {
    setLoading(true);
    fetchMyEvents(myEventsPage, activeTab);

    const interval = setInterval(() => {
      fetchMyEvents(myEventsPage, activeTab);
    }, 5000);

    return () => clearInterval(interval);
  }, [myEventsPage, activeTab, isAuthenticated]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMyEventsPage(1);
    setLoading(true);
    fetchMyEvents(1, tab);
  };

  const handleMyEventsPageChange = (newPage) => {
    setMyEventsPage(newPage);
    fetchMyEvents(newPage, activeTab);
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
    setActiveTab('active');
    fetchMyEvents(1, 'active');
  };

  if (!isAuthenticated) return null;

  // Real-time client-side safety filter
  const displayedEvents = myEvents.filter((event) => {
    const isPast = event.is_expired || (event.event_datetime && new Date(event.event_datetime) <= new Date());
    return activeTab === 'archived' ? isPast : !isPast;
  });

  return (
    <div className="min-h-screen text-[#0F0F14] flex flex-col font-sans">
      <Navbar onCreateClick={handleCreateClick} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 flex-1 w-full">
        {/* Hero Banner */}
        <div className="mb-8 text-center font-sans">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F4F3F8] text-[#0F0F14] text-xs font-bold mb-4 border border-[#E8E7EF]">
            <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Host Organizer Dashboard</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0F0F14] tracking-tight mb-3 leading-tight">
            My Hosted Events
          </h2>
          <p className="text-[#68677A] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-bold">
            Manage your active upcoming gatherings and view completed archived events in real-time.
          </p>
        </div>

        {/* Tab Switcher: Active Events vs Archived Events */}
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
              <span>Active Events</span>
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
              <span>Archived / Completed</span>
            </button>
          </div>

          <Link
            to="/"
            className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-[#0F172A] text-xs font-extrabold border border-[#E8E8EF] transition flex items-center gap-1.5 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Events</span>
          </Link>
        </div>

        <div>
          {displayedEvents.length === 0 && !loading ? (
            <div className="bg-white border border-dashed border-[#D5D3E5] rounded-3xl p-12 text-center max-w-lg mx-auto my-8 shadow-xs">
              {activeTab === 'active' ? (
                <>
                  <Calendar className="w-10 h-10 text-[#68677A] mx-auto mb-3" />
                  <h4 className="text-lg font-bold text-[#0F0F14] mb-2">No Active Events</h4>
                  <p className="text-[#68677A] text-xs sm:text-sm font-medium mb-6">
                    You don't have any upcoming active events right now. Click below to host your next community event!
                  </p>
                  <button
                    onClick={handleCreateClick}
                    className="px-6 py-2.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-extrabold transition shadow-md flex items-center gap-1.5 mx-auto cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Post First Event</span>
                  </button>
                </>
              ) : (
                <>
                  <Archive className="w-10 h-10 text-[#68677A] mx-auto mb-3" />
                  <h4 className="text-lg font-bold text-[#0F0F14] mb-2">No Archived Events</h4>
                  <p className="text-[#68677A] text-xs sm:text-sm font-medium mb-2">
                    When your hosted events pass their scheduled date and time, they will automatically appear here as completed archives in real time.
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              <EventGrid
                events={displayedEvents}
                loading={loading}
                error={error}
                showOwnerControls={true}
                onRetry={() => fetchMyEvents(myEventsPage, activeTab)}
                onRsvpUpdate={() => fetchMyEvents(myEventsPage, activeTab)}
                onEventUpdated={() => fetchMyEvents(myEventsPage, activeTab)}
                onEventDeleted={() => fetchMyEvents(1, activeTab)}
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

      <footer className="border-t border-[#E8E7EF] py-8 text-center text-[#68677A] text-xs font-bold mt-16">
        <p>© 2026 Local Event Bulletin Board. Designed with visual polish & discovery layout.</p>
      </footer>
    </div>
  );
}
