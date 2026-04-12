import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ProtectedRoute } from './shared/components/ProtectedRoute';

// Store (public)
import CatalogoPage from './store/pages/CatalogoPage';
import ProductoDetallePage from './store/pages/ProductoDetallePage';

// Admin
import AdminLayout from './admin/layout/AdminLayout';
import DashboardPage from './admin/pages/DashboardPage';
import ProductosAdminPage from './admin/pages/ProductosAdminPage';
import CategoriasAdminPage from './admin/pages/CategoriasAdminPage';
import LoginAdminPage from './admin/pages/LoginAdminPage';

const queryClient = new QueryClient();

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Tienda pública */}
          <Route path="/" element={<CatalogoPage />} />
          <Route path="/producto/:slug" element={<ProductoDetallePage />} />
          <Route path="/login" element={<LoginAdminPage />} />

          {/* Admin — protegido */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="productos" element={<ProductosAdminPage />} />
            <Route path="categorias" element={<CategoriasAdminPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
