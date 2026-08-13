import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../shared/utils/api';
import ProductoCard from '../components/ProductoCard';
import useCart from '../../shared/hooks/useCart';
import { ENABLE_CHECKOUT } from '../../shared/utils/features';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function CatalogoPage() {
  const navigate = useNavigate();
  const [pagina, setPagina] = useState(1);
  const [categoriaId, setCategoriaId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const debouncedBusqueda = useDebounce(busqueda, 300);
  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.openCart);

  const { data: categoriasData = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => api.get('/api/categorias').then((r) => r.data),
  });

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['productos', pagina, categoriaId, debouncedBusqueda],
    queryFn: () => api.get('/api/productos', {
      params: { pagina, tamano: 12, categoriaId: categoriaId || undefined, busqueda: debouncedBusqueda || undefined },
    }).then((r) => r.data),
    keepPreviousData: true,
  });

  const totalPaginas = data ? Math.ceil(data.total / data.tamañoPagina) : 1;
  const selectedCategory = categoriasData.find((cat) => cat.id === categoriaId)?.nombre;
  const hasFilters = categoriaId !== null || busqueda.trim().length > 0;

  const handleCategoriaChange = (id) => {
    setCategoriaId(id);
    setPagina(1);
  };

  const handleAddToCart = (producto) => {
    addItem(producto);
    openCart();
  };

  const clearFilters = () => {
    setCategoriaId(null);
    setBusqueda('');
    setPagina(1);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      <header className="border-b border-brand/15 bg-gradient-to-b from-dark-surface to-dark-bg">
        <div className="mx-auto max-w-7xl px-4 pb-9 pt-12 sm:px-6 sm:pb-12 sm:pt-16">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand">Selección de la casa</p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-anta text-4xl tracking-tight text-dark-text sm:text-5xl">La tienda</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-dark-muted sm:text-base">Encuentra piezas elegidas para darle personalidad a cada rincón.</p>
            </div>
            <div className="relative w-full lg:max-w-sm">
              <label htmlFor="product-search" className="sr-only">Buscar productos</label>
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-brand">⌕</span>
              <input
                id="product-search"
                type="search"
                placeholder="Buscar en la tienda"
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
                className="w-full rounded-xl border border-white/10 bg-dark-surface-2 py-3 pl-10 pr-11 text-sm text-dark-text outline-none transition placeholder:text-dark-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              {busqueda && <button type="button" onClick={() => setBusqueda('')} className="absolute inset-y-0 right-3 px-2 text-xs text-dark-muted transition hover:text-brand" aria-label="Limpiar búsqueda">Limpiar</button>}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 border-b border-white/10 pb-5">
          <div className="flex flex-wrap items-center gap-2" aria-label="Filtrar por categoría">
            <button onClick={() => handleCategoriaChange(null)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${categoriaId === null ? 'bg-brand text-black' : 'border border-white/10 bg-dark-surface text-dark-muted hover:border-brand/60 hover:text-dark-text'}`}>Todo</button>
            {categoriasData.map((cat) => <button key={cat.id} onClick={() => handleCategoriaChange(cat.id)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${categoriaId === cat.id ? 'bg-brand text-black' : 'border border-white/10 bg-dark-surface text-dark-muted hover:border-brand/60 hover:text-dark-text'}`}>{cat.nombre}</button>)}
          </div>
        </div>

        <main>
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-dark-muted" aria-live="polite">
              {isLoading ? 'Buscando piezas...' : `${data?.total ?? 0} ${data?.total === 1 ? 'producto encontrado' : 'productos encontrados'}${selectedCategory ? ` en ${selectedCategory}` : ''}`}
            </p>
            {hasFilters && <button onClick={clearFilters} className="text-sm font-medium text-brand transition hover:text-brand-accent">Restablecer filtros</button>}
          </div>

          {isLoading && <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-brand/20 border-t-brand" aria-label="Cargando productos" /></div>}
          {isError && <p className="rounded-2xl border border-red-400/20 bg-red-400/10 py-12 text-center text-red-300">No pudimos cargar los productos. Intenta nuevamente.</p>}
          {!isLoading && !isError && data?.items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/15 bg-dark-surface px-6 py-16 text-center">
              <p className="text-lg font-semibold">No encontramos resultados</p>
              <p className="mt-2 text-sm text-dark-muted">Prueba con otra búsqueda o explora todas las categorías.</p>
              {hasFilters && <button onClick={clearFilters} className="mt-5 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-brand-accent">Ver todos los productos</button>}
            </div>
          )}
          {!isLoading && !isError && data?.items.length > 0 && <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${isFetching ? 'opacity-60 transition-opacity' : ''}`}>
            {data.items.map((producto) => <ProductoCard key={producto.id} producto={producto} onAction={(p) => navigate(`/producto/${p.slug}`)} onAddToCart={ENABLE_CHECKOUT ? handleAddToCart : undefined} />)}
          </div>}

          {totalPaginas > 1 && <nav className="mt-12 flex items-center justify-center gap-4" aria-label="Paginación de productos">
            <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1} className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-dark-text transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-35">Anterior</button>
            <span className="text-sm text-dark-muted">Página <span className="font-semibold text-dark-text">{pagina}</span> de {totalPaginas}</span>
            <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-dark-text transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-35">Siguiente</button>
          </nav>}
        </main>
      </div>
    </div>
  );
}
