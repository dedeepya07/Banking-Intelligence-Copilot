import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  MessageSquare,
  CreditCard,
  Shield,
  TrendingUp,
  FileText,
  Settings,
  Search,
  LogOut,
  Clock,
  Activity
} from 'lucide-react';
import { RoleBadge } from './RoleBadge';
import { Breadcrumb } from './Breadcrumb';

const navigationItems = [
  { path: '/', label: 'Dashboard Overview', icon: LayoutDashboard },
  { path: '/query', label: 'Query Assistant', icon: MessageSquare },
  { path: '/transactions', label: 'Transactions', icon: CreditCard },
  { path: '/fraud', label: 'Fraud Intelligence', icon: Shield },
  { path: '/quantum-fraud', label: 'Quantum Fraud Intelligence', icon: Shield },
  { path: '/analytics', label: 'Risk Analytics', icon: TrendingUp },
  { path: '/audit', label: 'Audit Logs', icon: FileText },
  { path: '/governance', label: 'Query Governance', icon: Activity },
  { path: '/scheduled', label: 'Scheduled Reports', icon: Clock },
  { path: '/admin', label: 'Admin / RBAC', icon: Settings },
];

export function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      alert(`Search functionality would filter results for: "${searchQuery}"\n\nIn a production system, this would search across transactions, customers, and audit logs.`);
    }
  };

  const getBreadcrumbs = () => {
    const path = location.pathname;
    const breadcrumbs = [{ label: 'Home', path: '/' }];

    const routeMap: Record<string, string> = {
      '/query': 'Query Assistant',
      '/transactions': 'Transactions',
      '/fraud': 'Fraud Intelligence',
      '/analytics': 'Risk Analytics',
      '/audit': 'Audit Logs',
      '/scheduled': 'Scheduled Reports',
      '/admin': 'Admin / RBAC',
    };

    if (path !== '/' && routeMap[path]) {
      breadcrumbs.push({ label: routeMap[path], path: path });
    }

    return breadcrumbs;
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-primary border-r border-primary/20 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-accent" />
            <div>
              <h1 className="text-[16px] font-semibold text-primary-foreground">
                Banking Intelligence
              </h1>
              <p className="text-[11px] text-sidebar-foreground/70">Copilot Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 text-[14px] transition-colors ${isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-sidebar-border">
          <p className="text-[11px] text-sidebar-foreground/50">
            © 2026 Enterprise Banking System
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-[18px] font-semibold text-foreground">
                Banking Intelligence Copilot
              </h2>
              <RoleBadge role={user?.role as any || 'analyst'} />
              <span className="px-2 py-0.5 text-[11px] font-medium bg-success/10 text-success border border-success/30">
                PRODUCTION
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-64 bg-input-background border border-input text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  type="submit"
                  onClick={handleSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {/* Timezone */}
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 text-[13px] text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>EST {currentTime}</span>
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-[12px] font-medium text-accent-foreground uppercase">
                  {user?.username?.substring(0, 2) || 'AD'}
                </div>
                <button onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Breadcrumb breadcrumbs={getBreadcrumbs()} />
          <Outlet />
        </main>
      </div>
    </div>
  );
}