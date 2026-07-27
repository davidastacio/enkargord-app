"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import LogoutButton from "@/components/auth/LogoutButton";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Phone,
  ArrowLeft,
  CheckCircle,
  Loader2,
  AlertCircle,
  EyeOff,
} from "lucide-react";

interface CollaboratorItem {
  firebase_uid: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  created_at: string;
}

export default function StoreTeamPage() {
  const { user, profile } = useAuth();
  const [team, setTeam] = useState<CollaboratorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // New collaborator form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTeam = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const res = await fetch("/api/store/team/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.team) setTeam(data.team);
    } catch (err) {
      console.error("Error fetching store team:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTeam();
  }, [user]);

  const handleCreateCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !email || !password) return;
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/store/team/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === "EMAIL_ALREADY_IN_USE") {
          throw new Error("Este correo electrónico ya está registrado en la plataforma.");
        }
        throw new Error(data.error || "No se pudo crear la cuenta del colaborador.");
      }

      triggerToast(`✅ Cuenta creada correctamente para ${name}.`);
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setShowAddModal(false);
      void fetchTeam();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al crear el colaborador");
    } finally {
      setSubmitting(false);
    }
  };

  // Restrict page to Store Owners or Admins
  if (profile && profile.role === "Colaborador") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-8 max-w-md text-center space-y-4 shadow-sm">
          <Shield className="mx-auto text-[#d3121a]" size={48} />
          <h2 className="font-extrabold text-slate-900 text-lg">Acceso Restringido</h2>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Las cuentas de colaborador no tienen permisos para administrar la gestión del equipo.
          </p>
          <Link
            href="/tienda"
            className="inline-block bg-[#d3121a] text-white font-extrabold text-xs py-2.5 px-6 rounded-xl hover:bg-[#b00f14] transition-all"
          >
            Volver al Panel Principal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-800 text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle size={16} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-[#E7E7EC] px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/tienda"
            className="p-2 border border-[#E7E7EC] rounded-xl hover:bg-slate-50 text-slate-600 transition-all"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-[#d3121a]" /> Equipo de Colaboradores
            </h1>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Crea y administra los perfiles de tus empleados para gestión de envíos y rastreo.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus size={16} /> + Nuevo Colaborador
          </button>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto p-6 space-y-6 flex-1">
        {/* Info Banner */}
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-[#d3121a] shrink-0">
              <EyeOff size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-xs text-slate-900">Privacidad y Protección Financiera Garantizada</h3>
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed mt-0.5">
                Los colaboradores creados solo podrán subir envíos y dar seguimiento. <strong>No tienen acceso a billetera, liquidaciones, métricas de ganancias ni montos cobrados en guías/etiquetas PDF.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Team List */}
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" /> Colaboradores Activos ({team.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
              <Loader2 className="animate-spin text-[#d3121a]" size={18} /> Cargando colaboradores...
            </div>
          ) : team.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-semibold border border-dashed border-slate-200 rounded-xl space-y-3">
              <Users size={36} className="mx-auto text-slate-300" />
              <p>No tienes colaboradores registrados en tu tienda.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-[#d3121a] text-white font-extrabold text-xs py-2 px-4 rounded-xl hover:bg-[#b00f14] transition-all cursor-pointer"
              >
                + Crear Primer Colaborador
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {team.map((collab) => (
                <div
                  key={collab.firebase_uid}
                  className="p-4 bg-slate-50 border border-[#E7E7EC] rounded-2xl space-y-2 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900">{collab.name}</span>
                      <span className="text-[9px] bg-red-100 text-[#d3121a] font-extrabold px-2 py-0.5 rounded-md">
                        COLABORADOR
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                      <Mail size={12} className="text-slate-400" /> {collab.email}
                    </p>
                    {collab.phone && (
                      <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Phone size={12} className="text-slate-400" /> {collab.phone}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 font-medium">
                      Creado el {new Date(collab.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    ● Activo
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal Agregar Colaborador */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E7E7EC] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <UserPlus size={18} className="text-[#d3121a]" /> Registrar Nuevo Colaborador
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateCollaborator} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Nombre Completo del Empleado *
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carlos Mendoza"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Correo Electrónico (Acceso) *
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="colaborador@mitienda.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Contraseña Inicial (Mínimo 6 caracteres) *
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="******"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Teléfono / WhatsApp (Opcional)
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="8095550000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-extrabold text-slate-500 hover:text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-xs py-2.5 px-5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin" size={14} /> : <UserPlus size={14} />}
                  Crear Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
