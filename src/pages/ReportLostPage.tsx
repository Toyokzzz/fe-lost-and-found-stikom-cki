import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Category } from '../types';

export const ReportLostPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, quota, refreshMe, isProfileComplete } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(true);

  // Form State (Requirement #5)
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [lastSeenLocation, setLastSeenLocation] = useState('Area Kampus STIKOM CKI');
  const [contact, setContact] = useState(user?.phone || '');
  const [description, setDescription] = useState('');
  const [hiddenDetail, setHiddenDetail] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) {
          setCategories(res.data.data);
          if (res.data.data.length > 0) {
            setCategoryId(res.data.data[0].id);
          }
        }
      } catch (err) {
        console.error('Gagal mengambil kategori:', err);
      } finally {
        setLoadingMaster(false);
      }
    };

    fetchCategories();
  }, [user, navigate]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validasi tipe file gambar (MIME & Ekstensi) di sisi client
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
      const fileExt = file.name.split('.').pop()?.toLowerCase();

      if (!allowedTypes.includes(file.type) || !fileExt || !allowedExtensions.includes(fileExt)) {
        setErrorMessage('Format file tidak didukung! Hanya file gambar (JPEG, PNG, WebP) yang diperbolehkan.');
        e.target.value = '';
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Ukuran file foto melebihi batas maksimal 2MB!');
        e.target.value = '';
        return;
      }

      setErrorMessage(null);
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category_id', categoryId);
      formData.append('last_seen_location', lastSeenLocation);
      formData.append('contact', contact);
      formData.append('description', description);
      formData.append('hidden_detail', hiddenDetail);
      if (photo) {
        formData.append('photo', photo);
      }

      const res = await api.post('/items/lost', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setSuccessMessage('Laporan kehilangan berhasil dipublikasikan!');
        await refreshMe();
        setTimeout(() => {
          navigate(`/item/lost/${res.data.data.report.id}`);
        }, 2000);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Gagal membuat laporan kehilangan barang.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <Link
        to="/catalog"
        className="inline-flex items-center gap-1.5 text-label-md font-medium text-text-secondary hover:text-primary-container transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Kembali ke Katalog
      </Link>

      <div className="bg-surface-white rounded-2xl border border-border-subtle shadow-card p-6 sm:p-10 space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-status-warning/10 text-status-warning text-label-sm font-semibold mb-2">
            <span className="material-symbols-outlined text-[16px]">report</span>
            SRS-FR-003 · Formulir Pelaporan Kehilangan
          </div>
          <h1 className="text-2xl sm:text-headline-lg font-bold text-text-primary tracking-tight">
            Lapor Barang Hilang
          </h1>
          <p className="text-body-sm text-text-secondary mt-1 leading-relaxed">
            Buat laporan kehilangan resmi. Komunitas kampus dan petugas Front Office STIKOM CKI dapat mencocokkan jika barang Anda ditemukan.
          </p>
        </div>

        {/* Validasi Profil Wajib Lengkap (Requirement #5) */}
        {!isProfileComplete && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 text-amber-900 space-y-3 shadow-card animate-pulse">
            <div className="flex items-center gap-2 font-bold text-headline-sm text-amber-950">
              <span className="material-symbols-outlined text-status-warning text-[24px]">warning</span>
              Profil Anda Belum Lengkap!
            </div>
            <p className="text-body-sm leading-relaxed text-amber-900">
              Sesuai aturan sistem kampus STIKOM CKI, Anda wajib mengisi data profil lengkap (Nama Lengkap, NIM, Program Studi, Semester, dan Kelas) sebelum dapat mengirimkan laporan kehilangan barang.
            </p>
            <Link
              to="/profile"
              state={{ from: '/report-lost', reason: 'Lengkapi profil Anda terlebih dahulu sebelum membuat laporan kehilangan.' }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-status-warning text-white font-bold text-label-md shadow-card hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">badge</span>
              Lengkapi Profil Sekarang
            </Link>
          </div>
        )}

        {/* Quota & Expiration Info Banner (CST-03 & CST-04) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-body-sm text-amber-900 space-y-1">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-status-warning">schedule</span>
                Kuota Laporan Harian (CST-03)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-label-sm font-semibold">
                {quota ? `${quota.remainingQuota} dari 3 tersisa` : 'Maks 3 / hari'}
              </span>
            </div>
            <p className="text-amber-800 text-body-sm">
              Setiap akun dibatasi membuat maksimal 3 laporan kehilangan per hari kalender (WIB).
            </p>
          </div>

          <div className="bg-primary-subtle border border-primary-container/20 rounded-xl p-4 text-body-sm text-text-primary space-y-1">
            <div className="font-bold text-primary-darker flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary-container">event</span>
              Masa Aktif 7 Hari (CST-04)
            </div>
            <p className="text-text-secondary text-body-sm">
              Laporan aktif selama 7 hari kalender. Jika belum ditemukan, sistem otomatis mengubah status menjadi kedaluwarsa.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-error-container border border-error/20 text-on-error-container rounded-xl p-4 text-body-sm flex items-start gap-3">
            <span className="material-symbols-outlined text-status-error text-[20px] flex-shrink-0 mt-0.5">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 text-body-sm flex items-start gap-3">
            <span className="material-symbols-outlined text-status-success text-[20px] flex-shrink-0 mt-0.5">check_circle</span>
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nama Barang */}
          <div>
            <label className="block text-label-md font-medium text-text-primary mb-1.5">
              Nama Barang Hilang <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.toUpperCase())}
              placeholder="Contoh: KUNCI MOTOR VARIO DENGAN GANTUNGAN KULIT HITAM"
              required
              className="input-field uppercase"
            />
          </div>

          {/* Grid Kategori & Kontak */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md font-medium text-text-primary mb-1.5">
                Kategori Barang <span className="text-status-error">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="input-field"
              >
                <option value="">Pilih Kategori...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-label-md font-medium text-text-primary mb-1.5">
                Kontak / No WhatsApp Pelapor <span className="text-status-error">*</span>
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="0812-xxxx-xxxx"
                required
                className="input-field"
              />
            </div>
          </div>

          {/* Lokasi Terakhir Terlihat */}
          <div>
            <label className="block text-label-md font-medium text-text-primary mb-1.5">
              Lokasi Terakhir Terlihat <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              value={lastSeenLocation}
              onChange={(e) => setLastSeenLocation(e.target.value.toUpperCase())}
              placeholder="Contoh: PARKIRAN MOTOR BARAT, KANTIN REKTORAT, ATAU TOILET LANTAI 3"
              required
              className="input-field uppercase"
            />
          </div>

          {/* Deskripsi Umum */}
          <div>
            <label className="block text-label-md font-medium text-text-primary mb-1.5">
              Deskripsi Ciri Umum Barang <span className="text-status-error">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value.toUpperCase())}
              placeholder="Tuliskan ciri fisik umum barang (warna, merk, stiker yang terlihat)..."
              required
              className="w-full px-3.5 py-2.5 rounded-md bg-surface-white border border-border-subtle text-on-surface text-body-md placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-container transition-all shadow-card uppercase"
            />
          </div>

          {/* Hidden Detail */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 sm:p-5 space-y-2">
            <label className="block text-label-md font-semibold text-amber-900">
              Ciri Rahasia Barang (Hidden Detail) <span className="text-status-error">*</span>
            </label>
            <p className="text-body-sm text-amber-800 leading-relaxed">
              <strong>PENTING:</strong> Bagian ini <strong>disembunyikan dari publik</strong>. Digunakan sebagai bukti sahih ketika Anda mencocokkan barang dengan temuan pihak kampus.
            </p>
            <textarea
              rows={3}
              value={hiddenDetail}
              onChange={(e) => setHiddenDetail(e.target.value.toUpperCase())}
              placeholder="Contoh: ADA GORESAN HURUF 'T' DI BAGIAN BELAKANG GANTUNGAN KUNCI..."
              required
              className="w-full px-3.5 py-2.5 rounded-md bg-surface-white border border-amber-300 text-on-surface text-body-md placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-card uppercase"
            />
          </div>

          {/* Foto Referensi Opsional */}
          <div>
            <label className="block text-label-md font-medium text-text-primary mb-1.5">
              Foto Referensi (Opsional, Maksimal 2MB)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <label className="w-full sm:w-auto flex-1 cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-border-subtle hover:border-primary-container rounded-xl text-center bg-surface-container-low hover:bg-primary-subtle transition-all">
                <span className="material-symbols-outlined text-[32px] text-text-secondary mb-2">cloud_upload</span>
                <span className="text-label-md font-semibold text-text-primary">Pilih Foto Referensi</span>
                <span className="text-label-sm text-text-secondary mt-0.5">JPEG, PNG, WebP hingga 2MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>

              {photoPreview && (
                <div className="w-28 h-28 rounded-xl border border-border-subtle overflow-hidden flex-shrink-0 relative shadow-card">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting || !isProfileComplete || (quota !== null && quota.remainingQuota <= 0)}
              className="w-full h-12 rounded-md bg-status-warning hover:opacity-90 text-white font-semibold text-label-md shadow-card disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">report</span>
              {isSubmitting
                ? 'Menerbitkan Laporan...'
                : !isProfileComplete
                ? 'Wajib Lengkapi Profil Terlebih Dahulu'
                : 'Kirim Laporan Kehilangan'}
            </button>
            {!isProfileComplete && (
              <p className="text-center text-label-sm text-status-error font-medium">
                Tombol dinonaktifkan karena data profil mahasiswa belum lengkap.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
