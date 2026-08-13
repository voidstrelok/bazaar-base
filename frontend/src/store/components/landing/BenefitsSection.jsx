const BENEFITS = [
  { number: '01', title: 'Una tienda que se ve tuya', description: 'Personaliza nombre, colores, contenido y canales de contacto para reflejar tu marca.' },
  { number: '02', title: 'Vende sin fricción', description: 'Muestra tu catálogo, recibe pedidos y cobra con pasarelas de pago integradas.' },
  { number: '03', title: 'Gestiona todo desde un lugar', description: 'Administra productos, categorías, pedidos y clientes desde un panel simple.' },
];

export default function BenefitsSection() {
  return (
    <section id="solucion" className="bg-dark-surface px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">Hecho para negocios reales</p><h2 className="mt-4 text-3xl font-extrabold tracking-tight text-dark-text sm:text-4xl">La base que necesitas para empezar a vender en línea.</h2></div>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3">
          {BENEFITS.map((benefit) => <article key={benefit.number} className="bg-dark-surface-2 p-7 sm:p-8"><span className="text-sm font-bold text-brand">{benefit.number}</span><h3 className="mt-8 text-xl font-bold text-dark-text">{benefit.title}</h3><p className="mt-3 leading-relaxed text-dark-muted">{benefit.description}</p></article>)}
        </div>
      </div>
    </section>
  );
}
