import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../shared/utils/api';

const FALLBACK_IMG = 'https://placehold.co/80x80?text=IMG';

function ProductoModal({ producto, categorias, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!producto;

  const [nombre, setNombre] = useState(producto?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? '');
  const [precio, setPrecio] = useState(producto?.precio?.toString() ?? '');
  const [stock, setStock] = useState(producto?.stock?.toString() ?? '');
  const [categoriaId, setCategoriaId] = useState(producto?.categoriaId?.toString() ?? '');
  const [activo, setActivo] = useState(producto?.activo ?? true);
  const [imagen, setImagen] = useState(null);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (formData) =>
      isEdit
        ? api.put(`/api/productos/${producto.id}`, formData)
        : api.post('/api/productos', formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-productos'] });
      onClose();
    },
    onError: (err) => {
      setError(err?.response?.data?.message || 'Error al guardar el producto.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!nombre.trim()) { setError('El nombre es requerido.'); return; }
    if (!precio || isNaN(parseFloat(precio)) || parseFloat(precio) < 0) {
      setError('El precio debe ser un número válido.');
      return;
    }
    if (!stock || isNaN(parseInt(stock)) || parseInt(stock) < 0) {
      setError('El stock debe ser un número válido.');
      return;
    }
    if (!categoriaId) { setError('Selecciona una categoría.'); return; }

    const formData = new FormData();
    formData.append('nombre', nombre.trim());
    if (descripcion) formData.append('descripcion', descripcion);
    formData.append('precio', parseFloat(precio).toString());
    formData.append('stock', parseInt(stock).toString());
    formData.append('categoriaId', categoriaId);
    if (isEdit) formData.append('activo', activo);
    if (imagen) formData.append('imagen', imagen);
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 my-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          {isEdit ? 'Editar producto' : 'Nuevo producto'}
        </h3>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
              <input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Seleccionar…</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>
          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="activo-prod"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="activo-prod" className="text-sm text-gray-700">Activo</label>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImagen(e.target.files[0])}
              className="text-sm text-gray-600"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2 rounded-lg text-sm font-medium"
            >
              {mutation.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProductosAdminPage() {
  const qc = useQueryClient();
  const [pagina, setPagina] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalProducto, setModalProducto] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-productos', pagina],
    queryFn: () =>
      api
        .get('/api/productos', { params: { pagina, tamano: 15, soloActivos: false } })
        .then((r) => r.data),
    keepPreviousData: true,
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => api.get('/api/categorias').then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/productos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-productos'] }),
  });

  const handleDelete = (id) => {
    if (confirm('¿Desactivar este producto?')) deleteMutation.mutate(id);
  };

  const totalPaginas = data ? Math.ceil(data.total / data.tamañoPagina) : 1;

  const openCreate = () => { setModalProducto(null); setShowModal(true); };
  const openEdit = (p) => { setModalProducto(p); setShowModal(true); };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Productos</h2>
        <button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          + Nuevo producto
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      )}
      {isError && <p className="text-red-500">Error al cargar productos.</p>}

      {!isLoading && !isError && (
        <>
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Imagen</th>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Categoría</th>
                  <th className="px-4 py-3 text-left">Precio</th>
                  <th className="px-4 py-3 text-left">Stock</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.items.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <img
                        src={p.imagenUrl || FALLBACK_IMG}
                        alt={p.nombre}
                        className="w-10 h-10 rounded-lg object-cover"
                        onError={(e) => { e.target.src = FALLBACK_IMG; }}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">
                      {p.nombre}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.categoriaNombre}</td>
                    <td className="px-4 py-3 font-semibold text-indigo-700">
                      ${p.precio.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.stock}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-indigo-600 hover:underline text-xs"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deleteMutation.isPending}
                          className="text-red-500 hover:underline text-xs disabled:opacity-40"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                      No hay productos aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100"
              >
                ← Anterior
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                {pagina} / {totalPaginas}
              </span>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <ProductoModal
          producto={modalProducto}
          categorias={categorias}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
