import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  MapPin,
  Users,
  Edit3,
  Trash2,
  Calendar,
  Building2,
  Ticket,
  HeartHandshake,
  Share2,
  CheckCircle2,
  Ban,
  Map
} from 'lucide-react';
import Swal from 'sweetalert2';
import axiosClient from '../api/axiosClient';
import CategoryBadge from './CategoryBadge';
import EditEventModal from './EditEventModal';
import AttendeesModal from './AttendeesModal';
import RegistrationModal from './RegistrationModal';
import EventMapModal from './EventMapModal';
import { useAuth } from '../context/AuthContext';

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

export default function EventCard({
  event,
  showOwnerControls = false,
  onRsvpUpdate,
  onEventUpdated,
  onEventDeleted
}) {
  const [rsvpCount, setRsvpCount] = useState(event.rsvp_count || 0);
  const [interestedCount, setInterestedCount] = useState(event.interested_count || 0);
  const [hasMarkedInterested, setHasMarkedInterested] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ticketNotice, setTicketNotice] = useState(null);

  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const { user, promptLoginForBooking } = useAuth();
  const isOwner = showOwnerControls && !!(user && event.created_by && user.id === event.created_by);

  const totalTickets = event.total_tickets || 50;
  const isSoldOut = rsvpCount >= totalTickets;
  const remainingTickets = Math.max(0, totalTickets - rsvpCount);

  // Retrieve image from event object or localStorage fallback
  const displayImage = event.image_url || localStorage.getItem(`event_img_${event.id}`);

  // Sync user interest state per event
  React.useEffect(() => {
    if (user && user.id && event.id) {
      const isSet = localStorage.getItem(`user_interested_${user.id}_${event.id}`) === 'true';
      setHasMarkedInterested(isSet);
    } else {
      setHasMarkedInterested(false);
    }
  }, [user, event.id]);

  const handleInterestedClick = async () => {
    if (!user) {
      promptLoginForBooking(event);
      return;
    }

    const storageKey = `user_interested_${user.id}_${event.id}`;
    const nextState = !hasMarkedInterested;

    setHasMarkedInterested(nextState);
    if (nextState) {
      setInterestedCount((prev) => prev + 1);
      localStorage.setItem(storageKey, 'true');
    } else {
      setInterestedCount((prev) => Math.max(0, prev - 1));
      localStorage.removeItem(storageKey);
    }

    try {
      await axiosClient.post(`/api/events/${event.id}/interested`, {
        action: nextState ? 'add' : 'remove',
      });
    } catch (err) {
      console.warn('Failed to toggle interest:', err);
    }
  };

  const handleRsvpClick = () => {
    if (isSoldOut) return;
    if (!user) {
      promptLoginForBooking(event);
      return;
    }
    setIsRegistrationModalOpen(true);
  };

  const handleRsvpSuccess = (eventId, newCount, ticketNumbers) => {
    setRsvpCount(newCount);
    if (ticketNumbers && ticketNumbers.length > 0) {
      setTicketNotice(`Ticket #${ticketNumbers.join(', #')} Claimed!`);
      setTimeout(() => setTicketNotice(null), 5000);
    }
    if (onRsvpUpdate) {
      onRsvpUpdate(eventId, newCount);
    }
  };

  const handleCopyLink = () => {
    const appBaseUrl = (import.meta.env.VITE_APP_BASE_URL || window.location.origin).replace(/\/$/, '');
    const shareUrl = `${appBaseUrl}/event/${event.id}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy link:', err);
      });
    }
  };

  const handleDelete = async () => {
    if (!isOwner || isDeleting) return;

    const result = await Swal.fire({
      title: 'Delete Event?',
      text: `Are you sure you want to delete "${event.title}"? All registered bookings for this event will be cancelled.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#68677A',
      confirmButtonText: 'Yes, Delete Event',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'rounded-3xl p-6 font-sans',
        confirmButton: 'px-5 py-2.5 rounded-full text-xs font-bold shadow-md',
        cancelButton: 'px-5 py-2.5 rounded-full text-xs font-bold',
      },
    });

    if (!result.isConfirmed) return;

    setIsDeleting(true);
    try {
      await axiosClient.delete(`/api/events/${event.id}`);

      await Swal.fire({
        title: 'Event Deleted!',
        text: 'The event has been permanently deleted.',
        icon: 'success',
        confirmButtonColor: '#0F0F14',
        customClass: {
          popup: 'rounded-3xl p-6 font-sans',
          confirmButton: 'px-6 py-2.5 rounded-full text-xs font-bold shadow-md',
        },
      });

      if (onEventDeleted) {
        onEventDeleted(event.id);
      }
    } catch (err) {
      console.error('Failed to delete event:', err);
      Swal.fire({
        title: 'Error Deleting Event',
        text: err.response?.data?.error || 'Failed to delete event.',
        icon: 'error',
        confirmButtonColor: '#0F0F14',
        customClass: {
          popup: 'rounded-3xl p-6 font-sans',
          confirmButton: 'px-6 py-2.5 rounded-full text-xs font-bold',
        },
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white border border-[#E8E7EF] rounded-3xl p-6 shadow-xl shadow-slate-900/5 hover:shadow-2xl transition-all duration-300 flex flex-col font-sans relative group overflow-hidden space-y-4">
      <div>
        {/* Event Banner Image (Rounded top corners flush with card) */}
        {displayImage ? (
          <div className="w-[calc(100%+3rem)] -mx-6 -mt-6 h-52 mb-5 overflow-hidden rounded-t-3xl border-b border-[#E8E7EF] relative group-hover:opacity-95 transition bg-[#F4F3F8]">
            <img
              src={displayImage}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                if (e.target.nextSibling) {
                  e.target.nextSibling.style.display = 'flex';
                }
              }}
            />
            <div className="hidden w-full h-full bg-gradient-to-br from-[#F4F3F8] to-[#E8E7EF] items-center justify-center flex-col gap-1 text-[#68677A]">
              <Camera className="w-6 h-6 text-[#68677A]" />
              <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">No Image</span>
            </div>
          </div>
        ) : (
          <div className="w-[calc(100%+3rem)] -mx-6 -mt-6 h-52 mb-5 overflow-hidden rounded-t-3xl border-b border-[#E8E7EF] relative bg-gradient-to-br from-[#F4F3F8] to-[#E8E7EF] flex flex-col items-center justify-center gap-1.5 text-[#68677A] group-hover:opacity-95 transition">
            <Camera className="w-8 h-8 opacity-60 text-[#68677A]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#68677A] whitespace-nowrap">No Image</span>
          </div>
        )}

        {/* Header & Badges (Strict Monochrome Black & White) */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <CategoryBadge category={event.category} />
            <span className="text-xs font-bold px-3 py-1 rounded-full border bg-[#F4F3F8] text-[#0F0F14] border-[#E8E7EF] whitespace-nowrap">
              {event.ticket_price > 0 ? `₹${event.ticket_price}` : 'FREE'}
            </span>
            <span className="text-xs font-bold text-[#0F0F14] bg-[#F4F3F8] px-3 py-1 rounded-full border border-[#E8E7EF] inline-flex items-center gap-1 whitespace-nowrap">
              <MapPin className="w-3 h-3 text-[#0F0F14]" />
              <span className="truncate max-w-[120px]">{event.city || event.neighborhood}</span>
            </span>
          </div>

          {/* Owner Controls */}
          {isOwner && (
            <div className="flex items-center gap-1 bg-[#F4F3F8] p-1 rounded-full border border-[#E8E7EF] flex-shrink-0">
              <button
                onClick={() => setIsAttendeesModalOpen(true)}
                className="w-7 h-7 flex items-center justify-center text-[#0F0F14] hover:bg-white rounded-full transition font-bold"
                title="View Registered Attendees"
              >
                <Users className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="w-7 h-7 flex items-center justify-center text-[#68677A] hover:text-[#0F0F14] hover:bg-white rounded-full transition"
                title="Edit Event"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-7 h-7 flex items-center justify-center text-[#68677A] hover:text-red-500 hover:bg-white rounded-full transition disabled:opacity-50"
                title="Delete Event"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Headline Title */}
        <h3 className="text-2xl font-black text-[#0F0F14] hover:text-black transition duration-150 tracking-tight leading-snug mb-3 truncate">
          <Link to={`/event/${event.id}`}>
            {event.title}
          </Link>
        </h3>

        {/* Date & Time Pill */}
        <div className="text-xs font-bold text-[#0F0F14] bg-[#F4F3F8] border border-[#E8E7EF] px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 mb-3.5 whitespace-nowrap">
          <Calendar className="w-3.5 h-3.5 text-[#0F0F14]" />
          <span>{formatEventDate(event.event_datetime)}</span>
        </div>

        {/* Description */}
        <p className="text-[#555468] text-sm line-clamp-3 leading-relaxed mb-4 font-medium">
          {event.description}
        </p>

        {/* Location Address & View Map Button */}
        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="text-xs text-[#68677A] font-bold flex items-center gap-1.5 truncate whitespace-nowrap">
            <Building2 className="w-3.5 h-3.5 text-[#68677A]" />
            <span className="truncate max-w-[180px] sm:max-w-[220px]">{event.location}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsMapModalOpen(true)}
            className="px-3.5 py-1.5 rounded-full bg-[#F4F3F8] hover:bg-[#EAE8F5] text-[#0F0F14] border border-[#E8E7EF] text-xs font-extrabold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer whitespace-nowrap"
          >
            <Map className="w-3.5 h-3.5 text-[#0F0F14]" />
            <span>View Map</span>
          </button>
        </div>
      </div>

      {/* Ticket Notification Banner */}
      {ticketNotice && (
        <div className="mb-3 px-3 py-1.5 rounded-2xl bg-[#0F0F14] text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 whitespace-nowrap">
          <Ticket className="w-3.5 h-3.5" />
          <span>{ticketNotice}</span>
        </div>
      )}

      {/* Footer Controls (Strict Black & White Buttons) */}
      <div className="pt-4 border-t border-[#F0EFF6] flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Primary CTA Register Button (Solid Dark/Black Pill) */}
          {isSoldOut ? (
            <button
              disabled
              className="px-4 py-2 rounded-full bg-slate-200 text-slate-500 font-bold text-xs cursor-not-allowed border border-slate-300 flex items-center gap-1 whitespace-nowrap"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Sold Out</span>
            </button>
          ) : (
            <button
              onClick={handleRsvpClick}
              className="px-5 py-2 rounded-full bg-[#0F0F14] hover:bg-black text-white font-extrabold text-xs transition-transform active:scale-95 flex items-center gap-1.5 shadow-md cursor-pointer whitespace-nowrap"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>
          )}

          {/* I'm Going Interest Pill Button */}
          <button
            onClick={handleInterestedClick}
            className={`px-3.5 py-2 rounded-full font-bold text-xs transition flex items-center gap-1.5 border cursor-pointer whitespace-nowrap ${hasMarkedInterested
                ? 'bg-[#0F0F14] text-white border-[#0F0F14] font-extrabold'
                : 'bg-[#F4F3F8] hover:bg-[#EAE8F5] text-[#0F0F14] border-[#E8E7EF]'
              }`}
            title="Mark that you are interested in going!"
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Going ({interestedCount})</span>
          </button>

          {/* Tickets Remaining Badge */}
          <span className="text-xs font-bold px-3 py-2 rounded-full border bg-[#F4F3F8] text-[#0F0F14] border-[#E8E7EF] flex items-center gap-1 whitespace-nowrap">
            <span>{remainingTickets} Left</span>
          </span>
        </div>

        {/* Share Button */}
        <button
          onClick={handleCopyLink}
          className="px-3.5 py-2 rounded-full bg-white hover:bg-slate-50 text-[#0F0F14] text-xs font-bold border border-[#E8E7EF] transition flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        event={event}
        onRsvpSuccess={handleRsvpSuccess}
      />

      {/* Interactive Location Map Popup Modal */}
      <EventMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        event={event}
      />

      {/* Owner Modals */}
      {isOwner && (
        <>
          <EditEventModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            event={event}
            onEventUpdated={onEventUpdated}
          />
          <AttendeesModal
            isOpen={isAttendeesModalOpen}
            onClose={() => setIsAttendeesModalOpen(false)}
            eventId={event.id}
          />
        </>
      )}
    </div>
  );
}
