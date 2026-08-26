import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axiosClient from '../api/axiosClient';

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function formatTicketRange(tickets) {
  if (!tickets || tickets.length === 0) return '';
  if (tickets.length === 1) return `Ticket #${tickets[0]}`;

  const sorted = [...tickets].sort((a, b) => a - b);
  const isConsecutive = sorted.every((val, idx, arr) => idx === 0 || val === arr[idx - 1] + 1);

  if (isConsecutive && sorted.length > 1) {
    return `Tickets #${sorted[0]} – #${sorted[sorted.length - 1]}`;
  }
  return `Tickets #${sorted.join(', #')}`;
}

export default function AttendeesModal({ isOpen, onClose, eventId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && eventId) {
      setLoading(true);
      setError(null);
      setSearchQuery('');
      axiosClient
        .get(`/api/events/${eventId}/attendees`)
        .then((res) => {
          setData(res.data);
        })
        .catch((err) => {
          console.error('Failed to fetch attendees:', err);
          setError(err.response?.data?.error || 'Failed to load attendees list.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, eventId]);

  const groupedAttendees = useMemo(() => {
    let list = [];
    if (data?.grouped_attendees && data.grouped_attendees.length > 0) {
      list = data.grouped_attendees;
    } else if (data?.attendees) {
      const map = new Map();
      for (const item of data.attendees) {
        const key = (item.user_email || item.user_id || item.user_name || '').toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            user_name: item.user_name,
            user_email: item.user_email,
            ticket_count: 0,
            ticket_numbers: [],
            first_booked_at: item.created_at,
          });
        }
        const existing = map.get(key);
        existing.ticket_count += 1;
        existing.ticket_numbers.push(item.ticket_number);
      }
      list = Array.from(map.values());
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (a) =>
        (a.user_name && a.user_name.toLowerCase().includes(q)) ||
        (a.user_email && a.user_email.toLowerCase().includes(q))
    );
  }, [data, searchQuery]);

  if (!isOpen) return null;

  const totalTickets = data?.total_tickets || 50;
  const rsvpCount = data?.rsvp_count || 0;
  const remaining = Math.max(0, totalTickets - rsvpCount);
  const percentage = Math.min(100, Math.round((rsvpCount / totalTickets) * 100));

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white border border-[#E8E7EF] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-auto max-h-[92vh] flex flex-col text-[#11112A]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center text-[#68677A] hover:text-[#11112A] hover:bg-[#F4F3F8] rounded-full text-base transition font-semibold cursor-pointer"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="mb-6 flex-shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1EEFF] text-[#5B4BFF] text-xs font-bold mb-3 border border-[#E0D9FF]">
            <span>🎟️</span>
            <span>Attendee Dashboard</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#11112A] mb-1 leading-tight truncate">
            {data?.title || 'Event Attendees'}
          </h2>
          <p className="text-[#68677A] text-xs sm:text-sm">
            Overview of members who claimed tickets for your event.
          </p>
        </div>

        {/* Executive Stats & Progress Card */}
        <div className="bg-[#FAF9FC] border border-[#E8E7EF] rounded-2xl p-4 sm:p-5 mb-5 flex-shrink-0 shadow-xs">
          <div className="grid grid-cols-3 gap-3 mb-4 text-center">
            <div className="bg-white border border-[#E8E7EF] p-2.5 rounded-xl shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase text-[#68677A] block tracking-wider">Claimed</span>
              <span className="text-base sm:text-lg font-black text-[#5B4BFF]">{rsvpCount} / {totalTickets}</span>
            </div>
            <div className="bg-white border border-[#E8E7EF] p-2.5 rounded-xl shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase text-[#68677A] block tracking-wider">Unique Members</span>
              <span className="text-base sm:text-lg font-black text-[#11112A]">{groupedAttendees.length}</span>
            </div>
            <div className="bg-white border border-[#E8E7EF] p-2.5 rounded-xl shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase text-[#68677A] block tracking-wider">Available</span>
              <span className="text-base sm:text-lg font-black text-[#10B981]">{remaining}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-[#11112A] mb-1.5">
            <span>Capacity Progress</span>
            <span className="text-[#5B4BFF]">{percentage}% Filled</span>
          </div>
          <div className="w-full bg-[#E8E7EF] rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#5B4BFF] via-[#7B61FF] to-[#9E8BFF] h-2.5 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Search Bar */}
        {groupedAttendees.length > 0 || searchQuery ? (
          <div className="mb-4 flex-shrink-0 relative">
            <input
              type="text"
              placeholder="Search attendee by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-[#FAF9FC] border border-[#E8E7EF] focus:border-[#5B4BFF] rounded-xl outline-none transition text-[#11112A] placeholder-[#9291A0]"
            />
            <span className="absolute left-3 top-3 text-xs text-[#9291A0]">🔍</span>
          </div>
        ) : null}

        {/* Attendee List Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-14 text-center text-[#68677A] text-xs font-medium">
              <span className="inline-block animate-spin text-2xl mb-2">⏳</span>
              <p>Loading attendee records...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-semibold text-center">
              {error}
            </div>
          ) : groupedAttendees.length === 0 ? (
            <div className="py-12 text-center text-[#68677A]">
              <div className="text-3xl mb-2">👥</div>
              <h4 className="text-sm font-bold text-[#11112A] mb-1">
                {searchQuery ? 'No matching attendees found' : 'No Attendees Registered Yet'}
              </h4>
              <p className="text-xs">
                {searchQuery
                  ? 'Try searching with a different name or email.'
                  : 'When members reserve tickets for this event, they will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupedAttendees.map((attendee, idx) => (
                <div
                  key={attendee.user_email || idx}
                  className="bg-white border border-[#E8E7EF] hover:border-[#5B4BFF]/50 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs hover:shadow-md transition-all duration-200"
                >
                  {/* Left: Avatar & User Details */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#5B4BFF] to-[#8075FF] text-white flex items-center justify-center text-base font-extrabold flex-shrink-0 shadow-sm shadow-[#5B4BFF]/20">
                      {attendee.user_name ? attendee.user_name.charAt(0).toUpperCase() : 'U'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h4 className="text-sm font-bold text-[#11112A] truncate">
                          {attendee.user_name}
                        </h4>
                        <span className="text-[10px] font-bold text-[#5B4BFF] bg-[#F1EEFF] px-2.5 py-0.5 rounded-full border border-[#E0D9FF] whitespace-nowrap">
                          🎟️ {attendee.ticket_count} {attendee.ticket_count === 1 ? 'Ticket' : 'Tickets'}
                        </span>
                      </div>
                      <p className="text-xs text-[#68677A] truncate font-medium">
                        ✉️ {attendee.user_email}
                      </p>
                      <p className="text-xs text-[#5B4BFF] truncate font-semibold mt-0.5 flex items-center gap-1">
                        <span>📞</span>
                        <span>{attendee.user_phone || 'No phone provided'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Ticket Numbers Range & Date */}
                  <div className="text-right flex-shrink-0">
                    <span className="text-[11px] font-bold text-[#5B4BFF] bg-[#F4F3F8] px-3 py-1 rounded-full border border-[#E8E7EF] inline-block whitespace-nowrap">
                      {formatTicketRange(attendee.ticket_numbers)}
                    </span>
                    <span className="text-[10px] text-[#9291A0] block mt-1 font-medium">
                      📅 {formatDate(attendee.first_booked_at || attendee.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-4 border-t border-[#F0EFF6] flex items-center justify-between flex-shrink-0">
          <span className="text-xs font-semibold text-[#68677A]">
            Showing {groupedAttendees.length} member{groupedAttendees.length === 1 ? '' : 's'}
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-[#5B4BFF] hover:bg-[#4C3CE6] text-white text-xs font-bold transition shadow-md shadow-[#5B4BFF]/25 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
