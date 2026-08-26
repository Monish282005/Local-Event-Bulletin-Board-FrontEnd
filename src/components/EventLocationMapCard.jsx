import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { forwardGeocode } from '../utils/mapGeocodingHelper';

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

export default function EventLocationMapCard({ event }) {
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

  // Auto-geocode if coordinates were not provided (for manually entered events)
  useEffect(() => {
    let isMounted = true;

    async function resolveCoords() {
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
          // Default fallback coordinates (Bengaluru Center)
          setCoords({ lat: 12.9716, lng: 77.5946 });
        }
        setLoading(false);
      }
    }

    resolveCoords();

    return () => {
      isMounted = false;
    };
  }, [event]);

  // Mount Leaflet Map instance
  useEffect(() => {
    if (!coords || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 15,
        zoomControl: true,
      });

      const config = MAP_TILES.satellite;
      baseTileRef.current = L.tileLayer(config.url, { maxZoom: 19 }).addTo(map);
      labelsTileRef.current = L.tileLayer(config.labelsUrl, { maxZoom: 19, pane: 'markerPane' }).addTo(map);

      L.marker([coords.lat, coords.lng]).addTo(map);

      mapInstanceRef.current = map;

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 300);
    } else {
      mapInstanceRef.current.flyTo([coords.lat, coords.lng], 15);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        baseTileRef.current = null;
        labelsTileRef.current = null;
      }
    };
  }, [coords]);

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

  const googleMapsUrl = coords
    ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${event?.location}, ${event?.city}, ${event?.state}`
      )}`;

  return (
    <div className="w-full bg-white border border-[#E8E7EF] rounded-2xl overflow-hidden shadow-sm space-y-2 p-3 font-sans">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#11112A] flex items-center gap-1.5">
          <span>📍</span>
          <span>Venue Map & Directions</span>
        </span>
        <button
          type="button"
          onClick={toggleMapLayer}
          className="text-[11px] font-bold text-[#5B4BFF] bg-[#EEF2FF] hover:bg-[#E0E7FF] px-2.5 py-1 rounded-lg transition"
        >
          {mapType === 'satellite' ? '🗺️ Street View' : '🛰️ Hybrid Satellite'}
        </button>
      </div>

      <div className="relative w-full h-44 sm:h-52 rounded-xl overflow-hidden border border-[#E8E7EF] bg-[#F4F3F8]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#5B4BFF]">
            <span>⏳ Locating event venue on map...</span>
          </div>
        ) : (
          <div ref={mapContainerRef} className="w-full h-full z-10" />
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-xs text-[#68677A] font-medium truncate">
          {event?.location}, {event?.city}, {event?.state}
        </span>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg bg-[#5B4BFF] hover:bg-[#4C3CE6] text-white text-[11px] font-bold transition flex items-center gap-1 flex-shrink-0 shadow-xs"
        >
          <span>🌐</span>
          <span>Google Maps</span>
        </a>
      </div>
    </div>
  );
}
