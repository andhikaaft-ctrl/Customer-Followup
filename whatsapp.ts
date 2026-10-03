export function normalizeWA(raw: string) {
  let d = String(raw).replace(/\D/g, '');
  if (d.startsWith('0')) d = '62' + d.slice(1);
  else if (d.startsWith('8')) d = '62' + d;
  return d;
}
export const isValidWA = (raw: string) => /^628\d{8,12}$/.test(normalizeWA(raw));
export const waLink = (raw: string) => `https://wa.me/${normalizeWA(raw)}`;
