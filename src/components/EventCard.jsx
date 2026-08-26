import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import axiosClient from '../api/axiosClient';
import CategoryBadge from './CategoryBadge';
import EditEventModal from './EditEventModal';
import AttendeesModal from './AttendeesModal';
import RegistrationModal from './RegistrationModal';
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

export default function EventCard({ event, onRsvpUpdate, onEventUpdated, onEventDeleted }) {
  const [rsvpCount, setRsvpCount] = useState(event.rsvp_count || 0);
  const [interestedCount, setInterestedCount] = useState(event.interested_count || 0);
  const [hasMarkedInterested, setHasMarkedInterested] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ticketNotice, setTicketNotice] = useState(null);

  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user, promptLoginForBooking } = useAuth();
  const isOwner = !!(user && event.created_by && user.id === event.created_by);

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
        confirmButtonColor: '#5B4BFF',
        customClass: {
          popup: 'rounded-3xl p-6 font-sans',
          confirmButton: 'px-6 py-2.5 rounded-full text-xs font-bold shadow-md shadow-[#5B4BFF]/25',
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
        confirmButtonColor: '#5B4BFF',
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
    <div className="bg-white border border-[#E8E7EF] rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group overflow-hidden">
      <div>
        {/* Event Banner Image (Rendered above details) */}
        {displayImage ? (
          <div className="w-[calc(100%+3rem)] -mx-6 -mt-6 h-48 mb-5 overflow-hidden border-b border-[#E8E7EF] relative group-hover:opacity-95 transition bg-[#F4F3F8]">
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
              <span className="text-2xl">📷</span>
              <span className="text-xs font-bold uppercase tracking-wider">No Image Found</span>
            </div>
          </div>
        ) : (
          <div className="w-[calc(100%+3rem)] -mx-6 -mt-6 h-48 mb-5 overflow-hidden border-b border-[#E8E7EF] relative bg-gradient-to-br from-[#F4F3F8] to-[#E8E7EF] flex flex-col items-center justify-center gap-1.5 text-[#68677A] group-hover:opacity-95 transition">
            <span className="text-3xl opacity-60">📷</span>
            <span className="text-xs font-bold uppercase tracking-widest text-[#68677A]">No Image Found</span>
          </div>
        )}

        {/* Header & Badges */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <CategoryBadge category={event.category} />
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
              event.ticket_price > 0
                ? 'bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]'
                : 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
            }`}>
              {event.ticket_price > 0 ? `₹${event.ticket_price} / Ticket` : 'FREE'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#68677A] bg-[#F4F3F8] px-3 py-1 rounded-full border border-[#E8E7EF] flex items-center gap-1">
              📍 {event.neighborhood && event.city && event.neighborhood.trim().toLowerCase() !== event.city.trim().toLowerCase()
                ? `${event.neighborhood}, ${event.city}`
                : (event.city || event.neighborhood)}
            </span>

            {/* Owner Controls */}
            {isOwner && (
              <div className="flex items-center gap-1 bg-[#F4F3F8] p-1 rounded-full border border-[#E8E7EF]">
                <button
                  onClick={() => setIsAttendeesModalOpen(true)}
                  className="w-7 h-7 flex items-center justify-center text-xs text-[#5B4BFF] hover:bg-white rounded-full transition font-bold"
                  title="View Registered Attendees (Owner Only)"
                >
                  👥
                </button>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-7 h-7 flex items-center justify-center text-xs text-[#68677A] hover:text-[#5B4BFF] hover:bg-white rounded-full transition"
                  title="Edit Event (Owner Only)"
                >
                  ✏️
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-7 h-7 flex items-center justify-center text-xs text-[#68677A] hover:text-red-500 hover:bg-white rounded-full transition disabled:opacity-50"
                  title="Delete Event (Owner Only)"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-[#11112A] group-hover:text-[#5B4BFF] transition duration-150 line-clamp-2 break-words leading-snug mb-3">
          <Link to={`/event/${event.id}`}>
            {event.title}
          </Link>
        </h3>

        {/* Date & Time Pill */}
        <div className="text-xs font-semibold text-[#5B4BFF] bg-[#F1EEFF] px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-3.5">
          <span>📅</span>
          <span>{formatEventDate(event.event_datetime)}</span>
        </div>

        {/* Description */}
        <p className="text-[#68677A] text-sm line-clamp-3 break-words leading-relaxed mb-4">
          {event.description}
        </p>

        {/* Location Address */}
        <div className="text-xs text-[#9291A0] mb-5 font-medium flex items-center gap-1.5 break-words">
          <span>🏢</span>
          <span className="truncate">{event.location}</span>
        </div>
      </div>

      {/* Ticket Notification Banner */}
      {ticketNotice && (
        <div className="mb-3 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-bounce">
          <span>🎟️</span>
          <span>{ticketNotice}</span>
        </div>
      )}

      {/* Footer Controls (Distinct Register vs I'm Going Buttons) */}
      <div className="pt-4 border-t border-[#F0EFF6] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Register Button */}
          {isSoldOut ? (
            <button
              disabled
              className="px-3.5 py-1.5 rounded-full bg-slate-200 text-slate-500 font-semibold text-xs cursor-not-allowed border border-slate-300"
            >
              🚫 Sold Out
            </button>
          ) : (
            <button
              onClick={handleRsvpClick}
              className="px-3.5 py-1.5 rounded-full bg-[#5B4BFF] hover:bg-[#4C3CE6] text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-md shadow-[#5B4BFF]/20 cursor-pointer"
            >
              <span>🎟️</span>
              <span>Register</span>
            </button>
          )}

          {/* I'm Going (Interest Counter) Button */}
          <button
            onClick={handleInterestedClick}
            className={`px-3 py-1.5 rounded-full font-semibold text-xs transition flex items-center gap-1 border cursor-pointer ${
              hasMarkedInterested
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-[#F4F3F8] hover:bg-[#EAE8F5] text-[#11112A] border-[#E8E7EF]'
            }`}
            title="Mark that you are interested in going!"
          >
            <span>🙌</span>
            <span>I'm Going ({interestedCount})</span>
          </button>

          {/* Tickets Left Badge */}
          <span
            className={`text-xs font-bold px-2.5 py-1.5 rounded-full border transition flex items-center gap-1 ${
              remainingTickets === 0
                ? 'bg-red-50 text-red-600 border-red-200'
                : remainingTickets <= 5
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-[#F4F3F8] text-[#68677A] border-[#E8E7EF]'
            }`}
          >
            <span>{remainingTickets} Left</span>
          </span>
        </div>

        {/* Share Button */}
        <button
          onClick={handleCopyLink}
          className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-[#68677A] text-xs font-semibold border border-[#E8E7EF] transition flex items-center gap-1 shadow-sm"
        >
          <span>{copied ? '✅' : '🔗'}</span>
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
