import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, X, Loader2, ShieldCheck, Navigation, MapPin, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { StatsCard } from '../shared/StatsCard';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { ActiveBadge } from '../shared/StatusBadge';
import { GeoMap } from '../shared/GeoMap';
import { cn } from '../lib/utils';
import { useUpdateGeofencing } from '../lib/api-hooks';

interface GeoZone {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  radius_meters: number;
  active: boolean;
  post_name?: string;
  created_at: string;
}

export function GeofencingConfigPage() {
  const updateMut = useUpdateGeofencing();
  const [zones, setZones] = useState<GeoZone[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GeoZone | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GeoZone | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await new Promise(r => setTimeout(r, 700));
    setZones(prev => prev.filter(z => z.id !== deleteTarget.id));
    toast.success(`Zona "${deleteTarget.name}" removida.`);
    setDeleteTarget(null);
    setDeleteLoading(false);
  };

  const onSave = async (z: GeoZone) => {
    try {
      await updateMut.mutateAsync({
        nome: z.name,
        latitude: z.lat,
        longitude: z.lng,
        raio_metros: z.radius_meters,
        ativo: z.active,
      });
      if (editTarget) {
        setZones(prev => prev.map(x => x.id === z.id ? z : x));
        toast.success('Zona de geofencing atualizada.');
      } else {
        setZones(prev => [...prev, { ...z, id: `gz-${Date.now()}`, created_at: new Date().toISOString() }]);
        toast.success('Zona criada com sucesso.');
      }
    } catch {
      toast.error('Erro ao guardar zona de geofencing.');
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Geofencing"
        description="Configure as zonas de geolocalização para controlo de presença"
        actions={
          <button onClick={() => { setEditTarget(null); setDrawerOpen(true); }}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Nova Zona
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatsCard title="Zonas Ativas" value={zones.filter(z => z.active).length} color="green" delay={0} />
        <StatsCard title="Total de Zonas" value={zones.length} color="blue" delay={0.05} />
        <StatsCard title="Raio Médio" value={zones.length ? `${Math.round(zones.reduce((s, z) => s + z.radius_meters, 0) / zones.length)}m` : '—'} color="slate" delay={0.1} />
      </div>

      {/* Zone cards */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {zones.map((zone, i) => (
          <motion.div key={zone.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn('rounded-xl border bg-card p-5 hover:shadow-sm transition-shadow', zone.active ? 'border-border' : 'border-border opacity-60')}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  {zone.active && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-card" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{zone.name}</p>
                    <ActiveBadge active={zone.active} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{zone.address}</p>
                  {zone.post_name && (
                    <p className="text-xs text-primary mt-0.5">Posto: {zone.post_name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => { setEditTarget(zone); setDrawerOpen(true); }}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(zone)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <GeoMap
                latitude={zone.lat}
                longitude={zone.lng}
                radiusMeters={zone.radius_meters}
                label={zone.name}
                address={zone.address}
                heightClassName="h-44"
              />
            </div>

            {/* Visual radius indicator */}
            <div className="mt-4 flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-1 rounded-full border border-primary/40" />
                <Navigation className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Raio autorizado</p>
                <p className="text-lg font-bold text-foreground">{zone.radius_meters}m</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-muted-foreground">Ponto GPS</p>
                <p className="text-xs font-mono text-foreground">{zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {drawerOpen && <GeoZoneDrawer zone={editTarget} onClose={() => setDrawerOpen(false)} onSave={onSave} />}
      </AnimatePresence>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="Remover zona" description={`Remover "${deleteTarget?.name}"?`} />
    </div>
  );
}

function GeoZoneDrawer({ zone, onClose, onSave }: { zone: GeoZone | null; onClose: () => void; onSave: (z: GeoZone) => void }) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit } = useForm({ defaultValues: zone ?? {} });

  const onSubmit = async (data: any) => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    onSave({
      id: zone?.id ?? `gz-${Date.now()}`,
      created_at: zone?.created_at ?? new Date().toISOString(),
      active: Boolean(data.active),
      ...data,
      lat: Number(data.lat) || 0,
      lng: Number(data.lng) || 0,
      radius_meters: Number(data.radius_meters) || 200,
    });
    setSaving(false);
  };

  const ic = 'h-9 w-full rounded-lg border border-border bg-input-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30';
  const F = ({ l, children }: { l: string; children: React.ReactNode }) => (
    <div><label className="mb-1.5 block text-xs font-medium text-foreground">{l}</label>{children}</div>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative z-10 flex h-full w-full max-w-md flex-col bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">{zone ? 'Editar Zona' : 'Nova Zona de Geofencing'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-4 px-6 py-5">
            <F l="Nome da Zona"><input {...register('name')} defaultValue={zone?.name} placeholder="Sede Luanda" className={ic} /></F>
            <F l="Endereço"><input {...register('address')} defaultValue={zone?.address} placeholder="Rua, município, província" className={ic} /></F>
            <div className="grid grid-cols-2 gap-3">
              <F l="Latitude"><input {...register('lat')} defaultValue={zone?.lat} type="number" step="0.0001" placeholder="-8.8399" className={ic} /></F>
              <F l="Longitude"><input {...register('lng')} defaultValue={zone?.lng} type="number" step="0.0001" placeholder="13.2894" className={ic} /></F>
            </div>
            <GeoMap latitude={zone?.lat} longitude={zone?.lng} radiusMeters={zone?.radius_meters ?? 200} label={zone?.name ?? 'Nova zona'} heightClassName="h-40" />
            <F l="Raio (metros)">
              <input {...register('radius_meters')} defaultValue={zone?.radius_meters ?? 200} type="number" min="50" max="5000" className={ic} />
              <p className="mt-1 text-xs text-muted-foreground">Colaboradores a mais de {'{raio}'}m serão sinalizados para autorização.</p>
            </F>
            <F l="Posto associado (opcional)"><input {...register('post_name')} defaultValue={zone?.post_name} placeholder="Nome do posto" className={ic} /></F>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="gz-active" {...register('active')} defaultChecked={zone?.active ?? true} className="h-4 w-4 accent-primary" />
              <label htmlFor="gz-active" className="text-sm text-foreground">Zona ativa</label>
            </div>
          </div>
          <div className="border-t border-border px-6 py-4 flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {zone ? 'Guardar' : 'Criar Zona'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
