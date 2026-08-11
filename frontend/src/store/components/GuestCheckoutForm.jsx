import { useState } from 'react';
import useAuth from '../../shared/hooks/useAuth';
import { validarRut } from '../../shared/utils/rut';

export default function GuestCheckoutForm({ onSuccess, onCancel }) {
  const { guestLogin } = useAuth();

  const [nombre, setNombre] = useState('');
  const [rut, setRut]       = useState('');
  const [email, setEmail]   = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (nombre.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.';
    if (!validarRut(rut.trim())) return 'RUT inválido. Verifica el número y dígito verificador.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Correo electrónico inválido.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setError('');
    setLoading(true);
    try {
      await guestLogin(nombre.trim(), rut.trim(), email.trim().toLowerCase());
      onSuccess?.();
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo continuar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-500">
        Ingresa tus datos para continuar. Recibirás la confirmación del pedido en tu correo.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Juan Pérez"
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
        <input
          type="text"
          value={rut}
          onChange={(e) => setRut(e.target.value)}
          placeholder="12345678-9"
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tucorreo@ejemplo.com"
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2.5 rounded-xl font-medium text-sm transition-colors"
      >
        {loading ? 'Verificando…' : 'Continuar como invitado'}
      </button>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
        >
          ← Volver a las opciones
        </button>
      )}
    </form>
  );
}
