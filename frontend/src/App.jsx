import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { ENABLE_CHECKOUT } from './shared/utils/features';
import Navbar from './shared/components/Navbar';

// Store (public)
import LandingPage from './store/pages/LandingPage';
import CatalogoPage from './store/pages/CatalogoPage';
import ProductoDetallePage from './store/pages/ProductoDetallePage';
import CheckoutPage from './store/pages/CheckoutPage';
import PagoResultadoPage from './store/pages/PagoResultadoPage';
import MisPedidosPage from './store/pages/MisPedidosPage';
import LoginPage from './store/pages/LoginPage';
import RegistroPage from './store/pages/RegistroPage';
import MiCuentaPage from './store/pages/MiCuentaPage';
import CartDrawer from './store/components/CartDrawer';

// Admin
import AdminLayout from './admin/layout/AdminLayout';
import DashboardPage from './admin/pages/DashboardPage';
import ProductosAdminPage from './admin/pages/ProductosAdminPage';
import CategoriasAdminPage from './admin/pages/CategoriasAdminPage';
import PedidosAdminPage from './admin/pages/PedidosAdminPage';
import UsuariosAdminPage from './admin/pages/UsuariosAdminPage';
import LoginAdminPage from './admin/pages/LoginAdminPage';

const queryClient = new QueryClient();

function AppLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      {/* Mostrar Navbar solo fuera del panel admin */}
      {!isAdmin && <Navbar />}
      {ENABLE_CHECKOUT && !isAdmin && <CartDrawer />}
      <Routes>
        {/* Tienda pública */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/catalogo" element={<CatalogoPage />} />
        <Route path="/producto/:slug" element={<ProductoDetallePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroPage />} />
        <Route
          path="/mi-cuenta"
          element={
            <ProtectedRoute>
              <MiCuentaPage />
            </ProtectedRoute>
          }
        />
        {ENABLE_CHECKOUT && <Route path="/checkout" element={<CheckoutPage />} />}
        {ENABLE_CHECKOUT && <Route path="/pago/resultado" element={<PagoResultadoPage />} />}
        {ENABLE_CHECKOUT && (
          <Route
            path="/mis-pedidos"
            element={
              <ProtectedRoute>
                <MisPedidosPage />
              </ProtectedRoute>
            }
          />
        )}

        {/* Admin — login */}
        <Route path="/admin/login" element={<LoginAdminPage />} />

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
          <Route path="usuarios" element={<UsuariosAdminPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
