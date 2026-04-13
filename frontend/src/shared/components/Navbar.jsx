import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import CartIcon from '../../store/components/CartIcon';
import { ENABLE_CHECKOUT } from '../utils/features';
import { STORE_NAME } from '../utils/storeConfig';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav
      className="sticky top-0 z-30 bg-dark-bg"
      style={{ borderBottom: '1px solid rgba(255,189,0,0.25)' }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-extrabold text-brand tracking-wide mr-auto"
          onClick={() => setMenuOpen(false)}
        >
          {STORE_NAME}
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-dark-muted hover:text-brand text-sm transition-colors">
            Inicio
          </Link>
          <Link to="/catalogo" className="text-dark-muted hover:text-brand text-sm transition-colors">
            Tienda
          </Link>
          {ENABLE_CHECKOUT && (
            <Link to="/mis-pedidos" className="text-dark-muted hover:text-brand text-sm transition-colors">
              Mis Pedidos
            </Link>
          )}
        </div>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative group">
              <button className="text-sm text-dark-text hover:text-brand font-medium flex items-center gap-1 transition-colors">
                👤 {user?.nombre?.split(' ')[0]}
              </button>
              <div className="absolute right-0 top-full mt-1 bg-dark-surface-2 border border-brand/20 rounded-xl shadow-lg py-1 w-44 hidden group-hover:block z-20">
                <Link
                  to="/mi-cuenta"
                  className="block px-4 py-2 text-sm text-dark-text hover:text-brand hover:bg-dark-surface transition-colors"
                >
                  Mi cuenta
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-dark-surface transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-dark-muted hover:text-brand transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/registro"
                className="text-sm bg-brand hover:bg-brand-dark text-black font-semibold px-4 py-1.5 rounded-lg transition-colors"
              >
                Registrarse
              </Link>
            </>
          )}
          {ENABLE_CHECKOUT && <CartIcon />}
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="flex md:hidden items-center gap-3">
          {ENABLE_CHECKOUT && <CartIcon />}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="text-dark-text hover:text-brand transition-colors p-1"
            aria-label="Abrir menú"
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-dark-surface border-t border-brand/10 px-4 py-4 flex flex-col gap-3">
          <Link
            to="/"
            className="text-dark-text hover:text-brand text-sm transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Inicio
          </Link>
          <Link
            to="/catalogo"
            className="text-dark-text hover:text-brand text-sm transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Tienda
          </Link>
          {ENABLE_CHECKOUT && (
            <Link
              to="/mis-pedidos"
              className="text-dark-text hover:text-brand text-sm transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Mis Pedidos
            </Link>
          )}
          <div className="border-t border-brand/10 pt-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/mi-cuenta"
                  className="block text-dark-text hover:text-brand text-sm mb-2 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Mi cuenta ({user?.nombre?.split(' ')[0]})
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-red-400 text-sm hover:text-red-300 transition-colors"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <div className="flex gap-3">
                <Link
                  to="/login"
                  className="text-sm text-dark-muted hover:text-brand transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/registro"
                  className="text-sm bg-brand hover:bg-brand-dark text-black font-semibold px-4 py-1.5 rounded-lg transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
