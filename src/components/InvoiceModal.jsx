import React from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Ticket, Download, Printer, X } from 'lucide-react';

export default function InvoiceModal({ isOpen, onClose, invoiceData }) {
  const navigate = useNavigate();

  if (!isOpen || !invoiceData) return null;

  const {
    event,
    ticket_numbers = [],
    quantity_registered = 1,
    payment_id = 'PAY_OK0540',
    order_id = 'TIX-228',
    total_amount_paid = 0,
    booked_at = new Date().toISOString(),
    user,
  } = invoiceData;

  const eventTitle = event?.title || 'BFF DEMO';
  const eventDate = event?.event_datetime
    ? new Date(event.event_datetime).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '4 Mar 2025';
  
  const eventTime = event?.event_datetime
    ? new Date(event.event_datetime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '7:00 PM';

  const locationStr = event?.location || 'Jardín Botánico Nacional';
  const cityStr = event?.city || 'New York';
  const displayImage = event?.image_url || localStorage.getItem(`event_img_${event?.id}`);

  const attendeeName = user?.name || invoiceData?.user_name || 'Raul Ruiz';
  const attendeeEmail = user?.email || invoiceData?.user_email || 'raul@tix.do';
  
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
    <div id="invoice-print-wrapper" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
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
            border: 1px solid #E8E7EF !important;
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
        className="bg-white rounded-3xl border border-[#E8E7EF] shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto relative text-[#0F0F14] p-6 sm:p-8 font-sans"
      >
        {/* Top Header: Order ID + Close button */}
        <div className="flex items-start justify-between mb-4 border-b border-[#F0EFF6] pb-3">
          <div>
            <span className="text-base font-black tracking-tight text-[#0F0F14] block">
              {order_id}
            </span>
            <span className="text-xs font-semibold text-[#68677A] mt-0.5 block">
              {formattedBookedAt}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="no-print text-[#68677A] hover:text-[#0F0F14] w-8 h-8 rounded-full bg-[#F4F3F8] hover:bg-[#EAE8F5] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Event Header Section with Thumbnail */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="space-y-1.5 flex-1">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F0F14] leading-tight">
              {eventTitle}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[#424153]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#0F0F14]" /> {eventDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#0F0F14]" /> {eventTime}
              </span>
            </div>
            <div className="text-xs font-semibold text-[#68677A] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#68677A]" />
              <span>{cityStr} • {locationStr}</span>
            </div>
          </div>

          {displayImage && (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-[#E8E7EF] shadow-sm flex-shrink-0">
              <img src={displayImage} alt={eventTitle} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Client Information Box */}
        <div className="mb-6">
          <h3 className="text-sm font-black text-[#0F0F14] mb-2.5">Client Information</h3>
          <div className="bg-[#F4F3F8] border border-[#E8E7EF] rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#68677A] font-semibold w-28">Client Name</span>
              <span className="font-bold text-[#0F0F14]">{attendeeName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#68677A] font-semibold w-28">Email</span>
              <span className="font-medium text-[#0F0F14] truncate max-w-[200px]">{attendeeEmail}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#68677A] font-semibold w-28">Authorization</span>
              <span className="font-mono font-bold text-[#0F0F14]">{payment_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#68677A] font-semibold w-28">Payment Method</span>
              <span className="font-bold text-[#0F0F14]">Razorpay Secured</span>
            </div>
          </div>
        </div>

        {/* Tickets Breakdown Section */}
        <div className="mb-6">
          <h3 className="text-sm font-black text-[#0F0F14] mb-2.5">Tickets</h3>
          
          {/* Ticket Pass Item Card */}
          <div className="bg-[#F8F7FC] border border-[#E8E7EF] rounded-2xl p-3.5 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0F0F14] text-white flex items-center justify-center text-lg font-black shadow-2xs">
                <Ticket className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-black text-[#0F0F14]">General Admission</h4>
                <p className="text-[11px] font-semibold text-[#68677A] mt-0.5">
                  {unitPrice > 0 ? `₹${unitPrice.toFixed(2)} x ${qty}` : 'FREE Entry'}
                  {ticket_numbers.length > 0 && ` (#${ticket_numbers.join(', #')})`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-[#68677A]">Quantity</span>
              <span className="text-sm font-black text-[#0F0F14] block">{qty}</span>
            </div>
          </div>

          {/* Subtotal Itemization */}
          <div className="space-y-2 text-xs border-b border-[#F0EFF6] pb-3 text-[#424153]">
            <div className="flex justify-between">
              <span className="font-semibold text-[#68677A]">Subtotal:</span>
              <span className="font-bold text-[#0F0F14]">
                {totalPaid > 0 ? `₹${totalPaid.toFixed(2)}` : '₹0.00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-[#68677A]">Service Charge:</span>
              <span className="font-bold text-[#0F0F14]">₹0.00</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-[#68677A]">Insurance & Taxes:</span>
              <span className="font-bold text-[#0F0F14]">Included</span>
            </div>
          </div>

          {/* Total Row */}
          <div className="flex items-center justify-between pt-3 text-lg font-black text-[#0F0F14]">
            <span>Total:</span>
            <span className="text-xl font-black text-[#0F0F14]">
              {totalPaid > 0 ? `₹${totalPaid.toFixed(2)}` : 'FREE (₹0.00)'}
            </span>
          </div>
        </div>

        {/* Action Buttons at Bottom */}
        <div className="no-print pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-full border border-[#0F0F14] text-[#0F0F14] hover:bg-[#F4F3F8] font-bold text-xs transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Tickets</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-full bg-[#0F0F14] hover:bg-black text-white font-extrabold text-xs transition shadow-md cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
