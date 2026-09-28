import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AppLayout: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('clinixlens_theme') === 'dark' ||
      (!('clinixlens_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('clinixlens_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('clinixlens_theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" style={{ background: 'var(--bg-primary)' }}>
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
