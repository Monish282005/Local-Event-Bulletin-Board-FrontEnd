import React from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Ticket, Printer, X, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function InvoiceModal({ isOpen, onClose, invoiceData }) {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  if (!isOpen || !invoiceData) return null;

  const {
    event,
    ticket_numbers = [],
    quantity_registered = 1,
    payment_id = 'PAY_OK0540',
    order_id = 'TIX-228',
    total_amount_paid = 0,
    booked_at = new Date().toISOString(),
    user: propUser,
  } = invoiceData;

  const eventTitle = event?.title || 'Community Event Pass';
  const eventDate = event?.event_datetime
    ? new Date(event.event_datetime).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString();

  const eventTime = event?.event_datetime
    ? new Date(event.event_datetime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '7:00 PM';

  const locationStr = event?.location || 'Venue Location';
  const cityStr = event?.city || event?.district || 'Local City';
  const displayImage = event?.image_url || localStorage.getItem(`event_img_${event?.id}`);

  // Current logged in user details (NO mock names like Raul Ruiz)
  const attendeeName = authUser?.name || propUser?.name || invoiceData?.user_name || 'Valued Guest';
  const attendeeEmail = authUser?.email || propUser?.email || invoiceData?.user_email || 'guest@localevent.com';

  const qty = Math.max(1, quantity_registered || ticket_numbers.length || 1);
  const totalPaid = Math.max(0, parseFloat(total_amount_paid) || 0);
  const unitPrice = event?.ticket_price !== undefined && event?.ticket_price !== null
    ? parseFloat(event.ticket_price)
    : (totalPaid / qty);

  const formattedBookedAt = new Date(booked_at).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    onClose();
    navigate('/my-bookings');
  };

  return createPortal(
    <div id="invoice-print-wrapper" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-md overflow-y-auto font-sans">
      {/* 1-Page Printable Print Stylesheet */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            overflow: visible !important;
          }
          body > *:not(#invoice-print-wrapper) {
            display: none !important;
          }
          .no-print {
            display: none !important;
          }
          #invoice-print-wrapper {
            position: static !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          #invoice-card-container {
            border: 1px solid #E2E8F0 !important;
            box-shadow: none !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 auto !important;
            padding: 20px !important;
            border-radius: 16px !important;
            background: #ffffff !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div
        id="invoice-card-container"
        className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto relative text-[#0F172A] p-6 sm:p-7 font-sans"
      >
        {/* Top Header: Order ID + Close button */}
        <div className="flex items-start justify-between mb-3 border-b border-[#E2E8F0] pb-3">
          <div>
            <span className="text-base font-black tracking-tight text-[#0F172A] block font-mono">
              {order_id}
            </span>
            <span className="text-xs font-bold text-[#64748B] mt-0.5 block">
              {formattedBookedAt}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="no-print text-[#64748B] hover:text-[#0F172A] w-8 h-8 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center transition cursor-pointer font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Email Invoice Confirmation Notice Banner */}
        <div className="no-print bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] rounded-2xl p-3 mb-4 flex items-center gap-2.5 text-xs font-bold shadow-2xs">
          <Mail className="w-4 h-4 text-[#0F172A] flex-shrink-0" />
          <span>A copy of this payment invoice has been sent to <strong>{attendeeEmail}</strong>.</span>
        </div>

        {/* Event Header Section with Thumbnail */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="space-y-1.5 flex-1">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F172A] leading-tight">
              {eventTitle}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[#0F172A]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#0F172A]" /> {eventDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#0F172A]" /> {eventTime}
              </span>
            </div>
            <div className="text-xs font-bold text-[#64748B] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#0F172A]" />
              <span>{cityStr} • {locationStr}</span>
            </div>
          </div>

          {displayImage && (
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-xs flex-shrink-0">
              <img src={displayImage} alt={eventTitle} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Client Information Box (Current Logged In User) */}
        <div className="mb-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#64748B] mb-2">Customer Details</h3>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] font-bold w-28">Name</span>
              <span className="font-black text-[#0F172A]">{attendeeName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] font-bold w-28">Email</span>
              <span className="font-bold text-[#0F172A] truncate max-w-[220px]">{attendeeEmail}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] font-bold w-28">Payment ID</span>
              <span className="font-mono font-bold text-[#0F172A]">{payment_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] font-bold w-28">Payment Gateway</span>
              <span className="font-bold text-[#0F172A]">Razorpay Secured</span>
            </div>
          </div>
        </div>

        {/* Tickets Breakdown Section */}
        <div className="mb-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#64748B] mb-2">Issued Ticket Pass</h3>

          {/* Ticket Pass Item Card */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-3.5 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0F172A] text-white flex items-center justify-center text-lg font-black shadow-xs">
                <Ticket className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-black text-[#0F172A]">General Admission</h4>
                <p className="text-[11px] font-bold text-[#64748B] mt-0.5">
                  {unitPrice > 0 ? `₹${unitPrice.toFixed(2)} x ${qty}` : 'FREE Entry'}
                  {ticket_numbers.length > 0 && ` (#${ticket_numbers.join(', #')})`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-[#64748B] block uppercase tracking-wider">Quantity</span>
              <span className="text-sm font-black text-[#0F172A] block">{qty}</span>
            </div>
          </div>

          {/* Subtotal Itemization */}
          <div className="space-y-1.5 text-xs border-b border-[#E2E8F0] pb-3 text-[#64748B]">
            <div className="flex justify-between">
              <span className="font-bold">Subtotal:</span>
              <span className="font-bold text-[#0F172A]">
                {totalPaid > 0 ? `₹${totalPaid.toFixed(2)}` : '₹0.00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">Service Charge:</span>
              <span className="font-bold text-[#0F172A]">₹0.00</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">Insurance & Taxes:</span>
              <span className="font-bold text-[#0F172A]">Included</span>
            </div>
          </div>

          {/* Total Row */}
          <div className="flex items-center justify-between pt-3 text-base font-black text-[#0F172A]">
            <span>Total Amount:</span>
            <span className="text-xl font-black text-[#2563EB]">
              {totalPaid > 0 ? `₹${totalPaid.toFixed(2)}` : 'FREE (₹0.00)'}
            </span>
          </div>
        </div>

        {/* Combined Single Action Button + Close Button Below */}
        <div className="no-print pt-3 border-t border-[#E2E8F0] space-y-2">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full py-3 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-extrabold text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Download & Print Receipt</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2.5 rounded-full border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] font-bold text-xs transition cursor-pointer"
          >
            Close Invoice
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
