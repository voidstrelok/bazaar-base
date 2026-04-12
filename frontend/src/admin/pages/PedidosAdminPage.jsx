import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../shared/utils/api';

const ESTADOS_PEDIDO = ['Pendiente', 'Pagado', 'Enviado', 'Entregado', 'Cancelado'];

const estadoBadge = {
  Pendiente: 'bg-yellow-100 text-yellow-700',
  Pagado: 'bg-green-100 text-green-700',
  Enviado: 'bg-blue-100 text-blue-700',
  Entregado: 'bg-indigo-100 text-indigo-700',
  Cancelado: 'bg-red-100 text-red-600',
};

const pagoBadge = {
  Pendiente: 'bg-yellow-50 text-yellow-600',
  Aprobado: 'bg-green-50 text-green-600',
  Rechazado: 'bg-red-50 text-red-500',
  Reembolsado: 'bg-gray-100 text-gray-500',
};

export default function PedidosAdminPage() {
  const qc = useQueryClient();
  const [pagina, setPagina] = useState(1);
  const tamano = 20;

  const { data: pedidos = [], isLoading, isError } = useQuery({
    queryKey: ['admin-pedidos', pagina],
    queryFn: () =>
      api.get('/api/pedidos/admin', { params: { pagina, tamano } }).then((r) => r.data),
    keepPreviousData: true,
  });

  const updateEstadoMutation = useMutation({
    mutationFn: ({ pedidoId, estado }) =>
      api.put(`/api/pedidos/admin/${pedidoId}/estado`, { estado }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-pedidos'] }),
  });

  const handleEstadoChange = (pedidoId, estado) => {
    updateEstadoMutation.mutate({ pedidoId, estado });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Pedidos</h2>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      )}
      {isError && <p className="text-red-500">Error al cargar pedidos.</p>}

      {!isLoading && !isError && (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Total</th>
                  <th className="px-4 py-3 text-left">Gateway</th>
                  <th className="px-4 py-3 text-left">Pago</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Cambiar estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pedidos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-700">#{p.id}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(p.fechaCreacion).toLocaleDateString('es-CL')}
                    </td>
                    <td className="px-4 py-3 font-semibold text-indigo-700">
                      ${p.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-500">{p.gateway}</td>
                    <td className="px-4 py-3">
                      {p.estadoPago ? (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            pagoBadge[p.estadoPago] ?? 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {p.estadoPago}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          estadoBadge[p.estado] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={p.estado}
                        onChange={(e) => handleEstadoChange(p.id, e.target.value)}
                        disabled={updateEstadoMutation.isPending}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      >
                        {ESTADOS_PEDIDO.map((e) => (
                          <option key={e} value={e}>{e}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {pedidos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                      No hay pedidos aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex justify-center gap-2 py-4">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100"
            >
              ← Anterior
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">Pág. {pagina}</span>
            <button
              onClick={() => setPagina((p) => p + 1)}
              disabled={pedidos.length < tamano}
              className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
