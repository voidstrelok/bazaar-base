export const ENABLE_CHECKOUT = import.meta.env.VITE_ENABLE_CHECKOUT !== 'false';

export const CONTACT_TYPE    = import.meta.env.VITE_CONTACT_TYPE   || 'none';
export const CONTACT_VALUE   = import.meta.env.VITE_CONTACT_VALUE  || '';
export const CONTACT_MESSAGE = import.meta.env.VITE_CONTACT_MESSAGE || 'Hola, me interesa el producto: {nombre}';

export function buildContactUrl(productoNombre) {
  const message = CONTACT_MESSAGE.replace('{nombre}', productoNombre);

  if (CONTACT_TYPE === 'whatsapp') {
    const phone = CONTACT_VALUE.replace(/\D/g, '');
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  if (CONTACT_TYPE === 'email') {
    return `mailto:${CONTACT_VALUE}?subject=${encodeURIComponent(message)}`;
  }

  return null;
}
