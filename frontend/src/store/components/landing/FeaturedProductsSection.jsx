import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../../shared/utils/api';
import ProductoCard from '../ProductoCard';

export default function FeaturedProductsSection() {
  const navigate = useNavigate();

  /* EDITABLE: section title, product count */
  const { data, isLoading, isError } = useQuery({
    queryKey: ['productos-destacados'],
    queryFn: () =>
      api.get('/api/productos', { params: { pagina: 1, tamano: 8 } }).then((r) => r.data),
  });

  return (
    <section className="bg-dark-bg py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-dark-text text-center mb-12">
          Lo que <span className="text-brand">ofrecemos</span>
        </h2>

        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand" />
          </div>
        )}

        {isError && (
          <p className="text-dark-muted text-center py-16">No se pudieron cargar los productos.</p>
        )}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data?.items?.map((producto) => (
              <ProductoCard
                key={producto.id}
                producto={producto}
                onAction={(p) => navigate(`/producto/${p.slug}`)}
              />
            ))}
          </div>
        )}

        <div className="flex justify-center mt-12">
          <button
            onClick={() => navigate('/catalogo')}
            className="border border-brand text-brand hover:bg-brand hover:text-black font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Ver todo el catálogo →
          </button>
        </div>
      </div>
    </section>
  );
}
