import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { Pencil, X, Loader2, ShieldCheck, Navigation, MapPin, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { StatsCard } from '../shared/StatsCard';
import { GeoMap } from '../shared/GeoMap';
import { cn } from '../lib/utils';
import { useMyCompanyDetail, useUpdateGeofencing } from '../lib/api-hooks';

interface GeofencingForm {
  lat: number;
  lng: number;
  radius_meters: number;
  address: string;
  permitir_fora: boolean;
}

export function GeofencingConfigPage() {
  const { data: company, isLoading } = useMyCompanyDetail();
  const updateMut = useUpdateGeofencing();
  const [editing, setEditing] = useState(false);

  const lat = company?.latitude ? Number(company.latitude) : undefined;
  const lng = company?.longitude ? Number(company.longitude) : undefined;
  const radius = company?.raio_geofencing ?? 200;
  const hasZone = lat != null && lng != null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Geofencing"
        description="Configure a zona de geolocalização para controlo de presença"
        actions={
          hasZone && !editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              <Pencil className="h-4 w-4" /> Editar Zona
            </button>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatsCard title="Estado" value={hasZone ? 'Ativa' : 'Inativa'} color={hasZone ? 'green' : 'slate'} delay={0} />
        <StatsCard title="Raio" value={hasZone ? `${radius}m` : '—'} color="blue" delay={0.05} />
        <StatsCard title="Empresa" value={company?.nome ?? '—'} color="purple" delay={0.1} />
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : editing ? (
        <GeofencingEditPanel
          initialLat={lat}
          initialLng={lng}
          initialRadius={radius}
          initialAddress={company?.endereco ?? ''}
          onClose={() => setEditing(false)}
          onSave={async (form) => {
            try {
              await updateMut.mutateAsync({
                latitude: form.lat,
                longitude: form.lng,
                raio_geofencing: form.radius_meters,
                permitir_presenca_fora_geofencing: form.permitir_fora,
              });
              toast.success('Geofencing atualizado com sucesso.');
              setEditing(false);
            } catch {
              toast.error('Erro ao atualizar o geofencing.');
            }
          }}
          saving={updateMut.isPending}
        />
      ) : hasZone ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-5 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{company?.nome}</p>
              <p className="text-xs text-muted-foreground">{company?.endereco}</p>
            </div>
          </div>

          <GeoMap
            latitude={lat}
            longitude={lng}
            radiusMeters={radius}
            label={company?.nome ?? 'Empresa'}
            address={company?.endereco}
            heightClassName="h-72"
          />

          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center flex-shrink-0">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-1 rounded-full border border-primary/40" />
                <Navigation className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Raio autorizado</p>
                <p className="text-lg font-bold text-foreground">{radius}m</p>
              </div>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">Coordenadas GPS</p>
              <p className="text-xs font-mono text-foreground">{lat?.toFixed(5)}, {lng?.toFixed(5)}</p>
            </div>
          </div>

          <div className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
            company?.configuracao?.permitir_presenca_fora_geofencing
              ? 'border-amber-500/30 bg-amber-500/8 text-amber-700 dark:text-amber-400'
              : 'border-emerald-500/30 bg-emerald-500/8 text-emerald-700 dark:text-emerald-400'
          )}>
            {company?.configuracao?.permitir_presenca_fora_geofencing
              ? <ShieldOff className="h-3.5 w-3.5 flex-shrink-0" />
              : <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
            }
            {company?.configuracao?.permitir_presenca_fora_geofencing
              ? 'Presença fora da zona é permitida (sujeita a autorização manual)'
              : 'Presença fora da zona requer autorização manual do supervisor'
            }
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border border-dashed bg-muted/20 py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <MapPin className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Sem zona de geofencing configurada</p>
            <p className="text-xs text-muted-foreground mt-1">Configure as coordenadas e raio da empresa nas definições.</p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            <ShieldCheck className="h-4 w-4" /> Configurar Agora
          </button>
        </div>
      )}
    </div>
  );
}

function GeofencingEditPanel({
  initialLat,
  initialLng,
  initialRadius,
  initialAddress,
  onClose,
  onSave,
  saving,
}: {
  initialLat?: number;
  initialLng?: number;
  initialRadius: number;
  initialAddress: string;
  onClose: () => void;
  onSave: (form: GeofencingForm) => Promise<void>;
  saving: boolean;
}) {
  const { register, handleSubmit, setValue, watch } = useForm<GeofencingForm>({
    defaultValues: {
      lat: initialLat ?? -8.839988,
      lng: initialLng ?? 13.289437,
      radius_meters: initialRadius,
      address: initialAddress,
      permitir_fora: false,
    },
  });

  const lat = watch('lat');
  const lng = watch('lng');
  const address = watch('address');
  const radius = watch('radius_meters');

  const ic = 'h-9 w-full rounded-lg border border-border bg-input-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30';
  const F = ({ l, children }: { l: string; children: React.ReactNode }) => (
    <div><label className="mb-1.5 block text-xs font-medium text-foreground">{l}</label>{children}</div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-primary/30 bg-card p-6 shadow-sm space-y-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Editar Zona de Geofencing</h3>
        <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSave)} className="space-y-4">
        <F l="Endereço">
          <input {...register('address')} className={ic} placeholder="Rua, município, província" />
        </F>

        <div className="grid grid-cols-2 gap-3">
          <F l="Latitude">
            <input {...register('lat', { valueAsNumber: true })} type="number" step="0.000001" className={ic} placeholder="-8.839988" />
          </F>
          <F l="Longitude">
            <input {...register('lng', { valueAsNumber: true })} type="number" step="0.000001" className={ic} placeholder="13.289437" />
          </F>
        </div>

        <GeoMap
          latitude={lat}
          longitude={lng}
          radiusMeters={radius ?? 200}
          label="Zona da empresa"
          address={address}
          searchable
          onLocationChange={({ latitude, longitude, address }) => {
            setValue('lat', latitude, { shouldDirty: true });
            setValue('lng', longitude, { shouldDirty: true });
            if (address) setValue('address', address, { shouldDirty: true });
          }}
          heightClassName="h-56"
        />

        <F l="Raio autorizado (metros)">
          <input {...register('radius_meters', { valueAsNumber: true })} type="number" min="50" max="10000" step="50" className={ic} />
          <p className="mt-1 text-xs text-muted-foreground">Colaboradores fora deste raio serão sinalizados para autorização.</p>
        </F>

        <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
          <input type="checkbox" id="permitir-fora" {...register('permitir_fora')} className="h-4 w-4 accent-primary" />
          <label htmlFor="permitir-fora" className="text-sm text-foreground cursor-pointer">
            Permitir presença fora da zona (requer autorização manual)
          </label>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Guardar Geofencing
          </button>
        </div>
      </form>
    </motion.div>
  );
}
