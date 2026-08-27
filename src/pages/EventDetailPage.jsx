import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';
import CategoryBadge from '../components/CategoryBadge';
import RegistrationModal from '../components/RegistrationModal';
import CreateEventModal from '../components/CreateEventModal';
import { useAuth } from '../context/AuthContext';

function formatEventDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [rsvpCount, setRsvpCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { user, promptLoginForBooking } = useAuth();

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosClient.get(`/api/events/${id}`);
        setEvent(response.data);
        setRsvpCount(response.data.rsvp_count || 0);
      } catch (err) {
        console.error('Failed to fetch event detail:', err);
        setError(err.response?.data?.error || 'Event not found or has expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleRsvpClick = () => {
    if (!user) {
      promptLoginForBooking(event);
      return;
    }
    setIsRegistrationModalOpen(true);
  };

  const handleCreateClick = () => {
    if (!user) {
      promptLoginForBooking(null);
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleRsvpSuccess = (eventId, newCount, ticketNumbers) => {
    setRsvpCount(newCount);
    setEvent((prev) => (prev ? { ...prev, rsvp_count: newCount } : prev));
    Swal.fire({
      title: 'Registration Complete! 🎉',
      text: `Reserved Pass #${ticketNumbers.join(', #')} successfully!`,
      icon: 'success',
      confirmButtonColor: '#5B4BFF',
      customClass: {
        popup: 'rounded-3xl p-6 font-sans',
        confirmButton: 'px-6 py-2.5 rounded-full text-xs font-bold shadow-md shadow-[#5B4BFF]/25',
      },
    });
  };

  const handleCopyLink = () => {
    const appBaseUrl = (import.meta.env.VITE_APP_BASE_URL || window.location.origin).replace(/\/$/, '');
    const shareUrl = `${appBaseUrl}/event/${id}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        Swal.fire({
          title: 'Link Copied!',
          text: 'Shareable event link copied to clipboard.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: 'rounded-3xl p-4 font-sans text-xs' },
        });
      }).catch(err => {
        console.error('Failed to copy share link:', err);
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen text-[#11112A] flex flex-col font-sans">
        <Navbar onCreateClick={handleCreateClick} />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white border border-[#E8E7EF] rounded-3xl p-8 max-w-lg w-full animate-pulse text-center shadow-sm">
            <div className="h-6 w-1/3 bg-slate-100 rounded-full mx-auto mb-4"></div>
            <div className="h-8 w-3/4 bg-slate-100 rounded-lg mx-auto mb-4"></div>
            <div className="h-4 w-1/2 bg-slate-100 rounded-full mx-auto"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#FAF9FC] text-[#11112A] flex flex-col font-sans">
        <Navbar onCreateClick={handleCreateClick} />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white border border-[#E8E7EF] rounded-3xl max-w-md w-full p-8 text-center shadow-lg">
            <div className="text-5xl mb-4">📍</div>
            <h2 className="text-2xl font-extrabold text-[#11112A] mb-2">Event Not Found</h2>
            <p className="text-[#68677A] text-sm mb-6 leading-relaxed">
              This event may have been removed, has expired, or the link is invalid.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#5B4BFF] hover:bg-[#4C3CE6] text-white font-semibold text-sm transition shadow-md shadow-[#5B4BFF]/20"
            >
              <span>←</span>
              <span>Back to All Events</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const organizerName = event.creator?.name || 'Community Event Host';
  const organizerEmail = event.creator?.email || 'contact@localbulletin.com';
  const totalTickets = event.total_tickets || 50;
  const remainingTickets = Math.max(0, totalTickets - rsvpCount);
  const isSoldOut = rsvpCount >= totalTickets;

  return (
    <div className="min-h-screen bg-[#FAF9FC] text-[#11112A] flex flex-col font-sans">
      <Navbar onCreateClick={handleCreateClick} />

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="bg-white border border-[#E8E7EF] rounded-3xl p-6 sm:p-10 shadow-sm">
          {/* Back Link & Category */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <Link to="/" className="flex items-center gap-2 text-[#68677A] hover:text-[#11112A] text-xs font-bold transition">
              <span>←</span>
              <span>Back to All Events</span>
            </Link>
            <div className="flex items-center gap-2">
              <CategoryBadge category={event.category} />
              <span className="text-xs font-semibold text-[#68677A] bg-[#F4F3F8] px-3.5 py-1 rounded-full border border-[#E8E7EF]">
                📍 {event.neighborhood}, {event.city}
              </span>
            </div>
          </div>

          {/* Event Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#11112A] tracking-tight mb-6 leading-tight">
            {event.title}
          </h1>

          {/* Host / Organizer Banner */}
          <div className="bg-white border border-[#E8E7EF] rounded-2xl p-4 flex items-center justify-between gap-3 mb-6 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#5B4BFF] to-[#8075FF] text-white flex items-center justify-center font-bold text-sm">
                {organizerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-[10px] text-[#9291A0] font-bold uppercase tracking-wider">Host / Organizer</div>
                <h4 className="text-sm font-bold text-[#11112A]">{organizerName}</h4>
              </div>
            </div>
            <a
              href={`mailto:${organizerEmail}`}
              className="px-4 py-2 rounded-full bg-[#F1EEFF] text-[#5B4BFF] hover:bg-[#5B4BFF] hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-[#E0D9FF]"
            >
              <span>✉️</span>
              <span>Contact Host</span>
            </a>
          </div>

          {/* Date & Time Highlight Pill Card */}
          <div className="bg-[#F1EEFF] border border-purple-100 rounded-2xl p-4 sm:p-5 mb-6 flex items-center gap-4">
            <span className="text-3xl">📅</span>
            <div>
              <div className="text-xs font-bold text-[#5B4BFF] uppercase tracking-wider mb-0.5">Date & Time</div>
              <div className="text-base font-bold text-[#11112A]">{formatEventDate(event.event_datetime)}</div>
            </div>
          </div>

          {/* Location Details */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-[#9291A0] uppercase tracking-wider mb-2">Location Address</h3>
            <p className="text-sm font-semibold text-[#11112A] bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl p-4">
              🏢 {event.location} ({event.neighborhood}, {event.city})
            </p>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-[#9291A0] uppercase tracking-wider mb-2">About This Event</h3>
            <p className="text-[#68677A] text-sm sm:text-base leading-relaxed whitespace-pre-line bg-[#FAF9FC] p-5 rounded-2xl border border-[#E8E7EF]">
              {event.description}
            </p>
          </div>

          {/* Action Buttons Footer */}
          <div className="pt-6 border-t border-[#F0EFF6] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isSoldOut ? (
                <button
                  disabled
                  className="px-6 py-2.5 rounded-full bg-slate-200 text-slate-500 font-semibold text-xs sm:text-sm cursor-not-allowed border border-slate-300"
                >
                  🚫 Sold Out
                </button>
              ) : (
                <button
                  onClick={handleRsvpClick}
                  className="px-6 py-2.5 rounded-full bg-[#5B4BFF] hover:bg-[#4C3CE6] active:bg-[#3F2FD1] text-white font-semibold text-xs sm:text-sm transition flex items-center gap-2 shadow-md shadow-[#5B4BFF]/20"
                >
                  <span>🙌</span>
                  <span>I'm Going</span>
                </button>
              )}

              <span className="text-xs sm:text-sm font-bold text-[#11112A] bg-[#F4F3F8] px-4 py-2 rounded-full border border-[#E8E7EF]">
                🎟️ {remainingTickets} Tickets Available ({rsvpCount} Going)
              </span>
            </div>

            <button
              onClick={handleCopyLink}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-[#68677A] hover:text-[#11112A] text-xs sm:text-sm font-semibold border border-[#E8E7EF] transition flex items-center gap-2 shadow-sm"
            >
              <span>{copied ? '✅' : '🔗'}</span>
              <span>{copied ? 'Link Copied!' : 'Share Event Link'}</span>
            </button>
          </div>
        </div>
      </main>

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        event={event}
        onRsvpSuccess={handleRsvpSuccess}
      />

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={() => {
          setIsCreateModalOpen(false);
        }}
      />

      <footer className="border-t border-[#E8E7EF] bg-white py-8 text-center text-[#68677A] text-xs font-medium mt-16">
        <p>© 2026 Local Event Bulletin Board. Designed with visual polish & discovery layout.</p>
      </footer>
    </div>
  );
}
