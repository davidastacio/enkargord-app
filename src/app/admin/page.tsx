"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  DollarSign, 
  Plus, 
  MapPin, 
  Users, 
  Settings, 
  Navigation, 
  X,
  Phone,
  AlertTriangle,
  UserCheck,
  Building,
  Map,
  Shield,
  Wrench,
  Menu,
  FileDown,
  Printer,
  Play,
  Trash2,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import MapComponent from '@/components/MapComponent';
import { useAuth } from '@/hooks/useAuth';
import AuthenticatedUserMenu from '@/components/auth/AuthenticatedUserMenu';
import {
  addSupabaseOrderEvent,
  createSupabaseOrder,
  deleteSupabaseOrder,
  subscribeSupabaseOrders,
  updateSupabaseOrder,
} from '@/lib/supabase/orders';
import {
  adjustCourierOrderCount,
  createFleetCourier,
  deactivateCourier,
  listCouriers,
  subscribeCouriers,
} from '@/lib/supabase/couriers';
import { listSupabaseStoreNames } from '@/lib/supabase/stores';
import LogoutButton from '@/components/auth/LogoutButton';
import { downloadOrdersPdf } from '@/lib/orders/pdf-client';
import { getOrderFinancials } from '@/lib/orders/financials';
import { logisticsRegion, routeLabel, type LogisticsRegion } from '@/lib/logistics/regions';
import StoreSettlementPanel from '@/components/admin/StoreSettlementPanel';
import { MUNICIPAL_DISTRICTS, MUNICIPALITIES, PROVINCES, SECTORS } from '@/data/territory';
import {
  subscribeSupabaseCourierLocations,
  type CourierLocation,
} from '@/lib/supabase/tracking';

// TypeScript Types
interface Financials {
  productCost: number;
  shippingCost: number;
  fulfillmentCost: number;
  totalCollected: number;
  storeOwnerAmount: number;
  creatorCommission: number;
  transportadoraCommission: number;
}

interface Order {
  id: string;
  trackingId: string;
  status: 'pending' | 'in_transit' | 'on_route' | 'delivered' | 'no_contesta' | 'cancelled' | 'assigned' | string;
  storeId: string;
  storeName: string;
  courierId: string;
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
  provinceName?: string;
  municipalityName?: string;
  fulfillment: boolean;
  financials: Financials;
}

interface Courier {
  id: string;
  userUid?: string;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  status: 'Disponible' | 'En ruta' | 'Offline' | string;
  active?: boolean;
  operationalType?: string;
  activeOrderCount?: number;
}

const DEFAULT_COURIERS: Courier[] = [
  { id: "C-01", name: "Carlos M.", phone: "+18095551111", vehicle: "Motocicleta", plate: "K-123456", status: "Disponible" },
  { id: "C-02", name: "Luis A.", phone: "+18295552222", vehicle: "Motocicleta", plate: "K-654321", status: "Disponible" },
  { id: "C-03", name: "Yoselin V.", phone: "+18495553333", vehicle: "Motocicleta", plate: "K-987654", status: "En ruta" }
];

export default function AdminDashboard() {
  const router = useRouter();
  const { profile, user } = useAuth();
  const migrationTriggeredRef = useRef(false);
  const storeNameCorrectionsRef = useRef(new Set<string>());
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dispatch' | 'fleet' | 'settlement'>('dispatch');
  const [activeSidebarMenu, setActiveSidebarMenu] = useState<'dashboard' | 'fleet' | 'settlement' | 'config'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Shared Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [storesMap, setStoresMap] = useState<Record<string, string>>({});
  
  // Always resolve the commercial store name by storeId. A collaborator's
  // personal profile name must never replace the store name on an order.
  useEffect(() => {
    if (Object.keys(storesMap).length === 0 || orders.length === 0) return;
    const mismatches = orders.filter((order) => {
      const commercialName = storesMap[order.storeId];
      return Boolean(commercialName && commercialName !== order.storeName);
    });
    if (mismatches.length === 0) return;

    setOrders((currentOrders) => currentOrders.map((order) => ({
      ...order,
      storeName: storesMap[order.storeId] || order.storeName || 'Tienda',
    })));

    for (const order of mismatches) {
      const commercialName = storesMap[order.storeId];
      const correctionKey = `${order.id}:${commercialName}`;
      if (!commercialName || storeNameCorrectionsRef.current.has(correctionKey)) continue;
      storeNameCorrectionsRef.current.add(correctionKey);
      void updateSupabaseOrder(order.id, {
        storeName: commercialName,
        updatedAt: new Date().toISOString(),
      }).catch((error) => {
        storeNameCorrectionsRef.current.delete(correctionKey);
        console.error('Error correcting collaborator store name:', error);
      });
    }
  }, [orders, storesMap]);
  
  // Modals States
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRegionalAction, setIsRegionalAction] = useState(false);
  const [expandedRegions, setExpandedRegions] = useState<Set<LogisticsRegion>>(new Set());
  const [returningOrderId, setReturningOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || profile?.role !== 'Admin' || migrationTriggeredRef.current) return;
    migrationTriggeredRef.current = true;

    void user.getIdToken().then(async (token) => {
      const response = await fetch('/api/admin/migrate-firestore', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        console.error('Error migrating Firestore data to Supabase:', result);
      }
    }).catch((error) => {
      console.error('Error preparing Firestore migration:', error);
    });
  }, [profile?.role, user]);

  // Form Inputs - Direct Order Form
  const [formCustName, setFormCustName] = useState('');
  const [formStoreName, setFormStoreName] = useState('');
  const [formProductName, setFormProductName] = useState('');
  const [formCustPhone, setFormCustPhone] = useState('');
  const [formCustAddress, setFormCustAddress] = useState('');
  const [formProvinceId, setFormProvinceId] = useState('PROV_DN');
  const [formMunicipalityId, setFormMunicipalityId] = useState('MUN_DN_01');
  const [formMunicipalDistrictId, setFormMunicipalDistrictId] = useState('');
  const [formCustCity, setFormCustCity] = useState('Naco');
  const [courierLocations, setCourierLocations] = useState<CourierLocation[]>([]);
  const [formProdCost, setFormProdCost] = useState('1500');
  const [formShipCost, setFormShipCost] = useState('200');

  // Form Inputs - Courier Form
  const [cFormName, setCFormName] = useState('');
  const [cFormPhone, setCFormPhone] = useState('');
  const [cFormVehicle, setCFormVehicle] = useState('Motocicleta');
  const [cFormPlate, setCFormPlate] = useState('');
  const [cFormUser, setCFormUser] = useState('');

  // Dispatch Inbox Pagination State
  const [dispatchPage, setDispatchPage] = useState(1);
  const dispatchRowsPerPage = 10;

  // Hydrate states from Firestore & localstorage on Client Side mount
  useEffect(() => {
    // 0. Resolve store names from Supabase
    void listSupabaseStoreNames()
      .then(setStoresMap)
      .catch((error) => console.error("Error reading stores in Admin dashboard:", error));

    const unsubscribeUsers = () => {};
    // 1. Subscribe to Supabase orders in real-time
    const unsubscribeOrders = subscribeSupabaseOrders({}, (supabaseOrders) => {
      const ordersFromSupabase = supabaseOrders.map((rawOrder) => {
        const o = rawOrder as any;
        const storeNameReal =
          o.storeName ||
          o.metadata?.storeName ||
          o.metadata?.store_name ||
          (o.storeId && storesMap[o.storeId] ? storesMap[o.storeId] : '') ||
          (o.createdByUid && storesMap[o.createdByUid] ? storesMap[o.createdByUid] : '') ||
          'Tienda';
        const fin = getOrderFinancials(o);

        return {
          id: o.id,
          trackingId: o.tracking || o.trackingId || o.id,
          status: o.status || 'pending',
          storeId: o.storeId || 'STORE_01',
          storeName: storeNameReal,
          courierId: o.courierId || '',
          courierName: o.courierName || 'No asignado',
          time: o.time || (o.createdAt ? new Date(o.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'),
          createdAt: o.createdAt || new Date().toISOString(),
          customer: {
            name: o.customerName || o.customer?.name || 'Cliente',
            phone: o.customerPhone || o.customer?.phone || 'N/A'
          },
          deliveryAddress: {
            addressLine: o.formattedAddress || o.street || o.deliveryAddress?.addressLine || 'Sin dirección',
            city: o.municipalityName ? `${o.sectorName} (${o.municipalityName})` : (o.deliveryAddress?.city || 'Santo Domingo'),
            coordinates: {
              lat: o.latitude || o.deliveryLatitude || 18.4795,
              lng: o.longitude || o.deliveryLongitude || -69.9326
            }
          },
          provinceName: o.provinceName || '',
          municipalityName: o.municipalityName || '',
          fulfillment: o.requiresFulfillment || false,
          financials: {
            productCost: fin.netStoreAmount,
            shippingCost: fin.shippingCost,
            fulfillmentCost: 0,
            totalCollected: fin.totalCollected,
            storeOwnerAmount: fin.netStoreAmount,
            creatorCommission: 50,
            transportadoraCommission: Math.max(0, fin.shippingCost - 50)
          }
        };
      });
      
      // Client-side desc sort to avoid Firestore index builds requirement constraints
      ordersFromSupabase.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      
      setOrders(ordersFromSupabase as Order[]);
    }, (error) => {
      console.error("Error reading Supabase orders in Admin dashboard:", error);
      setOrders([]);
    });

    const refreshCouriers = async () => {
      try {
        const records = await listCouriers();
        const supabaseCouriers = records.map((o) => {
        return {
          id: o.id,
          userUid: o.userUid || o.id,
          name: o.name || 'Motorista',
          phone: o.phone || '',
          vehicle: o.vehicle.type || 'motocicleta',
          plate: o.vehicle.plate || 'N/A',
          status: o.status === 'available' ? 'Disponible' : o.status === 'on_route' ? 'En ruta' : 'Offline',
          active: o.active,
          operationalType: 'courier',
          activeOrderCount: o.activeOrderCount,
        };
      });
        setCouriers(supabaseCouriers as any[]);
      } catch (error) {
        console.error("Error reading Supabase couriers in Admin dashboard:", error);
        setCouriers([]);
      }
    };
    void refreshCouriers();
    const unsubscribeCouriers = subscribeCouriers(() => void refreshCouriers());
    const unsubscribeLocations = subscribeSupabaseCourierLocations(
      setCourierLocations,
      (error) => console.error("Error reading live courier locations:", error),
    );

    // Read active tab from query parameters
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'fleet') {
      setActiveTab('fleet');
      setActiveSidebarMenu('fleet');
    } else if (tabParam === 'settlement') {
      setActiveTab('settlement');
      setActiveSidebarMenu('settlement');
    } else {
      setActiveTab('dispatch');
      setActiveSidebarMenu('dashboard');
    }

    return () => {
      unsubscribeUsers();
      unsubscribeOrders();
      unsubscribeCouriers();
      unsubscribeLocations();
    };
  }, []);

  // Show dynamic toast helper
  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Dispatch unassigned order action handler
  const handleAssignCourier = async (orderId: string, courierName: string) => {
    if (!courierName) return;

    try {
      const selectedCourier = couriers.find(c => c.name === courierName);
      const courierId = selectedCourier ? selectedCourier.id : null;
      const courierUid = selectedCourier ? selectedCourier.userUid : null;

      // Find if order already has an assigned courier (Reassignment check)
      const targetOrder = orders.find(o => o.id === orderId);
      const previousCourierName = targetOrder?.courierName || null;
      const isReassignment = previousCourierName && previousCourierName !== 'No asignado';

      // 1. Update order document in Firestore
      await updateSupabaseOrder(orderId, {
        courierId: courierId,
        courierUid: courierUid || courierId,
        courierName: courierName,
        storeName: (targetOrder && storesMap[targetOrder.storeId]) || targetOrder?.storeName || 'Tienda',
        courierType: selectedCourier?.operationalType || 'courier',
        assignedByUid: profile?.uid || 'ADMIN',
        assignedAt: new Date().toISOString(),
        status: 'assigned',
        updatedAt: new Date().toISOString()
      });

      // 2. Increment new courier's active order count in Firestore
      if (courierId) {
        await adjustCourierOrderCount(courierId, 1, 'on_route');
      }

      // Decrement previous courier's active order count if reassigning
      if (isReassignment) {
        const prevCourier = couriers.find(c => c.name === previousCourierName);
        if (prevCourier?.id) {
          await adjustCourierOrderCount(prevCourier.id, -1);
        }
      }

      // 3. Create subcollection event log inside orders/{orderId}/events
      await addSupabaseOrderEvent(orderId, {
        type: isReassignment ? 'courier_reassigned' : 'courier_assigned',
        previousStatus: targetOrder?.status || 'pending',
        newStatus: 'assigned',
        actorUid: profile?.uid || '',
        actorRole: 'admin',
        courierId: courierId,
        courierUid: courierUid || courierId,
        courierName: courierName,
        note: isReassignment 
          ? `Reasignado de ${previousCourierName} a ${courierName}`
          : `Asignado a ${courierName}`,
        createdAt: new Date().toISOString()
      });

      triggerToast(`Pedido #${orderId} asignado a ${courierName}.`);
    } catch (error) {
      console.error("Error assigning courier in Firestore:", error);
      alert("Error al asignar el repartidor en la base de datos.");
    }
  };

  // Delete test order from Supabase
  const handleDeleteOrder = async (orderId: string, trackingId: string) => {
    const targetId = trackingId || orderId;
    const confirmed = window.confirm(`¿Estás seguro de eliminar el pedido de prueba #${targetId}? Esta acción lo borrará permanentemente de las rutas y la contabilidad.`);
    if (!confirmed) return;

    try {
      // 1. Immediately update React state for instant UI re-render
      setOrders((prev) => prev.filter((o) => o.id !== orderId && o.trackingId !== orderId && o.id !== targetId && o.trackingId !== targetId));

      // Delete order from Supabase
      await deleteSupabaseOrder(orderId);
      triggerToast(`Pedido #${targetId} eliminado correctamente.`);
    } catch (error) {
      console.error("Error deleting order from Supabase:", error);
      alert("Error al eliminar el pedido de la base de datos.");
    }
  };

  // Update in transit package status manually in control tower
  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateSupabaseOrder(orderId, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      // Check if we need to free the courier
      let finalCouriers = [...couriers];
      if (newStatus === 'delivered' || newStatus === 'pending') {
        const targetOrder = orders.find(o => o.id === orderId);
        if (targetOrder) {
          const cName = targetOrder.courierName;
          const remainingTransit = orders.filter(o => o.id !== orderId && o.courierName === cName && o.status === 'in_transit');
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

      setCouriers(finalCouriers);
      localStorage.setItem('enkargord_couriers', JSON.stringify(finalCouriers));

      const friendlyStatus = newStatus === 'delivered' ? 'Entregado' : newStatus === 'no_contesta' ? 'No Contesta' : newStatus;
      triggerToast(`Pedido #${orderId} actualizado a estado: "${friendlyStatus}".`);
    } catch (error) {
      console.error("Error updating order status in Firestore:", error);
      alert("Error al actualizar el estado del pedido.");
    }
  };

  // Simulate courier moving to next location coordinates
  const handleSimulateNextZone = async (orderId: string) => {
    const sectors = [
      { zone: "Naco (Santo Domingo)", lat: 18.4795, lng: -69.9326 },
      { zone: "Bella Vista (Santo Domingo)", lat: 18.4556, lng: -69.9489 },
      { zone: "Piantini (Santo Domingo)", lat: 18.4746, lng: -69.9372 },
      { zone: "Zona Colonial (Santo Domingo)", lat: 18.4735, lng: -69.8860 }
    ];

    const randomSector = sectors[Math.floor(Math.random() * sectors.length)];

    try {
      await updateSupabaseOrder(orderId, {
        formattedAddress: `${formCustAddress || 'Santo Domingo'} - ${randomSector.zone}`,
        latitude: randomSector.lat,
        longitude: randomSector.lng,
        updatedAt: new Date().toISOString()
      });

      triggerToast(`Courier de envío #${orderId} ingresó a la zona de ${randomSector.zone.split(' ')[0]}.`);
    } catch (error) {
      console.error("Error simulating next zone in Firestore:", error);
    }
  };

  // Direct Order Submission Form Handler
  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingOrder) return;

    const pCost = parseFloat(formProdCost) || 0;
    const sCost = parseFloat(formShipCost) || 0;
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const randomValues = crypto.getRandomValues(new Uint32Array(5));
    const hash = Array.from(randomValues, (value) => alphabet[value % alphabet.length]).join('');
    const tracking = `ENK-${datePart}-${hash}`;
    const provinceName = PROVINCES.find((province) => province.id === formProvinceId)?.name || '';
    const municipalityName =
      MUNICIPALITIES.find((municipality) => municipality.id === formMunicipalityId)?.name || '';
    const municipalDistrictName =
      MUNICIPAL_DISTRICTS.find((district) => district.id === formMunicipalDistrictId)?.name || null;

    const baseOrder = {
      id: tracking,
      tracking,
      status: 'pending',
      createdByUid: profile?.uid || '',
      customerName: formCustName,
      customerPhone: formCustPhone,
      provinceName,
      municipalityName,
      municipalDistrictId: formMunicipalDistrictId || null,
      municipalDistrictName,
      sectorName: formCustCity.trim(),
      street: formCustAddress,
      formattedAddress: formCustAddress,
      latitude: 18.4861 + (Math.random() - 0.5) * 0.03,
      longitude: -69.9312 + (Math.random() - 0.5) * 0.03,
      locationVerified: false,
      packageType: "Paquete",
      packageQuantity: 1,
      productName: formProductName.trim(),
      packageDescription: formProductName.trim(),
      requiresCashOnDelivery: pCost > 0,
      collectionAmount: pCost,
      shippingCost: sCost,
      priceIncludesShipping: true,
      financialVersion: 2,
      paymentMethod: "cash",
      requiresFulfillment: false,
      courierId: null,
      courierName: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setIsSubmittingOrder(true);
    try {
      if (!user) throw new Error("UNAUTHENTICATED");
      const storeResponse = await fetch("/api/admin/stores", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commercialName: formStoreName.trim(),
        }),
      });
      const storeResult = await storeResponse.json().catch(() => null);
      if (!storeResponse.ok || !storeResult?.store?.id) {
        throw new Error(storeResult?.error || "EXTERNAL_STORE_CREATE_FAILED");
      }
      const newOrder = {
        ...baseOrder,
        storeId: String(storeResult.store.id),
        storeName: String(storeResult.store.commercialName || formStoreName.trim()),
      };
      await createSupabaseOrder(newOrder);

      // Reset Inputs
      setFormStoreName('');
      setFormProductName('');
      setFormCustName('');
      setFormCustPhone('');
      setFormCustAddress('');
      setFormProvinceId('PROV_DN');
      setFormMunicipalityId('MUN_DN_01');
      setFormMunicipalDistrictId('');
      setFormCustCity('Naco');
      setIsOrderModalOpen(false);
      triggerToast(`Pedido #${newOrder.tracking} creado en la bandeja de entrada.`);
    } catch (error) {
      console.error("Error creating direct order in Firestore:", error);
      alert("Error al guardar el pedido en la base de datos.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Fleet Add Courier form handler
  const handleCreateCourierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newCourierId = cFormUser || `courier_${Date.now()}`;

    try {
      await createFleetCourier({
        id: newCourierId,
        name: cFormName,
        phone: cFormPhone,
        vehicleType: cFormVehicle,
        vehiclePlate: cFormPlate,
      });

      // Reset inputs
      setCFormName('');
      setCFormPhone('');
      setCFormPlate('');
      setCFormUser('');
      triggerToast(`Mensajero "${cFormName}" registrado en la flota.`);
    } catch (error) {
      console.error("Error creating courier in Firestore:", error);
      alert("Error al registrar el repartidor en la base de datos.");
    }
  };

  // Remove courier from fleet
  const handleDeleteCourier = async (courierId: string) => {
    if (confirm("¿Estás seguro de que deseas dar de baja a este repartidor de la flota?")) {
      try {
        await deactivateCourier(courierId);
        triggerToast("Mensajero dado de baja de la flota.");
      } catch (error) {
        console.error("Error deleting courier in Firestore:", error);
        alert("Error al eliminar el mensajero de la base de datos.");
      }
    }
  };

  // Final Close Cashbox action (Tab 3)
  const handleCloseCashbox = async () => {
    triggerToast("Liquida cada tienda desde el panel de saldos para conservar el historial financiero.");
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
  const statTransit = orders.filter(o => o.status === 'in_transit' || o.status === 'on_route').length;
  const statDelivered = orders.filter(o => o.status === 'delivered').length;
  // Outstanding cash (recaudo) in transit or pending in street
  const statCajaCalle = orders
    .filter(o => o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'no_contesta')
    .reduce((sum, o) => sum + (o.financials.totalCollected || 0), 0);

  // Donut Graph data format for Recharts
  const donutData = [
    { name: 'Pendiente', value: orders.filter(o => o.status === 'pending').length, color: '#f59e0b' },
    { name: 'En Tránsito', value: orders.filter(o => o.status === 'in_transit').length, color: '#3b82f6' },
    { name: 'Entregados', value: orders.filter(o => o.status === 'delivered').length, color: '#10b981' },
    { name: 'No Contesta', value: orders.filter(o => o.status === 'no_contesta').length, color: '#ef4444' }
  ].filter(item => item.value > 0);

  // Dispatch Inbox Pagination Calculations
  const pendingDispatchOrders = orders.filter(o => o.status === 'pending' || o.courierName === 'No asignado');
  const totalDispatchPages = Math.max(1, Math.ceil(pendingDispatchOrders.length / dispatchRowsPerPage));
  const paginatedDispatchOrders = pendingDispatchOrders.slice((dispatchPage - 1) * dispatchRowsPerPage, dispatchPage * dispatchRowsPerPage);

  // Leaflet format active couriers array mapping directly from couriers database
  const leafletActiveCouriers = courierLocations
    .filter((location) => location.trackingStatus === 'active')
    .map((location) => {
      const courier = couriers.find((record) => record.id === location.courierId);
      return {
        name: courier?.name || 'Repartidor',
        status: 'En Vivo',
        lat: location.latitude,
        lng: location.longitude,
        pendingCount: courier?.activeOrderCount || 0,
      };
    });

  // Calculate Settlement aggregates
  const settleDelivered = orders.filter(o => o.status === 'delivered');
  let totalProductCost = 0;
  let totalShippingCost = 0;
  let totalFulfillmentCost = 0;
  let totalCreatorCommission = 0;
  let totalTransportadoraCom = 0;
  let totalCollectedSum = 0;

  settleDelivered.forEach(o => {
    totalProductCost += o.financials.productCost;
    totalShippingCost += o.financials.shippingCost;
    const fCost = o.financials.fulfillmentCost || 0;
    totalFulfillmentCost += fCost;
    totalCreatorCommission += o.financials.creatorCommission;
    totalTransportadoraCom += (o.financials.transportadoraCommission + fCost);
    totalCollectedSum += o.financials.totalCollected;
  });

  const regionalOrders = orders
    .filter((order) => (
      Boolean(order.courierId)
      && order.courierName !== 'No asignado'
      && !['pending', 'delivered', 'cancelled', 'returned'].includes(order.status)
    ))
    .reduce((groups, order) => {
      const region = logisticsRegion(order.provinceName || '');
      (groups[region] ||= []).push(order);
      return groups;
    }, {} as Partial<Record<LogisticsRegion, Order[]>>);

  const downloadRegionalPdf = async (region: LogisticsRegion, mode: 'orders' | 'labels') => {
    const ids = (regionalOrders[region] || []).map((order) => order.id);
    if (!user || !ids.length || isRegionalAction) return;
    setIsRegionalAction(true);
    try {
      await downloadOrdersPdf(user, ids, mode);
    } catch (error) {
      console.error(error);
      triggerToast('No se pudo generar el PDF regional.');
    } finally {
      setIsRegionalAction(false);
    }
  };

  const startRegionalRoute = async (region: LogisticsRegion) => {
    const ids = (regionalOrders[region] || []).map((order) => order.id);
    if (!user || !ids.length || isRegionalAction) return;
    setIsRegionalAction(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/routes/start', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ region, orderIds: ids }),
      });
      if (!response.ok) throw new Error('REGIONAL_ROUTE_START_FAILED');
      router.push('/motorista/ruta');
      router.refresh();
    } catch (error) {
      console.error(error);
      triggerToast('No se pudo iniciar la ruta regional.');
    } finally {
      setIsRegionalAction(false);
    }
  };

  const returnOrderToDispatch = async (order: Order) => {
    if (!user || returningOrderId) return;
    const confirmed = window.confirm(
      `¿Devolver el pedido #${order.trackingId} a la Bandeja de Entrada Central? Se retirará del motorista y de su ruta activa.`,
    );
    if (!confirmed) return;

    setReturningOrderId(order.id);
    try {
      const response = await fetch('/api/admin/orders/return-to-dispatch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: order.id }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || 'RETURN_TO_DISPATCH_FAILED');
      setOrders((currentOrders) => currentOrders.map((currentOrder) => (
        currentOrder.id === order.id
          ? { ...currentOrder, status: 'pending', courierId: '', courierName: 'No asignado' }
          : currentOrder
      )));
      triggerToast(`Pedido #${order.trackingId} devuelto a la Bandeja de Entrada Central.`);
    } catch (error) {
      console.error('Error returning order to dispatch:', error);
      triggerToast('No se pudo devolver el pedido a la bandeja.');
    } finally {
      setReturningOrderId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex font-sans text-slate-800 antialiased">
      {sidebarOpen && (
        <button type="button" aria-label="Cerrar menú" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden" />
      )}
      
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
      <aside className={`${sidebarOpen ? 'flex' : 'hidden'} lg:flex w-[min(280px,86vw)] lg:w-[280px] bg-white border-r border-[#E7E7EC] flex-col justify-between fixed top-0 bottom-0 left-0 z-50`}>
        <div>
          {/* Logo Brand Header */}
          <div className="p-4 border-b border-[#E7E7EC] flex items-center justify-center">
            <div className="relative h-12 w-[220px]">
              <Image 
                src="/logo-horizontal.png" 
                alt="EnkargoRD Logo" 
                fill 
                className="object-contain object-center" 
                priority
              />
            </div>
            <button type="button" onClick={() => setSidebarOpen(false)} className="p-2 lg:hidden" aria-label="Cerrar menú">
              <X size={20} />
            </button>
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

            <Link
              href="/admin/usuarios"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <Users size={18} />
              Usuarios Registrados
            </Link>

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

            {/* Divider */}
            <div className="my-2 border-t border-[#E7E7EC]" />
            <p className="px-4 text-[9px] font-extrabold text-slate-400 tracking-widest uppercase mb-1">Módulos operativos</p>

            <Link
              href="/admin/mensajeros"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <UserCheck size={18} />
              Gestión de Mensajeros
            </Link>

            <Link
              href="/admin/operaciones"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <Wrench size={18} />
              Config. de Tarifas
            </Link>

            <Link
              href="/admin/mis-entregas"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <Shield size={18} />
              Modo Repartidor
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
              Monitorea logística centralizada activa
            </p>
          </div>

          <LogoutButton className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all">
            Cerrar sesión
          </LogoutButton>
        </div>
      </aside>

      {/* ==========================================
         MAIN CONTENT AREA
         ========================================== */}
      <main className="flex-grow min-w-0 pl-0 lg:pl-[280px] min-h-screen flex flex-col">
        
        {/* Header Principal */}
        <header className="bg-white border-b border-[#E7E7EC] px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" onClick={() => setSidebarOpen(true)} className="p-2 border border-[#E7E7EC] rounded-xl lg:hidden" aria-label="Abrir menú">
              <Menu size={19} />
            </button>
            <div className="min-w-0">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              ¡Bienvenido, Administrador (Transportadora)!
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Panel centralizado de operaciones de EnkargoRD. Gestiona la flota, despacha y realiza cuadres.
            </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            {/* User Profile widget */}
            <AuthenticatedUserMenu />

            {/* Quick Action Button */}
            <button
              onClick={() => setIsOrderModalOpen(true)}
              className="bg-[#d3121a] hover:bg-[#b00f14] text-white font-bold text-xs py-2.5 sm:py-3 px-3 sm:px-5 rounded-xl shadow-md shadow-red-100 transition-all flex items-center gap-2"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Crear Pedido Directo</span><span className="sm:hidden">Pedido</span>
            </button>
          </div>
        </header>

        {/* Tab Navigation header */}
        <div className="bg-white border-b border-[#E7E7EC] px-4 sm:px-6 lg:px-8 flex overflow-x-auto custom-scrollbar">
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
        <div className="p-4 sm:p-6 lg:p-8 flex-grow min-w-0 space-y-8 overflow-x-hidden">

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
              <section className="space-y-4">
                <div>
                  <h3 className="font-extrabold text-slate-900">Rutas regionales de hoy</h3>
                  <p className="text-xs text-slate-400 mt-1">Solo pedidos asignados a un motorista y despachados, agrupados por provincia y corredor logístico.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {(Object.entries(regionalOrders) as [LogisticsRegion, Order[]][]).map(([region, regionOrders]) => (
                    <article
                      key={region}
                      className={`bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm transition-all ${
                        expandedRegions.has(region) ? 'md:col-span-2 xl:col-span-2' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-extrabold text-slate-900">{routeLabel(region, regionOrders[0]?.provinceName)}</h4>
                          <p className="text-xs text-slate-400 mt-1">{regionOrders.length} pedidos - {Array.from(new Set(regionOrders.map((order) => order.provinceName))).join(', ')}</p>
                        </div>
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-extrabold text-[#d3121a]">{regionOrders.length}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        <button
                          onClick={() => setExpandedRegions((current) => {
                            const next = new Set(current);
                            next.has(region) ? next.delete(region) : next.add(region);
                            return next;
                          })}
                          className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-[10px] font-bold text-slate-700"
                        >
                          <ChevronDown size={13} className={`transition-transform ${expandedRegions.has(region) ? 'rotate-180' : ''}`} />
                          Pedidos
                        </button>
                        <button disabled={isRegionalAction} onClick={() => void downloadRegionalPdf(region, 'orders')} className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 py-2.5 text-[10px] font-bold text-slate-600 disabled:opacity-40">
                          <FileDown size={13} /> PDF
                        </button>
                        <button disabled={isRegionalAction} onClick={() => void downloadRegionalPdf(region, 'labels')} className="flex items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-[10px] font-bold text-blue-700 disabled:opacity-40">
                          <Printer size={13} /> Labels
                        </button>
                        <button disabled={isRegionalAction} onClick={() => void startRegionalRoute(region)} className="flex items-center justify-center gap-1 rounded-xl bg-[#d3121a] py-2.5 text-[10px] font-bold text-white disabled:opacity-40">
                          <Play size={13} /> Iniciar
                        </button>
                      </div>
                      {expandedRegions.has(region) && (
                        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                          {regionOrders.map((order) => (
                            <div key={order.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-start">
                                <div className="min-w-0">
                                  <div className="break-all text-xs font-extrabold text-slate-800">#{order.trackingId}</div>
                                  <div className="mt-2 grid gap-1 text-[11px] sm:grid-cols-2 sm:gap-x-8">
                                    <div><span className="font-bold text-slate-400">Cliente:</span> <span className="font-semibold text-slate-700">{order.customer.name}</span></div>
                                    <div><span className="font-bold text-slate-400">Tienda:</span> <span className="font-semibold text-slate-700">{order.storeName}</span></div>
                                  </div>
                                  <div className="mt-1 text-[10px] text-slate-500">
                                    <span className="font-bold text-slate-400">Motorista:</span> {order.courierName}
                                  </div>
                                </div>
                                <button
                                  disabled={returningOrderId === order.id}
                                  onClick={() => void returnOrderToDispatch(order)}
                                  className="flex flex-shrink-0 items-center justify-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-extrabold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
                                >
                                  <RotateCcw size={12} />
                                  {returningOrderId === order.id ? 'Devolviendo…' : 'Devolver a Bandeja'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                  {Object.keys(regionalOrders).length === 0 && (
                    <div className="md:col-span-2 xl:col-span-3 bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center text-sm font-semibold text-slate-400">
                      No hay pedidos despachados con motorista asignado.
                    </div>
                  )}
                </div>
              </section>
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold bg-[#d3121a]/10 text-[#d3121a] px-3 py-1.5 rounded-xl border border-[#d3121a]/20">
                      {pendingDispatchOrders.length} pedidos sin despachar
                    </span>
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
                      {pendingDispatchOrders.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                            No hay envíos pendientes por asignar repartidor.
                          </td>
                        </tr>
                      ) : (
                        paginatedDispatchOrders.map(order => (
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
                                className="bg-white border border-[#E7E7EC] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#d3121a] w-full"
                                defaultValue=""
                              >
                                <option value="" disabled>Seleccionar...</option>
                                {couriers
                                  .filter(c => {
                                    // 1. Must be active
                                    if (c.active === false) return false;
                                    // 2. Status must not be suspended
                                    if (c.status === 'suspended') return false;
                                    // 3. Either normal courier or operational admin_courier
                                    return c.operationalType === 'admin_courier' || c.operationalType === 'courier' || !c.operationalType;
                                  })
                                  .map(c => (
                                    <option key={c.id} value={c.name}>
                                      {c.name} {c.operationalType === 'admin_courier' ? '(Admin / Repartidor)' : `(${c.vehicle})`}
                                    </option>
                                  ))}
                              </select>
                            </td>
                            <td className="py-4 px-6 text-right whitespace-nowrap">
                              <button
                                onClick={() => user && void downloadOrdersPdf(user, [order.id], 'labels')}
                                className="mr-1.5 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] py-2 px-3 rounded-xl transition-all"
                                title="Descargar label PDF"
                              >
                                <Printer size={13} />
                              </button>
                              <button 
                                onClick={() => {
                                  const selectEl = document.getElementById(`courier-assign-${order.id}`) as HTMLSelectElement;
                                  if (selectEl) handleAssignCourier(order.id, selectEl.value);
                                }}
                                className="mr-1.5 bg-[#d3121a] hover:bg-[#b00f14] text-white font-bold text-[11px] py-2 px-3.5 rounded-xl transition-all"
                              >
                                Despachar
                              </button>
                              <button
                                onClick={() => handleDeleteOrder(order.id, order.trackingId)}
                                className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] py-2 px-2.5 rounded-xl transition-all"
                                title="Borrar pedido de prueba"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Dispatch Inbox Pagination Footer */}
                {pendingDispatchOrders.length > 0 && (
                  <div className="p-4 border-t border-[#E7E7EC] flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                    <span className="text-xs text-slate-500 font-semibold">
                      Mostrando <strong className="text-slate-900">{(dispatchPage - 1) * dispatchRowsPerPage + 1}</strong> a <strong className="text-slate-900">{Math.min(dispatchPage * dispatchRowsPerPage, pendingDispatchOrders.length)}</strong> de <strong className="text-slate-900">{pendingDispatchOrders.length}</strong> pedidos pendientes
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        disabled={dispatchPage === 1}
                        onClick={() => setDispatchPage((p) => Math.max(1, p - 1))}
                        className="px-3.5 py-1.5 border border-[#E7E7EC] rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-bold text-slate-700 transition-all shadow-sm"
                      >
                        Anterior
                      </button>
                      <span className="text-xs font-extrabold text-slate-700">
                        Página {dispatchPage} de {totalDispatchPages}
                      </span>
                      <button
                        disabled={dispatchPage >= totalDispatchPages}
                        onClick={() => setDispatchPage((p) => Math.min(totalDispatchPages, p + 1))}
                        className="px-3.5 py-1.5 border border-[#E7E7EC] rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-bold text-slate-700 transition-all shadow-sm"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
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
              <StoreSettlementPanel />
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
                    Comisión para creador
                  </span>
                  <span className="text-2xl font-extrabold text-[#d3121a] tracking-tight block mt-1">
                    RD${totalCreatorCommission.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 font-medium block">
                    Comisión fija (RD$50 por entrega)
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
                        <th className="py-4 px-6">Comisión creador</th>
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
                              <td className="py-4 px-6 font-semibold text-[#d3121a]">RD${f.creatorCommission}</td>
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
          <div className="bg-white border border-[#E7E7EC] rounded-2xl w-full max-w-lg max-h-[calc(100vh-2rem)] shadow-2xl overflow-y-auto animate-scale-up">
            
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
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Nombre de la Tienda / Proveedor</label>
                <input
                  type="text"
                  required
                  list="admin-store-names"
                  placeholder="Ej. Boutique María"
                  value={formStoreName}
                  onChange={(e) => setFormStoreName(e.target.value)}
                  className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                />
                <datalist id="admin-store-names">
                  {Object.values(storesMap).map((storeName) => (
                    <option key={storeName} value={storeName} />
                  ))}
                </datalist>
                <p className="text-[10px] font-medium text-slate-400">
                  Si no existe, se creará como tienda externa administrada por EnkargoRD para sus liquidaciones.
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juego de sábanas queen"
                  value={formProductName}
                  onChange={(e) => setFormProductName(e.target.value)}
                  className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                />
              </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Provincia</label>
                  <select 
                    required
                    value={formProvinceId}
                    onChange={(e) => {
                      const provinceId = e.target.value;
                      setFormProvinceId(provinceId);
                      setFormMunicipalityId(
                        MUNICIPALITIES.find((municipality) => municipality.provinceId === provinceId)?.id || '',
                      );
                      setFormMunicipalDistrictId('');
                      setFormCustCity('');
                    }}
                    className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                  >
                    {PROVINCES.map((province) => (
                      <option key={province.id} value={province.id}>{province.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Municipio</label>
                  <select
                    required
                    value={formMunicipalityId}
                    onChange={(e) => {
                      setFormMunicipalityId(e.target.value);
                      setFormMunicipalDistrictId('');
                      setFormCustCity('');
                    }}
                    className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                  >
                    {MUNICIPALITIES.filter((municipality) => municipality.provinceId === formProvinceId).map((municipality) => (
                      <option key={municipality.id} value={municipality.id}>{municipality.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Distrito municipal</label>
                  <select
                    value={formMunicipalDistrictId}
                    onChange={(e) => {
                      setFormMunicipalDistrictId(e.target.value);
                      setFormCustCity('');
                    }}
                    className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                  >
                    <option value="">Ninguno</option>
                    {MUNICIPAL_DISTRICTS.filter((district) => district.municipalityId === formMunicipalityId).map((district) => (
                      <option key={district.id} value={district.id}>{district.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Sector / Localidad</label>
                  <input
                    type="text"
                    required
                    value={formCustCity}
                    onChange={(e) => setFormCustCity(e.target.value)}
                    list="admin-sector-options"
                    placeholder="Ej. Bávaro"
                    className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
                  />
                  <datalist id="admin-sector-options">
                    {SECTORS.filter((sector) => (
                      sector.municipalityId === formMunicipalityId
                      && (!formMunicipalDistrictId || sector.municipalDistrictId === formMunicipalDistrictId)
                    )).map((sector) => (
                      <option key={sector.id} value={sector.name} />
                    ))}
                  </datalist>
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
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total a cobrar al cliente (RD$)</label>
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
                  <span className="font-bold text-slate-900">RD${(parseFloat(formProdCost) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Neto Liquidación Tienda:</span>
                  <span>RD${Math.max(0, (parseFloat(formProdCost) || 0) - (parseFloat(formShipCost) || 0)).toLocaleString()}</span>
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
                  disabled={isSubmittingOrder}
                  className="flex-1 bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md shadow-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingOrder ? 'Creando…' : 'Crear Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
