import { Link } from 'react-router-dom';
import { STORE_NAME } from '../../shared/utils/storeConfig';

export default function AuthLayout({
  eyebrow,
  title,
  description,
  steps,
  currentStep,
  children,
  asideTitle = 'Compra con más calma.',
  asideDescription = 'Tu cuenta guarda tus datos y te permite seguir cada pedido en un solo lugar.',
}) {
  return (
    <main className="auth-page min-h-[calc(100vh-4.5rem)] px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto grid w-full max-w-6xl items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_27rem]">
        <section className="relative hidden overflow-hidden rounded-[2rem] border border-white/10 bg-dark-surface px-10 py-12 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-3 text-sm font-semibold tracking-wide text-dark-text">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-lg text-dark-bg">B</span>
              {STORE_NAME}
            </Link>
            <p className="mt-20 max-w-md font-anta text-5xl leading-[1.05] text-dark-text">{asideTitle}</p>
            <p className="mt-6 max-w-sm text-base leading-7 text-dark-muted">{asideDescription}</p>
          </div>
          <div className="relative grid gap-3 text-sm text-dark-muted">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-dark-bg/60 p-4"><span className="grid h-9 w-9 place-items-center rounded-full bg-brand/15 text-brand">01</span><span>Acceso rápido y seguro</span></div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-dark-bg/60 p-4"><span className="grid h-9 w-9 place-items-center rounded-full bg-brand/15 text-brand">02</span><span>Datos listos para tu próximo pedido</span></div>
          </div>
        </section>

        <section className="auth-card relative overflow-hidden rounded-[2rem] border border-white/10 bg-dark-surface p-6 shadow-2xl shadow-black/20 sm:p-8">
          <div className="absolute inset-x-8 top-0 h-1 rounded-b-full bg-brand" />
          <div className="relative">
            <div className="mb-8 lg:hidden"><Link to="/" className="inline-flex items-center gap-3 text-sm font-semibold tracking-wide text-dark-text"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-lg text-dark-bg">B</span>{STORE_NAME}</Link></div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">{eyebrow}</p>
            <h1 className="mt-3 font-anta text-3xl leading-tight text-dark-text sm:text-4xl">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-dark-muted">{description}</p>
            {steps?.length > 0 && <div className="mt-7 flex items-center gap-2" aria-label="Progreso del formulario">{steps.map((step, index) => { const isCurrent = index === currentStep; const isDone = index < currentStep; return <div key={step} className="flex min-w-0 flex-1 items-center gap-2"><div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${isCurrent || isDone ? 'bg-brand text-dark-bg' : 'bg-dark-bg text-dark-muted'}`}>{isDone ? '✓' : index + 1}</div><span className={`truncate text-xs ${isCurrent ? 'font-semibold text-dark-text' : 'text-dark-muted'}`}>{step}</span>{index < steps.length - 1 && <span className="h-px flex-1 bg-white/10" />}</div>; })}</div>}
            <div className="mt-8">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
