import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ItemSummary } from '../types';
import { formatImageUrl } from '../utils/imageUrl';

interface ItemCardProps {
  item: ItemSummary;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const [imageError, setImageError] = useState(false);
  const isFound = item.item_type === 'found';
  const location = isFound ? (item as any).location_found : (item as any).last_seen_location;
  const rawPhoto = 'photo_url' in item && item.photo_url ? (item.photo_url as string) : '';
  const photoUrl = rawPhoto ? formatImageUrl(rawPhoto) : '';
  const activeClaim = (item as any).active_claim;

  // Format tanggal Indonesia
  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-surface-white rounded-xl border border-border-subtle shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all flex flex-col overflow-hidden group">
      {/* Header Image / Placeholder */}
      <div className="relative aspect-[16/9] w-full bg-surface-container overflow-hidden flex items-center justify-center">
        {photoUrl && !imageError ? (
          <img
            src={photoUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-text-secondary gap-1">
            <span className="material-symbols-outlined text-[36px] text-outline-variant">image</span>
            <span className="text-label-sm">Foto tidak tersedia</span>
          </div>
        )}

        {/* Tipe Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className={`px-2.5 py-1 rounded-full text-label-sm font-semibold tracking-wide shadow-card ring-2 ring-white/80 ${
              isFound
                ? 'bg-status-success text-white'
                : 'bg-status-warning text-white'
            }`}
          >
            {isFound ? 'Barang Temuan' : 'Barang Hilang'}
          </span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          {item.status === 'active' && (
            <span className="px-2.5 py-1 rounded-full text-label-sm font-medium bg-primary-container text-white backdrop-blur-sm shadow-card ring-2 ring-white/80">
              Tersedia
            </span>
          )}
          {item.status === 'claimed' && (
            <span className="px-2.5 py-1 rounded-full text-label-sm font-medium bg-purple-600 text-white shadow-card ring-2 ring-white/80">
              Dalam Proses Klaim
            </span>
          )}
          {item.status === 'completed' && (
            <span className="px-2.5 py-1 rounded-full text-label-sm font-medium bg-text-secondary text-white shadow-card ring-2 ring-white/80">
              Selesai / Diambil
            </span>
          )}
          {item.status === 'expired' && (
            <span className="px-2.5 py-1 rounded-full text-label-sm font-medium bg-status-error text-white shadow-card ring-2 ring-white/80">
              Kedaluwarsa
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          {/* Kategori */}
          <div className="flex items-center gap-1.5 text-label-sm font-semibold text-primary-container">
            <span className="material-symbols-outlined text-[16px]">sell</span>
            <span>{item.category?.name || 'Umum'}</span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-text-primary text-headline-sm leading-snug line-clamp-1 group-hover:text-primary-container transition-colors">
            {item.title}
          </h3>

          {/* Description */}
          <p className="text-body-sm text-text-secondary line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        <div className="pt-3 border-t border-border-subtle space-y-2 text-label-sm text-text-secondary">
          {/* Informasi Pelapor dari Profil (Requirement #3) */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low border border-border-subtle">
            <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-[10px] flex-shrink-0">
              {item.reporter?.name?.charAt(0) || 'M'}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <span className="font-bold text-text-primary text-label-sm block truncate">
                {item.reporter?.name || 'Mahasiswa CKI'}
              </span>
              <span className="text-[11px] text-text-secondary block truncate">
                {[
                  item.reporter?.prodi,
                  item.reporter?.semester ? `Sem ${item.reporter.semester}` : null,
                  item.reporter?.kelas ? `Kelas ${item.reporter.kelas}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Profil Kampus CKI'}
              </span>
            </div>
          </div>

          {/* Lokasi */}
          <div className="flex items-center gap-1.5 truncate">
            <span className="material-symbols-outlined text-[16px] text-text-secondary flex-shrink-0">location_on</span>
            <span className="truncate">{location}</span>
          </div>

          {/* Informasi Pengklaim & Kode Unik Klaim jika ada (Requirement #5 & #8) */}
          {activeClaim?.claimant_name && (
            <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 space-y-1">
              <div className="flex items-center gap-1.5 text-label-sm">
                <span className="material-symbols-outlined text-[16px] text-purple-600">person_check</span>
                <span className="truncate">
                  Pengklaim: <strong className="font-bold text-purple-950">{activeClaim.claimant_name}</strong>
                  {activeClaim.claimant_nim ? ` (${activeClaim.claimant_nim})` : ''}
                </span>
              </div>
              {activeClaim.claim_code && (
                <div className="flex items-center justify-between pt-1 border-t border-purple-200/60">
                  <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">key</span>
                    Kode Unik Klaim:
                  </span>
                  <span className="font-mono font-black text-xs text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded border border-amber-300 tracking-wider">
                    {activeClaim.claim_code}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tanggal & Link */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-text-secondary flex-shrink-0">calendar_today</span>
              <span>{formatDate(item.created_at)}</span>
            </div>

            <Link
              to={`/item/${item.item_type}/${item.id}`}
              className="inline-flex items-center gap-1 text-label-sm font-semibold text-primary-container hover:text-primary-hover transition-colors"
            >
              Lihat Detail
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
