import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';
import {
  X,
  MapPin,
  Calendar,
  Building2,
  Ticket,
  HeartHandshake,
  Share2,
  CheckCircle2,
  Ban,
  Camera,
  Mail,
  Map as MapIcon,
  ExternalLink
} from 'lucide-react';
import CategoryBadge from './CategoryBadge';
import RegistrationModal from './RegistrationModal';
import EventMapModal from './EventMapModal';
import { useAuth } from '../context/AuthContext';
import { getCategoryDefaultImage } from '../utils/defaultCategoryImages';

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

export default function EventDetailsModal({
  isOpen,
  onClose,
  event,
  rsvpCount,
  interestedCount,
  hasMarkedInterested,
  onToggleInterest,
  onRsvpSuccess,
  isOwner,
  onOpenEdit,
  onOpenAttendees,
  onDeleteEvent,
}) {
  if (!isOpen || !event) return null;

  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ticketNotice, setTicketNotice] = useState(null);

  const { user, promptLoginForBooking } = useAuth();

  const totalTickets = event.total_tickets || 50;
  const currentRsvpCount = rsvpCount ?? event.rsvp_count ?? 0;
  const isSoldOut = currentRsvpCount >= totalTickets;
  const remainingTickets = Math.max(0, totalTickets - currentRsvpCount);
  const isCompleted = event.is_expired || (event.event_datetime && new Date(event.event_datetime) <= new Date());

  const displayImage = event.image_url || localStorage.getItem(`event_img_${event.id}`) || getCategoryDefaultImage(event.category);
  const districtLocation = event.district || event.city || event.neighborhood || 'Local';
  const organizerName = event.creator?.name || 'Community Event Host';
  const organizerEmail = event.creator?.email || 'contact@localbulletin.com';

  const lat = event.latitude ? parseFloat(event.latitude) : null;
  const lng = event.longitude ? parseFloat(event.longitude) : null;

  const googleMapsUrl = lat && lng
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${event.location}, ${event.city || event.neighborhood}, ${event.state}, ${event.country || 'India'}`
    )}`;

  const isEventHost = !!(user && (user.id === event.created_by || user.id === event.creator?.id));

  const handleRegisterClick = () => {
    if (isSoldOut || isCompleted) return;
    if (!user) {
      promptLoginForBooking(event);
      return;
    }
    if (isEventHost) {
      Swal.fire({
        title: 'Event Host Notice 👑',
        text: 'You are the creator and organizer of this event. Hosts cannot reserve tickets or register for their own events.',
        icon: 'info',
        confirmButtonColor: '#0F172A',
        customClass: { popup: 'rounded-3xl p-6 font-sans' },
      });
      return;
    }
    setIsRegistrationModalOpen(true);
  };

  const handleLocalRsvpSuccess = (eventId, newCount, ticketNumbers) => {
    if (ticketNumbers && ticketNumbers.length > 0) {
      setTicketNotice(`Pass #${ticketNumbers.join(', #')} Reserved!`);
      setTimeout(() => setTicketNotice(null), 5000);
    }
    if (onRsvpSuccess) {
      onRsvpSuccess(eventId, newCount, ticketNumbers);
    }
  };

  const handleCopyLink = () => {
    const appBaseUrl = (import.meta.env.VITE_APP_BASE_URL || window.location.origin).replace(/\/$/, '');
    const shareUrl = `${appBaseUrl}/event/${event.id}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch((err) => console.error('Failed to copy:', err));
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col my-auto">
        {/* Top Sticky Header Bar */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b border-[#E2E8F0] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0 flex-1">
            <CategoryBadge category={event.category} />
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-[#F1F5F9] text-[#0F172A] border-[#E2E8F0] whitespace-nowrap flex-shrink-0">
              {event.ticket_price > 0 ? `₹${event.ticket_price}` : 'FREE'}
            </span>
            <span className="text-xs font-bold text-[#0F172A] bg-[#F1F5F9] px-2.5 py-0.5 rounded-full border border-[#E2E8F0] inline-flex items-center gap-1 min-w-0 max-w-[95px] sm:max-w-[180px]">
              <MapPin className="w-3.5 h-3.5 text-[#2563EB] flex-shrink-0" />
              <span className="truncate">{districtLocation}</span>
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] flex items-center justify-center transition cursor-pointer font-bold flex-shrink-0 ml-1"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Banner Image */}
          {displayImage ? (
            <div className="w-full h-48 sm:h-52 rounded-2xl overflow-hidden border border-[#E2E8F0] relative bg-[#F1F5F9] shadow-sm">
              <img
                src={displayImage}
                alt={event.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="w-full h-36 rounded-2xl border border-[#E2E8F0] bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] flex flex-col items-center justify-center gap-1 text-[#64748B]">
              <Camera className="w-7 h-7 text-[#64748B]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#64748B]">No Image Available</span>
            </div>
          )}

          {/* Headline Title */}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight leading-snug mb-2">
              {event.title}
            </h2>

            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A] bg-[#F1F5F9] border border-[#E2E8F0] px-3.5 py-1.5 rounded-full inline-flex">
              <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>{formatEventDate(event.event_datetime)}</span>
            </div>
          </div>

          {/* Ticket Notice Banner */}
          {ticketNotice && (
            <div className="p-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-extrabold text-center flex items-center justify-center gap-2 shadow-md">
              <Ticket className="w-4 h-4 text-white" />
              <span>{ticketNotice}</span>
            </div>
          )}

          {/* Compact Availability Bar */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-3.5 flex items-center justify-between gap-3 font-sans">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-[#0F172A]" />
              <span className="text-xs font-black text-[#0F172A] uppercase tracking-wider">Ticket Availability</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#0F172A] bg-white border border-[#E2E8F0] px-3 py-1 rounded-full shadow-2xs">
                {remainingTickets} of {totalTickets} Tickets Left
              </span>
              {isCompleted ? (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-black">Completed</span>
              ) : isSoldOut ? (
                <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] font-black">Sold Out</span>
              ) : remainingTickets <= 5 ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black">Few Left</span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">Open</span>
              )}
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">About This Event</h3>
            <p className="text-[#0F172A] text-xs leading-relaxed whitespace-pre-line font-medium bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-2xl">
              {event.description || 'No detailed description provided for this event.'}
            </p>
          </div>

          {/* Venue & Location Section with Map Buttons */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-[#0F172A]" />
              <span>Venue & Location</span>
            </h3>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-2xl space-y-2.5">
              <div className="text-sm font-black text-[#0F172A]">{event.location}</div>
              <div className="text-xs font-bold text-[#64748B]">
                {event.neighborhood}, {event.city}, {event.state}, {event.country}
              </div>

              {/* Map Action Buttons Bar */}
              <div className="pt-1 flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-extrabold text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <MapIcon className="w-3.5 h-3.5 text-white" />
                  <span>Open Interactive Map</span>
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
          </div>

          {/* Organizer Info */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-black text-xs flex-shrink-0 shadow-md">
                {organizerName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-[9px] text-[#64748B] font-extrabold uppercase tracking-wider">Host / Organizer</div>
                <h4 className="text-xs font-bold text-[#0F172A] truncate">{organizerName}</h4>
              </div>
            </div>

            <a
              href={`mailto:${organizerEmail}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-full bg-white text-[#0F172A] hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1 border border-[#E2E8F0] flex-shrink-0 cursor-pointer shadow-2xs"
            >
              <Mail className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Contact Host</span>
            </a>
          </div>
        </div>

        {/* Bottom Action Footer Bar */}
        <div className="p-4 sm:p-5 border-t border-[#E2E8F0] bg-white sticky bottom-0 z-10 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary Register Button */}
            {isEventHost ? (
              <button
                onClick={() => {
                  Swal.fire({
                    title: 'Event Host Notice 👑',
                    text: 'You are the creator and organizer of this event. Hosts cannot reserve tickets or register for their own events.',
                    icon: 'info',
                    confirmButtonColor: '#0F172A',
                    customClass: { popup: 'rounded-3xl p-6 font-sans' },
                  });
                }}
                className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs border border-slate-300 flex items-center gap-1.5 cursor-pointer hover:bg-slate-200 transition"
              >
                <span>👑</span>
                <span>You Are The Host</span>
              </button>
            ) : isCompleted ? (
              <button
                disabled
                className="px-4 py-2 rounded-full bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed border border-slate-200 flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Event Completed</span>
              </button>
            ) : isSoldOut ? (
              <button
                disabled
                className="px-4 py-2 rounded-full bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed border border-slate-200 flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Sold Out</span>
              </button>
            ) : (
              <button
                onClick={handleRegisterClick}
                className="px-5 py-2 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-extrabold text-xs transition flex items-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Ticket className="w-3.5 h-3.5 text-white" />
                <span>Reserve Pass ({event.ticket_price > 0 ? `₹${event.ticket_price}` : 'FREE'})</span>
              </button>
            )}

            {/* I'm Going Button */}
            <button
              onClick={isCompleted ? undefined : onToggleInterest}
              disabled={isCompleted}
              className={`px-3.5 py-2 rounded-full font-bold text-xs transition flex items-center gap-1.5 border ${isCompleted
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : hasMarkedInterested
                    ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-md cursor-pointer'
                    : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] border-[#E2E8F0] cursor-pointer'
                }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Going ({interestedCount})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Share Button */}
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-full bg-white hover:bg-slate-50 text-[#0F172A] text-xs font-bold border border-[#E2E8F0] transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-[#2563EB]" />}
              <span>{copied ? 'Copied!' : 'Share Event'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        event={event}
        onRsvpSuccess={handleLocalRsvpSuccess}
      />

      {/* Full Interactive Location Map Modal */}
      <EventMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        event={event}
      />
    </div>,
    document.body
  );
}
