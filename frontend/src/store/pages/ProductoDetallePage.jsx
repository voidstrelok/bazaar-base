import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../shared/utils/api';
import useCart from '../../shared/hooks/useCart';
import { ENABLE_CHECKOUT, CONTACT_TYPE, buildContactUrl } from '../../shared/utils/features';

const FALLBACK_IMG = 'https://placehold.co/600x400?text=Sin+imagen';

export default function ProductoDetallePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const addItem = useCart((s) => s.addItem);

  const { data: producto, isLoading, isError } = useQuery({
    queryKey: ['producto', slug],
    queryFn: () => api.get(`/api/productos/slug/${slug}`).then((r) => r.data),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (isError || !producto) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-lg">Producto no encontrado.</p>
        <button
          onClick={() => navigate('/')}
          className="text-indigo-600 hover:underline text-sm"
        >
          ← Volver al catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:underline text-sm"
          >
            ← Volver al catálogo
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-md overflow-hidden md:flex">
          <img
            src={producto.imagenUrl || FALLBACK_IMG}
            alt={producto.nombre}
            className="w-full md:w-1/2 h-72 md:h-auto object-cover"
            onError={(e) => { e.target.src = FALLBACK_IMG; }}
          />
          <div className="p-8 flex flex-col gap-4 md:w-1/2">
            <p className="text-sm text-indigo-500 uppercase tracking-widest font-medium">
              {producto.categoriaNombre}
            </p>
            <h1 className="text-3xl font-bold text-gray-800">{producto.nombre}</h1>
            {producto.descripcion && (
              <p className="text-gray-600 leading-relaxed">{producto.descripcion}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <span className="text-4xl font-extrabold text-indigo-700">
                ${producto.precio.toFixed(2)}
              </span>
              <span
                className={`text-sm px-3 py-1 rounded-full font-medium ${
                  producto.stock > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {producto.stock > 0 ? `${producto.stock} disponibles` : 'Agotado'}
              </span>
            </div>
            {ENABLE_CHECKOUT ? (
              <button
                onClick={() => { addItem(producto); navigate('/checkout'); }}
                disabled={producto.stock === 0}
                className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors text-lg"
              >
                🛒 Agregar al carrito
              </button>
            ) : (
              CONTACT_TYPE !== 'none' && (() => {
                const url = buildContactUrl(producto.nombre);
                return url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors text-lg block text-center"
                  >
                    {CONTACT_TYPE === 'whatsapp' ? '💬 Consultar por WhatsApp' : '✉️ Consultar por Email'}
                  </a>
                ) : null;
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
