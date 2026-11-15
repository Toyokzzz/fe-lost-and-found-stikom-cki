import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, isProfileComplete } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Form states - Nama Lengkap otomatis kapital
  const [name, setName] = useState(user?.name ? user.name.toUpperCase() : '');
  const [nim, setNim] = useState(user?.nim || '');
  const [prodi, setProdi] = useState(user?.prodi || 'Teknik Informatika');
  const [semester, setSemester] = useState<number>(user?.semester || 1);
  const [kelas, setKelas] = useState<string>(user?.kelas || 'Pagi');
  const [phone, setPhone] = useState(user?.phone || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Periksa apakah user dialihkan karena profil belum lengkap saat ingin melapor
  const redirectReason = (location.state as any)?.reason;

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name.toUpperCase());
      if (user.nim) setNim(user.nim);
      if (user.prodi) setProdi(user.prodi);
      if (user.semester) setSemester(user.semester);
      if (user.kelas) setKelas(user.kelas);
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('Nama Lengkap wajib diisi.');
      return;
    }

    if (!nim.trim()) {
      setErrorMessage('NIM wajib diisi.');
      return;
    }

    if (!prodi.trim()) {
      setErrorMessage('Program Studi wajib dipilih.');
      return;
    }

    if (!semester || semester < 1 || semester > 8) {
      setErrorMessage('Semester harus dipilih antara 1 sampai 8.');
      return;
    }

    if (!kelas || (kelas !== 'Pagi' && kelas !== 'Malam')) {
      setErrorMessage('Pilihan kelas harus "Pagi" atau "Malam".');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({
        name: name.trim().toUpperCase(),
        nim: nim.trim(),
        prodi: prodi.trim(),
        semester,
        kelas,
        phone: phone.trim() || undefined,
      });

      setSuccessMessage('Data profil berhasil disimpan dan dinyatakan lengkap!');
      
      // Jika sebelumnya dialihkan dari halaman lapor, tawarkan lanjut
      if ((location.state as any)?.from) {
        setTimeout(() => {
          navigate((location.state as any).from);
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan profil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Breadcrumb Navigation */}
      <Link
        to="/catalog"
        className="inline-flex items-center gap-1.5 text-label-md font-medium text-text-secondary hover:text-primary-container transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Kembali ke Katalog
      </Link>

      {/* Main Profile Card */}
      <div className="bg-surface-white rounded-2xl border border-border-subtle shadow-card p-6 sm:p-10 space-y-8">
        <div>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-subtle text-primary text-label-sm font-semibold">
              <span className="material-symbols-outlined text-[16px]">badge</span>
              Modul Profil Civitas Kampus STIKOM CKI
            </span>

            {isProfileComplete ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-status-success border border-green-200 text-label-sm font-bold">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                Profil Lengkap
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-label-sm font-bold animate-pulse">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                Profil Belum Lengkap (Wajib Diisi)
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-headline-lg font-bold text-text-primary tracking-tight">
            Profil Pengguna
          </h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Data profil wajib diisi lengkap sebelum Anda dapat membuat laporan penemuan maupun kehilangan barang di sistem Lost and Found STIKOM CKI.
          </p>
        </div>

        {/* Redirect Notice if user tried to report without complete profile */}
        {redirectReason && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-body-sm flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-700 text-[22px] flex-shrink-0 mt-0.5">info</span>
            <div>
              <span className="font-bold block">Pemberitahuan Sistem (Wajib Lengkap):</span>
              <p className="mt-0.5">{redirectReason}</p>
            </div>
          </div>
        )}

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
          {/* Email (Readonly dari akun) */}
          <div>
            <label className="block text-label-md font-medium text-text-secondary mb-1.5">
              Alamat Email Kampus / Google
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="input-field bg-surface-container-low text-text-secondary cursor-not-allowed"
            />
          </div>

          {/* Nama Lengkap (Otomatis Kapital / Caps Lock) */}
          <div>
            <label className="block text-label-md font-medium text-text-primary mb-1.5 flex justify-between">
              <span>
                Nama Lengkap <span className="text-status-error">*</span>
              </span>
              <span className="text-label-sm text-primary font-semibold">
                (Otomatis Huruf Kapital / Caps Lock)
              </span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="CONTOH: MUHAMMAD RIZKY FIRMANSYAH"
              required
              className="input-field uppercase font-semibold"
            />
          </div>

          {/* NIM & Program Studi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md font-medium text-text-primary mb-1.5">
                NIM (Nomor Induk Mahasiswa) <span className="text-status-error">*</span>
              </label>
              <input
                type="text"
                value={nim}
                onChange={(e) => setNim(e.target.value.trim())}
                placeholder="Contoh: 2024010101"
                required
                className="input-field font-mono"
              />
            </div>

            <div>
              <label className="block text-label-md font-medium text-text-primary mb-1.5">
                Program Studi <span className="text-status-error">*</span>
              </label>
              <select
                value={prodi}
                onChange={(e) => setProdi(e.target.value)}
                required
                className="input-field"
              >
                <option value="Teknik Informatika">Teknik Informatika</option>
                <option value="Sistem Informasi">Sistem Informasi</option>
                <option value="Manajemen Informatika">Manajemen Informatika</option>
                <option value="Komputerisasi Akuntansi">Komputerisasi Akuntansi</option>
              </select>
            </div>
          </div>

          {/* Semester (Dropdown 1-8) & Kelas (Dropdown Pagi/Malam) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md font-medium text-text-primary mb-1.5">
                Semester (Pilihan 1 - 8) <span className="text-status-error">*</span>
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(parseInt(e.target.value, 10))}
                required
                className="input-field"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-label-md font-medium text-text-primary mb-1.5">
                Kelas (Pagi / Malam) <span className="text-status-error">*</span>
              </label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                required
                className="input-field"
              >
                <option value="Pagi">Pagi</option>
                <option value="Malam">Malam</option>
              </select>
            </div>
          </div>

          {/* Nomor WhatsApp */}
          <div>
            <label className="block text-label-md font-medium text-text-primary mb-1.5 flex justify-between">
              <span>Nomor WhatsApp / Telepon Aktif</span>
              <span className="text-label-sm text-text-secondary">(Untuk koordinasi laporan)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contoh: 0812-3456-7890"
              className="input-field"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 h-12 rounded-md bg-primary-container hover:bg-primary-hover text-on-primary font-semibold text-label-md shadow-card transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">save</span>
              {isSubmitting ? 'Menyimpan Profil...' : 'Simpan Data Profil'}
            </button>

            {isProfileComplete && (
              <Link
                to="/catalog"
                className="px-6 h-12 rounded-md border border-border-subtle hover:bg-surface-container-low text-text-secondary font-medium text-label-md transition-colors flex items-center justify-center"
              >
                Ke Katalog Barang
              </Link>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
