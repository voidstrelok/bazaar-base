import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ProtectedRoute } from './shared/components/ProtectedRoute';

// Store (public)
import CatalogoPage from './store/pages/CatalogoPage';
import ProductoDetallePage from './store/pages/ProductoDetallePage';
import CheckoutPage from './store/pages/CheckoutPage';
import PagoResultadoPage from './store/pages/PagoResultadoPage';
import MisPedidosPage from './store/pages/MisPedidosPage';

// Admin
import AdminLayout from './admin/layout/AdminLayout';
import DashboardPage from './admin/pages/DashboardPage';
import ProductosAdminPage from './admin/pages/ProductosAdminPage';
import CategoriasAdminPage from './admin/pages/CategoriasAdminPage';
import PedidosAdminPage from './admin/pages/PedidosAdminPage';
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
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/pago/resultado" element={<PagoResultadoPage />} />
          <Route
            path="/mis-pedidos"
            element={
              <ProtectedRoute>
                <MisPedidosPage />
              </ProtectedRoute>
            }
          />

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
            <Route path="pedidos" element={<PedidosAdminPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
