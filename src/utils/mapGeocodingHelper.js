import axios from 'axios';

// In-memory & localStorage Geocoding Cache
const geocodeCache = new Map();

function getCacheKey(prefix, query) {
  return `${prefix}_${String(query).toLowerCase().trim().replace(/[^a-z0-9]/g, '_')}`;
}

function getCachedGeocode(cacheKey) {
  if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey);
  try {
    const stored = localStorage.getItem(`geo_c_${cacheKey}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      geocodeCache.set(cacheKey, parsed);
      return parsed;
    }
  } catch (e) {}
  return null;
}

function setCachedGeocode(cacheKey, data) {
  geocodeCache.set(cacheKey, data);
  try {
    localStorage.setItem(`geo_c_${cacheKey}`, JSON.stringify(data));
  } catch (e) {}
}

// Throttled Request Queue for Fallback OpenStreetMap Nominatim Rate Limiting
const requestQueue = [];
let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return;
  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const task = requestQueue.shift();
    try {
      const result = await task.execute();
      task.resolve(result);
    } catch (err) {
      task.reject(err);
    }
    if (requestQueue.length > 0) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  isProcessingQueue = false;
}

function enqueueThrottledRequest(executeFn) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ execute: executeFn, resolve, reject });
    processQueue();
  });
}

/**
 * Reverse geocodes latitude/longitude into country, state, district, city, address
 * Uses BigDataCloud Free API first (0 rate limits), fallback to Nominatim
 */
export async function reverseGeocode(lat, lng) {
  const cacheKey = getCacheKey('rev', `${lat.toFixed(4)}_${lng.toFixed(4)}`);
  const cached = getCachedGeocode(cacheKey);
  if (cached) return cached;

  // 1. Primary: BigDataCloud Free Reverse Geocoding API (Unlimited, 0 Rate Limits)
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const response = await axios.get(bdcUrl, { timeout: 4000 });

    if (response.data) {
      const d = response.data;
      const country = d.countryName || 'India';
      const state = d.principalSubdivision || '';
      
      const adminList = d.localityInfo?.administrative || [];
      const districtObj = adminList.find((a) => a.order === 4 || a.order === 5);
      const rawDistrict = districtObj ? districtObj.name : (d.city || d.locality || state);
      const district = rawDistrict.replace(/\s+district$/i, '').trim();

      const city = d.city || d.locality || district || 'Bengaluru';
      const locationAddress = d.locality || d.lookupSource || city;

      const result = {
        country,
        state,
        district,
        city,
        locationAddress,
        displayName: `${locationAddress}, ${city}, ${district}, ${state}, ${country}`,
        lat,
        lng,
      };

      setCachedGeocode(cacheKey, result);
      return result;
    }
  } catch (bErr) {
    console.warn('[mapGeocodingHelper] BigDataCloud API notice:', bErr.message);
  }

  // 2. Secondary Fallback: Nominatim OpenStreetMap
  return enqueueThrottledRequest(async () => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const response = await axios.get(url, {
        headers: { 'Accept-Language': 'en-US,en;q=0.9' },
        timeout: 5000,
      });

      if (!response.data || !response.data.address) return null;

      const addr = response.data.address;
      const country = addr.country || 'India';
      const state = addr.state || addr.region || '';
      const rawDistrict = addr.state_district || addr.county || addr.district || addr.city_district || addr.city || addr.town || state;
      const district = rawDistrict.replace(/\s+district$/i, '').trim();
      const city = addr.city || addr.town || addr.suburb || addr.neighbourhood || addr.village || district;

      const addressParts = [
        addr.amenity || addr.building,
        addr.house_number,
        addr.road || addr.street,
        addr.suburb || addr.neighbourhood,
      ].filter(Boolean);

      const locationAddress = addressParts.length > 0
        ? addressParts.join(', ')
        : response.data.display_name?.split(',')[0] || city;

      const result = {
        country,
        state,
        district,
        city,
        locationAddress,
        displayName: response.data.display_name || `${city}, ${district}, ${state}, ${country}`,
        lat,
        lng,
      };

      setCachedGeocode(cacheKey, result);
      return result;
    } catch (err) {
      console.warn('[mapGeocodingHelper] Nominatim fallback notice:', err.message);
      return null;
    }
  });
}

/**
 * Forward geocodes a location query (e.g. "Indiranagar, Bengaluru") into lat/lng
 * Uses Photon OpenStreetMap Geocoder first (Unlimited, 0 Rate Limits), fallback to Nominatim
 */
export async function forwardGeocode(query) {
  if (!query || query.trim().length < 2) return [];

  const cacheKey = getCacheKey('fwd', query);
  const cached = getCachedGeocode(cacheKey);
  if (cached) return cached;

  // 1. Primary: Photon OpenStreetMap Geocoder (Unlimited, 0 Rate Limits)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query.trim())}&limit=5`;
    const response = await axios.get(photonUrl, { timeout: 4000 });

    if (response.data && Array.isArray(response.data.features) && response.data.features.length > 0) {
      const results = response.data.features.map((feat) => {
        const props = feat.properties || {};
        const coords = feat.geometry?.coordinates || [77.5946, 12.9716];
        const country = props.country || 'India';
        const state = props.state || '';
        const rawDistrict = props.county || props.district || props.city || state;
        const district = rawDistrict.replace(/\s+district$/i, '').trim();
        const city = props.city || props.town || props.district || district;

        return {
          lat: coords[1],
          lng: coords[0],
          displayName: [props.name, city, state, country].filter(Boolean).join(', '),
          country,
          state,
          district,
          city,
          locationAddress: props.street || props.name || city,
        };
      });

      if (results.length > 0) {
        setCachedGeocode(cacheKey, results);
        return results;
      }
    }
  } catch (pErr) {
    console.warn('[mapGeocodingHelper] Photon API notice:', pErr.message);
  }

  // 2. Secondary Fallback: Nominatim OpenStreetMap
  return enqueueThrottledRequest(async () => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&addressdetails=1&limit=5`;
      const response = await axios.get(url, {
        headers: { 'Accept-Language': 'en-US,en;q=0.9' },
        timeout: 5000,
      });

      if (!Array.isArray(response.data)) return [];

      const result = response.data.map((item) => {
        const addr = item.address || {};
        const country = addr.country || 'India';
        const state = addr.state || addr.region || '';
        const rawDistrict = addr.state_district || addr.county || addr.district || addr.city || state;
        const district = rawDistrict.replace(/\s+district$/i, '').trim();
        const city = addr.city || addr.town || addr.suburb || addr.neighbourhood || addr.village || district;

        return {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          displayName: item.display_name,
          country,
          state,
          district,
          city,
          locationAddress: [addr.road, addr.suburb || addr.village].filter(Boolean).join(', ') || city,
        };
      });

      if (result.length > 0) {
        setCachedGeocode(cacheKey, result);
      }
      return result;
    } catch (err) {
      console.warn('[mapGeocodingHelper] Nominatim fallback notice:', err.message);
      return [];
    }
  });
}
