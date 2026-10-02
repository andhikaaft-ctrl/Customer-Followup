const p = (n: number) => String(n).padStart(2, '0');
const parts = (s: string) => s.split('-').map(Number);
const utc = (s: string) => { const [y, m, d] = parts(s); return Date.UTC(y, m - 1, d); };
export const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
export const isValidISO = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = parts(s); const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
};
export const addDays = (s: string, n: number) => {
  const t = new Date(utc(s) + n * 864e5);
  return `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())}`;
};
export const diffDays = (a: string, b: string) => Math.round((utc(a) - utc(b)) / 864e5);
export const fmt = (s?: string) => (s && isValidISO(s) ? s.split('-').reverse().join('/') : '-');
