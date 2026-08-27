import React, { createContext, useState, useEffect, useContext } from 'react';
import Swal from 'sweetalert2';
import axiosClient from '../api/axiosClient';

/**
 * SECURITY NOTE ON JWT STORAGE TRADE-OFF:
 * In this application, JWT authentication tokens are stored in `localStorage` to support
 * seamless, decoupled client-server hosting across different domains/origins.
 */

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Pending Auth & Booking State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingBookingEvent, setPendingBookingEvent] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await axiosClient.get('/api/auth/me');
          setUser(res.data.user);
          setToken(storedToken);
        } catch (err) {
          console.error('Session expired or invalid:', err);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const promptLoginForBooking = (eventToBook) => {
    setPendingBookingEvent(eventToBook);
    Swal.fire({
      title: 'Sign In Required',
      text: 'You must be signed in to reserve tickets for this event. Would you like to sign in or create an account now?',
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#0F172A',
      cancelButtonColor: '#68677A',
      confirmButtonText: 'Sign In / Register',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'rounded-3xl p-6 font-sans',
        confirmButton: 'px-5 py-2.5 rounded-full text-xs font-bold shadow-md',
        cancelButton: 'px-5 py-2.5 rounded-full text-xs font-bold',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        setIsAuthModalOpen(true);
      }
    });
  };

  const login = async (email, password) => {
    const res = await axiosClient.post('/api/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    return res.data;
  };

  const signup = async (name, email, password, countryOrLocation, stateArg, districtArg, cityArg) => {
    let locationFields = {};
    if (typeof countryOrLocation === 'object' && countryOrLocation !== null) {
      locationFields = countryOrLocation;
    } else {
      locationFields = {
        country: countryOrLocation,
        state: stateArg,
        district: districtArg,
        city: cityArg,
      };
    }

    const payload = {
      name,
      email,
      password,
      ...locationFields,
    };

    const res = await axiosClient.post('/api/auth/signup', payload);
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    return res.data;
  };

  const loginWithGoogle = async (googlePayload) => {
    const res = await axiosClient.post('/api/auth/google', googlePayload);
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    return res.data;
  };

  const updateProfile = async (updateData) => {
    const res = await axiosClient.put('/api/auth/me', updateData);
    if (res.data && res.data.user) {
      setUser(res.data.user);
    }
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setPendingBookingEvent(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isAuthModalOpen,
        setIsAuthModalOpen,
        pendingBookingEvent,
        setPendingBookingEvent,
        promptLoginForBooking,
        login,
        signup,
        loginWithGoogle,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
