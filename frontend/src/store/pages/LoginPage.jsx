import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../../shared/hooks/useAuth';
import { validarRut } from '../../shared/utils/rut';
import AuthLayout from '../components/AuthLayout';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({ label, hint, children }) {
  return <div><div className="mb-2 flex items-center justify-between gap-3"><label className="text-sm font-semibold text-dark-text">{label}</label>{hint && <span className="text-xs text-dark-muted">{hint}</span>}</div>{children}</div>;
}

function Input({ className = '', ...props }) {
  return <input {...props} className={`w-full rounded-xl border border-white/15 bg-dark-bg px-4 py-3 text-sm text-dark-text outline-none transition placeholder:text-neutral-600 focus:border-brand focus:ring-2 focus:ring-brand/15 ${className}`} />;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/';
  const { login, sendOtp, verifyOtp, registerForOtp, isAuthenticated } = useAuth();
  const [mode, setMode] = useState('otp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpStep, setOtpStep] = useState('email');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [regNombre, setRegNombre] = useState('');
  const [regRut, setRegRut] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (!resendIn) return undefined;
    const timer = window.setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  if (isAuthenticated) return <Navigate to={redirect} replace />;
  const normalizedOtpEmail = otpEmail.trim().toLowerCase();
  const clearFeedback = () => { setError(''); setMessage(''); };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault(); clearFeedback();
    if (!emailPattern.test(email.trim())) return setError('Ingresa un correo válido.');
    if (!password) return setError('Ingresa tu contraseña.');
    setLoading(true);
    try { await login(email.trim().toLowerCase(), password); navigate(redirect, { replace: true }); }
    catch (err) { setError(err?.response?.data?.message || 'No pudimos iniciar sesión. Revisa tus datos.'); }
    finally { setLoading(false); }
  };

  const handleSendOtp = async (event) => {
    event.preventDefault(); clearFeedback();
    if (!emailPattern.test(normalizedOtpEmail)) return setError('Ingresa un correo válido.');
    setLoading(true);
    try {
      const result = await sendOtp(normalizedOtpEmail);
      if (result?.status === 'not_found') { setOtpStep('register'); setResendIn(0); }
      else { setOtpStep('code'); setResendIn(30); setMessage('Código enviado. Revisa tu correo; puede tardar unos segundos.'); }
    } catch { setError('No pudimos enviar el código. Intenta nuevamente.'); }
    finally { setLoading(false); }
  };

  const handleRegisterForOtp = async (event) => {
    event.preventDefault(); clearFeedback();
    if (regNombre.trim().length < 2) return setError('El nombre debe tener al menos 2 caracteres.');
    if (!validarRut(regRut.trim())) return setError('RUT inválido. Verifica el número y dígito verificador.');
    setLoading(true);
    try { await registerForOtp(regNombre.trim(), regRut.trim(), normalizedOtpEmail); setOtpStep('code'); setResendIn(30); setMessage('Cuenta creada. Te enviamos un código para confirmar tu correo.'); }
    catch (err) { setError(err?.response?.data?.message || 'No pudimos completar el registro.'); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault(); clearFeedback();
    if (otpCode.length !== 6) return setError('Ingresa el código completo de 6 dígitos.');
    setLoading(true);
    try { await verifyOtp(normalizedOtpEmail, otpCode); navigate(redirect, { replace: true }); }
    catch (err) { setError(err?.response?.data?.message || 'Código inválido o expirado.'); }
    finally { setLoading(false); }
  };

  const resendOtp = async () => {
    if (resendIn || loading) return;
    clearFeedback(); setLoading(true);
    try { await sendOtp(normalizedOtpEmail); setResendIn(30); setMessage('Te enviamos un nuevo código.'); }
    catch { setError('No pudimos reenviar el código. Intenta nuevamente.'); }
    finally { setLoading(false); }
  };

  const switchMode = (nextMode) => { setMode(nextMode); setOtpStep('email'); setOtpCode(''); setRegNombre(''); setRegRut(''); setResendIn(0); clearFeedback(); };
  const backToEmail = () => { setOtpStep('email'); setOtpCode(''); setResendIn(0); clearFeedback(); };

  return (
    <AuthLayout eyebrow="Bienvenido de vuelta" title="Entra a tu cuenta" description="Elige cómo quieres acceder. El código por correo es la forma más rápida y no tienes que recordar otra contraseña." steps={mode === 'otp' ? ['Correo', 'Confirmación'] : undefined} currentStep={mode === 'otp' ? (otpStep === 'email' ? 0 : 1) : undefined} asideTitle="Tu próxima compra empieza aquí." asideDescription="Accede a tus pedidos, guarda tus datos y recibe una experiencia más simple cada vez que vuelves.">
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-dark-bg p-1" role="tablist" aria-label="Método de acceso">
        <button type="button" role="tab" aria-selected={mode === 'otp'} onClick={() => switchMode('otp')} className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${mode === 'otp' ? 'bg-brand text-dark-bg' : 'text-dark-muted hover:text-dark-text'}`}>Código por correo</button>
        <button type="button" role="tab" aria-selected={mode === 'password'} onClick={() => switchMode('password')} className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${mode === 'password' ? 'bg-brand text-dark-bg' : 'text-dark-muted hover:text-dark-text'}`}>Contraseña</button>
      </div>
      {error && <div role="alert" className="mb-5 rounded-xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm leading-5 text-red-200">{error}</div>}
      {message && !error && <div role="status" className="mb-5 rounded-xl border border-green-300/25 bg-green-400/10 px-4 py-3 text-sm leading-5 text-green-200">{message}</div>}

      {mode === 'password' && <form onSubmit={handlePasswordSubmit} className="space-y-5" noValidate>
        <Field label="Correo electrónico"><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" autoComplete="email" required /></Field>
        <Field label="Contraseña"><div className="relative"><Input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Tu contraseña" autoComplete="current-password" required className="pr-20" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-dark-muted hover:text-brand">{showPassword ? 'Ocultar' : 'Mostrar'}</button></div></Field>
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-bold text-dark-bg transition hover:bg-brand-accent disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Ingresando…' : 'Iniciar sesión'}</button>
      </form>}

      {mode === 'otp' && otpStep === 'email' && <form onSubmit={handleSendOtp} className="space-y-5" noValidate>
        <div className="rounded-2xl border border-brand/20 bg-brand/10 p-4 text-sm leading-6 text-dark-muted">Te enviaremos un código de 6 dígitos a tu correo. Si aún no tienes cuenta, podrás crearla en el siguiente paso.</div>
        <Field label="Correo electrónico" hint="Sin contraseña"><Input type="email" value={otpEmail} onChange={(event) => setOtpEmail(event.target.value)} placeholder="tu@correo.com" autoComplete="email" required autoFocus /></Field>
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-bold text-dark-bg transition hover:bg-brand-accent disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Comprobando correo…' : 'Continuar con mi correo'}</button>
      </form>}

      {mode === 'otp' && otpStep === 'register' && <form onSubmit={handleRegisterForOtp} className="space-y-5" noValidate>
        <div className="rounded-2xl border border-brand/20 bg-brand/10 p-4 text-sm leading-6 text-dark-muted">No encontramos una cuenta con <strong className="text-dark-text">{normalizedOtpEmail}</strong>. Crea tu perfil para continuar.</div>
        <Field label="Nombre completo"><Input type="text" value={regNombre} onChange={(event) => setRegNombre(event.target.value)} placeholder="Tu nombre" autoComplete="name" minLength={2} required autoFocus /></Field>
        <Field label="RUT" hint="Ej. 12.345.678-9"><Input type="text" value={regRut} onChange={(event) => setRegRut(event.target.value.toUpperCase())} placeholder="12.345.678-9" autoComplete="off" required /></Field>
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-bold text-dark-bg transition hover:bg-brand-accent disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Creando cuenta…' : 'Crear cuenta y enviar código'}</button>
        <button type="button" onClick={backToEmail} className="w-full py-1 text-sm font-semibold text-dark-muted transition hover:text-brand">← Cambiar correo</button>
      </form>}

      {mode === 'otp' && otpStep === 'code' && <form onSubmit={handleVerifyOtp} className="space-y-5" noValidate>
        <div className="text-center"><div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand/15 text-xl text-brand">✦</div><p className="text-sm leading-6 text-dark-muted">Escribe el código que enviamos a <strong className="text-dark-text">{normalizedOtpEmail}</strong>.</p></div>
        <Field label="Código de acceso" hint="6 dígitos"><Input type="text" inputMode="numeric" value={otpCode} onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" autoComplete="one-time-code" maxLength={6} required autoFocus className="text-center text-2xl font-bold tracking-[0.45em]" /></Field>
        <button type="submit" disabled={loading || otpCode.length !== 6} className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-bold text-dark-bg transition hover:bg-brand-accent disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Verificando…' : 'Verificar e ingresar'}</button>
        <div className="flex items-center justify-between gap-3 text-xs"><button type="button" onClick={backToEmail} className="font-semibold text-dark-muted hover:text-brand">← Cambiar correo</button><button type="button" onClick={resendOtp} disabled={Boolean(resendIn) || loading} className="font-semibold text-brand disabled:cursor-not-allowed disabled:text-dark-muted">{resendIn ? `Reenviar en ${resendIn}s` : 'Reenviar código'}</button></div>
      </form>}

      <p className="mt-8 text-center text-sm text-dark-muted">¿No tienes cuenta? <Link to={`/registro${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-semibold text-brand hover:text-brand-accent">Regístrate gratis</Link></p>
      <p className="mt-5 text-center text-xs text-dark-muted/70"><Link to="/admin/login" className="hover:text-brand">Acceso administrador</Link></p>
    </AuthLayout>
  );
}
