import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import useAuth from '../../shared/hooks/useAuth';
import useCart from '../../shared/hooks/useCart';
import api from '../../shared/utils/api';

const GATEWAY = import.meta.env.VITE_PAYMENT_GATEWAY || 'transbank';

const FALLBACK_IMG = 'https://placehold.co/64x64?text=IMG';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const clearCart = useCart((s) => s.clearCart);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/checkout" replace />;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500 text-lg mb-4">Tu carrito está vacío</p>
        <button
          onClick={() => navigate('/')}
          className="text-indigo-600 hover:underline text-sm"
        >
          ← Volver al catálogo
        </button>
      </div>
    );
  }

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const frontendBase = window.location.origin;

      const payload = {
        items: items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
        urlRetorno: `${frontendBase}/pago/resultado`,
        urlWebhook: `${apiBase}/api/payments`,
      };

      const { data } = await api.post('/api/pedidos', payload);

      clearCart();

      if (data.gateway === 'transbank' && data.token && data.redirectUrl) {
        // Transbank: redirigir con POST (simulado via form)
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.redirectUrl;
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'token_ws';
        input.value = data.token;
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
      } else if (data.redirectUrl) {
        // MercadoPago u otro: redirect directo
        window.location.href = data.redirectUrl;
      } else {
        navigate(`/pago/resultado?estado=aprobado&pedidoId=${data.pedidoId}`);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al procesar el pedido. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Volver
          </button>
          <h1 className="text-xl font-bold text-gray-800">Checkout</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Resumen del pedido */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Resumen del pedido</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.productoId} className="flex gap-4 items-center">
                  <img
                    src={item.imagenUrl || FALLBACK_IMG}
                    alt={item.nombre}
                    className="w-16 h-16 object-cover rounded-lg"
                    onError={(e) => { e.target.src = FALLBACK_IMG; }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{item.nombre}</p>
                    <p className="text-xs text-gray-500">
                      {item.cantidad} × ${item.precio.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-700">
                    ${(item.precio * item.cantidad).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel de pago */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Total</h2>
            <div className="flex justify-between text-2xl font-bold text-indigo-700 mb-6">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <div className="mb-4 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-500 text-center">
              Gateway: <span className="font-semibold text-gray-700 capitalize">{GATEWAY}</span>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 mb-4 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 rounded-xl font-medium text-sm transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Procesando…
                </span>
              ) : (
                'Confirmar y pagar 🔒'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
