import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { api } from '../services/api';
import { ItemSummary } from '../types';
import { ItemCard } from '../components/ItemCard';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  // Proteksi Sesi Instan: Jika user sudah login, langsung arahkan tanpa glitch / flash render
  if (!isLoading && user) {
    const role = (user.role || '').toLowerCase();
    const target =
      role === 'admin_developer' || role === 'admin'
        ? '/admin/dev'
        : role === 'admin_fo'
        ? '/admin/fo'
        : '/catalog';
    return <Navigate to={target} replace />;
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [latestItems, setLatestItems] = useState<ItemSummary[]>([]);
  const [stats, setStats] = useState({
    totalFound: 0,
    totalLost: 0,
    completedClaims: 0,
    returnRate: '0%',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, statsRes] = await Promise.allSettled([
          api.get('/items?limit=6'),
          api.get('/stats'),
        ]);
        if (itemsRes.status === 'fulfilled' && itemsRes.value.data.success) {
          setLatestItems(itemsRes.value.data.data);
        }
        if (statsRes.status === 'fulfilled' && statsRes.value.data.success) {
          setStats(statsRes.value.data.data);
        }
      } catch (err) {
        console.warn('Gagal memuat data beranda:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(searchQuery.trim() ? `/catalog?search=${encodeURIComponent(searchQuery.trim())}` : '/catalog');
  };

  const steps = [
    {
      icon: 'add_circle',
      num: '01',
      title: 'Penemuan & Penitipan FO',
      desc: 'Penemu mengisi form lapor temuan, menyertakan ciri rahasia, lalu menyerahkan barang fisik ke loket Front Office.',
    },
    {
      icon: 'fact_check',
      num: '02',
      title: 'Verifikasi Hidden Detail',
      desc: 'Pemilik melihat katalog publik, mengajukan klaim, dan menjawab pertanyaan ciri rahasia barang tanpa melihat contekan.',
    },
    {
      icon: 'key',
      num: '03',
      title: 'Terbit Claim Code 6-Char',
      desc: 'Jika jawaban cocok, sistem otomatis menerbitkan Claim Code unik 6-karakter aman (contoh: KF729X).',
    },
    {
      icon: 'task_alt',
      num: '04',
      title: 'Serah Terima & Konfirmasi',
      desc: 'Pemilik menunjukkan Claim Code di loket FO, menerima barang fisik, lalu mengonfirmasi penerimaan di sistem.',
    },
  ];

  return (
    <div className="space-y-12">
      {/* ─── Top Bar Khusus Pengguna Umum (Belum Login - Role-based Navbar) ─────── */}
      {!user && (
        <div className="bg-surface-white rounded-2xl border border-border-subtle p-4 sm:p-5 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-card">
              <span className="material-symbols-outlined text-on-primary text-[22px]">inventory_2</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-headline-sm text-text-primary">JejakBarang STIKOM CKI</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-subtle text-primary border border-primary/20">
                  Pengguna Umum
                </span>
              </div>
              <p className="text-label-sm text-text-secondary">
                Informasi publik barang hilang & temuan kampus STIKOM CKI. Masuk untuk akses penuh.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              to="/auth"
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-border-subtle bg-surface-white hover:bg-surface-container-low text-text-primary font-semibold text-label-md transition-all shadow-card text-center"
            >
              Masuk Akun
            </Link>
            <Link
              to="/auth"
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-primary-container hover:bg-primary-hover text-on-primary font-semibold text-label-md transition-all shadow-card flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Login via Google</span>
            </Link>
          </div>
        </div>
      )}

      {/* ─── Hero Section (Stitch Campus Lost & Found) ─────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-darker via-primary-deep to-primary text-on-primary px-6 sm:px-12 pt-12 pb-16 shadow-floating">
        {/* Subtle Decorative Ambient Orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-tertiary-fixed-dim/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-label-sm font-medium tracking-wider uppercase backdrop-blur-sm">
            <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">verified_user</span>
            Sistem Informasi Terpusat · STIKOM CKI 2026
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-headline-display-mobile font-extrabold tracking-tight leading-tight">
            Kehilangan atau Menemukan<br />
            <span className="text-tertiary-fixed-dim">Barang di Area Kampus?</span>
          </h1>

          <p className="text-body-md sm:text-body-lg text-white/80 max-w-xl mx-auto leading-relaxed">
            Portal resmi pelaporan civitas akademika dengan verifikasi ciri rahasia mandiri,
            Claim Code 6-karakter unik, dan penitipan terpusat di loket Front Office.
          </p>

          {/* Search box */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto flex items-center bg-surface-white rounded-xl p-1.5 shadow-floating border border-white/20"
          >
            <span className="material-symbols-outlined text-text-secondary pl-3 text-[22px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari barang (Dompet hitam, KTM, Jaket, Laptop)..."
              className="flex-1 py-2.5 px-3 text-body-md text-on-surface focus:outline-none placeholder:text-text-secondary bg-transparent"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-md bg-primary-container text-on-primary font-semibold text-label-md hover:bg-primary-hover transition-all flex-shrink-0 shadow-card"
            >
              Cari Sekarang
            </button>
          </form>

          {/* Quick CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to={user ? '/report-found' : '/auth?mode=register'}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-status-success text-white font-semibold text-label-md shadow-card hover:opacity-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              Saya Menemukan Barang
            </Link>
            <Link
              to={user ? '/report-lost' : '/auth?mode=register'}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-tertiary-fixed-dim text-on-accent-warm font-semibold text-label-md shadow-card hover:opacity-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">report</span>
              Saya Kehilangan Barang
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Live Stats ───────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: 'inbox', label: 'Barang Temuan Masuk', value: stats.totalFound, color: 'text-status-success bg-green-50' },
          { icon: 'report', label: 'Laporan Kehilangan', value: stats.totalLost, color: 'text-status-warning bg-amber-50' },
          { icon: 'task_alt', label: 'Klaim Berhasil', value: stats.completedClaims, color: 'text-primary-container bg-primary-subtle' },
          { icon: 'trending_up', label: 'Rasio Pengembalian', value: stats.returnRate, color: 'text-secondary bg-blue-50' },
        ].map((s, i) => (
          <div key={i} className="bg-surface-white p-5 rounded-xl border border-border-subtle shadow-card flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <span className="material-symbols-outlined text-[22px]">{s.icon}</span>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-text-primary">{s.value}</div>
              <div className="text-label-sm text-text-secondary">{s.label}</div>
            </div>
          </div>
        ))}
      </section>

      {/* ─── 4-Step Interactive Guide ─────────────────────── */}
      <section className="bg-surface-white rounded-2xl border border-border-subtle shadow-card p-6 sm:p-10 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-label-eyebrow uppercase tracking-widest text-primary-container font-semibold">Alur Sistem</span>
          <h2 className="text-headline-lg font-bold text-text-primary">Alur Terstruktur Pengembalian Barang</h2>
          <p className="text-body-md text-text-secondary">
            Menggantikan klaim lisan di WhatsApp dengan verifikasi kepemilikan terpusat yang adil dan aman.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {steps.map((step, i) => (
            <div
              key={i}
              className="group relative p-6 rounded-xl border border-border-subtle bg-canvas-background hover:border-primary-container hover:-translate-y-0.5 hover:shadow-card-hover transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${i === 3 ? 'bg-status-success text-white' : 'bg-primary-container text-on-primary'}`}>
                  <span className="material-symbols-outlined text-[20px]">{step.icon}</span>
                </div>
                <span className="text-label-eyebrow uppercase tracking-widest text-text-secondary font-semibold">{step.num}</span>
              </div>
              <h3 className="text-headline-sm font-semibold text-text-primary">{step.title}</h3>
              <p className="text-body-sm text-text-secondary leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Latest Items Showcase ────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-headline-md font-bold text-text-primary">Laporan Terbaru di Kampus</h2>
            <p className="text-body-sm text-text-secondary">Barang temuan dan laporan hilang yang baru masuk.</p>
          </div>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-1.5 text-label-md font-semibold text-primary-container hover:text-primary-hover transition-colors"
          >
            Lihat Semua
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-64 rounded-xl bg-surface-container animate-pulse" />
            ))}
          </div>
        ) : latestItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {latestItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-14 bg-surface-white rounded-xl border border-border-subtle">
            <span className="material-symbols-outlined text-[48px] text-outline mb-3 block">inbox</span>
            <p className="text-body-md font-medium text-text-secondary">Belum ada laporan barang saat ini.</p>
            <p className="text-body-sm text-text-secondary mt-1">Jadilah yang pertama melaporkan barang temuan!</p>
          </div>
        )}
      </section>
    </div>
  );
};
