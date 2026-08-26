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

  const eventTitle = event?.title || 'Event Registration';
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
  const addressStr = `${event?.neighborhood || ''}, ${event?.city || ''}, ${event?.state || ''}`;
  const hostName = event?.creator?.name || 'Event Organizer';
  const hostEmail = event?.creator?.email || 'organizer@localevent.com';
  const attendeeName = user?.name || invoiceData?.user_name || 'Valued Customer';
  const attendeeEmail = user?.email || invoiceData?.user_email || 'customer@example.com';
  const attendeePhone = user?.phone || invoiceData?.user_phone || 'N/A';
  const ticketPrice = event?.ticket_price || (total_amount_paid / (quantity_registered || 1)) || 0;

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    onClose();
    navigate('/my-bookings');
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      {/* Printable CSS block */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-print-area, #invoice-print-area * {
            visibility: visible;
          }
          #invoice-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl border border-[#E8E7EF] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto relative animate-scaleUp text-[#11112A]">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="no-print absolute top-4 right-4 text-[#68677A] hover:text-[#11112A] w-8 h-8 rounded-full bg-[#F4F3F8] hover:bg-[#E8E7EF] flex items-center justify-center transition font-bold z-10"
        >
          ✕
        </button>

        <div id="invoice-print-area" className="p-6 sm:p-8 space-y-6">
          {/* Success Banner Card (Screen Only) */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg flex items-center justify-between no-print">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
                ✅
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight leading-tight">Booking & Payment Successful!</h2>
                <p className="text-xs text-emerald-100 font-medium mt-0.5">Official ticket invoice issued & saved.</p>
              </div>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold border border-white/30">
              Confirmed
            </span>
          </div>

          {/* Header & Logo */}
          <div className="flex items-center justify-between pb-6 border-b border-[#E8E7EF]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-8 h-8 bg-gradient-to-tr from-[#5B4BFF] to-[#8075FF] rounded-xl flex items-center justify-center text-white text-sm font-black shadow-md">
                  📍
                </span>
                <span className="text-base font-black text-[#11112A] tracking-tight">Local Event Bulletin</span>
              </div>
              <p className="text-xs text-[#68677A]">Verified Official Event Ticket & Invoice</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-[#EEF2FF] text-[#4F46E5] rounded-full text-xs font-bold border border-[#C7D2FE]">
                Tax Invoice / Receipt
              </span>
              <p className="text-[11px] text-[#68677A] mt-1">
                Issued: {new Date(booked_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Transaction Metadata */}
          <div className="bg-[#F8F7FC] rounded-2xl p-4 border border-[#E8E7EF] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#68677A] font-semibold block mb-0.5">Razorpay Payment ID</span>
              <span className="font-mono font-bold text-[#11112A] bg-white px-2 py-1 rounded border border-[#E8E7EF] inline-block shadow-2xs">
                {payment_id}
              </span>
            </div>
            <div>
              <span className="text-[#68677A] font-semibold block mb-0.5">Razorpay Order ID</span>
              <span className="font-mono font-bold text-[#11112A] bg-white px-2 py-1 rounded border border-[#E8E7EF] inline-block shadow-2xs">
                {order_id}
              </span>
            </div>
          </div>

          {/* Event Details */}
          <div>
            <h3 className="text-xs font-bold text-[#5B4BFF] uppercase tracking-wider mb-2">Event Information</h3>
            <div className="bg-white border border-[#E8E7EF] rounded-2xl p-4 space-y-2">
              <h4 className="text-base font-black text-[#11112A]">{eventTitle}</h4>
              <div className="flex flex-wrap gap-4 text-xs text-[#68677A]">
                <p>📅 <strong className="text-[#11112A]">{eventDate}</strong></p>
                <p>📍 <strong className="text-[#11112A]">{locationStr}</strong> ({addressStr})</p>
              </div>
            </div>
          </div>

          {/* Customer & Organizer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#F8F7FC] p-4 rounded-2xl border border-[#E8E7EF]">
              <span className="text-xs font-bold text-[#5B4BFF] uppercase tracking-wider block mb-2">Billed To (Customer)</span>
              <p className="font-bold text-[#11112A] text-sm mb-1">{attendeeName}</p>
              <p className="text-[#68677A] mb-0.5">✉️ {attendeeEmail}</p>
              <p className="text-[#68677A]">📞 {attendeePhone}</p>
            </div>
            <div className="bg-[#F8F7FC] p-4 rounded-2xl border border-[#E8E7EF]">
              <span className="text-xs font-bold text-[#5B4BFF] uppercase tracking-wider block mb-2">Organizer</span>
              <p className="font-bold text-[#11112A] text-sm mb-1">{hostName}</p>
              <p className="text-[#68677A]">✉️ {hostEmail}</p>
            </div>
          </div>

          {/* Price Breakdown Table */}
          <div>
            <h3 className="text-xs font-bold text-[#5B4BFF] uppercase tracking-wider mb-2">Payment Breakdown</h3>
            <div className="border border-[#E8E7EF] rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F4F3F8] text-[#11112A] font-bold">
                    <th className="p-3 border-b border-[#E8E7EF]">Description</th>
                    <th className="p-3 border-b border-[#E8E7EF] text-center">Qty</th>
                    <th className="p-3 border-b border-[#E8E7EF] text-right">Price</th>
                    <th className="p-3 border-b border-[#E8E7EF] text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E7EF]">
                  <tr>
                    <td className="p-3 font-semibold text-[#11112A]">
                      {eventTitle} Ticket
                      {ticket_numbers.length > 0 && (
                        <span className="block text-[11px] font-normal text-[#68677A]">
                          Issued Ticket #{ticket_numbers.join(', #')}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center font-bold text-[#11112A]">{quantity_registered}</td>
                    <td className="p-3 text-right font-medium text-[#68677A]">
                      {ticketPrice > 0 ? `₹${ticketPrice.toFixed(2)}` : 'FREE'}
                    </td>
                    <td className="p-3 text-right font-bold text-[#11112A]">
                      {total_amount_paid > 0 ? `₹${total_amount_paid.toFixed(2)}` : '₹0.00'}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-[#F8F7FC] font-black text-sm text-[#11112A]">
                    <td colSpan="3" className="p-3 text-right uppercase tracking-wider">Total Amount Paid:</td>
                    <td className="p-3 text-right text-[#5B4BFF]">
                      {total_amount_paid > 0 ? `₹${total_amount_paid.toFixed(2)}` : 'FREE (₹0.00)'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Download & Print Actions */}
          <div className="no-print pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 bg-[#5B4BFF] hover:bg-[#4C3CE6] text-white py-3 px-4 rounded-full text-xs font-bold shadow-lg transition flex items-center justify-center gap-2"
            >
              <span>📥</span>
              <span>Download Invoice (PDF)</span>
            </button>
            <button
              onClick={handleClose}
              className="bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] py-3 px-4 rounded-full text-xs font-bold border border-[#C7D2FE] transition flex items-center justify-center gap-1.5"
            >
              <span>🎟️</span>
              <span>View My Bookings</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
