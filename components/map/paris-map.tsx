"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { PARIS_CENTER } from "@/lib/opendata/datasets";
import type { MapMarker } from "@/lib/opendata/markers";
import "leaflet/dist/leaflet.css";

function MapBounds({
  onBounds,
}: {
  onBounds?: (bbox: { south: number; west: number; north: number; east: number }) => void;
}) {
  const map = useMap();

  useMapEvents({
    moveend() {
      if (!onBounds) return;
      const bounds = map.getBounds();
      onBounds({
        south: bounds.getSouth(),
        west: bounds.getWest(),
        north: bounds.getNorth(),
        east: bounds.getEast(),
      });
    },
  });

  useEffect(() => {
    if (!onBounds) return;
    const bounds = map.getBounds();
    onBounds({
      south: bounds.getSouth(),
      west: bounds.getWest(),
      north: bounds.getNorth(),
      east: bounds.getEast(),
    });
  }, [map, onBounds]);

  return null;
}

export function ParisMap({
  markers,
  onBounds,
  className = "",
  center = PARIS_CENTER,
  zoom = 12,
}: {
  markers: MapMarker[];
  onBounds?: (bbox: { south: number; west: number; north: number; east: number }) => void;
  className?: string;
  center?: { lat: number; lon: number };
  zoom?: number;
}) {
  return (
    <div className={`surface-panel overflow-hidden ${className}`}>
      <MapContainer
        center={[center.lat, center.lon]}
        zoom={zoom}
        className="h-[420px] w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onBounds ? <MapBounds onBounds={onBounds} /> : null}
        {markers.map((marker) => (
          <CircleMarker
            key={marker.id}
            center={[marker.position.lat, marker.position.lon]}
            radius={7}
            pathOptions={{
              color: marker.color ?? "#12263a",
              fillColor: marker.color ?? "#c8102e",
              fillOpacity: 0.85,
              weight: 1,
            }}
          >
            <Popup>
              <strong>{marker.label}</strong>
              {marker.description ? <div>{marker.description}</div> : null}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
