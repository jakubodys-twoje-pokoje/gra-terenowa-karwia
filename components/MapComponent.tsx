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
  /** When false, disables all user interactions (static thumbnail mode) */
  interactive?: boolean;
  /** User's avatar URL — shown on the location dot; null/undefined = blue placeholder */
  userAvatarUrl?: string | null;
  /** Called once the Leaflet map is ready — gives caller an imperative handle */
  onMapReady?: (handle: MapHandle) => void;
  /** Called on every GPS position update (only when showUserLocation=true) */
  onUserLocation?: (lat: number, lng: number) => void;
}

const KARWIA_CENTER: [number, number] = [54.828701688893595, 18.210140614060844];
const LOGO_URL = '/icons/karwia-logo.webp';

function getScale(zoom: number): number {
  return Math.max(0.55, Math.min(2.2, Math.pow(1.38, zoom - 17)));
}

// ── Pin builders ─────────────────────────────────────────────────────────────

function dropShadow(opacity = 0.4) {
  return `drop-shadow(0 3px 8px rgba(0,0,0,${opacity}))`;
}

function photoCircle(src: string, sz: number, ring: string, ringW: number, grayscale = false) {
  return `
    <div style="
      width:${sz}px;height:${sz}px;border-radius:50%;overflow:hidden;
      outline:${ringW}px solid white;
      border:${ringW}px solid ${ring};
      box-sizing:border-box;background:#ccc;
      ${grayscale ? 'filter:grayscale(1) brightness(0.9);' : ''}
    ">
      <img src="${src}" style="width:100%;height:100%;object-fit:cover;display:block;" />
    </div>`;
}

function svgPointer(color: string, w: number) {
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
    const sz  = Math.round(50 * scale);
    const tip = Math.round(16 * scale);
    const tipH = Math.round(10 * scale);
    const rw  = Math.max(2, Math.round(3 * scale));
    // Always show the Karwia logo (or building photo if available)
    const src = b.imageUrl ?? LOGO_URL;
    html = `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:${dropShadow(0.5)}">
      ${photoCircle(src, sz, '#F0A500', rw)}
      ${svgPointer('#F0A500', tip)}
    </div>`;
    iconSize   = [sz + 6, sz + tipH + 4];
    iconAnchor = [Math.round((sz + 6) / 2), sz + tipH + 4];

  } else if (b.discovered) {
    const sz  = Math.round(44 * scale);
    const tip = Math.round(14 * scale);
    const tipH = Math.round(9 * scale);
    const rw  = Math.max(2, Math.round(3 * scale));
    const src = b.imageUrl;
    const body = src
      ? photoCircle(src, sz, '#0F5F92', rw)
      : `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:#0F5F92;
           outline:${rw}px solid white;box-sizing:border-box;
           display:flex;align-items:center;justify-content:center;font-size:${Math.round(18 * scale)}px;color:white;font-weight:bold;">✓</div>`;
    html = `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:${dropShadow(0.35)}">
      ${body}
      ${svgPointer('#0F5F92', tip)}
    </div>`;
    iconSize   = [sz + 6, sz + tipH + 4];
    iconAnchor = [Math.round((sz + 6) / 2), sz + tipH + 4];

  } else {
    const sz  = Math.round(38 * scale);
    const tip = Math.round(12 * scale);
    const tipH = Math.round(8 * scale);
    const rw  = Math.max(1, Math.round(2 * scale));
    const src = b.outlineImageUrl ?? b.imageUrl;
    const body = src
      ? photoCircle(src, sz, '#9CA3AF', rw, true)
      : `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:#0F5F92;
           outline:${rw}px solid white;border:${rw}px solid #0F5F92;box-sizing:border-box;
           display:flex;align-items:center;justify-content:center;overflow:hidden;">
           <img src="${LOGO_URL}" style="width:70%;height:70%;object-fit:contain;display:block;filter:brightness(0) invert(1);opacity:0.7;" />
         </div>`;
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

export default function MapComponent({
  buildings,
  center = KARWIA_CENTER,
  zoom = 17,
  onBuildingClick,
  onMapClick,
  height = '400px',
  showUserLocation = false,
  interactive = true,
  userAvatarUrl: _userAvatarUrlRaw,
  onMapReady,
  onUserLocation,
}: Props) {
  // Never pass blob: URLs into Leaflet HTML strings — they can be revoked and crash marker rendering
  const userAvatarUrl = _userAvatarUrlRaw?.startsWith('blob:') ? null : _userAvatarUrlRaw;

  const containerRef        = useRef<HTMLDivElement>(null);
  const mapRef              = useRef<import('leaflet').Map | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef          = useRef<{ marker: any; building: MapBuilding }[]>([]);
  // Ref to the add-markers function; set once Leaflet has loaded
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addMarkersRef       = useRef<((b: MapBuilding[]) => void) | null>(null);
  // Always reflects the latest buildings array, used inside Leaflet async closure
  const buildingsRef        = useRef(buildings);
  // Always reflects the latest onBuildingClick, used inside marker handlers
  const onBuildingClickRef  = useRef(onBuildingClick);

  // Keep refs in sync with props
  useEffect(() => { buildingsRef.current = buildings; }, [buildings]);
  useEffect(() => { onBuildingClickRef.current = onBuildingClick; }, [onBuildingClick]);

  // Re-add building markers whenever the buildings array changes (covers the case where
  // the Leaflet chunk was already cached and the effect ran before the API responded)
  useEffect(() => {
    addMarkersRef.current?.(buildings);
  }, [buildings]);

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapOptions: any = {
        zoomControl: false,
        dragging:        interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        touchZoom:       interactive,
        keyboard:        interactive,
        tap:             interactive,
      };
      const map = L.map(containerRef.current, mapOptions).setView(center, zoom);
      mapRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      if (onMapClick) {
        map.on('click', (e) => onMapClick(e.latlng.lat, e.latlng.lng));
      }

      // Build markers FIRST — before registering watchPosition, which may fire
      // synchronously on some mobile browsers (cached GPS position), and could
      // otherwise prevent building pins from being added if it throws.
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

      // User GPS dot — registered AFTER building markers so a synchronous GPS
      // callback (cached position) can never block building pin creation.
      if (showUserLocation && navigator.geolocation) {
        let userMarker: import('leaflet').Marker | null = null;
        let firstFix = true;

        const buildUserIcon = (avatarUrl?: string | null) => {
          const inner = avatarUrl
            ? `<div style="width:28px;height:28px;border-radius:50%;overflow:hidden;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);background:#ddd">
                 <img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" />
               </div>`
            : `<div style="width:28px;height:28px;border-radius:50%;background:#4A90E2;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                   <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                 </svg>
               </div>`;
          return L.divIcon({
            html: `<div style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.3))">${inner}</div>`,
            iconSize: [28, 28], iconAnchor: [14, 14], className: '',
          });
        };

        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            try {
              const { latitude, longitude } = pos.coords;

              if (!userMarker) {
                userMarker = L.marker([latitude, longitude], { icon: buildUserIcon(userAvatarUrl), zIndexOffset: -100 }).addTo(map);
              } else {
                userMarker.setLatLng([latitude, longitude]);
              }

              if (firstFix) {
                firstFix = false;
                map.setView([latitude, longitude], map.getZoom());
              }

              onUserLocation?.(latitude, longitude);
            } catch {
              // Never let GPS marker errors propagate — building pins must stay intact
            }
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
        );

        const origRemove = map.remove.bind(map);
        map.remove = () => {
          navigator.geolocation.clearWatch(watchId);
          return origRemove();
        };
      }

      // Rescale markers on zoom change
      map.on('zoomend', () => {
        const scale = getScale(map.getZoom());
        markersRef.current.forEach(({ marker, building }) => {
          marker.setIcon(makeIcon(L, building, scale));
        });
      });

      // Expose imperative handle via callback — works reliably through dynamic()
      if (onMapReady) {
        onMapReady({
          panTo(lat, lng, z) {
            const c = map.getCenter();
            const dLat = lat - c.lat;
            const dLng = lng - c.lng;
            const approxKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111;

            if (approxKm < 0.3) {
              // Already basically there — gentle pan, no zoom change
              map.panTo([lat, lng], { animate: true, duration: 0.3 });
            } else if (approxKm < 2) {
              // Nearby — quick smooth fly
              map.flyTo([lat, lng], z ?? map.getZoom(), { duration: 0.5 });
            } else {
              // Far — full dramatic fly with zoom
              map.flyTo([lat, lng], z ?? 15, { duration: 1.1 });
            }
          },
          openBuilding(id) {
            const entry = markersRef.current.find((e) => e.building.id === id);
            if (entry) {
              if (onBuildingClick) {
                onBuildingClick(id);
              } else {
                entry.marker.openPopup?.();
              }
            }
          },
        });
      }
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} style={{ height, width: '100%' }} className="z-0" />;
}
