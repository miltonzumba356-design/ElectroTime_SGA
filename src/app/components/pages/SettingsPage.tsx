import { useState } from 'react';
import { motion } from 'motion/react';
import { Save, Bell, Shield, Globe, Palette, Clock, Loader2, Fingerprint, LifeBuoy } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { useAppStore } from '../store/app.store';
import { cn } from '../lib/utils';
import { useConfigureBiometric, useCreateSupportTicket } from '../lib/api-hooks';

const SECTIONS = [
  { id: 'general', label: 'Geral', icon: Globe },
  { id: 'appearance', label: 'Aparencia', icon: Palette },
  { id: 'notifications', label: 'Notificacoes', icon: Bell },
  { id: 'security', label: 'Seguranca', icon: Shield },
  { id: 'time', label: 'Ponto & Jornada', icon: Clock },
  { id: 'biometric', label: 'Biometria', icon: Fingerprint },
  { id: 'support', label: 'Suporte', icon: LifeBuoy },
];

export function SettingsPage() {
  const { theme, setTheme } = useAppStore();
  const [activeSection, setActiveSection] = useState('general');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    toast.success('Configuracoes salvas com sucesso.');
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuracoes"
        description="Personalize as preferencias do sistema"
        actions={
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar alteracoes
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
          {activeSection === 'biometric' && <BiometricSettings />}
          {activeSection === 'support' && <SupportSettings />}
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
  const [lang, setLang] = useState('pt-AO');
  const [tz, setTz] = useState('Africa/Luanda');
  const ic = 'h-9 rounded-lg border border-border bg-input-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30';
  return (
    <div className="space-y-5">
      <SectionTitle title="Configuracoes Gerais" desc="Idioma, fuso horario e preferencias da empresa" />
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Nome da empresa</label>
          <input defaultValue="Electro Time, Lda" className={cn(ic, 'w-full')} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Idioma</label>
          <select value={lang} onChange={e => setLang(e.target.value)} className={cn(ic, 'w-full')}>
            <option value="pt-AO">Portugues (Angola)</option>
            <option value="en-US">English (US)</option>
            <option value="es">Espanol</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Fuso Horario</label>
          <select value={tz} onChange={e => setTz(e.target.value)} className={cn(ic, 'w-full')}>
            <option value="Africa/Luanda">Africa/Luanda (GMT+1)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function AppearanceSettings({ theme, setTheme }: { theme: string; setTheme: (t: any) => void }) {
  return (
    <div className="space-y-5">
      <SectionTitle title="Aparencia" desc="Personalize a interface visual do sistema" />
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
        <SettingRow label="Sidebar compacta" desc="Exibe apenas icones na barra lateral">
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
      <SectionTitle title="Notificacoes" desc="Controle quais alertas voce deseja receber" />
      <div className="space-y-4">
        {[
          { key: 'email', label: 'Notificacoes por e-mail', desc: 'Receba resumos diarios por e-mail' },
          { key: 'browser', label: 'Notificacoes no browser', desc: 'Alertas em tempo real no sistema' },
          { key: 'absence', label: 'Alertas de ausencia', desc: 'Notificar quando funcionario faltar' },
          { key: 'request', label: 'Novas solicitacoes', desc: 'Alertar quando houver solicitacoes pendentes' },
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
      <SectionTitle title="Seguranca" desc="Configuracoes de acesso e autenticacao" />
      <div className="space-y-4">
        <SettingRow label="Autenticacao em duas etapas" desc="Requer codigo ao fazer login">
          <Toggle checked={false} onChange={() => {}} />
        </SettingRow>
        <SettingRow label="Timeout de sessao" desc="Desconectar apos inatividade">
          <select className="h-9 rounded-lg border border-border bg-input-background px-3 text-sm text-foreground focus:border-primary focus:outline-none">
            <option>30 minutos</option>
            <option>1 hora</option>
            <option>4 horas</option>
            <option>8 horas</option>
          </select>
        </SettingRow>
        <SettingRow label="Log de auditoria" desc="Registrar todas as acoes dos usuarios">
          <Toggle checked={true} onChange={() => {}} />
        </SettingRow>
      </div>
    </div>
  );
}

function TimeSettings() {
  return (
    <div className="space-y-5">
      <SectionTitle title="Ponto e Jornada" desc="Regras de calculo de horas e tolerancias" />
      <div className="space-y-4">
        <SettingRow label="Tolerancia padrao de entrada" desc="Minutos de tolerancia para nao computar atraso">
          <select className="h-9 rounded-lg border border-border bg-input-background px-3 text-sm text-foreground focus:border-primary focus:outline-none">
            {[5, 10, 15, 20].map(v => <option key={v}>{v} minutos</option>)}
          </select>
        </SettingRow>
        <SettingRow label="Arredondamento de horas" desc="Como calcular fracoes de hora">
          <select className="h-9 rounded-lg border border-border bg-input-background px-3 text-sm text-foreground focus:border-primary focus:outline-none">
            <option>Exato</option>
            <option>A cada 5 minutos</option>
            <option>A cada 15 minutos</option>
          </select>
        </SettingRow>
        <SettingRow label="Banco de horas automatico" desc="Converter horas extras em banco automaticamente">
          <Toggle checked={true} onChange={() => {}} />
        </SettingRow>
        <SettingRow label="Alertar banco negativo" desc="Notificar quando banco de horas ficar negativo">
          <Toggle checked={true} onChange={() => {}} />
        </SettingRow>
      </div>
    </div>
  );
}

function BiometricSettings() {
  const configureBiometric = useConfigureBiometric();
  const [enabled, setEnabled] = useState(true);
  const [requirePhoto, setRequirePhoto] = useState(true);

  const save = async () => {
    try {
      await configureBiometric.mutateAsync({
        biometria_ativa: enabled,
        requer_foto: requirePhoto,
      });
      toast.success('Biometria configurada para a empresa.');
    } catch {
      toast.error('Nao foi possivel guardar a configuracao biometrica.');
    }
  };

  return (
    <div className="space-y-5">
      <SectionTitle title="Biometria" desc="Parametros de validacao biometrica da empresa" />
      <div className="space-y-4">
        <SettingRow label="Biometria ativa" desc="Permite registo e validacao biometrica dos colaboradores">
          <Toggle checked={enabled} onChange={setEnabled} />
        </SettingRow>
        <SettingRow label="Exigir fotografia no ponto" desc="Combina biometria com evidencia fotografica">
          <Toggle checked={requirePhoto} onChange={setRequirePhoto} />
        </SettingRow>
        <button
          onClick={save}
          disabled={configureBiometric.isPending}
          className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {configureBiometric.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
          Guardar biometria
        </button>
      </div>
    </div>
  );
}

function SupportSettings() {
  const createTicket = useCreateSupportTicket();
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [prioridade, setPrioridade] = useState('normal');

  const send = async () => {
    try {
      await createTicket.mutateAsync({ assunto, mensagem, prioridade });
      setAssunto('');
      setMensagem('');
      setPrioridade('normal');
      toast.success('Ticket enviado ao suporte.');
    } catch {
      toast.error('Nao foi possivel enviar o ticket.');
    }
  };

  return (
    <div className="space-y-5">
      <SectionTitle title="Suporte" desc="Abertura de tickets para o suporte da plataforma" />
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Assunto</label>
          <input value={assunto} onChange={e => setAssunto(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-input-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Prioridade</label>
          <select value={prioridade} onChange={e => setPrioridade(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-input-background px-3 text-sm text-foreground focus:border-primary focus:outline-none">
            <option value="baixa">Baixa</option>
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Mensagem</label>
          <textarea value={mensagem} onChange={e => setMensagem(e.target.value)} rows={4} className="w-full resize-none rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
        </div>
        <button
          onClick={send}
          disabled={createTicket.isPending || !assunto.trim() || !mensagem.trim()}
          className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {createTicket.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LifeBuoy className="h-4 w-4" />}
          Enviar ticket
        </button>
      </div>
    </div>
  );
}
