/* EDITABLE: benefits array */
const BENEFITS = [
  {
    emoji: '🛍️',
    title: 'Tus productos, en línea',
    description: 'Publica tu catálogo y llega a más clientes sin esfuerzo.',
  },
  {
    emoji: '🔒',
    title: 'Pagos seguros',
    description: 'Integración con pasarelas de pago confiables para cobrar sin problemas.',
  },
  {
    emoji: '📱',
    title: 'Diseño adaptable',
    description: 'Tu tienda se ve perfecta en celular, tablet y escritorio.',
  },
  {
    emoji: '🎨',
    title: 'Tu identidad de marca',
    description: 'Colores, nombre y estilo adaptados a tu negocio.',
  },
  {
    emoji: '💬',
    title: 'Cerca de tus clientes',
    description: 'Canales de contacto integrados para una atención más cercana.',
  },
  {
    emoji: '⚡',
    title: 'Rápido y simple',
    description: 'Proceso de compra pensado para que tus clientes no abandonen el carrito.',
  },
];

export default function BenefitsSection() {
  return (
    <section className="bg-dark-surface py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-dark-text text-center mb-12">
          ¿Por qué <span className="text-brand">elegirnos?</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="bg-dark-surface-2 rounded-2xl p-6 flex flex-col gap-3 border border-transparent hover:border-brand/40 transition-colors"
            >
              <span className="text-3xl">{b.emoji}</span>
              <h3 className="font-bold text-dark-text text-base leading-snug">{b.title}</h3>
              <p className="text-dark-muted text-sm leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
