import { motion } from 'motion/react';
import { Camera, RefreshCw, Mail, Building2, Shield, UserRound, Lock } from 'lucide-react';
import { PageHeader } from '../shared/PageHeader';
import { useAppStore } from '../store/app.store';
import { getInitials } from '../lib/utils';
import { ROLE_LABELS, normalizeUserRole } from '../lib/nav-config';
import { useMyProfile } from '../lib/api-hooks';

export function ProfilePage() {
  const { user } = useAppStore();
  const { data: profile, isLoading, isFetching, refetch } = useMyProfile();

  const apiRole = normalizeUserRole(profile?.role?.tipo_role);
  const fallbackRole = normalizeUserRole(user?.role);
  const role = profile?.role?.tipo_role ? apiRole : fallbackRole;
  const fullName = profile
    ? `${profile.nome ?? ''} ${profile.sobrenome ?? ''}`.trim()
    : user?.name ?? '';
  const email = profile?.email ?? user?.email ?? '';
  const companyName = profile?.role?.empresa_nome ?? user?.company_name ?? '';
  const username = profile?.username ?? '';

  const ic = 'h-9 w-full rounded-lg border border-border bg-input-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-70 disabled:cursor-not-allowed';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meu Perfil"
        description="Dados da conta autenticada no backend"
        actions={
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex h-9 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-6 text-center"
          >
            <div className="relative inline-block">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {getInitials(fullName || 'U')}
              </div>
              <button
                disabled
                title="Avatar não suportado pelo endpoint atual"
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-muted-foreground opacity-70"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-foreground">{fullName || 'Utilizador'}</h3>
            <p className="text-xs text-muted-foreground">{email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <Shield className="h-3 w-3" />
              {ROLE_LABELS[role]}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="space-y-3 rounded-xl border border-border bg-card p-5"
          >
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Informações</h4>
            {[
              { icon: UserRound, label: 'Utilizador', value: username || '-' },
              { icon: Mail, label: 'E-mail', value: email || '-' },
              { icon: Building2, label: 'Empresa', value: companyName || '-' },
              { icon: Shield, label: 'Perfil', value: ROLE_LABELS[role] },
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

        <div className="space-y-4 lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <h3 className="mb-5 border-b border-border pb-3 text-sm font-semibold text-foreground">Dados do Perfil</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nome">
                <input value={profile?.nome ?? fullName} disabled className={ic} />
              </Field>
              <Field label="Sobrenome">
                <input value={profile?.sobrenome ?? ''} disabled className={ic} />
              </Field>
              <Field label="Username">
                <input value={username} disabled className={ic} />
              </Field>
              <Field label="E-mail">
                <input value={email} disabled className={ic} />
              </Field>
              <Field label="Empresa">
                <input value={companyName} disabled className={ic} />
              </Field>
              <Field label="Perfil">
                <input value={ROLE_LABELS[role]} disabled className={ic} />
              </Field>
            </div>

            <div className="mt-5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
              O contrato atual do backend expõe apenas consulta de perfil em <span className="font-mono">/api/empresas/meu_perfil/</span>. Atualização de dados pessoais ainda não tem endpoint documentado.
            </div>

            {isLoading && (
              <p className="mt-3 text-xs text-muted-foreground">A carregar perfil...</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <h3 className="mb-4 border-b border-border pb-3 text-sm font-semibold text-foreground">Segurança</h3>
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
              <Lock className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Alteração de senha indisponível no contrato atual</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Não há endpoint de troca ou redefinição de senha no YAML recebido. A ação foi desativada para evitar uma confirmação falsa no front.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}
