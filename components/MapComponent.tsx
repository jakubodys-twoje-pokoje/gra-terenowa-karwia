'use client';

import { useEffect, useRef } from 'react';

export interface MapBuilding {
  id: number;
  name: string;
  lat: number;
  lng: number;
  discovered?: boolean;
  isActive?: boolean;
}

interface Props {
  buildings: MapBuilding[];
  center?: [number, number];
  zoom?: number;
  onBuildingClick?: (id: number) => void;
  onMapClick?: (lat: number, lng: number) => void;
  height?: string;
}

export default function MapComponent({
  buildings,
  center = [54.7505, 17.8670],
  zoom = 15,
  onBuildingClick,
  onMapClick,
  height = '400px',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then((L) => {
      // Fix default icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      if (!containerRef.current) return;
      const map = L.map(containerRef.current).setView(center, zoom);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      if (onMapClick) {
        map.on('click', (e) => onMapClick(e.latlng.lat, e.latlng.lng));
      }

      // Add markers
      buildings.forEach((b) => {
        const markerHtml = b.isActive
          ? `<div style="width:36px;height:44px;display:flex;align-items:center;justify-content:center;">
               <svg viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
                 <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="#F0A500"/>
                 <text x="18" y="23" font-size="16" text-anchor="middle" fill="white">⚓</text>
               </svg>
             </div>`
          : b.discovered
          ? `<div style="width:32px;height:40px;">
               <svg viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
                 <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24S32 28 32 16C32 7.16 24.84 0 16 0z" fill="#0F5F92"/>
                 <text x="16" y="20" font-size="14" text-anchor="middle" fill="white">✓</text>
               </svg>
             </div>`
          : `<div style="width:28px;height:36px;opacity:0.6;">
               <svg viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
                 <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.27 21.73 0 14 0z" fill="#888"/>
                 <circle cx="14" cy="14" r="5" fill="white"/>
               </svg>
             </div>`;

        const icon = L.divIcon({
          html: markerHtml,
          iconSize: b.isActive ? [36, 44] : b.discovered ? [32, 40] : [28, 36],
          iconAnchor: b.isActive ? [18, 44] : b.discovered ? [16, 40] : [14, 36],
          className: '',
        });

        const marker = L.marker([b.lat, b.lng], { icon }).addTo(map);
        marker.bindPopup(
          `<strong style="font-family:Montserrat,sans-serif">${b.name}</strong>` +
            (b.discovered ? '<br/><span style="color:#0F5F92;font-size:12px">✓ Odkryty</span>' : '')
        );

        if (onBuildingClick) {
          marker.on('click', () => onBuildingClick(b.id));
        }
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} style={{ height, width: '100%' }} className="rounded-3xl overflow-hidden z-0" />
  );
}
