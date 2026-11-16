/**
 * Utility untuk memformat URL gambar barang temuan/hilang agar selalu valid di browser,
 * menangani path Windows (backslash), path relatif tanpa leading slash, nama file langsung,
 * path folder uploads, serta origin backend dinamis.
 */
export const formatImageUrl = (photoUrl?: string | null): string => {
  if (!photoUrl) return '';

  // Data URI atau Blob preview lokal saat upload
  if (photoUrl.startsWith('data:') || photoUrl.startsWith('blob:')) {
    return photoUrl;
  }

  // Ganti backslash Windows (\) menjadi standard URL slash (/)
  let cleanUrl = photoUrl.replace(/\\/g, '/').trim();

  // Jika sudah berupa URL absolut HTTP/HTTPS
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }

  // Normalisasi path folder uploads
  if (cleanUrl.includes('/uploads/')) {
    cleanUrl = cleanUrl.substring(cleanUrl.indexOf('/uploads/'));
  } else if (cleanUrl.includes('uploads/')) {
    cleanUrl = '/' + cleanUrl.substring(cleanUrl.indexOf('uploads/'));
  } else {
    cleanUrl = cleanUrl.startsWith('/') ? `/uploads${cleanUrl}` : `/uploads/${cleanUrl}`;
  }

  // Jika VITE_API_URL diarahkan ke origin backend tertentu (misal: http://localhost:5000/api)
  const apiUrl = (import.meta as any).env?.VITE_API_URL || '';
  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    try {
      const parsed = new URL(apiUrl);
      return `${parsed.origin}${cleanUrl}`;
    } catch {
      // Abaikan jika bukan URL valid
    }
  }

  return cleanUrl;
};
