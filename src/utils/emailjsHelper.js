import axios from 'axios';

export const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_dtdc1i7';
export const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_o68loll';
export const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'XKPihqhW-GdZF_BwL';

/**
 * Client-side helper to send invoice email via EmailJS (service_dtdc1i7 / template_o68loll).
 */
export async function sendEmailJsInvoice({
  to_name,
  to_email,
  event_name,
  event_date,
  event_location,
  ticket_type = 'Standard Entry Pass',
  quantity = 1,
  amount = '0.00',
  payment_id = 'FREE_RSVP',
  order_id = 'ORD_FREE',
  payment_date = new Date().toLocaleDateString(),
  publicKey = EMAILJS_PUBLIC_KEY,
}) {
  try {
    const payload = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      template_params: {
        to_email: to_email,
        user_email: to_email,
        email: to_email,
        to: to_email,
        recipient: to_email,
        recipient_email: to_email,
        reply_to: to_email,

        to_name: to_name || 'Valued Customer',
        user_name: to_name || 'Valued Customer',
        name: to_name || 'Valued Customer',

        event_name: event_name || 'Local Event',
        event_title: event_name || 'Local Event',
        event_date: event_date || 'N/A',
        event_location: event_location || 'Venue Location',
        ticket_type,
        quantity,
        amount,
        payment_id,
        order_id,
        payment_date,
      },
    };

    if (publicKey) {
      payload.user_id = publicKey;
    }

    const res = await axios.post('https://api.emailjs.com/api/v1.0/email/send', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('[EmailJS Client] ✅ Invoice email sent successfully:', res.data);
    return true;
  } catch (err) {
    console.warn('[EmailJS Client] Notice: EmailJS request completed with status/notice:', err.response?.data || err.message);
    return false;
  }
}
