"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Package,
  Truck,
  DollarSign,
  Users,
  Settings,
  LogOut,
  Search,
  Download,
  Plus,
  MoreVertical,
  X,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Loader2,
  ShieldOff,
  ShieldCheck,
} from 'lucide-react';
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FirestoreUser {
  id: string;
  name?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  createdAt?: Timestamp | string;
  lastLoginAt?: Timestamp | string;
  storeId?: string;
  storeName?: string;
  courierId?: string;
  disabled?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (val?: Timestamp | string | null): string => {
  if (!val) return '—';
  try {
    const d = val instanceof Timestamp ? val.toDate() : new Date(val as string);
    return d.toLocaleDateString('es-DO', { year: 'numeric', month: 'short', day: '2-digit' });
  } catch {
    return '—';
  }
};

const getInitials = (name?: string): string => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  store: 'Tienda',
  courier: 'Motorista',
  customer: 'Cliente',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  store: 'bg-blue-100 text-blue-700',
  courier: 'bg-amber-100 text-amber-700',
  customer: 'bg-slate-100 text-slate-700',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-500',
  suspended: 'bg-red-100 text-red-600',
  pending: 'bg-amber-100 text-amber-700',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido',
  pending: 'Pendiente',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function RegisteredUsers() {
  const { user: authUser } = useAuth() as any;

  // Data state
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedUser, setSelectedUser] = useState<FirestoreUser | null>(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'suspend' | 'delete' | 'activate' | 'deactivate';
    userId: string;
    userName: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ── Firestore real-time listener ────────────────────────────────────────────
  const loadUsers = useCallback(() => {
    setLoading(true);
    setError(null);

    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: FirestoreUser[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setUsers(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading users:', err);
        setError('No se pudo cargar la lista de usuarios. Revisa tu conexión o permisos.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsub = loadUsers();
    return () => unsub();
  }, [loadUsers]);

  // ── Toast helper ────────────────────────────────────────────────────────────
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ── Admin actions ───────────────────────────────────────────────────────────
  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    const { type, userId, userName } = confirmAction;

    try {
      const userRef = doc(db, 'users', userId);

      if (type === 'suspend') {
        await updateDoc(userRef, { status: 'suspended', updatedAt: serverTimestamp() });
        triggerToast(`Cuenta de ${userName} suspendida.`);
      } else if (type === 'activate') {
        await updateDoc(userRef, { status: 'active', updatedAt: serverTimestamp() });
        triggerToast(`Cuenta de ${userName} activada.`);
      } else if (type === 'deactivate') {
        await updateDoc(userRef, { status: 'inactive', updatedAt: serverTimestamp() });
        triggerToast(`Cuenta de ${userName} desactivada.`);
      }
      // Note: delete is intentionally not allowed from UI — must be done from Firebase Console
    } catch (err) {
      console.error(err);
      triggerToast('Error al ejecutar la acción. Intenta de nuevo.');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  // ── Export CSV ──────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      triggerToast('No hay usuarios para exportar.');
      return;
    }
    const headers = ['ID', 'Nombre', 'Correo', 'Teléfono', 'Rol', 'Estado', 'Fecha Registro'];
    const rows = filteredUsers.map((u) => [
      u.id,
      `"${u.displayName || u.name || ''}"`,
      u.email || '',
      u.phone || '',
      ROLE_LABELS[u.role || ''] || u.role || '',
      STATUS_LABELS[u.status || ''] || u.status || '',
      formatDate(u.createdAt),
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `EnkargoRD_Usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('CSV exportado exitosamente.');
  };

  // ── Filter + Pagination ─────────────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    const name = (u.displayName || u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const phone = u.phone || '';
    const matchSearch =
      !searchTerm ||
      name.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const kpis = [
    { label: 'Usuarios totales', value: users.length, icon: Users, color: 'text-slate-700', bg: 'bg-slate-50' },
    { label: 'Activos', value: users.filter((u) => u.status === 'active').length, icon: UserCheck, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Tiendas', value: users.filter((u) => u.role === 'store').length, icon: Package, color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: 'Suspendidos', value: users.filter((u) => u.status === 'suspended').length, icon: UserX, color: 'text-red-700', bg: 'bg-red-50' },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex font-sans text-slate-800 antialiased">

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-slate-700">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-[280px] bg-white border-r border-[#E7E7EC] flex flex-col justify-between fixed top-0 bottom-0 left-0 z-40">
        <div>
          <div className="p-4 border-b border-[#E7E7EC] flex items-center justify-center">
            <div className="relative w-[270px] h-24">
              <Image src="/logo.png" alt="EnkargoRD Logo" fill className="object-contain object-center" priority />
            </div>
          </div>
          <nav className="p-4 space-y-1">
            <Link href="/admin" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900">
              <Package size={18} /> Dashboard Admin
            </Link>
            <Link href="/admin?tab=fleet" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900">
              <Truck size={18} /> Flota Motoristas
            </Link>
            <Link href="/admin/usuarios" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all bg-[#d3121a]/5 text-[#d3121a]">
              <Users size={18} /> Usuarios Registrados
            </Link>
            <Link href="/admin?tab=settlement" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900">
              <DollarSign size={18} /> Liquidaciones y Caja
            </Link>
            <Link href="/admin/operaciones" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900">
              <Settings size={18} /> Configuración
            </Link>
          </nav>
        </div>
        <div className="p-4 border-t border-[#E7E7EC] space-y-4">
          <Link href="/" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all">
            <LogOut size={16} /> Salir de Admin
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-grow pl-[280px] min-h-screen flex flex-col">
        <header className="bg-white border-b border-[#E7E7EC] px-8 py-5 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Usuarios Registrados</h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {loading ? 'Cargando...' : `${users.length} cuentas en la plataforma · datos en tiempo real`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="bg-white hover:bg-slate-50 border border-[#E7E7EC] text-slate-700 font-bold text-xs py-3 px-5 rounded-xl transition-all flex items-center gap-2"
            >
              <Download size={16} /> Exportar CSV
            </button>
          </div>
        </header>

        <div className="p-8 flex-grow space-y-8">

          {/* KPIs */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="bg-white border border-[#E7E7EC] rounded-2xl p-5 flex items-center justify-between shadow-sm">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">{kpi.label}</span>
                  <span className="block text-3xl font-extrabold text-slate-900 mt-1">
                    {loading ? <Loader2 size={20} className="animate-spin text-slate-300" /> : kpi.value}
                  </span>
                </div>
                <div className={`w-11 h-11 ${kpi.bg} rounded-xl flex items-center justify-center ${kpi.color}`}>
                  <kpi.icon size={20} />
                </div>
              </div>
            ))}
          </section>

          {/* Filters */}
          <section className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[250px] relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, correo o teléfono..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] focus:bg-white transition-all"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                className="bg-slate-50 border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a] focus:bg-white transition-all"
              >
                <option value="all">Todos los roles</option>
                <option value="admin">Administrador</option>
                <option value="store">Tienda</option>
                <option value="courier">Motorista</option>
                <option value="customer">Cliente</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="bg-slate-50 border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a] focus:bg-white transition-all"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
                <option value="suspended">Suspendidos</option>
                <option value="pending">Pendientes</option>
              </select>
              {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  onClick={() => { setSearchTerm(''); setRoleFilter('all'); setStatusFilter('all'); setCurrentPage(1); }}
                  className="text-slate-500 hover:text-slate-800 text-xs font-bold py-2.5 px-4 rounded-xl border border-transparent hover:border-[#E7E7EC] transition-all flex items-center gap-1"
                >
                  <X size={12} /> Limpiar filtros
                </button>
              )}
            </div>
          </section>

          {/* Table */}
          <section className="bg-white border border-[#E7E7EC] rounded-2xl overflow-hidden shadow-sm">
            {/* Loading state */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={32} className="text-[#d3121a] animate-spin" />
                <span className="text-xs font-bold text-slate-400">Cargando usuarios desde Firebase...</span>
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-8">
                <AlertTriangle size={32} className="text-amber-400" />
                <p className="font-bold text-slate-700">{error}</p>
                <button
                  onClick={() => loadUsers()}
                  className="flex items-center gap-2 text-xs font-bold text-[#d3121a] hover:underline"
                >
                  <RefreshCw size={14} /> Reintentar
                </button>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && users.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-8">
                <Users size={40} className="text-slate-300" />
                <p className="font-bold text-slate-600">No hay usuarios registrados todavía.</p>
                <p className="text-xs text-slate-400 max-w-xs">
                  Los usuarios aparecerán aquí automáticamente cuando se registren en la plataforma.
                </p>
              </div>
            )}

            {/* No results from filter */}
            {!loading && !error && users.length > 0 && filteredUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-8">
                <Search size={32} className="text-slate-300" />
                <p className="font-bold text-slate-600">Sin resultados para los filtros aplicados.</p>
                <button onClick={() => { setSearchTerm(''); setRoleFilter('all'); setStatusFilter('all'); }} className="text-xs font-bold text-[#d3121a] hover:underline">
                  Limpiar filtros
                </button>
              </div>
            )}

            {/* Table */}
            {!loading && !error && paginatedUsers.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-[#E7E7EC] text-[10px] font-extrabold text-[#64748b] tracking-wider uppercase">
                      <th className="py-4 px-6">Usuario</th>
                      <th className="py-4 px-6">Correo</th>
                      <th className="py-4 px-6">Teléfono</th>
                      <th className="py-4 px-6">Rol</th>
                      <th className="py-4 px-6">Registro</th>
                      <th className="py-4 px-6">Estado</th>
                      <th className="py-4 px-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E7EC] text-xs">
                    {paginatedUsers.map((user) => {
                      const displayName = user.displayName || user.name || user.email || 'Usuario';
                      const role = user.role || 'customer';
                      const status = user.status || 'active';
                      return (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#d3121a]/10 text-[#d3121a] font-extrabold text-xs flex items-center justify-center border border-[#d3121a]/20 flex-shrink-0">
                                {getInitials(displayName)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">{displayName}</span>
                                <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[120px]">{user.id.slice(0, 16)}…</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-medium text-slate-600">{user.email || '—'}</td>
                          <td className="py-4 px-6 font-semibold text-slate-700">{user.phone || '—'}</td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${ROLE_COLORS[role] || 'bg-slate-100 text-slate-700'}`}>
                              {ROLE_LABELS[role] || role}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-500 font-medium">{formatDate(user.createdAt)}</td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-500'}`}>
                              {STATUS_LABELS[status] || status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right relative">
                            <button
                              onClick={() => setActiveActionMenuId(activeActionMenuId === user.id ? null : user.id)}
                              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors inline-block"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {activeActionMenuId === user.id && (
                              <div className="absolute right-6 top-10 w-52 bg-white border border-[#E7E7EC] rounded-xl shadow-xl z-50 py-2 divide-y divide-slate-100">
                                <div className="py-1">
                                  <button
                                    onClick={() => { setSelectedUser(user); setIsDetailDrawerOpen(true); setActiveActionMenuId(null); }}
                                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    👤 Ver perfil
                                  </button>
                                </div>
                                <div className="py-1">
                                  {status !== 'active' && (
                                    <button
                                      onClick={() => { setConfirmAction({ type: 'activate', userId: user.id, userName: displayName }); setActiveActionMenuId(null); }}
                                      className="w-full text-left px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                                    >
                                      <ShieldCheck size={14} /> Activar cuenta
                                    </button>
                                  )}
                                  {status === 'active' && (
                                    <button
                                      onClick={() => { setConfirmAction({ type: 'deactivate', userId: user.id, userName: displayName }); setActiveActionMenuId(null); }}
                                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <ShieldOff size={14} /> Desactivar
                                    </button>
                                  )}
                                  {status !== 'suspended' && (
                                    <button
                                      onClick={() => { setConfirmAction({ type: 'suspend', userId: user.id, userName: displayName }); setActiveActionMenuId(null); }}
                                      className="w-full text-left px-4 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                                    >
                                      <AlertTriangle size={14} /> Suspender cuenta
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="p-4 border-t border-[#E7E7EC] flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                  <span className="text-xs text-slate-400 font-semibold">
                    Mostrando {paginatedUsers.length} de {filteredUsers.length} usuarios
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                      <span>Filas por página:</span>
                      <select
                        value={rowsPerPage}
                        onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                        className="bg-white border border-[#E7E7EC] rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="p-2 border border-[#E7E7EC] rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 text-xs font-bold transition-all">Anterior</button>
                      <span className="text-xs font-bold text-slate-700">Pág. {currentPage} de {totalPages}</span>
                      <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="p-2 border border-[#E7E7EC] rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 text-xs font-bold transition-all">Siguiente</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ── Click-outside close action menu ─────────────────────────────────── */}
      {activeActionMenuId && (
        <div className="fixed inset-0 z-40" onClick={() => setActiveActionMenuId(null)} />
      )}

      {/* ── Profile Drawer ──────────────────────────────────────────────────── */}
      {isDetailDrawerOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col border-l border-[#E7E7EC]">
            <div className="p-6 border-b border-[#E7E7EC] flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-950 text-base">Perfil de Cuenta</h3>
                <p className="text-xs text-slate-400 font-medium">Datos reales desde Firebase Authentication</p>
              </div>
              <button onClick={() => setIsDetailDrawerOpen(false)} className="text-slate-400 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                <div className="w-16 h-16 rounded-full bg-[#d3121a]/10 text-[#d3121a] font-extrabold text-xl flex items-center justify-center border-2 border-[#d3121a]/20">
                  {getInitials(selectedUser.displayName || selectedUser.name || selectedUser.email)}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-lg">{selectedUser.displayName || selectedUser.name || '—'}</h4>
                  <span className="text-xs text-slate-400 font-mono block">UID: {selectedUser.id}</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${ROLE_COLORS[selectedUser.role || 'customer'] || 'bg-slate-100 text-slate-700'}`}>
                      {ROLE_LABELS[selectedUser.role || 'customer'] || selectedUser.role}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${STATUS_COLORS[selectedUser.status || 'active'] || 'bg-slate-100 text-slate-500'}`}>
                      {STATUS_LABELS[selectedUser.status || 'active'] || selectedUser.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                {[
                  { label: 'Correo Electrónico', value: selectedUser.email || '—' },
                  { label: 'Teléfono', value: selectedUser.phone || '—' },
                  { label: 'Fecha de Registro', value: formatDate(selectedUser.createdAt) },
                  { label: 'Último acceso', value: formatDate(selectedUser.lastLoginAt) },
                  { label: 'Tienda vinculada', value: selectedUser.storeName || selectedUser.storeId || '—' },
                  { label: 'ID motorista', value: selectedUser.courierId || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="space-y-1">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                    <span className="text-slate-800 block break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-[#E7E7EC] bg-slate-50">
              <button onClick={() => setIsDetailDrawerOpen(false)} className="w-full bg-white hover:bg-slate-50 border border-[#E7E7EC] text-slate-700 font-extrabold text-xs py-3 rounded-xl transition-all">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Action Modal ─────────────────────────────────────────────── */}
      {confirmAction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white border border-[#E7E7EC] rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center space-y-6">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base">¿Confirmar acción?</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Vas a <strong>{confirmAction.type === 'suspend' ? 'suspender' : confirmAction.type === 'activate' ? 'activar' : 'desactivar'}</strong> la cuenta de <strong>{confirmAction.userName}</strong>. Esta acción se aplicará de inmediato en Firestore.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)} disabled={actionLoading} className="flex-1 bg-white hover:bg-slate-50 border border-[#E7E7EC] text-slate-700 font-extrabold text-xs py-3 rounded-xl transition-all disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={executeConfirmedAction} disabled={actionLoading} className="flex-1 bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md shadow-red-100 disabled:opacity-50 flex items-center justify-center gap-2">
                {actionLoading ? <><Loader2 size={14} className="animate-spin" /> Procesando…</> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
