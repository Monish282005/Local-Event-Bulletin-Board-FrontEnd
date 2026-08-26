import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import axiosClient from '../api/axiosClient';

function formatEventDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export default function RegistrationModal({ isOpen, onClose, event, onRsvpSuccess }) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !event) return null;

  const totalTickets = event.total_tickets || 50;
  const rsvpCount = event.rsvp_count || 0;
  const remainingTickets = Math.max(0, totalTickets - rsvpCount);
  const maxAllowed = Math.min(10, remainingTickets);

  const organizerName = event.creator?.name || 'Community Event Host';
  const organizerEmail = event.creator?.email || 'contact@localbulletin.com';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axiosClient.post(`/api/events/${event.id}/rsvp`, {
        ticket_quantity: quantity,
      });

      const newCount = response.data.rsvp_count;
      const ticketNumbers = response.data.ticket_numbers || [response.data.ticket_number];

      if (onRsvpSuccess) {
        onRsvpSuccess(event.id, newCount, ticketNumbers);
      }
      onClose();
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-[#E8E7EF] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto text-[#11112A]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-[#68677A] hover:text-[#11112A] hover:bg-[#F4F3F8] rounded-full text-base transition font-semibold"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1EEFF] text-[#5B4BFF] text-xs font-bold mb-2">
            <span>🎟️</span>
            <span>Event Registration</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#11112A] tracking-tight mb-1 leading-snug">
            {event.title}
          </h2>
          <div className="flex items-center gap-2 text-xs text-[#68677A] mt-2">
            <span>📅 {formatEventDate(event.event_datetime)}</span>
          </div>
        </div>

        {/* Organizer Banner Card */}
        <div className="bg-[#F8F7FC] border border-[#E8E7EF] rounded-2xl p-4 mb-6 relative overflow-hidden">
          <div className="text-[10px] font-extrabold text-[#5B4BFF] uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>👑</span>
            <span>Event Organizer Contact</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#5B4BFF] to-[#8075FF] text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
              {organizerName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#11112A] truncate">{organizerName}</h4>
              <a
                href={`mailto:${organizerEmail}`}
                className="text-xs font-medium text-[#5B4BFF] hover:underline flex items-center gap-1 truncate"
              >
                <span>✉️</span>
                <span className="truncate">{organizerEmail}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Event Location Summary */}
        <div className="mb-6 space-y-2 text-xs text-[#68677A] bg-[#FAFAFC] p-3 rounded-xl border border-[#E8E7EF]/60">
          <div className="flex items-center gap-2 font-medium">
            <span>📍</span>
            <span>Neighborhood: <strong>{event.neighborhood}</strong>, {event.city}</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <span>🏢</span>
            <span>Address: {event.location}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ticket Quantity Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-[#11112A]">Select Number of Tickets *</label>
              <span className="text-xs font-semibold text-[#5B4BFF]">
                {remainingTickets} Tickets Available
              </span>
            </div>

            <div className="flex items-center justify-between bg-[#F4F3F8] border border-[#E8E7EF] rounded-2xl p-3">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-10 h-10 rounded-xl bg-white border border-[#E8E7EF] text-[#11112A] hover:bg-[#F1EEFF] hover:border-[#5B4BFF] font-bold text-lg flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              >
                -
              </button>

              <div className="text-center">
                <span className="text-xl font-extrabold text-[#11112A] block leading-none">{quantity}</span>
                <span className="text-[10px] text-[#68677A] font-medium">
                  {quantity === 1 ? 'Ticket' : 'Tickets'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setQuantity(Math.min(maxAllowed, quantity + 1))}
                disabled={quantity >= maxAllowed}
                className="w-10 h-10 rounded-xl bg-white border border-[#E8E7EF] text-[#11112A] hover:bg-[#F1EEFF] hover:border-[#5B4BFF] font-bold text-lg flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              >
                +
              </button>
            </div>
          </div>

          {/* Registration Summary & Action */}
          <div className="pt-2 border-t border-[#F0EFF6] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-[#E8E7EF] text-[#68677A] hover:text-[#11112A] hover:bg-[#F4F3F8] font-semibold text-xs transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || remainingTickets === 0}
              className="px-6 py-2.5 rounded-full bg-[#5B4BFF] hover:bg-[#4C3CE6] active:bg-[#3F2FD1] text-white font-semibold text-xs transition shadow-md shadow-[#5B4BFF]/20 disabled:opacity-50 flex items-center gap-2"
            >
              <span>{loading ? '⏳' : '🙌'}</span>
              <span>{loading ? 'Confirming...' : `Confirm Registration (${quantity} ${quantity === 1 ? 'Ticket' : 'Tickets'})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
