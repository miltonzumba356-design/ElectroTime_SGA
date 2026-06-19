import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { motion } from 'motion/react';
import {
  Zap, Eye, EyeOff, Loader2, ArrowRight, Sun, Moon, ChevronLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../store/app.store';
import { authApi } from '../lib/api';
import type { UserRole } from '../lib/types';
import { cn } from '../lib/utils';

interface LoginForm {
  email: string;
  password: string;
}

const ROLE_MAP: Record<string, UserRole> = {
  admin:      'admin',
  rh:         'hr',
  supervisor: 'supervisor',
  gestor:     'manager',
  manager:    'manager',
  saas_owner: 'saas_owner',
};

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, theme, toggleTheme } = useAppStore();

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await authApi.login(data.email.trim().toLowerCase(), data.password);

      const apiRole = res.role?.tipo_role ?? '';
      const role: UserRole = ROLE_MAP[apiRole] ?? 'manager';

      login(
        {
          id: String(res.id),
          name: `${res.nome} ${res.sobrenome}`.trim(),
          email: res.email,
          role,
          company_id: String(res.role?.empresa_id ?? ''),
          company_name: res.role?.empresa_nome ?? '',
        },
        res.access,
        res.refresh,
      );

      toast.success(res.mensagem ?? `Bem-vindo, ${res.nome}!`);
      navigate('/');
    } catch (err: any) {
      const msg = err?.response?.data?.detail
        ?? err?.response?.data?.non_field_errors?.[0]
        ?? 'Verifique e-mail e senha.';
      toast.error('Credenciais inválidas', { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between overflow-hidden bg-[#0D1526] p-12">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -top-20 right-20 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0057D9]">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white leading-none">Electro Time</p>
            <p className="text-xs text-white/50 leading-none mt-0.5">Gestão de Ponto · SaaS</p>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="relative">
          <h1 className="text-4xl font-bold leading-tight text-white">
            Uma plataforma.<br />
            <span className="text-[#3B82F6]">Cinco perfis.</span><br />
            Cada um no seu papel.
          </h1>
          <p className="mt-5 text-base text-white/60 leading-relaxed max-w-sm">
            Desde o dono SaaS até ao supervisor de operações — cada perfil acede exactamente ao que precisa, sem ruído.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[{ v: '—', l: 'Funcionários' }, { v: '5', l: 'Perfis' }, { v: '99.8%', l: 'Uptime' }].map(s => (
              <div key={s.l}>
                <p className="text-xl font-bold text-white">{s.v}</p>
                <p className="text-xs text-white/40 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="relative text-xs text-white/25">
          © 2025 Electro Time Ltda · Todos os direitos reservados
        </motion.p>
      </div>

      {/* ── Right login panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 overflow-y-auto">
        {/* Theme toggle */}
        <button onClick={toggleTheme}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0057D9]">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-foreground">Electro Time</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-foreground">Acessar painel</h2>
            <p className="mt-1 text-sm text-muted-foreground">Entre com as suas credenciais para continuar.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">E-mail</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  className={cn(
                    'h-10 w-full rounded-lg border bg-input-background px-3 text-sm placeholder:text-muted-foreground',
                    'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors',
                    errors.email ? 'border-destructive' : 'border-border'
                  )}
                  {...register('email', {
                    required: 'E-mail obrigatório',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'E-mail inválido' },
                  })}
                />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">Senha</label>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={cn(
                      'h-10 w-full rounded-lg border bg-input-background px-3 pr-10 text-sm placeholder:text-muted-foreground',
                      'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors',
                      errors.password ? 'border-destructive' : 'border-border'
                    )}
                    {...register('password', {
                      required: 'Senha obrigatória',
                      minLength: { value: 4, message: 'Mínimo 4 caracteres' },
                    })}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <button type="submit" disabled={loading}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0057D9] text-sm font-semibold text-white hover:bg-[#0046B5] disabled:opacity-60 transition-colors">
                {loading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <><span>Entrar no painel</span><ArrowRight className="h-4 w-4" /></>
                }
              </button>
            </form>

            {/* Info box */}
            <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Use as credenciais fornecidas pelo administrador da sua empresa. Em caso de problemas de acesso, entre em contacto com o suporte.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
