import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../../shared/hooks/useAuth';
import api from '../../shared/utils/api';
import { validarRut } from '../../shared/utils/rut';
import AuthLayout from '../components/AuthLayout';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({ label, children }) { return <div><label className="mb-2 block text-sm font-semibold text-dark-text">{label}</label>{children}</div>; }
function Input({ className = '', ...props }) { return <input {...props} className={`w-full rounded-xl border border-white/15 bg-dark-bg px-4 py-3 text-sm text-dark-text outline-none transition placeholder:text-neutral-600 focus:border-brand focus:ring-2 focus:ring-brand/15 ${className}`} />; }
function PasswordInput({ value, onChange, name, placeholder, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return <div className="relative"><Input type={visible ? 'text' : 'password'} name={name} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} required className="pr-20" /><button type="button" onClick={() => setVisible((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-dark-muted hover:text-brand">{visible ? 'Ocultar' : 'Mostrar'}</button></div>;
}

export default function RegistroPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/';
  const { isAuthenticated, confirmRegistration } = useAuth();
  const [form, setForm] = useState({ nombre: '', rut: '', email: '', password: '', confirmar: '' });
  const [step, setStep] = useState('form');
  const [pendingEmail, setPendingEmail] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => { if (!resendIn) return undefined; const timer = window.setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(timer); }, [resendIn]);
  const passwordScore = useMemo(() => { const password = form.password; return [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password)].filter(Boolean).length; }, [form.password]);
  if (isAuthenticated) return <Navigate to={redirect} replace />;

  const handleChange = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const clearFeedback = () => { setError(''); setMessage(''); };
  const validate = () => {
    if (form.nombre.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.';
    if (!validarRut(form.rut.trim())) return 'RUT inválido. Verifica el número y dígito verificador.';
    if (!emailPattern.test(form.email.trim())) return 'Ingresa un correo válido.';
    if (form.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (form.password !== form.confirmar) return 'Las contraseñas no coinciden.';
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); clearFeedback();
    const validationError = validate(); if (validationError) return setError(validationError);
    setLoading(true);
    try {
      const email = form.email.trim().toLowerCase();
      await api.post('/api/auth/register', { nombre: form.nombre.trim(), rut: form.rut.trim(), email, password: form.password });
      setPendingEmail(email); setConfirmCode(''); setResendIn(30); setMessage('Código enviado. Revisa tu correo para activar tu cuenta.'); setStep('confirm');
    } catch (err) { setError(err?.response?.data?.message || 'No pudimos crear la cuenta. Intenta nuevamente.'); }
    finally { setLoading(false); }
  };

  const handleConfirm = async (event) => {
    event.preventDefault(); clearFeedback();
    if (confirmCode.length !== 6) return setError('Ingresa el código completo de 6 dígitos.');
    setLoading(true);
    try { await confirmRegistration(pendingEmail, confirmCode); navigate(redirect, { replace: true }); }
    catch (err) { setError(err?.response?.data?.message || 'Código inválido o expirado.'); }
    finally { setLoading(false); }
  };

  const resendConfirmation = async () => {
    if (resendIn || loading) return;
    clearFeedback(); setLoading(true);
    try { await api.post('/api/auth/register', { nombre: form.nombre.trim(), rut: form.rut.trim(), email: pendingEmail, password: form.password }); setResendIn(30); setMessage('Te enviamos un nuevo código de confirmación.'); }
    catch (err) { setError(err?.response?.data?.message || 'No pudimos reenviar el código.'); }
    finally { setLoading(false); }
  };

  const backToForm = () => { setStep('form'); setConfirmCode(''); setResendIn(0); clearFeedback(); };

  return (
    <AuthLayout eyebrow="Únete a Bazaar" title="Crea tu cuenta" description="Guarda tus datos, consulta tus pedidos y disfruta una experiencia más rápida en cada visita." steps={['Tus datos', 'Confirmar correo']} currentStep={step === 'form' ? 0 : 1} asideTitle="Una cuenta que trabaja para ti." asideDescription="Menos formularios repetidos, más claridad sobre tus pedidos y todo lo importante en un mismo lugar.">
      {error && <div role="alert" className="mb-5 rounded-xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm leading-5 text-red-200">{error}</div>}
      {message && !error && <div role="status" className="mb-5 rounded-xl border border-green-300/25 bg-green-400/10 px-4 py-3 text-sm leading-5 text-green-200">{message}</div>}
      {step === 'form' && <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field label="Nombre completo"><Input type="text" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Tu nombre" autoComplete="name" minLength={2} required autoFocus /></Field>
        <Field label="RUT"><Input type="text" name="rut" value={form.rut} onChange={(event) => setForm((current) => ({ ...current, rut: event.target.value.toUpperCase() }))} placeholder="12.345.678-9" autoComplete="off" required /></Field>
        <Field label="Correo electrónico"><Input type="email" name="email" value={form.email} onChange={handleChange} placeholder="tu@correo.com" autoComplete="email" required /></Field>
        <Field label="Contraseña"><PasswordInput name="password" value={form.password} onChange={handleChange} placeholder="Mínimo 8 caracteres" autoComplete="new-password" /></Field>
        {form.password && <div className="-mt-2"><div className="flex gap-1" aria-label="Fortaleza de contraseña">{[0, 1, 2].map((bar) => <span key={bar} className={`h-1.5 flex-1 rounded-full ${bar < passwordScore ? (passwordScore === 3 ? 'bg-green-400' : 'bg-brand') : 'bg-white/10'}`} />)}</div><p className="mt-2 text-xs text-dark-muted">Usa 8 caracteres, una mayúscula y un número.</p></div>}
        <Field label="Confirmar contraseña"><PasswordInput name="confirmar" value={form.confirmar} onChange={handleChange} placeholder="Repite tu contraseña" autoComplete="new-password" /></Field>
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-bold text-dark-bg transition hover:bg-brand-accent disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Creando cuenta…' : 'Crear mi cuenta'}</button>
      </form>}
      {step === 'confirm' && <form onSubmit={handleConfirm} className="space-y-5" noValidate>
        <div className="text-center"><div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand/15 text-xl text-brand">✉</div><p className="text-sm leading-6 text-dark-muted">Enviamos un código de 6 dígitos a <strong className="text-dark-text">{pendingEmail}</strong>.</p></div>
        <Field label="Código de confirmación"><Input type="text" inputMode="numeric" value={confirmCode} onChange={(event) => setConfirmCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" autoComplete="one-time-code" maxLength={6} required autoFocus className="text-center text-2xl font-bold tracking-[0.45em]" /></Field>
        <button type="submit" disabled={loading || confirmCode.length !== 6} className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-bold text-dark-bg transition hover:bg-brand-accent disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Activando cuenta…' : 'Confirmar y entrar'}</button>
        <div className="flex items-center justify-between gap-3 text-xs"><button type="button" onClick={backToForm} className="font-semibold text-dark-muted hover:text-brand">← Editar datos</button><button type="button" onClick={resendConfirmation} disabled={Boolean(resendIn) || loading} className="font-semibold text-brand disabled:cursor-not-allowed disabled:text-dark-muted">{resendIn ? `Reenviar en ${resendIn}s` : 'Reenviar código'}</button></div>
      </form>}
      <p className="mt-8 text-center text-sm text-dark-muted">¿Ya tienes cuenta? <Link to={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-semibold text-brand hover:text-brand-accent">Inicia sesión</Link></p>
    </AuthLayout>
  );
}
