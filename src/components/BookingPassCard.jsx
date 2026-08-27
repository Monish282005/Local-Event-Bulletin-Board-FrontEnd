import React, { useState } from 'react';
import { MapPin, Calendar, Ticket, FileText, Trash2, Ban, Eye } from 'lucide-react';
import Swal from 'sweetalert2';
import CategoryBadge from './CategoryBadge';
import axiosClient from '../api/axiosClient';
import InvoiceModal from './InvoiceModal';
import BookingDetailsModal from './BookingDetailsModal';

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

export default function BookingPassCard({ booking, onBookingCancelled }) {
  const {
    event,
    total_user_tickets,
    ticket_numbers = [],
    booked_at,
    payment_id,
    order_id,
    total_amount_paid,
  } = booking;

  const [cancelling, setCancelling] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  if (!event) return null;

  const canCancel = event.allow_cancellation !== false;
  const districtLocation = event.district || event.city || event.neighborhood || 'Local';
  const isCompleted = event.is_expired || (event.event_datetime && new Date(event.event_datetime) <= new Date());

  const handleCancelBooking = async (e) => {
    if (e) e.stopPropagation();
    if (!canCancel || cancelling || isCompleted) return;

    const result = await Swal.fire({
      title: 'Cancel Booking Pass?',
      text: `Are you sure you want to cancel your ${total_user_tickets} reserved ${total_user_tickets === 1 ? 'ticket' : 'tickets'} for "${event.title}"? Seats will be returned to available inventory.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
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
        confirmButtonColor: '#0F172A',
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
        confirmButtonColor: '#0F172A',
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
      {/* Compact Essential Dashboard Pass Card */}
      <div
        onClick={() => setShowDetailsModal(true)}
        className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between font-sans relative group cursor-pointer space-y-3"
      >
        {/* Top Badges Row: Category & City Location */}
        <div className="flex items-center justify-between gap-2">
          <CategoryBadge category={event.category} />
          <span className="text-xs font-bold text-[#0F172A] bg-[#F1F5F9] px-2.5 py-0.5 rounded-full border border-[#E2E8F0] flex items-center gap-1 truncate max-w-[130px] whitespace-nowrap">
            <MapPin className="w-3 h-3 text-[#0F172A]" />
            <span className="truncate">{districtLocation}</span>
          </span>
        </div>

        {/* Event Title */}
        <h3 className="text-lg font-black text-[#0F172A] group-hover:underline transition duration-150 tracking-tight leading-snug truncate">
          {event.title}
        </h3>

        {/* Date & Time Pill */}
        <div>
          <div className="text-xs font-bold text-[#0F172A] bg-[#F1F5F9] border border-[#E2E8F0] px-3 py-1 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 text-[#0F172A]" />
            <span>{formatEventDate(event.event_datetime)}</span>
          </div>
        </div>

        {/* Reserved Ticket Pass Summary Pill */}
        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold text-white bg-[#0F172A] px-3 py-1 rounded-full shadow-2xs flex items-center gap-1.5">
            <Ticket className="w-3.5 h-3.5 text-white" />
            <span>{total_user_tickets} {total_user_tickets === 1 ? 'Pass' : 'Passes'} Reserved</span>
          </span>

          {isCompleted && (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
              Completed
            </span>
          )}
        </div>

        {/* Primary Action Button: View Details Modal */}
        <div className="pt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowDetailsModal(true);
            }}
            className="flex-1 py-2 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-extrabold text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-white" />
            <span>View Pass Details</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowInvoice(true);
            }}
            className="p-2 rounded-full bg-white hover:bg-slate-50 text-[#0F172A] border border-[#E2E8F0] transition cursor-pointer shadow-2xs"
            title="View Invoice Receipt"
          >
            <FileText className="w-4 h-4 text-[#0F172A]" />
          </button>

          {canCancel && !isCompleted && (
            <button
              type="button"
              onClick={handleCancelBooking}
              disabled={cancelling}
              className="p-2 rounded-full bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-[#E2E8F0] transition cursor-pointer shadow-2xs disabled:opacity-50"
              title="Cancel Booking Pass"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Full Details Modal */}
      {showDetailsModal && (
        <BookingDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          booking={booking}
          onCancelBooking={handleCancelBooking}
          cancelling={cancelling}
        />
      )}

      {/* Invoice Modal */}
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
