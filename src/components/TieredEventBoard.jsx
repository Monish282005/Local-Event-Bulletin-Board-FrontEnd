import React from 'react';
import EventCard from './EventCard';
import Pagination from './Pagination';

function SkeletonCard() {
  return (
    <div className="bg-white border border-[#E8E7EF] rounded-2xl p-6 shadow-sm animate-pulse flex flex-col justify-between h-80">
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 w-24 bg-slate-100 rounded-full"></div>
          <div className="h-6 w-28 bg-slate-100 rounded-full"></div>
        </div>
        <div className="h-7 w-3/4 bg-slate-100 rounded-lg mb-3"></div>
        <div className="h-5 w-1/2 bg-slate-100 rounded-full mb-4"></div>
        <div className="space-y-2 mb-4">
          <div className="h-3.5 w-full bg-slate-100 rounded"></div>
          <div className="h-3.5 w-5/6 bg-slate-100 rounded"></div>
        </div>
      </div>
      <div className="pt-4 border-t border-[#F0EFF6] flex justify-between items-center">
        <div className="h-9 w-28 bg-slate-100 rounded-full"></div>
        <div className="h-9 w-20 bg-slate-100 rounded-full"></div>
      </div>
    </div>
  );
}

function SectionTier({
  icon,
  title,
  events,
  pagination,
  onPageChange,
  emptyMessage,
  onRsvpUpdate,
  onEventUpdated,
  onEventDeleted,
}) {
  const totalCount = pagination?.total ?? events.length;

  return (
    <section className="mb-14 last:mb-0 bg-white/40 border border-[#E8E7EF]/80 rounded-3xl p-6 sm:p-8 shadow-xs backdrop-blur-xs">
      <div className="flex items-center justify-between mb-6 border-b border-[#E8E7EF] pb-4">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-[#F1EEFF] text-[#5B4BFF] flex items-center justify-center text-lg shadow-xs font-bold">
            {icon}
          </span>
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#11112A] tracking-tight">{title}</h3>
          </div>
        </div>
        <span className="inline-block px-3 py-1 bg-[#F4F3F8] text-[#68677A] text-xs font-semibold rounded-full border border-[#E8E7EF]">
          {totalCount} {totalCount === 1 ? 'event' : 'events'}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="bg-white/80 border border-dashed border-[#D5D3E5] rounded-2xl p-8 text-center my-4 shadow-xs">
          <div className="text-3xl mb-2">📍</div>
          <p className="text-[#68677A] text-xs sm:text-sm font-medium leading-relaxed max-w-md mx-auto">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onRsvpUpdate={onRsvpUpdate}
                onEventUpdated={onEventUpdated}
                onEventDeleted={onEventDeleted}
              />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={onPageChange}
            />
          )}
        </>
      )}
    </section>
  );
}

export default function TieredEventBoard({
  feedData,
  loading,
  error,
  onRetry,
  onPageChange,
  onRsvpUpdate,
  onEventUpdated,
  onEventDeleted,
}) {
  if (loading) {
    return (
      <div className="space-y-12">
        <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50/70 border border-red-100 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 shadow-sm">
        <div className="text-4xl mb-3">⚠️</div>
        <h3 className="text-lg font-bold text-red-600 mb-2">Unable to Load Hierarchical Feed</h3>
        <p className="text-[#68677A] text-sm mb-6">{error}</p>
        <button
          onClick={onRetry}
          className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition shadow-md shadow-red-600/20"
        >
          Try Again
        </button>
      </div>
    );
  }

  const {
    userLocation = {},
    topPicks = [],
    stateEvents = [],
    countryEvents = [],
    pagination = {},
  } = feedData || {};

  const isLoggedIn = userLocation.isAuthenticated === true;
  const city = userLocation.city || 'Bengaluru';
  const state = userLocation.state || 'Karnataka';
  const country = userLocation.country || 'India';

  const topPicksTitle = isLoggedIn ? `Top Picks in ${city}` : '🔥 Top Picks & Featured Events';
  const stateTitle = isLoggedIn ? `More in ${state}` : `🏙️ Popular in ${state}`;
  const countryTitle = isLoggedIn ? `Across ${country}` : `🌍 National Events in ${country}`;

  return (
    <div className="space-y-6">
      {/* Tier 1: City Events */}
      <SectionTier
        icon="📍"
        title={topPicksTitle}
        events={topPicks}
        pagination={pagination.topPicks}
        onPageChange={(p) => onPageChange && onPageChange('topPicks', p)}
        emptyMessage={`No events in ${city} yet — check the state and country sections below.`}
        onRsvpUpdate={onRsvpUpdate}
        onEventUpdated={onEventUpdated}
        onEventDeleted={onEventDeleted}
      />

      {/* Tier 2: State Events */}
      <SectionTier
        icon="🏙️"
        title={stateTitle}
        events={stateEvents}
        pagination={pagination.stateEvents}
        onPageChange={(p) => onPageChange && onPageChange('stateEvents', p)}
        emptyMessage={`No other events in ${state} outside ${city} right now.`}
        onRsvpUpdate={onRsvpUpdate}
        onEventUpdated={onEventUpdated}
        onEventDeleted={onEventDeleted}
      />

      {/* Tier 3: Country Events */}
      <SectionTier
        icon="🌍"
        title={countryTitle}
        events={countryEvents}
        pagination={pagination.countryEvents}
        onPageChange={(p) => onPageChange && onPageChange('countryEvents', p)}
        emptyMessage={`No other national events in ${country} outside ${state} right now.`}
        onRsvpUpdate={onRsvpUpdate}
        onEventUpdated={onEventUpdated}
        onEventDeleted={onEventDeleted}
      />
    </div>
  );
}
