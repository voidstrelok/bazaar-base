import { useQuery } from '@tanstack/react-query';
import api from '../../shared/utils/api';
import useAuth from '../../shared/hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: productosData } = useQuery({
    queryKey: ['admin-productos-count'],
    queryFn: () =>
      api.get('/api/productos', { params: { tamano: 1, soloActivos: false } }).then((r) => r.data),
  });

  const { data: categoriasData } = useQuery({
    queryKey: ['admin-categorias-count'],
    queryFn: () => api.get('/api/categorias').then((r) => r.data),
  });

  const stats = [
    {
      label: 'Productos',
      value: productosData?.total ?? '—',
      icon: '📦',
      color: 'bg-indigo-50 text-indigo-700',
    },
    {
      label: 'Categorías',
      value: categoriasData?.length ?? '—',
      icon: '🗂️',
      color: 'bg-purple-50 text-purple-700',
    },
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-1">
        ¡Bienvenido, {user?.nombre}!
      </h2>
      <p className="text-gray-500 mb-8">Panel de administración de Bazaar.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl p-6 ${s.color} shadow-sm`}>
            <p className="text-4xl mb-2">{s.icon}</p>
            <p className="text-3xl font-extrabold">{s.value}</p>
            <p className="text-sm font-medium mt-1 opacity-75">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
