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

const KARWIA_CENTER: [number, number] = [54.828701688893595, 18.210140614060844];

function getScale(zoom: number): number {
  return Math.max(0.4, Math.min(2.5, Math.pow(1.4, zoom - 17)));
}

function buildPhotoPin(src: string, color: string, size: number) {
  const tip = Math.round(size * 0.18);
  return `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer">
    <div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;border:3px solid ${color};box-shadow:0 2px 10px rgba(0,0,0,0.35);background:#ddd">
      <img src="${src}" style="width:100%;height:100%;object-fit:cover" />
    </div>
    <div style="width:0;height:0;border-left:${tip}px solid transparent;border-right:${tip}px solid transparent;border-top:${Math.round(tip * 1.4)}px solid ${color};margin-top:-2px" />
  </div>`;
}

function buildOutlinePin(src: string, size: number) {
  const tip = Math.round(size * 0.18);
  return `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer">
    <div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;border:2px solid #999;box-shadow:0 1px 5px rgba(0,0,0,0.2);background:#ccc;filter:grayscale(100%)">
      <img src="${src}" style="width:100%;height:100%;object-fit:cover" />
    </div>
    <div style="width:0;height:0;border-left:${tip}px solid transparent;border-right:${tip}px solid transparent;border-top:${Math.round(tip * 1.4)}px solid #999;margin-top:-2px" />
  </div>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeIcon(L: any, b: MapBuilding, scale: number) {
  let markerHtml: string;
  let iconSize: [number, number];
  let iconAnchor: [number, number];

  if (b.isActive) {
    const sz = Math.round(46 * scale);
    markerHtml = b.imageUrl
      ? buildPhotoPin(b.imageUrl, '#F0A500', sz)
      : `<div style="width:${Math.round(36 * scale)}px;height:${Math.round(44 * scale)}px;display:flex;align-items:center;justify-content:center;">
          <svg viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
            <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="#F0A500"/>
            <text x="18" y="23" font-size="16" text-anchor="middle" fill="white">⚓</text>
          </svg>
        </div>`;
    iconSize = [sz + 8, sz + 18];
    iconAnchor = [Math.round((sz + 8) / 2), sz + 18];
  } else if (b.discovered) {
    const sz = Math.round(44 * scale);
    markerHtml = b.imageUrl
      ? buildPhotoPin(b.imageUrl, '#0F5F92', sz)
      : `<div style="width:${Math.round(32 * scale)}px;height:${Math.round(40 * scale)}px;">
          <svg viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
            <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24S32 28 32 16C32 7.16 24.84 0 16 0z" fill="#0F5F92"/>
            <text x="16" y="20" font-size="14" text-anchor="middle" fill="white">✓</text>
          </svg>
        </div>`;
    iconSize = [sz + 6, sz + 16];
    iconAnchor = [Math.round((sz + 6) / 2), sz + 16];
  } else {
    const undiscoveredImg = b.outlineImageUrl ?? b.imageUrl;
    const sz = Math.round(38 * scale);
    markerHtml = undiscoveredImg
      ? buildOutlinePin(undiscoveredImg, sz)
      : `<div style="width:${Math.round(28 * scale)}px;height:${Math.round(36 * scale)}px;cursor:pointer;">
          <svg viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
            <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.27 21.73 0 14 0z" fill="#aaa"/>
            <circle cx="14" cy="14" r="6" fill="white" fill-opacity="0.6"/>
            <text x="14" y="19" font-size="10" text-anchor="middle" fill="#aaa">?</text>
          </svg>
        </div>`;
    iconSize = [sz + 6, sz + 16];
    iconAnchor = [Math.round((sz + 6) / 2), sz + 16];
  }

  return L.divIcon({ html: markerHtml, iconSize, iconAnchor, className: '' });
}

export default function MapComponent({
  buildings,
  center = KARWIA_CENTER,
  zoom = 17,
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

      // User GPS location — pan to user on first fix
      if (showUserLocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            const userIcon = L.divIcon({
              html: `<div style="width:18px;height:18px;border-radius:50%;background:#4A90E2;border:3px solid white;box-shadow:0 0 0 3px rgba(74,144,226,0.3)"></div>`,
              iconSize: [18, 18],
              iconAnchor: [9, 9],
              className: '',
            });
            L.marker([latitude, longitude], { icon: userIcon }).addTo(map);
            map.setView([latitude, longitude], map.getZoom());
          },
          // On error or denial — stay at Karwia center (already set above)
          () => {}
        );
      }

      // Build markers with zoom-scaled icons
      const markerList: { marker: import('leaflet').Marker; building: MapBuilding }[] = [];
      const initialScale = getScale(zoom);

      buildings.forEach((b) => {
        const icon = makeIcon(L, b, initialScale);
        const marker = L.marker([b.lat, b.lng], { icon }).addTo(map);

        if (onBuildingClick) {
          marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            onBuildingClick(b.id);
          });
        } else {
          marker.bindPopup(
            `<strong style="font-family:Montserrat,sans-serif">${b.name}</strong>` +
              (b.discovered ? '<br/><span style="color:#0F5F92;font-size:12px">✓ Odkryty</span>' : '')
          );
        }

        markerList.push({ marker, building: b });
      });

      // Rescale all markers on zoom change
      map.on('zoomend', () => {
        const scale = getScale(map.getZoom());
        markerList.forEach(({ marker, building }) => {
          marker.setIcon(makeIcon(L, building, scale));
        });
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
