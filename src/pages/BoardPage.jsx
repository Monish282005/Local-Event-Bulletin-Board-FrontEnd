import React, { useState, useEffect } from 'react';
import { MapPin, Search } from 'lucide-react';
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

  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem('selectedCity') || sessionStorage.getItem('detectedCity') || null;
  });
  const [isDetectingLocation, setIsDetectingLocation] = useState(() => {
    const cached = localStorage.getItem('selectedCity') || sessionStorage.getItem('detectedCity');
    return !cached;
  });
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
      const cachedCity = localStorage.getItem('selectedCity') || sessionStorage.getItem('detectedCity');

      // If city is already cached (e.g. from previous detection or route navigation), DO NOT re-detect!
      if (cachedCity) {
        if (isMounted) {
          setSelectedCity(cachedCity);
          setIsDetectingLocation(false);
        }
        return;
      }

      // Run location detection ONLY ONCE if no city is cached yet
      setIsDetectingLocation(true);
      try {
        const detected = await detectUserCity();
        if (isMounted) {
          const finalCity = detected || user?.city || 'Coimbatore';
          setSelectedCity(finalCity);
          localStorage.setItem('selectedCity', finalCity);
          sessionStorage.setItem('detectedCity', finalCity);
        }
      } catch (err) {
        console.warn('Location detection failed:', err);
        if (isMounted) {
          const fallback = user?.city || 'Coimbatore';
          setSelectedCity(fallback);
          localStorage.setItem('selectedCity', fallback);
          sessionStorage.setItem('detectedCity', fallback);
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
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pageNum,
        limit: 9,
      };

      const hasSearchText = Boolean(neigh && neigh.trim());
      if (!hasSearchText && cityToUse) {
        params.city = cityToUse;
      }
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

  // Only switch to flat search results view when there is active text in the search input box!
  const isSearching = Boolean(debouncedNeighborhood && debouncedNeighborhood.trim());

  useEffect(() => {
    if (isDetectingLocation || !selectedCity) {
      return;
    }

    if (isSearching) {
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
    if (isSearching) {
      fetchFlatEvents(debouncedNeighborhood, selectedCategory, flatPage, selectedCity);
    } else {
      fetchFeed(selectedCategory, tierPages, selectedCity);
    }
  };

  return (
    <div className="min-h-screen text-[#11112A] flex flex-col font-sans">
      <Navbar
        onCreateClick={handleCreateClick}
        selectedCity={selectedCity || 'Detecting...'}
        onOpenCitySelector={() => setIsCityModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Hero Banner */}
        <div className="mb-10 text-center font-sans">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F4F3F8] text-[#0F0F14] text-xs font-bold mb-4 border border-[#E8E7EF]">
            <MapPin className="w-3.5 h-3.5 text-[#0F0F14]" />
            <span>
              {isDetectingLocation
                ? 'Auto-detecting your location via GPS...'
                : `Showing Events for ${selectedCity}`}
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0F0F14] tracking-tight mb-4 leading-tight">
            {isDetectingLocation
              ? 'Finding Events Near You...'
              : user
              ? `Welcome, ${user.name}!`
              : `Top Picks in ${selectedCity}`}
          </h2>
          <p className="text-[#68677A] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-bold">
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
        {isSearching ? (
          <div>
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#E8E7EF]">
              <h3 className="text-xl font-black text-[#0F0F14] flex items-center gap-2">
                <Search className="w-5 h-5 text-[#2563EB]" />
                <span>Search Results for "{debouncedNeighborhood.trim()}"</span>
              </h3>
              <button
                onClick={handleClearFilters}
                className="text-xs text-[#0F0F14] hover:underline font-extrabold cursor-pointer"
              >
                Clear search
              </button>
            </div>

            <EventGrid
              events={flatEvents}
              loading={loading}
              error={error}
              emptyMessage={`No events found matching "${debouncedNeighborhood.trim()}". Try searching for another city, category, or keyword.`}
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
      />

      <CitySelectorModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        onSelectCity={handleSelectCity}
        currentCity={selectedCity}
      />

      <footer className="border-t border-[#E8E7EF] py-8 text-center text-[#68677A] text-xs font-bold mt-16">
        <p>© 2026 Local Event Bulletin Board. Designed with visual polish & discovery layout.</p>
      </footer>
    </div>
  );
}
