import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import {
  fetchCountriesFromApi,
  fetchStatesFromApi,
  fetchCitiesFromApi,
  getCountries,
  getStates,
  getDistricts,
} from '../data/locationData';

const CATEGORIES = [
  { value: 'sports', label: 'Sports' },
  { value: 'music', label: 'Music' },
  { value: 'food', label: 'Food & Drink' },
  { value: 'yard_sale', label: 'Yard Sale' },
  { value: 'other', label: 'Other' },
];

export default function CreateEventModal({ isOpen, onClose, onEventCreated }) {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('sports');
  const [location, setLocation] = useState('');
  const [neighborhood, setNeighborhood] = useState(user?.city || '');
  const [eventDatetime, setEventDatetime] = useState('');
  const [totalTickets, setTotalTickets] = useState(50);
  const [allowCancellation, setAllowCancellation] = useState(true);
  const [imageUrl, setImageUrl] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Structured Location States (pre-filled with logged-in user location if available)
  const [country, setCountry] = useState(user?.country || '');
  const [state, setState] = useState(user?.state || '');
  const [district, setDistrict] = useState(user?.district || '');
  const [city, setCity] = useState(user?.city || '');

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sync user location defaults when modal opens or user updates
  useEffect(() => {
    if (isOpen && user) {
      setCountry(user.country || '');
      setState(user.state || '');
      setDistrict(user.district || '');
      setCity(user.city || '');
      setNeighborhood(user.city || '');
    }
  }, [isOpen, user]);

  // Async location options
  const [countryOptions, setCountryOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchCountriesFromApi().then((res) => {
        if (res && res.length) setCountryOptions(res);
      });
    }
  }, [isOpen]);

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

    const effectiveNeighborhood = (neighborhood || city || '').trim();
    const effectiveCity = (city || neighborhood || '').trim();

    // Basic required check
    if (
      !title.trim() ||
      !description.trim() ||
      !location.trim() ||
      !effectiveNeighborhood ||
      !eventDatetime ||
      !country ||
      !state ||
      !district ||
      !effectiveCity
    ) {
      setError('All fields including country, state, district, and city are required.');
      return;
    }

    // Client-side future date validation
    const selectedDate = new Date(eventDatetime);
    if (isNaN(selectedDate.getTime()) || selectedDate.getTime() <= Date.now()) {
      setError('Event date & time must be in the future.');
      return;
    }

    setLoading(true);

    try {
      const response = await axiosClient.post('/api/events', {
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        neighborhood: effectiveNeighborhood,
        country: country.trim(),
        state: state.trim(),
        district: district.trim(),
        city: effectiveCity,
        event_datetime: selectedDate.toISOString(),
        total_tickets: parseInt(totalTickets, 10) || 50,
        allow_cancellation: allowCancellation,
        image_url: imageUrl || null,
      });

      if (response.data?.id && imageUrl) {
        try {
          localStorage.setItem(`event_img_${response.data.id}`, imageUrl);
        } catch (e) {
          console.warn('LocalStorage image quota notice');
        }
      }

      // Clear form
      setTitle('');
      setDescription('');
      setCategory('sports');
      setLocation('');
      setNeighborhood('');
      setEventDatetime('');
      setTotalTickets(50);
      setImageUrl('');
      setError(null);

      onClose();
      if (onEventCreated) {
        onEventCreated(response.data);
      }
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err.response?.data?.error || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-[#E8E7EF] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto text-[#11112A]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-[#68677A] hover:text-[#11112A] hover:bg-[#F4F3F8] rounded-full text-base transition font-semibold"
        >
          ✕
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-[#11112A] mb-1">Post a New Event</h2>
          <p className="text-[#68677A] text-xs">
            Share an upcoming gathering or announcement with your local neighborhood.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200/80 text-red-600 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#11112A] mb-1.5">Event Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer Community BBQ & Live Band"
              className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-4 py-2.5 text-sm text-[#11112A] placeholder-[#9291A0] focus:bg-white focus:outline-none focus:border-[#5B4BFF] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#11112A] mb-1.5">Event Banner Image (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-3 py-2 text-xs text-[#11112A] file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#5B4BFF] file:text-white hover:file:bg-[#4C3CE6] transition cursor-pointer"
            />
            {imageUrl && (
              <div className="mt-2 relative w-full h-36 rounded-2xl overflow-hidden border border-[#E8E7EF]">
                <img src={imageUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 bg-slate-900/70 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#11112A] mb-1.5">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-3 py-2.5 text-xs text-[#11112A] focus:bg-white focus:outline-none focus:border-[#5B4BFF] transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#11112A] mb-1.5">Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={eventDatetime}
                onChange={(e) => setEventDatetime(e.target.value)}
                className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-3 py-2 text-xs text-[#11112A] focus:bg-white focus:outline-none focus:border-[#5B4BFF] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#11112A] mb-1.5">Total Capacity / Tickets *</label>
              <input
                type="number"
                min="1"
                max="10000"
                required
                value={totalTickets}
                onChange={(e) => setTotalTickets(e.target.value)}
                placeholder="50"
                className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-3 py-2 text-xs text-[#11112A] focus:bg-white focus:outline-none focus:border-[#5B4BFF] transition"
              />
            </div>
          </div>

          {/* Cascading Structured Location Fields */}
          <div className="pt-2 border-t border-[#F0EFF6] space-y-3">
            <span className="block text-xs font-bold text-[#5B4BFF] uppercase tracking-wider">Event Location Region</span>

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
                  onChange={(e) => {
                    setCity(e.target.value);
                    setNeighborhood(e.target.value);
                  }}
                  disabled={!district}
                  placeholder="e.g. Indiranagar, Komarapalayam, Bengaluru"
                  className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-3 py-2 text-xs text-[#11112A] placeholder-[#9291A0] focus:bg-white focus:outline-none focus:border-[#5B4BFF] transition disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#11112A] mb-1.5">Location Address *</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Central Park Pavilion 3"
              className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-4 py-2.5 text-sm text-[#11112A] placeholder-[#9291A0] focus:bg-white focus:outline-none focus:border-[#5B4BFF] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#11112A] mb-1.5">Description *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the event, parking instructions, entry details..."
              className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-4 py-2.5 text-sm text-[#11112A] placeholder-[#9291A0] focus:bg-white focus:outline-none focus:border-[#5B4BFF] transition"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#F8F7FC] border border-[#E8E7EF] rounded-xl">
            <div>
              <label className="text-xs font-bold text-[#11112A] block">Allow Ticket Cancellations</label>
              <span className="text-[10px] text-[#68677A] font-medium">Permit registered attendees to cancel their booking passes</span>
            </div>
            <input
              type="checkbox"
              checked={allowCancellation}
              onChange={(e) => setAllowCancellation(e.target.checked)}
              className="w-4 h-4 text-[#5B4BFF] rounded focus:ring-[#5B4BFF] border-[#E8E7EF] cursor-pointer"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 text-[#68677A] text-xs font-semibold border border-[#E8E7EF] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-full bg-[#5B4BFF] hover:bg-[#4C3CE6] active:bg-[#3F2FD1] text-white font-semibold text-xs transition shadow-md shadow-[#5B4BFF]/20 disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
