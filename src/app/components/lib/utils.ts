import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';
import 'dayjs/locale/pt';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.locale('pt');

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, format = 'DD/MM/YYYY') {
  return dayjs(date).format(format);
}

export function formatDateTime(date: string | Date) {
  return dayjs(date).format('DD/MM/YYYY HH:mm');
}

export function formatRelative(date: string | Date) {
  return dayjs(date).fromNow();
}

export function formatBI(bi: string): string {
  return bi;
}

export function formatCPF(cpf: string): string {
  return formatBI(cpf);
}

export function formatNIF(nif: string): string {
  return nif;
}

export function formatCNPJ(cnpj: string): string {
  return formatNIF(cnpj);
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
  }).format(value);
}

export function formatHours(minutes: number): string {
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.abs(minutes) % 60;
  const sign = minutes < 0 ? '-' : '+';
  return `${sign}${h}h${m.toString().padStart(2, '0')}m`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function debounce<T extends (...args: any[]) => any>(fn: T, delay = 300) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function paginate<T>(data: T[], page: number, perPage: number) {
  const start = (page - 1) * perPage;
  return data.slice(start, start + perPage);
}

export function filterData<T extends Record<string, any>>(
  data: T[],
  search: string,
  fields: (keyof T)[]
): T[] {
  if (!search.trim()) return data;
  const q = search.toLowerCase().trim();
  return data.filter((item) =>
    fields.some((field) => String(item[field] ?? '').toLowerCase().includes(q))
  );
}
