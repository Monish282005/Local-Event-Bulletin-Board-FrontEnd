import React, { useState, useEffect } from 'react';
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

export default function AttendeesModal({ isOpen, onClose, eventId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && eventId) {
      setLoading(true);
      setError(null);
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

  if (!isOpen) return null;

  const totalTickets = data?.total_tickets || 50;
  const rsvpCount = data?.rsvp_count || 0;
  const remaining = Math.max(0, totalTickets - rsvpCount);
  const percentage = Math.min(100, Math.round((rsvpCount / totalTickets) * 100));

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-[#E8E7EF] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto text-[#11112A]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-[#68677A] hover:text-[#11112A] hover:bg-[#F4F3F8] rounded-full text-base transition font-semibold"
        >
          ✕
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1EEFF] text-[#5B4BFF] text-xs font-bold mb-2">
            <span>🎟️</span>
            <span>Registered Attendees</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#11112A] mb-1 line-clamp-1">
            {data?.title || 'Event Attendees'}
          </h2>
          <p className="text-[#68677A] text-xs">
            List of members who registered and claimed tickets for your event.
          </p>
        </div>

        {/* Capacity Summary Stats */}
        <div className="bg-[#F4F3F8] border border-[#E8E7EF] rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between text-xs font-bold text-[#11112A] mb-2">
            <span>Capacity Progress</span>
            <span>{rsvpCount} / {totalTickets} Tickets Claimed ({remaining} Available)</span>
          </div>
          <div className="w-full bg-[#E8E7EF] rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#5B4BFF] to-[#8075FF] h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[#68677A] text-xs font-medium">
            <span className="inline-block animate-spin text-xl mb-2">⏳</span>
            <p>Loading registered attendees list...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-semibold text-center">
            {error}
          </div>
        ) : data?.attendees?.length === 0 ? (
          <div className="py-10 text-center text-[#68677A]">
            <div className="text-3xl mb-2">👥</div>
            <h4 className="text-sm font-bold text-[#11112A] mb-1">No Attendees Registered Yet</h4>
            <p className="text-xs">When users click "I'm Going", their ticket registration will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {data.attendees.map((attendee) => (
              <div
                key={attendee.id}
                className="bg-white border border-[#E8E7EF] hover:border-[#5B4BFF]/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    #{attendee.ticket_number}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#11112A] truncate">{attendee.user_name}</h4>
                    <p className="text-[11px] text-[#68677A] truncate">{attendee.user_email}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[10px] font-semibold text-[#5B4BFF] bg-[#F1EEFF] px-2.5 py-1 rounded-full border border-[#E0D9FF] block">
                    Ticket #{attendee.ticket_number}
                  </span>
                  <span className="text-[10px] text-[#9291A0] block mt-1">
                    {formatDate(attendee.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-[#F0EFF6] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-[#5B4BFF] hover:bg-[#4C3CE6] text-white text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
