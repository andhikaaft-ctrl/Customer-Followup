import { useCallback, useEffect, useState } from 'react';
import { Customer, CustomerInput } from '../types';
import { makeSampleData } from '../data/sample';
import { parseImport } from '../utils/io';

const KEY = 'cfm.customers.v1';

async function request<T>(method: string, body?: unknown): Promise<T> {
  const response = await fetch('/api/customers', {
    method, credentials: 'same-origin',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error('Gagal menyimpan atau memuat data customer. Periksa koneksi dan coba lagi.');
  return response.json() as Promise<T>;
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saveError, setSaveError] = useState('');
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setReady(false);
    const load = async () => {
      try {
        let rows = await request<Customer[]>('GET');
        let legacy: string | null = null;
        if (!active) return;
        try { legacy = localStorage.getItem(KEY); } catch { legacy = null; }
        if (legacy !== null) {
          const imported = parseImport(legacy);
          rows = await request<Customer[]>('POST', { customers: imported });
          if (!active) return;
          try { localStorage.removeItem(KEY); } catch { legacy = null; }
        }
        if (active) { setCustomers(rows); setSaveError(''); setReady(true); }
      } catch {
        if (active) setSaveError('Gagal memuat atau memindahkan data lama. Data browser belum dihapus. Periksa koneksi dan coba lagi.');
      } finally { if (active) setLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [loadAttempt]);

  const add = useCallback(async (data: CustomerInput) => {
    const created = await request<Customer>('POST', { customer: data });
    setCustomers((rows) => [...rows, created]);
  }, []);
  const update = useCallback(async (id: string, data: CustomerInput) => {
    const updated = await request<Customer>('PATCH', { id, customer: data });
    setCustomers((rows) => rows.map((row) => row.id === id ? updated : row));
  }, []);
  const remove = useCallback(async (id: string) => {
    await request('DELETE', { id });
    setCustomers((rows) => rows.filter((row) => row.id !== id));
  }, []);
  const replaceAll = useCallback(async (rows: Customer[]) => {
    setCustomers(await request<Customer[]>('PUT', { customers: rows }));
  }, []);
  const resetDemo = useCallback(() => replaceAll(makeSampleData()), [replaceAll]);
  const clearAll = useCallback(() => replaceAll([]), [replaceAll]);
  const retry = useCallback(() => setLoadAttempt((attempt) => attempt + 1), []);
  return { customers, saveError, loading, ready, retry, add, update, remove, replaceAll, resetDemo, clearAll };
}
