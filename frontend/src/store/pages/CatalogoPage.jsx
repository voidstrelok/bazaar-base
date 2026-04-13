import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../shared/utils/api';
import ProductoCard from '../components/ProductoCard';
import CartIcon from '../components/CartIcon';
import CartDrawer from '../components/CartDrawer';
import useCart from '../../shared/hooks/useCart';
import useAuth from '../../shared/hooks/useAuth';
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
  const { isAuthenticated, user, logout } = useAuth();

  const { data: categoriasData } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => api.get('/api/categorias').then((r) => r.data),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['productos', pagina, categoriaId, debouncedBusqueda],
    queryFn: () =>
      api
        .get('/api/productos', {
          params: {
            pagina,
            tamano: 12,
            categoriaId: categoriaId || undefined,
            busqueda: debouncedBusqueda || undefined,
          },
        })
        .then((r) => r.data),
    keepPreviousData: true,
  });

  const totalPaginas = data ? Math.ceil(data.total / data.tamañoPagina) : 1;

  const handleCategoriaChange = (id) => {
    setCategoriaId(id);
    setPagina(1);
  };

  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
    setPagina(1);
  };

  const handleAddToCart = (producto) => {
    addItem(producto);
    openCart();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-indigo-700 mr-auto">🛍️ Bazaar</h1>
          <input
            type="text"
            placeholder="Buscar productos…"
            value={busqueda}
            onChange={handleBusquedaChange}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {isAuthenticated ? (
            <div className="relative group">
              <button className="text-sm text-gray-700 hover:text-indigo-600 font-medium flex items-center gap-1">
                👤 {user?.nombre?.split(' ')[0]}
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border py-1 w-44 hidden group-hover:block z-20">
                <Link to="/mi-cuenta" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Mi cuenta</Link>
                {ENABLE_CHECKOUT && (
                  <Link to="/mis-pedidos" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Mis pedidos</Link>
                )}
                <button onClick={() => logout()} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Cerrar sesión</button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="text-sm text-indigo-600 hover:underline font-medium">Ingresar</Link>
          )}
          {ENABLE_CHECKOUT && <CartIcon />}
        </div>
      </header>

      {ENABLE_CHECKOUT && <CartDrawer />}

      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar categorías */}
        <aside className="w-48 shrink-0 hidden md:block">
          <h2 className="font-semibold text-gray-700 mb-3">Categorías</h2>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => handleCategoriaChange(null)}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  categoriaId === null
                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Todas
              </button>
            </li>
            {categoriasData?.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => handleCategoriaChange(cat.id)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    categoriaId === cat.id
                      ? 'bg-indigo-100 text-indigo-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {cat.nombre}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Grid de productos */}
        <main className="flex-1">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
            </div>
          )}
          {isError && (
            <p className="text-red-500 text-center py-16">Error al cargar los productos.</p>
          )}
          {!isLoading && !isError && data?.items.length === 0 && (
            <p className="text-gray-500 text-center py-16">No se encontraron productos.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data?.items.map((producto) => (
              <ProductoCard
                key={producto.id}
                producto={producto}
                onAction={(p) => navigate(`/producto/${p.slug}`)}
                onAddToCart={ENABLE_CHECKOUT ? handleAddToCart : undefined}
              />
            ))}
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100"
              >
                ← Anterior
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                {pagina} / {totalPaginas}
              </span>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100"
              >
                Siguiente →
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
