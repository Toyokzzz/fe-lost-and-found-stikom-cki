import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isProfileComplete, isAdminFO, isAdminDev } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Aturan Bisnis #1: Pengguna Umum (Belum Login) TIDAK ADA Navbar, hanya Beranda
  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;
  const navLinkClass = (path: string) =>
    `px-3 py-2 rounded-md text-label-md font-medium transition-all ${
      isActive(path)
        ? 'text-primary-container font-semibold bg-primary-subtle'
        : 'text-text-secondary hover:text-on-surface hover:bg-surface-container-low'
    }`;

  // Role-based Nav Links
  const role = (user.role || '').toLowerCase();
  const isFO = role === 'admin_fo';
  const isDev = role === 'admin_developer' || role === 'admin';

  let navItems: { to: string; label: string; icon?: string; badge?: string }[] = [];

  if (isDev) {
    navItems = [
      { to: '/admin/dev', label: 'Panel Developer', icon: 'terminal' },
      { to: '/admin/fo', label: 'Panel Admin FO', icon: 'verified_user' },
      { to: '/catalog', label: 'Katalog Barang', icon: 'grid_view' },
      { to: '/profile', label: 'Profil', icon: 'person' },
    ];
  } else if (isFO) {
    navItems = [
      { to: '/admin/fo', label: 'Panel Admin FO', icon: 'verified_user' },
      { to: '/profile', label: 'Profil', icon: 'person' },
    ];
  } else {
    // User Biasa (Mahasiswa / Civitas CKI)
    navItems = [
      { to: '/catalog', label: 'Katalog Barang', icon: 'grid_view' },
      { to: '/report-found', label: 'Lapor Temuan', icon: 'add_circle' },
      { to: '/report-lost', label: 'Lapor Hilang', icon: 'report' },
      {
        to: '/profile',
        label: 'Profil',
        icon: 'person',
        badge: !isProfileComplete ? 'Wajib Lengkap' : undefined,
      },
      { to: '/my-history', label: 'Riwayat Saya', icon: 'history' },
    ];
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-surface-white/95 backdrop-blur-xl shadow-nav border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-gutter h-16 flex items-center justify-between gap-4">
        {/* Logo Brand */}
        <Link to="/" className="flex items-center gap-space-sm group flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-card transition-transform group-hover:scale-105">
            <span className="material-symbols-outlined text-on-primary text-[22px]">inventory_2</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-headline-sm font-headline-sm text-text-primary tracking-tight">JejakBarang CKI</span>
            <span className="text-label-eyebrow font-label-eyebrow uppercase text-text-secondary tracking-widest">
              STIKOM CKI
            </span>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex items-center gap-1.5 ${navLinkClass(item.to)}`}
            >
              {item.icon && <span className="material-symbols-outlined text-[18px]">{item.icon}</span>}
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse border border-amber-300">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User Badge & Actions */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          <Link
            to="/profile"
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-border-subtle hover:bg-surface-container-low transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-sm">
              {user.name.charAt(0)}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-label-md font-bold text-text-primary">
                {user.name.split(' ')[0]}
              </span>
              <span className="text-label-eyebrow uppercase text-text-secondary">
                {isDev ? 'Admin Dev' : isFO ? 'Admin FO' : user.kelas ? `Kelas ${user.kelas}` : 'User CKI'}
              </span>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-md text-label-md font-medium text-text-secondary hover:text-status-error hover:bg-red-50 border border-border-subtle bg-surface-white transition-all shadow-card flex items-center gap-1.5"
            title="Keluar Akun"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Keluar</span>
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden p-2 rounded-md text-text-secondary hover:bg-surface-container-low"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Buka Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border-subtle bg-surface-white px-gutter-mobile py-3 space-y-1 animate-fadeIn">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between ${navLinkClass(item.to)}`}
            >
              <div className="flex items-center gap-2">
                {item.icon && <span className="material-symbols-outlined text-[18px]">{item.icon}</span>}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
          <div className="pt-3 border-t border-border-subtle">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-label-md font-medium text-status-error flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Keluar ({user.name.split(' ')[0]})
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
