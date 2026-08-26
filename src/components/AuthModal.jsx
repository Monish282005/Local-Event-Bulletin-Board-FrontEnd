import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import {
  fetchCountriesFromApi,
  fetchStatesFromApi,
  fetchCitiesFromApi,
} from '../data/locationData';

import {
  validatePhoneNumber,
  validateEmail,
  validateName,
  validatePassword,
} from '../utils/validationHelper';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Cascading Location States (unselected initially)
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login, signup, loginWithGoogle } = useAuth();

  // Async location options
  const [countryOptions, setCountryOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);

  // Reset errors and location states whenever modal opens or switches mode
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (isSignup) {
        setCountry('');
        setState('');
        setDistrict('');
        setCity('');
      }
    }
  }, [isOpen, isSignup]);

  useEffect(() => {
    if (isOpen && isSignup) {
      fetchCountriesFromApi().then((res) => {
        if (res && res.length) setCountryOptions(res);
      });
    }
  }, [isOpen, isSignup]);

  useEffect(() => {
    if (country) {
      fetchStatesFromApi(country).then((res) => {
        setStateOptions(res || []);
      });
    } else {
      setStateOptions([]);
    }
  }, [country]);

  useEffect(() => {
    if (country && state) {
      fetchCitiesFromApi(country, state).then((res) => {
        setDistrictOptions(res || []);
      });
    } else {
      setDistrictOptions([]);
    }
  }, [country, state]);

  // Cascading Reset Effects
  const handleCountryChange = (e) => {
    const val = e.target.value;
    setCountry(val);
    setState('');
    setDistrict('');
    setCity('');
  };

  const handleStateChange = (e) => {
    const val = e.target.value;
    setState(val);
    setDistrict('');
    setCity('');
  };

  const handleDistrictChange = (e) => {
    const val = e.target.value;
    setDistrict(val);
    setCity('');
  };

  useEffect(() => {
    if (isOpen && window.google?.accounts?.id) {
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '776471342339-gdmo6r5eoerjssf2mkmtiho1f7elpkvr.apps.googleusercontent.com';
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (response && response.credential) {
              setLoading(true);
              setError(null);
              try {
                await loginWithGoogle({
                  credential: response.credential,
                  city: city || 'Bengaluru',
                  state: state || 'Karnataka',
                  district: district || 'Bengaluru Urban',
                  country: country || 'India',
                });
                onClose();
                if (onSuccess) onSuccess();
              } catch (err) {
                console.error('Google verification error:', err);
                showGoogleErrorAlert(err);
              } finally {
                setLoading(false);
              }
            }
          },
        });
      } catch (err) {
        console.warn('Google Identity initialization notice:', err);
      }
    }
  }, [isOpen]);

  const showGoogleErrorAlert = (err) => {
    const errMsg = err.response?.data?.error || err.message || 'Unable to complete Google authentication.';
    setError(errMsg);
    Swal.fire({
      title: 'Google Sign-In Error ⚠️',
      text: errMsg,
      icon: 'error',
      confirmButtonColor: '#5B4BFF',
      confirmButtonText: 'Try Again',
      customClass: {
        popup: 'rounded-3xl p-6 font-sans',
        confirmButton: 'px-5 py-2.5 rounded-full text-xs font-bold shadow-md shadow-[#5B4BFF]/25',
      },
    });
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '776471342339-gdmo6r5eoerjssf2mkmtiho1f7elpkvr.apps.googleusercontent.com';

    try {
      if (window.google?.accounts?.oauth2) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const googleUser = await userInfoRes.json();

                if (googleUser && googleUser.email) {
                  await loginWithGoogle({
                    email: googleUser.email,
                    name: googleUser.name || googleUser.given_name || 'Google User',
                    google_id: googleUser.sub || `google_${Date.now()}`,
                    city: city || 'Bengaluru',
                    state: state || 'Karnataka',
                    district: district || 'Bengaluru Urban',
                    country: country || 'India',
                  });
                  onClose();
                  if (onSuccess) onSuccess();
                } else {
                  setError('Failed to fetch Google profile info. Please try again.');
                }
              } catch (verifyErr) {
                console.error('Google profile fetch error:', verifyErr);
                setError(verifyErr.response?.data?.error || 'Google login failed.');
              } finally {
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          },
          error_callback: (err) => {
            console.warn('Google OAuth Token Error:', err);
            setError('Google Sign-In request was cancelled or blocked. Please try again.');
            setLoading(false);
          },
        });

        client.requestAccessToken();
      } else {
        setError('Google Identity Services library is loading. Please try clicking again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      setError('Google Sign-In failed. Please try again.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignup) {
        if (!validateName(name)) {
          setError('Full Name is required (minimum 2 characters).');
          setLoading(false);
          return;
        }
        if (!validateEmail(email)) {
          setError('Please enter a valid email address (e.g. user@example.com).');
          setLoading(false);
          return;
        }
        if (!phone.trim()) {
          setError('Mobile phone number is required.');
          setLoading(false);
          return;
        }
        if (!validatePhoneNumber(phone)) {
          setError('Please enter a valid 10-digit to 15-digit mobile phone number (e.g. +91 9876543210).');
          setLoading(false);
          return;
        }
        if (!validatePassword(password)) {
          setError('Password must be at least 8 characters long.');
          setLoading(false);
          return;
        }
        if (!country || !state || !district || !city.trim()) {
          setError('All home location fields (Country, State, District, City) are required.');
          setLoading(false);
          return;
        }

        await signup(name, email, password, {
          phone: phone.trim(),
          country: country.trim(),
          state: state.trim(),
          district: district.trim(),
          city: city.trim(),
        });
      } else {
        if (!validateEmail(email)) {
          setError('Please enter a valid email address.');
          setLoading(false);
          return;
        }
        await login(email, password);
      }

      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Auth error:', err);
      const status = err.response?.status;
      const errMsg = err.response?.data?.error || 'Authentication failed. Please check your details.';
      const isNotFound = status === 404 || err.response?.data?.notFound;

      if (!isSignup && isNotFound) {
        setError(null);
        Swal.fire({
          title: 'Account Not Found! ⚠️',
          text: 'No account exists with this email address. Would you like to sign up to create a new account?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#5B4BFF',
          cancelButtonColor: '#68677A',
          confirmButtonText: 'Go to Sign Up',
          cancelButtonText: 'Try Again',
          customClass: {
            popup: 'rounded-3xl p-6 font-sans',
            confirmButton: 'px-5 py-2.5 rounded-full text-xs font-bold shadow-md shadow-[#5B4BFF]/25',
            cancelButton: 'px-5 py-2.5 rounded-full text-xs font-bold',
          },
        }).then((result) => {
          if (result.isConfirmed) {
            setIsSignup(true);
            setCountry('India');
            setState('Karnataka');
            setDistrict('Bengaluru Urban');
            setCity('Bengaluru');
          }
        });
      } else if (!isSignup && status === 401) {
        setError(errMsg);
        Swal.fire({
          title: 'Incorrect Password 🔑',
          text: 'The password you entered is incorrect. Please check your password and try again.',
          icon: 'error',
          confirmButtonColor: '#5B4BFF',
          confirmButtonText: 'Try Again',
          customClass: {
            popup: 'rounded-3xl p-6 font-sans',
            confirmButton: 'px-5 py-2.5 rounded-full text-xs font-bold shadow-md shadow-[#5B4BFF]/25',
          },
        });
      } else if (isSignup && status === 409) {
        setError(errMsg);
        Swal.fire({
          title: 'Account Already Exists! ℹ️',
          text: 'An account with this email address already exists. Would you like to log in instead?',
          icon: 'info',
          showCancelButton: true,
          confirmButtonColor: '#5B4BFF',
          cancelButtonColor: '#68677A',
          confirmButtonText: 'Switch to Log In',
          cancelButtonText: 'Close',
          customClass: {
            popup: 'rounded-3xl p-6 font-sans',
            confirmButton: 'px-5 py-2.5 rounded-full text-xs font-bold shadow-md shadow-[#5B4BFF]/25',
            cancelButton: 'px-5 py-2.5 rounded-full text-xs font-bold',
          },
        }).then((result) => {
          if (result.isConfirmed) {
            setIsSignup(false);
          }
        });
      } else {
        setError(errMsg);
        Swal.fire({
          title: 'Authentication Alert ⚠️',
          text: errMsg,
          icon: 'error',
          confirmButtonColor: '#5B4BFF',
          confirmButtonText: 'OK',
          customClass: {
            popup: 'rounded-3xl p-6 font-sans',
            confirmButton: 'px-5 py-2.5 rounded-full text-xs font-bold shadow-md shadow-[#5B4BFF]/25',
          },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-[#E8E7EF] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto text-[#11112A]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-[#68677A] hover:text-[#11112A] hover:bg-[#F4F3F8] rounded-full text-base transition font-semibold"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-[#11112A] mb-1">
            {isSignup ? 'Create an Account' : 'Welcome Back'}
          </h2>
          <p className="text-[#68677A] text-xs leading-relaxed">
            {isSignup
              ? 'Sign up with Google or your home location to view localized event feeds'
              : 'Log in to post events and manage your listings'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200/80 text-red-600 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white hover:bg-slate-50 text-[#11112A] font-bold text-xs sm:text-sm py-3 px-4 rounded-xl border border-[#E8E7EF] hover:border-[#5B4BFF] transition flex items-center justify-center gap-3 shadow-2xs cursor-pointer mb-4 group"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{isSignup ? 'Sign up with Google' : 'Continue with Google'}</span>
        </button>

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-[#E8E7EF]"></div>
          <span className="flex-shrink mx-3 text-[10px] uppercase font-bold tracking-wider text-[#9291A0]">
            Or continue with email
          </span>
          <div className="flex-grow border-t border-[#E8E7EF]"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="block text-xs font-semibold text-[#11112A] mb-1.5">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-4 py-2.5 text-sm text-[#11112A] placeholder-[#9291A0] focus:bg-white focus:outline-none focus:border-[#5B4BFF] transition"
              />
            </div>
          )}

          {isSignup && (
            <div>
              <label className="block text-xs font-semibold text-[#11112A] mb-1.5">Mobile Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-4 py-2.5 text-sm text-[#11112A] placeholder-[#9291A0] focus:bg-white focus:outline-none focus:border-[#5B4BFF] transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#11112A] mb-1.5">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-4 py-2.5 text-sm text-[#11112A] placeholder-[#9291A0] focus:bg-white focus:outline-none focus:border-[#5B4BFF] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#11112A] mb-1.5">Password *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-4 py-2.5 text-sm text-[#11112A] placeholder-[#9291A0] focus:bg-white focus:outline-none focus:border-[#5B4BFF] transition"
            />
          </div>

          {/* Cascading Location Selectors for Signup */}
          {isSignup && (
            <div className="pt-2 border-t border-[#F0EFF6] space-y-3">
              <label className="block text-xs font-bold text-[#11112A]">Home Location *</label>

              {/* Country */}
              <div>
                <select
                  required
                  value={country}
                  onChange={handleCountryChange}
                  className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-4 py-2.5 text-xs text-[#11112A] focus:bg-white focus:outline-none focus:border-[#5B4BFF] transition"
                >
                  <option value="">Select Country *</option>
                  {countryOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* State */}
              <div>
                <select
                  required
                  disabled={!country}
                  value={state}
                  onChange={handleStateChange}
                  className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-4 py-2.5 text-xs text-[#11112A] focus:bg-white focus:outline-none focus:border-[#5B4BFF] transition disabled:opacity-50"
                >
                  <option value="">Select State *</option>
                  {stateOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div>
                <select
                  required
                  disabled={!state}
                  value={district}
                  onChange={handleDistrictChange}
                  className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-4 py-2.5 text-xs text-[#11112A] focus:bg-white focus:outline-none focus:border-[#5B4BFF] transition disabled:opacity-50"
                >
                  <option value="">Select District *</option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* City Input */}
              <div>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter your City (e.g. Bengaluru) *"
                  className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-4 py-2.5 text-xs text-[#11112A] placeholder-[#9291A0] focus:bg-white focus:outline-none focus:border-[#5B4BFF] transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5B4BFF] hover:bg-[#4C3CE6] text-white font-bold text-sm py-3 px-4 rounded-xl transition shadow-md shadow-[#5B4BFF]/25 cursor-pointer disabled:opacity-50"
          >
            {loading ? (isSignup ? 'Creating Account...' : 'Logging In...') : isSignup ? 'Create Account' : 'Log In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#68677A]">
          {isSignup ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignup(false);
                  setError(null);
                }}
                className="text-[#5B4BFF] font-bold hover:underline cursor-pointer"
              >
                Log In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignup(true);
                  setError(null);
                }}
                className="text-[#5B4BFF] font-bold hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
