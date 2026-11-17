import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Claim, FoundItem, LostReport } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { formatImageUrl } from '../utils/imageUrl';

export const MyHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'claims' | 'found' | 'lost'>('claims');

  const [claims, setClaims] = useState<Claim[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [lostReports, setLostReports] = useState<LostReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for "Barang Sudah Diterima"
  const [selectedClaimForHandover, setSelectedClaimForHandover] = useState<Claim | null>(null);
  const [isConfirmingHandover, setIsConfirmingHandover] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const [claimsRes, reportsRes] = await Promise.all([
        api.get('/claims/my'),
        api.get('/items/user/my-reports'),
      ]);

      if (claimsRes.data.success) {
        setClaims(claimsRes.data.data);
      }
      if (reportsRes.data.success) {
        setFoundItems(reportsRes.data.data.foundItems);
        setLostReports(reportsRes.data.data.lostReports);
      }
    } catch (err) {
      console.error('Gagal memuat riwayat:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchHistory();
  }, [user, navigate]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleConfirmHandover = async () => {
    if (!selectedClaimForHandover) return;
    setIsConfirmingHandover(true);

    try {
      const res = await api.post('/claims/complete', {
        claim_id: selectedClaimForHandover.id,
      });

      if (res.data.success) {
        const claimId = selectedClaimForHandover.id;
        setSelectedClaimForHandover(null);
        // Optimistic update instan agar tombol langsung menjadi "Selesai Diserahkan"
        setClaims((prev) =>
          prev.map((c) =>
            c.id === claimId
              ? { ...c, status: 'handed_over', handed_over_at: new Date().toISOString() }
              : c
          )
        );
        setFoundItems((prev) =>
          prev.map((f) => ({
            ...f,
            status: f.claims?.some((c) => c.id === claimId) ? 'completed' : f.status,
            claims: f.claims?.map((c) =>
              c.id === claimId
                ? { ...c, status: 'handed_over', handed_over_at: new Date().toISOString() }
                : c
            ),
          }))
        );
        await fetchHistory();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengonfirmasi serah terima barang.');
    } finally {
      setIsConfirmingHandover(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header Profile Summary */}
      <div className="bg-surface-white rounded-2xl p-6 sm:p-8 border border-border-subtle shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-bold text-headline-lg shadow-card">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-headline-md font-bold text-text-primary">{user?.name}</h1>
            <p className="text-body-sm text-text-secondary">{user?.email} · Civitas Akademika ({user?.role})</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/report-found"
            className="px-4 py-2 rounded-md text-label-md font-semibold bg-status-success text-white hover:opacity-90 transition-all shadow-card inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Lapor Temuan
          </Link>
          <Link
            to="/report-lost"
            className="px-4 py-2 rounded-md text-label-md font-semibold bg-status-warning text-white hover:opacity-90 transition-all shadow-card inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">report</span>
            Lapor Hilang
          </Link>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex items-center bg-surface-container-low p-1 rounded-xl max-w-lg">
        <button
          onClick={() => setActiveTab('claims')}
          className={`flex-1 py-2 px-3 rounded-lg text-label-md font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'claims'
              ? 'bg-surface-white text-primary-container shadow-card'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">key</span>
          Klaim ({claims.length})
        </button>
        <button
          onClick={() => setActiveTab('found')}
          className={`flex-1 py-2 px-3 rounded-lg text-label-md font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'found'
              ? 'bg-surface-white text-status-success shadow-card'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">inventory_2</span>
          Temuan ({foundItems.length})
        </button>
        <button
          onClick={() => setActiveTab('lost')}
          className={`flex-1 py-2 px-3 rounded-lg text-label-md font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'lost'
              ? 'bg-surface-white text-status-warning shadow-card'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">report</span>
          Kehilangan ({lostReports.length})
        </button>
      </div>

      {/* Tab 1: Klaim Saya */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          <div className="bg-primary-subtle border border-primary-container/20 rounded-xl p-4 text-body-sm text-text-primary flex items-start gap-3">
            <span className="material-symbols-outlined text-primary-container text-[20px] flex-shrink-0 mt-0.5">verified_user</span>
            <div className="space-y-1">
              <span className="font-bold text-primary-darker">Panduan Pengambilan Barang Fisik di Loket FO (SRS-FR-006 & CST-07):</span>
              <p className="leading-relaxed text-text-secondary">
                Tunjukkan <strong>Claim Code 6-Karakter</strong> kepada petugas loket Front Office terkait saat mengambil barang. Setelah barang diperiksa dan diserahkan secara fisik ke tangan Anda, tekan tombol <strong>"Barang Sudah Diterima"</strong> untuk menyelesaikan status secara resmi.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="h-44 bg-surface-container rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : claims.length > 0 ? (
            <div className="space-y-4">
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  className="bg-surface-white rounded-2xl border border-border-subtle shadow-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-card-hover transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-xl bg-surface-container-low border border-border-subtle overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {claim.found_item?.photo_url ? (
                        <img
                          src={formatImageUrl(claim.found_item.photo_url)}
                          alt={claim.found_item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="material-symbols-outlined text-[32px] text-outline-variant">sell</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-label-sm font-semibold text-primary-container bg-primary-subtle px-2.5 py-0.5 rounded-full inline-block">
                        {claim.found_item?.category?.name || 'Kategori Barang'}
                      </span>
                      <h3 className="text-headline-sm font-bold text-text-primary">
                        {claim.found_item?.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-body-sm text-text-secondary pt-1">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">corporate_fare</span>
                          Loket FO: {claim.found_item?.storage_location?.name || 'Front Office'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                          Diklaim: {formatDate(claim.claimed_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Claim Code Display & Action */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-border-subtle">
                    {/* 6-Char Claim Code Box */}
                    <div className="bg-primary-darker text-white px-5 py-3 rounded-xl text-center space-y-0.5 shadow-card border border-white/10">
                      <span className="text-[10px] font-bold text-tertiary-fixed-dim uppercase tracking-widest block">
                        CLAIM CODE
                      </span>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl font-mono font-black tracking-widest text-tertiary-fixed-dim">
                          {claim.claim_code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(claim.claim_code)}
                          className="p-1 rounded text-white/60 hover:text-white transition-colors"
                          title="Salin Kode"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {copiedCode === claim.claim_code ? 'check' : 'content_copy'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Button "Barang Sudah Diterima" (SRS-FR-006 & CST-07) */}
                    <div>
                      {claim.status === 'claimed' ? (
                        <button
                          onClick={() => setSelectedClaimForHandover(claim)}
                          className="w-full sm:w-auto px-5 py-3 rounded-md bg-status-success hover:opacity-90 text-white font-semibold text-label-md shadow-card transition-all flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          Barang Sudah Diterima
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-label-md font-semibold bg-surface-container text-text-secondary border border-border-subtle">
                          <span className="material-symbols-outlined text-[18px] text-status-success">check_circle</span>
                          Selesai Diserahkan ({formatDate(claim.handed_over_at)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-surface-white rounded-2xl border border-border-subtle text-text-secondary space-y-3 shadow-card">
              <span className="material-symbols-outlined text-[48px] text-outline mx-auto block">key</span>
              <p className="text-body-md font-medium text-text-primary">Anda belum memiliki riwayat klaim barang temuan.</p>
              <Link
                to="/catalog?type=found"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary-subtle text-primary-container font-semibold text-label-md hover:bg-primary-subtle/80 transition-colors"
              >
                Cari Barang Temuan di Katalog
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Laporan Temuan Saya */}
      {activeTab === 'found' && (
        <div className="space-y-4">
          {foundItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {foundItems.map((item) => {
                const itemClaim = item.claims && item.claims.length > 0 ? item.claims[0] : null;
                const photoSrc = item.photo_url ? formatImageUrl(item.photo_url) : '';

                return (
                  <div
                    key={item.id}
                    className="bg-surface-white rounded-2xl border border-border-subtle p-5 shadow-card space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-label-sm font-semibold text-status-success bg-green-50 px-2.5 py-0.5 rounded-full">
                          {item.category?.name}
                        </span>
                        <span
                          className={`text-label-sm font-semibold px-2.5 py-0.5 rounded-full ${
                            item.status === 'active'
                              ? 'bg-primary-subtle text-primary-container'
                              : item.status === 'claimed'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-surface-container text-text-secondary'
                          }`}
                        >
                          {item.status === 'claimed' ? 'SEDANG DIPROSES' : item.status === 'active' ? 'AKTIF' : 'SELESAI'}
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-xl bg-surface-container-low border border-border-subtle overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {photoSrc ? (
                            <img
                              src={photoSrc}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="material-symbols-outlined text-[28px] text-outline-variant">image</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-text-primary text-headline-sm truncate">{item.title}</h3>
                          <p className="text-body-sm text-text-secondary line-clamp-2">{item.description}</p>
                        </div>
                      </div>

                      {/* Display Status Info to Reporter if Item is Claimed (Tanpa tombol & tanpa kode unik) */}
                      {itemClaim && (
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">info</span>
                              STATUS KLAIM:
                            </span>
                            <span className="text-[11px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                              {itemClaim.status === 'handed_over' || item.status === 'completed' ? 'Selesai' : 'Sedang Diproses'}
                            </span>
                          </div>
                          <p className="text-[11px] text-purple-800">
                            {itemClaim.status === 'handed_over' || item.status === 'completed'
                              ? 'Barang ini telah selesai diserahterimakan dan dikonfirmasi diterima oleh pemilik sah.'
                              : 'Barang temuan ini sedang dalam proses klaim kepemilikan. Serah terima dilakukan di loket FO.'}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-body-sm text-text-secondary">
                      <span>Loket FO: {item.storage_location?.name}</span>
                      <Link
                        to={`/item/found/${item.id}`}
                        className="font-semibold text-primary-container hover:text-primary-hover inline-flex items-center gap-1"
                      >
                        Detail
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-surface-white rounded-2xl border border-border-subtle text-text-secondary space-y-3 shadow-card">
              <span className="material-symbols-outlined text-[48px] text-outline mx-auto block">inbox</span>
              <p className="text-body-md font-medium text-text-primary">Anda belum pernah membuat laporan penemuan barang.</p>
              <Link
                to="/report-found"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-status-success text-white font-semibold text-label-md hover:opacity-90 transition-all shadow-card"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                Buat Laporan Temuan Sekarang
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Laporan Kehilangan Saya */}
      {activeTab === 'lost' && (
        <div className="space-y-4">
          {lostReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lostReports.map((report) => {
                const photoSrc = report.photo_url ? formatImageUrl(report.photo_url) : '';

                return (
                  <div
                    key={report.id}
                    className="bg-surface-white rounded-2xl border border-border-subtle p-5 shadow-card space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-label-sm font-semibold text-status-warning bg-amber-50 px-2.5 py-0.5 rounded-full">
                          {report.category?.name}
                        </span>
                        <span
                          className={`text-label-sm font-semibold px-2.5 py-0.5 rounded-full ${
                            report.status === 'active'
                              ? 'bg-primary-subtle text-primary-container'
                              : report.status === 'expired'
                              ? 'bg-error-container text-on-error-container'
                              : 'bg-green-50 text-status-success'
                          }`}
                        >
                          {report.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-xl bg-surface-container-low border border-border-subtle overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {photoSrc ? (
                            <img
                              src={photoSrc}
                              alt={report.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="material-symbols-outlined text-[28px] text-outline-variant">image</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-text-primary text-headline-sm truncate">{report.title}</h3>
                          <p className="text-body-sm text-text-secondary line-clamp-2">{report.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-body-sm text-text-secondary">
                      <span>Kedaluwarsa: {formatDate(report.expires_at)}</span>
                      <Link
                        to={`/item/lost/${report.id}`}
                        className="font-semibold text-primary-container hover:text-primary-hover inline-flex items-center gap-1"
                      >
                        Detail
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-surface-white rounded-2xl border border-border-subtle text-text-secondary space-y-3 shadow-card">
              <span className="material-symbols-outlined text-[48px] text-outline mx-auto block">report</span>
              <p className="text-body-md font-medium text-text-primary">Anda belum memiliki laporan kehilangan barang.</p>
              <Link
                to="/report-lost"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-status-warning text-white font-semibold text-label-md hover:opacity-90 transition-all shadow-card"
              >
                <span className="material-symbols-outlined text-[16px]">report</span>
                Buat Laporan Kehilangan Sekarang
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog Modal (SRS-FR-006 & CST-07) */}
      <ConfirmModal
        isOpen={selectedClaimForHandover !== null}
        title="Konfirmasi Barang Sudah Diterima"
        message={`Apakah Anda mengonfirmasi bahwa barang fisik "${selectedClaimForHandover?.found_item?.title}" sudah Anda terima langsung dari petugas loket Front Office?`}
        confirmLabel="Ya, Barang Sudah Saya Terima"
        isConfirming={isConfirmingHandover}
        onConfirm={handleConfirmHandover}
        onCancel={() => setSelectedClaimForHandover(null)}
      />
    </div>
  );
};
