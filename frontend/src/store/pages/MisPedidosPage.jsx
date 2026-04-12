import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import useAuth from '../../shared/hooks/useAuth';
import api from '../../shared/utils/api';

const estadoBadge = {
  Pendiente: 'bg-yellow-100 text-yellow-700',
  Pagado: 'bg-green-100 text-green-700',
  Enviado: 'bg-blue-100 text-blue-700',
  Entregado: 'bg-indigo-100 text-indigo-700',
  Cancelado: 'bg-red-100 text-red-600',
};

export default function MisPedidosPage() {
  const { isAuthenticated } = useAuth();

  const { data: pedidos = [], isLoading, isError } = useQuery({
    queryKey: ['mis-pedidos'],
    queryFn: () => api.get('/api/pedidos/mis-pedidos').then((r) => r.data),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/mis-pedidos" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Mis pedidos</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          </div>
        )}
        {isError && (
          <p className="text-red-500 text-center py-16">Error al cargar los pedidos.</p>
        )}
        {!isLoading && !isError && pedidos.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-4">📦</p>
            <p>Aún no tienes pedidos.</p>
          </div>
        )}
        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <div
              key={pedido.id}
              className="bg-white rounded-2xl shadow p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-gray-800">Pedido #{pedido.id}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      estadoBadge[pedido.estado] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {pedido.estado}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(pedido.fechaCreacion).toLocaleDateString('es-CL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {pedido.detalles.length} producto{pedido.detalles.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-indigo-700">
                  ${pedido.total.toFixed(2)}
                </p>
                {pedido.estadoPago && (
                  <p className="text-xs text-gray-400 mt-1">
                    Pago: {pedido.estadoPago}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
