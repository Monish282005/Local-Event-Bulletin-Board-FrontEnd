import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchCountriesFromApi,
  fetchStatesFromApi,
  fetchCitiesFromApi,
  getCountries,
  getStates,
  getDistricts,
} from '../data/locationData';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Cascading Location States (empty initially, user must choose)
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();

  // Async location options
  const [countryOptions, setCountryOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);

  // Reset all states to empty whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPassword('');
      setCountry('');
      setState('');
      setDistrict('');
      setCity('');
      setError(null);
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignup) {
        if (!name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters long');
          setLoading(false);
          return;
        }
        if (!country || !state || !district || !city) {
          setError('All location fields (Country, State, District, City) are required');
          setLoading(false);
          return;
        }
        await signup(name, email, password, { country, state, district, city });
      } else {
        await login(email, password);
      }

      setName('');
      setEmail('');
      setPassword('');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.response?.data?.error || 'Authentication failed. Please check your details.');
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
              ? 'Sign up with your home location to view localized event feeds'
              : 'Log in to post events and manage your listings'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200/80 text-red-600 text-xs font-semibold">
            {error}
          </div>
        )}

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

          {/* Cascading Location Inputs for Signup */}
          {isSignup && (
            <div className="pt-2 border-t border-[#F0EFF6] space-y-3">
              <span className="block text-xs font-bold text-[#5B4BFF] uppercase tracking-wider">Your Home Location</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#11112A] mb-1">Country *</label>
                  <select
                    value={country}
                    onChange={handleCountryChange}
                    className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-3 py-2 text-xs text-[#11112A] focus:bg-white focus:outline-none focus:border-[#5B4BFF] transition"
                  >
                    <option value="">Select Country</option>
                    {countryOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#11112A] mb-1">State *</label>
                  <select
                    value={state}
                    onChange={handleStateChange}
                    disabled={!country}
                    className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-3 py-2 text-xs text-[#11112A] focus:bg-white focus:outline-none focus:border-[#5B4BFF] transition disabled:opacity-50"
                  >
                    <option value="">Select State</option>
                    {stateOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#11112A] mb-1">District *</label>
                  <select
                    value={district}
                    onChange={handleDistrictChange}
                    disabled={!state}
                    className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-3 py-2 text-xs text-[#11112A] focus:bg-white focus:outline-none focus:border-[#5B4BFF] transition disabled:opacity-50"
                  >
                    <option value="">Select District</option>
                    {districtOptions.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#11112A] mb-1">Neighborhood / City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={!district}
                    placeholder="e.g. Indiranagar, Komarapalayam, Bengaluru"
                    className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-3 py-2 text-xs text-[#11112A] placeholder-[#9291A0] focus:bg-white focus:outline-none focus:border-[#5B4BFF] transition disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-[#5B4BFF] hover:bg-[#4C3CE6] active:bg-[#3F2FD1] text-white font-semibold text-sm transition shadow-md shadow-[#5B4BFF]/20 disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing...' : isSignup ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#68677A]">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setCountry('');
              setState('');
              setDistrict('');
              setCity('');
              setError(null);
            }}
            className="text-[#5B4BFF] hover:underline font-bold ml-1"
          >
            {isSignup ? 'Log In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}


