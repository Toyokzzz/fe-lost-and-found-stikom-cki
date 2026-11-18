import React, { useState } from 'react';
import { api } from '../services/api';
import { FoundItem } from '../types';

interface ClaimModalProps {
  item: FoundItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({ item, isOpen, onClose, onSuccess }) => {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [successData, setSuccessData] = useState<{ claimCode: string; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || answer.trim().length > 20 || isLocked) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await api.post('/claims/verify', {
        found_item_id: item.id,
        answer: answer.trim(),
      });

      if (res.data.success) {
        setIsLocked(false);
        setSuccessData({
          claimCode: res.data.data.claim.claim_code,
          message: res.data.message,
        });
        onSuccess();
      }
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Verifikasi gagal. Pastikan deskripsi ciri rahasia Anda benar.';
      setErrorMessage(msg);
      if (status === 429) {
        setIsLocked(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (successData?.claimCode) {
      navigator.clipboard.writeText(successData.claimCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-darker/60 backdrop-blur-sm">
      <div className="bg-surface-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-floating border border-border-subtle relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {!successData ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary-subtle text-primary-container flex items-center justify-center shadow-card">
                <span className="material-symbols-outlined text-[26px]">key</span>
              </div>
              <div>
                <h3 className="text-headline-md font-bold text-text-primary">Verifikasi Kepemilikan</h3>
                <p className="text-body-sm text-text-secondary">Klaim: {item.title}</p>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-body-sm text-purple-900 mb-5 leading-relaxed space-y-2">
              <p className="font-bold text-purple-950 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-purple-700">quiz</span>
                Pertanyaan Verifikasi dari Penemu Barang (Requirement #6):
              </p>
              <p className="p-3 bg-surface-white rounded-lg border border-purple-300 font-semibold text-text-primary text-body-md">
                "{item.validation_question || 'Sebutkan ciri khusus atau isi rahasia dari barang ini!'}"
              </p>
              <p className="text-label-sm text-purple-850">
                Jawab pertanyaan verifikasi di atas dengan benar (1 sampai 20 karakter). Anda diberi <strong>3 kali kesempatan</strong>. Jika salah sebanyak 3 kali, sistem akan memberikan waktu jeda selama <strong>60 menit</strong>.
              </p>
            </div>

            {errorMessage && (
              <div className="bg-error-container border border-error/20 text-on-error-container rounded-xl p-3 text-body-sm flex items-start gap-2.5 mb-4">
                <span className="material-symbols-outlined text-status-error text-[18px] flex-shrink-0 mt-0.5">
                  {isLocked ? 'timer' : 'error'}
                </span>
                <div>
                  {isLocked && <span className="font-bold block">Waktu Jeda Aktif (3x Kesempatan Habis)</span>}
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-label-md font-medium text-text-primary">
                    Jawaban Anda <span className="text-status-error">*</span>
                  </label>
                  <span className={`text-label-sm font-mono ${answer.length >= 20 ? 'text-status-error font-bold' : 'text-text-secondary'}`}>
                    {answer.length}/20 karakter
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={20}
                  value={answer}
                  disabled={isLocked}
                  onChange={(e) => setAnswer(e.target.value.toUpperCase().slice(0, 20))}
                  placeholder="Ketik 1 s/d 20 karakter (huruf/angka)..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-md bg-surface-white border border-border-subtle text-on-surface text-body-md placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-container transition-all shadow-card uppercase font-semibold disabled:bg-surface-container disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-md text-label-md font-medium text-text-secondary hover:bg-surface-container transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || answer.trim().length < 1 || isLocked}
                  className="px-6 py-2.5 rounded-md text-label-md font-semibold text-on-primary bg-primary-container hover:bg-primary-hover disabled:opacity-50 shadow-card transition-all flex items-center gap-2"
                >
                  {isSubmitting ? 'Memverifikasi...' : isLocked ? 'Terkunci (Jeda 60 Menit)' : 'Verifikasi & Terbitkan Kode'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-2 space-y-5">
            <div className="w-16 h-16 rounded-full bg-green-50 text-status-success flex items-center justify-center mx-auto shadow-card">
              <span className="material-symbols-outlined text-[36px]">verified</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-headline-lg font-bold text-text-primary">Verifikasi Berhasil!</h3>
              <p className="text-body-sm text-text-secondary max-w-sm mx-auto">
                {successData.message}
              </p>
            </div>

            {/* Display Claim Code */}
            <div className="bg-primary-darker text-white p-5 rounded-2xl shadow-floating space-y-2 border border-white/10">
              <span className="text-label-sm font-bold text-tertiary-fixed-dim uppercase tracking-widest block">
                CLAIM CODE RESMI (6 KARAKTER)
              </span>
              <div className="flex items-center justify-center gap-4">
                <span className="text-4xl font-mono font-black tracking-widest text-tertiary-fixed-dim">
                  {successData.claimCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
                  title="Salin Kode"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>
              <p className="text-label-sm text-white/70">
                Tunjukkan kode ini kepada petugas loket Front Office saat mengambil barang.
              </p>
            </div>

            {/* Storage Location Instructions */}
            {item.storage_location && (
              <div className="bg-surface-container-low border border-border-subtle rounded-xl p-4 text-left text-body-sm space-y-2 text-text-secondary">
                <p className="font-bold text-text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-primary-container">corporate_fare</span>
                  Lokasi Pengambilan Barang:
                </p>
                <p className="font-semibold text-text-primary">{item.storage_location.name}</p>
                <div className="flex items-center gap-4 text-text-secondary pt-1">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    {item.storage_location.service_hours}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">phone</span>
                    {item.storage_location.contact}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full h-11 rounded-md text-label-md font-semibold text-on-primary bg-primary-container hover:bg-primary-hover shadow-card transition-all"
            >
              Tutup & Lihat Riwayat Klaim
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
