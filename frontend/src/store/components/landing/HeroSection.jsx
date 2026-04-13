import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="bg-dark-bg min-h-[85vh] flex items-center justify-center relative overflow-hidden">
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 60%, rgba(255,189,0,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center flex flex-col items-center gap-8">
        {/* EDITABLE: hero title, subtitle, CTA */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-dark-text leading-tight tracking-tight">
          Tu tienda,{' '}
          <span className="text-brand">tu identidad.</span>
        </h1>
        <p className="text-dark-muted text-lg md:text-xl max-w-xl leading-relaxed">
          Lleva tu negocio al mundo digital. Vende tus productos, conecta con tus clientes y cobra
          de forma simple y segura.
        </p>
        <button
          onClick={() => navigate('/catalogo')}
          className="bg-brand hover:bg-brand-dark text-black font-bold text-lg px-8 py-4 rounded-xl transition-colors shadow-lg shadow-brand/20"
        >
          Ver productos →
        </button>
      </div>
    </section>
  );
}
