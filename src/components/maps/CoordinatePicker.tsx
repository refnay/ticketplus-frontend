'use client';

import React, { useEffect } from 'react';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';

interface CoordinatePickerProps {
  latitude: number;
  longitude: number;
  onChange: (coordinates: { latitude: number; longitude: number }) => void;
}

function MapInteraction({ onChange }: Pick<CoordinatePickerProps, 'onChange'>) {
  useMapEvents({
    click(event) {
      onChange({
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });
  return null;
}

function MapViewport({ center }: { center: LatLngExpression }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
}

export default function CoordinatePicker({ latitude, longitude, onChange }: CoordinatePickerProps) {
  const center: LatLngExpression = [latitude, longitude];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
      <MapContainer center={center} zoom={15} scrollWheelZoom className="h-72 w-full" aria-label="Selector de coordenadas del recinto">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={center}
          radius={9}
          pathOptions={{ color: '#4338CA', fillColor: '#4F46E5', fillOpacity: 0.9, weight: 3 }}
        />
        <MapInteraction onChange={onChange} />
        <MapViewport center={center} />
      </MapContainer>
    </div>
  );
}
