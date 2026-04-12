import { useNavigate } from 'react-router-dom';
import useCart from '../../shared/hooks/useCart';

const FALLBACK_IMG = 'https://placehold.co/64x64?text=IMG';

export default function CartDrawer() {
  const navigate = useNavigate();
  const items = useCart((s) => s.items);
  const isOpen = useCart((s) => s.isOpen);
  const closeCart = useCart((s) => s.closeCart);
  const removeItem = useCart((s) => s.removeItem);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const total = useCart((s) => s.total());

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">🛒 Mi carrito</h2>
          <button
            onClick={closeCart}
            className="text-gray-500 hover:text-gray-800 p-1 rounded"
            aria-label="Cerrar carrito"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
              <span className="text-5xl mb-4">🛍️</span>
              <p className="text-sm">Tu carrito está vacío</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productoId} className="flex gap-3 items-start">
                <img
                  src={item.imagenUrl || FALLBACK_IMG}
                  alt={item.nombre}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  onError={(e) => { e.target.src = FALLBACK_IMG; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {item.nombre}
                  </p>
                  <p className="text-sm text-indigo-600 font-semibold">
                    ${item.precio.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => updateQuantity(item.productoId, item.cantidad - 1)}
                      className="w-6 h-6 rounded-full border border-gray-300 text-sm flex items-center justify-center hover:bg-gray-100"
                    >
                      −
                    </button>
                    <span className="text-sm w-4 text-center">{item.cantidad}</span>
                    <button
                      onClick={() => updateQuantity(item.productoId, item.cantidad + 1)}
                      className="w-6 h-6 rounded-full border border-gray-300 text-sm flex items-center justify-center hover:bg-gray-100"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.productoId)}
                      className="ml-auto text-red-400 hover:text-red-600 text-xs"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-700 flex-shrink-0">
                  ${(item.precio * item.cantidad).toFixed(2)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t px-4 py-4 space-y-3">
            <div className="flex justify-between text-base font-bold text-gray-800">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-medium transition-colors"
            >
              Ir al checkout →
            </button>
            <button
              onClick={closeCart}
              className="w-full border border-gray-300 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              Seguir comprando
            </button>
          </div>
        )}
      </div>
    </>
  );
}
