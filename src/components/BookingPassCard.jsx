import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Building2, Ticket, Mail, FileText, Trash2, Ban } from 'lucide-react';
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

  // Single district/city location name (e.g. Coimbatore instead of Coimbatore, Coimbatore)
  const districtLocation = event.district || event.city || event.neighborhood || 'Local';

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
        confirmButtonColor: '#0F0F14',
        customClass: {
          popup: 'rounded-3xl p-6 font-sans',
          confirmButton: 'px-6 py-2.5 rounded-full text-xs font-bold shadow-md',
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
        confirmButtonColor: '#0F0F14',
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
      <div className="bg-white border border-[#E8E7EF] rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-900/5 hover:shadow-2xl transition-all duration-300 flex flex-col font-sans relative group overflow-hidden space-y-4">
        {/* Top Header & Event Information */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <CategoryBadge category={event.category} />
            <span className="text-xs font-bold text-[#0F0F14] bg-[#F4F3F8] px-3 py-1 rounded-full border border-[#E8E7EF] flex items-center gap-1 truncate max-w-[150px] whitespace-nowrap">
              <MapPin className="w-3 h-3 text-[#0F0F14]" />
              <span className="truncate">{districtLocation}</span>
            </span>
          </div>

          <h3 className="text-xl font-black text-[#0F0F14] hover:text-black transition duration-150 tracking-tight leading-snug truncate">
            <Link to={`/event/${event.id}`}>
              {event.title}
            </Link>
          </h3>

          <div className="text-xs font-bold text-[#0F0F14] bg-[#F4F3F8] border border-[#E8E7EF] px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 text-[#0F0F14]" />
            <span>{formatEventDate(event.event_datetime)}</span>
          </div>

          <p className="text-[#555468] text-xs line-clamp-2 leading-relaxed font-medium">
            {event.description}
          </p>

          <div className="text-xs text-[#68677A] font-bold flex items-center gap-1.5 truncate">
            <Building2 className="w-3.5 h-3.5 text-[#68677A]" />
            <span className="truncate">Venue: {event.location}</span>
          </div>
        </div>

        {/* Compact Border Separator & Booking Stub (No whitespace gap stretch) */}
        <div className="pt-4 border-t border-[#F0EFF6] space-y-3.5">
          {/* Organizer Banner */}
          <div className="bg-[#F4F3F8] border border-[#E8E7EF] rounded-2xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#0F0F14] text-white flex items-center justify-center font-black text-xs flex-shrink-0">
                {organizerName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-[9px] text-[#68677A] font-extrabold uppercase tracking-wider">Host / Organizer</div>
                <h4 className="text-xs font-bold text-[#0F0F14] truncate">{organizerName}</h4>
              </div>
            </div>

            <a
              href={`mailto:${organizerEmail}`}
              className="px-3 py-1.5 rounded-full bg-white text-[#0F0F14] hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1 border border-[#E8E7EF] flex-shrink-0 cursor-pointer"
              title="Contact Event Host"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Contact</span>
            </a>
          </div>

          {/* Ticket Badges & Summary */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[9px] font-black text-[#68677A] uppercase tracking-wider mb-1">
                Your Booking Status
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-white bg-[#0F0F14] px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-white" />
                  <span>{total_user_tickets} {total_user_tickets === 1 ? 'Ticket' : 'Tickets'} Reserved</span>
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[9px] text-[#68677A] font-bold uppercase">Booked on</div>
              <div className="text-xs font-bold text-[#0F0F14]">{formatDate(booked_at)}</div>
            </div>
          </div>

          {/* Individual Ticket Numbers (Horizontal Scrollbar for Many Passes) */}
          <div>
            <span className="text-[10px] text-[#68677A] font-bold block mb-1 uppercase tracking-wider">
              Issued Ticket Pass IDs ({ticket_numbers.length}):
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-1 scrollbar-thin">
              {ticket_numbers.map((tNum) => (
                <span
                  key={tNum}
                  className="px-2.5 py-1 rounded-full bg-[#F4F3F8] text-[#0F0F14] border border-[#E8E7EF] text-xs font-bold tracking-wide flex-shrink-0 whitespace-nowrap"
                >
                  Pass #{tNum}
                </span>
              ))}
            </div>
          </div>

          {/* Invoice & Cancellation Action Buttons */}
          <div className="pt-3 border-t border-[#F0EFF6] flex items-center gap-2">
            <button
              onClick={() => setShowInvoice(true)}
              className="flex-1 py-2 rounded-full bg-[#0F0F14] hover:bg-black text-white font-extrabold text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Invoice</span>
            </button>

            {canCancel ? (
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="px-4 py-2 rounded-full bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-[#E8E7EF] hover:border-red-200 font-bold text-xs transition flex items-center justify-center gap-1 shadow-2xs disabled:opacity-50 cursor-pointer whitespace-nowrap"
                title="Cancel Booking"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{cancelling ? '...' : 'Cancel'}</span>
              </button>
            ) : (
              <div
                className="px-3 py-2 rounded-full bg-[#F4F3F8] text-[#68677A] border border-[#E8E7EF] font-bold text-xs text-center flex items-center justify-center gap-1"
                title="Non-cancellable pass"
              >
                <Ban className="w-3.5 h-3.5" />
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
