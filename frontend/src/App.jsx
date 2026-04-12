import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// ── Placeholders ─────────────────────────────────────────────────────────────
function StorePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <h1 className="text-3xl font-bold text-primary">🛍️ Tienda Pública</h1>
    </div>
  );
}

function AdminPage() {
  // TODO Fase 1 — Proteger con verificación de rol ADMIN desde JWT
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold text-secondary">🔧 Panel Admin</h1>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StorePage />} />
        <Route path="/admin/*" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
