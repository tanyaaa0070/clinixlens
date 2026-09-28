import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Plus, Activity, ShieldCheck, Stethoscope } from 'lucide-react';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  setDarkMode,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const location = useLocation();

  return (
    <header
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between px-4 backdrop-blur-md lg:px-8"
      style={{
        background: darkMode ? 'rgba(26, 22, 48, 0.92)' : 'rgba(253, 249, 245, 0.92)',
        borderBottom: '1px solid var(--border-soft)',
      }}
    >
      {/* Left side: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 hover:bg-clinical-50 dark:hover:bg-clinical-950/40 lg:hidden"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Mobile brand (hidden on desktop where sidebar handles it) */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-clinical-500 to-pastel-mint-500 text-white shadow-md">
            <Stethoscope className="h-5 w-5" />
          </div>
          <span className="font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>ClinixLens</span>
        </div>

        {/* Desktop Breadcrumb/Context */}
        <div className="hidden items-center gap-2 text-sm lg:flex" style={{ color: 'var(--text-muted)' }}>
          <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Clinical Intelligence</span>
          <span>/</span>
          <span className="capitalize text-clinical-600 dark:text-clinical-400 font-semibold">
            {location.pathname === '/' ? 'Workspace Overview' : location.pathname.substring(1).replace('-', ' ')}
          </span>
        </div>
      </div>

      {/* Right side: Actions, Theme, Status */}
      <div className="flex items-center gap-3">
        {/* Synthetic Data Badge */}
        <div className="hidden items-center gap-1.5 rounded-full bg-pastel-mint-50 px-3 py-1 text-xs font-medium text-pastel-mint-600 dark:bg-pastel-mint-600/10 dark:text-pastel-mint-400 md:flex" style={{ border: '1px solid var(--border-soft)' }}>
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Synthetic Data Certified</span>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="rounded-xl p-2 transition-colors hover:bg-clinical-50 dark:hover:bg-clinical-950/40"
          style={{ border: '1px solid var(--border-soft)', color: 'var(--text-secondary)' }}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Quick Review CTA */}
        <Link
          to="/new-analysis"
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-clinical-500 to-clinical-400 px-3.5 py-2 text-xs font-semibold text-white shadow-soft transition-all hover:from-clinical-600 hover:to-clinical-500 hover:shadow-glow-lavender sm:text-sm"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Analysis</span>
          <span className="sm:hidden">Analyze</span>
        </Link>
      </div>
    </header>
  );
};
