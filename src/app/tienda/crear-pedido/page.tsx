"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  DollarSign, 
  FileText,
  Clock,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function CreateOrder() {
  const router = useRouter();

  // Form states
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [pickupAddress, setPickupAddress] = useState('Av. Winston Churchill #12, Naco (Moda Express RD)');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [sector, setSector] = useState('Naco (Santo Domingo)');
  const [reference, setReference] = useState('');
  const [pkgType, setPkgType] = useState('Ropa');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState('1.5');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [collectAmount, setCollectAmount] = useState('1500');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Estimations
  const shippingFee = 200;
  const fulfillmentFee = 0; // Default merchant self shipping
  const totalAmountToCollect = parseFloat(collectAmount) || 0;

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Save to unified localStorage list enkargord_orders
    setTimeout(() => {
      setIsLoading(false);

      const localOrders = localStorage.getItem('enkargord_orders');
      const currentOrders = localOrders ? JSON.parse(localOrders) : [];

      const nextNumber = currentOrders.length > 0
        ? Math.max(...currentOrders.map((o: any) => parseInt(o.trackingId.split('-')[1]) || 0)) + 1
        : 1251;

      const pCost = parseFloat(collectAmount) || 0;
      const sCost = shippingFee;
      
      const newOrder = {
        id: `ENK-${nextNumber}`,
        trackingId: `ENK-${nextNumber}`,
        status: 'pending',
        storeId: "STORE_01",
        storeName: "Moda Express RD",
        courierName: "No asignado",
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
        customer: {
          name: custName,
          phone: custPhone,
          email: custEmail
        },
        deliveryAddress: {
          addressLine: deliveryAddress,
          city: sector,
          coordinates: {
            lat: 18.4861 + (Math.random() - 0.5) * 0.03,
            lng: -69.9312 + (Math.random() - 0.5) * 0.03
          }
        },
        fulfillment: false,
        financials: {
          productCost: pCost,
          shippingCost: sCost,
          fulfillmentCost: fulfillmentFee,
          totalCollected: pCost + sCost,
          storeOwnerAmount: pCost,
          polancoCommission: 50,
          transportadoraCommission: sCost - 50
        }
      };

      const updated = [newOrder, ...currentOrders];
      localStorage.setItem('enkargord_orders', JSON.stringify(updated));

      triggerToast(`Pedido #${newOrder.trackingId} creado en el sistema.`);
      
      // Redirect back to dashboard list
      router.push('/tienda/pedidos');
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-slate-700 animate-slide-in">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Return Navigation */}
      <div className="flex items-center gap-4">
        <Link 
          href="/tienda"
          className="p-2 border border-[#E7E7EC] rounded-xl bg-white hover:bg-slate-50 transition-colors text-slate-600"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">Crear Pedido</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Completa los datos de envío y cobro para coordinar el courier.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main form card column */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 bg-white border border-[#E7E7EC] rounded-2xl p-8 shadow-sm space-y-8">
          
          {/* Segment 1: Customer info */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
              👤 Datos del Destinatario
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Nombre del Cliente</label>
                <div className="relative">
                  <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    placeholder="Ej. Roberto Martínez"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Teléfono de Contacto</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    placeholder="+18095550000"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Correo (Opcional)</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="email" 
                    placeholder="correo@ejemplo.com"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Segment 2: Shipping details */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
              📍 Dirección de Entrega
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Dirección de recogida</label>
                <input 
                  type="text" 
                  disabled
                  value={pickupAddress}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-[#E7E7EC] rounded-xl text-xs font-semibold text-slate-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Sector / Municipio</label>
                <select 
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                >
                  <option value="Naco (Santo Domingo)">Naco (Santo Domingo)</option>
                  <option value="Bella Vista (Santo Domingo)">Bella Vista (Santo Domingo)</option>
                  <option value="Piantini (Santo Domingo)">Piantini (Santo Domingo)</option>
                  <option value="Zona Colonial (Santo Domingo)">Zona Colonial (Santo Domingo)</option>
                  <option value="Alma Rosa I (SDE)">Alma Rosa I (SDE)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Dirección exacta de entrega</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    placeholder="Calle Duarte #15, Apto 2B"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Referencia de ubicación</label>
                <input 
                  type="text" 
                  placeholder="Ej: Frente al supermercado Nacional"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                />
              </div>
            </div>

          </div>

          {/* Segment 3: Package specifics */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
              📦 Información del Envíos
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tipo de paquete</label>
                <select 
                  value={pkgType}
                  onChange={(e) => setPkgType(e.target.value)}
                  className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                >
                  <option value="Ropa">Ropa / Textil</option>
                  <option value="Calzado">Calzado</option>
                  <option value="Documentos">Documentos</option>
                  <option value="Electrónica">Electrónica</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Descripción corta</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Vestido rojo seda talla M"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Peso aprox. (Lbs)</label>
                <input 
                  type="number" 
                  step="0.1"
                  required
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Método de Pago</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                >
                  <option value="COD">Efectivo contra entrega (COD)</option>
                  <option value="Pagado">Ya pagado por transferencia</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Monto a Recaudar (RD$)</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="number" 
                    required
                    disabled={paymentMethod !== 'COD'}
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-white disabled:bg-slate-50 disabled:text-slate-400 border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Fecha / Hora entrega preferida</label>
                <input 
                  type="datetime-local" 
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Instrucciones Especiales</label>
                <div className="relative">
                  <FileText size={14} className="absolute left-4 top-4 text-slate-400" />
                  <textarea 
                    placeholder="Ej. Llamar antes de entregar o dejar en conserjería..."
                    rows={3}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={() => router.push('/tienda')}
              className="flex-1 bg-white hover:bg-slate-50 border border-[#E7E7EC] text-slate-700 font-extrabold text-xs py-3.5 px-4 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="flex-1 bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-xs py-3.5 px-4 rounded-xl transition-all shadow-md shadow-red-100 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Crear pedido"
              )}
            </button>
          </div>

        </form>

        {/* Lateral resume column */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Billing resume */}
          <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-6">
            <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
              📊 Resumen de Cotización
            </h4>

            <div className="space-y-3.5 text-xs font-semibold text-slate-600">
              
              <div className="flex justify-between">
                <span>Tarifa base de envío:</span>
                <span className="text-slate-900">RD${shippingFee.toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span>Seguro de carga:</span>
                <span className="text-slate-900">Incluido</span>
              </div>

              <div className="flex justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                <span>Monto a recaudar (COD):</span>
                <span>RD${totalAmountToCollect.toLocaleString()}</span>
              </div>

              <div className="flex justify-between border-t border-slate-100 pt-3 text-sm font-extrabold text-slate-950">
                <span>Costo del Envío:</span>
                <span className="text-[#d3121a]">RD${shippingFee.toLocaleString()}</span>
              </div>

            </div>

            <div className="p-4 bg-[#fee2e2]/20 border border-[#fee2e2] rounded-xl flex items-start gap-3">
              <Clock size={16} className="text-[#d3121a] mt-0.5 shrink-0" />
              <div>
                <h5 className="font-bold text-[10px] text-[#d3121a] uppercase tracking-wider">Plazo de entrega estimado</h5>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-normal">
                  Mismo día (2 - 4 horas máximo) en Santo Domingo.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
