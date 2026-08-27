import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  Calendar,
  User,
  Mail,
  MapPin,
  Building2,
  CreditCard,
  Plus,
  Minus,
  X,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import Swal from 'sweetalert2';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import InvoiceModal from './InvoiceModal';
import { sendEmailJsInvoice } from '../utils/emailjsHelper';

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

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RegistrationModal({ isOpen, onClose, event, onRsvpSuccess }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [invoiceData, setInvoiceData] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  if (showInvoice && invoiceData) {
    return (
      <InvoiceModal
        isOpen={true}
        onClose={() => {
          setShowInvoice(false);
          setInvoiceData(null);
          onClose();
          navigate('/my-bookings');
        }}
        invoiceData={invoiceData}
      />
    );
  }

  if (!isOpen || !event) return null;

  const totalTickets = event.total_tickets || 50;
  const rsvpCount = event.rsvp_count || 0;
  const remainingTickets = Math.max(0, totalTickets - rsvpCount);
  const maxAllowed = remainingTickets;

  const ticketPrice = event.ticket_price || 0;
  const totalPrice = ticketPrice * quantity;

  const organizerName = event.creator?.name || 'Community Event Host';
  const organizerEmail = event.creator?.email || 'contact@localbulletin.com';

  const isHost = !!(user && (user.id === event.created_by || user.id === event.creator?.id));

  const handleBooking = async (e) => {
    e.preventDefault();
    setError(null);

    if (isHost) {
      setError('As the host and creator of this event, you cannot register or purchase tickets for your own event.');
      return;
    }

    setLoading(true);

    try {
      if (totalPrice <= 0) {
        // Free Event Registration
        const response = await axiosClient.post(`/api/events/${event.id}/rsvp`, {
          ticket_quantity: quantity,
        });

        const newCount = response.data.rsvp_count;
        const ticketNumbers = response.data.ticket_numbers || [response.data.ticket_number];

        if (onRsvpSuccess) {
          onRsvpSuccess(event.id, newCount, ticketNumbers);
        }

        await Swal.fire({
          title: 'Registration Successful!',
          text: `Your ticket pass #${ticketNumbers.join(', #')} has been confirmed. A copy of your booking pass invoice has been sent to ${user?.email || 'your email'}.`,
          icon: 'success',
          confirmButtonColor: '#0F172A',
          confirmButtonText: 'View My Bookings',
          customClass: {
            popup: 'rounded-3xl p-6 font-sans',
            confirmButton: 'px-6 py-2.5 rounded-full text-xs font-bold shadow-md',
          },
        });

        onClose();
        navigate('/my-bookings');
      } else {
        // Paid Event Razorpay Checkout
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          setError('Failed to load Razorpay payment gateway script. Please check your network connection.');
          setLoading(false);
          return;
        }

        const orderRes = await axiosClient.post(`/api/events/${event.id}/create-razorpay-order`, {
          ticket_quantity: quantity,
        });

        const orderData = orderRes.data;

        const options = {
          key: orderData.key_id || 'rzp_test_TULuQjSNHLksoX',
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'Local Event Bulletin',
          description: `Tickets for ${event.title}`,
          order_id: orderData.order_id,
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: user?.phone || '',
          },
          theme: {
            color: '#0F172A',
          },
          handler: async function (response) {
            try {
              setLoading(true);
              const verifyRes = await axiosClient.post(`/api/events/${event.id}/verify-razorpay-payment`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                ticket_quantity: quantity,
              });

              if (onRsvpSuccess) {
                onRsvpSuccess(event.id, verifyRes.data.event.rsvp_count, verifyRes.data.ticket_numbers);
              }

              // Dispatch EmailJS invoice email
              if (user?.email) {
                sendEmailJsInvoice({
                  to_name: user?.name || 'Valued Customer',
                  to_email: user.email,
                  event_name: event.title,
                  event_date: formatEventDate(event.event_datetime),
                  event_location: `${event.location}, ${event.neighborhood || ''}, ${event.city || ''}`,
                  ticket_type: `Entry Pass (#${verifyRes.data.ticket_numbers.join(', #')})`,
                  quantity: quantity,
                  amount: (event.ticket_price * quantity).toFixed(2),
                  payment_id: response.razorpay_payment_id,
                  order_id: response.razorpay_order_id,
                  payment_date: new Date().toLocaleDateString(),
                });
              }

              await Swal.fire({
                title: 'Payment Successful!',
                text: `Payment verified! Ticket pass #${verifyRes.data.ticket_numbers.join(', #')} confirmed. A copy of your payment invoice has been sent to ${user?.email || 'your email'}.`,
                icon: 'success',
                confirmButtonColor: '#0F172A',
                confirmButtonText: 'View My Bookings',
                customClass: {
                  popup: 'rounded-3xl p-6 font-sans',
                  confirmButton: 'px-6 py-2.5 rounded-full text-xs font-bold shadow-md',
                },
              });

              onClose();
              navigate('/my-bookings');
            } catch (vErr) {
              console.error('Payment verification failed:', vErr);
              setError(vErr.response?.data?.error || 'Payment verification failed.');
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
        };

        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.open();
      }
    } catch (err) {
      console.error('Registration/Payment error:', err);
      setError(err.response?.data?.error || 'Booking request failed. Please try again.');
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto text-[#0F172A]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-full text-base transition font-bold cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] text-xs font-bold mb-2">
            <Ticket className="w-3.5 h-3.5 text-[#0F172A]" />
            <span>Event Registration</span>
          </div>
          <h2 className="text-2xl font-black text-[#0F172A] tracking-tight leading-snug">
            {event.title}
          </h2>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#64748B] mt-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#0F172A]" />
            <span>{formatEventDate(event.event_datetime)}</span>
          </div>
        </div>

        {/* Organizer Banner Card */}
        <div className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-2xl p-3.5 mb-4 relative overflow-hidden">
          <div className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mb-2 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0F172A]" />
            <span>Event Organizer Contact</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-black text-xs shadow-md flex-shrink-0">
              {organizerName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#0F172A] truncate">{organizerName}</h4>
              <a
                href={`mailto:${organizerEmail}`}
                className="text-xs font-bold text-[#0F172A] hover:underline flex items-center gap-1 truncate mt-0.5"
              >
                <Mail className="w-3 h-3 text-[#0F172A]" />
                <span className="truncate">{organizerEmail}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Event Location Summary */}
        <div className="mb-5 space-y-1.5 text-xs text-[#64748B] bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0]">
          <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
            <MapPin className="w-3.5 h-3.5 text-[#0F172A]" />
            <span>Location: <strong>{districtLocation}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold">
            <Building2 className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Venue Address: {event.location}</span>
          </div>
        </div>

        {isHost && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-start gap-3">
            <span className="text-xl leading-none">👑</span>
            <div>
              <div className="font-extrabold text-amber-950 mb-0.5">Event Host Notice</div>
              <span>You are the organizer and creator of this event. Hosts cannot reserve tickets or register for their own events. You can manage your event and view registered attendees from "My Events".</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleBooking} className="space-y-5">
          {/* Ticket Quantity Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-black text-[#0F172A]">Select Number of Tickets *</label>
              <span className="text-xs font-bold text-[#0F172A]">
                {remainingTickets} Tickets Available
              </span>
            </div>

            <div className="flex items-center justify-between bg-[#F1F5F9] border border-[#E2E8F0] rounded-2xl p-3 mb-4">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1 || isHost}
                className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50 font-black text-lg flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
              >
                <Minus className="w-4 h-4 text-[#0F172A]" />
              </button>

              <div className="text-center">
                <span className="text-xl font-black text-[#0F172A] block leading-none">{quantity}</span>
                <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">
                  {quantity === 1 ? 'Ticket' : 'Tickets'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setQuantity(Math.min(maxAllowed, quantity + 1))}
                disabled={quantity >= maxAllowed || isHost}
                className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50 font-black text-lg flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#0F172A]" />
              </button>
            </div>

            {/* Price Calculation Summary */}
            <div className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-2xl p-3.5 flex items-center justify-between text-xs">
              <div>
                <span className="text-[#64748B] font-bold block uppercase text-[9px] tracking-wider">Ticket Price</span>
                <span className="font-bold text-[#0F172A] text-sm">
                  {ticketPrice > 0 ? `₹${ticketPrice} / ticket` : 'FREE'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[#64748B] font-bold block uppercase text-[9px] tracking-wider">Total Payable</span>
                <span className="font-black text-[#0F172A] text-base">
                  {totalPrice > 0 ? `₹${totalPrice}` : '₹0 (FREE)'}
                </span>
              </div>
            </div>
          </div>

          {/* Registration & Payment Action Button */}
          <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || remainingTickets === 0 || isHost}
              className="px-6 py-2.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-extrabold text-xs transition shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isHost ? (
                <>
                  <span>👑</span>
                  <span>You Are The Event Host</span>
                </>
              ) : (
                <>
                  {totalPrice > 0 ? <CreditCard className="w-4 h-4 text-white" /> : <Ticket className="w-4 h-4 text-white" />}
                  <span>
                    {loading
                      ? 'Processing...'
                      : totalPrice > 0
                      ? `Pay ₹${totalPrice} via Razorpay`
                      : `Confirm Registration (${quantity} ${quantity === 1 ? 'Ticket' : 'Tickets'})`}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
