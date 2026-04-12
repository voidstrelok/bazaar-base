const FALLBACK_IMG = 'https://placehold.co/400x300?text=Sin+imagen';

export default function ProductoCard({ producto, onAction, actionLabel = 'Ver detalle', onAddToCart }) {
  return (
    <div className="bg-white rounded-2xl shadow hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
      <img
        src={producto.imagenUrl || FALLBACK_IMG}
        alt={producto.nombre}
        className="w-full h-48 object-cover"
        onError={(e) => { e.target.src = FALLBACK_IMG; }}
      />
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
          {producto.categoriaNombre}
        </p>
        <h3 className="font-semibold text-gray-800 text-lg leading-snug line-clamp-2 flex-1">
          {producto.nombre}
        </h3>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xl font-bold text-indigo-600">
            ${producto.precio.toFixed(2)}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${producto.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {producto.stock > 0 ? `Stock: ${producto.stock}` : 'Agotado'}
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          {onAction && (
            <button
              onClick={() => onAction(producto)}
              className="flex-1 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 text-sm font-medium py-2 rounded-xl transition-colors"
            >
              {actionLabel}
            </button>
          )}
          {onAddToCart && producto.stock > 0 && (
            <button
              onClick={() => onAddToCart(producto)}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-xl transition-colors"
            >
              🛒 Agregar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
