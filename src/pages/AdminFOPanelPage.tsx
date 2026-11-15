import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AdminFOPanelPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCode, setSearchCode] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchFOData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchCode.trim()) params.search = searchCode.trim();
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/admin/fo/dashboard', { params });
      if (res.data.success) {
        setItems(res.data.data);
      }
    } catch (err: any) {
      console.error('Gagal memuat data panel FO:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFOData();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFOData();
  };

  const handleVerifyHandover = async (claimId: string, claimCode: string) => {
    if (!confirm(`Konfirmasi penyerahan fisik barang dengan Claim Code "${claimCode}" kepada pemilik di loket FO?`)) {
      return;
    }

    setActionLoading(claimId);
    setNotification(null);
    try {
      const res = await api.post('/admin/fo/verify-handover', { claim_id: claimId });
      if (res.data.success) {
        setNotification({
          type: 'success',
          message: res.data.message || `Barang berhasil diserahterimakan dengan Claim Code ${claimCode}!`,
        });
        await fetchFOData();
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Gagal memproses serah terima barang di FO.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* FO Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-primary text-white rounded-2xl p-6 sm:p-8 shadow-floating flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-card">
            <span className="material-symbols-outlined text-[32px] text-tertiary-fixed-dim">verified_user</span>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 text-tertiary-fixed-dim text-label-eyebrow font-bold uppercase tracking-wider mb-1">
              Petugas Front Office (FO) Kampus
            </div>
            <h1 className="text-2xl sm:text-headline-lg font-bold tracking-tight">
              Panel Verifikasi Loket Front Office
            </h1>
            <p className="text-body-sm text-white/80 max-w-xl">
              Pencocokan Claim Code 6-karakter, validasi jawaban pertanyaan penemu, dan pencatatan serah terima fisik barang.
            </p>
          </div>
        </div>

        <button
          onClick={fetchFOData}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-label-md flex items-center gap-2 border border-white/20 transition-all shadow-card"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Refresh Loket
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 shadow-card animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-900'
              : 'bg-error-container border-error/20 text-on-error-container'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] flex-shrink-0 mt-0.5">
            {notification.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <div className="flex-1 font-medium text-body-sm">{notification.message}</div>
          <button onClick={() => setNotification(null)} className="text-sm opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Quick Claim Code Search Bar */}
      <div className="bg-surface-white rounded-2xl border border-border-subtle p-5 sm:p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-3.5 top-3 text-[20px] text-text-secondary">
              search
            </span>
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Cari Claim Code (6-karakter), nama pemilik, atau nama barang..."
              className="input-field pl-11 pr-28 uppercase font-mono"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-4 py-1.5 rounded-lg bg-primary-container text-on-primary font-semibold text-label-sm hover:bg-primary-hover shadow-card transition-all"
            >
              Cari Kode
            </button>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field sm:w-56"
          >
            <option value="">Semua Status Barang</option>
            <option value="claimed">Klaim Terbit (Menunggu Pengambilan)</option>
            <option value="completed">Selesai / Sudah Diserahkan</option>
            <option value="active">Belum Ada Klaim (Aktif)</option>
          </select>
        </div>
      </div>

      {/* List of Found Items & Claim Tickets */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 bg-surface-container rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-surface-white rounded-2xl border border-border-subtle p-12 text-center text-text-secondary space-y-3 shadow-card">
            <span className="material-symbols-outlined text-[48px] text-outline mx-auto block">inbox</span>
            <h3 className="text-headline-sm font-semibold text-text-primary">Tidak Ada Data Barang di Loket</h3>
            <p className="text-body-sm max-w-sm mx-auto">
              Tidak ada barang temuan atau tiket klaim yang sesuai dengan pencarian Anda saat ini.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-surface-white rounded-2xl border border-border-subtle shadow-card overflow-hidden hover:shadow-card-hover transition-all"
              >
                {/* Item Card Header */}
                <div className="bg-surface-container-low px-6 py-4 border-b border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-label-sm font-semibold bg-green-50 text-status-success border border-green-200">
                      Barang Temuan
                    </span>
                    <span className="font-semibold text-text-secondary text-label-sm">
                      Kategori: {item.category?.name || 'Umum'}
                    </span>
                    <span className="text-text-secondary text-label-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">corporate_fare</span>
                      {item.storage_location?.name || 'Loket FO'}
                    </span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-label-sm font-bold ${
                      item.status === 'completed'
                        ? 'bg-surface-container text-text-secondary border border-border-subtle'
                        : item.status === 'claimed'
                        ? 'bg-purple-50 text-purple-800 border border-purple-200 animate-pulse'
                        : 'bg-primary-subtle text-primary border border-primary/20'
                    }`}
                  >
                    {item.status === 'completed'
                      ? 'Selesai Diserahkan di Loket'
                      : item.status === 'claimed'
                      ? 'Dalam Proses Serah Terima Loket'
                      : 'Tersedia di Loket FO'}
                  </span>
                </div>

                {/* Item Details Grid */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Column 1: Info Barang & Foto */}
                  <div className="space-y-3">
                    <div className="flex gap-4">
                      {item.photo_url ? (
                        <img
                          src={item.photo_url}
                          alt={item.title}
                          className="w-24 h-24 rounded-xl object-cover border border-border-subtle shadow-card flex-shrink-0"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-surface-container-low flex items-center justify-center text-text-secondary border border-border-subtle flex-shrink-0">
                          <span className="material-symbols-outlined text-[28px]">image</span>
                        </div>
                      )}
                      <div className="space-y-1">
                        <h3 className="font-bold text-headline-sm text-text-primary leading-tight">
                          {item.title}
                        </h3>
                        <p className="text-body-sm text-text-secondary line-clamp-2">{item.description}</p>
                        <span className="text-[11px] text-text-secondary block">
                          Ditemukan: {item.location_found}
                        </span>
                      </div>
                    </div>

                    {/* Pelapor Profile Info (Requirement #3) */}
                    <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle text-body-sm space-y-1">
                      <span className="text-label-eyebrow uppercase text-text-secondary font-bold block">
                        Pelapor Penemu:
                      </span>
                      <div className="font-bold text-text-primary">{item.reporter?.name || 'Mahasiswa'}</div>
                      <div className="text-label-sm text-text-secondary">
                        {item.reporter?.prodi ? `${item.reporter.prodi} · ` : ''}
                        {item.reporter?.semester ? `Semester ${item.reporter.semester} · ` : ''}
                        {item.reporter?.kelas ? `Kelas ${item.reporter.kelas}` : ''}
                      </div>
                      {item.reporter?.nim && (
                        <div className="text-label-sm text-text-secondary font-mono">
                          NIM: {item.reporter.nim}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Verifikasi & Kunci Jawaban Penemu (Requirement #7) */}
                  <div className="space-y-3 bg-amber-50/50 p-4 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900 text-label-md">
                      <span className="material-symbols-outlined text-[18px] text-amber-700">lock</span>
                      Instrumen Validasi Penemu
                    </div>

                    <div>
                      <span className="text-label-sm font-semibold text-amber-900 block">
                        Pertanyaan Validasi dari Penemu:
                      </span>
                      <p className="text-body-sm text-amber-950 font-medium bg-surface-white p-2.5 rounded-lg border border-amber-200 mt-1">
                        "{item.validation_question || 'Sebutkan ciri khusus atau isi barang ini'}"
                      </p>
                    </div>

                    <div>
                      <span className="text-label-sm font-semibold text-amber-900 block">
                        Kunci Jawaban Penemu (Hidden Detail):
                      </span>
                      <p className="text-body-sm text-amber-950 italic bg-amber-100/70 p-2.5 rounded-lg border border-amber-300 mt-1">
                        {item.hidden_detail || '-'}
                      </p>
                    </div>
                  </div>

                  {/* Column 3: Data Klaim & Validasi Serah Terima FO */}
                  <div className="space-y-3 flex flex-col justify-between">
                    {item.claims && item.claims.length > 0 ? (
                      <div className="space-y-3">
                        {item.claims.map((claim: any) => (
                          <div
                            key={claim.id}
                            className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-label-eyebrow uppercase font-bold text-purple-900">
                                Claim Code Resmi:
                              </span>
                              <span className="px-3 py-1 rounded-lg bg-primary-darker text-tertiary-fixed-dim font-mono font-black text-headline-sm tracking-widest shadow-card">
                                {claim.claim_code}
                              </span>
                            </div>

                            <div className="text-body-sm">
                              <span className="text-label-sm font-semibold text-text-secondary block">
                                Pemilik / Pengklaim:
                              </span>
                              <div className="font-bold text-text-primary">
                                {claim.claimant?.name || 'Mahasiswa Pengklaim'}
                              </div>
                              <div className="text-label-sm text-text-secondary">
                                {claim.claimant?.prodi ? `${claim.claimant.prodi} · ` : ''}
                                {claim.claimant?.semester ? `Sem ${claim.claimant.semester} · ` : ''}
                                {claim.claimant?.kelas ? `Kelas ${claim.claimant.kelas}` : ''}
                              </div>
                              {claim.claimant?.nim && (
                                <div className="text-label-sm text-text-secondary font-mono">
                                  NIM: {claim.claimant.nim}
                                </div>
                              )}
                              {claim.claimant?.phone && (
                                <div className="text-label-sm text-text-secondary">
                                  WhatsApp: {claim.claimant.phone}
                                </div>
                              )}
                            </div>

                            {/* Jawaban Pengklaim */}
                            {claim.claimed_answer && (
                              <div className="text-label-sm bg-surface-white p-2 rounded-lg border border-border-subtle">
                                <span className="font-semibold text-text-secondary block">
                                  Jawaban Pengklaim Saat Verifikasi:
                                </span>
                                <span className="text-text-primary italic">"{claim.claimed_answer}"</span>
                              </div>
                            )}

                            {/* Tombol Aksi Serah Terima FO */}
                            {claim.status !== 'handed_over' ? (
                              <button
                                onClick={() => handleVerifyHandover(claim.id, claim.claim_code)}
                                disabled={actionLoading === claim.id}
                                className="w-full h-11 rounded-xl bg-status-success hover:opacity-90 text-white font-bold text-label-md transition-all shadow-card flex items-center justify-center gap-2"
                              >
                                <span className="material-symbols-outlined text-[18px]">verified</span>
                                {actionLoading === claim.id ? 'Memproses Serah Terima...' : 'Cocokkan & Serah Terima'}
                              </button>
                            ) : (
                              <div className="p-2.5 rounded-lg bg-green-50 border border-green-200 text-green-900 font-semibold text-label-sm text-center flex items-center justify-center gap-1.5">
                                <span className="material-symbols-outlined text-[18px] text-status-success">
                                  task_alt
                                </span>
                                Telah Diserahkan Fisik di Loket FO
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border-subtle rounded-xl text-text-secondary space-y-1">
                        <span className="material-symbols-outlined text-[32px] text-outline-variant">hourglass_empty</span>
                        <span className="font-semibold text-label-md">Belum Ada Pengajuan Klaim</span>
                        <p className="text-[12px]">Barang masih tersimpan aman di loket Front Office.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFOPanelPage;
