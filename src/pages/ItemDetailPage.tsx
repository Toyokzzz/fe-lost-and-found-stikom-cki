import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FoundItem, LostReport } from '../types';
import { ClaimModal } from '../components/ClaimModal';
import { formatImageUrl } from '../utils/imageUrl';

export const ItemDetailPage: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState<FoundItem | LostReport | null>(null);
  const [myClaim, setMyClaim] = useState<any>(null);
  const [reporterClaims, setReporterClaims] = useState<any[]>([]);
  const [copiedReporterCode, setCopiedReporterCode] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/items/${type}/${id}`);
      if (res.data.success) {
        setItem(res.data.data);
      }

      if (user && type === 'found') {
        // Cek jika pengguna saat ini adalah pemilik/pengklaim
        try {
          const claimsRes = await api.get('/claims/my');
          if (claimsRes.data.success) {
            const foundClaim = claimsRes.data.data.find((c: any) => c.found_item_id === id);
            if (foundClaim) setMyClaim(foundClaim);
          }
        } catch {
          // ignore
        }

        // Cek jika pengguna saat ini adalah pelapor barang temuan
        try {
          const reportsRes = await api.get('/items/user/my-reports');
          if (reportsRes.data.success) {
            const myReport = reportsRes.data.data?.foundItems?.find((f: any) => f.id === id);
            if (myReport?.claims && myReport.claims.length > 0) {
              setReporterClaims(myReport.claims);
            }
          }
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat detail barang.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [type, id, user]);

  const handleCompleteHandover = async () => {
    if (!myClaim) return;
    if (!confirm('Konfirmasi bahwa barang fisik ini telah Anda terima secara langsung di loket Front Office?')) {
      return;
    }

    setCompleting(true);
    try {
      const res = await api.post('/claims/complete', { claim_id: myClaim.id });
      if (res.data.success) {
        alert('Terima kasih! Status barang berhasil diubah menjadi selesai/diserahkan.');
        await fetchDetail();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyelesaikan serah terima.');
    } finally {
      setCompleting(false);
    }
  };

  const isFound = type === 'found';
  const foundItem = isFound ? (item as FoundItem) : null;
  const lostReport = !isFound ? (item as LostReport) : null;

  const isReporter = Boolean(
    user &&
      item &&
      (('reporter_id' in item && item.reporter_id === user.id) ||
        (item.reporter && item.reporter.id === user.id))
  );

  const allClaims = reporterClaims.length > 0 ? reporterClaims : (foundItem?.claims || []);
  const activeReporterClaim = isReporter && allClaims.length > 0 ? allClaims[0] : null;

  const photoUrl = 'photo_url' in (item || {}) && (item as any)?.photo_url
    ? formatImageUrl((item as any).photo_url)
    : '';

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'full',
        timeStyle: 'short',
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  const handleClaimClick = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setIsClaimModalOpen(true);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6">
        <div className="h-8 w-40 bg-surface-container rounded-lg animate-pulse" />
        <div className="h-96 bg-surface-container rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <span className="material-symbols-outlined text-[64px] text-status-error mx-auto block">error</span>
        <h2 className="text-headline-md font-bold text-text-primary">Barang Tidak Ditemukan</h2>
        <p className="text-body-sm text-text-secondary">{error || 'Data barang ini tidak tersedia atau sudah dihapus.'}</p>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary-container text-on-primary font-semibold text-label-md shadow-card hover:bg-primary-hover transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Back Button */}
      <Link
        to="/catalog"
        className="inline-flex items-center gap-1.5 text-label-md font-medium text-text-secondary hover:text-primary-container transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Kembali ke Katalog Barang
      </Link>

      <div className="bg-surface-white rounded-2xl border border-border-subtle shadow-card overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Column: Photo */}
        <div className="bg-surface-container-low flex items-center justify-center min-h-[350px] relative p-6">
          {photoUrl && !imageError ? (
            <img
              src={photoUrl}
              alt={item.title}
              className="max-h-[420px] w-full object-contain rounded-xl shadow-card"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="text-center text-text-secondary space-y-2">
              <span className="material-symbols-outlined text-[64px] text-outline-variant block">image</span>
              <p className="text-label-sm font-medium">Foto referensi tidak disertakan</p>
            </div>
          )}

          {/* Badges on top */}
          <div className="absolute top-6 left-6 flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-label-sm font-semibold shadow-card ${
                isFound ? 'bg-status-success text-white' : 'bg-status-warning text-white'
              }`}
            >
              {isFound ? 'Barang Temuan' : 'Barang Hilang'}
            </span>
          </div>
        </div>

        {/* Right Column: Details & Actions */}
        <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Status pill & Category */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-label-sm font-semibold text-primary-container bg-primary-subtle px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-[16px]">sell</span>
                {item.category?.name || 'Kategori Umum'}
              </span>

              {item.status === 'active' && (
                <span className="px-3 py-1 rounded-full text-label-sm font-medium bg-primary-subtle text-primary-container border border-primary-container/20">
                  Tersedia / Aktif
                </span>
              )}
              {item.status === 'claimed' && (
                <span className="px-3 py-1 rounded-full text-label-sm font-medium bg-purple-50 text-purple-700 border border-purple-200">
                  Dalam Proses Klaim
                </span>
              )}
              {item.status === 'completed' && (
                <span className="px-3 py-1 rounded-full text-label-sm font-medium bg-surface-container text-text-secondary border border-border-subtle">
                  Selesai Diserahkan
                </span>
              )}
              {item.status === 'expired' && (
                <span className="px-3 py-1 rounded-full text-label-sm font-medium bg-error-container text-on-error-container border border-error/20">
                  Kedaluwarsa
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-headline-lg font-bold text-text-primary leading-tight">
              {item.title}
            </h1>

            {/* Date reported */}
            <div className="flex items-center gap-2 text-label-sm text-text-secondary">
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
              <span>Dilaporkan pada {formatDate(item.created_at)}</span>
            </div>

            {/* Description */}
            <div className="space-y-1 pt-2">
              <h4 className="text-label-sm font-semibold uppercase tracking-wider text-text-secondary">Deskripsi Barang</h4>
              <p className="text-body-md text-on-surface leading-relaxed whitespace-pre-line">
                {item.description}
              </p>
            </div>

            {/* Location Found / Last Seen */}
            <div className="space-y-1">
              <h4 className="text-label-sm font-semibold uppercase tracking-wider text-text-secondary">
                {isFound ? 'Lokasi Penemuan' : 'Lokasi Terakhir Terlihat'}
              </h4>
              <p className="text-body-md font-semibold text-text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-primary-container">location_on</span>
                {isFound ? (item as any).location_found : (item as any).last_seen_location}
              </p>
            </div>

            {/* Informasi Pelapor dari Data Profil (Requirement #3) */}
            {item.reporter && (
              <div className="bg-surface-container-low border border-border-subtle rounded-xl p-4 space-y-1">
                <span className="text-label-eyebrow uppercase text-text-secondary font-bold block">
                  Informasi Pelapor ({isFound ? 'Penemu' : 'Pemilik'}):
                </span>
                <div className="font-bold text-headline-sm text-text-primary">
                  {item.reporter.name}
                </div>
                <div className="text-label-sm text-text-secondary">
                  {[
                    item.reporter.prodi,
                    item.reporter.semester ? `Semester ${item.reporter.semester}` : null,
                    item.reporter.kelas ? `Kelas ${item.reporter.kelas}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
                {item.reporter.nim && (
                  <div className="text-label-sm text-text-secondary font-mono">
                    NIM: {item.reporter.nim}
                  </div>
                )}
              </div>
            )}

            {/* Pertanyaan Validasi Penemu (Requirement #4 & #6) */}
            {isFound && foundItem?.validation_question && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-body-sm space-y-1">
                <span className="font-bold text-purple-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-purple-700">quiz</span>
                  Pertanyaan Verifikasi dari Penemu:
                </span>
                <p className="text-purple-950 font-semibold italic">"{foundItem.validation_question}"</p>
                <p className="text-label-sm text-purple-800">
                  Calon pemilik sah harus menjawab pertanyaan ini dengan benar saat mengajukan klaim.
                </p>
              </div>
            )}

            {/* Reporter only: Hidden Detail indicator */}
            {'hidden_detail' in item && item.hidden_detail && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-body-sm space-y-1">
                <span className="font-semibold text-amber-900 block flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-amber-700">lock</span>
                  Kunci Jawaban Validasi Anda (Hanya Terlihat Oleh Anda & Admin):
                </span>
                <p className="text-amber-800 italic">{item.hidden_detail}</p>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-border-subtle space-y-4">
            {isFound && foundItem && (
              <div>
                {/* Jika Pengguna ini memiliki tiket klaim aktif untuk barang ini (Pemilik/Pengklaim) */}
                {myClaim ? (
                  <div className="bg-primary-darker text-white p-5 rounded-2xl border border-white/10 shadow-floating space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-label-sm font-bold text-tertiary-fixed-dim uppercase tracking-wider">
                        TIKET KLAIM ANDA
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-label-sm font-bold bg-white/10 text-tertiary-fixed-dim">
                        {myClaim.status === 'handed_over' ? 'Selesai Diserahkan' : 'Menunggu Serah Terima FO'}
                      </span>
                    </div>

                    <div className="text-center py-2 bg-white/5 rounded-xl border border-white/10 space-y-1">
                      <span className="text-label-eyebrow uppercase text-white/70 block">CLAIM CODE UNIK 6-KARAKTER</span>
                      <div className="text-3xl font-mono font-black text-tertiary-fixed-dim tracking-widest">
                        {myClaim.claim_code}
                      </div>
                      <p className="text-label-sm text-white/70 px-4">
                        Tunjukkan kode ini ke petugas di loket Front Office ({foundItem.storage_location?.name || 'FO Kampus'})
                      </p>
                    </div>

                    {myClaim.status !== 'handed_over' ? (
                      <button
                        onClick={handleCompleteHandover}
                        disabled={completing}
                        className="w-full h-12 rounded-xl bg-status-success hover:opacity-90 text-white font-bold text-label-md transition-all shadow-card flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[20px]">task_alt</span>
                        {completing ? 'Mengonfirmasi Penerimaan...' : 'Barang Sudah Diterima'}
                      </button>
                    ) : (
                      <div className="p-3 bg-white/10 rounded-xl text-center text-label-sm font-semibold text-tertiary-fixed-dim flex items-center justify-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                        Status: Barang Sudah Diterima Secara Fisik
                      </div>
                    )}
                  </div>
                ) : activeReporterClaim ? (
                  /* Tampilan Khusus Pelapor Barang Temuan Saat Barang Diklaim */
                  <div className="bg-purple-950 text-white p-6 rounded-2xl border border-purple-400/40 shadow-floating space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[22px] text-amber-300">verified_user</span>
                        <span className="text-label-sm font-bold text-amber-300 uppercase tracking-wider">
                          KODE UNIK SERAH TERIMA (PELAPOR &amp; FO)
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-label-sm font-bold bg-white/10 text-amber-300">
                        {activeReporterClaim.status === 'handed_over' || foundItem.status === 'completed'
                          ? 'Selesai Diserahkan'
                          : 'Siap Dicocokkan di Loket FO'}
                      </span>
                    </div>

                    <p className="text-body-sm text-purple-200">
                      Laporan barang temuan Anda telah diklaim dan verifikasinya cocok. Gunakan kode unik 6-karakter berikut untuk dicocokkan bersama petugas loket Front Office saat penerima/pemilik mengambil barang fisik.
                    </p>

                    <div className="text-center py-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                      <span className="text-[11px] font-bold text-purple-200 uppercase tracking-widest block">
                        CLAIM CODE RESMI (6-KARAKTER)
                      </span>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-3xl font-mono font-black text-amber-300 tracking-widest">
                          {activeReporterClaim.claim_code}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(activeReporterClaim.claim_code);
                            setCopiedReporterCode(true);
                            setTimeout(() => setCopiedReporterCode(false), 2000);
                          }}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                          title="Salin Kode"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {copiedReporterCode ? 'check' : 'content_copy'}
                          </span>
                        </button>
                      </div>
                      <p className="text-[11px] text-purple-200 pt-1">
                        Kode unik ini sama persis dengan yang tampil pada loket Front Office ({foundItem.storage_location?.name || 'FO Kampus'})
                      </p>
                    </div>

                    {/* Info Pengklaim jika tersedia */}
                    {activeReporterClaim.claimant && (
                      <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-body-sm space-y-1">
                        <span className="text-label-sm font-semibold text-purple-200 block">
                          Identitas Pemilik / Pengklaim:
                        </span>
                        <div className="font-bold text-white">
                          {activeReporterClaim.claimant.name}
                          {activeReporterClaim.claimant.nim ? ` (${activeReporterClaim.claimant.nim})` : ''}
                        </div>
                        {activeReporterClaim.claimed_answer && (
                          <div className="pt-1 text-label-sm text-purple-100">
                            Jawaban Verifikasi Pemilik: <span className="italic font-medium text-amber-200">"{activeReporterClaim.claimed_answer}"</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : foundItem.status === 'active' ? (
                  <button
                    onClick={handleClaimClick}
                    className="w-full h-12 rounded-md bg-primary-container hover:bg-primary-hover text-on-primary font-semibold text-label-md shadow-card transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">key</span>
                    Ajukan Klaim Kepemilikan Barang Ini
                  </button>
                ) : (
                  <div className="p-3 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-body-sm text-center font-medium">
                    Barang ini sedang dalam proses klaim kepemilikan atau sudah diserahterimakan.
                  </div>
                )}
              </div>
            )}

            {!isFound && lostReport && (
              <div className="space-y-3">
                <div className="bg-surface-container-low border border-border-subtle rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-label-sm font-semibold text-text-secondary block uppercase">Kontak Pelapor</span>
                    <span className="text-body-md font-bold text-text-primary">{lostReport.contact}</span>
                  </div>
                  <a
                    href={`https://wa.me/${lostReport.contact.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-md bg-status-success hover:opacity-90 text-white font-semibold text-label-md flex items-center gap-1.5 shadow-card"
                  >
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                    Hubungi via WhatsApp
                  </a>
                </div>

                <div className="text-label-sm text-text-secondary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-status-warning">schedule</span>
                  Laporan aktif selama 7 hari kalender (hingga {formatDate(lostReport.expires_at)}).
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Storage Location Card (Khusus Barang Temuan - CST-01 & CST-02) */}
      {isFound && foundItem?.storage_location && (
        <div className="bg-surface-white rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-subtle text-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">corporate_fare</span>
            </div>
            <div>
              <h3 className="text-headline-sm font-bold text-text-primary">
                Lokasi Penitipan Barang Fisik: {foundItem.storage_location.name}
              </h3>
              <p className="text-body-sm text-text-secondary">
                Barang temuan wajib diamankan secara fisik di loket Front Office ini.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-body-sm">
            <div className="p-4 rounded-xl bg-surface-container-low border border-border-subtle">
              <span className="text-text-secondary font-semibold block mb-1 text-label-sm">Gedung / Lokasi</span>
              <span className="font-semibold text-text-primary">{foundItem.storage_location.building}</span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-border-subtle">
              <span className="text-text-secondary font-semibold block mb-1 text-label-sm">Jam Operasional Layanan</span>
              <span className="font-semibold text-text-primary">{foundItem.storage_location.service_hours}</span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-border-subtle">
              <span className="text-text-secondary font-semibold block mb-1 text-label-sm">Kontak Petugas Loket</span>
              <span className="font-semibold text-text-primary">{foundItem.storage_location.contact}</span>
            </div>
          </div>
        </div>
      )}

      {/* Claim Modal Component */}
      {foundItem && (
        <ClaimModal
          item={foundItem}
          isOpen={isClaimModalOpen}
          onClose={() => setIsClaimModalOpen(false)}
          onSuccess={() => {
            fetchDetail();
          }}
        />
      )}
    </div>
  );
};
