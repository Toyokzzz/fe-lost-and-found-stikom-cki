import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { ItemSummary, Category, StorageLocation } from '../types';
import { ItemCard } from '../components/ItemCard';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<ItemSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States (Default: 'found' - Katalog Barang 2 Tab Menu)
  const [type, setType] = useState<string>(searchParams.get('type') || 'found');
  const [search, setSearch] = useState<string>(searchParams.get('search') || '');
  const [categoryId, setCategoryId] = useState<string>(searchParams.get('category_id') || '');
  const [locationId, setLocationId] = useState<string>(searchParams.get('location_id') || '');
  const [status, setStatus] = useState<string>(searchParams.get('status') || '');
  const [page, setPage] = useState<number>(parseInt(searchParams.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Load Categories & Locations on mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [catRes, locRes] = await Promise.all([
          api.get('/categories'),
          api.get('/locations'),
        ]);
        if (catRes.data.success) setCategories(catRes.data.data);
        if (locRes.data.success) setLocations(locRes.data.data);
      } catch (err) {
        console.warn('Gagal memuat master data:', err);
      }
    };
    fetchMasterData();
  }, []);

  // Fetch Items whenever filters or page change
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const params: any = {
          type,
          page,
          limit: 12,
        };
        if (search.trim()) params.search = search.trim();
        if (categoryId) params.category_id = categoryId;
        if (locationId) params.storage_location_id = locationId;
        if (status) params.status = status;

        const res = await api.get('/items', { params });
        if (res.data.success) {
          setItems(res.data.data);
          setTotalPages(res.data.pagination.totalPages);
          setTotalItems(res.data.pagination.totalItems);
        }
      } catch (err) {
        console.error('Error fetching catalog items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [type, search, categoryId, locationId, status, page]);

  const handleResetFilters = () => {
    setType('found');
    setSearch('');
    setCategoryId('');
    setLocationId('');
    setStatus('');
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-surface-white rounded-2xl p-6 sm:p-8 border border-border-subtle shadow-card space-y-5">
        <div>
          <span className="text-label-eyebrow uppercase tracking-widest text-primary-container font-semibold">Katalog Terpusat</span>
          <h1 className="text-headline-lg font-bold text-text-primary tracking-tight">Katalog Barang Kampus</h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Daftar resmi barang temuan yang diamankan di loket Front Office dan laporan barang hilang STIKOM CKI.
          </p>
        </div>

        {/* Search Bar & 2 Tab Menu (Requirement #3) */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center pt-2">
          {/* 2 Tab Menu: Barang Temuan & Barang Hilang */}
          <div className="flex items-center bg-surface-container-low p-1.5 rounded-xl w-full md:w-auto border border-border-subtle shadow-card">
            <button
              onClick={() => { setType('found'); setPage(1); }}
              className={`flex-1 md:flex-initial px-5 py-2.5 rounded-lg text-label-md font-bold transition-all flex items-center justify-center gap-2 ${
                type === 'found'
                  ? 'bg-status-success text-white shadow-card scale-[1.02]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-white/60'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
              <span>Barang Temuan</span>
            </button>
            <button
              onClick={() => { setType('lost'); setPage(1); }}
              className={`flex-1 md:flex-initial px-5 py-2.5 rounded-lg text-label-md font-bold transition-all flex items-center justify-center gap-2 ${
                type === 'lost'
                  ? 'bg-status-warning text-white shadow-card scale-[1.02]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-white/60'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">report</span>
              <span>Barang Hilang</span>
            </button>
          </div>

          {/* Search Input berdasarkan kata kunci nama barang */}
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-secondary">
              <span className="material-symbols-outlined text-[18px]">search</span>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari kata kunci nama barang..."
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Detailed Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border-subtle text-body-sm">
          {/* Category */}
          <div>
            <label className="block text-label-sm font-medium text-text-secondary mb-1">
              Kategori
            </label>
            <select
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
              className="input-field"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Location FO */}
          <div>
            <label className="block text-label-sm font-medium text-text-secondary mb-1">
              Lokasi Front Office
            </label>
            <select
              value={locationId}
              onChange={(e) => { setLocationId(e.target.value); setPage(1); }}
              className="input-field"
            >
              <option value="">Semua Lokasi</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-label-sm font-medium text-text-secondary mb-1">
              Status Laporan Barang
            </label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="input-field"
            >
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="claimed">Dalam Proses</option>
              <option value="completed">Selesai</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full h-11 rounded-md border border-border-subtle text-text-secondary hover:bg-surface-container-low font-semibold text-label-md flex items-center justify-center gap-1.5 transition-colors shadow-card"
            >
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Items */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-64 rounded-xl bg-surface-container animate-pulse" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-2.5 rounded-lg border border-border-subtle bg-surface-white disabled:opacity-40 hover:bg-surface-container text-text-primary shadow-card transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <span className="text-label-md font-semibold text-text-secondary px-4">
                Halaman {page} dari {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="p-2.5 rounded-lg border border-border-subtle bg-surface-white disabled:opacity-40 hover:bg-surface-container text-text-primary shadow-card transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-surface-white rounded-2xl border border-border-subtle text-text-secondary space-y-3 shadow-card">
          <span className="material-symbols-outlined text-[48px] text-outline mx-auto block">inbox</span>
          <h3 className="text-headline-sm font-semibold text-text-primary">Tidak Ada Barang yang Sesuai</h3>
          <p className="text-body-sm text-text-secondary max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau bersihkan filter untuk menampilkan lebih banyak barang.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-md bg-primary-subtle text-primary-container font-semibold text-label-md hover:bg-primary-subtle/80 transition-colors"
          >
            Bersihkan Filter
          </button>
        </div>
      )}
    </div>
  );
};
