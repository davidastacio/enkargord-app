"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Settings,
  DollarSign,
  Users,
  Plus,
  Trash2,
  Save,
  X,
  Package2,
  Truck,
  LogOut,
  Percent,
  Hash,
  Globe,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import {
  DEFAULT_PRICING,
  type PricingSettings,
  type SettlementBeneficiary,
  type ZoneSurcharge,
  type CalculationType,
} from '@/data/courier';

const PACKAGING_LABELS: Record<string, string> = {
  sobre:               'Sobre',
  bolsa_seguridad:     'Bolsa de seguridad',
  caja_pequena:        'Caja pequeña',
  caja_mediana:        'Caja mediana',
  caja_grande:         'Caja grande',
  proteccion_adicional:'Protección adicional',
  personalizado:       'Empaque personalizado',
};

export default function OperacionesPage() {
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [newBeneficiary, setNewBeneficiary] = useState<Partial<SettlementBeneficiary>>({
    name: '', calculationType: 'fixed', fixedAmount: 50, percentage: 0, active: true,
  });
  const [newZone, setNewZone] = useState<Partial<ZoneSurcharge>>({ provinceName: '', surcharge: 0 });

  useEffect(() => {
    const stored = localStorage.getItem('enkargord_pricing');
    if (stored) setPricing(JSON.parse(stored));
  }, []);

  const savePricing = (updated: PricingSettings) => {
    const withDate = { ...updated, lastUpdated: new Date().toISOString() };
    setPricing(withDate);
    localStorage.setItem('enkargord_pricing', JSON.stringify(withDate));
  };

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = () => {
    savePricing(pricing);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    triggerToast('⚙️ Configuración guardada correctamente.');
  };

  const addBeneficiary = () => {
    if (!newBeneficiary.name) return;
    const b: SettlementBeneficiary = {
      id: `BEN-${Date.now()}`,
      name: newBeneficiary.name!,
      calculationType: newBeneficiary.calculationType as CalculationType,
      fixedAmount: newBeneficiary.fixedAmount ?? 0,
      percentage: newBeneficiary.percentage ?? 0,
      active: true,
    };
    setPricing((p) => ({ ...p, beneficiaries: [...p.beneficiaries, b] }));
    setNewBeneficiary({ name: '', calculationType: 'fixed', fixedAmount: 50, percentage: 0, active: true });
    triggerToast(`Beneficiario "${b.name}" agregado.`);
  };

  const removeBeneficiary = (id: string) => {
    setPricing((p) => ({ ...p, beneficiaries: p.beneficiaries.filter((b) => b.id !== id) }));
  };

  const toggleBeneficiary = (id: string) => {
    setPricing((p) => ({
      ...p,
      beneficiaries: p.beneficiaries.map((b) => (b.id === id ? { ...b, active: !b.active } : b)),
    }));
  };

  const addZoneSurcharge = () => {
    if (!newZone.provinceName) return;
    const z: ZoneSurcharge = {
      provinceId: newZone.provinceName!.toLowerCase().replace(/\s+/g, '_'),
      provinceName: newZone.provinceName!,
      surcharge: newZone.surcharge ?? 0,
    };
    setPricing((p) => ({ ...p, zoneSurcharges: [...p.zoneSurcharges, z] }));
    setNewZone({ provinceName: '', surcharge: 0 });
    triggerToast(`Recargo de zona "${z.provinceName}" agregado.`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans text-slate-800 antialiased">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r border-[#E7E7EC] flex flex-col fixed top-0 bottom-0 left-0 z-40">
        <div className="p-4 border-b border-[#E7E7EC] flex items-center justify-center">
          <div className="relative w-[200px] h-16">
            <Image src="/logo.png" alt="EnkargoRD" fill className="object-contain object-center" priority />
          </div>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {[
            { href: '/admin',             icon: Package2, label: 'Dashboard Admin' },
            { href: '/admin/mensajeros',  icon: Users,    label: 'Mensajeros' },
            { href: '/admin/operaciones', icon: Settings, label: 'Configuración' },
            { href: '/admin/mis-entregas',icon: Truck,    label: 'Modo Repartidor' },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-[#E7E7EC]">
          <Link href="/" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all">
            <LogOut size={16} /> Cerrar sesión
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="pl-[260px] min-h-screen flex flex-col">
        <header className="bg-white border-b border-[#E7E7EC] px-8 py-5 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Configuración de Operaciones</h1>
            <p className="text-xs text-slate-400 mt-0.5">Tarifas, comisiones y beneficiarios de liquidación</p>
          </div>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 font-bold text-xs py-3 px-5 rounded-xl shadow-md transition-all ${
              saved
                ? 'bg-emerald-500 text-white shadow-emerald-100'
                : 'bg-[#d3121a] hover:bg-[#b00f14] text-white shadow-red-100'
            }`}
          >
            {saved ? <><CheckCircle size={16} /> Guardado</> : <><Save size={16} /> Guardar cambios</>}
          </button>
        </header>

        <div className="p-8 space-y-8 max-w-4xl">

          {/* Base Tariffs */}
          <section className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <DollarSign size={15} className="text-[#d3121a]" />
              Tarifa base de envío
            </h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Costo base por entrega (RD$)
              </label>
              <input
                type="number"
                min={0}
                value={pricing.baseShippingCost}
                onChange={(e) => setPricing((p) => ({ ...p, baseShippingCost: parseFloat(e.target.value) || 0 }))}
                className="w-60 px-4 py-2.5 text-lg font-extrabold border border-[#E7E7EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d3121a]/20 focus:border-[#d3121a]"
              />
              <p className="text-xs text-slate-400 mt-2 font-medium">
                Este es el costo mínimo de envío que se aplica a todos los pedidos, antes de recargos por zona.
              </p>
            </div>
          </section>

          {/* Fulfillment Costs */}
          <section className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Package2 size={15} className="text-[#d3121a]" />
              Tarifas de fulfillment por tipo de empaque
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(pricing.fulfillmentCosts).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    {PACKAGING_LABELS[key] ?? key}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">RD$</span>
                    <input
                      type="number"
                      min={0}
                      value={value}
                      onChange={(e) =>
                        setPricing((p) => ({
                          ...p,
                          fulfillmentCosts: { ...p.fulfillmentCosts, [key]: parseFloat(e.target.value) || 0 },
                        }))
                      }
                      className="flex-1 px-3 py-2 text-sm font-bold border border-[#E7E7EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d3121a]/20 focus:border-[#d3121a]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Beneficiaries */}
          <section className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Users size={15} className="text-[#d3121a]" />
              Beneficiarios de liquidación
            </h3>
            <p className="text-xs text-slate-400 font-medium -mt-2">
              Configura los participantes financieros (ej. Polanco, transportadora) y su forma de cálculo.
            </p>

            {/* Existing */}
            <div className="space-y-3">
              {pricing.beneficiaries.map((b) => (
                <div key={b.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  b.active ? 'border-[#E7E7EC] bg-white' : 'border-slate-200 bg-slate-50 opacity-60'
                }`}>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-800">{b.name}</div>
                    <div className="text-xs text-slate-400 font-semibold mt-0.5">
                      {b.calculationType === 'fixed'
                        ? `RD$${b.fixedAmount} fijo por entrega`
                        : b.calculationType === 'percentage_of_shipping'
                        ? `${b.percentage}% del costo de envío`
                        : `${b.percentage}% del monto total`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleBeneficiary(b.id)}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                        b.active
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {b.active ? 'Activo' : 'Inactivo'}
                    </button>
                    <button
                      onClick={() => removeBeneficiary(b.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new */}
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agregar beneficiario</p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nombre del beneficiario"
                  value={newBeneficiary.name}
                  onChange={(e) => setNewBeneficiary((p) => ({ ...p, name: e.target.value }))}
                  className="col-span-2 px-3 py-2.5 text-sm border border-[#E7E7EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d3121a]/20 bg-white"
                />
                <select
                  value={newBeneficiary.calculationType}
                  onChange={(e) => setNewBeneficiary((p) => ({ ...p, calculationType: e.target.value as CalculationType }))}
                  className="px-3 py-2.5 text-sm border border-[#E7E7EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d3121a]/20 bg-white"
                >
                  <option value="fixed">Monto fijo (RD$)</option>
                  <option value="percentage_of_shipping">% del envío</option>
                  <option value="percentage_of_total">% del total</option>
                </select>
                <input
                  type="number"
                  min={0}
                  placeholder={newBeneficiary.calculationType === 'fixed' ? 'Monto RD$' : 'Porcentaje %'}
                  value={newBeneficiary.calculationType === 'fixed' ? newBeneficiary.fixedAmount : newBeneficiary.percentage}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) || 0;
                    setNewBeneficiary((p) =>
                      p.calculationType === 'fixed' ? { ...p, fixedAmount: v } : { ...p, percentage: v }
                    );
                  }}
                  className="px-3 py-2.5 text-sm border border-[#E7E7EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d3121a]/20 bg-white"
                />
              </div>
              <button
                onClick={addBeneficiary}
                disabled={!newBeneficiary.name}
                className="w-full py-2.5 bg-[#d3121a] hover:bg-[#b00f14] disabled:opacity-40 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              >
                <Plus size={15} /> Agregar beneficiario
              </button>
            </div>
          </section>

          {/* Zone Surcharges */}
          <section className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Globe size={15} className="text-[#d3121a]" />
              Recargos por zona / provincia
            </h3>

            {pricing.zoneSurcharges.length === 0 && (
              <p className="text-xs text-slate-400 font-medium">No hay recargos por zona configurados.</p>
            )}
            <div className="space-y-2">
              {pricing.zoneSurcharges.map((z, idx) => (
                <div key={z.provinceId} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex-1">
                    <span className="font-bold text-sm text-slate-700">{z.provinceName}</span>
                    <span className="ml-2 text-xs text-[#d3121a] font-bold">+RD${z.surcharge.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => setPricing((p) => ({ ...p, zoneSurcharges: p.zoneSurcharges.filter((_, i) => i !== idx) }))}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Provincia"
                value={newZone.provinceName}
                onChange={(e) => setNewZone((p) => ({ ...p, provinceName: e.target.value }))}
                className="flex-1 px-3 py-2.5 text-sm border border-[#E7E7EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d3121a]/20"
              />
              <input
                type="number"
                min={0}
                placeholder="RD$"
                value={newZone.surcharge}
                onChange={(e) => setNewZone((p) => ({ ...p, surcharge: parseFloat(e.target.value) || 0 }))}
                className="w-28 px-3 py-2.5 text-sm border border-[#E7E7EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d3121a]/20"
              />
              <button
                onClick={addZoneSurcharge}
                className="px-4 py-2.5 bg-[#d3121a] text-white rounded-xl font-bold text-sm hover:bg-[#b00f14]"
              >
                <Plus size={15} />
              </button>
            </div>
          </section>

          {/* Last updated */}
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
            <RefreshCw size={12} />
            Última actualización: {new Date(pricing.lastUpdated).toLocaleString('es-DO')}
          </div>
        </div>
      </main>
    </div>
  );
}
