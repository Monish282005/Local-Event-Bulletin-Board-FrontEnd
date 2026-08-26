# Local Event Bulletin Board — Frontend Client

A modern, high-performance web application built with **React (Vite)**, **Leaflet Maps**, **EmailJS**, and **Tailwind CSS**. Designed for local event discovery, location-aware feed browsing, interactive satellite mapping, ticket booking, invoice generation, and automated confirmation emails.

---

## 🌟 Key Features

### 1. 🏙️ Hierarchical & City-Filtered Event Feeds
- **Hierarchical Tiered Feed**: Organizes events into **Top Picks in Your City**, **Events in Your State**, and **Events Across Your Country**.
- **City Selector Modal**: Allows users to dynamically change their active city location with instant feed updates.
- **Category Filter Bar**: Filter events by category (Music, Tech, Sports, Arts, Community, Workshops, Food, Networking).

### 2. 🛰️ Interactive Hybrid Satellite Maps & Dual-Geocoding
- **Interactive Location Map Picker (`LocationMapPicker.jsx`)**: Allows event creators to select location either by picking a pin on a Hybrid Esri Satellite map (with street/landmark label overlays) OR by typing region dropdowns (`Country`, `State`, `District`, `City`).
- **Smart District Auto-Fill Matcher**: Automatically matches reverse-geocoded place names against official state district lists.
- **On-Demand Location Map Modal Popup (`EventMapModal.jsx`)**: Click **`📍 View Map 🗺️`** on any event card to open a high-resolution interactive Hybrid Satellite modal centered on the venue with zoom controls, layer toggling (`Satellite` vs `Street View`), and a **`🌐 Google Maps`** driving directions trigger.
- **Throttled & Cached Geocoding (`mapGeocodingHelper.js`)**: Integrated **Photon OpenStreetMap API** and **BigDataCloud API** with persistent `localStorage` caching to guarantee zero HTTP 429 rate limit errors.

### 3. 🎟️ Ticket Registration & Booking Passes
- **Registration Modal**: Select number of tickets, enter guest details, and instantly claim tickets with real-time seat availability updates.
- **Booking Pass Card (`BookingPassCard.jsx`)**: Displays digital event passes with unique ticket numbers, venue details, and QR codes.
- **PDF/Printable Pass**: Download or print digital event passes.

### 4. 🧾 Automated Invoice Delivery & EmailJS Integration
- **Digital Invoice Modal (`InvoiceModal.jsx`)**: Generates structured purchase invoices with transaction breakdown, GST/Tax calculations, payment metadata, and customer details.
- **EmailJS Confirmation (`emailjsHelper.js`)**: Sends automatic confirmation emails containing booking pass details and invoices directly to user inboxes upon successful ticket registration.

### 5. 🔐 User Authentication & Profile Customization
- **Auth Modals (`AuthModal.jsx`)**: Login and Signup with location selection (Country, State, District, City).
- **Profile Completion Modal (`CompleteProfileModal.jsx`)**: Prompts existing users to complete required location parameters.
- **My Bookings & My Events Pages**: Manage registered tickets and view created events with owner edit/delete controls.

---

## 📁 Directory Structure

```
client/
├── public/
├── src/
│   ├── api/
│   │   └── axiosClient.js          # Axios instance with JWT interceptors
│   ├── components/
│   │   ├── AttendeesModal.jsx       # Event creator attendee viewer
│   │   ├── AuthModal.jsx            # Login & Signup modal with location dropdowns
│   │   ├── BookingPassCard.jsx      # Digital ticket pass component
│   │   ├── CategoryBadge.jsx        # Category pill styling component
│   │   ├── CategoryFilterBar.jsx    # Category filter buttons
│   │   ├── CitySelectorModal.jsx    # Quick city selector modal
│   │   ├── CompleteProfileModal.jsx # Location backfill modal for legacy accounts
│   │   ├── CreateEventModal.jsx     # Event creation modal with map picker
│   │   ├── EditEventModal.jsx       # Event edit modal with location sync
│   │   ├── EventCard.jsx            # Event item card with map modal trigger
│   │   ├── EventGrid.jsx            # Responsive grid container
│   │   ├── EventLocationMapCard.jsx # Mini inline map preview component
│   │   ├── EventMapModal.jsx        # Fullscreen interactive satellite map popup
│   │   ├── FilterControls.jsx       # Search & filter inputs
│   │   ├── InvoiceModal.jsx         # Printable purchase invoice modal
│   │   ├── LocationMapPicker.jsx    # Pure Leaflet DOM satellite map picker
│   │   ├── Navbar.jsx               # Navigation bar with location selector
│   │   ├── Pagination.jsx           # Pagination controls
│   │   ├── RegistrationModal.jsx    # Ticket booking modal
│   │   └── TieredEventBoard.jsx     # Hierarchical feed section board
│   ├── context/
│   │   └── AuthContext.jsx          # React context for auth state & user location
│   ├── data/
│   │   └── locationData.js          # Canonical location dataset & helper APIs
│   ├── pages/
│   │   ├── BoardPage.jsx            # Main hierarchical event feed page
│   │   ├── EventDetailsPage.jsx     # Single event detail page
│   │   ├── MyBookingsPage.jsx       # User ticket bookings page
│   │   └── MyEventsPage.jsx         # User created events page
│   ├── utils/
│   │   ├── emailjsHelper.js         # EmailJS API dispatch helper
│   │   └── mapGeocodingHelper.js    # Photon & BigDataCloud cached geocoder
│   ├── App.jsx                      # App router & layout routes
│   ├── index.css                    # Tailwind CSS imports & global styles
│   └── main.jsx                     # Vite entry point
├── .env                             # Environment variables
├── package.json                     # Dependencies & scripts
└── vite.config.js                   # Vite builder configuration
```

---

## 🛠️ Environment Variables (`client/.env`)

Create a `.env` file in the `client/` root directory:

```env
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:5000

# Client App Base URL (used for shareable event links)
VITE_APP_BASE_URL=http://localhost:5173

# EmailJS Service Credentials
VITE_EMAILJS_SERVICE_ID=service_dtdc1i7
VITE_EMAILJS_TEMPLATE_ID=template_o68loll
VITE_EMAILJS_PUBLIC_KEY=XKPihqhW-GdZF_BwL
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation & Run

1. Navigate to the `client` folder:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. Build for production:
   ```bash
   npm run build
   ```

---

## 🔒 Security & Best Practices

- **JWT Token Storage**: Auth tokens are stored in `localStorage` to allow independent cross-origin client/server deployment.
- **Client-side Sanitization**: Inputs are sanitized to prevent XSS.
- **Throttled Geocoding**: OpenStreetMap queries are cached and throttled to prevent API rate limits.
