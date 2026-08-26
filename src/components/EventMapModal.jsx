import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { forwardGeocode } from '../utils/mapGeocodingHelper';
import CategoryBadge from './CategoryBadge';

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
    attribution: '&copy; Esri',
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
  },
};

export default function EventMapModal({ isOpen, onClose, event }) {
  const [coords, setCoords] = useState(
    event?.latitude && event?.longitude
      ? { lat: event.latitude, lng: event.longitude }
      : null
  );
  const [loading, setLoading] = useState(!coords);
  const [mapType, setMapType] = useState('satellite');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const baseTileRef = useRef(null);
  const labelsTileRef = useRef(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Resolve coordinates if missing
  useEffect(() => {
    let isMounted = true;

    async function resolveCoords() {
      if (!isOpen || !event) return;

      if (event?.latitude && event?.longitude) {
        setCoords({ lat: event.latitude, lng: event.longitude });
        setLoading(false);
        return;
      }

      const searchQuery = [
        event?.location,
        event?.city || event?.neighborhood,
        event?.state,
        event?.country || 'India',
      ]
        .filter(Boolean)
        .join(', ');

      setLoading(true);
      const results = await forwardGeocode(searchQuery);

      if (isMounted) {
        if (results && results.length > 0) {
          setCoords({ lat: results[0].lat, lng: results[0].lng });
        } else {
          setCoords({ lat: 12.9716, lng: 77.5946 });
        }
        setLoading(false);
      }
    }

    resolveCoords();

    return () => {
      isMounted = false;
    };
  }, [isOpen, event]);

  // Mount Leaflet Map instance when modal opens
  useEffect(() => {
    if (!isOpen || !coords || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 16,
        zoomControl: true,
      });

      const config = MAP_TILES.satellite;
      baseTileRef.current = L.tileLayer(config.url, { maxZoom: 19 }).addTo(map);
      labelsTileRef.current = L.tileLayer(config.labelsUrl, { maxZoom: 19, pane: 'markerPane' }).addTo(map);

      L.marker([coords.lat, coords.lng]).addTo(map);

      mapInstanceRef.current = map;

      // Trigger map resize check for modal transitions
      [100, 300, 600].forEach((delay) => {
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, delay);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        baseTileRef.current = null;
        labelsTileRef.current = null;
      }
    };
  }, [isOpen, coords]);

  const toggleMapLayer = () => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const nextType = mapType === 'satellite' ? 'street' : 'satellite';
    setMapType(nextType);

    if (baseTileRef.current) map.removeLayer(baseTileRef.current);
    if (labelsTileRef.current) map.removeLayer(labelsTileRef.current);

    baseTileRef.current = null;
    labelsTileRef.current = null;

    if (nextType === 'satellite') {
      const config = MAP_TILES.satellite;
      baseTileRef.current = L.tileLayer(config.url, { maxZoom: 19 }).addTo(map);
      labelsTileRef.current = L.tileLayer(config.labelsUrl, { maxZoom: 19, pane: 'markerPane' }).addTo(map);
    } else {
      const config = MAP_TILES.street;
      baseTileRef.current = L.tileLayer(config.url, { maxZoom: 19 }).addTo(map);
    }
  };

  if (!isOpen || !event) return null;

  const googleMapsUrl = coords
    ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${event?.location}, ${event?.city}, ${event?.state}`
      )}`;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-[#E8E7EF] rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] flex flex-col font-sans">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#68677A] hover:text-[#11112A] w-9 h-9 rounded-full bg-[#F4F3F8] hover:bg-[#E8E7EF] flex items-center justify-center transition font-bold text-sm z-20"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="mb-4 pr-10">
          <div className="flex items-center gap-2 mb-1">
            <CategoryBadge category={event.category} />
            <span className="text-xs font-bold text-[#5B4BFF] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full border border-[#C7D2FE]">
              📍 Venue Satellite Map
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#11112A] tracking-tight line-clamp-1">
            {event.title}
          </h2>

          <p className="text-xs sm:text-sm text-[#68677A] font-medium mt-1 truncate">
            🏢 {event.location}, {event.city}, {event.state}, {event.country}
          </p>
        </div>

        {/* Layer Toggle Bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold text-[#11112A] flex items-center gap-1.5">
            <span>🗺️</span>
            <span>Interactive Venue Location</span>
          </span>

          <button
            type="button"
            onClick={toggleMapLayer}
            className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-md"
          >
            <span>{mapType === 'satellite' ? '🗺️ Switch to Street View' : '🛰️ Switch to Hybrid Satellite'}</span>
          </button>
        </div>

        {/* Map Canvas */}
        <div className="relative w-full min-h-[360px] rounded-2xl overflow-hidden border border-[#E8E7EF] bg-[#F4F3F8] shadow-inner mb-4">
          <div ref={mapContainerRef} style={{ height: '360px', width: '100%', minHeight: '360px' }} className="z-10 relative" />

          {loading && (
            <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-xs flex items-center justify-center text-xs font-bold text-[#5B4BFF]">
              <div className="bg-white px-5 py-2.5 rounded-full border border-[#E8E7EF] shadow-xl flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                <span>Locating venue on satellite map...</span>
              </div>
            </div>
          )}

          {/* Map Mode Badge */}
          <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#E8E7EF] shadow-md text-[11px] font-bold text-[#11112A]">
            {mapType === 'satellite' ? '🛰️ Hybrid Satellite View' : '🗺️ Street Map View'}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#F0EFF6]">
          <span className="text-xs text-[#68677A] font-medium hidden sm:inline">
            Click markers or drag map canvas to explore surround area.
          </span>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-[#E8E7EF] text-[#68677A] hover:text-[#11112A] hover:bg-[#F4F3F8] font-semibold text-xs transition"
            >
              Close
            </button>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-full bg-[#5B4BFF] hover:bg-[#4C3CE6] text-white font-semibold text-xs transition shadow-md shadow-[#5B4BFF]/20 flex items-center gap-1.5"
            >
              <span>🌐</span>
              <span>Open in Google Maps</span>
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
