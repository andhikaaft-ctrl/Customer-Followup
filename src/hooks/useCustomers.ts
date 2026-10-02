import { useCallback, useEffect, useState } from 'react';
import { Customer, CustomerInput } from '../types';
import { makeSampleData } from '../data/sample';
import { sanitize } from '../utils/io';

const KEY = 'cfm.customers.v1';

function load(): Customer[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return makeSampleData(); // hanya saat pertama kali dibuka
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.map(sanitize).filter((c): c is Customer => c !== null) : [];
  } catch {
    return []; // data corrupt: mulai kosong, tidak crash
  }
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>(load);
  const [saveError, setSaveError] = useState('');
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(customers)); setSaveError(''); }
    catch { setSaveError('Gagal menyimpan ke browser (penyimpanan penuh/diblokir). Segera Export JSON.'); }
  }, [customers]);

  const add = useCallback((d: CustomerInput) => {
    const now = new Date().toISOString();
    setCustomers((cs) => [...cs, { ...d, id: crypto.randomUUID(), createdAt: now, updatedAt: now }]);
  }, []);
  const update = useCallback((id: string, d: CustomerInput) =>
    setCustomers((cs) => cs.map((c) => (c.id === id ? { ...c, ...d, updatedAt: new Date().toISOString() } : c))), []);
  const remove = useCallback((id: string) => setCustomers((cs) => cs.filter((c) => c.id !== id)), []);
  const replaceAll = useCallback((cs: Customer[]) => setCustomers(cs), []);
  const resetDemo = useCallback(() => setCustomers(makeSampleData()), []);
  const clearAll = useCallback(() => setCustomers([]), []);
  return { customers, saveError, add, update, remove, replaceAll, resetDemo, clearAll };
}
