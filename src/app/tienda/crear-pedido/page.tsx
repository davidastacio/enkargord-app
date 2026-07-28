"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Phone, 
  DollarSign, 
  Clock,
  ArrowLeft,
  ShieldAlert,
  X,
  Search,
  ShoppingBag,
  Tag,
} from 'lucide-react';
import Link from 'next/link';
import DeliveryLocationMap from '@/components/DeliveryLocationMap';
import { useAuth } from '@/hooks/useAuth';
import { createSupabaseOrder } from '@/lib/supabase/orders';
import { getOperationSettings } from '@/lib/supabase/operations';
import { getStoreProducts, saveStoreProduct, type StoreProductItem } from '@/lib/supabase/products';
import { getSupabaseStore } from '@/lib/supabase/stores';
import { DEFAULT_PRICING, type PricingSettings } from '@/data/courier';
import {
  PROVINCES,
  MUNICIPALITIES,
  MUNICIPAL_DISTRICTS,
  SECTORS,
  matchTerritoryName,
  normalizeText,
} from '@/data/territory';

export default function CreateOrder() {
  const router = useRouter();
  const { profile, user, isImpersonating } = useAuth();

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

  // SECTION 3 — RECAUDO Y PAGO (COD)
  const [requiresCod, setRequiresCod] = useState(true);
  const [collectAmount, setCollectAmount] = useState('1500');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');

  // UI States
  const [diagCode, setDiagCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'warning' | 'error'>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Diálogo de discrepancia de arrastre
  const [pendingDragCoords, setPendingDragCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dragAddressDetails, setDragAddressDetails] = useState<any>(null);

  const [shippingType, setShippingType] = useState<'regular' | 'express'>('regular');
  const [shippingFee, setShippingFee] = useState(DEFAULT_PRICING.baseShippingCost);
  const [expressShippingFee, setExpressShippingFee] = useState(DEFAULT_PRICING.expressShippingCost || 450);
  const [hasSpecialPrice, setHasSpecialPrice] = useState(false);

  // PRODUCT CATALOG & AUTO-FILL STATE
  const [productName, setProductName] = useState('');
  const [storeCatalog, setStoreCatalog] = useState<StoreProductItem[]>([]);

  // Load store product catalog on mount
  useEffect(() => {
    const storeIdReal = profile?.storeId || profile?.uid;
    if (!storeIdReal) return;
    void getStoreProducts(storeIdReal).then(setStoreCatalog);
  }, [profile?.storeId, profile?.uid]);

  // Load operation settings & special store pricing
  useEffect(() => {
    if (!profile?.uid) return;
    let active = true;
    const currentStoreId = profile?.storeId || profile?.uid;

    void getOperationSettings<PricingSettings>()
      .then((settings) => {
        if (!active) return;

        // Check if Admin assigned a special price for this store
        const specialEntry = settings?.specialStorePrices?.find(
          s => s.storeId === currentStoreId || s.storeId === profile?.uid || s.storeId === profile?.storeId
        );

        if (specialEntry) {
          setHasSpecialPrice(true);
          setShippingFee(specialEntry.baseShippingCost);
          setExpressShippingFee(specialEntry.expressShippingCost ?? 450);
        } else {
          setHasSpecialPrice(false);
          const configuredFee = parseFloat(String(settings?.baseShippingCost ?? ''));
          const configuredExpressFee = parseFloat(String(settings?.expressShippingCost ?? ''));
          if (Number.isFinite(configuredFee) && configuredFee >= 0) {
            setShippingFee(configuredFee);
          }
          if (Number.isFinite(configuredExpressFee) && configuredExpressFee >= 0) {
            setExpressShippingFee(configuredExpressFee);
          }
        }
      })
      .catch((error) => {
        console.error('Error loading the current shipping fee:', error);
      });
    return () => {
      active = false;
    };
  }, [profile?.uid, profile?.storeId]);

  const handleProductNameChange = (value: string) => {
    setProductName(value);
    const matchedProduct = storeCatalog.find(
      p => p.name.toLowerCase() === value.trim().toLowerCase()
    );
    if (matchedProduct) {
      setCollectAmount(matchedProduct.price.toString());
      triggerToast(`⚡ Precio RD$${matchedProduct.price} cargado automáticamente para "${matchedProduct.name}".`);
    }
  };

  const activeShippingFee = shippingType === 'express' ? expressShippingFee : shippingFee;

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
    const flowId = `ORD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    setDiagCode(flowId);
    const t0 = performance.now();

    const provName = PROVINCES.find(p => p.id === selectedProvId)?.name || '';
    const munName = MUNICIPALITIES.find(m => m.id === selectedMunId)?.name || '';
    const sectorName = isCustomSector ? sectorSearch : (SECTORS.find(s => s.id === selectedSectorId)?.name || '');

    if (!custName.trim() || !custPhone.trim()) {
      alert("Por favor rellene los campos obligatorios del envío (Nombre y Teléfono del cliente).");
      return;
    }

    if (!provName || !munName || !sectorName.trim()) {
      alert("Por favor complete los campos obligatorios de Provincia, Municipio y Sector.");
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
      const storeIdReal = profile?.storeId || profile?.uid || "STORE_01";

      // Secure and Unique Tracking Code Generation: ENK-YYYYMMDD-XXXXX
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}${mm}${dd}`;
      const randomId = Math.random().toString(36).substring(2, 7).toUpperCase();
      const orderTrackingCode = `ENK-${dateStr}-${randomId}`;

      const storeRecord = await getSupabaseStore(storeIdReal);
      const storeNameResolved =
        storeRecord?.commercialName ||
        (profile as any)?.storeName ||
        (profile as any)?.commercialName ||
        'Tienda';

      const newOrder = {
        id: orderTrackingCode,
        tracking: orderTrackingCode,
        storeId: storeIdReal,
        storeName: storeNameResolved,
        createdByUid: user?.uid || profile?.uid || "STORE_01",
        
        customerName: custName,
        customerPhone: custPhone,
        customerAlternatePhone: custPhoneAlt || null,
        customerEmail: custEmail || null,
        
        provinceId: selectedProvId || null,
        provinceName: provName,
        municipalityId: selectedMunId || null,
        municipalityName: munName,
        municipalDistrictId: selectedDistId || null,
        municipalDistrictName: selectedDistId ? (MUNICIPAL_DISTRICTS.find(d => d.id === selectedDistId)?.name || null) : null,
        sectorId: selectedSectorId === 'custom' ? null : (selectedSectorId || null),
        sectorName: sectorName,
        sectorIsCustom: isCustomSector,
        
        street: street || null,
        streetNumber: streetNumber || null,
        reference: reference || null,
        formattedAddress: formattedAddress || null,
        
        latitude: latitude || null,
        longitude: longitude || null,
        locationVerified,
        locationSource: locationSource || null,
        
        packageType: "Paquete pequeño",
        packageQuantity: 1,
        packageDescription: productName.trim() || "Paquete pequeño",
        productName: productName.trim() || null,
        approximateWeight: null,
        handlingInstructions: [],
        
        requiresCashOnDelivery: requiresCod,
        collectionAmount: requiresCod ? (parseFloat(collectAmount) || 0) : 0,
        shippingCost: activeShippingFee,
        shippingType: shippingType,
        paymentMethod: paymentMethod || null,
        priceIncludesShipping: true,
        financialVersion: 2,
        metadata: {
          storeName: storeNameResolved,
          priceIncludesShipping: true,
          financialVersion: 2,
        },
        
        requiresFulfillment: false,
        fulfillmentType: null,
        
        courierId: null,
        courierUid: null,
        courierName: null,
        
        status: "pending",
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Auto-save product to store catalog for future auto-fill
      if (productName.trim() && requiresCod) {
        void saveStoreProduct(storeIdReal, {
          name: productName.trim(),
          price: parseFloat(collectAmount) || 0
        });
      }

      await createSupabaseOrder(newOrder);

      triggerToast("Pedido creado correctamente.");
      router.push(`/tienda/pedidos/${newOrder.id}`);
      router.refresh();
    } catch (err: any) {
      console.error("Error creating order in Supabase:", err);
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
          {isImpersonating && (
            <div className="text-[10px] text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1 rounded-lg font-black inline-block mt-2">
              ⚡ MODO DIOS ACTIVO: Creando pedido a nombre de "{profile?.name}"
            </div>
          )}
          {diagCode && (
            <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest bg-white border border-[#E7E7EC] px-3 py-1.5 rounded-lg inline-block mt-2 ml-2">
              Código de diagnóstico: {diagCode}
            </div>
          )}
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

          {hasSpecialPrice && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs font-extrabold text-slate-900">
                <Tag size={18} className="text-[#d3121a]" />
                <span>🏷️ ¡Tu tienda cuenta con una Tarifa Especial Asignada por EnkargoRD!</span>
              </div>
              <span className="text-[10px] bg-[#d3121a] text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Precio Especial Activo
              </span>
            </div>
          )}

          {/* SECCIÓN 3 — SELECCIÓN DE TARIFA DE ENVÍO */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-950 text-xs border-b border-slate-100 pb-2 uppercase tracking-wide">
              3. Tipo de Tarifa de Envío
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Opción 1: Envío Estándar / Regular */}
              <button
                type="button"
                onClick={() => setShippingType('regular')}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  shippingType === 'regular'
                    ? 'bg-white border-[#d3121a] shadow-md ring-2 ring-[#d3121a]/20'
                    : 'bg-slate-50 border-[#E7E7EC] hover:bg-white text-slate-600'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-xs text-slate-900">Envío Estándar / Regular</span>
                  <span className="font-black text-sm text-slate-900">RD${shippingFee.toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1 leading-snug">
                  Entrega regular express en ruta estándar (24-48 hrs).
                </p>
                {shippingType === 'regular' && (
                  <span className="text-[9px] font-extrabold text-[#d3121a] bg-[#fee2e2] px-2.5 py-0.5 rounded-full inline-block mt-2">
                    ✓ Seleccionado
                  </span>
                )}
              </button>

              {/* Opción 2: Envío Express Prioritario */}
              <button
                type="button"
                onClick={() => setShippingType('express')}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  shippingType === 'express'
                    ? 'bg-white border-[#d3121a] shadow-md ring-2 ring-[#d3121a]/20'
                    : 'bg-slate-50 border-[#E7E7EC] hover:bg-white text-slate-600'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-xs text-[#d3121a] flex items-center gap-1">
                    ⚡ Envío Express Prioritario
                  </span>
                  <span className="font-black text-sm text-[#d3121a]">RD${expressShippingFee.toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1 leading-snug">
                  Entrega prioritaria inmediata en tiempo récord mismo día.
                </p>
                {shippingType === 'express' && (
                  <span className="text-[9px] font-extrabold text-[#d3121a] bg-[#fee2e2] px-2.5 py-0.5 rounded-full inline-block mt-2">
                    ⚡ Seleccionado
                  </span>
                )}
              </button>

            </div>
          </div>

          {/* SECCIÓN 4 — RECAUDO Y PAGO (COD) */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-950 text-xs border-b border-slate-100 pb-2 uppercase tracking-wide">
              4. Recaudo y Pago Financiero (COD)
            </h3>
            
            {/* Campo Nombre del producto con auto-llenado de catálogo */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <ShoppingBag size={12} className="text-[#d3121a]" /> Nombre del producto (Opcional)
                </span>
                {storeCatalog.length > 0 && (
                  <span className="text-[9px] text-[#d3121a] font-bold">
                    ⚡ {storeCatalog.length} en catálogo
                  </span>
                )}
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  list="store-products-list"
                  placeholder="Ej. Zapatos, Vestido, Audífonos..."
                  value={productName}
                  onChange={(e) => handleProductNameChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                />
                <datalist id="store-products-list">
                  {storeCatalog.map(p => (
                    <option key={p.id} value={p.name}>RD${p.price.toLocaleString()} — {p.name}</option>
                  ))}
                </datalist>
              </div>
            </div>

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
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Monto Total a cobrar al cliente (Envío Incluido) (RD$)
                </label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="number" 
                    disabled={!requiresCod}
                    placeholder="Ej. 1850"
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-white disabled:bg-slate-50 disabled:text-slate-400 border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                  />
                </div>
              </div>

            </div>

            {requiresCod && (parseFloat(collectAmount) || 0) > 0 && (
              <div className="bg-slate-50 border border-[#E7E7EC] rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>💵 Total a cobrar al cliente en destino (COD):</span>
                  <span className="font-extrabold text-slate-900">RD${(parseFloat(collectAmount) || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>🛵 Tarifa de envío EnkargoRD ({shippingType === 'express' ? '⚡ Express' : 'Estándar'}):</span>
                  <span className="font-extrabold text-[#d3121a]">- RD${activeShippingFee.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-extrabold">
                  <span className="text-emerald-700">💰 Neto a liquidar a tu tienda (Ganancia del producto):</span>
                  <span className="text-sm font-black text-emerald-600">
                    RD${Math.max(0, (parseFloat(collectAmount) || 0) - activeShippingFee).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

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

          {/* Action triggers */}
          <div className="flex gap-4 pt-4 border-t border-slate-100">
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
                <span>Total a cobrar al cliente (COD):</span>
                <span className="text-slate-950 font-bold">RD${(requiresCod ? parseFloat(collectAmount) || 0 : 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span>Método de Pago:</span>
                <span className="text-slate-900 font-bold">{paymentMethod}</span>
              </div>

              <div className="flex justify-between">
                <span>Tipo de Tarifa:</span>
                <span className={`font-bold ${shippingType === 'express' ? 'text-[#d3121a]' : 'text-slate-900'}`}>
                  {shippingType === 'express' ? '⚡ Express Prioritario' : 'Estándar / Regular'}
                </span>
              </div>

              <div className="flex justify-between border-t border-slate-100 pt-3 text-xs font-bold text-slate-600">
                <span>Tarifa de envío EnkargoRD:</span>
                <span className="text-[#d3121a]">- RD${activeShippingFee.toLocaleString()}</span>
              </div>

              <div className="flex justify-between rounded-xl bg-emerald-50 px-3.5 py-3 text-sm font-extrabold text-emerald-800 border border-emerald-200">
                <span>Neto a liquidar a tu tienda:</span>
                <span>RD${Math.max(0, (requiresCod ? parseFloat(collectAmount) || 0 : 0) - activeShippingFee).toLocaleString()}</span>
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
