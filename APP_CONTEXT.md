# Karwia – Gra Terenowa · Kontekst aplikacji

> Ten plik służy jako kontekst do rozmów z Claude AI.
> Wklej jego zawartość na początku nowej rozmowy, żeby Claude znał aplikację.

---

## Czym jest aplikacja

**Karwia – Gra Terenowa** to mobilna gra odkrywania oparta na lokalizacji dla turystów i mieszkańców Karwi (polskie wybrzeże). Gracze przemierzają miasto, skanują kody QR przy budynkach i zabytkach, zdobywają odznaki i rywalizują w rankingu. Dostępna jako PWA (instalowalna jak apka) pod adresem **https://odkrywca.karwia.pl**.

### Cel produktowy
Promowanie turystyki w Karwi poprzez gamifikację — każde zeskanowanie kodu QR odblokowuje historię miejsca, zdjęcia i postęp w grze.

---

## Stack techniczny

| Warstwa | Technologia |
|---------|------------|
| Framework | Next.js 14.2 (App Router), React 18, TypeScript 5 |
| Baza danych | SQLite (better-sqlite3) + Prisma 7 |
| Auth | JWT (jose, 90 dni) + bcrypt + weryfikacja email (nodemailer) |
| Style | Tailwind CSS 3.4 z custom kolorami ocean/sand |
| Mapa | Leaflet 1.9 + React Leaflet 4.2 |
| Skaner QR | Natywne getUserMedia + BarcodeDetector API; fallback html5-qrcode |
| Rich text | TipTap 3.22 |
| Animacje | Framer Motion 12 |
| PWA | Manifest + Service Worker (cache-first dla statycznych, network-first dla API) |

### Kolory brandingowe (Tailwind)
- `ocean` — #105F92 (granatowy błękit, kolor główny)
- `sand` — #F49A1A (złoty piasek, akcent)

### Fonty
- Nunito (sans-serif, treść)
- Kanit (headings)

---

## Główne strony

| Route | Opis |
|-------|------|
| `/` | Interaktywna mapa Leaflet z markerami budynków, licznikiem odkryć, GPS "Najbliżej", podglądem budynku w sheet |
| `/baza` | Katalog budynków — flat lista z chipami filtrów kategorii + tab odkryte/nieodkryte |
| `/skanuj` | Skaner QR — live kamera (getUserMedia + BarcodeDetector) z fallbackiem na zdjęcie |
| `/budynek/[id]` | Szczegóły budynku — opis HTML, galeria (lightbox), pobliskie miejsca, odznaki, Easter eggi |
| `/profil` | Profil użytkownika — edycja nicku/miasta, upload avatara, zmiana hasła, usunięcie konta |
| `/osiagniecia` | Odznaki — wszystkie achievementy z paskami postępu |
| `/admin` | Panel admina (hasło via nagłówek x-admin-password) — zarządzanie budynkami, użytkownikami, kategoriami, achievementami, Easter eggami, treścią stron |

---

## Model danych — kluczowe encje

### Building
```
id            Int       (autoincrement)
number        Int?      (wyciągany z qrUrl, np. /42/ → 42)
name          String
description   String    (HTML z TipTap)
address       String?   (widoczny po odkryciu)
lat, lng      Float     (GPS)
imageUrl      String?   (kolorowe zdjęcie — widoczne po odkryciu)
outlineImageUrl String? (szare — widoczne przed odkryciem)
qrUrl         String    @unique (URL zakodowany w QR)
category      String    (checza | zagroda | karczma | pensjonat | sakralny | natura | morze | historia)
hidden        Boolean   (ukryty dla gości)
published     Boolean   (draft = false)
images        BuildingImage[]
```

### UserDiscovery (rdzeń gry)
```
userId        String    (UUID gościa lub zarejestrowanego)
buildingId    Int
discoveredAt  DateTime
@@unique([userId, buildingId])
```

Po odkryciu: widoczny opis, kolorowe zdjęcie, adres, galeria, pobliskie.

### UserProfile
```
userId, email, nickname, city
passwordHash  (bcrypt, 10 rund)
emailVerified Boolean
avatarUrl     String?
```

---

## Przepływ autoryzacji

1. **Gość**: localStorage UUID (`karwia_user_id`) — pełna gra bez rejestracji
2. **Rejestracja**: email + hasło → weryfikacja emailem (token 24h) → migracja odkryć gościa
3. **Sesja**: cookie `karwia_session` (httpOnly, Secure, SameSite=Lax, JWT 90 dni)
4. **Admin**: nagłówek `x-admin-password: [ADMIN_PASSWORD]` (env var)

---

## API (27 endpointów)

### Budynki
- `GET /api/budynki` — lista (sortowana number ASC nulls last, potem name)
- `POST /api/budynki` — tworzenie (admin)
- `GET/PUT/DELETE /api/budynki/[id]`
- `GET /api/budynki/qr?url=...` — resolve QR URL → building id
- `GET /api/budynki/[id]/najblizsze` — 5 najbliższych (Haversine)

### Odkrycia
- `GET /api/odkrycia?userId=xxx`
- `POST /api/odkrycia` — oznacz jako odkryte; zwraca `alreadyDiscovered`

### Auth
- `POST /api/auth/register|login|logout`
- `GET /api/auth/me`
- `POST /api/auth/verify?token=...`
- `POST /api/auth/send-verification|change-password`
- `DELETE /api/auth/account`

### Gamifikacja
- `GET /api/osiagniecia?userId=xxx`
- `GET /api/ranking?userId=xxx` — top 50 + pozycja gracza
- `GET /api/easter-eggs/check`

### Admin CRUD
- `/api/admin/achievements|categories|easter-eggs|users`
- `/api/content` — edycja regulaminu/polityki prywatności

---

## Typy achievementów
```
total_count      — odkryj N budynków
total_all        — odkryj wszystkie
category_count   — odkryj N w kategorii X
building_set     — odkryj konkretny zestaw budynków
days_active      — aktywny w N różnych dniach
all_in_one_day   — wszystkie odkrycia w 1 dzień
return_after_break — powrót po 7+ dniach przerwy
```

---

## Kluczowe decyzje techniczne

### Czego NIE robić w Next.js App Router
- **Nigdy nie dodawać `<head>` do RootLayout** — powoduje hydration error łamiący całą aplikację. Używać `export const metadata` i `export const viewport`.
- `next/font/google` wymaga internetu przy buildzie — zamiast tego używamy `@import url()` w globals.css.

### Z-index hierarchia
```
z-50        — skaner QR (fullscreen, ma własny kontekst)
z-[900]     — Navigation (fixed bottom)
z-[1000]    — backdrops modali (WelcomeModal, InstallPrompt)
z-[1001]    — panele modali
```
- Kontener mapy ma `isolation: isolate` — wewnętrzne z-indeksy (do z-[700]) nie konkurują z nawigacją.

### Numery budynków
- Zawsze wyciągane z `qrUrl` (regex `/(\d+)\/?$/`), nigdy ręcznie.
- Sortowanie: JS-side (Prisma SQLite nie obsługuje `nulls: 'last'`).

### Kamera / QR
- Permissions-Policy: `camera=(self)` — wymagane, żeby przeglądarka w ogóle pytała o dostęp.
- Przepływ: `getUserMedia` → `<video>` → `BarcodeDetector` (Chromium) lub canvas+html5-qrcode.

---

## Konfiguracja produkcyjna

### Zmienne środowiskowe
```
DATABASE_URL=file:./prisma/prod.db
JWT_SECRET=<silny losowy klucz>
ADMIN_PASSWORD=<hasło admina>
NEXT_PUBLIC_BASE_URL=https://odkrywca.karwia.pl
```
+ konfiguracja nodemailer do wysyłki maili weryfikacyjnych

### Build
```bash
npm run build    # = prisma generate && next build
npm start
```

### Nagłówki bezpieczeństwa (next.config.mjs)
```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), camera=(self), microphone=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

---

## Kategorie budynków
| Klucz | Etykieta |
|-------|---------|
| checza | 🛖 Chëcza |
| zagroda | 🏡 Zagroda |
| karczma | 🍺 Karczma |
| pensjonat | 🛏️ Pensjonat |
| sakralny | ⛪ Sakralny |
| natura | 🌲 Natura |
| morze | 🐟 Morze |
| historia | 🏛️ Historia |

---

## Repozytorium
- Główna gałąź developerska: `claude/karwia-location-game-V6Rc4`
- Język UI: polski
- Mobile-first, max-width 512px, portrait-only (PortraitGuard)
