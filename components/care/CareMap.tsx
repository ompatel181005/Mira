"use client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

// Fix default icons for Next.js bundling
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const ER_ICON = L.divIcon({
  className: "",
  html: '<div style="background:#dc2626;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:700;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)">ER</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 11);
  }, [lat, lng, map]);
  return null;
}

export type Pin = {
  name: string;
  lat: number;
  lng: number;
  phone: string;
  has_er?: boolean;
  source: string;
};

export default function CareMap({
  center,
  pins,
}: {
  center: { lat: number; lng: number };
  pins: Pin[];
}) {
  return (
    <div className="w-full h-72 sm:h-[420px] rounded-xl overflow-hidden border">
      <MapContainer center={[center.lat, center.lng]} zoom={11} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter lat={center.lat} lng={center.lng} />
        {pins.map((p, i) => (
          <Marker key={i} position={[p.lat, p.lng]} icon={p.has_er ? ER_ICON : DefaultIcon}>
            <Popup>
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-slate-500">{p.source}</div>
              <a className="text-brand-600 underline text-sm" href={`tel:${p.phone}`}>
                {p.phone}
              </a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
