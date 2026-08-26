import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import CategoryBadge from './CategoryBadge';
import axiosClient from '../api/axiosClient';
import InvoiceModal from './InvoiceModal';

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

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export default function BookingPassCard({ booking, onBookingCancelled }) {
  const {
    event,
    total_user_tickets,
    ticket_numbers,
    booked_at,
    payment_id,
    order_id,
    amount_paid,
    total_amount_paid,
  } = booking;

  const [cancelling, setCancelling] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  if (!event) return null;

  const organizerName = event.creator?.name || 'Community Event Host';
  const organizerEmail = event.creator?.email || 'contact@localbulletin.com';
  const canCancel = event.allow_cancellation !== false;

  const handleCancelBooking = async () => {
    if (!canCancel || cancelling) return;

    const result = await Swal.fire({
      title: 'Cancel Booking Pass?',
      text: `Are you sure you want to cancel your ${total_user_tickets} reserved ${total_user_tickets === 1 ? 'ticket' : 'tickets'} for "${event.title}"? Seats will be returned to available inventory.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#68677A',
      confirmButtonText: 'Yes, Cancel Pass',
      cancelButtonText: 'Keep Pass',
      customClass: {
        popup: 'rounded-3xl p-6 font-sans',
        confirmButton: 'px-5 py-2.5 rounded-full text-xs font-bold shadow-md',
        cancelButton: 'px-5 py-2.5 rounded-full text-xs font-bold',
      },
    });

    if (!result.isConfirmed) return;

    setCancelling(true);
    try {
      const response = await axiosClient.delete(`/api/events/${event.id}/rsvp`);

      await Swal.fire({
        title: 'Pass Cancelled!',
        text: response.data.message || 'Your ticket booking pass has been cancelled and seats restored.',
        icon: 'success',
        confirmButtonColor: '#5B4BFF',
        customClass: {
          popup: 'rounded-3xl p-6 font-sans',
          confirmButton: 'px-6 py-2.5 rounded-full text-xs font-bold shadow-md shadow-[#5B4BFF]/25',
        },
      });

      if (onBookingCancelled) {
        onBookingCancelled(event.id, response.data.rsvp_count);
      }
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      Swal.fire({
        title: 'Cancellation Error',
        text: err.response?.data?.error || 'Failed to cancel booking pass.',
        icon: 'error',
        confirmButtonColor: '#5B4BFF',
        customClass: {
          popup: 'rounded-3xl p-6 font-sans',
          confirmButton: 'px-6 py-2.5 rounded-full text-xs font-bold',
        },
      });
    } finally {
      setCancelling(false);
    }
  };

  const invoiceData = {
    event,
    ticket_numbers,
    quantity_registered: total_user_tickets,
    payment_id: payment_id || 'FREE_EVENT',
    order_id: order_id || 'ORD_FREE',
    total_amount_paid: total_amount_paid || ((event.ticket_price || 0) * total_user_tickets),
    booked_at,
  };

  return (
    <>
      <div className="bg-white border border-[#E8E7EF] hover:border-[#5B4BFF]/40 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group">
        {/* Top Header & Event Information */}
        <div className="p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <CategoryBadge category={event.category} />
            <span className="text-xs font-semibold text-[#68677A] bg-[#F4F3F8] px-3 py-1 rounded-full border border-[#E8E7EF]">
              📍 {event.neighborhood}, {event.city}
            </span>
          </div>

          <h3 className="text-xl font-bold text-[#11112A] group-hover:text-[#5B4BFF] transition leading-snug mb-3">
            <Link to={`/event/${event.id}`}>
              {event.title}
            </Link>
          </h3>

          <div className="text-xs font-semibold text-[#5B4BFF] bg-[#F1EEFF] px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-4 border border-[#E0D9FF]">
            <span>📅</span>
            <span>{formatEventDate(event.event_datetime)}</span>
          </div>

          <p className="text-[#68677A] text-sm line-clamp-2 leading-relaxed mb-4">
            {event.description}
          </p>

          <div className="text-xs text-[#9291A0] font-medium flex items-center gap-1.5 truncate">
            <span>🏢</span>
            <span className="truncate">Venue: {event.location}</span>
          </div>
        </div>

        {/* Dotted Ticket Divider */}
        <div className="relative flex items-center my-1">
          <div className="w-4 h-8 bg-[#FAFAFC] rounded-r-full border-r border-t border-b border-[#E8E7EF] -ml-0.5"></div>
          <div className="flex-1 border-b-2 border-dashed border-[#E8E7EF] mx-1"></div>
          <div className="w-4 h-8 bg-[#FAFAFC] rounded-l-full border-l border-t border-b border-[#E8E7EF] -mr-0.5"></div>
        </div>

        {/* Ticket Pass Stub Footer */}
        <div className="p-6 bg-[#FAF9FE] space-y-4">
          {/* Organizer Banner */}
          <div className="bg-white border border-[#E8E7EF] rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#5B4BFF] to-[#8075FF] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                {organizerName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-[#9291A0] font-bold uppercase tracking-wider">Host / Organizer</div>
                <h4 className="text-xs font-bold text-[#11112A] truncate">{organizerName}</h4>
              </div>
            </div>

            <a
              href={`mailto:${organizerEmail}`}
              className="px-3 py-1.5 rounded-full bg-[#F1EEFF] text-[#5B4BFF] hover:bg-[#5B4BFF] hover:text-white text-xs font-bold transition flex items-center gap-1 border border-[#E0D9FF] flex-shrink-0"
              title="Contact Event Host"
            >
              <span>✉️</span>
              <span className="hidden sm:inline">Contact</span>
            </a>
          </div>

          {/* Ticket Badges & Summary */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div>
              <div className="text-[10px] font-extrabold text-[#5B4BFF] uppercase tracking-wider mb-1">
                Your Booking Status
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-[#11112A] bg-white border border-[#E8E7EF] px-3 py-1 rounded-xl shadow-xs">
                  🎟️ {total_user_tickets} {total_user_tickets === 1 ? 'Ticket' : 'Tickets'} Reserved
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-[#9291A0] font-medium">Booked on</div>
              <div className="text-xs font-bold text-[#68677A]">{formatDate(booked_at)}</div>
            </div>
          </div>

          {/* Individual Ticket Numbers */}
          <div>
            <span className="text-[10px] text-[#9291A0] font-semibold block mb-1.5">Issued Ticket Pass IDs:</span>
            <div className="flex flex-wrap gap-1.5">
              {ticket_numbers.map((tNum) => (
                <span
                  key={tNum}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold tracking-wide"
                >
                  Pass #{tNum}
                </span>
              ))}
            </div>
          </div>

          {/* Invoice & Cancellation Action Buttons */}
          <div className="pt-2 border-t border-[#E8E7EF]/80 flex flex-col sm:flex-row items-center gap-2">
            <button
              onClick={() => setShowInvoice(true)}
              className="w-full sm:flex-1 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4C3CE6] text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>🧾</span>
              <span>View / Download Invoice</span>
            </button>

            {canCancel ? (
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="w-full sm:w-auto px-3 py-2 rounded-xl bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-red-200 font-bold text-xs transition flex items-center justify-center gap-1 shadow-xs disabled:opacity-50"
                title="Cancel Booking"
              >
                <span>🗑️</span>
                <span className="hidden sm:inline">{cancelling ? '...' : 'Cancel'}</span>
              </button>
            ) : (
              <div
                className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 font-bold text-xs text-center flex items-center justify-center gap-1"
                title="Non-cancellable pass"
              >
                <span>🚫</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showInvoice && (
        <InvoiceModal
          isOpen={showInvoice}
          onClose={() => setShowInvoice(false)}
          invoiceData={invoiceData}
        />
      )}
    </>
  );
}
