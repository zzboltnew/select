import { useState } from 'react';
import {
  Users,
  Building2,
  Eye,
  Database,
  ClipboardList,
  UserCheck,
  FileCheck,
  BarChart3,
  LayoutDashboard,
  Menu,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { DBProvider, useDB } from '@/store/db';
import ExpertsPage from '@/pages/ExpertsPage';
import InstitutionsPage from '@/pages/InstitutionsPage';
import ObserversPage from '@/pages/ObserversPage';
import BaseDictPage from '@/pages/BaseDictPage';
import LedgersPage from '@/pages/LedgersPage';
import SelectionPage from '@/pages/SelectionPage';
import ResultsPage from '@/pages/ResultsPage';
import DashboardPage from '@/pages/DashboardPage';
import { Button } from '@/components/ui';

type PageKey = 'dashboard' | 'experts' | 'institutions' | 'observers' | 'base' | 'ledgers' | 'selection' | 'results';

interface NavItem {
  key: PageKey;
  label: string;
  icon: typeof Users;
  group: string;
}

const NAV: NavItem[] = [
  { key: 'dashboard', label: '评审数据驾驶舱', icon: BarChart3, group: '驾驶舱' },
  { key: 'ledgers', label: '评审台账', icon: ClipboardList, group: '业务流程' },
  { key: 'selection', label: '组建评审专家组', icon: UserCheck, group: '业务流程' },
  { key: 'results', label: '评审结果登记', icon: FileCheck, group: '业务流程' },
  { key: 'experts', label: '专家库', icon: Users, group: '后台数据维护' },
  { key: 'institutions', label: '机构证书库', icon: Building2, group: '后台数据维护' },
  { key: 'observers', label: '观察员库', icon: Eye, group: '后台数据维护' },
  { key: 'base', label: '基础数据库', icon: Database, group: '后台数据维护' },
];

function AppShell() {
  const { loading, error, reload } = useDB();
  const [page, setPage] = useState<PageKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectionLedgerId, setSelectionLedgerId] = useState<string | null>(null);

  const goToSelection = (ledgerId: string) => {
    setSelectionLedgerId(ledgerId);
    setPage('selection');
  };

  const groups = [...new Set(NAV.map((n) => n.group))];

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage />;
      case 'experts': return <ExpertsPage />;
      case 'institutions': return <InstitutionsPage />;
      case 'observers': return <ObserversPage />;
      case 'base': return <BaseDictPage />;
      case 'ledgers': return <LedgersPage onGoToSelection={goToSelection} />;
      case 'selection': return <SelectionPage ledgerId={selectionLedgerId} onLedgerChanged={goToSelection} />;
      case 'results': return <ResultsPage />;
    }
  };

  const currentNav = NAV.find((n) => n.key === page);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 text-slate-300 transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-700/50 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-cyan-500 text-white">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">专家抽签系统</h1>
            <p className="text-xs text-slate-400">评审专家管理系统</p>
          </div>
        </div>
        <nav className="px-3 py-4 space-y-6 overflow-y-auto h-[calc(100vh-4rem)]">
          {groups.map((group) => (
            <div key={group}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{group}</p>
              <div className="space-y-1">
                {NAV.filter((n) => n.group === group).map((item) => {
                  const Icon = item.icon;
                  const active = page === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => { setPage(item.key); setSidebarOpen(false); }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                        active
                          ? 'bg-sky-600/20 text-sky-300 font-medium'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <Icon size={18} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2">
              {currentNav && <currentNav.icon size={20} className="text-sky-600" />}
              <h2 className="text-lg font-semibold text-slate-800">{currentNav?.label}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="hidden sm:inline">管理员</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sm font-medium text-sky-700">A</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-6">
          <div className="mx-auto max-w-7xl">
            {loading ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 size={32} className="animate-spin text-sky-500" />
                <p className="text-sm">正在从数据库加载数据...</p>
              </div>
            ) : error ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-500">
                <AlertCircle size={32} className="text-red-500" />
                <p className="text-sm">加载失败：{error}</p>
                <button onClick={() => reload()} className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700">重试</button>
              </div>
            ) : (
              renderPage()
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DBProvider>
      <AppShell />
    </DBProvider>
  );
}
