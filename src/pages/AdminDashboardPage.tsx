import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SystemStats, Category, StorageLocation } from '../types';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdminDev } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'claims' | 'categories' | 'locations'>('overview');

  const [stats, setStats] = useState<SystemStats | null>(null);
  const [allItems, setAllItems] = useState<{ foundItems: any[]; lostReports: any[] }>({
    foundItems: [],
    lostReports: [],
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // New Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');

  // New Location Form State
  const [newLocName, setNewLocName] = useState('');
  const [newLocBuilding, setNewLocBuilding] = useState('');
  const [newLocHours, setNewLocHours] = useState('');
  const [newLocContact, setNewLocContact] = useState('');

  useEffect(() => {
    if (!user || !isAdminDev) {
      navigate('/auth');
      return;
    }

    fetchAdminData();
  }, [user, isAdminDev, navigate]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, itemsRes, catRes, locRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/items'),
        api.get('/categories'),
        api.get('/locations'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (itemsRes.data.success) setAllItems(itemsRes.data.data);
      if (catRes.data.success) setCategories(catRes.data.data);
      if (locRes.data.success) setLocations(locRes.data.data);
    } catch (err) {
      console.error('Gagal mengambil data admin:', err);
    } finally {
      setLoading(false);
    }
  };

  // Moderation Handlers
  const handleModerateItem = async (type: 'found' | 'lost', id: string, action: string, status?: string) => {
    if (!confirm(`Konfirmasi tindakan moderasi "${action}" pada laporan ini?`)) return;

    try {
      await api.post(`/admin/items/${type}/${id}/moderate`, { action, status });
      await fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memproses moderasi.');
    }
  };

  // Category CRUD
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/categories', { name: newCatName, slug: newCatSlug });
      setNewCatName('');
      setNewCatSlug('');
      await fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal membuat kategori.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Hapus kategori ini?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      await fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus kategori.');
    }
  };

  // Location CRUD
  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/locations', {
        name: newLocName,
        building: newLocBuilding,
        service_hours: newLocHours,
        contact: newLocContact,
        is_active: true,
      });
      setNewLocName('');
      setNewLocBuilding('');
      setNewLocHours('');
      setNewLocContact('');
      await fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal membuat lokasi FO.');
    }
  };

  const handleToggleLocation = async (id: string) => {
    try {
      await api.patch(`/admin/locations/${id}/toggle-active`);
      await fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengubah status aktif lokasi.');
    }
  };

  const handleResolveClaim = async (claimId: string, action: 'force_handover' | 'reject') => {
    const confirmMsg =
      action === 'force_handover'
        ? 'Selesaikan serah terima paksa oleh Admin? Status klaim akan diubah menjadi "handed_over" dan barang menjadi "completed".'
        : 'Batalkan klaim ini? Status klaim akan diubah menjadi "rejected" dan barang akan dikembalikan ke status "active".';
    if (!confirm(confirmMsg)) return;

    try {
      const res = await api.post('/admin/claims/resolve', { claim_id: claimId, action });
      alert(res.data.message || 'Klaim berhasil diproses.');
      await fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memproses resolusi klaim.');
    }
  };

  const allClaims = (allItems.foundItems || []).flatMap((item: any) =>
    (item.claims || []).map((claim: any) => ({
      ...claim,
      item_title: item.title,
      item_id: item.id,
      storage_location_name: item.storage_location?.name || 'Loket FO',
    }))
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Admin Header */}
      <div className="bg-primary-darker text-white rounded-2xl p-6 sm:p-8 shadow-floating flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary-container flex items-center justify-center shadow-card">
            <span className="material-symbols-outlined text-[32px] text-on-primary">admin_panel_settings</span>
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-widest text-tertiary-fixed-dim uppercase">
              PORTAL ADMINISTRATOR RESMI
            </span>
            <h1 className="text-2xl sm:text-headline-lg font-bold tracking-tight">Dashboard & Moderasi Sistem</h1>
            <p className="text-body-sm text-white/70">
              Kelola master data, pantau statistik pengembalian, dan moderasi laporan kampus STIKOM CKI.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-label-md font-medium text-white flex items-center gap-2 transition-colors border border-white/10"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center bg-surface-white p-1 rounded-xl border border-border-subtle shadow-card gap-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-label-md font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'overview' ? 'bg-primary-container text-on-primary shadow-card' : 'text-text-secondary hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">bar_chart</span>
          Overview & Metrik
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`px-4 py-2 rounded-lg text-label-md font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'items' ? 'bg-primary-container text-on-primary shadow-card' : 'text-text-secondary hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
          Moderasi Laporan ({allItems.foundItems.length + allItems.lostReports.length})
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 rounded-lg text-label-md font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'claims' ? 'bg-primary-container text-on-primary shadow-card' : 'text-text-secondary hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">verified_user</span>
          Manajemen Klaim ({allClaims.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-lg text-label-md font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'categories' ? 'bg-primary-container text-on-primary shadow-card' : 'text-text-secondary hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">sell</span>
          Master Kategori ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          className={`px-4 py-2 rounded-lg text-label-md font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'locations' ? 'bg-primary-container text-on-primary shadow-card' : 'text-text-secondary hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">corporate_fare</span>
          Master Lokasi FO ({locations.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-white p-5 rounded-xl border border-border-subtle shadow-card space-y-1">
              <span className="text-label-sm font-semibold text-text-secondary">Total Barang Temuan</span>
              <div className="text-3xl font-extrabold text-text-primary">{stats.totalFound}</div>
              <span className="text-label-sm text-status-success font-medium">{stats.completedFound} berhasil diserahkan</span>
            </div>

            <div className="bg-surface-white p-5 rounded-xl border border-border-subtle shadow-card space-y-1">
              <span className="text-label-sm font-semibold text-text-secondary">Total Laporan Kehilangan</span>
              <div className="text-3xl font-extrabold text-text-primary">{stats.totalLost}</div>
              <span className="text-label-sm text-status-warning font-medium">{stats.activeLost} sedang aktif</span>
            </div>

            <div className="bg-surface-white p-5 rounded-xl border border-border-subtle shadow-card space-y-1">
              <span className="text-label-sm font-semibold text-text-secondary">Total Klaim Terverifikasi</span>
              <div className="text-3xl font-extrabold text-text-primary">{stats.totalClaims}</div>
              <span className="text-label-sm text-primary-container font-medium">{stats.completedClaims} telah diambil di FO</span>
            </div>

            <div className="bg-surface-white p-5 rounded-xl border border-border-subtle shadow-card space-y-1">
              <span className="text-label-sm font-semibold text-text-secondary">Tingkat Pengembalian</span>
              <div className="text-3xl font-extrabold text-status-success">{stats.returnRate}</div>
              <span className="text-label-sm text-text-secondary font-medium">Civitas Terdaftar: {stats.totalUsers}</span>
            </div>
          </div>

          <div className="bg-surface-white rounded-2xl p-6 sm:p-8 border border-border-subtle shadow-card space-y-4">
            <h3 className="text-headline-sm font-bold text-text-primary">Arsitektur & Integritas Bisnis Terpantau</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-body-sm">
              <div className="p-4 rounded-xl bg-surface-container-low border border-border-subtle space-y-1">
                <span className="font-bold text-text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-status-success">check_circle</span>
                  Aturan Tanpa Akun Petugas FO (CST-01):
                </span>
                <p className="text-text-secondary leading-relaxed">
                  Petugas loket Front Office beroperasi secara visual menggunakan kode 6-karakter fisik tanpa memerlukan akun digital ataupun celah hak akses di backend.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-low border border-border-subtle space-y-1">
                <span className="font-bold text-text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-status-success">check_circle</span>
                  Background Cron Job Pembersih Harian (CST-04):
                </span>
                <p className="text-text-secondary leading-relaxed">
                  Penjadwal Node-cron aktif berjalan otomatis setiap pukul 00:00 WIB (Asia/Jakarta) mengubah laporan kehilangan lewat 7 hari menjadi kedaluwarsa.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Moderasi Laporan */}
      {activeTab === 'items' && (
        <div className="bg-surface-white rounded-2xl border border-border-subtle shadow-card p-6 overflow-hidden space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-headline-sm font-bold text-text-primary">Daftar Seluruh Laporan Masuk</h3>
              <p className="text-body-sm text-text-secondary">Moderasi status dan hapus konten yang melanggar ketentuan kampus</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="bg-surface-container-low border-y border-border-subtle text-text-secondary uppercase tracking-wider text-label-sm">
                <tr>
                  <th className="py-3 px-4">Tipe</th>
                  <th className="py-3 px-4">Nama Barang</th>
                  <th className="py-3 px-4">Pelapor</th>
                  <th className="py-3 px-4">Kategori / Lokasi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi Moderasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {allItems.foundItems.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-low/50">
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-green-50 text-status-success">
                        Temuan
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-text-primary">{item.title}</td>
                    <td className="py-3 px-4 text-text-secondary">
                      {item.reporter?.name} ({item.reporter?.email})
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {item.category?.name} · {item.storage_location?.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-text-primary">{item.status}</span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <select
                        value={item.status}
                        onChange={(e) => handleModerateItem('found', item.id, 'update_status', e.target.value)}
                        className="py-1 px-2 rounded-md border border-border-subtle bg-surface-white text-label-sm"
                      >
                        <option value="active">Active</option>
                        <option value="claimed">Claimed</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button
                        onClick={() => handleModerateItem('found', item.id, 'delete')}
                        className="p-1.5 rounded-md text-status-error hover:bg-error-container/40 inline-flex items-center"
                        title="Hapus"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}

                {allItems.lostReports.map((report) => (
                  <tr key={report.id} className="hover:bg-surface-container-low/50">
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-amber-50 text-status-warning">
                        Hilang
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-text-primary">{report.title}</td>
                    <td className="py-3 px-4 text-text-secondary">
                      {report.reporter?.name} ({report.reporter?.email})
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {report.category?.name} · {report.last_seen_location}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-text-primary">{report.status}</span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <select
                        value={report.status}
                        onChange={(e) => handleModerateItem('lost', report.id, 'update_status', e.target.value)}
                        className="py-1 px-2 rounded-md border border-border-subtle bg-surface-white text-label-sm"
                      >
                        <option value="active">Active</option>
                        <option value="matched">Matched</option>
                        <option value="completed">Completed</option>
                        <option value="expired">Expired</option>
                      </select>
                      <button
                        onClick={() => handleModerateItem('lost', report.id, 'delete')}
                        className="p-1.5 rounded-md text-status-error hover:bg-error-container/40 inline-flex items-center"
                        title="Hapus"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Manajemen Klaim & Resolusi */}
      {activeTab === 'claims' && (
        <div className="bg-surface-white rounded-2xl border border-border-subtle shadow-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border-subtle">
            <div>
              <h3 className="font-bold text-headline-sm text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-[22px]">verified_user</span>
                Manajemen & Resolusi Klaim Barang
              </h3>
              <p className="text-body-sm text-text-secondary">
                Kelola serah terima fisik di loket FO, selesaikan klaim tertunda, atau batalkan klaim yang tidak sah.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-primary-subtle text-primary font-semibold text-label-sm self-start sm:self-auto">
              Total {allClaims.length} Klaim
            </span>
          </div>

          {allClaims.length === 0 ? (
            <div className="py-12 text-center text-text-secondary space-y-2">
              <span className="material-symbols-outlined text-[40px] text-outline-variant">inbox</span>
              <p className="font-medium text-body-md">Belum ada pengajuan klaim barang yang tercatat.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-text-secondary font-semibold text-label-sm">
                    <th className="py-3 px-4">Barang & Lokasi FO</th>
                    <th className="py-3 px-4">Pengklaim</th>
                    <th className="py-3 px-4">Kode Klaim</th>
                    <th className="py-3 px-4">Status Klaim</th>
                    <th className="py-3 px-4">Tanggal Pengajuan</th>
                    <th className="py-3 px-4 text-right">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {allClaims.map((claim: any) => (
                    <tr key={claim.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-4 font-semibold text-text-primary">
                        <div>{claim.item_title}</div>
                        <span className="text-label-sm text-text-secondary font-normal flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {claim.storage_location_name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        <div className="font-medium text-text-primary">{claim.claimant?.name || 'Civitas'}</div>
                        <div className="text-label-sm">{claim.claimant?.email}</div>
                        {claim.claimant?.phone && <div className="text-label-sm">{claim.claimant?.phone}</div>}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-primary-container">
                        {claim.claim_code ? (
                          <span className="px-2 py-0.5 rounded bg-primary-subtle border border-primary-container/20">
                            {claim.claim_code}
                          </span>
                        ) : (
                          <span className="text-text-secondary font-normal italic">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-label-sm font-semibold inline-block ${
                            claim.status === 'handed_over'
                              ? 'bg-green-50 text-status-success'
                              : claim.status === 'code_issued'
                              ? 'bg-blue-50 text-primary-container'
                              : claim.status === 'rejected'
                              ? 'bg-red-50 text-status-error'
                              : 'bg-yellow-50 text-status-warning'
                          }`}
                        >
                          {claim.status === 'handed_over'
                            ? 'Serah Terima Selesai'
                            : claim.status === 'code_issued'
                            ? 'Kode Terbit (Menunggu FO)'
                            : claim.status === 'rejected'
                            ? 'Ditolak / Batal'
                            : 'Verifikasi'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary text-label-sm">
                        {new Date(claim.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {claim.status !== 'handed_over' && claim.status !== 'rejected' ? (
                          <>
                            <button
                              onClick={() => handleResolveClaim(claim.id, 'force_handover')}
                              className="px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium text-label-sm transition-all shadow-card inline-flex items-center gap-1"
                              title="Paksa Selesai Serah Terima"
                            >
                              <span className="material-symbols-outlined text-[16px]">task_alt</span>
                              Selesaikan FO
                            </button>
                            <button
                              onClick={() => handleResolveClaim(claim.id, 'reject')}
                              className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-label-sm transition-all shadow-card inline-flex items-center gap-1"
                              title="Tolak / Batalkan Klaim"
                            >
                              <span className="material-symbols-outlined text-[16px]">cancel</span>
                              Tolak
                            </button>
                          </>
                        ) : (
                          <span className="text-label-sm text-text-secondary italic">Status Final</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Master Kategori */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form Tambah */}
          <div className="bg-surface-white rounded-2xl border border-border-subtle shadow-card p-6 space-y-4">
            <h3 className="font-bold text-headline-sm text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-[20px]">add_circle</span>
              Tambah Kategori Baru
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-3 text-body-sm">
              <div>
                <label className="block text-label-sm font-medium text-text-secondary mb-1">Nama Kategori</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => {
                    setNewCatName(e.target.value);
                    setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                  }}
                  placeholder="Contoh: Alat Olahraga"
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-label-sm font-medium text-text-secondary mb-1">Slug URL</label>
                <input
                  type="text"
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  placeholder="alat-olahraga"
                  required
                  className="input-field"
                />
              </div>
              <button
                type="submit"
                className="w-full h-11 rounded-md bg-primary-container hover:bg-primary-hover text-on-primary font-semibold text-label-md transition-all shadow-card"
              >
                Simpan Kategori
              </button>
            </form>
          </div>

          {/* List Kategori */}
          <div className="md:col-span-2 bg-surface-white rounded-2xl border border-border-subtle shadow-card p-6 space-y-4">
            <h3 className="font-bold text-headline-sm text-text-primary">Master Kategori Terdaftar</h3>
            <div className="divide-y divide-border-subtle">
              {categories.map((cat) => (
                <div key={cat.id} className="py-3 flex items-center justify-between text-body-sm">
                  <div>
                    <span className="font-semibold text-text-primary block">{cat.name}</span>
                    <span className="text-text-secondary font-mono text-label-sm">slug: {cat.slug}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1.5 rounded-md text-status-error hover:bg-error-container/40 inline-flex items-center"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Master Lokasi FO */}
      {activeTab === 'locations' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form Tambah */}
          <div className="bg-surface-white rounded-2xl border border-border-subtle shadow-card p-6 space-y-4">
            <h3 className="font-bold text-headline-sm text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-[20px]">add_circle</span>
              Tambah Lokasi Loket FO
            </h3>
            <form onSubmit={handleCreateLocation} className="space-y-3 text-body-sm">
              <div>
                <label className="block text-label-sm font-medium text-text-secondary mb-1">Nama Loket FO</label>
                <input
                  type="text"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  placeholder="FO Gedung Farmasi"
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-label-sm font-medium text-text-secondary mb-1">Gedung / Lokasi</label>
                <input
                  type="text"
                  value={newLocBuilding}
                  onChange={(e) => setNewLocBuilding(e.target.value)}
                  placeholder="Lantai 1 Gedung B"
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-label-sm font-medium text-text-secondary mb-1">Jam Layanan</label>
                <input
                  type="text"
                  value={newLocHours}
                  onChange={(e) => setNewLocHours(e.target.value)}
                  placeholder="Senin - Jumat 08:00 - 16:00"
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-label-sm font-medium text-text-secondary mb-1">Kontak / No Telepon</label>
                <input
                  type="text"
                  value={newLocContact}
                  onChange={(e) => setNewLocContact(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  required
                  className="input-field"
                />
              </div>
              <button
                type="submit"
                className="w-full h-11 rounded-md bg-primary-container hover:bg-primary-hover text-on-primary font-semibold text-label-md transition-all shadow-card"
              >
                Simpan Lokasi FO
              </button>
            </form>
          </div>

          {/* List Lokasi FO */}
          <div className="md:col-span-2 bg-surface-white rounded-2xl border border-border-subtle shadow-card p-6 space-y-4">
            <h3 className="font-bold text-headline-sm text-text-primary">Lokasi Loket Front Office Aktif</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className={`p-4 rounded-xl border text-body-sm space-y-2 shadow-card ${
                    loc.is_active ? 'border-border-subtle bg-surface-white' : 'border-error/20 bg-error-container/20 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-primary">{loc.name}</span>
                    <button
                      onClick={() => handleToggleLocation(loc.id)}
                      className={`px-2 py-0.5 rounded-full font-semibold text-label-sm ${
                        loc.is_active ? 'bg-green-50 text-status-success' : 'bg-error-container text-on-error-container'
                      }`}
                    >
                      {loc.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </div>
                  <p className="text-text-secondary">{loc.building}</p>
                  <div className="text-label-sm text-text-secondary space-y-0.5">
                    <div>Jam: {loc.service_hours}</div>
                    <div>Kontak: {loc.contact}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
