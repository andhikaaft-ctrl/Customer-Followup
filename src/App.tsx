import { useState } from 'react';
import { Page } from './types';
import { Layout } from './components/Layout';
import { useCustomers } from './hooks/useCustomers';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { DataManagement } from './pages/DataManagement';
import { AuthGate } from './components/AuthGate';

export default function App() {
  return <AuthGate><CustomerApp /></AuthGate>;
}

function CustomerApp() {
  const s = useCustomers();
  const [page, setPage] = useState<Page>('dashboard');
  const [todayOnly, setTodayOnly] = useState(false);
  const nav = (p: Page) => { setTodayOnly(false); setPage(p); };
  return (
    <Layout page={page} onNav={nav}>
      {s.loading ? <div className="animate-pulse space-y-3" role="status" aria-label="Memuat data customer"><div className="h-10 rounded-xl bg-slate-200" /><div className="h-48 rounded-2xl bg-slate-200" /></div> : !s.ready ? <div className="card space-y-3"><p role="alert" className="text-sm text-red-600">{s.saveError}</p><button className="btn-primary" onClick={s.retry}>Coba Lagi</button></div> : <>
      {page === 'dashboard' && <Dashboard customers={s.customers} onViewToday={() => { setTodayOnly(true); setPage('customers'); }} />}
      {page === 'customers' && <Customers customers={s.customers} todayOnly={todayOnly} setTodayOnly={setTodayOnly} onAdd={s.add} onUpdate={s.update} onRemove={s.remove} />}
      {page === 'data' && <DataManagement customers={s.customers} saveError={s.saveError} onReplace={s.replaceAll} onResetDemo={s.resetDemo} onClear={s.clearAll} />}
      </>}
    </Layout>
  );
}
