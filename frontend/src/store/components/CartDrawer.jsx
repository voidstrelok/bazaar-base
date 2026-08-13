import { useNavigate } from 'react-router-dom';
import useCart from '../../shared/hooks/useCart';

const FALLBACK_IMG = 'https://placehold.co/160x160/1E1E1E/FFBD00?text=Producto';
const formatPrice = (price) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(price);

export default function CartDrawer() {
  const navigate = useNavigate();
  const items = useCart((s) => s.items);
  const isOpen = useCart((s) => s.isOpen);
  const closeCart = useCart((s) => s.closeCart);
  const removeItem = useCart((s) => s.removeItem);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const total = useCart((s) => s.total());
  const itemCount = useCart((s) => s.itemCount());
  const handleCheckout = () => { closeCart(); navigate('/checkout'); };

  return (
    <>
      {isOpen && <button className="fixed inset-0 z-40 cursor-default bg-black/70 backdrop-blur-[2px]" onClick={closeCart} aria-label="Cerrar carrito" />}
      <aside role="dialog" aria-modal="true" aria-label="Tu carrito" className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-dark-surface shadow-2xl shadow-black/60 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-6">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">Tu selección</p><h2 className="mt-1 font-anta text-2xl text-dark-text">Carrito <span className="font-sans text-sm font-medium text-dark-muted">({itemCount})</span></h2></div>
          <button onClick={closeCart} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-lg text-dark-muted transition hover:border-brand hover:text-brand" aria-label="Cerrar carrito">×</button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {items.length === 0 ? <div className="flex h-full flex-col items-center justify-center px-8 text-center"><div className="grid h-16 w-16 place-items-center rounded-full border border-brand/30 bg-brand/10 text-2xl text-brand">+</div><p className="mt-5 text-lg font-semibold text-dark-text">Tu carrito está vacío</p><p className="mt-2 text-sm leading-6 text-dark-muted">Explora la tienda y guarda aquí tus piezas favoritas.</p><button onClick={closeCart} className="mt-6 rounded-lg border border-brand px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-black">Explorar productos</button></div> : <div className="space-y-4">
            {items.map((item) => <article key={item.productoId} className="flex gap-3 rounded-2xl border border-white/10 bg-dark-surface-2 p-3">
              <img src={item.imagenUrl || FALLBACK_IMG} alt={item.nombre} className="h-20 w-20 shrink-0 rounded-xl object-cover" onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }} />
              <div className="min-w-0 flex-1"><div className="flex gap-2"><h3 className="flex-1 truncate text-sm font-semibold text-dark-text">{item.nombre}</h3><button onClick={() => removeItem(item.productoId)} className="text-xs text-dark-muted transition hover:text-red-300" aria-label={`Eliminar ${item.nombre}`}>Eliminar</button></div><p className="mt-1 text-sm font-semibold text-brand">{formatPrice(item.precio)}</p><div className="mt-3 flex items-center justify-between"><div className="flex items-center rounded-lg border border-white/10"><button onClick={() => updateQuantity(item.productoId, item.cantidad - 1)} className="h-7 w-8 text-dark-muted transition hover:text-brand" aria-label={`Restar una unidad de ${item.nombre}`}>−</button><span className="w-7 text-center text-sm font-semibold text-dark-text">{item.cantidad}</span><button onClick={() => updateQuantity(item.productoId, item.cantidad + 1)} disabled={item.cantidad >= item.stock} className="h-7 w-8 text-dark-muted transition hover:text-brand disabled:opacity-30" aria-label={`Sumar una unidad de ${item.nombre}`}>+</button></div><p className="text-sm font-bold text-dark-text">{formatPrice(item.precio * item.cantidad)}</p></div></div>
            </article>)}
          </div>}
        </div>
        {items.length > 0 && <footer className="border-t border-white/10 bg-dark-bg px-5 py-5 sm:px-6"><div className="flex items-end justify-between"><div><p className="text-xs font-medium uppercase tracking-wider text-dark-muted">Total estimado</p><p className="mt-1 text-2xl font-bold text-dark-text">{formatPrice(total)}</p></div><span className="text-xs text-dark-muted">{itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}</span></div><button onClick={handleCheckout} className="mt-5 w-full rounded-xl bg-brand px-4 py-3.5 text-sm font-bold text-black transition hover:bg-brand-accent">Continuar al pago</button><button onClick={closeCart} className="mt-2 w-full py-2 text-sm font-medium text-dark-muted transition hover:text-brand">Seguir comprando</button></footer>}
      </aside>
    </>
  );
}
