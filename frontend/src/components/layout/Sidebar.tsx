import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus,
  History,
  TestTube2,
  Settings,
  Stethoscope,
  Activity,
  Database,
  Cpu,
} from 'lucide-react';

interface SidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'New Analysis', path: '/new-analysis', icon: FilePlus },
    { name: 'History', path: '/history', icon: History },
    { name: 'Synthetic Cases', path: '/synthetic-cases', icon: TestTube2 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-clinical-950/30 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r p-4 transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-soft)',
        }}
      >
        {/* Top: Brand Header */}
        <div>
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-clinical-500 to-pastel-mint-500 text-white shadow-soft">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>ClinixLens</span>
                <span className="rounded-lg bg-clinical-100 px-1.5 py-0.5 text-[10px] font-semibold text-clinical-700 dark:bg-clinical-950 dark:text-clinical-300">
                  AI
                </span>
              </div>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Clinical Intelligence</p>
            </div>
          </div>

          <div className="my-4 h-px" style={{ background: 'var(--border-soft)' }} />

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-clinical-50 text-clinical-700 shadow-sm dark:bg-clinical-950/70 dark:text-clinical-300 font-semibold'
                        : 'hover:bg-clinical-50/50 dark:hover:bg-clinical-950/30'
                    }`
                  }
                  style={({ isActive }) => ({
                    color: isActive ? undefined : 'var(--text-secondary)',
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`h-4 w-4 ${
                          isActive
                            ? 'text-clinical-600 dark:text-clinical-400'
                            : ''
                        }`}
                        style={!isActive ? { color: 'var(--text-muted)' } : undefined}
                      />
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Real-Time Operational System Status */}
        <div className="rounded-2xl p-3.5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-soft)' }}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              System Status
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pastel-mint-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pastel-mint-500"></span>
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* AI Engine Status */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Cpu className="h-3.5 w-3.5 text-clinical-500" />
                <span>AI Engine</span>
              </span>
              <span className="font-medium text-pastel-mint-600 dark:text-pastel-mint-400">Online</span>
            </div>

            {/* Database Status */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Database className="h-3.5 w-3.5 text-pastel-mint-500" />
                <span>Database</span>
              </span>
              <span className="font-medium text-pastel-mint-600 dark:text-pastel-mint-400">Connected</span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 text-[10px] text-center" style={{ borderTop: '1px solid var(--border-soft)', color: 'var(--text-muted)' }}>
            v1.0.0 • Evidence-Linked Review
          </div>
        </div>
      </aside>
    </>
  );
};
