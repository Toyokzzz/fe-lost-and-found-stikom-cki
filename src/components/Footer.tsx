import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-inverse-surface text-inverse-on-surface py-10 mt-16 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-gutter">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-space-sm">
              <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[20px]">inventory_2</span>
              </div>
              <div>
                <div className="text-headline-sm font-semibold text-white leading-tight">JejakBarang CKI</div>
                <div className="text-label-eyebrow uppercase text-white/50 tracking-widest">STIKOM CKI</div>
              </div>
            </div>
            <p className="text-body-sm text-white/60 leading-relaxed max-w-xs">
              Sistem informasi terpusat pelaporan dan pengembalian barang hilang di lingkungan kampus STIKOM CKI.
            </p>
          </div>

          {/* Lokasi FO */}
          <div>
            <h4 className="text-label-sm uppercase tracking-widest text-white/50 mb-3">Lokasi Front Office</h4>
            <ul className="space-y-1.5 text-body-sm text-white/70">
              <li>FO Gedung Rektorat (Lt. 1)</li>
              <li>Pos Keamanan Gerbang Utama (24 Jam)</li>
              <li>FO Gedung Kuliah A (Lobi)</li>
              <li>Sirkulasi Perpustakaan Pusat</li>
            </ul>
          </div>

          {/* Aturan */}
          <div>
            <h4 className="text-label-sm uppercase tracking-widest text-white/50 mb-3">Aturan Sistem</h4>
            <ul className="space-y-1.5 text-body-sm text-white/70">
              <li>Verifikasi Ciri Rahasia Mandiri</li>
              <li>Claim Code 6-Karakter Unik</li>
              <li>Maks 3 Laporan Hilang / Hari</li>
              <li>Masa Aktif Laporan: 7 Hari</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-body-sm text-white/40">
          <span>© 2026 Sekolah Tinggi Ilmu Komputer Cipta Karya Informatika (STIKOM CKI). All rights reserved.</span>
          <span>Dikembangkan oleh Tim Kelompok 7 RPL</span>
        </div>
      </div>
    </footer>
  );
};
