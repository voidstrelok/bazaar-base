import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../shared/utils/api';
import useAuth from '../../shared/hooks/useAuth';

const formatMoney = (value) => `$${Number(value || 0).toLocaleString('es-CL')}`;
const formatDate = (value) => new Date(value).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
const formatTrendDate = (value) => {
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
};

function MetricCard({ index, label, value, detail, href, tone = 'gold' }) {
  return <Link to={href} className={`admin-metric-card admin-metric-${tone}`}><span className="admin-metric-index">0{index}</span><span className="admin-metric-label">{label}</span><strong>{value}</strong><span className="admin-metric-detail">{detail}<b>→</b></span></Link>;
}

function OrderStatus({ value }) {
  const key = String(value || 'Pendiente').toLowerCase();
  return <span className={`admin-order-status admin-status-${key}`}>{value || 'Pendiente'}</span>;
}

function SalesChart({ points = [] }) {
  const max = Math.max(...points.map((point) => Number(point.ingresos || 0)), 1);

  return <div className="admin-sales-chart" aria-label="Ingresos de los últimos siete días">
    {points.map((point) => <div key={point.fecha} className="admin-chart-column">
      <span className="admin-chart-value">{point.ingresos ? formatMoney(point.ingresos) : '—'}</span>
      <div className="admin-chart-track"><div className="admin-chart-bar" style={{ height: `${Math.max(point.ingresos ? 10 : 3, (point.ingresos / max) * 100)}%` }} /></div>
      <span className="admin-chart-label">{formatTrendDate(point.fecha)}</span>
    </div>)}
  </div>;
}

function Pipeline({ dashboard }) {
  const total = Math.max(dashboard?.totalPedidos || 0, 1);
  const stages = [
    ['Pendientes', dashboard?.pedidosPendientes || 0, 'admin-pipeline-gold'],
    ['Pagados', dashboard?.pedidosPagados || 0, 'admin-pipeline-green'],
    ['Enviados', dashboard?.pedidosEnviados || 0, 'admin-pipeline-blue'],
    ['Entregados', dashboard?.pedidosEntregados || 0, 'admin-pipeline-violet'],
    ['Cancelados', dashboard?.pedidosCancelados || 0, 'admin-pipeline-red'],
  ];

  return <div className="admin-pipeline-list">{stages.map(([label, value, tone]) => <div key={label} className="admin-pipeline-row"><div className="flex items-center justify-between gap-3"><span>{label}</span><strong>{value}</strong></div><div className="admin-pipeline-track"><span className={tone} style={{ width: `${Math.min(100, (value / total) * 100)}%` }} /></div></div>)}</div>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: productosData, isLoading: productsLoading } = useQuery({ queryKey: ['admin-productos-count'], queryFn: () => api.get('/api/productos', { params: { tamano: 1, soloActivos: false } }).then((response) => response.data) });
  const { data: categoriasData, isLoading: categoriesLoading } = useQuery({ queryKey: ['admin-categorias-count'], queryFn: () => api.get('/api/categorias', { params: { soloActivas: false } }).then((response) => response.data) });
  const { data: usuariosData, isLoading: usersLoading } = useQuery({ queryKey: ['admin-usuarios-count'], queryFn: () => api.get('/api/usuarios', { params: { tamano: 1 } }).then((response) => response.data) });
  const dashboardQuery = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => api.get('/api/pedidos/admin/dashboard').then((response) => response.data) });
  const dashboard = dashboardQuery.data;
  const paidOrders = (dashboard?.pedidosPagados || 0) + (dashboard?.pedidosEnviados || 0) + (dashboard?.pedidosEntregados || 0);
  const averageOrder = paidOrders ? dashboard.ingresosTotales / paidOrders : 0;
  const loading = productsLoading || categoriesLoading || usersLoading || dashboardQuery.isLoading;

  return <div className="admin-page">
    <header className="admin-page-heading admin-dashboard-heading"><div><p className="admin-eyebrow">Centro de control · Pedidos e ingresos</p><h2>Hola, {user?.nombre?.split(' ')[0] || 'administrador'}.</h2><p>Una lectura rápida de la operación y el rendimiento de tu tienda.</p></div><Link to="/admin/pedidos" className="admin-primary-action">Ver todos los pedidos →</Link></header>

    <section className="admin-hero-panel"><div><p className="admin-eyebrow">Resumen comercial</p><h3>La tienda se mueve pedido a pedido.</h3><p>Consulta ingresos confirmados, sigue el estado de las compras y entra al detalle cuando necesites tomar acción.</p></div><div className="admin-hero-orbit"><span>BAZAAR</span></div></section>

    {dashboardQuery.isError && <div role="alert" className="admin-feedback admin-feedback-error">No pudimos cargar el resumen de pedidos.</div>}

    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard index={1} label="Ingresos confirmados" value={loading ? '—' : formatMoney(dashboard?.ingresosTotales)} detail="Pagos aprobados" href="/admin/pedidos" />
      <MetricCard index={2} label="Pedidos totales" value={loading ? '—' : dashboard?.totalPedidos ?? 0} detail="Ver operación" href="/admin/pedidos" tone="violet" />
      <MetricCard index={3} label="Ticket promedio" value={loading ? '—' : formatMoney(averageOrder)} detail="Por pedido pagado" href="/admin/pedidos" tone="blue" />
      <MetricCard index={4} label="Pendientes de atención" value={loading ? '—' : dashboard?.pedidosPendientes ?? 0} detail="Preparar pedidos" href="/admin/pedidos" tone="rose" />
    </section>

    <section className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <div className="admin-section-card"><div className="admin-section-heading"><div><p className="admin-eyebrow">Rendimiento reciente</p><h3>Ingresos de los últimos 7 días</h3></div><span className="admin-section-count">CLP</span></div><SalesChart points={dashboard?.ventasPorDia} /></div>
      <div className="admin-section-card"><div className="admin-section-heading"><div><p className="admin-eyebrow">Flujo de pedidos</p><h3>Estado de la operación</h3></div><Link to="/admin/pedidos" className="admin-section-link">Abrir →</Link></div><Pipeline dashboard={dashboard} /></div>
    </section>

    <section className="mt-8 admin-section-card"><div className="admin-section-heading"><div><p className="admin-eyebrow">Actividad</p><h3>Pedidos recientes</h3></div><Link to="/admin/pedidos" className="admin-section-link">Ver todos →</Link></div>
      <div className="admin-recent-orders">{dashboardQuery.isLoading ? [1, 2, 3].map((item) => <div key={item} className="admin-recent-order admin-skeleton" />) : dashboard?.ultimosPedidos?.length ? dashboard.ultimosPedidos.map((pedido) => <Link key={pedido.id} to={`/admin/pedidos/${pedido.id}`} className="admin-recent-order"><span className="admin-order-icon">#</span><span className="min-w-0 flex-1"><strong>Pedido #{pedido.id}</strong><small>{pedido.clienteNombre || 'Cliente'} · {formatDate(pedido.fechaCreacion)}</small></span><span className="text-right"><strong className="block text-brand">{formatMoney(pedido.total)}</strong><OrderStatus value={pedido.estado} /></span></Link>) : <div className="py-8 text-center text-sm text-dark-muted">Todavía no hay pedidos registrados.</div>}</div>
    </section>

    <section className="mt-8 grid gap-4 sm:grid-cols-3"><MetricCard index={5} label="Productos en catálogo" value={loading ? '—' : productosData?.total ?? 0} detail="Revisar inventario" href="/admin/productos" /><MetricCard index={6} label="Categorías" value={loading ? '—' : categoriasData?.length ?? 0} detail="Organizar colección" href="/admin/categorias" tone="violet" /><MetricCard index={7} label="Usuarios registrados" value={loading ? '—' : usuariosData?.total ?? 0} detail="Gestionar accesos" href="/admin/usuarios" tone="blue" /></section>
  </div>;
}
