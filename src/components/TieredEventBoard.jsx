import React from 'react';
import { MapPin, Building2, Globe, AlertTriangle } from 'lucide-react';
import EventCard from './EventCard';
import Pagination from './Pagination';

function SkeletonCard() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm animate-pulse flex flex-col justify-between h-72">
      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="h-5 w-20 bg-slate-100 rounded-full"></div>
          <div className="h-5 w-24 bg-slate-100 rounded-full"></div>
        </div>
        <div className="h-6 w-3/4 bg-slate-100 rounded-lg mb-2"></div>
        <div className="h-4 w-1/2 bg-slate-100 rounded-full mb-3"></div>
        <div className="space-y-2 mb-3">
          <div className="h-3 w-full bg-slate-100 rounded"></div>
          <div className="h-3 w-5/6 bg-slate-100 rounded"></div>
        </div>
      </div>
      <div className="pt-3 border-t border-[#F1F5F9] flex justify-between items-center">
        <div className="h-8 w-24 bg-slate-100 rounded-full"></div>
        <div className="h-8 w-16 bg-slate-100 rounded-full"></div>
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
    <section className="mb-10 last:mb-0 border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5 border-b border-[#E2E8F0] pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-[#0F172A] text-white flex items-center justify-center text-base shadow-sm font-bold">
            <IconComponent className="w-4 h-4 text-white" />
          </span>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-[#0F172A] tracking-tight">{title}</h3>
          </div>
        </div>
        <span className="inline-block px-3 py-0.5 bg-[#F1F5F9] text-[#0F172A] text-xs font-bold rounded-full border border-[#E2E8F0]">
          {totalCount} {totalCount === 1 ? 'event' : 'events'}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-2xl p-6 text-center my-3 shadow-2xs">
          <MapPin className="w-7 h-7 mx-auto text-[#64748B] mb-1.5" />
          <p className="text-[#64748B] text-xs sm:text-sm font-bold leading-relaxed max-w-md mx-auto">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-start">
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
      <div className="space-y-8">
        <div className="h-7 w-56 bg-slate-200 rounded-lg animate-pulse mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {[1, 2, 3].map((idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl p-6 text-center max-w-lg mx-auto my-8 shadow-sm">
        <AlertTriangle className="w-9 h-9 text-red-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-red-600 mb-1">Unable to Load Hierarchical Feed</h3>
        <p className="text-[#64748B] text-xs mb-4 font-medium">{error}</p>
        <button
          onClick={onRetry}
          className="px-5 py-2 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold transition shadow-md cursor-pointer"
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
        emptyMessage={`No upcoming events found in ${city} right now.`}
        onRsvpUpdate={onRsvpUpdate}
        onEventUpdated={onEventUpdated}
        onEventDeleted={onEventDeleted}
      />
    </div>
  );
}
