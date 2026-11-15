import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Category, StorageLocation } from '../types';

export const ReportFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isProfileComplete } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(true);

  // Form State (Requirement #4)
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [storageLocationId, setStorageLocationId] = useState('');
  const [locationFound, setLocationFound] = useState('Area Kampus STIKOM CKI');
  const [description, setDescription] = useState('');
  const [validationQuestion, setValidationQuestion] = useState('');
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

    const fetchMaster = async () => {
      try {
        const [catRes, locRes] = await Promise.all([
          api.get('/categories'),
          api.get('/locations'),
        ]);
        if (catRes.data.success) setCategories(catRes.data.data);
        if (locRes.data.success) {
          setLocations(locRes.data.data);
          if (locRes.data.data.length > 0) {
            setStorageLocationId(locRes.data.data[0].id);
          }
        }
      } catch (err) {
        console.error('Gagal mengambil master data form temuan:', err);
      } finally {
        setLoadingMaster(false);
      }
    };

    fetchMaster();
  }, [user, navigate]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Ukuran file foto melebihi batas maksimal 2MB!');
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

    if (!photo) {
      setErrorMessage('Foto fisik barang wajib diunggah (maksimal 2MB)!');
      return;
    }

    if (!storageLocationId) {
      setErrorMessage('Lokasi loket Front Office tempat penitipan barang wajib dipilih!');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category_id', categoryId);
      formData.append('storage_location_id', storageLocationId);
      formData.append('location_found', locationFound);
      formData.append('description', description);
      formData.append('validation_question', validationQuestion);
      formData.append('hidden_detail', hiddenDetail);
      formData.append('photo', photo);

      const res = await api.post('/items/found', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setSuccessMessage(
          'Laporan barang temuan berhasil dibuat! Harap segera serahkan barang fisik ke loket Front Office yang Anda pilih.'
        );
        setTimeout(() => {
          navigate(`/item/found/${res.data.data.id}`);
        }, 2000);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Gagal membuat laporan barang temuan. Periksa kembali form Anda.'
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-status-success/10 text-status-success text-label-sm font-semibold mb-2">
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            SRS-FR-002 · Formulir Pelaporan Penemuan
          </div>
          <h1 className="text-2xl sm:text-headline-lg font-bold text-text-primary tracking-tight">
            Lapor Barang Temuan
          </h1>
          <p className="text-body-sm text-text-secondary mt-1 leading-relaxed">
            Bantu kembalikan barang kepada pemilik sahnya. Pastikan Anda menitipkan barang temuan ini ke loket Front Office resmi kampus STIKOM CKI.
          </p>
        </div>

        {/* Validasi Profil Wajib Lengkap (Requirement #4) */}
        {!isProfileComplete && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 text-amber-900 space-y-3 shadow-card animate-pulse">
            <div className="flex items-center gap-2 font-bold text-headline-sm text-amber-950">
              <span className="material-symbols-outlined text-status-warning text-[24px]">warning</span>
              Profil Anda Belum Lengkap!
            </div>
            <p className="text-body-sm leading-relaxed text-amber-900">
              Sesuai aturan sistem kampus STIKOM CKI, Anda wajib mengisi data profil lengkap (Nama Lengkap, NIM, Program Studi, Semester, dan Kelas) sebelum dapat mengirimkan laporan penemuan barang.
            </p>
            <Link
              to="/profile"
              state={{ from: '/report-found', reason: 'Lengkapi profil Anda terlebih dahulu sebelum membuat laporan temuan.' }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-status-warning text-white font-bold text-label-md shadow-card hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">badge</span>
              Lengkapi Profil Sekarang
            </Link>
          </div>
        )}

        {/* Business Rule Warning (CST-01 & CST-02) */}
        <div className="bg-primary-subtle border border-primary-container/20 rounded-xl p-4 text-body-sm text-text-primary flex items-start gap-3">
          <span className="material-symbols-outlined text-primary-container text-[20px] flex-shrink-0 mt-0.5">info</span>
          <div className="space-y-1">
            <span className="font-bold text-primary-darker">Ketentuan Penitipan Barang Temuan (CST-02):</span>
            <p className="leading-relaxed text-text-secondary">
              Barang temuan <strong>dilarang dibawa pulang</strong>. Anda wajib memilih salah satu loket Front Office resmi dan segera menitipkan barang fisik tersebut ke petugas loket untuk diamankan.
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
              Nama Barang Temuan <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Dompet Lipat Hitam, Jaket Hoodie Abu-abu, Earphone TWS"
              required
              className="input-field"
            />
          </div>

          {/* Grid Kategori & Lokasi FO */}
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
                Lokasi Loket FO Penitipan <span className="text-status-error">*</span>
              </label>
              <select
                value={storageLocationId}
                onChange={(e) => setStorageLocationId(e.target.value)}
                required
                className="input-field"
              >
                <option value="">Pilih Loket FO Penitipan...</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.building})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lokasi Ditemukan */}
          <div>
            <label className="block text-label-md font-medium text-text-primary mb-1.5">
              Lokasi Spesifik Ditemukan di Kampus <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              value={locationFound}
              onChange={(e) => setLocationFound(e.target.value)}
              placeholder="Contoh: Meja Lab Komputer 3 Lantai 2, Kantin Belakang dekat dispenser"
              required
              className="input-field"
            />
          </div>

          {/* Deskripsi Umum */}
          <div>
            <label className="block text-label-md font-medium text-text-primary mb-1.5">
              Deskripsi Umum Barang <span className="text-status-error">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan gambaran umum barang (warna, merk umum, kondisi saat ditemukan)..."
              required
              className="w-full px-3.5 py-2.5 rounded-md bg-surface-white border border-border-subtle text-on-surface text-body-md placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-container transition-all shadow-card"
            />
          </div>

          {/* 1 Pertanyaan Validasi Terkait Barang (Requirement #4) */}
          <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 sm:p-5 space-y-2">
            <label className="block text-label-md font-bold text-purple-900 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-purple-700 text-[20px]">quiz</span>
              1 Pertanyaan Validasi untuk Pemilik Asli <span className="text-status-error">*</span>
            </label>
            <p className="text-body-sm text-purple-800 leading-relaxed">
              Tuliskan 1 pertanyaan yang hanya diketahui oleh pemilik asli barang (contoh: "Apa merk stiker di bagian belakang laptop?", "Berapa lembar uang pecahan 50 ribu di dalam dompet?").
            </p>
            <input
              type="text"
              value={validationQuestion}
              onChange={(e) => setValidationQuestion(e.target.value)}
              placeholder="Contoh: Apa gantungan kunci yang terpasang atau stiker di barang ini?"
              required
              className="input-field border-purple-300 focus:ring-purple-500"
            />
          </div>

          {/* Hidden Detail (Kunci Jawaban Pertanyaan Validasi) */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 sm:p-5 space-y-2">
            <label className="block text-label-md font-semibold text-amber-900">
              Kunci Jawaban Validasi (Disembunyikan dari Publik) <span className="text-status-error">*</span>
            </label>
            <p className="text-body-sm text-amber-800 leading-relaxed">
              <strong>PENTING:</strong> Jawaban ini <strong>disembunyikan dari publik</strong> dan dicocokkan otomatis oleh sistem saat pemilik menjawab pertanyaan validasi di atas.
            </p>
            <textarea
              rows={3}
              value={hiddenDetail}
              onChange={(e) => setHiddenDetail(e.target.value)}
              placeholder="Contoh: Gantungan boneka pikachu kuning dan ada bekas goresan huruf K di baliknya..."
              required
              className="w-full px-3.5 py-2.5 rounded-md bg-surface-white border border-amber-300 text-on-surface text-body-md placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-card"
            />
          </div>

          {/* Upload Foto Barang (Maks 2MB) */}
          <div>
            <label className="block text-label-md font-medium text-text-primary mb-1.5">
              Foto Barang Fisik <span className="text-status-error">*</span> (Maksimal 2MB, JPG/PNG/WebP)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <label className="w-full sm:w-auto flex-1 cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-border-subtle hover:border-primary-container rounded-xl text-center bg-surface-container-low hover:bg-primary-subtle transition-all">
                <span className="material-symbols-outlined text-[32px] text-text-secondary mb-2">cloud_upload</span>
                <span className="text-label-md font-semibold text-text-primary">Pilih File Foto Barang</span>
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
              disabled={isSubmitting || !isProfileComplete}
              className="w-full h-12 rounded-md bg-status-success hover:opacity-90 text-white font-semibold text-label-md shadow-card disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              {isSubmitting
                ? 'Menyimpan Laporan...'
                : !isProfileComplete
                ? 'Wajib Lengkapi Profil Terlebih Dahulu'
                : 'Kirim Laporan Barang Temuan'}
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
