import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../../shared/hooks/useAuth';
import './admin.css';

const navLinks = [
  { to: '/admin', label: 'Resumen', mark: '01', end: true },
  { to: '/admin/productos', label: 'Productos', mark: '02' },
  { to: '/admin/categorias', label: 'Categorías', mark: '03' },
  { to: '/admin/pedidos', label: 'Pedidos', mark: '04' },
  { to: '/admin/usuarios', label: 'Usuarios', mark: '05' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const handleLogout = async () => { await logout(); navigate('/admin/login'); };
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="admin-theme min-h-screen bg-dark-bg text-dark-text lg:flex">
      {menuOpen && <button className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={closeMenu} aria-label="Cerrar menú" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-dark-surface transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="border-b border-white/10 px-6 py-6"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand">Control de tienda</p><h1 className="mt-2 font-anta text-2xl text-dark-text">Bazaar Admin</h1></div>
        <nav className="flex-1 px-4 py-6" aria-label="Administración"><p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-dark-muted">Navegación</p><div className="space-y-1">{navLinks.map(({ to, label, mark, end }) => <NavLink key={to} to={to} end={end} onClick={closeMenu} className={({ isActive }) => `admin-nav-link ${isActive ? 'admin-nav-link-active' : ''}`}><span className="text-[10px] font-bold tracking-wider opacity-60">{mark}</span>{label}</NavLink>)}</div></nav>
        <div className="border-t border-white/10 p-5"><p className="truncate text-sm font-medium text-dark-text">{user?.nombre || 'Administrador'}</p><p className="mt-1 truncate text-xs text-dark-muted">{user?.email}</p><button onClick={handleLogout} className="mt-4 text-sm font-medium text-dark-muted transition hover:text-brand">Cerrar sesión →</button></div>
      </aside>
      <div className="min-w-0 flex-1"><header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-dark-bg/90 px-4 backdrop-blur lg:hidden"><p className="font-anta text-lg text-dark-text">Bazaar <span className="text-brand">Admin</span></p><button onClick={() => setMenuOpen(true)} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold uppercase tracking-wider text-brand">Menú</button></header><main className="admin-main"><Outlet /></main></div>
    </div>
  );
}
