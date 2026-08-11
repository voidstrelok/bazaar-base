/**
 * Valida un RUT chileno (algoritmo módulo 11).
 * Acepta formatos: "12.345.678-9", "12345678-9", "123456789"
 */
export function validarRut(rut) {
  if (!rut || typeof rut !== 'string') return false;

  // Eliminar puntos, trim y convertir a mayúsculas
  const cleaned = rut.replace(/\./g, '').trim().toUpperCase();

  // Admitir también sin guión (ej: "123456789" → "12345678-9")
  const normalized = cleaned.includes('-')
    ? cleaned
    : cleaned.slice(0, -1) + '-' + cleaned.slice(-1);

  if (!/^\d{7,8}-[\dK]$/.test(normalized)) return false;

  const [digits, dv] = normalized.split('-');

  let sum = 0;
  let multiplier = 2;
  for (let i = digits.length - 1; i >= 0; i--) {
    sum += parseInt(digits[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  const expected =
    remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder);

  return dv === expected;
}

/**
 * Formatea un RUT al formato estándar con puntos y guión: "12.345.678-9".
 * Retorna el valor original si no puede normalizarse.
 */
export function formatearRut(rut) {
  if (!rut || typeof rut !== 'string') return rut;

  const cleaned = rut.replace(/\./g, '').trim().toUpperCase();
  const normalized = cleaned.includes('-')
    ? cleaned
    : cleaned.slice(0, -1) + '-' + cleaned.slice(-1);

  if (!/^\d{7,8}-[\dK]$/.test(normalized)) return rut;

  const [digits, dv] = normalized.split('-');
  const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv}`;
}
