import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { Loader2, MapPin, Navigation, Search } from 'lucide-react';
import { cn } from '../lib/utils';

interface GeoMapProps {
  latitude?: number | string | null;
  longitude?: number | string | null;
  radiusMeters?: number | string | null;
  label?: string;
  address?: string;
  searchable?: boolean;
  onLocationChange?: (location: { latitude: number; longitude: number; address?: string }) => void;
  className?: string;
  heightClassName?: string;
}

const ANGOLA_CENTER = { lat: -8.839988, lng: 13.289437 };

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function bbox(lat: number, lng: number, delta: number) {
  return [lng - delta, lat - delta, lng + delta, lat + delta];
}

export function GeoMap({
  latitude,
  longitude,
  radiusMeters,
  label = 'Ponto de geofencing',
  address,
  searchable = false,
  onLocationChange,
  className,
  heightClassName = 'h-56',
}: GeoMapProps) {
  const [query, setQuery] = useState(address ?? '');
  const [searching, setSearching] = useState(false);
  const lat = toNumber(latitude) ?? ANGOLA_CENTER.lat;
  const lng = toNumber(longitude) ?? ANGOLA_CENTER.lng;
  const hasCoordinates = toNumber(latitude) !== null && toNumber(longitude) !== null;
  const radius = toNumber(radiusMeters);
  const bounds = useMemo(() => bbox(lat, lng, hasCoordinates ? 0.01 : 1.8), [hasCoordinates, lat, lng]);
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bounds.join(',')}&layer=mapnik&marker=${lat},${lng}`;
  const mapsUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
  const markerLeft = `${((lng - bounds[0]) / (bounds[2] - bounds[0])) * 100}%`;
  const markerTop = `${((bounds[3] - lat) / (bounds[3] - bounds[1])) * 100}%`;

  const setPointFromMap = (event: MouseEvent<HTMLDivElement>) => {
    if (!searchable || !onLocationChange) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const nextLng = bounds[0] + x * (bounds[2] - bounds[0]);
    const nextLat = bounds[3] - y * (bounds[3] - bounds[1]);
    onLocationChange({
      latitude: Number(nextLat.toFixed(6)),
      longitude: Number(nextLng.toFixed(6)),
      address: query || address,
    });
  };

  const searchLocation = async () => {
    if (!query.trim() || !onLocationChange) return;
    setSearching(true);
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('limit', '1');
      url.searchParams.set('countrycodes', 'ao');
      url.searchParams.set('q', query);
      const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
      const [result] = await response.json();
      if (result?.lat && result?.lon) {
        onLocationChange({
          latitude: Number(Number(result.lat).toFixed(6)),
          longitude: Number(Number(result.lon).toFixed(6)),
          address: result.display_name ?? query,
        });
      }
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-muted/30', className)}>
      {searchable && (
        <div className="flex gap-2 border-b border-border bg-card p-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  searchLocation();
                }
              }}
              placeholder="Pesquisar local em Angola"
              className="h-9 w-full rounded-md border border-border bg-input-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <button
            type="button"
            onClick={searchLocation}
            disabled={searching}
            className="flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Buscar
          </button>
        </div>
      )}
      <div className={cn('relative w-full', heightClassName)}>
        <iframe
          title={label}
          src={src}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        {searchable && (
          <div
            className="absolute inset-0 cursor-crosshair"
            title="Clique no mapa para definir latitude e longitude"
            onClick={setPointFromMap}
          />
        )}
        {hasCoordinates && (
          <>
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/40 bg-primary/10"
              style={{
                left: markerLeft,
                top: markerTop,
                width: radius ? Math.min(Math.max(radius / 4, 28), 160) : 56,
                height: radius ? Math.min(Math.max(radius / 4, 28), 160) : 56,
              }}
            />
            <MapPin
              className="pointer-events-none absolute h-7 w-7 -translate-x-1/2 -translate-y-full fill-primary text-primary drop-shadow"
              style={{ left: markerLeft, top: markerTop }}
            />
          </>
        )}
        {!hasCoordinates && (
          <div className={cn('absolute inset-0 flex items-center justify-center bg-background/80 px-6 text-center', searchable && 'pointer-events-none')}>
            <div>
              <MapPin className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Coordenadas por definir</p>
              <p className="mt-1 text-xs text-muted-foreground">{searchable ? 'Pesquise ou clique no mapa para definir o ponto.' : 'O mapa esta centrado em Luanda, Angola.'}</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-foreground">{label}</p>
          {address && <p className="truncate text-[11px] text-muted-foreground">{address}</p>}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {radius !== null && (
            <span className="inline-flex items-center gap-1">
              <Navigation className="h-3 w-3" />
              {radius}m
            </span>
          )}
          <a href={mapsUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            Abrir mapa
          </a>
        </div>
      </div>
    </div>
  );
}
