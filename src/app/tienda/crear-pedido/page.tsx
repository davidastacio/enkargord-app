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
  ArrowLeft,
  ShieldAlert,
  Calendar,
  Layers,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';

export default function CreateOrder() {
  const router = useRouter();

  // SECTION 1 — DATOS DEL CLIENTE
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custPhoneAlt, setCustPhoneAlt] = useState('');
  const [custEmail, setCustEmail] = useState('');

  // SECTION 2 — DATOS DE ENTREGA
  const [province, setProvince] = useState('Santo Domingo');
  const [municipality, setMunicipality] = useState('Distrito Nacional');
  const [sector, setSector] = useState('Naco');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [reference, setReference] = useState('');

  // SECTION 3 — INFORMACIÓN LOGÍSTICA DEL PAQUETE
  const [packageType, setPackageType] = useState('Paquete pequeño');
  const [packagesCount, setPackagesCount] = useState('1');
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [handling, setHandling] = useState('Ninguna');

  // SECTION 4 — RECAUDO Y PAGO
  const [requiresCod, setRequiresCod] = useState(true);
  const [collectAmount, setCollectAmount] = useState('1500');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');

  // SECTION 5 — RECOGIDA
  const [pickupAddress, setPickupAddress] = useState('Av. Winston Churchill #12, Naco');
  const [pickupContact, setPickupContact] = useState('Moda Express RD (Encargado de Despacho)');
  const [pickupPhone, setPickupPhone] = useState('809-555-8888');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTimeSlot, setPickupTimeSlot] = useState('Tarde (12:00 PM - 6:00 PM)');
  const [pickupNotes, setPickupNotes] = useState('');

  // SECTION 6 — INSTRUCCIONES DE ENTREGA
  const [courierNotes, setCourierNotes] = useState('');
  const [authorizedReceiver, setAuthorizedReceiver] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [observations, setObservations] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cost estimates
  const shippingFee = 200;

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!custName.trim() || !custPhone.trim() || !deliveryAddress.trim() || !pickupDate) {
      alert("Por favor rellene los campos obligatorios del envío.");
      return;
    }

    if (requiresCod) {
      const parsedAmount = parseFloat(collectAmount) || 0;
      if (parsedAmount <= 0) {
        alert("El monto a recaudar debe ser un valor positivo cuando el cobro contra entrega está activo.");
        return;
      }
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      const localOrders = localStorage.getItem('enkargord_orders');
      const currentOrders = localOrders ? JSON.parse(localOrders) : [];

      const nextNumber = currentOrders.length > 0
        ? Math.max(...currentOrders.map((o: any) => parseInt(o.trackingId.split('-')[1]) || 0)) + 1
        : 1251;

      const pCost = requiresCod ? (parseFloat(collectAmount) || 0) : 0;
      
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
          email: custEmail || undefined
        },
        deliveryAddress: {
          addressLine: deliveryAddress,
          city: `${sector} (${province})`,
          coordinates: {
            lat: 18.4861 + (Math.random() - 0.5) * 0.03,
            lng: -69.9312 + (Math.random() - 0.5) * 0.03
          }
        },
        packageInfo: {
          type: packageType,
          count: parseInt(packagesCount) || 1,
          weight: weight || undefined,
          handling: handling
        },
        fulfillment: false,
        financials: {
          productCost: pCost,
          shippingCost: shippingFee,
          fulfillmentCost: 0,
          totalCollected: pCost + shippingFee,
          storeOwnerAmount: pCost,
          polancoCommission: 50,
          transportadoraCommission: shippingFee - 50
        }
      };

      const updated = [newOrder, ...currentOrders];
      localStorage.setItem('enkargord_orders', JSON.stringify(updated));

      triggerToast(`Guía logística #${newOrder.trackingId} registrada.`);
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
          <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">Crear Guía de Envío</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Registra los datos de transporte y entrega bajo protección de privacidad comercial.
          </p>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-4 bg-red-50 border border-red-200/50 rounded-2xl flex items-start gap-4">
        <div className="p-2 bg-[#fee2e2] text-[#d3121a] rounded-xl shrink-0 mt-0.5">
          <ShieldAlert size={20} />
        </div>
        <div>
          <h4 className="font-extrabold text-slate-900 text-xs">Protección de Privacidad Comercial</h4>
          <p className="text-[11px] text-slate-500 font-semibold mt-1 leading-relaxed">
            EnkargoRD protege la privacidad comercial de tu negocio. No solicitamos información sobre los productos contenidos en el paquete. Solo registramos los datos necesarios para gestionar la entrega y el recaudo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main form card column */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 bg-white border border-[#E7E7EC] rounded-2xl p-8 shadow-sm space-y-8">
          
          {/* SECCIÓN 1 — DATOS DEL CLIENTE */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-950 text-xs border-b border-slate-100 pb-2 uppercase tracking-wide">
              1. Datos del Destinatario (Cliente)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Nombre completo *</label>
                <div className="relative">
                  <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    placeholder="Ej. Juan Pérez"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Teléfono Principal *</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    placeholder="809-555-1234"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Teléfono Alternativo (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="829-555-5678"
                  value={custPhoneAlt}
                  onChange={(e) => setCustPhoneAlt(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Correo Electrónico (Opcional)</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="email" 
                    placeholder="cliente@correo.com"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* SECCIÓN 2 — DATOS DE ENTREGA */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-950 text-xs border-b border-slate-100 pb-2 uppercase tracking-wide">
              2. Ubicación y Datos de Entrega
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Provincia *</label>
                <select 
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                >
                  <option value="Santo Domingo">Santo Domingo</option>
                  <option value="Santiago">Santiago</option>
                  <option value="La Romana">La Romana</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Municipio *</label>
                <select 
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value)}
                  className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                >
                  <option value="Distrito Nacional">Distrito Nacional</option>
                  <option value="Santo Domingo Este">Santo Domingo Este</option>
                  <option value="Santo Domingo Oeste">Santo Domingo Oeste</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Sector *</label>
                <select 
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                >
                  <option value="Naco">Naco</option>
                  <option value="Bella Vista">Bella Vista</option>
                  <option value="Piantini">Piantini</option>
                  <option value="Zona Colonial">Zona Colonial</option>
                  <option value="Evaristo Morales">Evaristo Morales</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Dirección completa de entrega *</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    placeholder="Calle Duarte #15, Apto 2B, Torre Bella"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Punto de referencia</label>
                <input 
                  type="text" 
                  placeholder="Ej: Detrás del Supermercado Bravo"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                />
              </div>
            </div>

          </div>

          {/* SECCIÓN 3 — INFORMACIÓN LOGÍSTICA DEL PAQUETE */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-950 text-xs border-b border-slate-100 pb-2 uppercase tracking-wide">
              3. Información Logística del Paquete
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Tipo de envío *</label>
                <select 
                  value={packageType}
                  onChange={(e) => setPackageType(e.target.value)}
                  className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                >
                  <option value="Documento">Documento (Cartas, folletos)</option>
                  <option value="Paquete pequeño">Paquete pequeño (Hasta 5 Lbs)</option>
                  <option value="Paquete mediano">Paquete mediano (5 Lbs a 15 Lbs)</option>
                  <option value="Paquete grande">Paquete grande (Más de 15 Lbs)</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Cantidad de paquetes *</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={packagesCount}
                  onChange={(e) => setPackagesCount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Peso aproximado (Lbs - Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ej. 3 Lbs"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Dimensiones aprox. (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ej. 10x10x10 cm"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Indicaciones de manipulación</label>
                <select 
                  value={handling}
                  onChange={(e) => setHandling(e.target.value)}
                  className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                >
                  <option value="Ninguna">Ninguna</option>
                  <option value="Frágil">Frágil</option>
                  <option value="Mantener vertical">Mantener vertical</option>
                  <option value="No mojar">No mojar</option>
                  <option value="Manipular con cuidado">Manipular con cuidado</option>
                </select>
              </div>
            </div>

          </div>

          {/* SECCIÓN 4 — RECAUDO Y PAGO */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-950 text-xs border-b border-slate-100 pb-2 uppercase tracking-wide">
              4. Recaudo y Pago Financiero (COD)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={requiresCod}
                  onChange={(e) => setRequiresCod(e.target.checked)}
                  className="w-4.5 h-4.5 accent-[#d3121a] rounded border-[#E7E7EC]"
                />
                <span className="text-xs font-bold text-slate-700">¿El pedido requiere cobro contra entrega (COD)?</span>
              </label>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Monto total a recaudar (RD$)</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="number" 
                    disabled={!requiresCod}
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-white disabled:bg-slate-50 disabled:text-slate-400 border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                  />
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Método de pago aceptado</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia bancaria</option>
                  <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input 
                  type="checkbox"
                  id="alreadyPaid"
                  checked={alreadyPaid}
                  onChange={(e) => setAlreadyPaid(e.target.checked)}
                  className="w-4.5 h-4.5 accent-[#d3121a] rounded border-[#E7E7EC]"
                />
                <label htmlFor="alreadyPaid" className="text-xs font-bold text-slate-700 cursor-pointer select-none">¿El cliente ya pagó?</label>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Referencia de pago (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ej. Transf-9021"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                />
              </div>
            </div>

          </div>

          {/* SECCIÓN 5 — RECOGIDA */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-950 text-xs border-b border-slate-100 pb-2 uppercase tracking-wide">
              5. Parámetros de Recogida (Tienda)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Dirección de recogida</label>
                <input 
                  type="text" 
                  disabled
                  value={pickupAddress}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-[#E7E7EC] rounded-xl text-xs font-semibold text-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Persona de contacto</label>
                <input 
                  type="text" 
                  disabled
                  value={pickupContact}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-[#E7E7EC] rounded-xl text-xs font-semibold text-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Teléfono de contacto</label>
                <input 
                  type="text" 
                  disabled
                  value={pickupPhone}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-[#E7E7EC] rounded-xl text-xs font-semibold text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Fecha de recogida preferida *</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="date" 
                    required
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Franja horaria preferida</label>
                <select 
                  value={pickupTimeSlot}
                  onChange={(e) => setPickupTimeSlot(e.target.value)}
                  className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                >
                  <option value="Mañana (8:00 AM - 12:00 PM)">Mañana (8:00 AM - 12:00 PM)</option>
                  <option value="Tarde (12:00 PM - 6:00 PM)">Tarde (12:00 PM - 6:00 PM)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Notas para la recogida</label>
              <input 
                type="text" 
                placeholder="Ej. Recoger por la puerta trasera de carga"
                value={pickupNotes}
                onChange={(e) => setPickupNotes(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
              />
            </div>

          </div>

          {/* SECCIÓN 6 — INSTRUCCIONES DE ENTREGA */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-950 text-xs border-b border-slate-100 pb-2 uppercase tracking-wide">
              6. Instrucciones y Recepción en Destino
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Persona autorizada a recibir</label>
                <input 
                  type="text" 
                  placeholder="Ej. Conserje o pariente cercano"
                  value={authorizedReceiver}
                  onChange={(e) => setAuthorizedReceiver(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Teléfono de recepción</label>
                <input 
                  type="text" 
                  placeholder="829-555-9000"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Instrucciones para el motorista</label>
              <textarea 
                placeholder="Ej. Tocar timbre de apartamento 2B o dejar con seguridad"
                rows={2}
                value={courierNotes}
                onChange={(e) => setCourierNotes(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
              />
            </div>

          </div>

          {/* Action triggers */}
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
              📊 Resumen Logístico
            </h4>

            <div className="space-y-3.5 text-xs font-semibold text-slate-600">
              
              <div className="flex justify-between">
                <span>Cliente:</span>
                <span className="text-slate-900 font-bold">{custName || "Sin registrar"}</span>
              </div>

              <div className="flex justify-between">
                <span>Teléfono:</span>
                <span className="text-slate-900 font-semibold">{custPhone || "Sin registrar"}</span>
              </div>

              <div className="flex justify-between">
                <span>Dirección de Entrega:</span>
                <span className="text-slate-900 truncate max-w-[140px]" title={deliveryAddress}>{deliveryAddress || "Sin registrar"}</span>
              </div>

              <div className="flex justify-between">
                <span>Sector:</span>
                <span className="text-slate-900 font-semibold">{sector}</span>
              </div>

              <div className="flex justify-between">
                <span>Tipo de Paquete:</span>
                <span className="text-[#d3121a] font-extrabold">{packageType}</span>
              </div>

              <div className="flex justify-between">
                <span>Cantidad:</span>
                <span className="text-slate-900 font-bold">{packagesCount} bulto(s)</span>
              </div>

              <div className="flex justify-between">
                <span>Monto a Recaudar:</span>
                <span className="text-slate-950 font-bold">RD${(requiresCod ? parseFloat(collectAmount) || 0 : 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span>Método de Pago:</span>
                <span className="text-slate-900 font-bold">{paymentMethod}</span>
              </div>

              <div className="flex justify-between">
                <span>Fecha Recogida:</span>
                <span className="text-slate-900 font-bold">{pickupDate || "No seleccionada"}</span>
              </div>

              <div className="flex justify-between border-t border-slate-100 pt-3 text-sm font-extrabold text-slate-950">
                <span>Tarifa Estimada:</span>
                <span className="text-[#d3121a]">RD${shippingFee.toLocaleString()}</span>
              </div>

            </div>

            <div className="p-4 bg-slate-50 border border-[#E7E7EC] rounded-xl flex items-start gap-3">
              <Clock size={16} className="text-slate-600 mt-0.5 shrink-0" />
              <div>
                <h5 className="font-bold text-[10px] text-slate-800 uppercase tracking-wider">Envío Express</h5>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-normal">
                  Ruta local regular express. Tiempos garantizados de 2-4 horas.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
