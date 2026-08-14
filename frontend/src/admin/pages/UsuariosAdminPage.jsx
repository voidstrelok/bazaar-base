import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../shared/utils/api';
import useAuth from '../../shared/hooks/useAuth';

const tamano = 20;

function Avatar({ name }) {
  const initials = (name || '?').split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-sm font-bold text-brand">{initials}</span>;
}

function RoleBadge({ role }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${role === 'ADMIN' ? 'bg-purple-400/15 text-purple-200' : 'bg-sky-400/15 text-sky-200'}`}>{role === 'ADMIN' ? 'Administrador' : 'Cliente'}</span>;
}

function StatusBadge({ active }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${active ? 'bg-green-400/15 text-green-200' : 'bg-red-400/15 text-red-200'}`}><span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-green-300' : 'bg-red-300'}`} />{active ? 'Activo' : 'Inactivo'}</span>;
}

function EmptyState({ hasFilters, onClear }) {
  return <div className="px-6 py-16 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-2xl text-brand">⌕</div><h3 className="mt-4 font-anta text-xl text-dark-text">{hasFilters ? 'No encontramos coincidencias' : 'Todavía no hay usuarios'}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-dark-muted">{hasFilters ? 'Prueba con otra búsqueda o limpia los filtros para ver todos los registros.' : 'Los usuarios registrados aparecerán aquí.'}</p>{hasFilters && <button onClick={onClear} className="mt-5 text-sm font-semibold text-brand hover:text-brand-accent">Limpiar filtros</button>}</div>;
}

function EditUserModal({ user, selfId, onClose, onSaved }) {
  const [form, setForm] = useState({ nombre: user.nombre, rol: user.rol, activo: user.activo });
  const [error, setError] = useState('');
  const mutation = useMutation({
    mutationFn: () => api.put(`/api/usuarios/${user.id}`, { nombre: form.nombre.trim(), rol: form.rol, activo: form.activo }),
    onSuccess: onSaved,
    onError: (err) => setError(err?.response?.data?.message || 'No pudimos actualizar el usuario.'),
  });

  const submit = (event) => {
    event.preventDefault();
    if (form.nombre.trim().length < 2) { setError('El nombre debe tener al menos 2 caracteres.'); return; }
    setError(''); mutation.mutate();
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-8" role="dialog" aria-modal="true" aria-labelledby="edit-user-title">
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-dark-surface p-6 shadow-2xl sm:p-7">
      <div className="flex items-start justify-between gap-4"><div><p className="admin-eyebrow">Gestión de cuenta</p><h3 id="edit-user-title" className="mt-2 font-anta text-2xl text-dark-text">Editar usuario</h3></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-xl leading-none text-dark-muted hover:bg-white/10 hover:text-dark-text" aria-label="Cerrar">×</button></div>
      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-dark-bg/60 p-3"><Avatar name={user.nombre} /><div className="min-w-0"><p className="truncate text-sm font-semibold text-dark-text">{user.nombre}</p><p className="truncate text-xs text-dark-muted">{user.email}</p></div><div className="ml-auto"><StatusBadge active={user.activo} /></div></div>
      {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}
      <form onSubmit={submit} className="mt-6 space-y-5">
        <label className="block"><span className="mb-2 block text-sm font-semibold text-dark-text">Nombre completo</span><input type="text" value={form.nombre} onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))} className="w-full rounded-xl border border-white/15 bg-dark-bg px-4 py-3 text-sm text-dark-text outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" required /></label>
        <label className="block"><span className="mb-2 block text-sm font-semibold text-dark-text">Rol</span><select value={form.rol} onChange={(event) => setForm((current) => ({ ...current, rol: event.target.value }))} className="w-full rounded-xl border border-white/15 bg-dark-bg px-4 py-3 text-sm text-dark-text outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"><option value="CLIENTE">Cliente</option><option value="ADMIN">Administrador</option></select></label>
        <label className={`flex items-center justify-between gap-4 rounded-2xl border p-4 ${form.activo ? 'border-green-300/20 bg-green-400/5' : 'border-white/10 bg-dark-bg/40'}`}><span><span className="block text-sm font-semibold text-dark-text">Acceso habilitado</span><span className="mt-1 block text-xs text-dark-muted">{form.activo ? 'Puede iniciar sesión y operar normalmente.' : 'No podrá iniciar sesión hasta reactivarlo.'}</span></span><input type="checkbox" checked={form.activo} onChange={(event) => setForm((current) => ({ ...current, activo: event.target.checked }))} disabled={user.id === selfId} className="h-5 w-5 accent-brand" /></label>
        {user.id === selfId && <p className="text-xs text-dark-muted">No puedes desactivar tu propia cuenta.</p>}
        <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-dark-muted transition hover:bg-white/5 hover:text-dark-text">Cancelar</button><button type="submit" disabled={mutation.isPending} className="flex-1 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-dark-bg transition hover:bg-brand-accent disabled:cursor-not-allowed disabled:opacity-50">{mutation.isPending ? 'Guardando…' : 'Guardar cambios'}</button></div>
      </form>
    </div>
  </div>;
}

function ConfirmStatusModal({ user, nextActive, onClose, onConfirm, isPending, error }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true" aria-labelledby="status-user-title"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-dark-surface p-6 shadow-2xl sm:p-7"><div className="flex items-center gap-3"><Avatar name={user.nombre} /><div><h3 id="status-user-title" className="font-anta text-2xl text-dark-text">{nextActive ? 'Activar usuario' : 'Desactivar usuario'}</h3><p className="mt-1 text-sm text-dark-muted">{user.nombre}</p></div></div><p className="mt-6 text-sm leading-6 text-dark-muted">{nextActive ? 'El usuario podrá volver a iniciar sesión y acceder a sus funciones.' : 'El usuario perderá el acceso, pero sus datos e historial se conservarán.'}</p>{error && <div role="alert" className="mt-4 rounded-xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}<div className="mt-6 flex gap-3"><button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-dark-muted hover:bg-white/5 hover:text-dark-text">Cancelar</button><button type="button" onClick={onConfirm} disabled={isPending} className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${nextActive ? 'bg-brand text-dark-bg hover:bg-brand-accent' : 'bg-red-400/15 text-red-200 hover:bg-red-400/25'}`}>{isPending ? 'Aplicando…' : nextActive ? 'Activar usuario' : 'Desactivar'}</button></div></div></div>;
}

export default function UsuariosAdminPage() {
  const qc = useQueryClient();
  const { user: self } = useAuth();
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaInput, setBusquedaInput] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [editingUser, setEditingUser] = useState(null);
  const [statusUser, setStatusUser] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const query = useQuery({
    queryKey: ['admin-usuarios', pagina, busqueda, filtroRol, filtroEstado],
    queryFn: () => api.get('/api/usuarios', { params: { pagina, tamano, busqueda: busqueda || undefined, rol: filtroRol !== 'todos' ? filtroRol : undefined, activo: filtroEstado === 'todos' ? undefined : filtroEstado === 'activos' } }).then((response) => response.data),
    placeholderData: (previousData) => previousData,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, activo }) => api.put(`/api/usuarios/${id}`, { activo }),
    onSuccess: (_, variables) => { qc.invalidateQueries({ queryKey: ['admin-usuarios'] }); setStatusUser(null); setActionError(''); setActionMessage(variables.activo ? 'Usuario activado correctamente.' : 'Usuario desactivado. Sus datos se conservaron.'); },
    onError: (err) => setActionError(err?.response?.data?.message || 'No pudimos cambiar el estado del usuario.'),
  });

  const applySearch = (event) => { event.preventDefault(); setBusqueda(busquedaInput.trim()); setPagina(1); };
  const clearFilters = () => { setBusqueda(''); setBusquedaInput(''); setFiltroRol('todos'); setFiltroEstado('todos'); setPagina(1); };
  const updateFilter = (setter) => (event) => { setter(event.target.value); setPagina(1); setActionMessage(''); };
  const totalPaginas = query.data ? Math.max(1, Math.ceil(query.data.total / tamano)) : 1;
  const hasFilters = Boolean(busqueda || filtroRol !== 'todos' || filtroEstado !== 'todos');
  const from = query.data?.total ? ((pagina - 1) * tamano) + 1 : 0;
  const to = query.data?.total ? Math.min(pagina * tamano, query.data.total) : 0;

  const openEdit = (user) => { setActionError(''); setActionMessage(''); setEditingUser(user); };
  const handleSaved = () => { qc.invalidateQueries({ queryKey: ['admin-usuarios'] }); setEditingUser(null); setActionError(''); setActionMessage('Cambios guardados correctamente.'); };

  return <div className="admin-page admin-users-page">
    <div className="admin-page-heading"><div><p className="admin-eyebrow">Control de acceso</p><h2>Usuarios</h2><p>Administra perfiles, roles y acceso a la tienda desde un solo lugar.</p></div><div className="rounded-2xl border border-brand/20 bg-brand/10 px-4 py-3 text-right"><p className="text-[11px] font-bold uppercase tracking-wider text-brand">Resultados</p><p className="mt-1 text-2xl font-bold text-dark-text">{query.data?.total ?? '—'}</p></div></div>

    <div className="mt-8 rounded-2xl border border-white/10 bg-dark-surface p-4 sm:p-5"><form onSubmit={applySearch} className="flex flex-col gap-3 lg:flex-row"><div className="relative flex-1"><span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-dark-muted">⌕</span><input type="search" value={busquedaInput} onChange={(event) => setBusquedaInput(event.target.value)} placeholder="Buscar por nombre o correo…" aria-label="Buscar usuarios" className="w-full rounded-xl border border-white/15 bg-dark-bg py-3 pl-11 pr-4 text-sm text-dark-text outline-none placeholder:text-neutral-600 focus:border-brand focus:ring-2 focus:ring-brand/15" /></div><div className="grid grid-cols-2 gap-3 lg:flex"><select value={filtroRol} onChange={updateFilter(setFiltroRol)} aria-label="Filtrar por rol" className="rounded-xl border border-white/15 bg-dark-bg px-3 py-3 text-sm text-dark-text outline-none focus:border-brand"><option value="todos">Todos los roles</option><option value="CLIENTE">Clientes</option><option value="ADMIN">Administradores</option></select><select value={filtroEstado} onChange={updateFilter(setFiltroEstado)} aria-label="Filtrar por estado" className="rounded-xl border border-white/15 bg-dark-bg px-3 py-3 text-sm text-dark-text outline-none focus:border-brand"><option value="todos">Todos los estados</option><option value="activos">Activos</option><option value="inactivos">Inactivos</option></select><button type="submit" className="col-span-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-dark-bg transition hover:bg-brand-accent lg:col-span-1">Buscar</button></div></form>{hasFilters && <div className="mt-3 flex items-center justify-between gap-3 text-xs text-dark-muted"><span>Filtros aplicados{busqueda ? `: “${busqueda}”` : ''}</span><button type="button" onClick={clearFilters} className="font-semibold text-brand hover:text-brand-accent">Limpiar todo</button></div>}</div>

    {actionMessage && <div role="status" className="mt-5 rounded-xl border border-green-300/25 bg-green-400/10 px-4 py-3 text-sm text-green-200">{actionMessage}</div>}{actionError && !statusUser && <div role="alert" className="mt-5 rounded-xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">{actionError}</div>}
    {query.isError && <div role="alert" className="mt-5 rounded-xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">No pudimos cargar los usuarios. Intenta nuevamente.</div>}

    <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-dark-surface">
      {query.isLoading ? <div className="space-y-3 p-5">{[1, 2, 3, 4].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-white/5" />)}</div> : query.data?.items?.length ? <>
        <div className="hidden overflow-x-auto md:block"><table className="w-full text-left text-sm"><thead className="border-b border-white/10 bg-dark-bg/50"><tr><th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-dark-muted">Usuario</th><th className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-dark-muted">Rol</th><th className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-dark-muted">Estado</th><th className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-dark-muted">Registro</th><th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-dark-muted">Acciones</th></tr></thead><tbody className="divide-y divide-white/10">{query.data.items.map((user) => <tr key={user.id} className="transition hover:bg-white/[0.03]"><td className="px-6 py-4"><div className="flex items-center gap-3"><Avatar name={user.nombre} /><div className="min-w-0"><p className="truncate font-semibold text-dark-text">{user.nombre}</p><p className="truncate text-xs text-dark-muted">{user.email}</p></div></div></td><td className="px-4 py-4"><RoleBadge role={user.rol} /></td><td className="px-4 py-4"><StatusBadge active={user.activo} /></td><td className="px-4 py-4 text-xs text-dark-muted">{new Date(user.fechaCreacion).toLocaleDateString('es-CL')}</td><td className="px-6 py-4"><div className="flex justify-end gap-2"><button onClick={() => openEdit(user)} className="rounded-lg px-3 py-2 text-xs font-semibold text-brand transition hover:bg-brand/10">Editar</button>{user.id !== self?.id && <button onClick={() => { setActionError(''); setActionMessage(''); setStatusUser(user); }} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${user.activo ? 'text-red-300 hover:bg-red-400/10' : 'text-green-300 hover:bg-green-400/10'}`}>{user.activo ? 'Desactivar' : 'Activar'}</button>}</div></td></tr>)}</tbody></table></div>
        <div className="divide-y divide-white/10 md:hidden">{query.data.items.map((user) => <article key={user.id} className="p-4"><div className="flex items-start gap-3"><Avatar name={user.nombre} /><div className="min-w-0 flex-1"><p className="truncate font-semibold text-dark-text">{user.nombre}</p><p className="truncate text-xs text-dark-muted">{user.email}</p><div className="mt-3 flex flex-wrap gap-2"><RoleBadge role={user.rol} /><StatusBadge active={user.activo} /></div></div></div><div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3"><span className="text-xs text-dark-muted">Registrado {new Date(user.fechaCreacion).toLocaleDateString('es-CL')}</span><div className="flex gap-1"><button onClick={() => openEdit(user)} className="rounded-lg px-3 py-2 text-xs font-semibold text-brand hover:bg-brand/10">Editar</button>{user.id !== self?.id && <button onClick={() => { setActionError(''); setActionMessage(''); setStatusUser(user); }} className={`rounded-lg px-3 py-2 text-xs font-semibold ${user.activo ? 'text-red-300 hover:bg-red-400/10' : 'text-green-300 hover:bg-green-400/10'}`}>{user.activo ? 'Desactivar' : 'Activar'}</button>}</div></div></article>)}</div>
      </> : <EmptyState hasFilters={hasFilters} onClear={clearFilters} />}
    </div>

    {!query.isLoading && query.data?.total > 0 && <div className="flex flex-col items-center justify-between gap-4 py-5 text-sm text-dark-muted sm:flex-row"><span>Mostrando <strong className="text-dark-text">{from}–{to}</strong> de <strong className="text-dark-text">{query.data.total}</strong></span>{totalPaginas > 1 && <div className="flex items-center gap-2"><button onClick={() => setPagina((page) => Math.max(1, page - 1))} disabled={pagina === 1} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-35">← Anterior</button><span className="rounded-xl bg-dark-surface px-3 py-2 text-xs font-semibold text-dark-text">{pagina} / {totalPaginas}</span><button onClick={() => setPagina((page) => Math.min(totalPaginas, page + 1))} disabled={pagina === totalPaginas} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-35">Siguiente →</button></div>}</div>}

    {editingUser && <EditUserModal user={editingUser} selfId={self?.id} onClose={() => setEditingUser(null)} onSaved={handleSaved} />}
    {statusUser && <ConfirmStatusModal user={statusUser} nextActive={!statusUser.activo} onClose={() => { setStatusUser(null); setActionError(''); }} onConfirm={() => statusMutation.mutate({ id: statusUser.id, activo: !statusUser.activo })} isPending={statusMutation.isPending} error={actionError} />}
  </div>;
}
