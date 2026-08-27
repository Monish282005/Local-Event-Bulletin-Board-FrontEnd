import React from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

export default function InvoiceModal({ isOpen, onClose, invoiceData }) {
  const navigate = useNavigate();

  if (!isOpen || !invoiceData) return null;

  const {
    event,
    ticket_numbers = [],
    quantity_registered = 1,
    payment_id = 'FREE_EVENT',
    order_id = 'ORD_FREE',
    total_amount_paid = 0,
    booked_at = new Date().toISOString(),
    user,
  } = invoiceData;

  const eventTitle = event?.title || 'Community Event Registration';
  const eventDate = event?.event_datetime
    ? new Date(event.event_datetime).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';
  const locationStr = event?.location || 'Venue Location';
  const addressStr = [
    event?.neighborhood,
    event?.city,
    event?.state,
    event?.country,
  ]
    .filter(Boolean)
    .join(', ');

  const hostName = event?.creator?.name || 'Local Community Host';
  const hostEmail = event?.creator?.email || 'organizer@localevent.com';
  const attendeeName = user?.name || invoiceData?.user_name || 'Valued Guest';
  const attendeeEmail = user?.email || invoiceData?.user_email || 'guest@example.com';
  const attendeePhone = user?.phone || invoiceData?.user_phone || 'N/A';
  
  const qty = Math.max(1, quantity_registered || ticket_numbers.length || 1);
  const totalPaid = Math.max(0, parseFloat(total_amount_paid) || 0);
  const unitPrice = event?.ticket_price !== undefined && event?.ticket_price !== null
    ? parseFloat(event.ticket_price)
    : (totalPaid / qty);

  const formattedBookedDate = new Date(booked_at).toLocaleString('en-US', {
    day: '2-digit',
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
    <div id="invoice-print-wrapper" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
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
          /* Hide backdrop and all other elements on print */
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
            border: 2px solid #11112A !important;
            box-shadow: none !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 auto !important;
            padding: 16px !important;
            border-radius: 8px !important;
            background: #ffffff !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div
        id="invoice-card-container"
        className="bg-white rounded-3xl border-2 border-[#11112A] shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto relative text-[#11112A] p-5 sm:p-7 font-sans"
      >
        {/* Close Button (Screen Only) */}
        <button
          type="button"
          onClick={handleClose}
          className="no-print absolute top-4 right-4 text-[#68677A] hover:text-[#11112A] w-8 h-8 rounded-full bg-[#F4F3F8] hover:bg-[#E8E7EF] flex items-center justify-center transition font-bold z-10 cursor-pointer"
        >
          ✕
        </button>

        {/* --- 1-PAGE OFFICIAL INVOICE & TICKET PASS --- */}

        {/* 1. Header Banner */}
        <div className="flex items-center justify-between border-b-2 border-[#11112A] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#5B4BFF] text-white flex items-center justify-center text-xl font-black shadow-sm">
              📍
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-[#11112A] leading-none">
                LOCAL EVENT BULLETIN BOARD
              </h1>
              <p className="text-[11px] font-bold text-[#68677A] mt-0.5">
                Official Event Entry Pass & Tax Invoice
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-black rounded-full border border-emerald-300">
              ✓ CONFIRMED
            </span>
          </div>
        </div>

        {/* 2. Metadata Strip */}
        <div className="bg-[#F4F3F8] border border-[#D5D3E2] rounded-xl p-3 mb-3 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[#68677A] font-semibold text-[11px] block">Issued On:</span>
            <span className="font-bold text-[#11112A]">{formattedBookedDate}</span>
          </div>
          <div className="text-right">
            <span className="text-[#68677A] font-semibold text-[11px] block">Booking Reference / Order ID:</span>
            <span className="font-mono font-bold text-[#5B4BFF]">{order_id}</span>
          </div>
        </div>

        {/* 3. Event & Venue Details Card */}
        <div className="border border-[#11112A] rounded-xl p-3.5 mb-3 bg-[#FAF9FC]">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h2 className="text-lg font-black text-[#11112A] truncate">
              {eventTitle}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF2FF] text-[#5B4BFF] border border-[#C7D2FE] uppercase tracking-wider flex-shrink-0">
              {event?.category || 'Event'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#424153]">
            <div>
              <span className="font-bold text-[#11112A] block">📅 Date & Time:</span>
              <span>{eventDate}</span>
            </div>
            <div>
              <span className="font-bold text-[#11112A] block">📍 Venue & Location:</span>
              <span className="truncate block">{locationStr} ({addressStr})</span>
            </div>
          </div>
        </div>

        {/* 4. Two-Column Passenger & Payment Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {/* Passenger / Attendee Details */}
          <div className="border border-[#D5D3E2] rounded-xl overflow-hidden text-xs">
            <div className="bg-[#F4F3F8] px-3 py-1.5 border-b border-[#D5D3E2] font-bold text-[#11112A]">
              Passenger / Attendee Details
            </div>
            <div className="p-3 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#68677A] font-semibold">Attendee Name:</span>
                <span className="font-bold text-[#11112A]">{attendeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#68677A] font-semibold">Email:</span>
                <span className="font-medium text-[#11112A] truncate max-w-[150px]">{attendeeEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#68677A] font-semibold">Phone:</span>
                <span className="font-medium text-[#11112A]">{attendeePhone}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#E8E7EF]">
                <span className="text-[#68677A] font-bold">Issued Ticket Pass:</span>
                <span className="font-mono font-bold text-[#5B4BFF]">
                  {ticket_numbers.length > 0 ? `#${ticket_numbers.join(', #')}` : 'Pass Issued'}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="border border-[#D5D3E2] rounded-xl overflow-hidden text-xs">
            <div className="bg-[#F4F3F8] px-3 py-1.5 border-b border-[#D5D3E2] font-bold text-[#11112A]">
              Payment Details
            </div>
            <div className="p-3 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#68677A] font-semibold">Ticket Rate:</span>
                <span className="font-medium text-[#11112A]">
                  {unitPrice > 0 ? `₹${unitPrice.toFixed(2)}` : 'FREE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#68677A] font-semibold">Quantity:</span>
                <span className="font-bold text-[#11112A]">{qty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#68677A] font-semibold">Taxes & Service Fees:</span>
                <span className="font-medium text-emerald-600">Included (₹0.00)</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t-2 border-[#11112A] text-xs font-black">
                <span className="text-[#11112A]">Amount Paid:</span>
                <span className="text-[#5B4BFF]">
                  {totalPaid > 0 ? `₹${totalPaid.toFixed(2)}` : 'FREE (₹0.00)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Payment Transaction PNR Bar */}
        <div className="bg-[#FAF9FC] border border-[#D5D3E2] rounded-xl p-2.5 mb-3 flex items-center justify-between text-[11px]">
          <span className="text-[#68677A] font-semibold">Razorpay Payment Transaction Ref:</span>
          <span className="font-mono font-bold text-[#11112A] bg-white px-2 py-0.5 rounded border border-[#D5D3E2]">
            {payment_id}
          </span>
        </div>

        {/* 6. Terms & Cancellation Policy Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] leading-tight text-[#424153] mb-4">
          <div className="bg-[#F8F7FC] p-2.5 rounded-lg border border-[#E8E7EF]">
            <span className="font-bold text-[#11112A] block mb-1">📌 Important Information:</span>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Please present this ticket pass at the venue entrance.</li>
              <li>Report at least 15 minutes before the event start time.</li>
              <li>Carry a valid photo identity proof for entry verification.</li>
            </ul>
          </div>
          <div className="bg-[#F8F7FC] p-2.5 rounded-lg border border-[#E8E7EF]">
            <span className="font-bold text-[#11112A] block mb-1">📋 Terms & Cancellation Policy:</span>
            <p>
              {event?.allow_cancellation !== false
                ? 'Cancellation is permitted up to 24 hours prior to the event schedule.'
                : 'This booking pass is non-refundable and non-transferable.'}
            </p>
            <p className="mt-0.5 text-[#68677A]">Host Contact: {hostEmail}</p>
          </div>
        </div>

        {/* 7. Screen Action Buttons (Hidden on Print) */}
        <div className="no-print pt-2 border-t border-[#E8E7EF] flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 bg-[#5B4BFF] hover:bg-[#4C3CE6] text-white py-3 px-5 rounded-full text-xs font-bold shadow-lg shadow-[#5B4BFF]/25 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>📥</span>
            <span>Download / Print Invoice (1 Page PDF)</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] py-3 px-5 rounded-full text-xs font-bold border border-[#C7D2FE] transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>🎟️</span>
            <span>View My Bookings</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
