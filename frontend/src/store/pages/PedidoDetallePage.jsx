import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useAuth from '../../shared/hooks/useAuth';
import api from '../../shared/utils/api';

const FALLBACK_IMG = 'https://placehold.co/96x96?text=IMG';

const estadoBadge = {
  Pendiente: 'bg-yellow-100 text-yellow-700',
  Pagado: 'bg-green-100 text-green-700',
  Enviado: 'bg-blue-100 text-blue-700',
  Entregado: 'bg-indigo-100 text-indigo-700',
  Cancelado: 'bg-red-100 text-red-600',
};

const formatMoney = (value) => new Intl.NumberFormat('es-CL', {
  style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
}).format(value);

const gatewayName = (gateway) => gateway === 'mercadopago' ? 'Mercado Pago' : 'Transbank Webpay';

export default function PedidoDetallePage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [retrying, setRetrying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [actionError, setActionError] = useState('');

  const { data: pedido, isLoading, isError } = useQuery({
    queryKey: ['pedido', id],
    queryFn: () => api.get(`/api/pedidos/${id}`).then((response) => response.data),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return <Navigate to={`/login?redirect=/mis-pedidos/${id}`} replace />;

  const retryPayment = async () => {
    setRetrying(true);
    setActionError('');
    try {
      const { data } = await api.post(`/api/pedidos/${id}/retry-payment`);
      if (data.redirectUrl) window.location.href = data.redirectUrl;
    } catch (err) {
      setActionError(err?.response?.data?.message || 'No se pudo iniciar el pago.');
      setRetrying(false);
    }
  };

  const downloadReceipt = async () => {
    setDownloading(true);
    setActionError('');
    try {
      const response = await api.get(`/api/pedidos/${id}/comprobante`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `comprobante-pedido-${id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setActionError(err?.response?.data?.message || 'No se pudo descargar el comprobante.');
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" /></div>;
  if (isError || !pedido) return <div className="min-h-screen bg-gray-50 p-8 text-center text-gray-600"><p>No pudimos encontrar este pedido.</p><Link to="/mis-pedidos" className="mt-4 inline-block text-indigo-600 hover:underline">Volver a mis pedidos</Link></div>;

  const isPaid = pedido.estado === 'Pagado' && pedido.estadoPago === 'Aprobado';
  const canRetry = pedido.estado === 'Pendiente' && pedido.gateway === 'mercadopago';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 pt-6"><Link to="/mis-pedidos" className="text-sm text-gray-500 hover:text-gray-700">← Mis pedidos</Link></div>
      <main className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="md:col-span-2 bg-white rounded-2xl shadow p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-5 mb-5">
            <div><p className="text-sm text-gray-500">Pedido</p><h1 className="text-2xl font-bold text-gray-800">#{pedido.id}</h1><p className="text-sm text-gray-500 mt-1">{new Date(pedido.fechaCreacion).toLocaleString('es-CL')}</p></div>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${estadoBadge[pedido.estado] ?? 'bg-gray-100 text-gray-600'}`}>{pedido.estado}</span>
          </div>
          <h2 className="font-semibold text-gray-800 mb-4">Productos</h2>
          <div className="space-y-4">
            {pedido.detalles.map((item) => (
              <div key={item.productoId} className="flex gap-4 items-center">
                <img src={item.imagenUrl || FALLBACK_IMG} alt={item.productoNombre} onError={(event) => { event.currentTarget.src = FALLBACK_IMG; }} className="w-16 h-16 object-cover rounded-lg" />
                <div className="flex-1"><p className="font-medium text-gray-800">{item.productoNombre}</p><p className="text-sm text-gray-500">{item.cantidad} × {formatMoney(item.precioUnitario)}</p></div>
                <p className="font-semibold text-gray-700">{formatMoney(item.subtotal)}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Pago</h2>
            <dl className="space-y-3 text-sm"><div><dt className="text-gray-500">Estado</dt><dd className="font-medium text-gray-800">{pedido.estadoPago || 'Sin información'}</dd></div><div><dt className="text-gray-500">Método</dt><dd className="font-medium text-gray-800">{gatewayName(pedido.gateway)}</dd></div>{pedido.fechaPago && <div><dt className="text-gray-500">Fecha de pago</dt><dd className="font-medium text-gray-800">{new Date(pedido.fechaPago).toLocaleString('es-CL')}</dd></div>}{pedido.referenciaPago && <div><dt className="text-gray-500">Referencia</dt><dd className="font-mono break-all text-xs text-gray-700">{pedido.referenciaPago}</dd></div>}</dl>
            <div className="border-t mt-5 pt-4 flex justify-between text-lg font-bold text-indigo-700"><span>Total</span><span>{formatMoney(pedido.total)}</span></div>
          </section>
          {actionError && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{actionError}</p>}
          {isPaid && <button onClick={downloadReceipt} disabled={downloading} className="w-full border border-indigo-600 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 py-3 rounded-xl font-medium text-sm">{downloading ? 'Preparando comprobante…' : 'Descargar comprobante PDF'}</button>}
          {canRetry && <button onClick={retryPayment} disabled={retrying} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 rounded-xl font-medium text-sm">{retrying ? 'Redirigiendo…' : 'Continuar pago'}</button>}
        </aside>
      </main>
    </div>
  );
}
