import React from 'react';
import EventCard from './EventCard';

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

export default function EventGrid({ events, loading, error, onRetry, onRsvpUpdate, onEventUpdated, onEventDeleted }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <SkeletonCard key={idx} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50/70 border border-red-100 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 shadow-sm">
        <div className="text-4xl mb-3">⚠️</div>
        <h3 className="text-lg font-bold text-red-600 mb-2">Unable to Load Events</h3>
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

  if (!events || events.length === 0) {
    return (
      <div className="bg-white border border-[#E8E7EF] rounded-2xl p-12 text-center max-w-md mx-auto my-12 shadow-sm">
        <div className="text-5xl mb-4">📍</div>
        <h3 className="text-xl font-bold text-[#11112A] mb-2">No Events Found</h3>
        <p className="text-[#68677A] text-sm leading-relaxed">
          No upcoming events match the selected criteria. Check back later or clear your search filters!
        </p>
      </div>
    );
  }

  return (
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
  );
}

