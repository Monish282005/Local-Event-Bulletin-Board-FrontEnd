import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import FilterControls from '../components/FilterControls';
import TieredEventBoard from '../components/TieredEventBoard';
import EventGrid from '../components/EventGrid';
import Pagination from '../components/Pagination';
import CreateEventModal from '../components/CreateEventModal';
import axiosClient from '../api/axiosClient';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';

export default function BoardPage() {
  const [feedData, setFeedData] = useState({ topPicks: [], stateEvents: [], countryEvents: [], userLocation: {}, pagination: {} });
  const [flatEvents, setFlatEvents] = useState([]);
  const [flatPagination, setFlatPagination] = useState(null);
  const [flatPage, setFlatPage] = useState(1);
  const [tierPages, setTierPages] = useState({ topPicks: 1, stateEvents: 1, countryEvents: 1 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [neighborhoodInput, setNeighborhoodInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const debouncedNeighborhood = useDebounce(neighborhoodInput, 300);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { promptLoginForBooking, user } = useAuth();

  const fetchFeed = async (cat = selectedCategory, pages = tierPages) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        topPicksPage: pages.topPicks,
        statePage: pages.stateEvents,
        countryPage: pages.countryEvents,
        limit: 6,
      };
      if (cat && cat.trim()) params.category = cat.trim();

      const response = await axiosClient.get('/api/events/feed', { params });
      setFeedData(response.data || { topPicks: [], stateEvents: [], countryEvents: [], userLocation: {}, pagination: {} });
    } catch (err) {
      console.error('Failed to fetch tiered feed:', err);
      setError(err.response?.data?.error || 'Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFlatEvents = async (neigh = debouncedNeighborhood, cat = selectedCategory, pageNum = flatPage) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pageNum,
        limit: 9,
      };
      if (neigh && neigh.trim()) params.neighborhood = neigh.trim();
      if (cat && cat.trim()) params.category = cat.trim();

      const response = await axiosClient.get('/api/events', { params });
      if (response.data && response.data.events) {
        setFlatEvents(response.data.events);
        setFlatPagination(response.data.pagination);
      } else {
        setFlatEvents(Array.isArray(response.data) ? response.data : []);
        setFlatPagination(null);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError(err.response?.data?.error || 'Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const isFiltering = Boolean((debouncedNeighborhood && debouncedNeighborhood.trim()) || (selectedCategory && selectedCategory.trim()));

  useEffect(() => {
    if (isFiltering) {
      setFlatPage(1);
      fetchFlatEvents(debouncedNeighborhood, selectedCategory, 1);
    } else {
      setTierPages({ topPicks: 1, stateEvents: 1, countryEvents: 1 });
      fetchFeed(selectedCategory, { topPicks: 1, stateEvents: 1, countryEvents: 1 });
    }
  }, [debouncedNeighborhood, selectedCategory]);

  const handleTierPageChange = (tier, newPage) => {
    const newPages = { ...tierPages, [tier]: newPage };
    setTierPages(newPages);
    fetchFeed(selectedCategory, newPages);
  };

  const handleFlatPageChange = (newPage) => {
    setFlatPage(newPage);
    fetchFlatEvents(debouncedNeighborhood, selectedCategory, newPage);
  };

  const handleClearFilters = () => {
    setNeighborhoodInput('');
    setSelectedCategory('');
  };

  const handleCreateClick = () => {
    if (!user) {
      promptLoginForBooking(null);
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleEventCreated = () => {
    handleClearFilters();
    setIsCreateModalOpen(false);
  };

  const refreshCurrentView = () => {
    if (isFiltering) {
      fetchFlatEvents(debouncedNeighborhood, selectedCategory, flatPage);
    } else {
      fetchFeed(selectedCategory, tierPages);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9FC] text-[#11112A] flex flex-col font-sans">
      <Navbar onCreateClick={handleCreateClick} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Hero Banner */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F1EEFF] text-[#5B4BFF] text-xs font-bold mb-4 border border-[#E0D9FF]">
            <span>✨</span>
            <span>{user ? `Personalized Feed for ${user.city || 'Your Location'}` : 'Hyper-Local Community Bulletin'}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#11112A] tracking-tight mb-4 leading-tight">
            {user ? `Welcome, ${user.name}!` : 'Top Picks & Featured Events'}
          </h2>
          <p className="text-[#68677A] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {user
              ? `Showing personalized events matching your location in ${user.city}, ${user.state}.`
              : 'Discover top community gatherings below. Sign in to unlock events personalized for your city!'}
          </p>
        </div>

        {/* Filter Controls */}
        <FilterControls
          neighborhoodInput={neighborhoodInput}
          onNeighborhoodChange={setNeighborhoodInput}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onClearFilters={handleClearFilters}
        />

        {/* Feed or Filter Grid */}
        {isFiltering ? (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#11112A]">
                Search Results ({flatPagination?.total ?? flatEvents.length})
              </h3>
              <button
                onClick={handleClearFilters}
                className="text-xs text-[#5B4BFF] hover:underline font-semibold"
              >
                Clear Search & Filters
              </button>
            </div>

            <EventGrid
              events={flatEvents}
              loading={loading}
              error={error}
              onRetry={refreshCurrentView}
              onRsvpUpdate={refreshCurrentView}
              onEventUpdated={refreshCurrentView}
              onEventDeleted={refreshCurrentView}
            />

            {flatPagination && flatPagination.total > 0 && (
              <Pagination
                currentPage={flatPagination.page}
                totalPages={flatPagination.totalPages}
                totalItems={flatPagination.total}
                itemsPerPage={flatPagination.limit}
                onPageChange={handleFlatPageChange}
              />
            )}
          </div>
        ) : (
          <TieredEventBoard
            feedData={feedData}
            loading={loading}
            error={error}
            onRetry={refreshCurrentView}
            onPageChange={handleTierPageChange}
            onRsvpUpdate={refreshCurrentView}
            onEventUpdated={refreshCurrentView}
            onEventDeleted={refreshCurrentView}
          />
        )}
      </main>

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={handleEventCreated}
      />

      <footer className="border-t border-[#E8E7EF] bg-white py-8 text-center text-[#68677A] text-xs font-medium mt-16">
        <p>© 2026 Local Event Bulletin Board. Designed with visual polish & discovery layout.</p>
      </footer>
    </div>
  );
}
