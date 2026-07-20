"use client";

import { useState, useEffect } from 'react';
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
  Filter,
  Download,
  Plus,
  MoreVertical,
  X,
  UserCheck,
  UserX,
  AlertTriangle,
  UserMinus,
  Key,
  ShieldCheck,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  role: 'Cliente' | 'Tienda' | 'Motorista' | 'Administrador';
  regDate: string;
  lastAccess: string;
  status: 'Activo' | 'Inactivo' | 'Suspendido' | 'Pendiente';
  ordersCount: number;
  totalSpentOrCollected: number;
  address: string;
  notes: string;
}

const DEFAULT_USERS: UserProfile[] = [
  { 
    id: "USR-001", 
    name: "Pedro García", 
    avatar: "PG", 
    email: "pedro.garcia@gmail.com", 
    phone: "+18495559012", 
    role: "Cliente", 
    regDate: "2026-07-15", 
    lastAccess: "2026-07-20", 
    status: "Activo", 
    ordersCount: 12, 
    totalSpentOrCollected: 18400, 
    address: "Residencial Alameda, Apto 402, Santo Domingo", 
    notes: "Cliente frecuente. Sin reportes negativos en sus entregas." 
  },
  { 
    id: "USR-002", 
    name: "Moda Express RD", 
    avatar: "ME", 
    email: "contacto@modaexpress.do", 
    phone: "+18095558888", 
    role: "Tienda", 
    regDate: "2026-05-10", 
    lastAccess: "2026-07-20", 
    status: "Activo", 
    ordersCount: 45, 
    totalSpentOrCollected: 89000, 
    address: "Av. Churchill #12, Naco, Santo Domingo", 
    notes: "Tienda VIP con fulfillment activo. Despachos diarios." 
  },
  { 
    id: "USR-003", 
    name: "Carlos M.", 
    avatar: "CM", 
    email: "carlos.moto@enkargord.com", 
    phone: "+18095551111", 
    role: "Motorista", 
    regDate: "2026-07-01", 
    lastAccess: "2026-07-20", 
    status: "Activo", 
    ordersCount: 22, 
    totalSpentOrCollected: 45000, 
    address: "Calle Principal #5, Ensanche La Fe, Santo Domingo", 
    notes: "Motorista de flota A. Vehículo: Motocicleta K-123456." 
  },
  { 
    id: "USR-004", 
    name: "Gina Admin", 
    avatar: "GA", 
    email: "gina.admin@enkargord.com", 
    phone: "+18095559999", 
    role: "Administrador", 
    regDate: "2026-01-01", 
    lastAccess: "2026-07-20", 
    status: "Activo", 
    ordersCount: 0, 
    totalSpentOrCollected: 0, 
    address: "Oficina Central EnkargoRD, Santo Domingo", 
    notes: "Administrador de sistema y logística central." 
  },
  { 
    id: "USR-005", 
    name: "José Rodríguez", 
    avatar: "JR", 
    email: "jose.rod@hotmail.com", 
    phone: "+18295553344", 
    role: "Cliente", 
    regDate: "2026-04-20", 
    lastAccess: "2026-07-15", 
    status: "Inactivo", 
    ordersCount: 4, 
    totalSpentOrCollected: 5200, 
    address: "Calle El Sol #45, Santiago", 
    notes: "Inactivo hace más de 30 días. Sin pedidos pendientes." 
  },
  { 
    id: "USR-006", 
    name: "Ramón Vargas", 
    avatar: "RV", 
    email: "ramon.vargas@gmail.com", 
    phone: "+18495557766", 
    role: "Cliente", 
    regDate: "2026-07-18", 
    lastAccess: "2026-07-18", 
    status: "Pendiente", 
    ordersCount: 1, 
    totalSpentOrCollected: 1200, 
    address: "Calle Duarte #80, Bella Vista, Santo Domingo", 
    notes: "Pendiente de verificación de su número de teléfono." 
  },
  { 
    id: "USR-007", 
    name: "Luis Alfonso", 
    avatar: "LA", 
    email: "luis.al@gmail.com", 
    phone: "+18295552222", 
    role: "Motorista", 
    regDate: "2026-07-02", 
    lastAccess: "2026-07-19", 
    status: "Suspendido", 
    ordersCount: 15, 
    totalSpentOrCollected: 28000, 
    address: "Residencial Alameda, Santo Domingo", 
    notes: "Cuenta suspendida temporalmente por reporte de retraso de ruta." 
  }
];

export default function RegisteredUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  // Modals & Action overlays
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Confirm actions
  const [confirmAction, setConfirmAction] = useState<{
    type: 'suspend' | 'delete' | 'reset_password' | 'toggle_status';
    userId: string;
    userName: string;
  } | null>(null);
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Form states - Create New User
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<'Cliente' | 'Tienda' | 'Motorista' | 'Administrador'>('Cliente');
  const [formAddress, setFormAddress] = useState('');

  // Hydrate data from localStorage
  useEffect(() => {
    const localUsers = localStorage.getItem('enkargord_users');
    if (localUsers) {
      setUsers(JSON.parse(localUsers));
    } else {
      setUsers(DEFAULT_USERS);
      localStorage.setItem('enkargord_users', JSON.stringify(DEFAULT_USERS));
    }

    const localAudits = localStorage.getItem('enkargord_user_audits');
    if (localAudits) {
      setAuditLogs(JSON.parse(localAudits));
    }
  }, []);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Log administrative audit logs helper
  const logAuditAction = (action: string, userName: string) => {
    const timeString = new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const logText = `[${timeString}] Gina Admin ${action} a la cuenta de ${userName}`;
    const newLogs = [logText, ...auditLogs].slice(0, 50); // Keep last 50 entries
    setAuditLogs(newLogs);
    localStorage.setItem('enkargord_user_audits', JSON.stringify(newLogs));
  };

  // Save changes helper
  const saveUsers = (updatedUsers: UserProfile[]) => {
    setUsers(updatedUsers);
    localStorage.setItem('enkargord_users', JSON.stringify(updatedUsers));
  };

  // Filter application
  const filteredUsers = users.filter(user => {
    const matchSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm);

    const matchStatus = statusFilter === 'Todos' || user.status === statusFilter;
    const matchRole = roleFilter === 'Todos' || user.role === roleFilter;
    const matchDate = !dateFilter || user.regDate === dateFilter;

    return matchSearch && matchStatus && matchRole && matchDate;
  });

  // Calculate pages
  const totalFilteredResults = filteredUsers.length;
  const totalPages = Math.ceil(totalFilteredResults / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + rowsPerPage);

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('Todos');
    setRoleFilter('Todos');
    setDateFilter('');
    setCurrentPage(1);
    triggerToast("Filtros limpiados con éxito.");
  };

  // Create User
  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const initials = formName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const newUser: UserProfile = {
      id: `USR-${Math.floor(Math.random() * 900) + 100}`,
      name: formName,
      avatar: initials || "US",
      email: formEmail,
      phone: formPhone,
      role: formRole,
      regDate: new Date().toISOString().split('T')[0],
      lastAccess: "Nunca",
      status: "Activo",
      ordersCount: 0,
      totalSpentOrCollected: 0,
      address: formAddress || "No registrada",
      notes: "Usuario creado directamente desde administración."
    };

    const updated = [newUser, ...users];
    saveUsers(updated);
    logAuditAction("creó", newUser.name);
    
    // Reset Form
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('Cliente');
    setFormAddress('');
    setIsCreateModalOpen(false);

    triggerToast(`Usuario "${newUser.name}" creado con ID ${newUser.id}`);
  };

  // Confirm administrative operations
  const executeConfirmedAction = () => {
    if (!confirmAction) return;

    const { type, userId, userName } = confirmAction;
    let updated = [...users];

    if (type === 'delete') {
      updated = users.filter(u => u.id !== userId);
      saveUsers(updated);
      logAuditAction("eliminó", userName);
      triggerToast(`Cuenta de ${userName} eliminada permanentemente.`);
    } else if (type === 'suspend') {
      updated = users.map(u => u.id === userId ? { ...u, status: 'Suspendido' as const } : u);
      saveUsers(updated);
      logAuditAction("suspendió", userName);
      triggerToast(`Cuenta de ${userName} ha sido suspendida.`);
    } else if (type === 'reset_password') {
      logAuditAction("restableció la contraseña de", userName);
      triggerToast(`Se ha enviado un enlace de restauración a ${userName}.`);
    } else if (type === 'toggle_status') {
      updated = users.map(u => {
        if (u.id === userId) {
          const newStatus = u.status === 'Activo' ? 'Inactivo' as const : 'Activo' as const;
          return { ...u, status: newStatus };
        }
        return u;
      });
      saveUsers(updated);
      const targetUser = users.find(u => u.id === userId);
      const actionText = targetUser?.status === 'Activo' ? "desactivó" : "activó";
      logAuditAction(actionText, userName);
      triggerToast(`Estado del usuario modificado con éxito.`);
    }

    setConfirmAction(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      alert("No hay usuarios para exportar con los filtros seleccionados.");
      return;
    }

    const headers = ["ID", "Nombre", "Correo", "Telefono", "Tipo de Cuenta", "Fecha Registro", "Ultimo Acceso", "Estado", "Pedidos", "Total (RD$)"];
    const rows = filteredUsers.map(u => [
      u.id,
      `"${u.name}"`,
      u.email,
      u.phone,
      u.role,
      u.regDate,
      u.lastAccess,
      u.status,
      u.ordersCount,
      u.totalSpentOrCollected
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EnkargoRD_Usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast("Archivo CSV exportado exitosamente.");
  };

  // KPIs
  const totalCount = users.length;
  const activeCount = users.filter(u => u.status === 'Activo').length;
  const newThisMonth = users.filter(u => u.regDate.startsWith('2026-07')).length;
  const suspendedCount = users.filter(u => u.status === 'Suspendido').length;

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex font-sans text-slate-800 antialiased">
      
      {/* Toast Alert popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-slate-700 animate-slide-in">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* ==========================================
         SIDEBAR IZQUIERDA
         ========================================== */}
      <aside className="w-[280px] bg-white border-r border-[#E7E7EC] flex flex-col justify-between fixed top-0 bottom-0 left-0 z-40">
        <div>
          {/* Logo Brand Header */}
          <div className="p-4 border-b border-[#E7E7EC] flex items-center justify-center">
            <div className="relative w-[270px] h-24">
              <Image 
                src="/logo.png" 
                alt="EnkargoRD Logo" 
                fill 
                className="object-contain object-center" 
                priority
              />
            </div>
          </div>

          {/* Menus de Navegacion */}
          <nav className="p-4 space-y-1">
            <Link
              href="/admin"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <Package size={18} />
              Dashboard Admin
            </Link>

            <Link
              href="/admin?tab=fleet"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <Truck size={18} />
              Flota Motoristas
            </Link>

            <Link
              href="/admin/usuarios"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all bg-[#d3121a]/5 text-[#d3121a]"
            >
              <Users size={18} />
              Usuarios Registrados
            </Link>

            <Link
              href="/admin?tab=settlement"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <DollarSign size={18} />
              Liquidaciones y Caja
            </Link>

            <Link
              href="/admin"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <Settings size={18} />
              Configuración
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer block */}
        <div className="p-4 border-t border-[#E7E7EC] space-y-4">
          <div className="p-4 bg-slate-50 border border-[#E7E7EC] rounded-2xl">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-[#d3121a] animate-ping"></span>
              Torre de Control
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium leading-relaxed">
              Monitorea cuentas y auditoría logicial
            </p>
          </div>

          <Link 
            href="/"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={16} />
            Salir de Admin
          </Link>
        </div>
      </aside>

      {/* ==========================================
         MAIN CONTENT AREA
         ========================================== */}
      <main className="flex-grow pl-[280px] min-h-screen flex flex-col">
        
        {/* Header Principal */}
        <header className="bg-white border-b border-[#E7E7EC] px-8 py-5 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Usuarios registrados
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Consulta y administra las cuentas creadas en la plataforma.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleExportCSV}
              className="bg-white hover:bg-slate-50 border border-[#E7E7EC] text-slate-700 font-bold text-xs py-3 px-5 rounded-xl transition-all flex items-center gap-2"
            >
              <Download size={16} />
              Exportar
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#d3121a] hover:bg-[#b00f14] text-white font-bold text-xs py-3 px-5 rounded-xl shadow-md shadow-red-100 transition-all flex items-center gap-2"
            >
              <Plus size={16} />
              Crear usuario
            </button>
          </div>
        </header>

        {/* Outer content container */}
        <div className="p-8 flex-grow space-y-8">

          {/* ==========================================
             KPI CARDS BAR
             ========================================== */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Usuarios totales
                </span>
                <span className="block text-3xl font-extrabold text-slate-900 mt-1">
                  {totalCount}
                </span>
                <span className="block text-[11px] text-slate-400 mt-1 font-semibold">
                  Cuentas registradas
                </span>
              </div>
              <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 font-bold">
                <Users size={20} />
              </div>
            </div>

            <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Usuarios activos
                </span>
                <span className="block text-3xl font-extrabold text-slate-900 mt-1">
                  {activeCount}
                </span>
                <span className="block text-[11px] text-slate-400 mt-1 font-semibold">
                  Listos para transaccionar
                </span>
              </div>
              <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-bold">
                <UserCheck size={20} />
              </div>
            </div>

            <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Nuevos este mes
                </span>
                <span className="block text-3xl font-extrabold text-slate-900 mt-1">
                  {newThisMonth}
                </span>
                <span className="block text-[11px] text-slate-400 mt-1 font-semibold">
                  Registros en Julio 2026
                </span>
              </div>
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold">
                <CheckCircle size={20} />
              </div>
            </div>

            <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Usuarios suspendidos
                </span>
                <span className="block text-3xl font-extrabold text-slate-900 mt-1">
                  {suspendedCount}
                </span>
                <span className="block text-[11px] text-slate-400 mt-1 font-semibold">
                  Cuentas penalizadas
                </span>
              </div>
              <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center text-red-600 font-bold">
                <UserX size={20} />
              </div>
            </div>

          </section>

          {/* ==========================================
             BARRA DE HERRAMIENTAS (FILTROS)
             ========================================== */}
          <section className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              
              {/* Search bar */}
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

              {/* Status Filter */}
              <div className="space-y-1 min-w-[140px]">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-50 border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a] focus:bg-white transition-all"
                >
                  <option value="Todos">Todos los Estados</option>
                  <option value="Activo">Activos</option>
                  <option value="Inactivo">Inactivos</option>
                  <option value="Suspendido">Suspendidos</option>
                  <option value="Pendiente">Pendiente de verificación</option>
                </select>
              </div>

              {/* Role Filter */}
              <div className="space-y-1 min-w-[140px]">
                <select
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-50 border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a] focus:bg-white transition-all"
                >
                  <option value="Todos">Todos los Roles</option>
                  <option value="Cliente">Cliente</option>
                  <option value="Tienda">Tienda</option>
                  <option value="Motorista">Motorista</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>

              {/* Registration Date Filter */}
              <div className="space-y-1 min-w-[140px]">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-50 border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a] focus:bg-white transition-all"
                />
              </div>

              {/* Clear filters trigger */}
              <button
                onClick={handleClearFilters}
                className="text-slate-500 hover:text-slate-800 text-xs font-bold py-2.5 px-4 rounded-xl border border-transparent hover:border-[#E7E7EC] transition-all"
              >
                Limpiar filtros
              </button>

            </div>
          </section>

          {/* ==========================================
             TABLA DE USUARIOS REGISTRADOS
             ========================================== */}
          <section className="bg-white border border-[#E7E7EC] rounded-2xl overflow-hidden shadow-sm relative">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#E7E7EC] text-[10px] font-extrabold text-[#64748b] tracking-wider uppercase">
                    <th className="py-4 px-6">Usuario</th>
                    <th className="py-4 px-6">Correo</th>
                    <th className="py-4 px-6">Teléfono</th>
                    <th className="py-4 px-6">Tipo de cuenta</th>
                    <th className="py-4 px-6">Fecha registro</th>
                    <th className="py-4 px-6">Último acceso</th>
                    <th className="py-4 px-6">Estado</th>
                    <th className="py-4 px-6">Pedidos</th>
                    <th className="py-4 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E7EC] text-xs">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                        No se encontraron usuarios con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50/30 transition-colors">
                        
                        {/* Avatar & User Details */}
                        <td className="py-4 px-6 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#d3121a]/10 text-[#d3121a] font-extrabold text-xs flex items-center justify-center border border-[#d3121a]/20">
                            {user.avatar}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{user.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">{user.id}</span>
                          </div>
                        </td>

                        <td className="py-4 px-6 font-medium text-slate-600">{user.email}</td>
                        <td className="py-4 px-6 font-semibold text-slate-700">{user.phone}</td>
                        
                        {/* Role Badges */}
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                            user.role === 'Administrador' 
                              ? 'bg-red-100 text-red-700' 
                              : user.role === 'Tienda' 
                                ? 'bg-blue-100 text-blue-700'
                                : user.role === 'Motorista'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-slate-500 font-medium">{user.regDate}</td>
                        <td className="py-4 px-6 text-slate-500 font-medium">{user.lastAccess}</td>
                        
                        {/* Status Badges */}
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                            user.status === 'Activo' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : user.status === 'Inactivo' 
                                ? 'bg-slate-100 text-slate-500'
                                : user.status === 'Suspendido'
                                  ? 'bg-[#fee2e2] text-red-600'
                                  : 'bg-amber-100 text-amber-700'
                          }`}>
                            {user.status === 'Pendiente' ? 'Pendiente Verif.' : user.status}
                          </span>
                        </td>

                        <td className="py-4 px-6 font-bold text-slate-900">{user.ordersCount}</td>
                        
                        {/* Actions dropdown */}
                        <td className="py-4 px-6 text-right relative">
                          <button
                            onClick={() => setActiveActionMenuId(activeActionMenuId === user.id ? null : user.id)}
                            className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors inline-block"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {/* Popover Action Menu */}
                          {activeActionMenuId === user.id && (
                            <div className="absolute right-6 top-10 w-52 bg-white border border-[#E7E7EC] rounded-xl shadow-xl z-50 py-2 divide-y divide-slate-100 animate-scale-up">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsDetailDrawerOpen(true);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  👤 Ver perfil
                                </button>
                                <button
                                  onClick={() => {
                                    alert(`Mostrando órdenes filtradas del usuario ${user.name}`);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  📦 Ver pedidos
                                </button>
                              </div>
                              
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    setConfirmAction({ type: 'toggle_status', userId: user.id, userName: user.name });
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  🔌 Activar / Desactivar
                                </button>
                                <button
                                  onClick={() => {
                                    setConfirmAction({ type: 'suspend', userId: user.id, userName: user.name });
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                                >
                                  ⚠️ Suspender cuenta
                                </button>
                                <button
                                  onClick={() => {
                                    setConfirmAction({ type: 'reset_password', userId: user.id, userName: user.name });
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  🔑 Restablecer clave
                                </button>
                              </div>

                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    setConfirmAction({ type: 'delete', userId: user.id, userName: user.name });
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  ❌ Eliminar usuario
                                </button>
                              </div>
                            </div>
                          )}
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer - Pagination */}
            <div className="p-4 border-t border-[#E7E7EC] flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
              <span className="text-xs text-slate-400 font-semibold">
                Mostrando {paginatedUsers.length} de {totalFilteredResults} usuarios registrados
              </span>

              <div className="flex items-center gap-6">
                
                {/* Rows per page selector */}
                <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                  <span>Filas por página:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                    className="bg-white border border-[#E7E7EC] rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>

                {/* Navigation arrows */}
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="p-2 border border-[#E7E7EC] rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600 disabled:hover:bg-white transition-all text-xs font-bold"
                  >
                    Anterior
                  </button>
                  <span className="text-xs font-bold text-slate-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="p-2 border border-[#E7E7EC] rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600 disabled:hover:bg-white transition-all text-xs font-bold"
                  >
                    Siguiente
                  </button>
                </div>

              </div>
            </div>
          </section>

          {/* ==========================================
             AUDIT LOG SEGMENT
             ========================================== */}
          <section className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm">
            <h4 className="font-extrabold text-slate-800 text-sm mb-3">
              🛡️ Auditoría Administrativa del Sistema
            </h4>
            <div className="bg-slate-50 border border-[#E7E7EC] rounded-xl p-4 h-[120px] overflow-y-auto font-mono text-[10px] text-slate-500 space-y-1.5 custom-scrollbar">
              {auditLogs.length === 0 ? (
                <div className="text-slate-400">Ninguna modificación o acción registrada en este turno de auditoría.</div>
              ) : (
                auditLogs.map((log, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-red-500">◆</span>
                    <span>{log}</span>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      </main>

      {/* ==========================================
         DRAWER LATERAL: DETALLE DEL PERFIL
         ========================================== */}
      {isDetailDrawerOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex justify-end animate-fade-in">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between animate-slide-left border-l border-[#E7E7EC]">
            
            {/* Header */}
            <div className="p-6 border-b border-[#E7E7EC] flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-950 text-base">Perfil Detallado de Cuenta</h3>
                <p className="text-xs text-slate-400 font-medium">Información completa e historial administrativo</p>
              </div>
              <button 
                onClick={() => setIsDetailDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-950 p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body Info */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
              
              {/* Header profile info */}
              <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                <div className="w-16 h-16 rounded-full bg-[#d3121a]/10 text-[#d3121a] font-extrabold text-xl flex items-center justify-center border-2 border-[#d3121a]/20 shadow-inner">
                  {selectedUser.avatar}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-lg">{selectedUser.name}</h4>
                  <span className="text-xs text-slate-400 font-mono block">ID: {selectedUser.id}</span>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                      selectedUser.role === 'Administrador' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {selectedUser.role}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                      selectedUser.status === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {selectedUser.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid data */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Correo Electrónico</span>
                  <span className="text-slate-800 block">{selectedUser.email}</span>
                </div>

                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teléfono de Contacto</span>
                  <span className="text-slate-800 block">{selectedUser.phone}</span>
                </div>

                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha de Registro</span>
                  <span className="text-slate-800 block">{selectedUser.regDate}</span>
                </div>

                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Último Acceso</span>
                  <span className="text-slate-800 block">{selectedUser.lastAccess}</span>
                </div>

                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pedidos Realizados</span>
                  <span className="text-slate-800 block">{selectedUser.ordersCount} envíos</span>
                </div>

                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total gastado/recaudado</span>
                  <span className="text-slate-900 font-bold block">RD${selectedUser.totalSpentOrCollected.toLocaleString()}</span>
                </div>

              </div>

              {/* Main address */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dirección Principal registrada</span>
                <p className="text-xs text-slate-600 font-semibold bg-slate-50 p-3 rounded-xl border border-[#E7E7EC] leading-relaxed">
                  {selectedUser.address}
                </p>
              </div>

              {/* Administrative Notes */}
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notas Administrativas</span>
                <p className="text-xs text-slate-600 font-medium italic bg-amber-50/55 p-3 rounded-xl border border-amber-200/50 leading-relaxed">
                  {selectedUser.notes}
                </p>
              </div>

              {/* Recent activity history mockup */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Historial de Actividad Reciente</span>
                
                <div className="space-y-2 text-[11px] font-semibold text-slate-600">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                    <span>Pedido completado: #ENK-1249</span>
                    <span className="text-slate-400">Hace 2 horas</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                    <span>Inicio de Sesión en Plataforma</span>
                    <span className="text-slate-400">Hace 6 horas</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer actions */}
            <div className="p-6 border-t border-[#E7E7EC] bg-slate-50 flex gap-4">
              <button 
                onClick={() => setIsDetailDrawerOpen(false)}
                className="w-full bg-white hover:bg-slate-50 border border-[#E7E7EC] text-slate-700 font-extrabold text-xs py-3 rounded-xl transition-all"
              >
                Cerrar Detalle
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
         CONFIRM OPERATION MODAL
         ========================================== */}
      {confirmAction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-[#E7E7EC] rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center space-y-6 animate-scale-up">
            
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>

            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base">¿Confirmar Acción Sensible?</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                ¿Estás seguro de que deseas proceder con la acción en la cuenta de <strong>{confirmAction.userName}</strong>? Esta acción quedará registrada en la auditoría del administrador.
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmAction(null)}
                className="flex-1 bg-white hover:bg-slate-50 border border-[#E7E7EC] text-slate-700 font-extrabold text-xs py-3 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={executeConfirmedAction}
                className="flex-1 bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md shadow-red-100"
              >
                Confirmar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
         CREATE USER MODAL
         ========================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-[#E7E7EC] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
            
            <div className="p-6 border-b border-[#E7E7EC] flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">🆕 Crear Nuevo Usuario</h3>
                <p className="text-[11px] text-slate-400 font-medium">Registra un nuevo perfil de cuenta en la plataforma</p>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Roberto Martínez"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Correo Electrónico</label>
                  <input 
                    type="email" 
                    required
                    placeholder="correo@ejemplo.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Teléfono</label>
                  <input 
                    type="text" 
                    required
                    placeholder="+18095551122"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tipo de Cuenta (Rol)</label>
                  <select 
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                  >
                    <option value="Cliente">Cliente</option>
                    <option value="Tienda">Tienda</option>
                    <option value="Motorista">Motorista</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Dirección Principal</label>
                <input 
                  type="text" 
                  placeholder="Calle Central #123, Sector Naco, SD"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                />
              </div>

              <div className="pt-4 border-t border-[#E7E7EC] flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 bg-white hover:bg-slate-50 border border-[#E7E7EC] text-slate-700 font-extrabold text-xs py-3 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md shadow-red-100"
                >
                  Registrar Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
