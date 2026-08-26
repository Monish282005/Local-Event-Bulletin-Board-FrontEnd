import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import FilterControls from '../components/FilterControls';
import TieredEventBoard from '../components/TieredEventBoard';
import EventGrid from '../components/EventGrid';
import Pagination from '../components/Pagination';
import CreateEventModal from '../components/CreateEventModal';
import CitySelectorModal from '../components/CitySelectorModal';
import axiosClient from '../api/axiosClient';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
import { detectUserCity } from '../utils/locationHelper';

export default function BoardPage() {
  const { promptLoginForBooking, user } = useAuth();

  const [selectedCity, setSelectedCity] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(true);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);

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
  const [datePreset, setDatePreset] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sort, setSort] = useState('datetime_asc');

  const debouncedNeighborhood = useDebounce(neighborhoodInput, 300);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const initLocation = async () => {
      const isPageReload = performance.getEntriesByType('navigation')?.[0]?.type === 'reload';
      const hasDoneInitialDetection = sessionStorage.getItem('hasInitialDetectionDone');
      const savedCity = localStorage.getItem('selectedCity') || user?.city;

      // If NOT a page refresh AND initial detection was already performed in this session, reuse saved city!
      if (!isPageReload && hasDoneInitialDetection && savedCity) {
        if (isMounted) {
          setSelectedCity(savedCity);
          setIsDetectingLocation(false);
        }
        return;
      }

      // Run location detection on page refresh (F5) or initial page load
      setIsDetectingLocation(true);
      try {
        const detected = await detectUserCity();
        sessionStorage.setItem('hasInitialDetectionDone', 'true');
        if (isMounted) {
          const finalCity = detected || user?.city || 'Bengaluru';
          setSelectedCity(finalCity);
          localStorage.setItem('selectedCity', finalCity);
        }
      } catch (err) {
        console.warn('Location detection failed:', err);
        sessionStorage.setItem('hasInitialDetectionDone', 'true');
        if (isMounted) {
          const fallback = localStorage.getItem('selectedCity') || user?.city || 'Bengaluru';
          setSelectedCity(fallback);
        }
      } finally {
        if (isMounted) {
          setIsDetectingLocation(false);
        }
      }
    };

    initLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectCity = (newCity) => {
    setSelectedCity(newCity);
    localStorage.setItem('selectedCity', newCity);
    sessionStorage.setItem('userManuallyPickedCity', newCity);
  };

  const fetchFeed = async (cat = selectedCategory, pages = tierPages, cityToUse = selectedCity) => {
    if (!cityToUse) return;
    setLoading(true);
    setError(null);
    try {
      const params = {
        topPicksPage: pages.topPicks,
        statePage: pages.stateEvents,
        countryPage: pages.countryEvents,
        city: cityToUse,
        limit: 6,
      };
      if (cat && cat.trim()) params.category = cat.trim();
      if (datePreset && datePreset !== 'all') params.datePreset = datePreset;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (sort) params.sort = sort;
      if (debouncedNeighborhood && debouncedNeighborhood.trim()) params.search = debouncedNeighborhood.trim();

      const response = await axiosClient.get('/api/events/feed', { params });
      setFeedData(response.data || { topPicks: [], stateEvents: [], countryEvents: [], userLocation: {}, pagination: {} });
    } catch (err) {
      console.error('Failed to fetch tiered feed:', err);
      setError(err.response?.data?.error || 'Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFlatEvents = async (neigh = debouncedNeighborhood, cat = selectedCategory, pageNum = flatPage, cityToUse = selectedCity) => {
    if (!cityToUse) return;
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pageNum,
        limit: 9,
      };
      if (neigh && neigh.trim()) params.search = neigh.trim();
      if (cat && cat.trim()) params.category = cat.trim();
      if (datePreset && datePreset !== 'all') params.datePreset = datePreset;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (sort) params.sort = sort;

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

  const isFiltering = Boolean(
    (debouncedNeighborhood && debouncedNeighborhood.trim()) ||
    (selectedCategory && selectedCategory.trim()) ||
    (datePreset && datePreset !== 'all') ||
    startDate ||
    endDate ||
    (sort && sort !== 'datetime_asc')
  );

  useEffect(() => {
    if (isDetectingLocation || !selectedCity) {
      return;
    }

    if (isFiltering) {
      setFlatPage(1);
      fetchFlatEvents(debouncedNeighborhood, selectedCategory, 1, selectedCity);
    } else {
      setTierPages({ topPicks: 1, stateEvents: 1, countryEvents: 1 });
      fetchFeed(selectedCategory, { topPicks: 1, stateEvents: 1, countryEvents: 1 }, selectedCity);
    }
  }, [debouncedNeighborhood, selectedCategory, datePreset, startDate, endDate, sort, selectedCity, isDetectingLocation]);

  const handleTierPageChange = (tier, newPage) => {
    const newPages = { ...tierPages, [tier]: newPage };
    setTierPages(newPages);
    fetchFeed(selectedCategory, newPages, selectedCity);
  };

  const handleFlatPageChange = (newPage) => {
    setFlatPage(newPage);
    fetchFlatEvents(debouncedNeighborhood, selectedCategory, newPage, selectedCity);
  };

  const handleClearFilters = () => {
    setNeighborhoodInput('');
    setSelectedCategory('');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setSort('datetime_asc');
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
      fetchFlatEvents(debouncedNeighborhood, selectedCategory, flatPage, selectedCity);
    } else {
      fetchFeed(selectedCategory, tierPages, selectedCity);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9FC] text-[#11112A] flex flex-col font-sans">
      <Navbar
        onCreateClick={handleCreateClick}
        selectedCity={selectedCity || 'Detecting...'}
        onOpenCitySelector={() => setIsCityModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Hero Banner */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F1EEFF] text-[#5B4BFF] text-xs font-bold mb-4 border border-[#E0D9FF]">
            <span>📍</span>
            <span>
              {isDetectingLocation
                ? 'Auto-detecting your location via GPS...'
                : `Showing Events for ${selectedCity}`}
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#11112A] tracking-tight mb-4 leading-tight">
            {isDetectingLocation
              ? 'Finding Events Near You...'
              : user
              ? `Welcome, ${user.name}!`
              : `Top Picks in ${selectedCity}`}
          </h2>
          <p className="text-[#68677A] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {isDetectingLocation
              ? 'Locating nearby community gatherings and top picks for your current location.'
              : user
              ? `Discovering events and community gatherings in ${selectedCity}.`
              : `Explore top community gatherings in ${selectedCity}. Click the city selector in the header bar to change your location!`}
          </p>
        </div>

        {/* Filter Controls */}
        <FilterControls
          neighborhoodInput={neighborhoodInput}
          onNeighborhoodChange={setNeighborhoodInput}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          datePreset={datePreset}
          onDatePresetChange={setDatePreset}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          sort={sort}
          onSortChange={setSort}
          onClearFilters={handleClearFilters}
        />

        {/* Main Content Area */}
        {isFiltering ? (
          <div>
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#E8E7EF]">
              <h3 className="text-xl font-bold text-[#11112A] flex items-center gap-2">
                <span>🔍</span>
                <span>Filtered Results</span>
              </h3>
              <button
                onClick={handleClearFilters}
                className="text-xs text-[#5B4BFF] hover:underline font-semibold"
              >
                Clear all filters
              </button>
            </div>

            <EventGrid
              events={flatEvents}
              loading={loading}
              error={error}
              emptyMessage="No events found matching your criteria. Try adjusting your filters or date range."
              onRetry={refreshCurrentView}
              onRsvpUpdate={refreshCurrentView}
              onEventUpdated={refreshCurrentView}
              onEventDeleted={refreshCurrentView}
            />

            {flatPagination && flatPagination.totalPages > 1 && (
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
            loading={loading || isDetectingLocation}
            error={error}
            selectedCity={selectedCity || 'Bengaluru'}
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
        defaultCity={selectedCity}
      />

      <CitySelectorModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        selectedCity={selectedCity}
        onSelectCity={handleSelectCity}
      />

      <footer className="border-t border-[#E8E7EF] bg-white py-8 text-center text-[#68677A] text-xs font-medium mt-16">
        <p>© 2026 Local Event Bulletin Board. Connect with local communities near you.</p>
      </footer>
    </div>
  );
}
