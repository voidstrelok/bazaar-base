import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import useAuth from '../../shared/hooks/useAuth';
import '../layout/admin.css';

export default function LoginAdminPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  if (isAuthenticated && user?.rol === 'ADMIN') return <Navigate to="/admin" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault(); setError('');
    if (!email.trim() || !password.trim()) { setError('Completa tu correo y contraseña.'); return; }
    setLoading(true);
    try { await login(email.trim().toLowerCase(), password); navigate('/admin', { replace: true }); }
    catch (err) { setError(err?.response?.data?.message || 'Credenciales inválidas. Intenta nuevamente.'); }
    finally { setLoading(false); }
  };

  return <div className="admin-login min-h-screen px-4 py-8"><div className="admin-login-decor admin-login-decor-one" /><div className="admin-login-decor admin-login-decor-two" /><main className="admin-login-card"><Link to="/" className="admin-login-brand"><span>B</span><span>Bazaar <b>Admin</b></span></Link><div className="mt-12"><p className="admin-eyebrow">Área restringida</p><h1 className="mt-3 font-anta text-4xl leading-tight text-dark-text">Bienvenido al centro de control.</h1><p className="mt-4 text-sm leading-6 text-dark-muted">Ingresa con tu cuenta administradora para gestionar catálogo, pedidos y accesos.</p></div>{error && <div role="alert" className="admin-form-error">{error}</div>}<form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate><label className="admin-login-field">Correo electrónico<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@ejemplo.com" autoComplete="email" required /></label><label className="admin-login-field">Contraseña<div className="relative"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Tu contraseña" autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Ocultar' : 'Mostrar'}</button></div></label><button type="submit" disabled={loading} className="admin-login-submit">{loading ? 'Validando acceso…' : 'Entrar al panel →'}</button></form><div className="mt-8 flex items-center justify-between gap-3 border-t border-white/10 pt-5"><span className="text-xs text-dark-muted">¿Buscas la tienda?</span><Link to="/" className="text-xs font-bold text-brand hover:text-brand-accent">Volver al inicio</Link></div></main></div>;
}
