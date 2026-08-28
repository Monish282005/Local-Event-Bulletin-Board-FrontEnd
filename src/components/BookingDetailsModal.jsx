import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MapPin,
  Calendar,
  Building2,
  Ticket,
  Mail,
  FileText,
  Trash2,
  Ban,
  Camera,
  ShieldCheck,
  CreditCard,
  Map as MapIcon,
  ExternalLink
} from 'lucide-react';
import CategoryBadge from './CategoryBadge';
import InvoiceModal from './InvoiceModal';
import EventMapModal from './EventMapModal';

function formatEventDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
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
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function BookingDetailsModal({
  isOpen,
  onClose,
  booking,
  onCancelBooking,
  cancelling
}) {
  const [showInvoice, setShowInvoice] = useState(false);
  const [showMap, setShowMap] = useState(false);

  if (!isOpen || !booking) return null;

  const {
    event,
    total_user_tickets,
    ticket_numbers = [],
    booked_at,
    payment_id,
    order_id,
    total_amount_paid,
  } = booking;

  if (!event) return null;

  const organizerName = event.creator?.name || 'Community Event Host';
  const organizerEmail = event.creator?.email || 'contact@localbulletin.com';
  const canCancel = event.allow_cancellation !== false;
  const districtLocation = event.district || event.city || event.neighborhood || 'Local';
  const displayImage = event.image_url || localStorage.getItem(`event_img_${event.id}`);

  const isCompleted = event.is_expired || (event.event_datetime && new Date(event.event_datetime) <= new Date());

  const invoiceData = {
    event,
    ticket_numbers,
    quantity_registered: total_user_tickets,
    payment_id: payment_id || 'FREE_EVENT',
    order_id: order_id || 'ORD_FREE',
    total_amount_paid: total_amount_paid || ((event.ticket_price || 0) * total_user_tickets),
    booked_at,
  };

  const lat = event.latitude ? parseFloat(event.latitude) : null;
  const lng = event.longitude ? parseFloat(event.longitude) : null;
  const googleMapsUrl = lat && lng
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${event.location}, ${event.city || event.neighborhood}, ${event.state}, ${event.country || 'India'}`
    )}`;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm font-sans">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col my-auto text-[#0F172A]">
        {/* Modal Sticky Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E2E8F0] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <CategoryBadge category={event.category} />
            <span className="text-xs font-bold text-[#0F172A] bg-[#F1F5F9] px-2.5 py-0.5 rounded-full border border-[#E2E8F0] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>{districtLocation}</span>
            </span>
            {isCompleted && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                Completed
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] flex items-center justify-center transition cursor-pointer font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Event Image */}
          {displayImage ? (
            <div className="w-full h-48 sm:h-52 rounded-2xl overflow-hidden border border-[#E2E8F0] relative bg-[#F1F5F9] shadow-xs">
              <img src={displayImage} alt={event.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full h-36 rounded-2xl border border-[#E2E8F0] bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] flex flex-col items-center justify-center gap-1 text-[#64748B]">
              <Camera className="w-7 h-7 text-[#64748B]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#64748B]">No Banner Image</span>
            </div>
          )}

          {/* Title & Date */}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight leading-snug mb-2">
              {event.title}
            </h2>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A] bg-[#F1F5F9] border border-[#E2E8F0] px-3.5 py-1.5 rounded-full inline-flex">
              <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>{formatEventDate(event.event_datetime)}</span>
            </div>
          </div>

          {/* Issued Ticket Passes Grid */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#2563EB]" />
                <span className="text-xs font-black text-[#0F172A] uppercase tracking-wider">Reserved Passes</span>
              </div>
              <span className="text-xs font-extrabold text-white bg-[#2563EB] px-3 py-1 rounded-full shadow-2xs">
                {total_user_tickets} {total_user_tickets === 1 ? 'Pass' : 'Passes'} Reserved
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {ticket_numbers.map((tNum) => (
                <span
                  key={tNum}
                  className="px-3 py-1 rounded-full bg-white text-[#0F172A] border border-[#E2E8F0] text-xs font-bold font-mono shadow-2xs"
                >
                  Pass #{tNum}
                </span>
              ))}
            </div>
          </div>

          {/* Booking Summary Box */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 space-y-2 text-xs">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-[#64748B] mb-1">Reservation Info</h3>
            <div className="flex justify-between">
              <span className="text-[#64748B] font-bold">Booking Date</span>
              <span className="font-bold text-[#0F172A]">{formatDate(booked_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B] font-bold">Order ID</span>
              <span className="font-mono font-bold text-[#0F172A]">{order_id || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B] font-bold">Payment ID</span>
              <span className="font-mono font-bold text-[#0F172A]">{payment_id || 'FREE_EVENT'}</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Event Details</h3>
            <p className="text-[#0F172A] text-xs leading-relaxed whitespace-pre-line font-medium bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-2xl">
              {event.description || 'No detailed description available.'}
            </p>
          </div>

          {/* Location & Map Buttons */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-2xl space-y-2.5">
            <div className="text-xs font-black text-[#0F172A] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#0F172A]" />
              <span>Venue: {event.location}</span>
            </div>
            <div className="text-xs font-bold text-[#64748B]">
              {event.neighborhood}, {event.city}, {event.state}, {event.country}
            </div>

            <div className="pt-1 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowMap(true)}
                className="px-3.5 py-1.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-extrabold text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <MapIcon className="w-3.5 h-3.5 text-white" />
                <span>Open Map</span>
              </button>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-[#0F172A] font-bold text-xs transition flex items-center gap-1.5 border border-[#E2E8F0] cursor-pointer shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#0F172A]" />
                <span>Google Maps Directions</span>
              </a>
            </div>
          </div>

          {/* Organizer Info */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-black text-xs shadow-md">
                {organizerName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-[9px] text-[#64748B] font-extrabold uppercase tracking-wider">Host</div>
                <h4 className="text-xs font-bold text-[#0F172A] truncate">{organizerName}</h4>
              </div>
            </div>

            <a
              href={`mailto:${organizerEmail}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-full bg-white text-[#0F172A] hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1 border border-[#E2E8F0] cursor-pointer shadow-2xs"
            >
              <Mail className="w-3.5 h-3.5 text-[#0F172A]" />
              <span>Contact</span>
            </a>
          </div>
        </div>

        {/* Modal Sticky Bottom Actions Bar */}
        <div className="p-4 sm:p-5 border-t border-[#E2E8F0] bg-white sticky bottom-0 z-10 flex items-center justify-between gap-2 flex-wrap">
          <button
            onClick={() => setShowInvoice(true)}
            className="px-5 py-2.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-extrabold text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <FileText className="w-4 h-4 text-white" />
            <span>View Receipt & Invoice</span>
          </button>

          {canCancel && !isCompleted ? (
            <button
              onClick={onCancelBooking}
              disabled={cancelling}
              className="px-4 py-2.5 rounded-full bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-[#E2E8F0] hover:border-red-200 font-bold text-xs transition flex items-center gap-1 shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{cancelling ? 'Cancelling...' : 'Cancel Booking'}</span>
            </button>
          ) : (
            <div className="px-3.5 py-2 rounded-full bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] font-bold text-xs flex items-center gap-1">
              <Ban className="w-3.5 h-3.5" />
              <span>Non-Cancellable</span>
            </div>
          )}
        </div>
      </div>

      {showInvoice && (
        <InvoiceModal
          isOpen={showInvoice}
          onClose={() => setShowInvoice(false)}
          invoiceData={invoiceData}
        />
      )}

      {showMap && (
        <EventMapModal
          isOpen={showMap}
          onClose={() => setShowMap(false)}
          event={event}
        />
      )}
    </div>,
    document.body
  );
}
