import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../shared/utils/api';

const FALLBACK_IMG = 'https://placehold.co/80x80?text=IMG';

function CategoriaModal({ categoria, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!categoria;

  const [nombre, setNombre] = useState(categoria?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(categoria?.descripcion ?? '');
  const [activo, setActivo] = useState(categoria?.activo ?? true);
  const [imagen, setImagen] = useState(null);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (formData) =>
      isEdit
        ? api.put(`/api/categorias/${categoria.id}`, formData)
        : api.post('/api/categorias', formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categorias'] });
      qc.invalidateQueries({ queryKey: ['categorias'] });
      onClose();
    },
    onError: (err) => {
      setError(err?.response?.data?.message || 'Error al guardar la categoría.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!nombre.trim()) {
      setError('El nombre es requerido.');
      return;
    }
    const formData = new FormData();
    formData.append('nombre', nombre.trim());
    if (descripcion) formData.append('descripcion', descripcion);
    if (isEdit) formData.append('activo', activo);
    if (imagen) formData.append('imagen', imagen);
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          {isEdit ? 'Editar categoría' : 'Nueva categoría'}
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
          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="activo"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="activo" className="text-sm text-gray-700">Activa</label>
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

export default function CategoriasAdminPage() {
  const qc = useQueryClient();
  const [modalCategoria, setModalCategoria] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { data: categorias = [], isLoading, isError } = useQuery({
    queryKey: ['admin-categorias'],
    queryFn: () => api.get('/api/categorias').then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/categorias/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categorias'] });
      qc.invalidateQueries({ queryKey: ['categorias'] });
    },
  });

  const handleDelete = (id) => {
    if (confirm('¿Desactivar esta categoría?')) {
      deleteMutation.mutate(id);
    }
  };

  const openCreate = () => {
    setModalCategoria(null);
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setModalCategoria(cat);
    setShowModal(true);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Categorías</h2>
        <button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          + Nueva categoría
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      )}
      {isError && <p className="text-red-500">Error al cargar categorías.</p>}

      {!isLoading && !isError && (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Imagen</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categorias.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <img
                      src={cat.imagenUrl || FALLBACK_IMG}
                      alt={cat.nombre}
                      className="w-10 h-10 rounded-lg object-cover"
                      onError={(e) => { e.target.src = FALLBACK_IMG; }}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{cat.nombre}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono">{cat.slug}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        cat.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {cat.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(cat)}
                        className="text-indigo-600 hover:underline text-xs"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-500 hover:underline text-xs disabled:opacity-40"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categorias.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    No hay categorías aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <CategoriaModal
          categoria={modalCategoria}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
