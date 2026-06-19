import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, X, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { DataTable, type Column } from '../shared/DataTable';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { ActiveBadge } from '../shared/StatusBadge';
import type { Post } from '../lib/types';
import { cn } from '../lib/utils';
import { usePosts, useCreatePost } from '../lib/api-hooks';
import { adaptPost, normalizeList } from '../lib/api-adapters';

export function PostsPage() {
  const { data: rawPosts, isLoading } = usePosts();
  const createMut = useCreatePost();
  const posts: Post[] = normalizeList(rawPosts, adaptPost);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Post | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const columns: Column<Post>[] = [
    { key: 'code', header: 'Código', sortable: true, width: 'w-24', cell: r => <span className="font-mono text-xs text-muted-foreground">{r.code}</span> },
    {
      key: 'name', header: 'Posto', sortable: true,
      cell: r => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <MapPin className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-medium">{r.name}</span>
        </div>
      ),
    },
    { key: 'location', header: 'Localização', sortable: true, cell: r => <span className="text-sm text-muted-foreground">{r.location}</span> },
    { key: 'description', header: 'Descrição', cell: r => <span className="text-sm text-muted-foreground truncate max-w-xs">{r.description ?? '—'}</span> },
    { key: 'employee_count', header: 'Funcionários', sortable: true, cell: r => <span className="text-sm font-medium">{r.employee_count}</span> },
    { key: 'active', header: 'Status', cell: r => <ActiveBadge active={r.active} /> },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    toast.info('Eliminação de postos deve ser gerida pelo administrador.');
    setDeleteTarget(null);
    setDeleteLoading(false);
  };

  const onSave = async (post: Post) => {
    try {
      await createMut.mutateAsync({ nome: post.name, endereco: post.location, ativo: post.active });
      toast.success(editTarget ? 'Posto atualizado.' : 'Posto criado com sucesso.');
    } catch {
      toast.error('Erro ao salvar posto.');
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Postos de Trabalho"
        description="Locais e áreas de alocação dos colaboradores"
        actions={
          <button onClick={() => { setEditTarget(null); setDrawerOpen(true); }}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Novo Posto
          </button>
        }
      />
      <DataTable
        data={posts} columns={columns}
        searchFields={['name', 'code', 'location']}
        rowActions={row => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => { setEditTarget(row); setDrawerOpen(true); }}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setDeleteTarget(row)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      />
      <AnimatePresence>
        {drawerOpen && <PostDrawer post={editTarget} onClose={() => setDrawerOpen(false)} onSave={onSave} />}
      </AnimatePresence>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="Excluir posto" description={`Excluir "${deleteTarget?.name}"?`} />
    </div>
  );
}

function PostDrawer({ post, onClose, onSave }: { post: Post | null; onClose: () => void; onSave: (p: Post) => void }) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit } = useForm({ defaultValues: post ?? {} });

  const onSubmit = async (data: any) => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    onSave({
      id: post?.id ?? `p-${Date.now()}`,
      company_id: 'c-001',
      employee_count: post?.employee_count ?? 0,
      created_at: post?.created_at ?? new Date().toISOString(),
      active: Boolean(data.active),
      ...data,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative z-10 flex h-full w-full max-w-md flex-col bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">{post ? 'Editar Posto' : 'Novo Posto'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-4 px-6 py-5">
            <F label="Nome"><input {...register('name')} defaultValue={post?.name} placeholder="Linha de Produção A" className={ic()} /></F>
            <F label="Código"><input {...register('code')} defaultValue={post?.code} placeholder="LP-A" className={ic()} /></F>
            <F label="Localização"><input {...register('location')} defaultValue={post?.location} placeholder="Galpão A" className={ic()} /></F>
            <F label="Descrição">
              <textarea {...register('description')} defaultValue={post?.description} rows={3} placeholder="Descrição do posto..."
                className={cn(ic(), 'h-auto resize-none py-2')} />
            </F>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="post-active" {...register('active')} defaultChecked={post?.active ?? true} className="h-4 w-4 accent-primary" />
              <label htmlFor="post-active" className="text-sm text-foreground">Posto ativo</label>
            </div>
          </div>
          <div className="border-t border-border px-6 py-4 flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {post ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className="mb-1.5 block text-xs font-medium text-foreground">{label}</label>{children}</div>
);

const ic = () => 'h-9 w-full rounded-lg border border-border bg-input-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30';
