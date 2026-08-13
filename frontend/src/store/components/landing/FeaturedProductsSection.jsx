import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../../shared/utils/api';
import ProductoCard from '../ProductoCard';

export default function FeaturedProductsSection() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['productos-destacados'],
    queryFn: () => api.get('/api/productos', { params: { pagina: 1, tamano: 8 } }).then((r) => r.data),
  });

  return (
    <section id="destacados" className="bg-dark-bg px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">Así se verá tu negocio</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-dark-text md:text-4xl">Una vitrina lista para tus productos</h2></div>
          <button onClick={() => navigate('/catalogo')} className="w-fit text-sm font-semibold text-brand transition hover:text-brand-accent">Explorar demo →</button>
        </div>
        {isLoading && <div className="flex justify-center py-16"><div className="h-10 w-10 animate-spin rounded-full border-b-2 border-brand" /></div>}
        {isError && <p className="py-16 text-center text-dark-muted">No se pudieron cargar los productos.</p>}
        {!isLoading && !isError && <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{data?.items?.map((producto) => <ProductoCard key={producto.id} producto={producto} onAction={(p) => navigate(`/producto/${p.slug}`)} />)}</div>}
        <div className="mt-12 flex justify-center"><button onClick={() => navigate('/catalogo')} className="rounded-xl border border-brand px-8 py-3 font-semibold text-brand transition hover:bg-brand hover:text-black">Ver tienda demo →</button></div>
      </div>
    </section>
  );
}
