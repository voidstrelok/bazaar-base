import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../shared/utils/api';

const ESTADOS_PEDIDO = ['Pendiente', 'Pagado', 'Enviado', 'Entregado', 'Cancelado'];
const formatMoney = (value) => `$${Number(value || 0).toLocaleString('es-CL')}`;
const formatDate = (value) => new Date(value).toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short' });

function OrderStatus({ value, payment = false }) {
  const key = String(value || 'Pendiente').toLowerCase();
  return <span className={`admin-order-status ${payment ? 'admin-payment-status' : ''} admin-status-${key}`}>{value || 'Sin pago'}</span>;
}

function DetailCard({ eyebrow, title, children }) {
  return <section className="admin-section-card"><p className="admin-eyebrow">{eyebrow}</p><h3>{title}</h3><div className="mt-5">{children}</div></section>;
}

export default function PedidoDetalleAdminPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['admin-pedido', id], queryFn: () => api.get(`/api/pedidos/admin/${id}`).then((response) => response.data) });
  const pedido = query.data;
  const updateMutation = useMutation({ mutationFn: (estado) => api.put(`/api/pedidos/admin/${id}/estado`, { estado }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pedido', id] }); qc.invalidateQueries({ queryKey: ['admin-pedidos'] }); qc.invalidateQueries({ queryKey: ['admin-dashboard'] }); } });

  if (query.isLoading) return <div className="admin-page"><div className="admin-detail-loading"><div /><div /><div /></div></div>;
  if (query.isError || !pedido) return <div className="admin-page"><div className="admin-feedback admin-feedback-error">No pudimos cargar este pedido.</div><Link to="/admin/pedidos" className="admin-back-link">← Volver a pedidos</Link></div>;

  return <div className="admin-page">
    <div className="admin-detail-back"><button type="button" onClick={() => navigate(-1)} className="admin-back-link">← Volver</button><Link to="/admin/pedidos" className="text-xs font-bold uppercase tracking-[.16em] text-dark-muted hover:text-brand">Todos los pedidos</Link></div>
    <header className="admin-page-heading admin-detail-heading"><div><p className="admin-eyebrow">Pedido · Detalle operativo</p><h2>Pedido #{pedido.id}</h2><p>Creado el {formatDate(pedido.fechaCreacion)}</p></div><div className="flex flex-wrap items-center gap-3"><OrderStatus value={pedido.estadoPago} payment /><OrderStatus value={pedido.estado} /></div></header>

    <section className="admin-detail-kpis"><div><span>Total del pedido</span><strong>{formatMoney(pedido.total)}</strong></div><div><span>Productos</span><strong>{pedido.detalles?.reduce((total, item) => total + item.cantidad, 0) || 0}</strong></div><div><span>Medio de pago</span><strong className="capitalize">{pedido.gateway || '—'}</strong></div><div><span>Referencia</span><strong className="truncate">{pedido.referenciaPago || 'Pendiente'}</strong></div></section>

    <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
      <DetailCard eyebrow="Productos" title="Detalle de la compra"><div className="divide-y divide-white/10">{pedido.detalles?.map((item) => <div key={`${item.productoId}-${item.productoNombre}`} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"><div className="admin-detail-product-image">{item.imagenUrl ? <img src={item.imagenUrl} alt="" /> : <span>{item.productoNombre?.charAt(0)}</span>}</div><div className="min-w-0 flex-1"><p className="truncate font-semibold text-dark-text">{item.productoNombre}</p><p className="mt-1 text-xs text-dark-muted">{item.cantidad} × {formatMoney(item.precioUnitario)}</p></div><strong className="text-sm text-brand">{formatMoney(item.subtotal)}</strong></div>)}</div><div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5"><span className="text-sm text-dark-muted">Total</span><strong className="text-2xl text-brand">{formatMoney(pedido.total)}</strong></div></DetailCard>
      <div className="space-y-5"><DetailCard eyebrow="Cliente" title="Datos de contacto"><div className="space-y-3 text-sm"><div><span className="block text-xs uppercase tracking-wider text-dark-muted">Nombre</span><strong className="mt-1 block text-dark-text">{pedido.clienteNombre || 'Cliente'}</strong></div><div><span className="block text-xs uppercase tracking-wider text-dark-muted">Correo</span><a href={pedido.clienteEmail ? `mailto:${pedido.clienteEmail}` : undefined} className="mt-1 block truncate text-brand">{pedido.clienteEmail || 'Sin correo registrado'}</a></div></div></DetailCard><DetailCard eyebrow="Operación" title="Actualizar estado"><label className="block text-xs uppercase tracking-wider text-dark-muted" htmlFor="order-status">Estado del pedido</label><select id="order-status" value={pedido.estado} onChange={(event) => updateMutation.mutate(event.target.value)} disabled={updateMutation.isPending} className="admin-order-select mt-2 w-full">{ESTADOS_PEDIDO.map((estado) => <option key={estado} value={estado}>{estado}</option>)}</select>{updateMutation.isSuccess && <p className="mt-3 text-xs text-green-300">Estado actualizado correctamente.</p>}{updateMutation.isError && <p className="mt-3 text-xs text-red-300">No pudimos actualizar el estado.</p>}</DetailCard></div>
    </div>
  </div>;
}
