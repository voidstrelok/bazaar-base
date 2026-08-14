import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../shared/utils/api';

const ESTADOS_PEDIDO = ['Pendiente', 'Pagado', 'Enviado', 'Entregado', 'Cancelado'];
const formatMoney = (value) => `$${Number(value || 0).toLocaleString('es-CL')}`;
const formatDate = (value) => new Date(value).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });

function OrderStatus({ value, payment = false }) {
  const key = String(value || 'Pendiente').toLowerCase();
  return <span className={`admin-order-status ${payment ? 'admin-payment-status' : ''} admin-status-${key}`}>{value || 'Sin pago'}</span>;
}

function OrderIcon() { return <span className="admin-order-icon">#</span>; }

function OrderActions({ pedido, updateMutation }) {
  return <div className="flex items-center justify-end gap-2"><Link to={`/admin/pedidos/${pedido.id}`} className="admin-table-action">Detalle</Link><select value={pedido.estado} onChange={(event) => updateMutation.mutate({ pedidoId: pedido.id, estado: event.target.value })} disabled={updateMutation.isPending} aria-label={`Cambiar estado del pedido ${pedido.id}`} className="admin-order-select">{ESTADOS_PEDIDO.map((estado) => <option key={estado} value={estado}>{estado}</option>)}</select></div>;
}

export default function PedidosAdminPage() {
  const qc = useQueryClient();
  const [pagina, setPagina] = useState(1);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const tamano = 20;
  const query = useQuery({ queryKey: ['admin-pedidos', pagina], queryFn: () => api.get('/api/pedidos/admin', { params: { pagina, tamano } }).then((response) => response.data), placeholderData: (previousData) => previousData });
  const dashboardQuery = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => api.get('/api/pedidos/admin/dashboard').then((response) => response.data) });
  const pedidos = query.data?.items || (Array.isArray(query.data) ? query.data : []);
  const total = query.data?.total ?? pedidos.length;
  const totalPaginas = Math.max(1, Math.ceil(total / tamano));
  const summary = useMemo(() => ({
    Pendiente: dashboardQuery.data?.pedidosPendientes ?? 0,
    Pagado: dashboardQuery.data?.pedidosPagados ?? 0,
    Enviado: dashboardQuery.data?.pedidosEnviados ?? 0,
    Entregado: dashboardQuery.data?.pedidosEntregados ?? 0,
  }), [dashboardQuery.data]);
  const updateMutation = useMutation({ mutationFn: ({ pedidoId, estado }) => api.put(`/api/pedidos/admin/${pedidoId}/estado`, { estado }), onSuccess: (_, variables) => { qc.invalidateQueries({ queryKey: ['admin-pedidos'] }); qc.invalidateQueries({ queryKey: ['admin-dashboard'] }); setActionError(''); setActionMessage(`Pedido #${variables.pedidoId} actualizado a ${variables.estado}.`); }, onError: (error) => setActionError(error?.response?.data?.message || 'No pudimos actualizar el pedido.') });

  return <div className="admin-page">
    <header className="admin-page-heading"><div><p className="admin-eyebrow">Operación · Seguimiento</p><h2>Pedidos</h2><p>Revisa clientes, pagos, productos y el estado de cada compra.</p></div><div className="admin-page-counter"><span>{total} pedidos</span><strong>{pagina}/{totalPaginas}</strong></div></header>
    <section className="admin-order-summary">{ESTADOS_PEDIDO.slice(0, 4).map((estado) => <div key={estado}><span>{estado}</span><strong>{summary[estado] || 0}</strong></div>)}</section>
    {actionMessage && <div role="status" className="admin-feedback admin-feedback-success">{actionMessage}</div>}{actionError && <div role="alert" className="admin-feedback admin-feedback-error">{actionError}</div>}{query.isError && <div role="alert" className="admin-feedback admin-feedback-error">No pudimos cargar los pedidos. Intenta nuevamente.</div>}
    <section className="admin-table-card mt-5">{query.isLoading ? <div className="space-y-3 p-5">{[1, 2, 3, 4].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-white/5" />)}</div> : pedidos.length ? <>
      <div className="hidden overflow-x-auto md:block"><table className="w-full text-left text-sm"><thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Pago</th><th>Estado</th><th className="text-right">Acciones</th></tr></thead><tbody>{pedidos.map((pedido) => <tr key={pedido.id}><td><Link to={`/admin/pedidos/${pedido.id}`} className="flex items-center gap-3"><OrderIcon /><span><strong className="block text-dark-text">Pedido #{pedido.id}</strong><span className="text-xs text-dark-muted">{pedido.detalles?.length || 0} producto(s)</span></span></Link></td><td><span className="block max-w-[12rem] truncate text-sm text-dark-text">{pedido.clienteNombre || 'Cliente'}</span><span className="block max-w-[12rem] truncate text-xs text-dark-muted">{pedido.clienteEmail || 'Sin correo'}</span></td><td className="whitespace-nowrap text-xs text-dark-muted">{formatDate(pedido.fechaCreacion)}</td><td className="font-bold text-brand">{formatMoney(pedido.total)}</td><td><OrderStatus value={pedido.estadoPago} payment /></td><td><OrderStatus value={pedido.estado} /></td><td><OrderActions pedido={pedido} updateMutation={updateMutation} /></td></tr>)}</tbody></table></div>
      <div className="divide-y divide-white/10 md:hidden">{pedidos.map((pedido) => <article key={pedido.id} className="p-4"><div className="flex items-start gap-3"><OrderIcon /><div className="min-w-0 flex-1"><Link to={`/admin/pedidos/${pedido.id}`} className="flex items-start justify-between gap-3"><div><strong className="block text-sm text-dark-text">Pedido #{pedido.id}</strong><span className="mt-1 block text-xs text-dark-muted">{pedido.clienteNombre || 'Cliente'} · {formatDate(pedido.fechaCreacion)}</span></div><strong className="text-sm text-brand">{formatMoney(pedido.total)}</strong></Link><div className="mt-3 flex flex-wrap gap-2"><OrderStatus value={pedido.estadoPago} payment /><OrderStatus value={pedido.estado} /></div><OrderActions pedido={pedido} updateMutation={updateMutation} /></div></div></article>)}</div>
    </> : <div className="px-6 py-16 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-xl text-brand">#</div><h3 className="mt-4 font-anta text-xl text-dark-text">No hay pedidos todavía</h3><p className="mt-2 text-sm text-dark-muted">Cuando llegue una compra, aparecerá en este tablero.</p></div>}
      {!query.isLoading && <div className="flex items-center justify-between border-t border-white/10 px-5 py-4 text-sm text-dark-muted"><span>{total} pedidos · Página {pagina}</span><div className="flex gap-2"><button onClick={() => setPagina((page) => Math.max(1, page - 1))} disabled={pagina === 1} className="admin-pagination-button">← Anterior</button><button onClick={() => setPagina((page) => Math.min(totalPaginas, page + 1))} disabled={pagina >= totalPaginas} className="admin-pagination-button">Siguiente →</button></div></div>}
    </section>
  </div>;
}
