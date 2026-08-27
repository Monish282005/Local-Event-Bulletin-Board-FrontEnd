import React from 'react';
import { MapPin, Building2, Globe, AlertTriangle } from 'lucide-react';
import EventCard from './EventCard';
import Pagination from './Pagination';

function SkeletonCard() {
  return (
    <div className="bg-white border border-[#E8E7EF] rounded-3xl p-6 shadow-sm animate-pulse flex flex-col justify-between h-80">
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
          <div className="h-6 w-28 bg-slate-200 rounded-full"></div>
        </div>
        <div className="h-7 w-3/4 bg-slate-200 rounded-lg mb-3"></div>
        <div className="h-5 w-1/2 bg-slate-200 rounded-full mb-4"></div>
        <div className="space-y-2 mb-4">
          <div className="h-3.5 w-full bg-slate-200 rounded"></div>
          <div className="h-3.5 w-5/6 bg-slate-200 rounded"></div>
        </div>
      </div>
      <div className="pt-4 border-t border-[#F0EFF6] flex justify-between items-center">
        <div className="h-9 w-28 bg-slate-200 rounded-full"></div>
        <div className="h-9 w-20 bg-slate-200 rounded-full"></div>
      </div>
    </div>
  );
}

function SectionTier({
  icon: IconComponent,
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
    <section className="mb-14 last:mb-0 border border-[#E8E7EF] rounded-3xl p-6 sm:p-8 shadow-lg shadow-slate-900/5">
      <div className="flex items-center justify-between mb-6 border-b border-[#E8E7EF] pb-4">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-[#0F0F14] text-white flex items-center justify-center text-lg shadow-sm font-bold">
            <IconComponent className="w-4 h-4 text-white" />
          </span>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-[#0F0F14] tracking-tight">{title}</h3>
          </div>
        </div>
        <span className="inline-block px-3.5 py-1 bg-[#F4F3F8] text-[#0F0F14] text-xs font-bold rounded-full border border-[#E8E7EF]">
          {totalCount} {totalCount === 1 ? 'event' : 'events'}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-dashed border-[#D5D3E5] rounded-3xl p-8 text-center my-4 shadow-2xs">
          <MapPin className="w-8 h-8 mx-auto text-[#68677A] mb-2" />
          <p className="text-[#68677A] text-xs sm:text-sm font-bold leading-relaxed max-w-md mx-auto">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
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
  selectedCity,
  onRetry,
  onPageChange,
  onRsvpUpdate,
  onEventUpdated,
  onEventDeleted,
}) {
  if (loading) {
    return (
      <div className="space-y-12">
        <div className="h-8 w-64 bg-slate-300 rounded-lg animate-pulse mb-6"></div>
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
      <div className="bg-white border border-red-200 rounded-3xl p-8 text-center max-w-lg mx-auto my-12 shadow-md">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-red-600 mb-2">Unable to Load Hierarchical Feed</h3>
        <p className="text-[#68677A] text-sm mb-6 font-medium">{error}</p>
        <button
          onClick={onRetry}
          className="px-6 py-2.5 rounded-full bg-[#0F0F14] hover:bg-black text-white text-xs font-bold transition shadow-md cursor-pointer"
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

  const city = selectedCity || userLocation.city || 'Coimbatore';
  const state = userLocation.state || 'Karnataka';
  const country = userLocation.country || 'India';

  const topPicksTitle = `Top Picks in ${city}`;
  const stateTitle = `More in ${state}`;
  const countryTitle = `Across ${country}`;

  return (
    <div className="space-y-6 font-sans">
      {/* Tier 1: City Events */}
      <SectionTier
        icon={MapPin}
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
        icon={Building2}
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
        icon={Globe}
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
