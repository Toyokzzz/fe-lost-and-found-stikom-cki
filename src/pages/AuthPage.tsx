import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

type LoginTab = 'mahasiswa' | 'admin';
type MahasiswaMode = 'login' | 'register';

const DEFAULT_FALLBACK_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  '246831581192-2rf8sj8ub2o9716nht8h7c9g46a2tcec.apps.googleusercontent.com';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, token, isLoading, login, loginWithGoogle } = useAuth();

  // Top-level tab: mahasiswa or admin
  const [loginTab, setLoginTab] = useState<LoginTab>('mahasiswa');

  // Mahasiswa sub-mode: login or register
  const [mode, setMode] = useState<MahasiswaMode>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );

  // Active Google Client ID (Disinkronkan dengan Backend & localStorage)
  const [activeClientId, setActiveClientId] = useState<string>(() => {
    return localStorage.getItem('CUSTOM_GOOGLE_CLIENT_ID') || DEFAULT_FALLBACK_CLIENT_ID;
  });
  const [tempClientIdInput, setTempClientIdInput] = useState<string>('');
  const [showConfigGuide, setShowConfigGuide] = useState<boolean>(false);

  // Shared form fields
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Admin form fields (separate state to avoid leakage)
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRoleRedirect = (userRole: string) => {
    const role = (userRole || '').toLowerCase();
    const from = (location.state as any)?.from?.pathname;
    if (from && from !== '/login' && from !== '/auth') {
      navigate(from, { replace: true });
      return;
    }
    if (role === 'admin_developer' || role === 'admin') {
      navigate('/admin/dev', { replace: true });
    } else if (role === 'admin_fo') {
      navigate('/admin/fo', { replace: true });
    } else {
      navigate('/catalog', { replace: true });
    }
  };

  // ── Proteksi Sesi & Auto-Redirect ──────────────────────────────────────────
  // Jika pengguna sudah memiliki token valid di localStorage / React Context,
  // otomatis redirect ke halaman katalog atau panel admin tanpa perlu login ulang.
  useEffect(() => {
    if (!isLoading && user && token) {
      handleRoleRedirect(user.role);
    }
  }, [user, token, isLoading]);

  // Sinkronisasi Google Client ID dari Backend API
  useEffect(() => {
    api
      .get('/auth/google/config')
      .then((res) => {
        if (res.data.success && res.data.data?.clientId) {
          const backendId = res.data.data.clientId.trim();
          if (backendId && !localStorage.getItem('CUSTOM_GOOGLE_CLIENT_ID')) {
            setActiveClientId(backendId);
          }
        }
      })
      .catch((err) => {
        console.warn('Gagal mengambil Google config dari backend:', err);
      });
  }, []);

  // Tangkap redirect OAuth jika Google mengembalikan token via fragment URL (#access_token=... / #id_token=...)
  useEffect(() => {
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const idToken = hashParams.get('id_token');
      if (accessToken || idToken) {
        window.history.replaceState(null, '', window.location.pathname);
        setIsSubmitting(true);
        loginWithGoogle({ access_token: accessToken || undefined, credential: idToken || undefined })
          .then((loggedInUser) => {
            handleRoleRedirect(loggedInUser.role);
          })
          .catch((err: any) => {
            setErrorMessage(err.response?.data?.message || err.message || 'Login Google gagal.');
          })
          .finally(() => setIsSubmitting(false));
      }
    }
  }, []);

  // Clear messages when switching tabs or mode
  useEffect(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [loginTab, mode]);

  useEffect(() => {
    if (location.state && (location.state as any).error) {
      setErrorMessage((location.state as any).error);
    }
  }, [location.state]);

  // ── Inisialisasi Google Identity Services (GIS) Resmi ─────────────────────
  useEffect(() => {
    if (loginTab !== 'mahasiswa' || mode !== 'login') return;

    let isMounted = true;

    const setupGoogleGSI = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id || !activeClientId) return false;

      // Hindari inisialisasi GIS jika Client ID kosong atau belum diisi
      if (!activeClientId || activeClientId.includes('your_') || activeClientId.trim().length < 15) {
        return false;
      }

      try {
        google.accounts.id.initialize({
          client_id: activeClientId,
          callback: async (response: any) => {
            if (!isMounted) return;
            if (response.credential) {
              setIsSubmitting(true);
              setErrorMessage(null);
              try {
                const loggedInUser = await loginWithGoogle({ credential: response.credential });
                handleRoleRedirect(loggedInUser.role);
              } catch (err: any) {
                setErrorMessage(
                  err.response?.data?.message || err.message || 'Verifikasi akun Google gagal.'
                );
              } finally {
                if (isMounted) setIsSubmitting(false);
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const btnContainer = document.getElementById('google-signin-official-btn');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 320,
          });
        }
        return true;
      } catch (err) {
        console.warn('Inisialisasi GIS dilewati:', err);
        return false;
      }
    };

    if (!setupGoogleGSI()) {
      const interval = setInterval(() => {
        if (setupGoogleGSI()) {
          clearInterval(interval);
        }
      }, 500);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [loginTab, mode, activeClientId]);

  // ── Pemicu Autentikasi Google OAuth 2.0 (Popup Resmi Google) ───────────────
  const handleTriggerGoogleOAuth = () => {
    setErrorMessage(null);

    // Cek apakah Client ID masih kosong atau belum diisi
    const isPlaceholder =
      !activeClientId ||
      activeClientId.includes('your_') ||
      activeClientId.trim().length < 15;

    if (isPlaceholder) {
      setShowConfigGuide(true);
      setErrorMessage(
        'Google OAuth Client ID belum dikonfigurasi dengan kredensial Google Cloud Anda (Error 401: invalid_client). Silakan ikuti panduan di bawah atau gunakan login email & kata sandi.'
      );
      return;
    }

    const google = (window as any).google;

    // 1. Coba gunakan Google OAuth 2.0 Token Client (Popup Akun Google)
    if (google?.accounts?.oauth2) {
      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: activeClientId,
          scope: 'openid email profile',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              if (tokenResponse.error === 'invalid_client') {
                setShowConfigGuide(true);
                setErrorMessage('Error 401: invalid_client. Client ID tidak terdaftar di Google Cloud Console.');
              } else {
                setErrorMessage(`Autentikasi Google dibatalkan: ${tokenResponse.error_description || tokenResponse.error}`);
              }
              return;
            }
            if (tokenResponse.access_token) {
              setIsSubmitting(true);
              try {
                const loggedInUser = await loginWithGoogle({ access_token: tokenResponse.access_token });
                handleRoleRedirect(loggedInUser.role);
              } catch (err: any) {
                setErrorMessage(err.response?.data?.message || err.message || 'Verifikasi token Google gagal.');
              } finally {
                setIsSubmitting(false);
              }
            }
          },
        });
        client.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (tokenClientErr) {
        console.warn('OAuth token client error, mencoba direct popup:', tokenClientErr);
      }
    }

    // 2. Direct Popup ke accounts.google.com
    openGoogleOAuthDirectPopup();
  };

  const openGoogleOAuthDirectPopup = () => {
    const redirectUri = window.location.origin + '/auth';
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      activeClientId
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token%20id_token&scope=${encodeURIComponent(
      'openid email profile'
    )}&nonce=${Date.now()}&prompt=select_account`;

    const width = 500;
    const height = 620;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(
      oauthUrl,
      'Google_OAuth_Login',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
    );
  };

  const handleApplyCustomClientId = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = tempClientIdInput.trim();
    if (!cleanId) return;
    localStorage.setItem('CUSTOM_GOOGLE_CLIENT_ID', cleanId);
    setActiveClientId(cleanId);
    setShowConfigGuide(false);
    setErrorMessage(null);
    setSuccessMessage('Client ID berhasil diperbarui! Silakan klik tombol "Masuk dengan Akun Google" kembali.');
  };

  // ── Mahasiswa: email/password login or register ──────────────────────────
  const handleMahasiswaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (mode === 'register') {
      if (!name.trim() || name.trim().length < 3) {
        setErrorMessage('Nama lengkap wajib diisi minimal 3 karakter sesuai kartu identitas.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Kata sandi minimal 6 karakter.');
        return;
      }
      if (confirmPassword && password !== confirmPassword) {
        setErrorMessage('Konfirmasi kata sandi tidak cocok.');
        return;
      }
    } else {
      if (!identifier.trim()) {
        setErrorMessage('Email wajib diisi.');
        return;
      }
      if (!password) {
        setErrorMessage('Kata sandi wajib diisi.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        const res = await api.post('/auth/login', {
          identifier: identifier.trim(),
          email: identifier.trim(),
          password,
        });
        if (res.data.success) {
          login(res.data.data.token, res.data.data.user);
          handleRoleRedirect(res.data.data.user.role);
        }
      } else {
        const res = await api.post('/auth/register', {
          name: name.trim().toUpperCase(),
          email: identifier.trim(),
          password,
          phone: phone.trim() || undefined,
        });
        if (res.data.success) {
          login(res.data.data.token, res.data.data.user);
          navigate('/profile', {
            state: { reason: 'Silakan lengkapi profil Anda terlebih dahulu.' },
          });
        }
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan pada server. Periksa koneksi dan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Admin: manual login ──────────────────────────────────────────────────
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!adminIdentifier.trim()) {
      setErrorMessage('Email atau ID Administrator wajib diisi.');
      return;
    }
    if (!adminPassword) {
      setErrorMessage('Kata sandi wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/login', {
        identifier: adminIdentifier.trim(),
        email: adminIdentifier.trim(),
        password: adminPassword,
      });
      if (res.data.success) {
        login(res.data.data.token, res.data.data.user);
        handleRoleRedirect(res.data.data.user.role);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          err.message ||
          'Login administrator gagal. Periksa kembali kredensial Anda.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-6 sm:py-10 flex items-center justify-center">
      <div className="relative w-full max-w-[500px]">
        {/* Ambient Glowing Vector Orbs */}
        <div className="absolute -top-20 -left-16 w-72 h-72 bg-primary-subtle rounded-full blur-3xl pointer-events-none opacity-70 -z-10" />
        <div className="absolute -bottom-20 -right-16 w-80 h-80 bg-surface-container rounded-full blur-3xl pointer-events-none opacity-60 -z-10" />

        {/* Top Pill & Security Verification Badge */}
        <div className="flex items-center justify-between mb-3 px-1 text-label-sm">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-white border border-border-subtle shadow-card">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            <span className="font-label-eyebrow text-label-eyebrow uppercase text-primary font-bold tracking-wider">
              Autentikasi Terpusat STIKOM CKI
            </span>
          </div>
          <div className="flex items-center gap-1 text-text-secondary font-label-sm">
            <span className="material-symbols-outlined text-[16px] text-primary">lock</span>
            <span>Enkripsi Kredensial 256-Bit</span>
          </div>
        </div>

        {/* Main Card Container */}
        <div className="bg-surface-white rounded-2xl border border-border-subtle shadow-floating relative overflow-hidden transition-all duration-300">
          {/* Top Decorative Color Accent Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary-container to-secondary-container" />

          <div className="p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-primary-subtle text-primary font-label-eyebrow text-label-eyebrow font-bold tracking-widest uppercase">
                    Portal Akses Resmi
                  </span>
                </div>
                <h1 className="text-headline-lg font-headline-lg font-bold text-text-primary tracking-tight">
                  {loginTab === 'mahasiswa'
                    ? mode === 'register'
                      ? 'Pendaftaran Mahasiswa'
                      : 'Masuk ke Sistem'
                    : 'Login Administrator'}
                </h1>
                <p className="text-body-sm font-body-sm text-text-secondary mt-1">
                  {loginTab === 'mahasiswa'
                    ? mode === 'register'
                      ? 'Pendaftaran mandiri mahasiswa untuk sistem Lost & Found CKI.'
                      : 'Masuk dengan akun Google Anda atau email & kata sandi terdaftar.'
                    : 'Khusus Admin Front Office dan Admin Developer.'}
                </p>
              </div>

              {/* Visual Icon Badge */}
              <div className="relative shrink-0 w-12 h-12 rounded-2xl bg-primary-subtle flex items-center justify-center shadow-card">
                <span className="material-symbols-outlined text-primary text-[26px]">
                  {loginTab === 'admin'
                    ? 'admin_panel_settings'
                    : mode === 'register'
                    ? 'badge'
                    : 'security'}
                </span>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-surface-white shadow-card flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary-container text-[12px]">
                    verified
                  </span>
                </span>
              </div>
            </div>

            {/* ── Top-level Login Tab Switcher ─────────────────────────── */}
            <div className="flex bg-surface-container-low p-1 rounded-xl text-label-sm font-semibold">
              <button
                type="button"
                onClick={() => setLoginTab('mahasiswa')}
                className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  loginTab === 'mahasiswa'
                    ? 'bg-surface-white text-primary-container shadow-card'
                    : 'text-text-secondary hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">school</span>
                Mahasiswa
              </button>
              <button
                type="button"
                onClick={() => setLoginTab('admin')}
                className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  loginTab === 'admin'
                    ? 'bg-surface-white text-primary-container shadow-card'
                    : 'text-text-secondary hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                Admin / Petugas
              </button>
            </div>

            {/* Error / Success Alerts */}
            {errorMessage && (
              <div className="bg-error-container border border-on-error-container/20 text-on-error-container rounded-xl p-3.5 text-body-sm flex items-start gap-2.5 animate-fadeIn">
                <span className="material-symbols-outlined text-[18px] text-status-error flex-shrink-0 mt-0.5">
                  error
                </span>
                <div className="flex-1 leading-snug">
                  <span className="font-semibold block">Gagal Masuk:</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-3.5 text-body-sm flex items-start gap-2.5 animate-fadeIn">
                <span className="material-symbols-outlined text-[18px] text-status-success flex-shrink-0 mt-0.5">
                  check_circle
                </span>
                <span>{successMessage}</span>
              </div>
            )}

            {/* ── Panduan Konfigurasi Google OAuth (Muncul saat Error invalid_client) ─ */}
            {showConfigGuide && loginTab === 'mahasiswa' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-3 text-body-sm animate-fadeIn">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <span className="material-symbols-outlined text-[20px] text-amber-700">settings_suggest</span>
                  Panduan Setup Google Client ID (Solusi Error 401: invalid_client)
                </div>
                <p className="text-label-sm leading-relaxed text-amber-900">
                  Pesan <strong>invalid_client / The OAuth client was not found</strong> menandakan Client ID belum dibuat di <strong>Google Cloud Console</strong>. Ikuti langkah singkat berikut:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-label-sm">
                  <li>
                    Buka{' '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline font-semibold"
                    >
                      Google Cloud Console Credentials
                    </a>
                  </li>
                  <li>Klik <strong>+ Create Credentials</strong> &gt; <strong>OAuth client ID</strong> &gt; Pilih Application type <strong>Web application</strong>.</li>
                  <li>Tambahkan <strong>Authorized JavaScript origins</strong>: <code className="bg-amber-100 px-1 rounded font-mono text-[11px]">{window.location.origin}</code></li>
                  <li>Salin Client ID (contoh: <code className="text-[11px] font-mono">12345-xxx.apps.googleusercontent.com</code>) dan simpan ke file <code className="font-mono text-[11px]">frontend/.env</code> &amp; <code className="font-mono text-[11px]">backend/.env</code>.</li>
                </ol>

                <form onSubmit={handleApplyCustomClientId} className="pt-2 border-t border-amber-200 space-y-2">
                  <label className="block text-label-sm font-semibold text-amber-900">
                    Uji Langsung: Tempel Client ID Baru Anda di Sini:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tempClientIdInput}
                      onChange={(e) => setTempClientIdInput(e.target.value)}
                      placeholder="contoh: 123456789-abc.apps.googleusercontent.com"
                      className="input-field text-label-sm font-mono flex-1 bg-surface-white"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-lg bg-amber-800 text-white font-semibold text-label-sm hover:bg-amber-900 shadow-card"
                    >
                      Terapkan
                    </button>
                  </div>
                </form>

                <div className="pt-1 flex justify-between items-center text-label-sm">
                  <span className="text-text-secondary">Atau gunakan form email &amp; kata sandi di bawah:</span>
                  <button
                    type="button"
                    onClick={() => setShowConfigGuide(false)}
                    className="text-amber-800 underline font-semibold hover:text-amber-950"
                  >
                    Tutup Panduan
                  </button>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                TAB: MAHASISWA
            ════════════════════════════════════════════════════════════ */}
            {loginTab === 'mahasiswa' && (
              <div className="space-y-5">
                {/* Mahasiswa sub-tabs: Masuk Akun | Daftar */}
                <div className="flex bg-surface-container-low p-1 rounded-xl text-label-sm font-semibold">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`flex-1 py-2 rounded-lg transition-all ${
                      mode === 'login'
                        ? 'bg-surface-white text-primary-container shadow-card'
                        : 'text-text-secondary hover:text-on-surface'
                    }`}
                  >
                    Masuk Akun
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className={`flex-1 py-2 rounded-lg transition-all ${
                      mode === 'register'
                        ? 'bg-surface-white text-primary-container shadow-card'
                        : 'text-text-secondary hover:text-on-surface'
                    }`}
                  >
                    Daftar Mahasiswa
                  </button>
                </div>

                {/* ── Google OAuth 2.0 Asli (Khusus Login Mahasiswa) ──────── */}
                {mode === 'login' && (
                  <div className="space-y-3">
                    {/* Wadah Resmi Google Sign-In Button (GIS) */}
                    <div id="google-signin-official-btn" className="w-full flex justify-center empty:hidden" />

                    {/* Tombol Masuk dengan Google (Memicu OAuth 2.0 Popup Resmi) */}
                    <button
                      type="button"
                      onClick={handleTriggerGoogleOAuth}
                      disabled={isSubmitting}
                      className="w-full h-11 rounded-xl border border-border-subtle bg-surface-white hover:bg-surface-container-low text-text-primary font-semibold text-label-md transition-all shadow-card flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {/* Google Logo SVG */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        className="w-5 h-5 flex-shrink-0"
                      >
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.5 0 6.6 1.3 9 3.4l6.7-6.7C35.8 2.4 30.2 0 24 0 14.7 0 6.8 5.4 3 13.3l7.8 6C12.7 13.4 17.9 9.5 24 9.5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M46.9 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.9c-.6 3-2.3 5.5-4.9 7.2l7.6 5.9c4.4-4.1 7.3-10.1 7.3-17.1z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M10.8 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7L2.5 13.3A23.9 23.9 0 0 0 0 24c0 3.8.9 7.4 2.5 10.6l8.3-5.9z"
                        />
                        <path
                          fill="#34A853"
                          d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.6-5.9c-2.1 1.4-4.7 2.2-7.6 2.2-6.1 0-11.3-3.9-13.2-9.3l-8.3 5.9C6.8 42.6 14.7 48 24 48z"
                        />
                        <path fill="none" d="M0 0h48v48H0z" />
                      </svg>
                      <span>Masuk dengan Akun Google</span>
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex-1 h-px bg-border-subtle" />
                      <span className="text-label-sm text-text-secondary font-medium">atau masuk dengan email</span>
                      <div className="flex-1 h-px bg-border-subtle" />
                    </div>
                  </div>
                )}

                {/* ── Mahasiswa Email/Password Form ──────────────────────── */}
                <form onSubmit={handleMahasiswaSubmit} className="space-y-4" noValidate>
                  {mode === 'register' && (
                    <div>
                      <label className="block text-label-md font-medium text-text-primary mb-1.5 flex justify-between">
                        <span>
                          Nama Lengkap Civitas <span className="text-status-error">*</span>
                        </span>
                        <span className="text-label-sm text-text-secondary font-normal">
                          Sesuai Kartu Mahasiswa
                        </span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-text-secondary pointer-events-none">
                          person
                        </span>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Contoh: Jonathan Baswara"
                          required
                          minLength={3}
                          className="input-field pl-11"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label className="block text-label-md font-medium text-text-primary mb-1.5 flex justify-between">
                      <span>
                        {mode === 'login' ? 'Email Kampus / Email Pribadi' : 'Alamat Email'}{' '}
                        <span className="text-status-error">*</span>
                      </span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-text-secondary pointer-events-none">
                        mail
                      </span>
                      <input
                        type="email"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="nama@stikomcki.ac.id"
                        required
                        className="input-field pl-11"
                      />
                    </div>
                  </div>

                  {mode === 'register' && (
                    <div>
                      <label className="block text-label-md font-medium text-text-primary mb-1.5 flex justify-between">
                        <span>Nomor WhatsApp Aktif</span>
                        <span className="text-label-sm text-text-secondary font-normal">
                          Opsional
                        </span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-text-secondary pointer-events-none">
                          call
                        </span>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0812-3456-7890"
                          className="input-field pl-11"
                        />
                      </div>
                    </div>
                  )}

                  {/* Kata Sandi */}
                  <div>
                    <label className="block text-label-md font-medium text-text-primary mb-1.5 flex justify-between">
                      <span>
                        Kata Sandi <span className="text-status-error">*</span>
                      </span>
                      {mode === 'register' && (
                        <span className="text-label-sm text-text-secondary font-normal">
                          Min. 6 Karakter
                        </span>
                      )}
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-text-secondary pointer-events-none">
                        lock
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={
                          mode === 'login' ? 'Masukkan kata sandi akun Anda' : 'Minimal 6 karakter'
                        }
                        required
                        minLength={mode === 'register' ? 6 : 1}
                        className="input-field pl-11 pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Tampilkan atau sembunyikan kata sandi"
                        className="absolute right-3 text-text-secondary hover:text-text-primary p-1 rounded-md transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {mode === 'register' && (
                    <div>
                      <label className="block text-label-md font-medium text-text-primary mb-1.5 flex justify-between">
                        <span>
                          Konfirmasi Kata Sandi <span className="text-status-error">*</span>
                        </span>
                        {confirmPassword && (
                          <span
                            className={`text-label-sm font-semibold flex items-center gap-1 ${
                              password === confirmPassword
                                ? 'text-status-success'
                                : 'text-status-error'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {password === confirmPassword ? 'check_circle' : 'cancel'}
                            </span>
                            {password === confirmPassword ? 'Cocok' : 'Belum Cocok'}
                          </span>
                        )}
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-text-secondary pointer-events-none">
                          lock_reset
                        </span>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Ulangi kata sandi Anda"
                          required
                          className="input-field pl-11 pr-11"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label="Tampilkan konfirmasi kata sandi"
                          className="absolute right-3 text-text-secondary hover:text-text-primary p-1 rounded-md transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showConfirmPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {mode === 'login' && (
                    <div className="flex items-center justify-between pt-1">
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded text-primary-container focus:ring-primary-container accent-[#0F6BD0] cursor-pointer"
                        />
                        <span className="text-label-md text-text-secondary hover:text-text-primary transition-colors">
                          Ingat saya di perangkat ini
                        </span>
                      </label>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 rounded-xl bg-primary-container text-on-primary font-semibold text-label-md hover:bg-primary-hover active:scale-[0.99] transition-all shadow-card flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[18px]">
                          progress_activity
                        </span>
                        Memproses Autentikasi...
                      </>
                    ) : mode === 'login' ? (
                      <>
                        Masuk Sekarang
                        <span className="material-symbols-outlined text-[18px]">login</span>
                      </>
                    ) : (
                      <>
                        Buat Akun Mahasiswa
                        <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                TAB: ADMIN / PETUGAS (FORM MANUAL STANDAR AMAN)
            ════════════════════════════════════════════════════════════ */}
            {loginTab === 'admin' && (
              <div className="space-y-5">
                {/* Info notice — no credentials shown */}
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-surface-container-low border border-border-subtle text-text-secondary text-label-sm leading-relaxed">
                  <span className="material-symbols-outlined text-[18px] text-primary flex-shrink-0 mt-0.5">
                    info
                  </span>
                  <span>
                    Halaman ini khusus untuk petugas resmi. Gunakan email atau ID yang diberikan oleh
                    admin sistem. Hubungi IT kampus jika lupa kredensial.
                  </span>
                </div>

                <form onSubmit={handleAdminSubmit} className="space-y-4" noValidate>
                  {/* Admin Identifier */}
                  <div>
                    <label className="block text-label-md font-medium text-text-primary mb-1.5">
                      Email atau ID Administrator <span className="text-status-error">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-text-secondary pointer-events-none">
                        badge
                      </span>
                      <input
                        type="text"
                        value={adminIdentifier}
                        onChange={(e) => setAdminIdentifier(e.target.value)}
                        placeholder="ID atau email administrator"
                        required
                        className="input-field pl-11"
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  {/* Admin Password */}
                  <div>
                    <label className="block text-label-md font-medium text-text-primary mb-1.5">
                      Kata Sandi <span className="text-status-error">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-text-secondary pointer-events-none">
                        lock
                      </span>
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Kata sandi administrator"
                        required
                        className="input-field pl-11 pr-11"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        aria-label="Tampilkan atau sembunyikan kata sandi"
                        className="absolute right-3 text-text-secondary hover:text-text-primary p-1 rounded-md transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showAdminPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 rounded-xl bg-primary-container text-on-primary font-semibold text-label-md hover:bg-primary-hover active:scale-[0.99] transition-all shadow-card flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[18px]">
                          progress_activity
                        </span>
                        Memverifikasi Identitas...
                      </>
                    ) : (
                      <>
                        Masuk Panel Admin
                        <span className="material-symbols-outlined text-[18px]">
                          admin_panel_settings
                        </span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
