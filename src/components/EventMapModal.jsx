import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Building2, Layers, ExternalLink, Globe } from 'lucide-react';
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
      ? { lat: parseFloat(event.latitude), lng: parseFloat(event.longitude) }
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
        setCoords({ lat: parseFloat(event.latitude), lng: parseFloat(event.longitude) });
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
          setCoords({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lng) });
        } else {
          setCoords({ lat: 11.0168, lng: 76.9558 });
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

      // Custom popup marker
      const marker = L.marker([coords.lat, coords.lng]).addTo(map);
      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <b style="font-size: 13px; color: #0F172A;">${event.title}</b><br/>
          <span style="font-size: 11px; color: #64748B;">${event.location}</span>
        </div>
      `).openPopup();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl relative my-auto max-h-[90vh] flex flex-col font-sans">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#64748B] hover:text-[#0F172A] w-8 h-8 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center transition font-bold text-xs z-20 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-4 pr-10">
          <div className="flex items-center gap-2 mb-1.5">
            <CategoryBadge category={event.category} />
            <span className="text-xs font-bold text-[#0F172A] bg-[#F1F5F9] px-2.5 py-0.5 rounded-full border border-[#E2E8F0] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Marked Location Pin</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight line-clamp-1">
            {event.title}
          </h2>

          <p className="text-xs sm:text-sm text-[#64748B] font-bold mt-1 truncate flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-[#64748B]" />
            <span>{event.location}, {event.city}, {event.state}, {event.country}</span>
          </p>
        </div>

        {/* Layer Toggle Bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#2563EB]" />
            <span>Marked Venue Location</span>
          </span>

          <button
            type="button"
            onClick={toggleMapLayer}
            className="text-xs font-bold text-white bg-[#0F172A] hover:bg-slate-800 px-3 py-1.5 rounded-full transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{mapType === 'satellite' ? 'Switch to Street View' : 'Switch to Satellite'}</span>
          </button>
        </div>

        {/* Map Canvas */}
        <div className="relative w-full min-h-[360px] rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#F1F5F9] shadow-inner mb-4">
          <div ref={mapContainerRef} style={{ height: '360px', width: '100%', minHeight: '360px' }} className="z-10 relative" />

          {loading && (
            <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-xs flex items-center justify-center text-xs font-bold text-[#2563EB]">
              <div className="bg-white px-5 py-2.5 rounded-full border border-[#E2E8F0] shadow-xl flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                <span>Locating venue on map...</span>
              </div>
            </div>
          )}

          {/* Map Mode Badge */}
          <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#E2E8F0] shadow-md text-[11px] font-bold text-[#0F172A] flex items-center gap-1">
            <Globe className="w-3 h-3 text-[#2563EB]" />
            <span>{mapType === 'satellite' ? 'Hybrid Satellite View' : 'Street Map View'}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] flex-wrap gap-2">
          <span className="text-xs text-[#64748B] font-bold hidden sm:inline">
            Interactive map centered on marked event location.
          </span>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs transition shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Google Maps</span>
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
