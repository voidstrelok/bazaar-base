import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../../shared/hooks/useAuth';

const navLinks = [
  { to: '/admin', label: '📊 Dashboard', end: true },
  { to: '/admin/productos', label: '📦 Productos' },
  { to: '/admin/categorias', label: '🗂️ Categorías' },
  { to: '/admin/pedidos', label: '🧾 Pedidos' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 text-gray-100 flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">🛒 Bazaar Admin</h1>
          <p className="text-xs text-gray-400 mt-1 truncate">{user?.email}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full text-sm text-gray-400 hover:text-white transition-colors text-left px-3 py-2 rounded-lg hover:bg-gray-700"
          >
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
