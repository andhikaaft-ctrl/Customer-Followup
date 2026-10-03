import { useCallback, useEffect, useState } from 'react';
import { Customer, CustomerInput } from '../types';
import { makeSampleData } from '../data/sample';
import { sanitize } from '../utils/io';
import { calc, completeNext } from '../utils/service';

const KEY = 'cfm.customers.v1'; // key tetap agar data lama terbaca (dimigrasi oleh sanitize)

function load(): Customer[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return makeSampleData();
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.map(sanitize).filter((c): c is Customer => c !== null) : [];
  } catch { return []; }
}
const build = (d: CustomerInput): Customer => {
  const now = new Date().toISOString(), c: Customer = { ...d, history: [], id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  return d.status === 'GOAL (Service)' ? completeNext(c) : c;
};

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>(load);
  const [saveError, setSaveError] = useState('');
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(customers)); setSaveError(''); }
    catch { setSaveError('Gagal menyimpan ke browser (penyimpanan penuh/diblokir). Segera Export JSON.'); }
  }, [customers]);

  const add = useCallback((d: CustomerInput) => setCustomers((cs) => [...cs, build(d)]), []);
  const addMany = useCallback((ds: CustomerInput[]) => setCustomers((cs) => [...cs, ...ds.map(build)]), []);
  const update = useCallback((id: string, d: CustomerInput) => setCustomers((cs) => cs.map((c) => {
    if (c.id !== id) return c;
    let n: Customer = { ...c, ...d, updatedAt: new Date().toISOString() };
    // Beralih ke GOAL = service aktif selesai (hanya sekali, selama masih ada entitlement)
    if (d.status === 'GOAL (Service)' && c.status !== 'GOAL (Service)' && calc(c).remaining > 0) n = completeNext(n);
    return n;
  })), []);
  const complete = useCallback((id: string) => setCustomers((cs) => cs.map((c) => (c.id === id ? { ...completeNext(c), updatedAt: new Date().toISOString() } : c))), []);
  const remove = useCallback((id: string) => setCustomers((cs) => cs.filter((c) => c.id !== id)), []);
  const replaceAll = useCallback((cs: Customer[]) => setCustomers(cs), []);
  const resetDemo = useCallback(() => setCustomers(makeSampleData()), []);
  const clearAll = useCallback(() => setCustomers([]), []);
  return { customers, saveError, add, addMany, update, complete, remove, replaceAll, resetDemo, clearAll };
}
