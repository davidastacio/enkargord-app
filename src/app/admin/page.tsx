"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  DollarSign, 
  Plus, 
  MapPin, 
  Users, 
  Settings, 
  LogOut, 
  Navigation, 
  X,
  Phone,
  AlertTriangle,
  UserCheck,
  Building,
  Map
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import MapComponent from '@/components/MapComponent';

// TypeScript Types
interface Financials {
  productCost: number;
  shippingCost: number;
  fulfillmentCost: number;
  totalCollected: number;
  storeOwnerAmount: number;
  polancoCommission: number;
  transportadoraCommission: number;
}

interface Order {
  id: string;
  trackingId: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'no_contesta';
  storeId: string;
  storeName: string;
  courierName: string;
  time: string;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
  };
  deliveryAddress: {
    addressLine: string;
    city: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  fulfillment: boolean;
  financials: Financials;
}

interface Courier {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  status: 'Disponible' | 'En ruta' | 'Offline';
}

// Initial Data Constants
const DEFAULT_ORDERS: Order[] = [
  {
    id: "ENK-1250",
    trackingId: "ENK-1250",
    status: "in_transit",
    storeId: "STORE_01",
    storeName: "Moda Express RD",
    courierName: "Carlos M.",
    time: "10:30 AM",
    createdAt: "2026-07-20T14:30:00Z",
    customer: { name: "Juan Pérez", phone: "+18095551234" },
    deliveryAddress: { addressLine: "Av. Churchill #12", city: "Naco (Santo Domingo)", coordinates: { lat: 18.4795, lng: -69.9326 } },
    fulfillment: true,
    financials: {
      productCost: 1800,
      shippingCost: 250,
      fulfillmentCost: 40,
      totalCollected: 2090,
      storeOwnerAmount: 1800,
      polancoCommission: 50,
      transportadoraCommission: 200
    }
  },
  {
    id: "ENK-1249",
    trackingId: "ENK-1249",
    status: "delivered",
    storeId: "STORE_01",
    storeName: "Moda Express RD",
    courierName: "Luis A.",
    time: "10:15 AM",
    createdAt: "2026-07-20T14:15:00Z",
    customer: { name: "María Rodríguez", phone: "+18295555678" },
    deliveryAddress: { addressLine: "Calle El Sol #45", city: "Santiago - Centro", coordinates: { lat: 18.4556, lng: -69.9489 } },
    fulfillment: false,
    financials: {
      productCost: 3500,
      shippingCost: 300,
      fulfillmentCost: 0,
      totalCollected: 3800,
      storeOwnerAmount: 3500,
      polancoCommission: 50,
      transportadoraCommission: 250
    }
  },
  {
    id: "ENK-1248",
    trackingId: "ENK-1248",
    status: "pending",
    storeId: "STORE_01",
    storeName: "Moda Express RD",
    courierName: "No asignado",
    time: "09:58 AM",
    createdAt: "2026-07-20T13:58:00Z",
    customer: { name: "Pedro García", phone: "+18495559012" },
    deliveryAddress: { addressLine: "Residencial Alameda", city: "Piantini (Santo Domingo)", coordinates: { lat: 18.4746, lng: -69.9372 } },
    fulfillment: true,
    financials: {
      productCost: 1200,
      shippingCost: 200,
      fulfillmentCost: 40,
      totalCollected: 1440,
      storeOwnerAmount: 1200,
      polancoCommission: 50,
      transportadoraCommission: 150
    }
  },
  {
    id: "ENK-1247",
    trackingId: "ENK-1247",
    status: "in_transit",
    storeId: "STORE_01",
    storeName: "Moda Express RD",
    courierName: "Yoselin V.",
    time: "09:42 AM",
    createdAt: "2026-07-20T13:42:00Z",
    customer: { name: "Ana Martínez", phone: "+18095554321" },
    deliveryAddress: { addressLine: "Calle Duarte #80", city: "Bella Vista (Santo Domingo)", coordinates: { lat: 18.4735, lng: -69.8860 } },
    fulfillment: false,
    financials: {
      productCost: 2200,
      shippingCost: 250,
      fulfillmentCost: 0,
      totalCollected: 2450,
      storeOwnerAmount: 2200,
      polancoCommission: 50,
      transportadoraCommission: 200
    }
  }
];

const DEFAULT_COURIERS: Courier[] = [
  { id: "C-01", name: "Carlos M.", phone: "+18095551111", vehicle: "Motocicleta", plate: "K-123456", status: "Disponible" },
  { id: "C-02", name: "Luis A.", phone: "+18295552222", vehicle: "Motocicleta", plate: "K-654321", status: "Disponible" },
  { id: "C-03", name: "Yoselin V.", phone: "+18495553333", vehicle: "Motocicleta", plate: "K-987654", status: "En ruta" }
];

export default function AdminDashboard() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dispatch' | 'fleet' | 'settlement'>('dispatch');
  const [activeSidebarMenu, setActiveSidebarMenu] = useState<'dashboard' | 'fleet' | 'settlement' | 'config'>('dashboard');

  // Shared Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  
  // Modals States
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Inputs - Direct Order Form
  const [formCustName, setFormCustName] = useState('');
  const [formCustPhone, setFormCustPhone] = useState('');
  const [formCustAddress, setFormCustAddress] = useState('');
  const [formCustCity, setFormCustCity] = useState('Naco (Santo Domingo)');
  const [formProdCost, setFormProdCost] = useState('1500');
  const [formShipCost, setFormShipCost] = useState('200');

  // Form Inputs - Courier Form
  const [cFormName, setCFormName] = useState('');
  const [cFormPhone, setCFormPhone] = useState('');
  const [cFormVehicle, setCFormVehicle] = useState('Motocicleta');
  const [cFormPlate, setCFormPlate] = useState('');
  const [cFormUser, setCFormUser] = useState('');

  // Hydrate states from localStorage on Client Side mount
  useEffect(() => {
    const localOrders = localStorage.getItem('enkargord_orders');
    const localCouriers = localStorage.getItem('enkargord_couriers');

    if (localOrders) {
      setOrders(JSON.parse(localOrders));
    } else {
      setOrders(DEFAULT_ORDERS);
      localStorage.setItem('enkargord_orders', JSON.stringify(DEFAULT_ORDERS));
    }

    if (localCouriers) {
      setCouriers(JSON.parse(localCouriers));
    } else {
      setCouriers(DEFAULT_COURIERS);
      localStorage.setItem('enkargord_couriers', JSON.stringify(DEFAULT_COURIERS));
    }
  }, []);

  // Show dynamic toast helper
  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Financial calculations helper
  const calculateFinancials = (prodCost: number, shipCost: number, requiresFulfillment = false) => {
    const fCost = requiresFulfillment ? 40 : 0;
    const totalCollected = prodCost + shipCost + fCost;
    const polancoCommission = shipCost > 0 ? 50 : 0;
    const transportadoraCommission = shipCost > 0 ? Math.max(0, shipCost - polancoCommission) : 0;

    return {
      productCost: prodCost,
      shippingCost: shipCost,
      fulfillmentCost: fCost,
      totalCollected,
      storeOwnerAmount: prodCost,
      polancoCommission,
      transportadoraCommission
    };
  };

  // Dispatch unassigned order action handler
  const handleAssignCourier = (orderId: string, courierName: string) => {
    if (!courierName) return;

    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return { ...o, courierName, status: 'in_transit' as const };
      }
      return o;
    });

    const updatedCouriers = couriers.map(c => {
      if (c.name === courierName) {
        return { ...c, status: 'En ruta' as const };
      }
      return c;
    });

    setOrders(updatedOrders);
    setCouriers(updatedCouriers);
    localStorage.setItem('enkargord_orders', JSON.stringify(updatedOrders));
    localStorage.setItem('enkargord_couriers', JSON.stringify(updatedCouriers));

    triggerToast(`Pedido #${orderId} asignado y despachado con ${courierName}.`);
  };

  // Update in transit package status manually in control tower
  const handleUpdateStatus = (orderId: string, newStatus: Order['status']) => {
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return { ...o, status: newStatus };
      }
      return o;
    });

    // Check if we need to free the courier
    let finalCouriers = [...couriers];
    if (newStatus === 'delivered' || newStatus === 'pending') {
      const targetOrder = orders.find(o => o.id === orderId);
      if (targetOrder) {
        const cName = targetOrder.courierName;
        // check if this courier has any other in transit package left
        const remainingTransit = updatedOrders.filter(o => o.courierName === cName && o.status === 'in_transit');
        if (remainingTransit.length === 0) {
          finalCouriers = couriers.map(c => {
            if (c.name === cName) {
              return { ...c, status: 'Disponible' as const };
            }
            return c;
          });
        }
      }
    }

    setOrders(updatedOrders);
    setCouriers(finalCouriers);
    localStorage.setItem('enkargord_orders', JSON.stringify(updatedOrders));
    localStorage.setItem('enkargord_couriers', JSON.stringify(finalCouriers));

    const friendlyStatus = newStatus === 'delivered' ? 'Entregado' : newStatus === 'no_contesta' ? 'No Contesta' : newStatus;
    triggerToast(`Pedido #${orderId} actualizado a estado: "${friendlyStatus}".`);
  };

  // Simulate courier moving to next location coordinates
  const handleSimulateNextZone = (orderId: string) => {
    const sectors = [
      { zone: "Naco (Santo Domingo)", lat: 18.4795, lng: -69.9326 },
      { zone: "Bella Vista (Santo Domingo)", lat: 18.4556, lng: -69.9489 },
      { zone: "Piantini (Santo Domingo)", lat: 18.4746, lng: -69.9372 },
      { zone: "Zona Colonial (Santo Domingo)", lat: 18.4735, lng: -69.8860 }
    ];

    const randomSector = sectors[Math.floor(Math.random() * sectors.length)];

    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          deliveryAddress: {
            ...o.deliveryAddress,
            city: randomSector.zone,
            coordinates: { lat: randomSector.lat, lng: randomSector.lng }
          }
        };
      }
      return o;
    });

    setOrders(updatedOrders);
    localStorage.setItem('enkargord_orders', JSON.stringify(updatedOrders));
    triggerToast(`Courier de envío #${orderId} ingresó a la zona de ${randomSector.zone.split(' ')[0]}.`);
  };

  // Direct Order Submission Form Handler
  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const pCost = parseFloat(formProdCost) || 0;
    const sCost = parseFloat(formShipCost) || 0;
    const financialDetails = calculateFinancials(pCost, sCost, false);

    const nextNumber = orders.length > 0
      ? Math.max(...orders.map(o => parseInt(o.trackingId.split('-')[1]) || 0)) + 1
      : 1251;

    const newOrder: Order = {
      id: `ENK-${nextNumber}`,
      trackingId: `ENK-${nextNumber}`,
      status: 'pending',
      storeId: "ADMIN_DIRECT",
      storeName: "Pedido Directo Admin",
      courierName: "No asignado",
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      customer: {
        name: formCustName,
        phone: formCustPhone
      },
      deliveryAddress: {
        addressLine: formCustAddress,
        city: formCustCity,
        coordinates: {
          lat: 18.4861 + (Math.random() - 0.5) * 0.03,
          lng: -69.9312 + (Math.random() - 0.5) * 0.03
        }
      },
      fulfillment: false,
      financials: financialDetails
    };

    const updatedOrders = [...orders, newOrder];
    setOrders(updatedOrders);
    localStorage.setItem('enkargord_orders', JSON.stringify(updatedOrders));

    // Reset Inputs
    setFormCustName('');
    setFormCustPhone('');
    setFormCustAddress('');
    setIsOrderModalOpen(false);
    triggerToast(`Pedido #${newOrder.trackingId} creado en la bandeja de entrada.`);
  };

  // Fleet Add Courier form handler
  const handleCreateCourierSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newCourier: Courier = {
      id: cFormUser || `C-${Math.floor(Math.random() * 1000) + 100}`,
      name: cFormName,
      phone: cFormPhone,
      vehicle: cFormVehicle,
      plate: cFormPlate,
      status: 'Disponible'
    };

    const updatedCouriers = [...couriers, newCourier];
    setCouriers(updatedCouriers);
    localStorage.setItem('enkargord_couriers', JSON.stringify(updatedCouriers));

    // Reset inputs
    setCFormName('');
    setCFormPhone('');
    setCFormPlate('');
    setCFormUser('');
    triggerToast(`Mensajero "${cFormName}" registrado en la flota.`);
  };

  // Remove courier from fleet
  const handleDeleteCourier = (courierId: string) => {
    if (confirm("¿Estás seguro de que deseas dar de baja a este repartidor de la flota?")) {
      const updated = couriers.filter(c => c.id !== courierId);
      setCouriers(updated);
      localStorage.setItem('enkargord_couriers', JSON.stringify(updated));
      triggerToast("Mensajero eliminado de la flota.");
    }
  };

  // Final Close Cashbox action (Tab 3)
  const handleCloseCashbox = () => {
    const deliveredCount = orders.filter(o => o.status === 'delivered').length;
    if (deliveredCount === 0) {
      alert("No hay envíos completados listos para liquidar hoy.");
      return;
    }

    if (confirm(`¿Proceder con el cuadre financiero de ${deliveredCount} envíos entregados hoy?`)) {
      // Clear delivered orders from active list
      const updated = orders.filter(o => o.status !== 'delivered');
      setOrders(updated);
      localStorage.setItem('enkargord_orders', JSON.stringify(updated));
      triggerToast("Cierre de caja finalizado. Liquidaciones registradas.");
    }
  };

  // Tab dynamic styling
  const getTabClass = (tabName: typeof activeTab) => {
    return `flex-1 py-3.5 px-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
      activeTab === tabName 
        ? 'border-[#d3121a] text-[#d3121a] bg-[#fee2e2]/10' 
        : 'border-transparent text-[#64748b] hover:text-[#334155] hover:bg-slate-50'
    }`;
  };

  // KPI Calculations
  const statTotal = orders.length;
  const statTransit = orders.filter(o => o.status === 'in_transit').length;
  const statDelivered = orders.filter(o => o.status === 'delivered').length;
  const statCajaCalle = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.financials.totalCollected, 0);

  // Donut Graph data format for Recharts
  const donutData = [
    { name: 'Pendiente', value: orders.filter(o => o.status === 'pending').length, color: '#f59e0b' },
    { name: 'En Tránsito', value: orders.filter(o => o.status === 'in_transit').length, color: '#3b82f6' },
    { name: 'Entregados', value: orders.filter(o => o.status === 'delivered').length, color: '#10b981' },
    { name: 'No Contesta', value: orders.filter(o => o.status === 'no_contesta').length, color: '#ef4444' }
  ].filter(item => item.value > 0);

  // Leaflet format active couriers array
  const leafletActiveCouriers = orders
    .filter(o => o.status === 'in_transit' && o.courierName !== 'No asignado')
    .map(order => {
      const courierObj = couriers.find(c => c.name === order.courierName);
      return {
        name: order.courierName,
        status: courierObj && courierObj.status !== 'Offline' ? 'Activo' : 'Offline',
        lat: order.deliveryAddress.coordinates?.lat || 18.4861,
        lng: order.deliveryAddress.coordinates?.lng || -69.9312,
        pendingCount: orders.filter(o => o.courierName === order.courierName && o.status === 'in_transit').length
      };
    });

  // Calculate Settlement aggregates
  const settleDelivered = orders.filter(o => o.status === 'delivered');
  let totalProductCost = 0;
  let totalShippingCost = 0;
  let totalFulfillmentCost = 0;
  let totalPolancoCom = 0;
  let totalTransportadoraCom = 0;
  let totalCollectedSum = 0;

  settleDelivered.forEach(o => {
    totalProductCost += o.financials.productCost;
    totalShippingCost += o.financials.shippingCost;
    const fCost = o.financials.fulfillmentCost || 0;
    totalFulfillmentCost += fCost;
    totalPolancoCom += o.financials.polancoCommission;
    totalTransportadoraCom += (o.financials.transportadoraCommission + fCost);
    totalCollectedSum += o.financials.totalCollected;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex font-sans text-slate-800 antialiased">
      
      {/* Dynamic Toast popup */}
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
          <div className="p-6 border-b border-[#E7E7EC] flex items-center">
            <div className="relative w-40 h-14">
              <Image 
                src="/logo.png" 
                alt="EnkargoRD Logo" 
                fill 
                className="object-contain object-left" 
                priority
              />
            </div>
          </div>

          {/* Menus de Navegacion */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => { setActiveSidebarMenu('dashboard'); setActiveTab('dispatch'); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeSidebarMenu === 'dashboard'
                  ? 'bg-[#d3121a]/5 text-[#d3121a]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Package size={18} />
              Dashboard Admin
            </button>

            <button
              onClick={() => { setActiveSidebarMenu('fleet'); setActiveTab('fleet'); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeSidebarMenu === 'fleet'
                  ? 'bg-[#d3121a]/5 text-[#d3121a]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Truck size={18} />
              Flota Motoristas
            </button>

            <button
              onClick={() => { setActiveSidebarMenu('settlement'); setActiveTab('settlement'); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeSidebarMenu === 'settlement'
                  ? 'bg-[#d3121a]/5 text-[#d3121a]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <DollarSign size={18} />
              Liquidaciones y Caja
            </button>

            <button
              onClick={() => setActiveSidebarMenu('config')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeSidebarMenu === 'config'
                  ? 'bg-[#d3121a]/5 text-[#d3121a]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Settings size={18} />
              Configuración
            </button>
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
              Monitorea logística centralizada activa
            </p>
          </div>

          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all">
            <LogOut size={16} />
            Cerrar sesión
          </button>
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
              ¡Bienvenido, Administrador (Transportadora)!
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Panel centralizado de operaciones de EnkargoRD. Gestiona la flota, despacha y realiza cuadres.
            </p>
          </div>

          <div className="flex items-center gap-5">
            {/* User Profile widget */}
            <div className="flex items-center gap-3 text-right">
              <div>
                <div className="font-bold text-sm text-slate-800">Gina</div>
                <div className="text-[10px] text-slate-400 font-bold tracking-wide uppercase">
                  Administrador Logístico
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#d3121a]/10 border-2 border-[#d3121a]/20 flex items-center justify-center font-bold text-[#d3121a] text-sm">
                G
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={() => setIsOrderModalOpen(true)}
              className="bg-[#d3121a] hover:bg-[#b00f14] text-white font-bold text-xs py-3 px-5 rounded-xl shadow-md shadow-red-100 transition-all flex items-center gap-2"
            >
              <Plus size={16} />
              Crear Pedido Directo
            </button>
          </div>
        </header>

        {/* Tab Navigation header */}
        <div className="bg-white border-b border-[#E7E7EC] px-8 flex">
          <button 
            onClick={() => { setActiveTab('dispatch'); setActiveSidebarMenu('dashboard'); }} 
            className={getTabClass('dispatch')}
          >
            <Navigation size={16} />
            Despacho y Torre de Control
          </button>
          <button 
            onClick={() => { setActiveTab('fleet'); setActiveSidebarMenu('fleet'); }} 
            className={getTabClass('fleet')}
          >
            <Users size={16} />
            Gestión de Flota
          </button>
          <button 
            onClick={() => { setActiveTab('settlement'); setActiveSidebarMenu('settlement'); }} 
            className={getTabClass('settlement')}
          >
            <DollarSign size={16} />
            Liquidación y Cuadre de Caja
          </button>
        </div>

        {/* Outer content container */}
        <div className="p-8 flex-grow space-y-8">

          {/* ==========================================
             KPI CARDS BAR
             ========================================== */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Pedidos Totales
                </span>
                <span className="block text-3xl font-extrabold text-slate-900 mt-1">
                  {statTotal}
                </span>
                <span className="block text-[11px] text-slate-400 mt-1 font-semibold">
                  Activos en sistema
                </span>
              </div>
              <div className="w-11 h-11 bg-[#fee2e2] rounded-xl flex items-center justify-center text-[#d3121a] font-bold">
                📦
              </div>
            </div>

            <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  En Tránsito
                </span>
                <span className="block text-3xl font-extrabold text-slate-900 mt-1">
                  {statTransit}
                </span>
                <span className="block text-[11px] text-slate-400 mt-1 font-semibold">
                  Motoristas en ruta
                </span>
              </div>
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 font-bold">
                🛵
              </div>
            </div>

            <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Entregados
                </span>
                <span className="block text-3xl font-extrabold text-slate-900 mt-1">
                  {statDelivered}
                </span>
                <span className="block text-[11px] text-slate-400 mt-1 font-semibold">
                  Completados hoy
                </span>
              </div>
              <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 font-bold">
                ✅
              </div>
            </div>

            <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Caja en Calle
                </span>
                <span className="block text-3xl font-extrabold text-slate-900 mt-1">
                  RD${statCajaCalle.toLocaleString()}
                </span>
                <span className="block text-[11px] text-slate-400 mt-1 font-semibold">
                  Dinero por liquidar
                </span>
              </div>
              <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 font-bold">
                💰
              </div>
            </div>

          </section>

          {/* ==========================================
             TAB CONTENT: DESPACHO Y TORRE DE CONTROL
             ========================================== */}
          {activeTab === 'dispatch' && (
            <div className="space-y-8 animate-fade-in">
              {/* Dispatch Inbox Block */}
              <div className="bg-white border border-[#E7E7EC] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#E7E7EC] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                      📥 Bandeja de Entrada Central: Despacho de Pedidos
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      Asigna manualmente motoristas de la flota a los envíos entrantes de las tiendas
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-[#E7E7EC] text-[10px] font-extrabold text-[#64748b] tracking-wider uppercase">
                        <th className="py-4 px-6">Tracking</th>
                        <th className="py-4 px-6">Tienda</th>
                        <th className="py-4 px-6">Cliente</th>
                        <th className="py-4 px-6">Dirección / Sector</th>
                        <th className="py-4 px-6">Fulfillment</th>
                        <th className="py-4 px-6">Total Recaudar</th>
                        <th className="py-4 px-6">Asignar Repartidor</th>
                        <th className="py-4 px-6 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7E7EC] text-xs">
                      {orders.filter(o => o.status === 'pending' || o.courierName === 'No asignado').length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                            No hay envíos pendientes por asignar repartidor.
                          </td>
                        </tr>
                      ) : (
                        orders.filter(o => o.status === 'pending' || o.courierName === 'No asignado').map(order => (
                          <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6 font-bold text-slate-900">#{order.trackingId}</td>
                            <td className="py-4 px-6 font-semibold text-slate-700">{order.storeName}</td>
                            <td className="py-4 px-6 font-semibold text-slate-700">{order.customer.name}</td>
                            <td className="py-4 px-6 text-slate-500 max-w-[200px] truncate" title={order.deliveryAddress.addressLine}>
                              {order.deliveryAddress.addressLine}, {order.deliveryAddress.city.split(' ')[0]}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                                order.fulfillment 
                                  ? 'bg-[#d3121a]/10 text-[#d3121a]' 
                                  : 'bg-[#64748b]/10 text-slate-500'
                              }`}>
                                {order.fulfillment ? 'Fulfillment' : 'Tienda'}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-bold text-slate-900">
                              RD${order.financials.totalCollected.toLocaleString()}
                            </td>
                            <td className="py-4 px-6">
                              <select 
                                id={`courier-assign-${order.id}`}
                                className="bg-white border border-[#E7E7EC] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                                defaultValue=""
                              >
                                <option value="" disabled>Seleccionar...</option>
                                <option value="Gina (Administrador)">Gina (Admin - Yo)</option>
                                {couriers.map(c => (
                                  <option key={c.id} value={c.name}>{c.name} ({c.vehicle})</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button 
                                onClick={() => {
                                  const selectEl = document.getElementById(`courier-assign-${order.id}`) as HTMLSelectElement;
                                  if (selectEl) handleAssignCourier(order.id, selectEl.value);
                                }}
                                className="bg-[#d3121a] hover:bg-[#b00f14] text-white font-bold text-[11px] py-2 px-4 rounded-xl transition-all"
                              >
                                Despachar
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Lower segment: satellite map & donut chart status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Leaflet Map Block */}
                <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm lg:col-span-2 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm">
                        🗺️ Mapa Satelital: Torre de Control Logístico
                      </h3>
                      <span className="text-[10px] text-[#d3121a] font-bold uppercase tracking-wider block mt-1 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-[#d3121a] rounded-full animate-ping inline-block"></span>
                        Transmisión en vivo
                      </span>
                    </div>
                  </div>
                  {/* Leaflet Dynamic Wrapper Container */}
                  <div className="w-full h-[380px] rounded-xl overflow-hidden relative">
                    <MapComponent activeCouriers={leafletActiveCouriers} />
                  </div>
                </div>

                {/* Donut Package chart */}
                <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">
                      📦 Estado de Pedidos
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      Distribución consolidada de rutas activas hoy
                    </p>
                  </div>

                  {/* Donut chart canvas */}
                  <div className="h-[200px] w-full relative flex items-center justify-center">
                    <div className="absolute text-center flex flex-col justify-center">
                      <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{orders.length}</span>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">pedidos</span>
                    </div>

                    {donutData.length === 0 ? (
                      <div className="text-xs text-slate-400 font-medium">Sin datos registrados</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {donutData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Chart Legend */}
                  <div className="space-y-2 mt-2">
                    {[
                      { name: 'Pendientes', color: 'bg-amber-500', count: orders.filter(o => o.status === 'pending').length },
                      { name: 'En Tránsito', color: 'bg-blue-500', count: orders.filter(o => o.status === 'in_transit').length },
                      { name: 'Entregados', color: 'bg-emerald-500', count: orders.filter(o => o.status === 'delivered').length },
                      { name: 'No Contesta', color: 'bg-red-500', count: orders.filter(o => o.status === 'no_contesta').length }
                    ].map(legend => (
                      <div key={legend.name} className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${legend.color}`}></span>
                          <span>{legend.name}</span>
                        </div>
                        <span className="text-slate-900 font-bold">{legend.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Control Tower Active Streets table */}
              <div className="bg-white border border-[#E7E7EC] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#E7E7EC] bg-slate-50/50">
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    📡 Monitoreo Activo de Pedidos en Calle
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    Simulación de ruta por sector y actualización de estados del courier
                  </p>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-[#E7E7EC] text-[10px] font-extrabold text-[#64748b] tracking-wider uppercase">
                        <th className="py-4 px-6">Tracking ID</th>
                        <th className="py-4 px-6">Repartidor Asignado</th>
                        <th className="py-4 px-6">Ubicación Sector</th>
                        <th className="py-4 px-6">Cliente / Teléfono</th>
                        <th className="py-4 px-6">Cambiar Estado</th>
                        <th className="py-4 px-6 text-right">Simulación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7E7EC] text-xs">
                      {orders.filter(o => o.status === 'in_transit').length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                            No hay mensajeros en calle con paquetes ahora mismo.
                          </td>
                        </tr>
                      ) : (
                        orders.filter(o => o.status === 'in_transit').map(order => (
                          <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6 font-bold text-slate-900">#{order.trackingId}</td>
                            <td className="py-4 px-6 font-bold text-slate-700">🛵 {order.courierName}</td>
                            <td className="py-4 px-6 font-semibold text-slate-600">
                              📍 {order.deliveryAddress.city}
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-semibold text-slate-700 block">{order.customer.name}</span>
                              <span className="text-[10px] text-slate-400 block font-medium">{order.customer.phone}</span>
                            </td>
                            <td className="py-4 px-6">
                              <select
                                className="bg-white border border-[#E7E7EC] rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                                value={order.status}
                                onChange={(e) => handleUpdateStatus(order.id, e.target.value as Order['status'])}
                              >
                                <option value="in_transit">En tránsito</option>
                                <option value="delivered">Entregado</option>
                                <option value="no_contesta">No contesta / Fallido</option>
                                <option value="pending">Pendiente</option>
                              </select>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button 
                                onClick={() => handleSimulateNextZone(order.id)}
                                className="bg-[#d3121a]/10 hover:bg-[#d3121a] text-[#d3121a] hover:text-white font-extrabold text-[10px] py-1.5 px-3 rounded-lg border border-[#d3121a]/20 transition-all uppercase tracking-wide"
                              >
                                Siguiente Zona
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
             TAB CONTENT: GESTIÓN DE FLOTA (TAB 2)
             ========================================== */}
          {activeTab === 'fleet' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
              
              {/* Add courier form card */}
              <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm h-fit">
                <h3 className="font-extrabold text-slate-800 text-sm mb-1 flex items-center gap-2">
                  👤 Registrar Nuevo Repartidor
                </h3>
                <p className="text-xs text-slate-400 mb-6 font-medium">
                  Crea las credenciales y detalles vehiculares para el motorista
                </p>

                <form onSubmit={handleCreateCourierSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Nombre Completo</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Roberto Castillo"
                      required
                      value={cFormName}
                      onChange={(e) => setCFormName(e.target.value)}
                      className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Teléfono</label>
                    <input 
                      type="text" 
                      placeholder="+18095550000"
                      required
                      value={cFormPhone}
                      onChange={(e) => setCFormPhone(e.target.value)}
                      className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Vehículo</label>
                      <select 
                        value={cFormVehicle}
                        onChange={(e) => setCFormVehicle(e.target.value)}
                        className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                      >
                        <option value="Motocicleta">Motocicleta</option>
                        <option value="Passola">Passola</option>
                        <option value="Furgón">Furgón</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Placa</label>
                      <input 
                        type="text" 
                        placeholder="K-000000"
                        required
                        value={cFormPlate}
                        onChange={(e) => setCFormPlate(e.target.value)}
                        className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Usuario Acceso</label>
                    <input 
                      type="text" 
                      placeholder="Ej. roberto.c"
                      required
                      value={cFormUser}
                      onChange={(e) => setCFormUser(e.target.value)}
                      className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-xs py-3 px-4 rounded-xl transition-all shadow-md shadow-red-100 flex items-center justify-center gap-2 mt-4"
                  >
                    <Plus size={16} />
                    Dar de Alta Repartidor
                  </button>
                </form>
              </div>

              {/* Active Fleet Grid list */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm">
                  <h3 className="font-extrabold text-slate-800 text-sm mb-1">
                    👥 Flota de Mensajeros Activos
                  </h3>
                  <p className="text-xs text-slate-400 mb-6 font-medium">
                    Gestión y estado operativo en tiempo real de los transportistas
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {couriers.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium col-span-2">No hay couriers registrados.</p>
                    ) : (
                      couriers.map(c => (
                        <div key={c.id} className="border border-[#E7E7EC] rounded-2xl p-5 hover:border-slate-300 transition-colors bg-[#F8F9FB]/50 flex flex-col justify-between gap-4">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-sm text-slate-900 block">👤 {c.name}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                                c.status === 'Disponible' 
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                  : c.status === 'En ruta' 
                                    ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                                    : 'bg-slate-50 text-slate-500 border border-slate-100'
                              }`}>
                                {c.status}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 space-y-1 mt-4">
                              <div><strong>Tel:</strong> {c.phone}</div>
                              <div><strong>Vehículo:</strong> {c.vehicle}</div>
                              <div><strong>Placa:</strong> {c.plate}</div>
                              <div className="text-[10px] text-slate-400 pt-1 font-mono">ID: {c.id}</div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-[#E7E7EC] flex gap-2">
                            <button 
                              onClick={() => handleDeleteCourier(c.id)}
                              className="w-full text-center text-red-600 hover:text-white bg-red-50 hover:bg-red-600 font-bold text-[10px] py-2 rounded-lg border border-red-100 hover:border-red-600 transition-all uppercase tracking-wider"
                            >
                              Dar de Baja
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ==========================================
             TAB CONTENT: LIQUIDACIONES Y CAJA (TAB 3)
             ========================================== */}
          {activeTab === 'settlement' && (
            <div className="space-y-8 animate-fade-in">
              {/* Financial settlement summary block */}
              <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#E7E7EC]">
                
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Efectivo Recaudado
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-600 tracking-tight block mt-1">
                    RD${totalCollectedSum.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 font-medium block">
                    Suma total COD cobrada
                  </span>
                </div>

                <div className="flex flex-col justify-center md:pl-6">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Liquidación a Tiendas
                  </span>
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight block mt-1">
                    RD${totalProductCost.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 font-medium block">
                    Costo neto de productos
                  </span>
                </div>

                <div className="flex flex-col justify-center md:pl-6">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Costo Envíos + Full.
                  </span>
                  <span className="text-2xl font-extrabold text-slate-700 tracking-tight block mt-1">
                    RD${(totalShippingCost + totalFulfillmentCost).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 font-medium block">
                    Gastos de transporte
                  </span>
                </div>

                <div className="flex flex-col justify-center md:pl-6">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Plataforma Polanco
                  </span>
                  <span className="text-2xl font-extrabold text-[#d3121a] tracking-tight block mt-1">
                    RD${totalPolancoCom.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 font-medium block">
                    Tarifa plana (RD$50 x entrega)
                  </span>
                </div>

                <div className="flex flex-col justify-center md:pl-6">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Ganancia Transportadora
                  </span>
                  <span className="text-2xl font-extrabold text-blue-600 tracking-tight block mt-1">
                    RD${totalTransportadoraCom.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 font-medium block">
                    Neto + Fulfillment (RD$40)
                  </span>
                </div>

              </div>

              {/* Close cashbox drawer trigger */}
              <div className="flex justify-between items-center bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">Cierre de Caja del Turno Diario</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed max-w-[600px]">
                      Al cerrar caja, se liquidarán los {settleDelivered.length} envíos entregados hoy y se liberarán de forma definitiva los fondos cobrados. Asegúrate de verificar los cuadres financieros.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseCashbox}
                  className="bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-xs py-3.5 px-6 rounded-xl transition-all shadow-md shadow-red-100 uppercase tracking-wider"
                >
                  Cerrar Caja del Día
                </button>
              </div>

              {/* Payout detailed table */}
              <div className="bg-white border border-[#E7E7EC] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#E7E7EC] bg-slate-50/50">
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    📜 Listado de Pedidos Listos para Liquidar
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    Desglose detallado del dinero recolectado en calle por cada ruta de motorista completada
                  </p>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-[#E7E7EC] text-[10px] font-extrabold text-[#64748b] tracking-wider uppercase">
                        <th className="py-4 px-6">ID Pedido</th>
                        <th className="py-4 px-6">Tienda Origen</th>
                        <th className="py-4 px-6">Courier</th>
                        <th className="py-4 px-6">Pago Tienda</th>
                        <th className="py-4 px-6">Costo Envío</th>
                        <th className="py-4 px-6">Fulfillment</th>
                        <th className="py-4 px-6">Com. Polanco</th>
                        <th className="py-4 px-6">Com. Transportadora</th>
                        <th className="py-4 px-6 text-right">Efectivo Cobrado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7E7EC] text-xs">
                      {settleDelivered.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                            No hay rutas de pedidos entregadas y listas para liquidación hoy.
                          </td>
                        </tr>
                      ) : (
                        settleDelivered.map(order => {
                          const f = order.financials;
                          const fulfillmentFee = f.fulfillmentCost || 0;
                          return (
                            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-6 font-bold text-slate-900">#{order.trackingId}</td>
                              <td className="py-4 px-6 font-semibold text-slate-700">{order.storeName}</td>
                              <td className="py-4 px-6 font-bold text-slate-700">🛵 {order.courierName}</td>
                              <td className="py-4 px-6 font-semibold text-slate-600">RD${f.storeOwnerAmount}</td>
                              <td className="py-4 px-6 font-semibold text-slate-600">RD${f.shippingCost}</td>
                              <td className="py-4 px-6 font-semibold text-slate-600">RD${fulfillmentFee}</td>
                              <td className="py-4 px-6 font-semibold text-[#d3121a]">RD${f.polancoCommission}</td>
                              <td className="py-4 px-6 font-semibold text-blue-600">RD${f.transportadoraCommission + fulfillmentFee}</td>
                              <td className="py-4 px-6 text-right font-extrabold text-emerald-600">RD${f.totalCollected}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ==========================================
         CREATE ORDER MODAL DIALOG
         ========================================== */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-[#E7E7EC] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
            
            <div className="p-6 border-b border-[#E7E7EC] flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">🆕 Crear Nuevo Pedido Directo</h3>
                <p className="text-[11px] text-slate-400 font-medium">Completa la información del destinatario y costos</p>
              </div>
              <button 
                onClick={() => setIsOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Nombre del Cliente</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Pedro Pérez"
                  value={formCustName}
                  onChange={(e) => setFormCustName(e.target.value)}
                  className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Teléfono Cliente</label>
                  <input 
                    type="text" 
                    required
                    placeholder="+18095551234"
                    value={formCustPhone}
                    onChange={(e) => setFormCustPhone(e.target.value)}
                    className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Sector / Ciudad</label>
                  <select 
                    value={formCustCity}
                    onChange={(e) => setFormCustCity(e.target.value)}
                    className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                  >
                    <option value="Naco (Santo Domingo)">Naco (Santo Domingo)</option>
                    <option value="Bella Vista (Santo Domingo)">Bella Vista (Santo Domingo)</option>
                    <option value="Piantini (Santo Domingo)">Piantini (Santo Domingo)</option>
                    <option value="Zona Colonial (Santo Domingo)">Zona Colonial (Santo Domingo)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Dirección de Entrega</label>
                <input 
                  type="text" 
                  required
                  placeholder="Calle Duarte #15, Apto 2B"
                  value={formCustAddress}
                  onChange={(e) => setFormCustAddress(e.target.value)}
                  className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Costo Producto (RD$)</label>
                  <input 
                    type="number" 
                    required
                    value={formProdCost}
                    onChange={(e) => setFormProdCost(e.target.value)}
                    className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Costo Envío (RD$)</label>
                  <input 
                    type="number" 
                    required
                    value={formShipCost}
                    onChange={(e) => setFormShipCost(e.target.value)}
                    className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                  />
                </div>
              </div>

              {/* Financial summary preview in modal */}
              <div className="p-4 bg-slate-50 border border-[#E7E7EC] rounded-2xl text-[11px] font-semibold text-slate-600 space-y-1.5 mt-2">
                <div className="flex justify-between">
                  <span>Monto Total a Recaudar:</span>
                  <span className="font-bold text-slate-900">RD${(parseFloat(formProdCost) + parseFloat(formShipCost) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Neto Liquidación Tienda:</span>
                  <span>RD${parseFloat(formProdCost) || 0}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E7E7EC] flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsOrderModalOpen(false)}
                  className="flex-1 bg-white hover:bg-slate-50 border border-[#E7E7EC] text-slate-700 font-extrabold text-xs py-3 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md shadow-red-100"
                >
                  Crear Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
