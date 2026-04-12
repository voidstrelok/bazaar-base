import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import useCart from '../../shared/hooks/useCart';

export default function PagoResultadoPage() {
  const [params] = useSearchParams();
  const clearCart = useCart((s) => s.clearCart);
  const estado = params.get('estado');
  const pedidoId = params.get('pedidoId');
  const aprobado = estado === 'aprobado';

  useEffect(() => {
    if (aprobado) clearCart();
  }, [aprobado, clearCart]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        {aprobado ? (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-green-700 mb-2">¡Pago aprobado!</h1>
            <p className="text-gray-500 text-sm mb-6">
              Tu pedido #{pedidoId} fue procesado correctamente. Recibirás más información pronto.
            </p>
            <Link
              to="/mis-pedidos"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors"
            >
              Ver mis pedidos
            </Link>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Pago rechazado</h1>
            <p className="text-gray-500 text-sm mb-6">
              Hubo un problema con tu pago. Puedes intentarlo nuevamente.
            </p>
            <Link
              to="/"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors"
            >
              Volver al catálogo
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
