import { MapPin, Navigation } from 'lucide-react';
import { cn } from '../lib/utils';

interface GeoMapProps {
  latitude?: number | string | null;
  longitude?: number | string | null;
  radiusMeters?: number | string | null;
  label?: string;
  address?: string;
  className?: string;
  heightClassName?: string;
}

const ANGOLA_CENTER = { lat: -8.839988, lng: 13.289437 };

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function bbox(lat: number, lng: number) {
  const delta = 0.01;
  return [
    lng - delta,
    lat - delta,
    lng + delta,
    lat + delta,
  ].join(',');
}

export function GeoMap({
  latitude,
  longitude,
  radiusMeters,
  label = 'Ponto de geofencing',
  address,
  className,
  heightClassName = 'h-56',
}: GeoMapProps) {
  const lat = toNumber(latitude) ?? ANGOLA_CENTER.lat;
  const lng = toNumber(longitude) ?? ANGOLA_CENTER.lng;
  const hasCoordinates = toNumber(latitude) !== null && toNumber(longitude) !== null;
  const radius = toNumber(radiusMeters);
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox(lat, lng)}&layer=mapnik&marker=${lat},${lng}`;
  const mapsUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;

  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-muted/30', className)}>
      <div className={cn('relative w-full', heightClassName)}>
        <iframe
          title={label}
          src={src}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        {!hasCoordinates && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 px-6 text-center">
            <div>
              <MapPin className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Coordenadas por definir</p>
              <p className="mt-1 text-xs text-muted-foreground">O mapa está centrado em Luanda, Angola.</p>
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
