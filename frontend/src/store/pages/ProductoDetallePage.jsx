import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../shared/utils/api';
import useCart from '../../shared/hooks/useCart';
import { ENABLE_CHECKOUT, CONTACT_TYPE, buildContactUrl } from '../../shared/utils/features';

const FALLBACK_IMG = 'https://placehold.co/1200x900/1E1E1E/FFBD00?text=Producto';
const formatPrice = (price) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(price);

export default function ProductoDetallePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.openCart);
  const { data: producto, isLoading, isError } = useQuery({
    queryKey: ['producto', slug],
    queryFn: () => api.get(`/api/productos/slug/${slug}`).then((r) => r.data),
    enabled: !!slug,
  });

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-dark-bg"><div className="h-10 w-10 animate-spin rounded-full border-2 border-brand/20 border-t-brand" aria-label="Cargando producto" /></div>;

  if (isError || !producto) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-dark-bg px-4 text-center text-dark-text">
      <p className="font-anta text-3xl">Producto no encontrado</p>
      <p className="text-sm text-dark-muted">Puede que ya no esté disponible o que el enlace haya cambiado.</p>
      <button onClick={() => navigate('/catalogo')} className="rounded-lg border border-brand px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-black">Volver a la tienda</button>
    </div>
  );

  const available = producto.stock > 0;
  const addToCart = () => { addItem(producto); openCart(); };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      <div className="mx-auto max-w-7xl px-4 pb-14 pt-7 sm:px-6 sm:pb-20">
        <button onClick={() => navigate('/catalogo')} className="group inline-flex items-center gap-2 text-sm font-medium text-dark-muted transition hover:text-brand"><span className="transition-transform group-hover:-translate-x-1">←</span> Volver a la tienda</button>
        <div className="mt-7 grid overflow-hidden rounded-3xl border border-white/10 bg-dark-surface shadow-2xl shadow-black/20 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[330px] bg-dark-surface-2 sm:min-h-[480px]">
            <img src={producto.imagenUrl || FALLBACK_IMG} alt={producto.nombre} className="absolute inset-0 h-full w-full object-cover" onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }} />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
            <span className={`absolute bottom-5 left-5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${available ? 'bg-brand text-black' : 'bg-red-500 text-white'}`}>{available ? `${producto.stock} disponibles` : 'Agotado'}</span>
          </div>
          <section className="flex flex-col p-6 sm:p-10 lg:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">{producto.categoriaNombre}</p>
            <h1 className="mt-4 font-anta text-3xl leading-tight text-dark-text sm:text-4xl">{producto.nombre}</h1>
            <div className="my-7 h-px w-16 bg-brand" />
            {producto.descripcion ? <p className="max-w-lg whitespace-pre-line text-sm leading-7 text-dark-muted sm:text-base">{producto.descripcion}</p> : <p className="text-sm leading-7 text-dark-muted">Una pieza seleccionada para acompañar tus espacios.</p>}
            <div className="mt-9 flex items-end justify-between gap-4 border-y border-white/10 py-5">
              <div><p className="text-xs font-medium uppercase tracking-wider text-dark-muted">Precio</p><p className="mt-1 text-3xl font-bold tracking-tight text-dark-text">{formatPrice(producto.precio)}</p></div>
              <p className={`rounded-full px-3 py-1.5 text-xs font-semibold ${available ? 'bg-brand/10 text-brand' : 'bg-red-500/10 text-red-300'}`}>{available ? 'Listo para llevar' : 'Sin stock por ahora'}</p>
            </div>
            <div className="mt-7">
              {ENABLE_CHECKOUT ? <button onClick={addToCart} disabled={!available} className="w-full rounded-xl bg-brand px-5 py-4 text-base font-bold text-black transition hover:bg-brand-accent disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-dark-muted">{available ? 'Agregar al carrito' : 'Producto agotado'}</button> : (CONTACT_TYPE !== 'none' && (() => {
                const url = buildContactUrl(producto.nombre);
                return url ? <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full rounded-xl bg-brand px-5 py-4 text-center text-base font-bold text-black transition hover:bg-brand-accent">Consultar disponibilidad</a> : null;
              })())}
              {available && <p className="mt-4 text-center text-xs text-dark-muted">Stock limitado · Consulta por detalles antes de comprar.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
