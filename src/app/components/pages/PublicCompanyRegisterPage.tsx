import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Building2, CheckCircle2, Loader2, LockKeyhole, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { usePublicRegisterCompany } from '../lib/api-hooks';

interface CompanyRegisterForm {
  nome: string;
  nif: string;
  email: string;
  telefone: string;
  endereco: string;
  admin_nome: string;
  admin_email: string;
  admin_telefone?: string;
  observacoes?: string;
}

const inputClass =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15';

export function PublicCompanyRegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const registerCompany = usePublicRegisterCompany();
  const { register, handleSubmit, formState: { errors } } = useForm<CompanyRegisterForm>();

  const onSubmit = async (data: CompanyRegisterForm) => {
    try {
      await registerCompany.mutateAsync(data);
      setSubmitted(true);
      toast.success('Solicitacao enviada. Aguarde aprovacao do Dono SaaS.');
    } catch {
      toast.error('Nao foi possivel enviar a solicitacao.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
        <section className="space-y-7">
          <a href="#/login" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
            <Building2 className="h-5 w-5" />
            Electro Time
          </a>

          <div className="space-y-4">
            <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Cadastro publico de empresa
            </span>
            <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Solicite o registo da sua empresa para usar o Electro Time
            </h1>
            <p className="max-w-lg text-base leading-7 text-slate-600">
              A solicitacao fica pendente para analise do Dono SaaS. Depois da aprovacao, a empresa e o administrador principal podem receber acesso ao painel.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: LockKeyhole, label: 'Acesso separado', text: 'Fora da area autenticada' },
              { icon: CheckCircle2, label: 'Fluxo aprovado', text: 'Pendente, aprovada ou rejeitada' },
              { icon: Mail, label: 'Resposta por email', text: 'Dados enviados ao backend' },
            ].map(({ icon: Icon, label, text }) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
                <Icon className="mb-3 h-5 w-5 text-blue-600" />
                <p className="text-sm font-semibold text-slate-900">{label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          {submitted ? (
            <div className="flex min-h-[440px] flex-col items-center justify-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-950">Solicitacao recebida</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                A sua empresa foi enviada para analise. Acompanhe o contacto indicado para receber a decisao do Dono SaaS.
              </p>
              <a href="#/login" className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Ir para login
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Dados da empresa</h2>
                <p className="mt-1 text-sm text-slate-500">Preencha os dados legais para criar a solicitacao.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome da empresa" error={errors.nome?.message}>
                  <input {...register('nome', { required: 'Obrigatorio' })} className={inputClass} placeholder="Ex: Electro Angola, Lda" />
                </Field>
                <Field label="NIF" error={errors.nif?.message}>
                  <input {...register('nif', { required: 'Obrigatorio' })} className={inputClass} placeholder="Numero fiscal" />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email da empresa" error={errors.email?.message}>
                  <input {...register('email', { required: 'Obrigatorio' })} type="email" className={inputClass} placeholder="empresa@dominio.ao" />
                </Field>
                <Field label="Telefone" error={errors.telefone?.message}>
                  <input {...register('telefone', { required: 'Obrigatorio' })} className={inputClass} placeholder="+244 9XX XXX XXX" />
                </Field>
              </div>

              <Field label="Endereco" error={errors.endereco?.message}>
                <input {...register('endereco', { required: 'Obrigatorio' })} className={inputClass} placeholder="Rua, municipio, provincia" />
              </Field>

              <div className="border-t border-slate-100 pt-5">
                <h3 className="text-sm font-semibold text-slate-950">Responsavel pelo acesso</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome do responsavel" error={errors.admin_nome?.message}>
                  <input {...register('admin_nome', { required: 'Obrigatorio' })} className={inputClass} placeholder="Nome completo" />
                </Field>
                <Field label="Email do responsavel" error={errors.admin_email?.message}>
                  <input {...register('admin_email', { required: 'Obrigatorio' })} type="email" className={inputClass} placeholder="admin@empresa.ao" />
                </Field>
              </div>

              <Field label="Telefone do responsavel">
                <input {...register('admin_telefone')} className={inputClass} placeholder="+244 9XX XXX XXX" />
              </Field>

              <Field label="Observacoes">
                <textarea
                  {...register('observacoes')}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                  placeholder="Informacoes adicionais para analise"
                />
              </Field>

              <button
                type="submit"
                disabled={registerCompany.isPending}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {registerCompany.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                Enviar solicitacao de registo
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
