import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import LocationMapPicker from './LocationMapPicker';
import { forwardGeocode } from '../utils/mapGeocodingHelper';
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
  const [neighborhood, setNeighborhood] = useState('');
  const [eventDatetime, setEventDatetime] = useState('');
  const [totalTickets, setTotalTickets] = useState(50);
  const [ticketPrice, setTicketPrice] = useState(0);
  const [allowCancellation, setAllowCancellation] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cascading location state
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');

  const [countryOptions, setCountryOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);

  // Interactive Map State
  const [showMap, setShowMap] = useState(true);
  const [mapCoords, setMapCoords] = useState({ lat: 12.9716, lng: 77.5946 });

  // Auto-fill defaults from User profile if available
  useEffect(() => {
    if (user && isOpen) {
      if (user.country) setCountry(user.country);
      if (user.state) setState(user.state);
      if (user.district) setDistrict(user.district);
      if (user.city) {
        setCity(user.city);
        setNeighborhood(user.city);
      }
    }
  }, [user, isOpen]);

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

  // Map Selection Auto-fill handler
  const handleMapLocationSelect = async (mapData) => {
    if (!mapData) return;

    const {
      country: mCountry,
      state: mState,
      district: mDistrict,
      city: mCity,
      locationAddress: mAddress,
      lat,
      lng,
    } = mapData;

    if (lat && lng) {
      setMapCoords({ lat, lng });
    }

    if (mCountry) setCountry(mCountry);
    if (mState) setState(mState);
    if (mDistrict) setDistrict(mDistrict);
    if (mCity) {
      setCity(mCity);
      setNeighborhood(mCity);
    }
    if (mAddress) {
      setLocation(mAddress);
    }

    // Async update cascading dropdown options & perform smart district matching
    if (mCountry && mState) {
      const states = await fetchStatesFromApi(mCountry);
      if (states && states.length) setStateOptions(states);

      const cities = await fetchCitiesFromApi(mCountry, mState);
      if (cities && cities.length) {
        setDistrictOptions(cities);

        // Smart District Matcher against available district options
        let matchedDistrict = cities.find(
          (c) => c.toLowerCase() === (mDistrict || '').toLowerCase()
        );

        if (!matchedDistrict && mDistrict) {
          matchedDistrict = cities.find(
            (c) => mDistrict.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(mDistrict.toLowerCase())
          );
        }

        if (!matchedDistrict && mCity) {
          matchedDistrict = cities.find(
            (c) => mCity.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(mCity.toLowerCase())
          );
        }

        if (matchedDistrict) {
          setDistrict(matchedDistrict);
        } else if (mDistrict) {
          setDistrict(mDistrict);
        }
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Image file size must be less than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setImageUrl(compressedDataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const modalContainerRef = useRef(null);

  const scrollModalToTop = () => {
    if (modalContainerRef.current) {
      modalContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const effectiveNeighborhood = (neighborhood || city || '').trim();
    const effectiveCity = (city || neighborhood || '').trim();
    const effectiveDescription = (description && description.trim()) ? description.trim() : `Join us for ${title.trim()}!`;
    const effectiveLocation = (location && location.trim()) ? location.trim() : `${effectiveNeighborhood}, ${effectiveCity}`;

    // Basic required check
    if (
      !title.trim() ||
      !effectiveNeighborhood ||
      !eventDatetime ||
      !country ||
      !state ||
      !district ||
      !effectiveCity
    ) {
      const errMsg = 'All fields including country, state, district, and city are required.';
      setError(errMsg);
      scrollModalToTop();
      Swal.fire({
        title: 'Missing Required Fields',
        text: errMsg,
        icon: 'warning',
        confirmButtonColor: '#5B4BFF',
        customClass: { popup: 'rounded-3xl p-6 font-sans' },
      });
      return;
    }

    // Client-side future date validation
    const selectedDate = new Date(eventDatetime);
    if (isNaN(selectedDate.getTime()) || selectedDate.getTime() <= Date.now()) {
      const errMsg = 'Event date & time must be in the future. Please select a future date and time.';
      setError(errMsg);
      scrollModalToTop();
      Swal.fire({
        title: 'Invalid Event Date',
        text: errMsg,
        icon: 'error',
        confirmButtonColor: '#5B4BFF',
        customClass: { popup: 'rounded-3xl p-6 font-sans' },
      });
      return;
    }

    setLoading(true);

    try {
      let finalLat = mapCoords?.lat || null;
      let finalLng = mapCoords?.lng || null;

      if (!finalLat || !finalLng) {
        try {
          const query = `${effectiveLocation}, ${effectiveCity}, ${state.trim()}, ${country.trim()}`;
          const results = await forwardGeocode(query);
          if (results && results.length > 0) {
            finalLat = results[0].lat;
            finalLng = results[0].lng;
          }
        } catch (gErr) {
          console.warn('Forward geocoding notice:', gErr);
        }
      }

      const response = await axiosClient.post('/api/events', {
        title: title.trim(),
        description: effectiveDescription,
        category,
        location: effectiveLocation,
        neighborhood: effectiveNeighborhood,
        country: country.trim(),
        state: state.trim(),
        district: district.trim(),
        city: effectiveCity,
        event_datetime: selectedDate.toISOString(),
        total_tickets: parseInt(totalTickets, 10) || 50,
        ticket_price: Math.max(0, parseFloat(ticketPrice) || 0),
        allow_cancellation: allowCancellation,
        latitude: finalLat,
        longitude: finalLng,
        image_url: imageUrl || null,
      });

      if (response.data?.id && imageUrl) {
        try {
          localStorage.setItem(`event_img_${response.data.id}`, imageUrl);
        } catch (e) {
          console.warn('LocalStorage image quota notice');
        }
      }

      const createdTitle = title.trim();

      // Clear form
      setTitle('');
      setDescription('');
      setCategory('sports');
      setLocation('');
      setNeighborhood('');
      setEventDatetime('');
      setTotalTickets(50);
      setTicketPrice(0);
      setImageUrl('');
      setError(null);

      if (onEventCreated) {
        onEventCreated();
      }
      onClose();

      Swal.fire({
        title: 'Event Published! 🎉',
        text: `Your event "${createdTitle}" has been published successfully and is now live for community members!`,
        icon: 'success',
        confirmButtonColor: '#5B4BFF',
        confirmButtonText: 'Great!',
        customClass: {
          popup: 'rounded-3xl p-6 font-sans',
          confirmButton: 'px-6 py-2.5 rounded-full text-xs font-bold shadow-md shadow-[#5B4BFF]/25',
        },
      });
    } catch (err) {
      console.error('Failed to post event:', err);
      const errMsg = err.response?.data?.error || 'Failed to post event. Please try again.';
      setError(errMsg);
      scrollModalToTop();
      Swal.fire({
        title: 'Error Creating Event',
        text: errMsg,
        icon: 'error',
        confirmButtonColor: '#5B4BFF',
        customClass: { popup: 'rounded-3xl p-6 font-sans' },
      });
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div ref={modalContainerRef} className="bg-white border border-[#E8E7EF] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#68677A] hover:text-[#11112A] w-8 h-8 rounded-full bg-[#F4F3F8] hover:bg-[#E8E7EF] flex items-center justify-center transition font-bold"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <span className="inline-block text-xs font-extrabold text-[#5B4BFF] uppercase tracking-wider mb-1">
            Community Bulletin
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#11112A] tracking-tight">
            Post a New Local Event
          </h2>
          <p className="text-xs sm:text-sm text-[#68677A] font-medium mt-1">
            Pick a spot on the interactive map or select regions to auto-fill Country, State, District, City & Address!
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
            {error}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#11112A] mb-1.5">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-3 py-2 text-xs text-[#11112A] focus:bg-white focus:outline-none focus:border-[#5B4BFF] transition"
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
              <label className="block text-xs font-semibold text-[#11112A] mb-1.5">Total Tickets *</label>
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

            <div>
              <label className="block text-xs font-semibold text-[#11112A] mb-1.5">Ticket Price (₹) *</label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
                placeholder="0 (Free)"
                className="w-full bg-[#F4F3F8] border border-[#E8E7EF] rounded-xl px-3 py-2 text-xs text-[#11112A] focus:bg-white focus:outline-none focus:border-[#5B4BFF] transition"
              />
            </div>
          </div>

          {/* Interactive Map Picker Section */}
          <div className="pt-2 border-t border-[#F0EFF6] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5B4BFF] uppercase tracking-wider flex items-center gap-1.5">
                <span>🗺️</span>
                <span>Interactive Location Map Picker</span>
              </span>
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="text-xs font-semibold text-[#5B4BFF] hover:underline"
              >
                {showMap ? 'Hide Map ▲' : 'Show Map ▼'}
              </button>
            </div>

            {showMap && (
              <LocationMapPicker
                initialLat={mapCoords.lat}
                initialLng={mapCoords.lng}
                selectedLocationText={city && state ? `${city}, ${state}, ${country}` : ''}
                onLocationSelect={handleMapLocationSelect}
              />
            )}
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
                  placeholder="e.g. Indiranagar, Komarapalayam, Karutr"
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

          {/* Cancellation Policy Checkbox */}
          <div className="pt-2 border-t border-[#F0EFF6]">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={allowCancellation}
                onChange={(e) => setAllowCancellation(e.target.checked)}
                className="w-4 h-4 rounded text-[#5B4BFF] focus:ring-[#5B4BFF]"
              />
              <span className="text-xs font-semibold text-[#11112A]">
                Allow attendees to cancel their booking passes
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#F0EFF6]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-[#E8E7EF] text-[#68677A] hover:text-[#11112A] hover:bg-[#F4F3F8] font-semibold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-full bg-[#5B4BFF] hover:bg-[#4C3CE6] text-white font-semibold text-xs transition shadow-md shadow-[#5B4BFF]/20 disabled:opacity-50"
            >
              {loading ? 'Publishing Event...' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
