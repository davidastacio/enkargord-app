"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Phone, 
  Mail, 
  DollarSign, 
  Clock,
  ArrowLeft,
  ShieldAlert,
  Calendar,
  Link2,
  CheckCircle2,
  X,
  Search,
  MapPin,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import DeliveryLocationMap from '@/components/DeliveryLocationMap';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  PROVINCES,
  MUNICIPALITIES,
  MUNICIPAL_DISTRICTS,
  SECTORS,
  matchTerritoryName,
  normalizeText,
  Province,
  Municipality,
  MunicipalDistrict,
  Sector
} from '@/data/territory';

export default function CreateOrder() {
  const router = useRouter();
  const { profile } = useAuth();

  // SECTION 1 — DATOS DEL CLIENTE
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custPhoneAlt, setCustPhoneAlt] = useState('');
  const [custEmail, setCustEmail] = useState('');

  // SECTION 2 — DATOS DE ENTREGA ENCADENADOS
  const [country] = useState('República Dominicana');
  
  const [selectedProvId, setSelectedProvId] = useState('PROV_DN'); // Distrito Nacional por defecto
  const [selectedMunId, setSelectedMunId] = useState('MUN_DN_01');
  const [selectedDistId, setSelectedDistId] = useState('');
  
  const [sectorSearch, setSectorSearch] = useState('Naco');
  const [selectedSectorId, setSelectedSectorId] = useState('SEC_DN_01'); // Naco por defecto
  const [selectedSectorName, setSelectedSectorName] = useState('Naco');
  const [isCustomSector, setIsCustomSector] = useState(false);
  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false);

  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [reference, setReference] = useState('');
  const [formattedAddress, setFormattedAddress] = useState('');

  // Ubicación compartida y Coordenadas GPS (Santo Domingo por defecto)
  const [sharedLocationUrl, setSharedLocationUrl] = useState('');
  const [latitude, setLatitude] = useState<number>(18.4861);
  const [longitude, setLongitude] = useState<number>(-69.9312);
  const [locationSource, setLocationSource] = useState<'manual_address' | 'whatsapp' | 'google_maps' | 'coordinates' | 'manual_map'>('manual_address');
  const [locationVerified, setLocationVerified] = useState(false);

  // SECTION 3 — INFORMACIÓN LOGÍSTICA
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

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'warning' | 'error'>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Diálogo de discrepancia de arrastre
  const [pendingDragCoords, setPendingDragCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dragAddressDetails, setDragAddressDetails] = useState<any>(null);

  const shippingFee = 200;

  // Filtered dropdowns
  const availableMunicipalities = MUNICIPALITIES.filter(m => m.provinceId === selectedProvId);
  const availableDistricts = MUNICIPAL_DISTRICTS.filter(d => d.municipalityId === selectedMunId);
  
  const availableSectors = SECTORS.filter(s => {
    const matchMun = s.municipalityId === selectedMunId;
    const matchDist = !selectedDistId || s.municipalDistrictId === selectedDistId;
    return matchMun && matchDist;
  });

  const filteredSectors = availableSectors.filter(s => 
    normalizeText(s.name).includes(normalizeText(sectorSearch))
  );

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Re-generate formatted address string on field modifications
  useEffect(() => {
    const provName = PROVINCES.find(p => p.id === selectedProvId)?.name || '';
    const munName = MUNICIPALITIES.find(m => m.id === selectedMunId)?.name || '';
    const sectorName = isCustomSector ? sectorSearch : (SECTORS.find(s => s.id === selectedSectorId)?.name || '');
    
    const parts = [];
    if (street) parts.push(street);
    if (streetNumber) parts.push(`#${streetNumber}`);
    if (sectorName) parts.push(sectorName);
    if (munName) parts.push(munName);
    if (provName) parts.push(provName);
    parts.push(country);

    setFormattedAddress(parts.join(', '));
  }, [selectedProvId, selectedMunId, selectedSectorId, sectorSearch, isCustomSector, street, streetNumber]);

  // Resolve Location URL trigger
  const handleResolveLocation = async () => {
    if (!sharedLocationUrl.trim()) {
      setLocationError("Por favor pegue un enlace o coordenadas antes de cargar.");
      return;
    }

    setIsResolvingLocation(true);
    setLocationStatus('loading');
    setLocationError(null);

    try {
      const res = await fetch('/api/location/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sharedLocationUrl })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "No pudimos reconocer este enlace de ubicación.");
      }

      setLatitude(data.latitude);
      setLongitude(data.longitude);
      setLocationSource(data.source);
      
      // Auto-populate territorial fields using reverse geocode results
      const details = data.details || {};
      applyGeocodedFields(details);

      setLocationVerified(true);
      triggerToast("Ubicación cargada correctamente.");
    } catch (err: any) {
      // Non-blocking warning instead of error blocking
      setLocationStatus('warning');
      setLocationError(err.message || "No pudimos identificar automáticamente el sector. Selecciónalo o escríbelo manualmente.");
    } finally {
      setIsResolvingLocation(false);
    }
  };

  // Apply reverse geocoded details helper
  const applyGeocodedFields = (details: any) => {
    let warningFound = false;

    // 1. Match Province
    if (details.state || details.county) {
      const matchedProv = matchTerritoryName(details.state || details.county, 'province');
      const provObj = PROVINCES.find(p => p.name === matchedProv);
      if (provObj) {
        setSelectedProvId(provObj.id);
      } else {
        warningFound = true;
      }
    }

    // 2. Match Municipality
    if (details.city) {
      const matchedMun = matchTerritoryName(details.city, 'municipality');
      const munObj = MUNICIPALITIES.find(m => m.name === matchedMun);
      if (munObj) {
        setSelectedMunId(munObj.id);
      } else {
        warningFound = true;
      }
    }

    // 3. Match Sector
    if (details.suburb) {
      const matchedSector = details.suburb;
      const sectorObj = SECTORS.find(s => s.name.toLowerCase() === matchedSector.toLowerCase());
      if (sectorObj) {
        setSelectedSectorId(sectorObj.id);
        setSelectedSectorName(sectorObj.name);
        setSectorSearch(sectorObj.name);
        setIsCustomSector(false);
      } else {
        setSectorSearch(matchedSector);
        setIsCustomSector(true);
        setSelectedSectorId('custom');
        setSelectedSectorName(matchedSector);
      }
    } else {
      warningFound = true;
    }

    // 4. Match Street & House number
    if (details.road) {
      setStreet(details.road);
    }
    if (details.houseNumber) {
      setStreetNumber(details.houseNumber);
    }

    if (warningFound) {
      setLocationStatus('warning');
      setLocationError("Ubicación encontrada, pero debes completar el sector manualmente.");
    } else {
      setLocationStatus('success');
    }
  };

  // Search Address on Map
  const handleSearchAddressOnMap = async () => {
    const provName = PROVINCES.find(p => p.id === selectedProvId)?.name || '';
    const munName = MUNICIPALITIES.find(m => m.id === selectedMunId)?.name || '';
    const sectorName = isCustomSector ? sectorSearch : (SECTORS.find(s => s.id === selectedSectorId)?.name || '');

    if (!street.trim()) {
      alert("Por favor ingrese al menos la calle o avenida para realizar la búsqueda.");
      return;
    }

    setIsSearchingAddress(true);
    setLocationStatus('loading');

    try {
      const res = await fetch('/api/location/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          street,
          sector: sectorName,
          municipality: munName,
          province: provName,
          country
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Dirección no encontrada.");
      }

      setLatitude(data.latitude);
      setLongitude(data.longitude);
      setLocationVerified(true);
      setLocationStatus('success');
      triggerToast("Dirección encontrada y fijada en el mapa.");
    } catch (err: any) {
      setLocationStatus('warning');
      alert(err.message || "No pudimos ubicar la dirección exacta. Ubícala arrastrando el pin.");
    } finally {
      setIsSearchingAddress(false);
    }
  };

  // Draggable Marker callbacks
  const handleMarkerDragEnd = async (newLat: number, newLng: number) => {
    try {
      const res = await fetch('/api/location/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: `${newLat}, ${newLng}` })
      });
      const data = await res.json();

      if (data.success) {
        setPendingDragCoords({ lat: newLat, lng: newLng });
        setDragAddressDetails(data.details);
      } else {
        setLatitude(newLat);
        setLongitude(newLng);
        setLocationSource('manual_map');
      }
    } catch {
      setLatitude(newLat);
      setLongitude(newLng);
      setLocationSource('manual_map');
    }
  };

  const handleApplyDragFields = () => {
    if (pendingDragCoords && dragAddressDetails) {
      setLatitude(pendingDragCoords.lat);
      setLongitude(pendingDragCoords.lng);
      setLocationSource('manual_map');
      applyGeocodedFields(dragAddressDetails);
    }
    setPendingDragCoords(null);
    setDragAddressDetails(null);
    triggerToast("Campos territoriales actualizados.");
  };

  const handleKeepDragFields = () => {
    if (pendingDragCoords) {
      setLatitude(pendingDragCoords.lat);
      setLongitude(pendingDragCoords.lng);
      setLocationSource('manual_map');
    }
    setPendingDragCoords(null);
    setDragAddressDetails(null);
    triggerToast("Ubicación movida. Cambios manuales preservados.");
  };

  const handleResetLocation = () => {
    setLatitude(18.4861);
    setLongitude(-69.9312);
    setLocationVerified(false);
    setSharedLocationUrl('');
    setLocationSource('manual_address');
    setFormattedAddress('');
    setLocationError(null);
    setLocationStatus('idle');
  };

  const handleConfirmLocation = () => {
    setLocationVerified(true);
    triggerToast("✓ Ubicación GPS confirmada");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const provName = PROVINCES.find(p => p.id === selectedProvId)?.name || '';
    const munName = MUNICIPALITIES.find(m => m.id === selectedMunId)?.name || '';
    const sectorName = isCustomSector ? sectorSearch : (SECTORS.find(s => s.id === selectedSectorId)?.name || '');

    if (!custName.trim() || !custPhone.trim() || !pickupDate) {
      alert("Por favor rellene los campos obligatorios del envío (Nombre, Teléfono y Fecha de Recogida).");
      return;
    }

    if (!provName || !munName || !sectorName.trim()) {
      alert("Por favor complete los campos obligatorios de Provincia, Municipio y Sector (puede escribirlo manualmente).");
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

    try {
      const localOrders = localStorage.getItem('enkargord_orders');
      const currentOrders = localOrders ? JSON.parse(localOrders) : [];

      const nextNumber = currentOrders.length > 0
        ? Math.max(...currentOrders.map((o: any) => parseInt(o.trackingId?.split('-')[1]) || 0)) + 1
        : 1251;

      const pCost = requiresCod ? (parseFloat(collectAmount) || 0) : 0;
      
      const newOrder = {
        id: `ENK-${nextNumber}`,
        trackingId: `ENK-${nextNumber}`,
        status: 'pending',
        storeId: profile?.uid || "STORE_01",
        storeName: profile?.name || "Moda Express RD",
        courierName: "No asignado",
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
        customer: {
          name: custName,
          phone: custPhone,
          email: custEmail || undefined
        },
        country,
        provinceId: selectedProvId,
        provinceName: provName,
        municipalityId: selectedMunId,
        municipalityName: munName,
        municipalDistrictId: selectedDistId || undefined,
        municipalDistrictName: selectedDistId ? MUNICIPAL_DISTRICTS.find(d => d.id === selectedDistId)?.name : undefined,
        sectorId: selectedSectorId === 'custom' ? null : selectedSectorId,
        sectorName: sectorName,
        sectorIsCustom: isCustomSector,
        street,
        streetNumber,
        reference,
        formattedAddress,
        deliveryAddress: {
          addressLine: formattedAddress,
          city: `${sectorName} (${provName})`,
          coordinates: { lat: latitude, lng: longitude }
        },
        deliveryLocationUrl: sharedLocationUrl || undefined,
        deliveryLatitude: latitude,
        deliveryLongitude: longitude,
        deliveryLocationSource: locationSource,
        deliveryLocationVerified: locationVerified,
        
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

      // 1. Save to Cloud Firestore
      await setDoc(doc(db, 'orders', newOrder.id), newOrder);

      // 2. Synchronize Cache in LocalStorage
      const updated = [newOrder, ...currentOrders];
      localStorage.setItem('enkargord_orders', JSON.stringify(updated));

      triggerToast(`Guía logística #${newOrder.trackingId} registrada.`);
      router.push('/tienda/pedidos');
    } catch (err: any) {
      console.error("Error creating order in Firestore:", err);
      alert("Error al registrar el pedido en la base de datos: " + (err.message || err));
    } finally {
      setIsLoading(false);
    }
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

      {/* Discrepancy drag popup prompt */}
      {pendingDragCoords && dragAddressDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-[#E7E7EC] animate-scale-up">
            <h4 className="font-extrabold text-slate-950 text-sm">📍 Ubicación Modificada en Mapa</h4>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              La nueva ubicación contiene datos de dirección diferentes a los configurados. ¿Deseas actualizar la dirección del pedido con la del nuevo punto?
            </p>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-mono text-slate-500">
              {dragAddressDetails.road || "Calle desconocida"}, {dragAddressDetails.suburb || "Sector desconocido"}, {dragAddressDetails.city || "Ciudad"}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleKeepDragFields}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all"
              >
                Mantener mis cambios
              </button>
              <button
                type="button"
                onClick={handleApplyDragFields}
                className="flex-1 bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md shadow-red-100"
              >
                Actualizar campos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
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
            Registra los datos de transporte bajo protección de privacidad comercial de EnkargoRD.
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
                <input 
                  type="email" 
                  placeholder="cliente@correo.com"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                />
              </div>

            </div>
          </div>

          {/* SECCIÓN 2 — DATOS DE ENTREGA */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-950 text-xs border-b border-slate-100 pb-2 uppercase tracking-wide">
              2. Ubicación y Datos de Entrega
            </h3>
            
            {/* Ubicación compartida */}
            <div className="p-4 bg-slate-50 border border-[#E7E7EC] rounded-2xl space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Ubicación compartida
                  </label>
                  {locationStatus === 'loading' && <span className="text-[9px] text-[#d3121a] font-bold animate-pulse">📡 Obteniendo ubicación...</span>}
                  {locationStatus === 'success' && <span className="text-[9px] text-emerald-600 font-bold">✓ Dirección encontrada</span>}
                  {locationStatus === 'warning' && <span className="text-[9px] text-amber-600 font-bold">⚠️ {locationError || "Ubicación encontrada, completa los datos faltantes"}</span>}
                </div>
                
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Pega aquí el enlace de ubicación enviado por WhatsApp o Google Maps"
                    value={sharedLocationUrl}
                    onChange={(e) => setSharedLocationUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleResolveLocation}
                    disabled={isResolvingLocation}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shrink-0"
                  >
                    {isResolvingLocation ? "Cargando..." : "Cargar ubicación"}
                  </button>
                </div>
              </div>

              {locationStatus === 'warning' && locationError && (
                <div className="p-3 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-xl border border-amber-200 flex items-center justify-between">
                  <span>⚠️ {locationError}</span>
                  <button type="button" onClick={() => setLocationError(null)} className="text-amber-600">
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Selectores encadenados y datos territoriales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">País</label>
                <input 
                  type="text" 
                  disabled
                  value={country}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-[#E7E7EC] rounded-xl text-xs font-semibold text-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Provincia *</label>
                <select
                  value={selectedProvId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedProvId(id);
                    // Cascade resets
                    const filteredMuns = MUNICIPALITIES.filter(m => m.provinceId === id);
                    if (filteredMuns.length > 0) {
                      setSelectedMunId(filteredMuns[0].id);
                      setSelectedDistId('');
                      const matchedSects = SECTORS.filter(s => s.municipalityId === filteredMuns[0].id);
                      if (matchedSects.length > 0) {
                        setSelectedSectorId(matchedSects[0].id);
                        setSelectedSectorName(matchedSects[0].name);
                        setSectorSearch(matchedSects[0].name);
                      }
                    }
                  }}
                  className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                >
                  {PROVINCES.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Municipio o ciudad *</label>
                <select
                  value={selectedMunId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedMunId(id);
                    setSelectedDistId('');
                    const matchedSects = SECTORS.filter(s => s.municipalityId === id);
                    if (matchedSects.length > 0) {
                      setSelectedSectorId(matchedSects[0].id);
                      setSelectedSectorName(matchedSects[0].name);
                      setSectorSearch(matchedSects[0].name);
                    }
                  }}
                  className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                >
                  {availableMunicipalities.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Distrito municipal (Opcional)</label>
                <select
                  value={selectedDistId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedDistId(id);
                    const matchedSects = SECTORS.filter(s => s.municipalityId === selectedMunId && (!id || s.municipalDistrictId === id));
                    if (matchedSects.length > 0) {
                      setSelectedSectorId(matchedSects[0].id);
                      setSelectedSectorName(matchedSects[0].name);
                      setSectorSearch(matchedSects[0].name);
                    }
                  }}
                  className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                >
                  <option value="">Ninguno</option>
                  {availableDistricts.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* COMBOBOX DE SECTOR */}
            <div className="space-y-1 relative">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Sector o barrio</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Escribe para buscar sector o barrio..."
                  value={sectorSearch}
                  onFocus={() => setIsSectorDropdownOpen(true)}
                  onChange={(e) => {
                    setSectorSearch(e.target.value);
                    setIsCustomSector(true);
                    setSelectedSectorId('custom');
                    setSelectedSectorName(e.target.value);
                  }}
                  className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setIsSectorDropdownOpen(!isSectorDropdownOpen)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold"
                >
                  ▼
                </button>
              </div>

              {isSectorDropdownOpen && (
                <div className="absolute left-0 right-0 top-[65px] bg-white border border-[#E7E7EC] rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto py-1 text-xs">
                  {filteredSectors.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedSectorId(s.id);
                        setSelectedSectorName(s.name);
                        setSectorSearch(s.name);
                        setIsCustomSector(false);
                        setIsSectorDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold text-slate-700"
                    >
                      {s.name}
                    </button>
                  ))}
                  {sectorSearch.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomSector(true);
                        setSelectedSectorId('custom');
                        setSelectedSectorName(sectorSearch);
                        setIsSectorDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 font-bold text-[#d3121a] border-t border-slate-100"
                    >
                      + Agregar "{sectorSearch}" como sector personalizado
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Calle o avenida</label>
                <input 
                  type="text" 
                  placeholder="Ej. Avenida Winston Churchill"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Número</label>
                <input 
                  type="text" 
                  placeholder="Ej. #45 o Apto 2B"
                  value={streetNumber}
                  onChange={(e) => setStreetNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Punto de referencia</label>
              <input 
                type="text" 
                placeholder="Ej. Frente a la Torre Blue Mall"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Dirección completa</label>
              <input 
                type="text" 
                readOnly
                value={formattedAddress}
                className="w-full px-4 py-2.5 bg-slate-50 border border-[#E7E7EC] rounded-xl text-xs font-bold text-slate-500 focus:outline-none cursor-not-allowed"
              />
            </div>

            {/* BUSCAR EN EL MAPA BUTTON */}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleSearchAddressOnMap}
                disabled={isSearchingAddress}
                className="bg-slate-100 hover:bg-slate-200 border border-[#E7E7EC] text-slate-700 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
              >
                <Search size={14} />
                {isSearchingAddress ? "Buscando..." : "Buscar dirección en el mapa"}
              </button>
            </div>

            {/* MAP COMPONENT VISIBLE ALWAYS */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Localización Geográfica</span>
                {locationVerified && (
                  <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                    ✓ Ubicación GPS confirmada
                  </span>
                )}
              </div>
              
              <div className="w-full h-[280px] rounded-xl overflow-hidden relative">
                <DeliveryLocationMap 
                  latitude={latitude} 
                  longitude={longitude} 
                  onMarkerDragEnd={handleMarkerDragEnd} 
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 border border-[#E7E7EC] rounded-xl">
                <div className="text-[10px] font-semibold text-slate-500">
                  <div><strong>Latitud:</strong> {latitude.toFixed(6)} | <strong>Longitud:</strong> {longitude.toFixed(6)}</div>
                  {locationSource !== 'manual_address' && (
                    <div className="text-[9px] text-slate-400 mt-0.5">Origen: {locationSource}</div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleResetLocation}
                    className="bg-white hover:bg-slate-100 border border-[#E7E7EC] text-slate-600 font-bold text-xs px-3 py-1.5 rounded-lg transition-all"
                  >
                    Cambiar ubicación
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmLocation}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all"
                  >
                    Confirmar ubicación
                  </button>
                </div>
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
                <span className="text-slate-900 truncate max-w-[140px]" title={formattedAddress}>{formattedAddress || "Sin registrar"}</span>
              </div>

              <div className="flex justify-between">
                <span>Sector:</span>
                <span className="text-slate-900 font-semibold">{selectedSectorName}</span>
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
