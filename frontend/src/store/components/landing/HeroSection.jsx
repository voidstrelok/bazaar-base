import { useNavigate } from 'react-router-dom';
import { STORE_DESCRIPTION, STORE_NAME } from '../../../shared/utils/storeConfig';

const POINTS = ['Tu propio dominio y marca', 'Pagos y catálogo integrados', 'Lista para vender'];

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative isolate overflow-hidden bg-dark-bg px-4 py-16 sm:py-24 lg:py-28">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_70%_at_90%_25%,rgba(255,189,0,0.16),transparent_65%),radial-gradient(ellipse_60%_50%_at_10%_90%,rgba(255,189,0,0.06),transparent_70%)]" />
      <div className="absolute right-[2%] top-5 -z-10 h-96 w-96 rounded-full border border-brand/10" />
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-20">
        <div className="max-w-2xl">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-brand"><span className="h-2 w-2 rounded-full bg-brand" />Tu negocio, listo para crecer</p>
          <h1 className="text-5xl font-extrabold leading-[1.04] tracking-tight text-dark-text sm:text-6xl lg:text-7xl">Tu propia tienda online. <span className="text-brand">Sin partir de cero.</span></h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-dark-muted sm:text-xl">{STORE_DESCRIPTION} Obtén una tienda profesional con catálogo, pagos, administración de pedidos y una identidad hecha para tu negocio.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button onClick={() => document.getElementById('solucion')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-xl bg-brand px-7 py-4 text-base font-bold text-black shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark">Conoce la solución</button>
            <button onClick={() => navigate('/catalogo')} className="rounded-xl border border-white/15 px-7 py-4 text-base font-semibold text-dark-text transition hover:border-brand/60 hover:text-brand">Ver tienda demo</button>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-5 gap-y-3">
            {POINTS.map((point) => <span key={point} className="flex items-center gap-2 text-sm text-dark-muted"><span className="text-brand">✓</span>{point}</span>)}
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -inset-6 rounded-[2.5rem] bg-brand/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-dark-surface p-5 shadow-2xl shadow-black/40 sm:p-7">
            <div className="mb-8 flex items-center justify-between"><span className="font-anta text-lg tracking-wide text-brand">{STORE_NAME}</span><span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold text-brand">Tu marca aquí</span></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 h-44 rounded-2xl bg-[linear-gradient(135deg,#FFBD00,rgba(255,189,0,0.35))] p-5 text-black sm:h-52"><p className="text-sm font-bold uppercase tracking-wider">Tu vitrina digital</p><p className="mt-12 max-w-[14rem] text-2xl font-extrabold leading-tight">Todo lo que necesitas para vender online.</p></div>
              {[['bg-white/10', 'w-4/5'], ['bg-brand/20', 'w-3/4']].map(([color, width]) => <div key={color} className="rounded-2xl bg-dark-surface-2 p-4"><div className={`mb-7 h-16 rounded-xl ${color}`} /><div className={`h-2 ${width} rounded bg-white/20`} /><div className="mt-2 h-2 w-2/5 rounded bg-brand/60" /></div>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
