import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import useAuth from '../../shared/hooks/useAuth';
import '../layout/admin.css';

export default function LoginAdminPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  if (isAuthenticated && user?.rol === 'ADMIN') return <Navigate to="/admin" replace />;
  const handleSubmit = async (e) => { e.preventDefault(); setError(''); if (!email.trim() || !password.trim()) { setError('Completa tu correo y contraseña.'); return; } setLoading(true); try { await login(email.trim(), password); navigate('/admin', { replace: true }); } catch (err) { setError(err?.response?.data?.message || 'Credenciales inválidas. Intenta nuevamente.'); } finally { setLoading(false); } };
  return <div className="admin-login min-h-screen px-4"><div className="admin-login-card"><p className="admin-eyebrow">Acceso privado</p><h1 className="font-anta text-3xl text-dark-text">Bazaar Admin</h1><p className="mt-3 text-sm leading-6 text-dark-muted">Ingresa para administrar el catálogo y las operaciones de tu tienda.</p>{error && <div className="admin-form-error">{error}</div>}<form onSubmit={handleSubmit} className="mt-7 space-y-4"><label>Correo electrónico<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@ejemplo.com" required /></label><label>Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required /></label><button type="submit" disabled={loading} className="admin-login-submit">{loading ? 'Ingresando...' : 'Entrar al panel'}</button></form><Link to="/" className="mt-7 inline-block text-sm font-medium text-dark-muted transition hover:text-brand">← Volver a la tienda</Link></div></div>;
}
