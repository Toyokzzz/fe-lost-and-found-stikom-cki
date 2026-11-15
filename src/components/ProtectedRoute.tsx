import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredRole?: string;
  allowedRoles?: string[];
  requireCompleteProfile?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  allowedRoles,
  requireCompleteProfile = false,
}) => {
  const { user, token, isLoading, isProfileComplete } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-primary-subtle text-primary flex items-center justify-center animate-pulse mb-4">
          <span className="material-symbols-outlined text-[28px] animate-spin">progress_activity</span>
        </div>
        <p className="font-headline-sm text-headline-sm text-text-primary font-semibold">Memverifikasi Hak Akses...</p>
        <p className="font-body-sm text-body-sm text-text-secondary mt-1">Mohon tunggu sebentar, sistem sedang memeriksa kredensial keamanan.</p>
      </div>
    );
  }

  // Jika user belum login atau token tidak ada, redirect ke login (/auth)
  if (!user || !token) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  const userRole = (user.role || '').toLowerCase();
  const isSuperAdmin = userRole === 'admin';

  // Role checking
  const rolesToCheck = allowedRoles || (requiredRole ? [requiredRole] : []);
  if (rolesToCheck.length > 0 && !isSuperAdmin) {
    const hasRole = rolesToCheck.some((r) => r.toLowerCase() === userRole);
    if (!hasRole) {
      return (
        <Navigate
          to="/auth"
          state={{
            from: location,
            error: `Akses ditolak. Fitur ini memerlukan hak akses: ${rolesToCheck.join(' atau ')}.`,
          }}
          replace
        />
      );
    }
  }

  // Profile completion check (Requirement 2 & 4 & 5)
  if (requireCompleteProfile && !isSuperAdmin && userRole === 'mahasiswa' && !isProfileComplete) {
    return (
      <Navigate
        to="/profile"
        state={{
          from: location.pathname,
          reason: 'Harap lengkapi data profil Anda (Nama, NIM, Program Studi, Semester, dan Kelas) sebelum membuat laporan!',
        }}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
