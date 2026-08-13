import { ENABLE_CHECKOUT, CONTACT_TYPE, buildContactUrl } from '../../shared/utils/features';

const FALLBACK_IMG = 'https://placehold.co/800x600/1E1E1E/FFBD00?text=Producto';
const formatPrice = (price) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(price);

export default function ProductoCard({ producto, onAction, actionLabel = 'Ver detalle', onAddToCart }) {
  const available = producto.stock > 0;

  return (
    <article className="group flex overflow-hidden rounded-2xl border border-white/10 bg-dark-surface shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-brand/50 hover:shadow-brand/5">
      <div className="flex w-full flex-col">
        <button type="button" onClick={() => onAction?.(producto)} disabled={!onAction} className="relative block aspect-[4/3] w-full overflow-hidden bg-dark-surface-2 text-left disabled:cursor-default">
          <img src={producto.imagenUrl || FALLBACK_IMG} alt={producto.nombre} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          <span className={`absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${available ? 'bg-black/70 text-brand backdrop-blur-sm' : 'bg-red-500/90 text-white'}`}>{available ? `${producto.stock} disponibles` : 'Agotado'}</span>
        </button>
        <div className="flex flex-1 flex-col p-5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">{producto.categoriaNombre}</p>
          <h3 className="line-clamp-2 min-h-[3.5rem] text-lg font-semibold leading-7 text-dark-text">{producto.nombre}</h3>
          <div className="mt-5 flex items-end justify-between gap-3">
            <span className="text-xl font-bold tracking-tight text-dark-text">{formatPrice(producto.precio)}</span>
            {available && <span className="text-xs text-dark-muted">En stock</span>}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
            {onAction && <button onClick={() => onAction(producto)} className="rounded-lg border border-brand/60 px-3 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-black">{actionLabel}</button>}
            {ENABLE_CHECKOUT ? (onAddToCart && available && <button onClick={() => onAddToCart(producto)} className="rounded-lg bg-brand px-3 py-2.5 text-sm font-semibold text-black transition hover:bg-brand-accent">Agregar</button>) : (CONTACT_TYPE !== 'none' && (() => {
              const url = buildContactUrl(producto.nombre);
              return url ? <a href={url} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-brand px-3 py-2.5 text-center text-sm font-semibold text-black transition hover:bg-brand-accent">Consultar</a> : null;
            })())}
          </div>
        </div>
      </div>
    </article>
  );
}
