import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { ReportFoundPage } from './pages/ReportFoundPage';
import { ReportLostPage } from './pages/ReportLostPage';
import { ProfilePage } from './pages/ProfilePage';
import { MyHistoryPage } from './pages/MyHistoryPage';
import { AuthPage } from './pages/AuthPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminFOPanelPage } from './pages/AdminFOPanelPage';
import { ProtectedRoute } from './components/ProtectedRoute';

// Smart dispatcher for /admin based on role
const AdminRedirect: React.FC = () => {
  const { user, isAdminDev, isAdminFO } = useAuth();
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  if (isAdminDev) {
    return <Navigate to="/admin/dev" replace />;
  }
  if (isAdminFO) {
    return <Navigate to="/admin/fo" replace />;
  }
  return (
    <Navigate
      to="/auth"
      state={{ error: 'Akses ditolak. Fitur admin memerlukan hak akses Admin FO atau Admin Developer.' }}
      replace
    />
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-canvas-background text-on-surface">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-gutter-mobile md:px-gutter pt-6 pb-12">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/item/:type/:id" element={<ItemDetailPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/login" element={<Navigate to="/auth" replace />} />

              {/* Protected User Routes (Wajib Profil Lengkap untuk Lapor) */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report-found"
                element={
                  <ProtectedRoute requireCompleteProfile={true}>
                    <ReportFoundPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report-lost"
                element={
                  <ProtectedRoute requireCompleteProfile={true}>
                    <ReportLostPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-history"
                element={
                  <ProtectedRoute>
                    <MyHistoryPage />
                  </ProtectedRoute>
                }
              />

              {/* Panel Admin Front Office (FO) */}
              <Route
                path="/admin/fo"
                element={
                  <ProtectedRoute allowedRoles={['admin_fo', 'admin_developer', 'admin']}>
                    <AdminFOPanelPage />
                  </ProtectedRoute>
                }
              />

              {/* Panel Admin Developer */}
              <Route
                path="/admin/dev"
                element={
                  <ProtectedRoute allowedRoles={['admin_developer', 'admin']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected /admin Root Route with Role Dispatcher */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin_fo', 'admin_developer', 'admin']}>
                    <AdminRedirect />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
