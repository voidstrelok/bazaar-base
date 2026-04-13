import { Link } from 'react-router-dom';
import { STORE_NAME, STORE_INSTAGRAM, STORE_FACEBOOK, STORE_TWITTER, STORE_WHATSAPP } from '../../../shared/utils/storeConfig';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-dark-bg border-t border-brand/10 pt-14 pb-8 px-4">
      {/* EDITABLE: footer columns, links, tagline */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
        {/* Links rápidos */}
        <div className="flex flex-col gap-3">
          <h4 className="text-brand font-bold uppercase tracking-wide text-sm">Links rápidos</h4>
          <Link to="/" className="text-dark-muted hover:text-brand text-sm transition-colors">Inicio</Link>
          <Link to="/catalogo" className="text-dark-muted hover:text-brand text-sm transition-colors">Tienda</Link>
          <Link to="/mi-cuenta" className="text-dark-muted hover:text-brand text-sm transition-colors">Mi cuenta</Link>
        </div>

        {/* Contacto / RRSS */}
        <div className="flex flex-col gap-3">
          <h4 className="text-brand font-bold uppercase tracking-wide text-sm">Contacto</h4>
          {STORE_INSTAGRAM && (
            <a
              href={`https://instagram.com/${STORE_INSTAGRAM}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-dark-muted hover:text-brand text-sm transition-colors"
            >
              Instagram
            </a>
          )}
          {STORE_FACEBOOK && (
            <a
              href={`https://facebook.com/${STORE_FACEBOOK}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-dark-muted hover:text-brand text-sm transition-colors"
            >
              Facebook
            </a>
          )}
          {STORE_TWITTER && (
            <a
              href={`https://twitter.com/${STORE_TWITTER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-dark-muted hover:text-brand text-sm transition-colors"
            >
              Twitter / X
            </a>
          )}
          {STORE_WHATSAPP && (
            <a
              href={`https://wa.me/${STORE_WHATSAPP.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-dark-muted hover:text-brand text-sm transition-colors"
            >
              WhatsApp
            </a>
          )}
          {!STORE_INSTAGRAM && !STORE_FACEBOOK && !STORE_TWITTER && !STORE_WHATSAPP && (
            <span className="text-dark-muted text-sm">—</span>
          )}
        </div>

        {/* Legal */}
        <div className="flex flex-col gap-3">
          <h4 className="text-brand font-bold uppercase tracking-wide text-sm">Legal</h4>
          <span className="text-dark-muted text-sm">Términos y condiciones</span>
          <span className="text-dark-muted text-sm">Política de privacidad</span>
        </div>
      </div>

      {/* Tagline + copyright */}
      <div className="max-w-6xl mx-auto border-t border-brand/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <p className="text-dark-muted text-sm font-medium">Tu tienda online, lista para crecer.</p>
        <p className="text-dark-muted text-xs">
          © {year} {STORE_NAME}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
