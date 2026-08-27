import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';
import PhoneInputWithCountry from './PhoneInputWithCountry';
import { useAuth } from '../context/AuthContext';
import {
  fetchCountriesFromApi,
  fetchStatesFromApi,
  fetchCitiesFromApi,
} from '../data/locationData';

import { validatePhoneNumber } from '../utils/validationHelper';

export default function CompleteProfileModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth();

  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cascading Location Options
  const [countryOptions, setCountryOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);

  useEffect(() => {
    if (isOpen && user) {
      setPhone(user.phone || '');
      setCountry('');
      setState('');
      setDistrict('');
      setCity('');

      fetchCountriesFromApi().then((res) => {
        if (res && res.length) setCountryOptions(res);
      });
    }
  }, [isOpen, user]);

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

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Mobile phone number is required.');
      return;
    }
    if (!validatePhoneNumber(phone)) {
      setError('Please enter a valid 10-digit to 15-digit mobile phone number (e.g. +91 9876543210).');
      return;
    }
    if (!country || !state || !district || !city.trim()) {
      setError('All home location fields (Country, State, District, City) are required for feed personalization.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await updateProfile({
        phone: phone.trim(),
        country: country.trim(),
        state: state.trim(),
        district: district.trim(),
        city: city.trim(),
      });

      Swal.fire({
        title: 'Profile Completed! 🎉',
        text: 'Your phone number & home location have been saved successfully.',
        icon: 'success',
        confirmButtonColor: '#5B4BFF',
        confirmButtonText: 'Continue to Application',
        customClass: {
          popup: 'rounded-3xl p-6 font-sans',
          confirmButton: 'px-5 py-2.5 rounded-full text-xs font-bold shadow-md shadow-[#5B4BFF]/25',
        },
      });

      if (onClose) onClose();
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white border border-[#E8E7EF] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto text-[#11112A] animate-fadeIn">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-xs">
            📱
          </div>
          <h2 className="text-2xl font-extrabold text-[#11112A] mb-1">
            Complete Your Profile *
          </h2>
          <p className="text-[#68677A] text-xs leading-relaxed max-w-xs mx-auto font-medium">
            Welcome <span className="font-bold text-[#11112A]">{user.name}</span>! Google Sign-In succeeded. You must complete your mobile phone number and select your home location to continue.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200/80 text-red-600 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#11112A] mb-1.5">
              Mobile Phone Number *
            </label>
            <PhoneInputWithCountry
              value={phone}
              onChange={(fullVal) => setPhone(fullVal)}
              selectedCountryName={country}
              placeholder="Enter mobile phone number"
            />
          </div>

          <div className="pt-3 border-t border-[#F0EFF6] space-y-3">
            <label className="block text-xs font-bold text-[#11112A]">
              Home Location *
            </label>

            {/* Country */}
            <div>
              <select
                required
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setState('');
                  setDistrict('');
                  setCity('');
                }}
                className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-4 py-2.5 text-xs text-[#11112A] focus:bg-white focus:outline-none focus:border-[#0F172A] transition font-bold"
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
                onChange={(e) => {
                  setState(e.target.value);
                  setDistrict('');
                  setCity('');
                }}
                className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-4 py-2.5 text-xs text-[#11112A] focus:bg-white focus:outline-none focus:border-[#0F172A] transition disabled:opacity-50 font-bold"
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
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setCity('');
                }}
                className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-4 py-2.5 text-xs text-[#11112A] focus:bg-white focus:outline-none focus:border-[#0F172A] transition disabled:opacity-50 font-bold"
              >
                <option value="">Select District *</option>
                {districtOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter City (e.g. Bengaluru) *"
                className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-4 py-2.5 text-xs text-[#11112A] placeholder-[#9291A0] focus:bg-white focus:outline-none focus:border-[#0F172A] transition font-bold"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-sm py-3.5 px-4 rounded-xl transition shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving Profile...' : 'Save Profile & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
