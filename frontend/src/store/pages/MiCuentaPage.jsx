import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../shared/hooks/useAuth';
import api from '../../shared/utils/api';
import { ENABLE_CHECKOUT } from '../../shared/utils/features';

function Field({ label, hint, type = 'text', value, onChange, placeholder, required = false }) {
  return <label className="block"><span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-dark-text"><span>{label}</span>{hint && <span className="text-xs font-normal text-dark-muted">{hint}</span>}</span><input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} className="w-full rounded-xl border border-white/15 bg-dark-bg px-4 py-3 text-sm text-dark-text outline-none transition placeholder:text-neutral-600 focus:border-brand focus:ring-2 focus:ring-brand/15" /></label>;
}

function Notice({ children, tone = 'success' }) {
  return <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${tone === 'error' ? 'border-red-300/25 bg-red-400/10 text-red-200' : 'border-green-300/25 bg-green-400/10 text-green-200'}`}>{children}</div>;
}

export default function MiCuentaPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [nombreSuccess, setNombreSuccess] = useState('');
  const [nombreError, setNombreError] = useState('');
  const [nombreLoading, setNombreLoading] = useState(false);
  const [pwForm, setPwForm] = useState({ actual: '', nueva: '', confirmar: '' });
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const handleNombreSubmit = async (event) => {
    event.preventDefault(); setNombreError(''); setNombreSuccess('');
    if (nombre.trim().length < 2) { setNombreError('El nombre debe tener al menos 2 caracteres.'); return; }
    setNombreLoading(true);
    try { await api.put('/api/auth/me', { nombre: nombre.trim() }); setNombreSuccess('Nombre actualizado correctamente.'); }
    catch (err) { setNombreError(err?.response?.data?.message || 'No pudimos actualizar tu nombre.'); }
    finally { setNombreLoading(false); }
  };

  const handlePwSubmit = async (event) => {
    event.preventDefault(); setPwError(''); setPwSuccess('');
    if (pwForm.nueva.length < 8) { setPwError('La nueva contraseña debe tener al menos 8 caracteres.'); return; }
    if (pwForm.nueva !== pwForm.confirmar) { setPwError('Las contraseñas no coinciden.'); return; }
    setPwLoading(true);
    try {
      await api.put('/api/auth/me', { passwordActual: pwForm.actual, nuevaPassword: pwForm.nueva });
      setPwSuccess('Contraseña guardada. Desde ahora también puedes entrar con tu correo y contraseña.');
      setPwForm({ actual: '', nueva: '', confirmar: '' });
    } catch (err) { setPwError(err?.response?.data?.message || 'No pudimos guardar la contraseña.'); }
    finally { setPwLoading(false); }
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  return <div className="min-h-screen bg-gray-50">
    <header className="border-b border-white/10 bg-dark-surface">
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-5"><Link to="/" className="text-sm font-semibold text-dark-muted transition hover:text-brand">← Volver a la tienda</Link><h1 className="ml-auto font-anta text-2xl text-dark-text">Mi cuenta</h1></div>
    </header>
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <section className="rounded-2xl border border-white/10 bg-dark-surface p-6 shadow-2xl shadow-black/10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Perfil</p><h2 className="mt-2 font-anta text-2xl text-dark-text">Tus datos personales</h2><p className="mt-2 text-sm text-dark-muted">Correo: <span className="font-medium text-dark-text">{user?.email}</span></p>
        {nombreSuccess && <div className="mt-4"><Notice>{nombreSuccess}</Notice></div>}{nombreError && <div className="mt-4"><Notice tone="error">{nombreError}</Notice></div>}
        <form onSubmit={handleNombreSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"><div className="flex-1"><Field label="Nombre completo" value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Tu nombre" required /></div><button type="submit" disabled={nombreLoading} className="rounded-xl bg-brand px-5 py-3 text-sm font-bold text-dark-bg transition hover:bg-brand-accent disabled:cursor-not-allowed disabled:opacity-50">{nombreLoading ? 'Guardando…' : 'Guardar nombre'}</button></form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-dark-surface p-6 shadow-2xl shadow-black/10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Acceso</p><h2 className="mt-2 font-anta text-2xl text-dark-text">Crear o cambiar contraseña</h2>
        {pwSuccess && <div className="mt-4"><Notice>{pwSuccess}</Notice></div>}{pwError && <div className="mt-4"><Notice tone="error">{pwError}</Notice></div>}
        <form onSubmit={handlePwSubmit} className="mt-5 space-y-4">
          <Field label="Contraseña actual" type="password" value={pwForm.actual} onChange={(event) => setPwForm((form) => ({ ...form, actual: event.target.value }))} placeholder="Déjalo vacío si nunca tuviste una" />
          <Field label="Nueva contraseña" hint="Mínimo 8 caracteres" type="password" value={pwForm.nueva} onChange={(event) => setPwForm((form) => ({ ...form, nueva: event.target.value }))} placeholder="Elige una contraseña" required />
          <Field label="Confirmar nueva contraseña" type="password" value={pwForm.confirmar} onChange={(event) => setPwForm((form) => ({ ...form, confirmar: event.target.value }))} placeholder="Repite la contraseña" required />
          <button type="submit" disabled={pwLoading} className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-bold text-dark-bg transition hover:bg-brand-accent disabled:cursor-not-allowed disabled:opacity-50">{pwLoading ? 'Guardando contraseña…' : 'Guardar contraseña'}</button>
        </form>
      </section>

      {ENABLE_CHECKOUT && <section className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-dark-surface p-6"><div><h2 className="font-semibold text-dark-text">Mis pedidos</h2><p className="mt-1 text-sm text-dark-muted">Consulta el historial de tus compras.</p></div><Link to="/mis-pedidos" className="shrink-0 rounded-xl bg-brand/10 px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand/20">Ver pedidos →</Link></section>}

      <section className="rounded-2xl border border-red-300/15 bg-dark-surface p-6"><h2 className="font-semibold text-dark-text">Sesión</h2><button onClick={handleLogout} className="mt-4 w-full rounded-xl border border-red-300/30 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-400/10">Cerrar sesión</button></section>
    </main>
  </div>;
}
