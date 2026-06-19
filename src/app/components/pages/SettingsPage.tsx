import { useState } from 'react';
import { motion } from 'motion/react';
import { Save, Bell, Shield, Globe, Palette, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { useAppStore } from '../store/app.store';
import { cn } from '../lib/utils';

const SECTIONS = [
  { id: 'general', label: 'Geral', icon: Globe },
  { id: 'appearance', label: 'Aparência', icon: Palette },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'security', label: 'Segurança', icon: Shield },
  { id: 'time', label: 'Ponto & Jornada', icon: Clock },
];

export function SettingsPage() {
  const { theme, setTheme } = useAppStore();
  const [activeSection, setActiveSection] = useState('general');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    toast.success('Configurações salvas com sucesso.');
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Personalize as preferências do sistema"
        actions={
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar alterações
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
        {/* Sidebar nav */}
        <nav className="flex flex-col gap-1">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={cn('flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors text-left',
                  activeSection === s.id ? 'bg-primary/5 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}>
                <Icon className="h-4 w-4 flex-shrink-0" />
                {s.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <motion.div key={activeSection} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }}
          className="rounded-xl border border-border bg-card p-6 space-y-6">
          {activeSection === 'general' && <GeneralSettings />}
          {activeSection === 'appearance' && <AppearanceSettings theme={theme} setTheme={setTheme} />}
          {activeSection === 'notifications' && <NotificationSettings />}
          {activeSection === 'security' && <SecuritySettings />}
          {activeSection === 'time' && <TimeSettings />}
        </motion.div>
      </div>
    </div>
  );
}

function SectionTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="pb-4 border-b border-border">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-muted-foreground/30'
      )}
    >
      <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
        checked ? 'translate-x-4.5' : 'translate-x-0.5'
      )} />
    </button>
  );
}

function GeneralSettings() {
  const [lang, setLang] = useState('pt-BR');
  const [tz, setTz] = useState('America/Sao_Paulo');
  const ic = 'h-9 rounded-lg border border-border bg-input-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30';
  return (
    <div className="space-y-5">
      <SectionTitle title="Configurações Gerais" desc="Idioma, fuso horário e preferências da empresa" />
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Nome da empresa</label>
          <input defaultValue="Electro Time Ltda" className={cn(ic, 'w-full')} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Idioma</label>
          <select value={lang} onChange={e => setLang(e.target.value)} className={cn(ic, 'w-full')}>
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (US)</option>
            <option value="es">Español</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Fuso Horário</label>
          <select value={tz} onChange={e => setTz(e.target.value)} className={cn(ic, 'w-full')}>
            <option value="America/Sao_Paulo">America/São_Paulo (GMT-3)</option>
            <option value="America/Manaus">America/Manaus (GMT-4)</option>
            <option value="America/Belem">America/Belém (GMT-3)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function AppearanceSettings({ theme, setTheme }: { theme: string; setTheme: (t: any) => void }) {
  return (
    <div className="space-y-5">
      <SectionTitle title="Aparência" desc="Personalize a interface visual do sistema" />
      <div className="space-y-4">
        <div>
          <p className="mb-3 text-xs font-medium text-foreground">Tema</p>
          <div className="grid grid-cols-2 gap-3 max-w-xs">
            {[
              { value: 'light', label: 'Claro', bg: 'bg-white', border: 'border-gray-200' },
              { value: 'dark', label: 'Escuro', bg: 'bg-gray-900', border: 'border-gray-700' },
            ].map(t => (
              <button key={t.value} onClick={() => setTheme(t.value)}
                className={cn('flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors',
                  theme === t.value ? 'border-primary' : 'border-border hover:border-primary/40'
                )}>
                <div className={cn('h-8 w-full rounded-md border', t.bg, t.border)} />
                <span className="text-xs font-medium text-foreground">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
        <SettingRow label="Sidebar compacta" desc="Exibe apenas ícones na barra lateral">
          <Toggle checked={false} onChange={() => {}} />
        </SettingRow>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const [notifs, setNotifs] = useState({ email: true, browser: true, absence: true, request: true, overtime: false });
  return (
    <div className="space-y-5">
      <SectionTitle title="Notificações" desc="Controle quais alertas você deseja receber" />
      <div className="space-y-4">
        {[
          { key: 'email', label: 'Notificações por e-mail', desc: 'Receba resumos diários por e-mail' },
          { key: 'browser', label: 'Notificações no browser', desc: 'Alertas em tempo real no sistema' },
          { key: 'absence', label: 'Alertas de ausência', desc: 'Notificar quando funcionário faltar' },
          { key: 'request', label: 'Novas solicitações', desc: 'Alertar quando houver solicitações pendentes' },
          { key: 'overtime', label: 'Horas extras excessivas', desc: 'Notificar ao exceder 20h/semana' },
        ].map(n => (
          <SettingRow key={n.key} label={n.label} desc={n.desc}>
            <Toggle checked={notifs[n.key as keyof typeof notifs]} onChange={v => setNotifs(p => ({ ...p, [n.key]: v }))} />
          </SettingRow>
        ))}
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-5">
      <SectionTitle title="Segurança" desc="Configurações de acesso e autenticação" />
      <div className="space-y-4">
        <SettingRow label="Autenticação em duas etapas" desc="Requer código ao fazer login">
          <Toggle checked={false} onChange={() => {}} />
        </SettingRow>
        <SettingRow label="Timeout de sessão" desc="Desconectar após inatividade">
          <select className="h-9 rounded-lg border border-border bg-input-background px-3 text-sm text-foreground focus:border-primary focus:outline-none">
            <option>30 minutos</option>
            <option>1 hora</option>
            <option>4 horas</option>
            <option>8 horas</option>
          </select>
        </SettingRow>
        <SettingRow label="Log de auditoria" desc="Registrar todas as ações dos usuários">
          <Toggle checked={true} onChange={() => {}} />
        </SettingRow>
      </div>
    </div>
  );
}

function TimeSettings() {
  return (
    <div className="space-y-5">
      <SectionTitle title="Ponto e Jornada" desc="Regras de cálculo de horas e tolerâncias" />
      <div className="space-y-4">
        <SettingRow label="Tolerância padrão de entrada" desc="Minutos de tolerância para não computar atraso">
          <select className="h-9 rounded-lg border border-border bg-input-background px-3 text-sm text-foreground focus:border-primary focus:outline-none">
            {[5, 10, 15, 20].map(v => <option key={v}>{v} minutos</option>)}
          </select>
        </SettingRow>
        <SettingRow label="Arredondamento de horas" desc="Como calcular frações de hora">
          <select className="h-9 rounded-lg border border-border bg-input-background px-3 text-sm text-foreground focus:border-primary focus:outline-none">
            <option>Exato</option>
            <option>A cada 5 minutos</option>
            <option>A cada 15 minutos</option>
          </select>
        </SettingRow>
        <SettingRow label="Banco de horas automático" desc="Converter horas extras em banco automaticamente">
          <Toggle checked={true} onChange={() => {}} />
        </SettingRow>
        <SettingRow label="Alertar banco negativo" desc="Notificar quando banco de horas ficar negativo">
          <Toggle checked={true} onChange={() => {}} />
        </SettingRow>
      </div>
    </div>
  );
}
