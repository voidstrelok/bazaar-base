import { useNavigate } from 'react-router-dom';

export default function AboutSection() {
  const navigate = useNavigate();
  return (
    <section className="bg-dark-bg px-4 py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 rounded-3xl border border-brand/20 bg-[linear-gradient(120deg,rgba(255,189,0,0.12),rgba(255,189,0,0.02)_45%,transparent)] p-8 sm:p-12 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
        <div><p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">Más que una plantilla</p><h2 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-dark-text sm:text-4xl">Un sistema que puedes clonar, adaptar y hacer crecer con tu negocio.</h2><p className="mt-5 max-w-xl text-lg leading-relaxed text-dark-muted">Parte con una base sólida: tienda pública, panel de administración, pagos y operación preparada para tu propia marca y dominio.</p></div>
        <div className="lg:text-right"><button onClick={() => navigate('/catalogo')} className="rounded-xl bg-brand px-7 py-4 font-bold text-black transition hover:bg-brand-dark">Ver tienda demo</button></div>
      </div>
    </section>
  );
}
