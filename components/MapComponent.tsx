'use client';

import { useEffect, useRef } from 'react';

export interface MapBuilding {
  id: number;
  name: string;
  lat: number;
  lng: number;
  discovered?: boolean;
  isActive?: boolean;
  imageUrl?: string | null;
  outlineImageUrl?: string | null;
}

interface Props {
  buildings: MapBuilding[];
  center?: [number, number];
  zoom?: number;
  onBuildingClick?: (id: number) => void;
  onMapClick?: (lat: number, lng: number) => void;
  height?: string;
  showUserLocation?: boolean;
}

function buildPhotoPin(src: string, color: string, size: number) {
  return `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer">
    <div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;border:3px solid ${color};box-shadow:0 2px 10px rgba(0,0,0,0.35);background:#ddd">
      <img src="${src}" style="width:100%;height:100%;object-fit:cover" />
    </div>
    <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid ${color};margin-top:-2px" />
  </div>`;
}

function buildOutlinePin(src: string, size: number) {
  return `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;opacity:0.65">
    <div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;border:2px solid #999;box-shadow:0 1px 5px rgba(0,0,0,0.2);background:#ccc;filter:grayscale(100%)">
      <img src="${src}" style="width:100%;height:100%;object-fit:cover" />
    </div>
    <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #999;margin-top:-2px" />
  </div>`;
}

export default function MapComponent({
  buildings,
  center = [54.7505, 17.8670],
  zoom = 15,
  onBuildingClick,
  onMapClick,
  height = '400px',
  showUserLocation = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import('leaflet').then((L) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      if (!containerRef.current) return;
      const map = L.map(containerRef.current, { zoomControl: false }).setView(center, zoom);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      if (onMapClick) {
        map.on('click', (e) => onMapClick(e.latlng.lat, e.latlng.lng));
      }

      // User GPS location
      if (showUserLocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const { latitude, longitude } = pos.coords;
          const userIcon = L.divIcon({
            html: `<div style="width:18px;height:18px;border-radius:50%;background:#4A90E2;border:3px solid white;box-shadow:0 0 0 3px rgba(74,144,226,0.3)"></div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
            className: '',
          });
          L.marker([latitude, longitude], { icon: userIcon }).addTo(map);
        });
      }

      buildings.forEach((b) => {
        let markerHtml: string;
        let iconSize: [number, number];
        let iconAnchor: [number, number];

        if (b.isActive) {
          markerHtml = b.imageUrl
            ? buildPhotoPin(b.imageUrl, '#F0A500', 46)
            : `<div style="width:36px;height:44px;display:flex;align-items:center;justify-content:center;">
                <svg viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="#F0A500"/>
                  <text x="18" y="23" font-size="16" text-anchor="middle" fill="white">⚓</text>
                </svg>
              </div>`;
          iconSize = [52, 62];
          iconAnchor = [26, 62];
        } else if (b.discovered) {
          markerHtml = b.imageUrl
            ? buildPhotoPin(b.imageUrl, '#0F5F92', 44)
            : `<div style="width:32px;height:40px;">
                <svg viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24S32 28 32 16C32 7.16 24.84 0 16 0z" fill="#0F5F92"/>
                  <text x="16" y="20" font-size="14" text-anchor="middle" fill="white">✓</text>
                </svg>
              </div>`;
          iconSize = [50, 60];
          iconAnchor = [25, 60];
        } else {
          const undiscoveredImg = b.outlineImageUrl ?? b.imageUrl;
          markerHtml = undiscoveredImg
            ? buildOutlinePin(undiscoveredImg, 38)
            : `<div style="width:28px;height:36px;opacity:0.55;cursor:pointer;">
                <svg viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.27 21.73 0 14 0z" fill="#aaa"/>
                  <circle cx="14" cy="14" r="6" fill="white" fill-opacity="0.6"/>
                  <text x="14" y="19" font-size="10" text-anchor="middle" fill="#aaa">?</text>
                </svg>
              </div>`;
          iconSize = [44, 54];
          iconAnchor = [22, 54];
        }

        const icon = L.divIcon({ html: markerHtml, iconSize, iconAnchor, className: '' });
        const marker = L.marker([b.lat, b.lng], { icon }).addTo(map);

        if (onBuildingClick) {
          marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            onBuildingClick(b.id);
          });
        } else {
          // fallback popup for non-interactive maps
          marker.bindPopup(
            `<strong style="font-family:Montserrat,sans-serif">${b.name}</strong>` +
              (b.discovered ? '<br/><span style="color:#0F5F92;font-size:12px">✓ Odkryty</span>' : '')
          );
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
    <div ref={containerRef} style={{ height, width: '100%' }} className="z-0" />
  );
}
