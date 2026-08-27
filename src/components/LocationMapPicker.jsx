import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { reverseGeocode, forwardGeocode } from '../utils/mapGeocodingHelper';

// Fix Leaflet default marker icons for Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MAP_TILES = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    labelsUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    transportUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
};

export default function LocationMapPicker({
  initialLat = 12.9716,
  initialLng = 77.5946,
  onLocationSelect,
  selectedLocationText = '',
}) {
  const [position, setPosition] = useState([initialLat, initialLng]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationStatus, setLocationStatus] = useState(selectedLocationText || '');
  const [mapType, setMapType] = useState('satellite'); // default Hybrid Satellite map view

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  
  const baseTileLayerRef = useRef(null);
  const labelsLayerRef = useRef(null);
  const transportLayerRef = useRef(null);

  const applyLayers = (type) => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Remove existing layers
    if (baseTileLayerRef.current) map.removeLayer(baseTileLayerRef.current);
    if (labelsLayerRef.current) map.removeLayer(labelsLayerRef.current);
    if (transportLayerRef.current) map.removeLayer(transportLayerRef.current);

    baseTileLayerRef.current = null;
    labelsLayerRef.current = null;
    transportLayerRef.current = null;

    if (type === 'satellite') {
      const config = MAP_TILES.satellite;
      baseTileLayerRef.current = L.tileLayer(config.url, { maxZoom: 19, attribution: config.attribution }).addTo(map);
      labelsLayerRef.current = L.tileLayer(config.labelsUrl, { maxZoom: 19, pane: 'markerPane' }).addTo(map);
      transportLayerRef.current = L.tileLayer(config.transportUrl, { maxZoom: 19, pane: 'shadowPane' }).addTo(map);
    } else {
      const config = MAP_TILES.street;
      baseTileLayerRef.current = L.tileLayer(config.url, { maxZoom: 19, attribution: config.attribution }).addTo(map);
    }
  };

  // Initialize Leaflet Map instance on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 15,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // Apply hybrid satellite layers with city and place labels
      applyLayers('satellite');

      const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        handlePickPosition(lat, lng);
      });

      marker.on('dragend', () => {
        const latLng = marker.getLatLng();
        handlePickPosition(latLng.lat, latLng.lng);
      });

      markerInstanceRef.current = marker;

      // Trigger map resize check for modal transitions
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 300);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
        baseTileLayerRef.current = null;
        labelsLayerRef.current = null;
        transportLayerRef.current = null;
      }
    };
  }, []);

  const toggleMapType = () => {
    const nextType = mapType === 'satellite' ? 'street' : 'satellite';
    setMapType(nextType);
    applyLayers(nextType);
  };

  const updateMapMarkerPosition = (lat, lng, zoomLevel = 15) => {
    setPosition([lat, lng]);

    if (markerInstanceRef.current) {
      markerInstanceRef.current.setLatLng([lat, lng]);
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], zoomLevel, { duration: 1.2 });
    }
  };

  const handlePickPosition = async (lat, lng) => {
    setPosition([lat, lng]);
    setIsGeocoding(true);

    const data = await reverseGeocode(lat, lng);
    setIsGeocoding(false);

    if (data) {
      const summaryText = `${data.city || data.district}, ${data.state}, ${data.country}`;
      setLocationStatus(summaryText);
      if (onLocationSelect) {
        onLocationSelect(data);
      }
    }
  };

  const handleSearchSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const results = await forwardGeocode(searchQuery);
    setIsSearching(false);
    setSearchResults(results);

    if (results.length > 0) {
      const first = results[0];
      updateMapMarkerPosition(first.lat, first.lng, 15);
      handlePickPosition(first.lat, first.lng);
    }
  };

  const handleSelectSearchResult = (result) => {
    updateMapMarkerPosition(result.lat, result.lng, 15);
    setSearchResults([]);
    setSearchQuery(result.displayName);

    setLocationStatus(`${result.city || result.district}, ${result.state}, ${result.country}`);
    if (onLocationSelect) {
      onLocationSelect(result);
    }
  };

  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        updateMapMarkerPosition(latitude, longitude, 16);
        handlePickPosition(latitude, longitude);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setIsGeocoding(false);
        alert('Could not detect GPS location. Please pick manually on the map.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="w-full space-y-3 font-sans">
      {/* Map Control Header: Search & GPS Detect & Satellite Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearchSubmit(e);
              }
            }}
            placeholder="🔍 Search city, landmark, or street on map..."
            className="w-full pl-9 pr-20 py-2.5 rounded-xl border border-[#E8E7EF] text-xs font-medium text-[#11112A] bg-white focus:outline-none focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/20 transition shadow-2xs"
          />
          <span className="absolute left-3 top-2.5 text-xs text-[#68677A]">📍</span>
          <button
            type="button"
            onClick={handleSearchSubmit}
            disabled={isSearching}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-[#0F172A] text-white text-[11px] font-bold hover:bg-[#1E293B] transition disabled:opacity-50"
          >
            {isSearching ? '...' : 'Search'}
          </button>

          {/* Auto-suggest Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E8E7EF] rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-[#E8E7EF]">
              {searchResults.map((res, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSearchResult(res)}
                  className="p-2.5 hover:bg-[#F4F3F8] cursor-pointer text-xs text-[#11112A] font-medium transition"
                >
                  <span className="font-bold text-[#0F172A] block">{res.city}, {res.district || res.state}</span>
                  <span className="text-[11px] text-[#68677A] truncate block">{res.displayName}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Hybrid Satellite Map Toggle Button */}
          <button
            type="button"
            onClick={toggleMapType}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
          >
            <span>{mapType === 'satellite' ? '🗺️ Street View' : '🛰️ Hybrid Satellite'}</span>
          </button>

          {/* GPS Location Detector */}
          <button
            type="button"
            onClick={handleDetectCurrentLocation}
            className="px-3.5 py-2.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] border border-[#E2E8F0] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <span>🎯</span>
            <span>Detect GPS</span>
          </button>
        </div>
      </div>

      {/* Interactive Leaflet Map Canvas */}
      <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-[#E8E7EF] shadow-inner bg-[#F4F3F8]">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Map Helper Badge Overlay */}
        <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#E8E7EF] shadow-md text-[11px] font-bold text-[#11112A] flex items-center gap-1.5">
          <span>{mapType === 'satellite' ? '🛰️ Hybrid Satellite View (With Place & Street Labels)' : '🗺️ Street View'}</span>
          <span>• Click or drag pin to set location</span>
        </div>

        {isGeocoding && (
          <div className="absolute inset-0 z-[500] bg-white/60 backdrop-blur-xs flex items-center justify-center text-xs font-bold text-[#0F172A]">
            <div className="bg-white px-4 py-2 rounded-full border border-[#E8E7EF] shadow-xl flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              <span>Fetching location & district details...</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Location Status Footer */}
      {locationStatus && (
        <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl flex items-center justify-between text-xs font-medium text-[#047857]">
          <div className="flex items-center gap-2 truncate">
            <span>📍</span>
            <span className="truncate">
              Selected: <strong>{locationStatus}</strong>
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-[#A7F3D0]">
            Auto-Filled
          </span>
        </div>
      )}
    </div>
  );
}
