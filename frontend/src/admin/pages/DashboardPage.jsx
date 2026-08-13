import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../shared/utils/api';
import useAuth from '../../shared/hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: productosData } = useQuery({ queryKey: ['admin-productos-count'], queryFn: () => api.get('/api/productos', { params: { tamano: 1, soloActivos: false } }).then((r) => r.data) });
  const { data: categoriasData } = useQuery({ queryKey: ['admin-categorias-count'], queryFn: () => api.get('/api/categorias').then((r) => r.data) });
  const stats = [{ label: 'Productos publicados', value: productosData?.total ?? '—', detail: 'Catálogo completo', href: '/admin/productos' }, { label: 'Categorías activas', value: categoriasData?.length ?? '—', detail: 'Colecciones disponibles', href: '/admin/categorias' }];

  return <div className="admin-page"><header className="admin-page-heading"><div><p className="admin-eyebrow">Vista general</p><h2>Hola, {user?.nombre?.split(' ')[0] || 'administrador'}.</h2><p>Gestiona el inventario y las operaciones de tu tienda desde un solo lugar.</p></div><Link to="/admin/productos" className="admin-primary-action">Administrar productos</Link></header><section className="mt-9 grid gap-5 sm:grid-cols-2">{stats.map((stat, index) => <Link key={stat.label} to={stat.href} className="admin-stat-card"><span className="admin-stat-index">0{index + 1}</span><p>{stat.label}</p><strong>{stat.value}</strong><span>{stat.detail} <b>→</b></span></Link>)}</section><section className="admin-welcome-panel"><p className="admin-eyebrow">Accesos directos</p><h3>La tienda está lista para seguir creciendo.</h3><p>Crea productos, organiza sus categorías y mantén el catálogo al día.</p><div><Link to="/admin/productos">Nuevo producto</Link><Link to="/admin/categorias">Gestionar categorías</Link></div></section></div>;
}
