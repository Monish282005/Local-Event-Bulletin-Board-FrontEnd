import React, { useState } from 'react';
import {
  Camera,
  MapPin,
  Users,
  Edit3,
  Trash2,
  Calendar,
  HeartHandshake,
  Share2,
  CheckCircle2
} from 'lucide-react';
import Swal from 'sweetalert2';
import axiosClient from '../api/axiosClient';
import CategoryBadge from './CategoryBadge';
import EditEventModal from './EditEventModal';
import AttendeesModal from './AttendeesModal';
import EventDetailsModal from './EventDetailsModal';
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

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user, promptLoginForBooking } = useAuth();
  const isOwner = showOwnerControls && !!(user && event.created_by && user.id === event.created_by);

  // Single district/city location name (e.g. Coimbatore)
  const districtLocation = event.district || event.city || event.neighborhood || 'Local';
  const displayImage = event.image_url || localStorage.getItem(`event_img_${event.id}`);
  const isCompleted = event.is_expired || (event.event_datetime && new Date(event.event_datetime) <= new Date());

  // Sync user interest state per event
  React.useEffect(() => {
    if (user && user.id && event.id) {
      const isSet = localStorage.getItem(`user_interested_${user.id}_${event.id}`) === 'true';
      setHasMarkedInterested(isSet);
    } else {
      setHasMarkedInterested(false);
    }
  }, [user, event.id]);

  const handleInterestedClick = async (e) => {
    if (e) e.stopPropagation();
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

  const handleCopyLink = (e) => {
    if (e) e.stopPropagation();
    const appBaseUrl = (import.meta.env.VITE_APP_BASE_URL || window.location.origin).replace(/\/$/, '');
    const shareUrl = `${appBaseUrl}/event/${event.id}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => console.error('Failed to copy:', err));
    }
  };

  const handleDelete = async (e) => {
    if (e) e.stopPropagation();
    if (!isOwner || isDeleting) return;

    const result = await Swal.fire({
      title: 'Delete Event?',
      text: `Are you sure you want to delete "${event.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
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
        confirmButtonColor: '#2563EB',
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
        confirmButtonColor: '#2563EB',
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
    <>
      <div
        onClick={() => setIsDetailsModalOpen(true)}
        className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-4 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col font-sans relative group overflow-hidden space-y-3 cursor-pointer select-none"
      >
        {/* Image Container with Overlays for Share & Interested */}
        <div className="w-[calc(100%+2rem)] -mx-4 -mt-4 h-44 overflow-hidden rounded-t-2xl border-b border-[#E2E8F0] relative bg-[#F1F5F9]">
          {displayImage ? (
            <img
              src={displayImage}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                if (e.target.nextSibling) {
                  e.target.nextSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}

          {/* Image Fallback */}
          <div className={`${displayImage ? 'hidden' : 'flex'} w-full h-full bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] items-center justify-center flex-col gap-1 text-[#64748B]`}>
            <Camera className="w-6 h-6 opacity-60 text-[#64748B]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">No Image</span>
          </div>

          {/* Top-Left Overlay: I'm Interested Button */}
          <button
            onClick={handleInterestedClick}
            disabled={isCompleted}
            className={`absolute top-2.5 left-2.5 px-3 py-1.5 rounded-full text-xs font-extrabold backdrop-blur-md transition-transform active:scale-95 flex items-center gap-1.5 ${
              isCompleted
                ? 'bg-slate-100/90 text-slate-400 border border-slate-200/60 cursor-not-allowed'
                : hasMarkedInterested
                ? 'bg-[#0F172A] text-white border border-[#0F172A] shadow-md cursor-pointer'
                : 'bg-white/90 hover:bg-white text-[#0F172A] border border-white/40 shadow-md cursor-pointer'
            }`}
            title={isCompleted ? 'Event completed' : 'Mark interested in going!'}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Going ({interestedCount})</span>
          </button>

          {/* Top-Right Overlay: Share Button */}
          <button
            onClick={handleCopyLink}
            className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 hover:bg-white text-[#0F172A] shadow-md backdrop-blur-md transition-transform active:scale-95 border border-white/40 cursor-pointer"
            title="Share event link"
          >
            {copied ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <Share2 className="w-4 h-4 text-[#0F172A]" />
            )}
          </button>
        </div>

        {/* Badges Row: Category, Price, City */}
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <CategoryBadge category={event.category} />
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-[#F1F5F9] text-[#0F172A] border-[#E2E8F0] whitespace-nowrap">
            {event.ticket_price > 0 ? `₹${event.ticket_price}` : 'FREE'}
          </span>
          <span className="text-xs font-bold text-[#0F172A] bg-[#F1F5F9] px-2.5 py-0.5 rounded-full border border-[#E2E8F0] inline-flex items-center gap-1 whitespace-nowrap">
            <MapPin className="w-3 h-3 text-[#0F172A]" />
            <span className="truncate max-w-[110px]">{districtLocation}</span>
          </span>
          {(event.is_expired || (event.event_datetime && new Date(event.event_datetime) <= new Date())) && (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-slate-100 text-slate-500 border-slate-200 whitespace-nowrap">
              Completed
            </span>
          )}
        </div>

        {/* Event Title */}
        <h3 className="text-base font-black text-[#0F172A] group-hover:underline transition duration-150 tracking-tight leading-snug truncate my-1">
          {event.title}
        </h3>

        {/* Event Date & Time + Owner Actions Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-[#F1F5F9]">
          <div className="text-xs font-bold text-[#0F172A] bg-[#F1F5F9] border border-[#E2E8F0] px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 text-[#0F172A]" />
            <span>{formatEventDate(event.event_datetime)}</span>
          </div>

          {/* Owner Controls (Consistently aligned at bottom right) */}
          {isOwner && (
            <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-full border border-[#E2E8F0] flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAttendeesModalOpen(true);
                }}
                className="w-7 h-7 flex items-center justify-center text-[#0F172A] hover:bg-white rounded-full transition font-bold cursor-pointer"
                title="View Registered Attendees"
              >
                <Users className="w-3.5 h-3.5 text-[#2563EB]" />
              </button>
              {!(event.is_expired || (event.event_datetime && new Date(event.event_datetime) <= new Date())) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditModalOpen(true);
                  }}
                  className="w-7 h-7 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-white rounded-full transition cursor-pointer"
                  title="Edit Event"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-7 h-7 flex items-center justify-center text-[#64748B] hover:text-red-500 hover:bg-white rounded-full transition disabled:opacity-50 cursor-pointer"
                title="Delete Event"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Full Details Interactive Modal */}
      {isDetailsModalOpen && (
        <EventDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          event={event}
          rsvpCount={rsvpCount}
          interestedCount={interestedCount}
          hasMarkedInterested={hasMarkedInterested}
          onToggleInterest={handleInterestedClick}
          onRsvpSuccess={(eventId, newCount) => {
            setRsvpCount(newCount);
            if (onRsvpUpdate) onRsvpUpdate(eventId, newCount);
          }}
          isOwner={isOwner}
          onOpenEdit={() => setIsEditModalOpen(true)}
          onOpenAttendees={() => setIsAttendeesModalOpen(true)}
          onDeleteEvent={handleDelete}
        />
      )}

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
    </>
  );
}
