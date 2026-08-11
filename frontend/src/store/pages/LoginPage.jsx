import { useState } from 'react';
import { useNavigate, Navigate, Link, useSearchParams } from 'react-router-dom';
import useAuth from '../../shared/hooks/useAuth';
import { validarRut } from '../../shared/utils/rut';

export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/';
  const { login, sendOtp, verifyOtp, registerForOtp, isAuthenticated } = useAuth();

  // Modo: 'password' | 'otp'
  const [mode, setMode] = useState('otp');

  // Contraseña
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  // OTP — paso: 'email' | 'register' | 'code'
  const [otpStep, setOtpStep]     = useState('email');
  const [otpEmail, setOtpEmail]   = useState('');
  const [otpCode, setOtpCode]     = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');

  // Registro dentro del flujo OTP
  const [regNombre, setRegNombre] = useState('');
  const [regRut, setRegRut]       = useState('');

  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to={redirect} replace />;

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await sendOtp(otpEmail.trim().toLowerCase());
      if (result?.status === 'not_found') {
        setOtpStep('register');
      } else {
        setOtpStep('code');
        setOtpSuccess('Código enviado. Revisa tu correo (puede tardar unos segundos).');
      }
    } catch {
      setError('No se pudo enviar el código. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterForOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (regNombre.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    if (!validarRut(regRut.trim())) {
      setError('RUT inválido. Verifica el número y dígito verificador.');
      return;
    }

    setLoading(true);
    try {
      await registerForOtp(regNombre.trim(), regRut.trim(), otpEmail.trim().toLowerCase());
      const result = await sendOtp(otpEmail.trim().toLowerCase());
      if (result?.status === 'sent') {
        setOtpStep('code');
        setOtpSuccess('Cuenta creada. Código enviado a tu correo.');
      } else {
        setError('No se pudo enviar el código. Intenta de nuevo.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOtp(otpEmail.trim().toLowerCase(), otpCode.trim());
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Código inválido o expirado.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setOtpStep('email');
    setOtpSuccess('');
    setRegNombre('');
    setRegRut('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <Link to="/" className="block text-center text-2xl font-bold text-indigo-700 mb-1">
          🛍️ Bazaar
        </Link>
        <p className="text-sm text-gray-500 text-center mb-5">Inicia sesión en tu cuenta</p>

        {/* Tabs */}
        <div className="flex rounded-lg border border-gray-200 mb-6 overflow-hidden text-sm font-medium">
          <button
            type="button"
            onClick={() => switchMode('otp')}
            className={`flex-1 py-2 transition-colors ${mode === 'otp' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Código por correo
          </button>
          <button
            type="button"
            onClick={() => switchMode('password')}
            className={`flex-1 py-2 transition-colors ${mode === 'password' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Contraseña
          </button>

        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>
        )}
        {otpSuccess && !error && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm">{otpSuccess}</div>
        )}

        {/* ── Modo contraseña ── */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>
        )}

        {/* ── OTP paso 1: ingresar correo ── */}
        {mode === 'otp' && otpStep === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <p className="text-sm text-gray-500">
              Ingresa tu correo y te enviaremos un código de 6 dígitos para acceder sin contraseña.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Verificando…' : 'Enviar código'}
            </button>
          </form>
        )}

        {/* ── OTP paso 2: registrar datos (correo no existe) ── */}
        {mode === 'otp' && otpStep === 'register' && (
          <form onSubmit={handleRegisterForOtp} className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 text-sm text-indigo-700">
              No encontramos una cuenta con <strong>{otpEmail}</strong>. Completa tus datos para crearla y recibir tu código.
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input
                type="text"
                value={regNombre}
                onChange={(e) => setRegNombre(e.target.value)}
                placeholder="Tu nombre"
                required
                minLength={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
              <input
                type="text"
                value={regRut}
                onChange={(e) => setRegRut(e.target.value)}
                placeholder="12.345.678-9"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={otpEmail}
                readOnly
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Creando cuenta…' : 'Crear cuenta y enviar código'}
            </button>
            <button
              type="button"
              onClick={() => { setOtpStep('email'); setError(''); setRegNombre(''); setRegRut(''); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              ← Cambiar correo
            </button>
          </form>
        )}

        {/* ── OTP paso 3: ingresar código ── */}
        {mode === 'otp' && otpStep === 'code' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-gray-500">
              Ingresa el código de 6 dígitos que enviamos a <strong>{otpEmail}</strong>.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código de acceso</label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                required
                maxLength={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center tracking-widest text-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Verificando…' : 'Verificar e ingresar'}
            </button>
            <button
              type="button"
              onClick={() => { setOtpStep('email'); setOtpCode(''); setOtpSuccess(''); setError(''); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Cambiar correo / reenviar código
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          ¿No tienes cuenta?{' '}
          <Link to={`/registro${redirect !== '/' ? `?redirect=${redirect}` : ''}`} className="text-indigo-600 hover:underline font-medium">
            Regístrate gratis
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link to="/admin/login" className="hover:underline">Acceso administrador</Link>
        </p>
      </div>
    </div>
  );
}
