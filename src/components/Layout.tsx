import { ReactNode } from 'react';
import { Page } from '../types';

const NAV: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'customers', label: 'Data Customer', icon: '☰' },
  { id: 'data', label: 'Data Management', icon: '⚙' },
];
export function Layout({ page, onNav, children }: { page: Page; onNav: (p: Page) => void; children: ReactNode }) {
  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white p-4 md:block">
        <div className="mb-6 px-2 text-lg font-bold text-teal-800">Follow-Up CRM</div>
        <nav className="space-y-1" aria-label="Menu utama">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => onNav(n.id)} aria-current={page === n.id ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${page === n.id ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-100'}`}>
              <span aria-hidden>{n.icon}</span>{n.label}
            </button>))}
        </nav>
      </aside>
      <main className="mx-auto w-full max-w-6xl flex-1 p-4 pb-24 md:p-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-slate-200 bg-white md:hidden" aria-label="Menu utama">
        {NAV.map((n) => (
          <button key={n.id} onClick={() => onNav(n.id)} aria-current={page === n.id ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600 ${page === n.id ? 'text-teal-800' : 'text-slate-500'}`}>
            <span aria-hidden className="text-base">{n.icon}</span>{n.label}
          </button>))}
      </nav>
    </div>
  );
}
