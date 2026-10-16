import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { socket, connectSocket } from '../lib/socket.js';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Red technician marker
const techIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
  }, [map]);
  return null;
}

export default function LiveTracker({ bookingId, initialCenter }) {
  const [location, setLocation] = useState(null);
  const [stopped, setStopped] = useState(false);
  const [center, setCenter] = useState(initialCenter || [28.6139, 77.209]);

  useEffect(() => {
    connectSocket();
    socket.emit('customer:join', { bookingId });

    const onLocation = (data) => {
      if (data.bookingId !== bookingId) return;
      setLocation({ lat: data.lat, lng: data.lng });
      setCenter([data.lat, data.lng]);
      setStopped(false);
    };

    const onStopped = (data) => {
      if (data.bookingId !== bookingId) return;
      setStopped(true);
    };

    socket.on('tech:location', onLocation);
    socket.on('tech:stopped', onStopped);

    return () => {
      socket.off('tech:location', onLocation);
      socket.off('tech:stopped', onStopped);
    };
  }, [bookingId]);

  return (
    <div className="rounded-xl overflow-hidden border border-line">
      {/* Status bar */}
      <div className="bg-brand-tint p-3 flex items-center justify-between text-sm">
        <span className="font-semibold text-brand-dark">
          {stopped
            ? 'Technician stopped sharing location'
            : location
            ? 'Technician is on the way'
            : 'Waiting for technician location...'}
        </span>
        {!stopped && location && (
          <span className="inline-flex items-center gap-1.5 text-green-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        )}
      </div>

      {/* Map */}
      <div className="w-full" style={{ height: '360px' }}>
        <MapContainer
          center={center}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {location && (
            <Marker position={[location.lat, location.lng]} icon={techIcon}>
              <Popup>Your technician</Popup>
            </Marker>
          )}
          <RecenterMap center={center} />
          <InvalidateOnMount />
        </MapContainer>
      </div>
    </div>
  );
}