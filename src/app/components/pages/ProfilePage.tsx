import { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, Save, Lock, Loader2, Mail, Phone, Building2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { useAppStore } from '../store/app.store';
import { getInitials, cn } from '../lib/utils';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  hr: 'Recursos Humanos',
  supervisor: 'Supervisor',
  manager: 'Gestor',
  saas_owner: 'Proprietário SaaS',
};

export function ProfilePage() {
  const { user } = useAppStore();
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState('(11) 98765-4321');

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    toast.success('Perfil atualizado com sucesso.');
    setSaving(false);
  };

  const handleSavePass = async () => {
    setSavingPass(true);
    await new Promise(r => setTimeout(r, 800));
    toast.success('Senha alterada com sucesso.');
    setSavingPass(false);
  };

  const ic = 'h-9 w-full rounded-lg border border-border bg-input-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed';

  return (
    <div className="space-y-6">
      <PageHeader title="Meu Perfil" description="Gerencie suas informações pessoais e credenciais" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: Avatar + info */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
            className="rounded-xl border border-border bg-card p-6 text-center">
            <div className="relative inline-block">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary mx-auto">
                {getInitials(user?.name ?? 'U')}
              </div>
              <button className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-muted-foreground hover:bg-primary hover:text-white transition-colors">
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-foreground">{user?.name}</h3>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <Shield className="h-3 w-3" />
              {ROLE_LABELS[user?.role ?? 'admin']}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Informações</h4>
            {[
              { icon: Mail, label: 'E-mail', value: user?.email },
              { icon: Building2, label: 'Empresa', value: user?.company_name },
              { icon: Shield, label: 'Perfil', value: ROLE_LABELS[user?.role ?? 'admin'] },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm text-foreground">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Right: Forms */}
        <div className="lg:col-span-2 space-y-4">
          {/* Profile form */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-5 text-sm font-semibold text-foreground border-b border-border pb-3">Dados do Perfil</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Nome completo</label>
                <input value={name} onChange={e => setName(e.target.value)} className={ic} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">E-mail</label>
                <input value={user?.email} disabled className={ic} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Telefone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} className={ic} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Empresa</label>
                <input value={user?.company_name} disabled className={ic} />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={handleSaveProfile} disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Salvar perfil
              </button>
            </div>
          </motion.div>

          {/* Password form */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-5 text-sm font-semibold text-foreground border-b border-border pb-3">Alterar Senha</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Senha atual</label>
                <input type="password" placeholder="••••••••" className={ic} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Nova senha</label>
                <input type="password" placeholder="••••••••" className={ic} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Confirmar nova senha</label>
                <input type="password" placeholder="••••••••" className={ic} />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={handleSavePass} disabled={savingPass}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60 transition-colors">
                {savingPass ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                Alterar senha
              </button>
            </div>
          </motion.div>

          {/* Sessions */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-sm font-semibold text-foreground border-b border-border pb-3">Sessões Ativas</h3>
            <div className="space-y-3">
              {[
                { device: 'Chrome — Windows 11', ip: '189.40.xx.xx', location: 'São Paulo, SP', current: true },
                { device: 'Safari — iPhone 15', ip: '200.221.xx.xx', location: 'São Paulo, SP', current: false },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.device}</p>
                    <p className="text-xs text-muted-foreground">{s.ip} · {s.location}</p>
                  </div>
                  {s.current ? (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Atual</span>
                  ) : (
                    <button className="text-xs text-red-500 hover:underline">Encerrar</button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
