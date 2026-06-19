import { useState } from 'react';
import { motion } from 'motion/react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LineChart, Line,
} from 'recharts';
import { BarChart3, Download, Calendar, TrendingUp, Users, Clock } from 'lucide-react';
import { PageHeader } from '../shared/PageHeader';
import { StatsCard } from '../shared/StatsCard';
import { useAppStore } from '../store/app.store';
import { cn } from '../lib/utils';

const REPORT_TYPES = [
  { id: 'attendance', label: 'Presenças', icon: Users },
  { id: 'overtime', label: 'Horas Extras', icon: TrendingUp },
  { id: 'absences', label: 'Ausências', icon: Clock },
  { id: 'departments', label: 'Departamentos', icon: BarChart3 },
];

export function ReportsPage() {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const [activeReport, setActiveReport] = useState('attendance');
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('week');

  const chartColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const axisColor = isDark ? '#4B5563' : '#94A3B8';
  const tooltipStyle = {
    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
    borderRadius: '0.5rem',
    color: isDark ? '#F8FAFC' : '#0F172A',
    fontSize: '12px',
  };

  const chartData: { date: string; present: number; absent: number; late: number; overtime: number }[] = [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Análises e métricas do controle de ponto"
        actions={
          <button className="flex h-9 items-center gap-2 rounded-lg border border-border px-4 text-sm text-muted-foreground hover:bg-muted transition-colors">
            <Download className="h-4 w-4" />
            Exportar PDF
          </button>
        }
      />

      {/* Report type selector */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {REPORT_TYPES.map(rt => {
          const Icon = rt.icon;
          return (
            <button
              key={rt.id}
              onClick={() => setActiveReport(rt.id)}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border p-4 text-sm font-medium transition-all',
                activeReport === rt.id
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/50'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {rt.label}
            </button>
          );
        })}
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Período:</span>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {[{ v: 'week', l: 'Semana' }, { v: 'month', l: 'Mês' }, { v: 'quarter', l: 'Trimestre' }].map(p => (
            <button
              key={p.v}
              onClick={() => setPeriod(p.v as any)}
              className={cn('px-3 py-1.5 text-xs font-medium transition-colors',
                period === p.v ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
              )}
            >{p.l}</button>
          ))}
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatsCard title="Taxa de Presença" value="91.2%" color="green" trend={1.4} trendLabel="vs período anterior" delay={0} />
        <StatsCard title="Taxa de Atraso" value="9.8%" color="yellow" trend={-2.1} trendLabel="vs período anterior" delay={0.05} />
        <StatsCard title="H. Extras Totais" value="142h" color="blue" trend={8.3} trendLabel="vs período anterior" delay={0.1} />
        <StatsCard title="Taxa de Absenteísmo" value="5.2%" color="red" trend={-0.8} trendLabel="vs período anterior" delay={0.15} />
      </div>

      {/* Main charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Attendance trend */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Tendência de Presença</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Evolução no período selecionado</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0057D9" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0057D9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColor} />
              <XAxis dataKey="date" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="present" name="Presentes" stroke="#0057D9" strokeWidth={2} fill="url(#rpGrad)" />
              <Area type="monotone" dataKey="absent" name="Ausentes" stroke="#EF4444" strokeWidth={2} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Overtime bar */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Horas Extras por Dia</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Acúmulo diário no período</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColor} vertical={false} />
              <XAxis dataKey="date" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="overtime" name="H. Extra" fill="#0057D9" radius={[3, 3, 0, 0]} maxBarSize={28} />
              <Bar dataKey="late" name="Atrasos" fill="#F59E0B" radius={[3, 3, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Department breakdown */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-xl border border-border bg-card p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Presença por Departamento</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Taxa de presença de cada área</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { dept: 'Operações', present: 95, absent: 3, late: 2 },
            { dept: 'Comercial', present: 92, absent: 4, late: 4 },
            { dept: 'Logística', present: 88, absent: 7, late: 5 },
            { dept: 'TI', present: 96, absent: 2, late: 2 },
            { dept: 'Financeiro', present: 98, absent: 1, late: 1 },
            { dept: 'RH', present: 100, absent: 0, late: 0 },
          ].map(row => (
            <div key={row.dept} className="flex items-center gap-4">
              <span className="w-28 flex-shrink-0 text-sm text-foreground">{row.dept}</span>
              <div className="flex flex-1 rounded-full overflow-hidden h-5">
                <div className="flex items-center justify-center bg-emerald-500 text-[9px] text-white font-medium" style={{ width: `${row.present}%` }}>
                  {row.present}%
                </div>
                <div className="bg-amber-400" style={{ width: `${row.late}%` }} />
                <div className="bg-red-400" style={{ width: `${row.absent}%` }} />
              </div>
              <span className="w-12 text-right text-xs text-muted-foreground">{row.present}%</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Presente</div>
          <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />Atrasado</div>
          <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-400" />Ausente</div>
        </div>
      </motion.div>
    </div>
  );
}
