import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import BoardPage from './pages/BoardPage';
import MyEventsPage from './pages/MyEventsPage';
import MyBookingsPage from './pages/MyBookingsPage';
import EventDetailPage from './pages/EventDetailPage';
import AuthModal from './components/AuthModal';
import RegistrationModal from './components/RegistrationModal';
import Swal from 'sweetalert2';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, setIsAuthModalOpen } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setIsAuthModalOpen(true);
    }
  }, [loading, isAuthenticated, setIsAuthModalOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9FC] flex items-center justify-center p-6 font-sans">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#5B4BFF]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  return children;
}

function AppContent() {
  const [activeRegistrationEvent, setActiveRegistrationEvent] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const {
    isAuthenticated,
    isAuthModalOpen,
    setIsAuthModalOpen,
    pendingBookingEvent,
    setPendingBookingEvent,
  } = useAuth();

  useEffect(() => {
    if (isAuthenticated && pendingBookingEvent) {
      setActiveRegistrationEvent(pendingBookingEvent);
      setPendingBookingEvent(null);
    }
  }, [isAuthenticated, pendingBookingEvent]);

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    if (location.state?.from && location.state.from !== '/') {
      navigate(location.state.from);
    }
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<BoardPage />} />
        <Route path="/feed" element={<BoardPage />} />
        <Route
          path="/my-events"
          element={
            <ProtectedRoute>
              <MyEventsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/event/:id" element={<EventDetailPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
      </Routes>

      {/* Global Auth Modal - accessible from all pages */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Global Registration Modal for pending post-login bookings */}
      {activeRegistrationEvent && (
        <RegistrationModal
          isOpen={!!activeRegistrationEvent}
          onClose={() => setActiveRegistrationEvent(null)}
          event={activeRegistrationEvent}
          onRsvpSuccess={(eventId, newCount, ticketNumbers) => {
            setActiveRegistrationEvent(null);
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
          }}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
