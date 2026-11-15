export interface User {
  id: string;
  name: string;
  email: string;
  role: 'mahasiswa' | 'admin_fo' | 'admin_developer' | 'admin' | string;
  phone?: string;
  nim?: string;
  prodi?: string;
  semester?: number;
  kelas?: 'Pagi' | 'Malam' | string;
  isProfileComplete?: boolean;
  daily_report_count?: number;
}

export interface QuotaStatus {
  dailyCount: number;
  maxLimit: number;
  remainingQuota: number;
  resetAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface StorageLocation {
  id: string;
  name: string;
  building: string;
  service_hours: string;
  contact: string;
  is_active: boolean;
}

export interface ReporterProfile {
  id: string;
  name: string;
  nim?: string;
  prodi?: string;
  semester?: number;
  kelas?: string;
  phone?: string;
  email?: string;
}

export interface FoundItem {
  id: string;
  reporter_id: string;
  category_id: string;
  storage_location_id: string;
  title: string;
  description: string;
  photo_url: string;
  location_found: string;
  storage_status: string;
  validation_question?: string;
  hidden_detail?: string;
  status: 'active' | 'claimed' | 'completed';
  created_at: string;
  category?: Category;
  storage_location?: StorageLocation;
  reporter?: ReporterProfile;
  claims?: Claim[];
  item_type?: 'found';
}

export interface LostReport {
  id: string;
  reporter_id: string;
  category_id: string;
  title: string;
  description: string;
  photo_url?: string | null;
  last_seen_location: string;
  hidden_detail?: string;
  contact: string;
  status: 'active' | 'matched' | 'completed' | 'expired';
  expires_at: string;
  created_at: string;
  category?: Category;
  reporter?: ReporterProfile;
  item_type?: 'lost';
}

export type ItemSummary = (FoundItem | LostReport) & { item_type: 'found' | 'lost' };

export interface Claim {
  id: string;
  found_item_id: string;
  lost_report_id?: string;
  claimant_user_id: string;
  claim_code: string;
  claimed_answer?: string;
  attempt_count: number;
  claimed_at: string;
  handed_over_at?: string;
  status: 'claimed' | 'handed_over' | 'rejected';
  found_item?: FoundItem;
  claimant?: ReporterProfile;
}

export interface SystemStats {
  totalFound: number;
  activeFound: number;
  completedFound: number;
  totalLost: number;
  activeLost: number;
  expiredLost: number;
  totalClaims: number;
  completedClaims: number;
  totalUsers: number;
  returnRate: string;
}
