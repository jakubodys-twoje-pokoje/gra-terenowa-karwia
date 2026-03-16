'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

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

export interface MapHandle {
  panTo: (lat: number, lng: number, zoom?: number) => void;
  openBuilding: (id: number) => void;
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

// Smoother, gentler scale curve — minimum 0.55 so pins never get unreadable
function getScale(zoom: number): number {
  return Math.max(0.55, Math.min(2.2, Math.pow(1.38, zoom - 17)));
}

// ── Pin builders ─────────────────────────────────────────────────────────────
// All pins use:
//  • A circular photo / icon area
//  • A white outer ring for contrast against any map tile
//  • An SVG rounded teardrop pointer (no more CSS border trick)
//  • Drop shadow via filter

function dropShadow(opacity = 0.4) {
  return `drop-shadow(0 3px 8px rgba(0,0,0,${opacity}))`;
}

function photoCircle(src: string, sz: number, ring: string, ringWidth: number, grayscale = false) {
  const rw = ringWidth;
  return `
    <div style="
      position:relative;
      width:${sz}px;height:${sz}px;border-radius:50%;overflow:hidden;
      outline:${rw}px solid white;
      border:${rw}px solid ${ring};
      box-sizing:border-box;
      background:#ccc;
      ${grayscale ? 'filter:grayscale(1) brightness(0.9);' : ''}
    ">
      <img src="${src}" style="width:100%;height:100%;object-fit:cover;display:block;" />
    </div>`;
}

function svgPointer(color: string, w: number) {
  // Smooth rounded teardrop pointer — an SVG arc curving to a point
  const hw = w / 2;
  return `<svg width="${w}" height="${Math.round(w * 0.65)}" viewBox="0 0 ${w} ${Math.round(w * 0.65)}" style="display:block;margin-top:-1px;overflow:visible">
    <path d="M0,0 Q${hw},${Math.round(w * 0.65)} ${w},0" fill="${color}" />
  </svg>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeIcon(L: any, b: MapBuilding, scale: number) {
  let html: string;
  let iconSize: [number, number];
  let iconAnchor: [number, number];

  if (b.isActive) {
    // Gold ring, largest pin
    const sz   = Math.round(50 * scale);
    const tip  = Math.round(16 * scale);
    const tipH = Math.round(10 * scale);
    const src  = b.imageUrl;
    const body = src
      ? photoCircle(src, sz, '#F0A500', Math.max(2, Math.round(3 * scale)))
      : `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:#F0A500;
           outline:${Math.max(2, Math.round(3 * scale))}px solid white;
           display:flex;align-items:center;justify-content:center;font-size:${Math.round(22 * scale)}px;">⚓</div>`;
    html = `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:${dropShadow(0.45)}">
      ${body}
      ${svgPointer('#F0A500', tip)}
    </div>`;
    iconSize   = [sz + 6, sz + tipH + 4];
    iconAnchor = [Math.round((sz + 6) / 2), sz + tipH + 4];

  } else if (b.discovered) {
    // Ocean-blue ring
    const sz   = Math.round(44 * scale);
    const tip  = Math.round(14 * scale);
    const tipH = Math.round(9 * scale);
    const src  = b.imageUrl;
    const body = src
      ? photoCircle(src, sz, '#0F5F92', Math.max(2, Math.round(3 * scale)))
      : `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:#0F5F92;
           outline:${Math.max(2, Math.round(3 * scale))}px solid white;
           display:flex;align-items:center;justify-content:center;font-size:${Math.round(18 * scale)}px;color:white;font-weight:bold;">✓</div>`;
    html = `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:${dropShadow(0.35)}">
      ${body}
      ${svgPointer('#0F5F92', tip)}
    </div>`;
    iconSize   = [sz + 6, sz + tipH + 4];
    iconAnchor = [Math.round((sz + 6) / 2), sz + tipH + 4];

  } else {
    // Undiscovered — greyscale outline image or "?" placeholder
    const sz   = Math.round(38 * scale);
    const tip  = Math.round(12 * scale);
    const tipH = Math.round(8 * scale);
    const src  = b.outlineImageUrl ?? b.imageUrl;
    const body = src
      ? photoCircle(src, sz, '#9CA3AF', Math.max(2, Math.round(2 * scale)), /* grayscale */ true)
      : `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:#E5E7EB;
           outline:${Math.max(2, Math.round(2 * scale))}px solid white;
           border:${Math.max(2, Math.round(2 * scale))}px solid #9CA3AF;
           box-sizing:border-box;
           display:flex;align-items:center;justify-content:center;font-size:${Math.round(15 * scale)}px;color:#9CA3AF;">?</div>`;
    html = `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:${dropShadow(0.2)};opacity:0.85">
      ${body}
      ${svgPointer('#9CA3AF', tip)}
    </div>`;
    iconSize   = [sz + 6, sz + tipH + 4];
    iconAnchor = [Math.round((sz + 6) / 2), sz + tipH + 4];
  }

  return L.divIcon({ html, iconSize, iconAnchor, className: '' });
}

// ── Component ────────────────────────────────────────────────────────────────

const MapComponent = forwardRef<MapHandle, Props>(function MapComponent(
  {
    buildings,
    center = KARWIA_CENTER,
    zoom = 17,
    onBuildingClick,
    onMapClick,
    height = '400px',
    showUserLocation = false,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<import('leaflet').Map | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef   = useRef<{ marker: any; building: MapBuilding }[]>([]);

  // Expose imperative API
  useImperativeHandle(ref, () => ({
    panTo(lat, lng, z) {
      if (!mapRef.current) return;
      mapRef.current.flyTo([lat, lng], z ?? mapRef.current.getZoom(), { duration: 0.8 });
    },
    openBuilding(id) {
      const entry = markersRef.current.find((e) => e.building.id === id);
      if (entry) entry.marker.openPopup?.();
      if (onBuildingClick) onBuildingClick(id);
    },
  }));

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import('leaflet').then((L) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      if (!containerRef.current) return;
      const map = L.map(containerRef.current, { zoomControl: false }).setView(center, zoom);
      mapRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      if (onMapClick) {
        map.on('click', (e) => onMapClick(e.latlng.lat, e.latlng.lng));
      }

      // User GPS dot
      if (showUserLocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            const userIcon = L.divIcon({
              html: `<div style="width:18px;height:18px;border-radius:50%;background:#4A90E2;border:3px solid white;box-shadow:0 0 0 3px rgba(74,144,226,0.3)"></div>`,
              iconSize: [18, 18], iconAnchor: [9, 9], className: '',
            });
            L.marker([latitude, longitude], { icon: userIcon }).addTo(map);
            map.setView([latitude, longitude], map.getZoom());
          },
          () => {},
        );
      }

      // Build markers
      const initialScale = getScale(zoom);
      markersRef.current = [];

      buildings.forEach((b) => {
        const icon   = makeIcon(L, b, initialScale);
        const marker = L.marker([b.lat, b.lng], { icon }).addTo(map);

        if (onBuildingClick) {
          marker.on('click', (e: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            L.DomEvent.stopPropagation(e as any);
            onBuildingClick(b.id);
          });
        } else {
          marker.bindPopup(
            `<strong style="font-family:Kanit,sans-serif">${b.name}</strong>` +
            (b.discovered ? '<br/><span style="color:#0F5F92;font-size:12px">✓ Odkryty</span>' : ''),
          );
        }
        markersRef.current.push({ marker, building: b });
      });

      // Rescale all markers on zoom change
      map.on('zoomend', () => {
        const scale = getScale(map.getZoom());
        markersRef.current.forEach(({ marker, building }) => {
          marker.setIcon(makeIcon(L, building, scale));
        });
      });
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} style={{ height, width: '100%' }} className="z-0" />;
});

export default MapComponent;
