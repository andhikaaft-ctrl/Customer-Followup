import { useState } from 'react';
import { Page } from './types';
import { Layout } from './components/Layout';
import { useCustomers } from './hooks/useCustomers';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { DataManagement } from './pages/DataManagement';

export default function App() {
  const s = useCustomers();
  const [page, setPage] = useState<Page>('dashboard');
  const [todayOnly, setTodayOnly] = useState(false);
  const nav = (p: Page) => { setTodayOnly(false); setPage(p); };
  return (
    <Layout page={page} onNav={nav}>
      {page === 'dashboard' && <Dashboard customers={s.customers} onViewToday={() => { setTodayOnly(true); setPage('customers'); }} />}
      {page === 'customers' && <Customers customers={s.customers} todayOnly={todayOnly} setTodayOnly={setTodayOnly} onAdd={s.add} onUpdate={s.update} onRemove={s.remove} />}
      {page === 'data' && <DataManagement customers={s.customers} saveError={s.saveError} onReplace={s.replaceAll} onResetDemo={s.resetDemo} onClear={s.clearAll} />}
    </Layout>
  );
}
