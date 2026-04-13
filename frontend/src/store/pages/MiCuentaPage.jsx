import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../shared/hooks/useAuth';
import api from '../../shared/utils/api';
import { ENABLE_CHECKOUT } from '../../shared/utils/features';

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

  const handleNombreSubmit = async (e) => {
    e.preventDefault();
    if (nombre.trim().length < 2) { setNombreError('El nombre debe tener al menos 2 caracteres.'); return; }
    setNombreLoading(true);
    setNombreError('');
    setNombreSuccess('');
    try {
      await api.put('/api/auth/me', { nombre: nombre.trim() });
      setNombreSuccess('Nombre actualizado correctamente.');
    } catch (err) {
      setNombreError(err?.response?.data?.message || 'Error al actualizar.');
    } finally {
      setNombreLoading(false);
    }
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (pwForm.nueva.length < 8) { setPwError('La nueva contraseña debe tener al menos 8 caracteres.'); return; }
    if (pwForm.nueva !== pwForm.confirmar) { setPwError('Las contraseñas no coinciden.'); return; }
    setPwLoading(true);
    try {
      await api.put('/api/auth/me', {
        passwordActual: pwForm.actual,
        nuevaPassword: pwForm.nueva,
      });
      setPwSuccess('Contraseña actualizada correctamente.');
      setPwForm({ actual: '', nueva: '', confirmar: '' });
    } catch (err) {
      setPwError(err?.response?.data?.message || 'Error al cambiar la contraseña.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="text-indigo-600 hover:underline text-sm">← Volver a la tienda</Link>
          <h1 className="text-xl font-bold text-gray-800 ml-auto">Mi cuenta</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Datos personales */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="font-semibold text-gray-800 text-lg mb-4">Datos personales</h2>
          <p className="text-sm text-gray-500 mb-1">Correo: <span className="text-gray-800 font-medium">{user?.email}</span></p>

          {nombreSuccess && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 mb-3 text-sm">{nombreSuccess}</div>}
          {nombreError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 mb-3 text-sm">{nombreError}</div>}

          <form onSubmit={handleNombreSubmit} className="flex gap-3 mt-3">
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Tu nombre"
            />
            <button
              type="submit"
              disabled={nombreLoading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {nombreLoading ? 'Guardando…' : 'Guardar'}
            </button>
          </form>
        </div>

        {/* Cambiar contraseña */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="font-semibold text-gray-800 text-lg mb-4">Cambiar contraseña</h2>

          {pwSuccess && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 mb-3 text-sm">{pwSuccess}</div>}
          {pwError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 mb-3 text-sm">{pwError}</div>}

          <form onSubmit={handlePwSubmit} className="space-y-3">
            {[
              { label: 'Contraseña actual', key: 'actual', placeholder: '••••••••' },
              { label: 'Nueva contraseña', key: 'nueva', placeholder: 'Mínimo 8 caracteres' },
              { label: 'Confirmar nueva contraseña', key: 'confirmar', placeholder: 'Repite la nueva contraseña' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type="password"
                  value={pwForm[key]}
                  onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={pwLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {pwLoading ? 'Actualizando…' : 'Cambiar contraseña'}
            </button>
          </form>
        </div>

        {/* Mis pedidos shortcut */}
        {ENABLE_CHECKOUT && (
          <div className="bg-white rounded-2xl shadow p-6 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">Mis pedidos</h2>
              <p className="text-sm text-gray-500 mt-0.5">Ver el historial de tus compras</p>
            </div>
            <Link
              to="/mis-pedidos"
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Ver pedidos →
            </Link>
          </div>
        )}

        {/* Cerrar sesión */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-3">Sesión</h2>
          <button
            onClick={handleLogout}
            className="w-full border border-red-300 text-red-600 hover:bg-red-50 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
