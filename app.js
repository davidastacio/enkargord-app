// Initial mock data to display in the dashboard based on the reference design
const DEFAULT_ORDERS = [
  {
    id: "ENK-1250",
    trackingId: "ENK-1250",
    status: "in_transit",
    storeId: "STORE_01",
    storeName: "Moda Express RD",
    courierName: "Carlos M.",
    courierAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100",
    time: "10:30 AM",
    createdAt: "2026-07-20T14:30:00Z",
    customer: { name: "Juan Pérez", phone: "+18095551234" },
    deliveryAddress: { addressLine: "Av. Churchill #12", city: "Santo Domingo - Naco", coordinates: { lat: 18.4795, lng: -69.9326 } },
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
    courierAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100",
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
    status: "pending", // Unassigned
    storeId: "STORE_01",
    storeName: "Moda Express RD",
    courierName: "No asignado",
    courierAvatar: "",
    time: "09:58 AM",
    createdAt: "2026-07-20T13:58:00Z",
    customer: { name: "Pedro García", phone: "+18495559012" },
    deliveryAddress: { addressLine: "Residencial Alameda", city: "Santo Domingo - Piantini", coordinates: { lat: 18.4746, lng: -69.9372 } },
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
    courierAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
    time: "09:42 AM",
    createdAt: "2026-07-20T13:42:00Z",
    customer: { name: "Ana Martínez", phone: "+18095554321" },
    deliveryAddress: { addressLine: "Calle Duarte #80", city: "Santo Domingo - Bella Vista", coordinates: { lat: 18.4735, lng: -69.8860 } },
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

const DEFAULT_PRODUCTS = [
  { sku: "VEST-Casual-R", name: "Vestido Casual Rojo", price: 1800, icon: "👚" },
  { sku: "ZAP-Run-42", name: "Runner Sneakers Sport", price: 2400, icon: "👟" },
  { sku: "EAR-Wireless", name: "Audífonos Inalámbricos", price: 1200, icon: "📱" },
  { sku: "BAG-Leather", name: "Bolso de Cuero Elegante", price: 3500, icon: "🎒" }
];

const DEFAULT_COURIERS = [
  { id: "C-01", name: "Carlos M.", phone: "+18095551111", vehicle: "Motocicleta", plate: "K-123456", status: "Disponible" },
  { id: "C-02", name: "Luis A.", phone: "+18295552222", vehicle: "Motocicleta", plate: "K-654321", status: "Disponible" },
  { id: "C-03", name: "Yoselin V.", phone: "+18495553333", vehicle: "Motocicleta", plate: "K-987654", status: "En ruta" }
];

// Initialize State
let orders = JSON.parse(localStorage.getItem('enkargord_orders')) || DEFAULT_ORDERS;
let products = JSON.parse(localStorage.getItem('enkargord_products')) || DEFAULT_PRODUCTS;
let couriers = JSON.parse(localStorage.getItem('enkargord_couriers')) || DEFAULT_COURIERS;

// Safety migration: reset to defaults if old coordinate schema is stored in user's browser
if (orders.length > 0 && orders[0].deliveryAddress.coordinates && 'x' in orders[0].deliveryAddress.coordinates) {
  orders = DEFAULT_ORDERS;
  localStorage.setItem('enkargord_orders', JSON.stringify(orders));
}

// Courier Tracking simulated positions
const MOCK_SECTORS = [
  { zone: "Naco (Santo Domingo)", lat: 18.4795, lng: -69.9326 },
  { zone: "Bella Vista (Santo Domingo)", lat: 18.4556, lng: -69.9489 },
  { zone: "Piantini (Santo Domingo)", lat: 18.4746, lng: -69.9372 },
  { zone: "Zona Colonial (Santo Domingo)", lat: 18.4735, lng: -69.8860 }
];
let currentSectorIndex = 0;

// Core Financial Calculator Logic
function calculateFinancials(productCost, shippingCost, requiresFulfillment = false) {
  const pCost = parseFloat(productCost) || 0;
  const sCost = parseFloat(shippingCost) || 0;
  const fCost = requiresFulfillment ? 40 : 0;
  
  const totalCollected = pCost + sCost + fCost;
  const storeOwnerAmount = pCost;
  const polancoCommission = sCost > 0 ? 50 : 0;
  const transportadoraCommission = sCost > 0 ? Math.max(0, sCost - polancoCommission) : 0;
  
  return {
    productCost: pCost,
    shippingCost: sCost,
    fulfillmentCost: fCost,
    totalCollected,
    storeOwnerAmount,
    polancoCommission,
    transportadoraCommission
  };
}

// Toast System
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.className = `toast toast-${type} active`;
  toast.querySelector('.toast-message').textContent = message;
  
  setTimeout(() => {
    toast.classList.remove('active');
  }, 4000);
}

// Switch tabs inside dashboard.html
function bindTabsNavigation() {
  const tabDispatchBtn = document.getElementById('tab-dispatch-btn');
  const tabFleetBtn = document.getElementById('tab-fleet-btn');
  const tabSettlementBtn = document.getElementById('tab-settlement-btn');
  
  const menuDispatchTab = document.getElementById('menu-dispatch-tab');
  const menuFleetTab = document.getElementById('menu-fleet-tab');
  const menuSettlementTab = document.getElementById('menu-settlement-tab');

  const contentDispatch = document.getElementById('tab-dispatch-content');
  const contentFleet = document.getElementById('tab-fleet-content');
  const contentSettlement = document.getElementById('tab-settlement-content');

  if (!tabDispatchBtn) return; // Not on dashboard.html

  function switchTab(target) {
    // Remove active classes
    [tabDispatchBtn, tabFleetBtn, tabSettlementBtn].forEach(b => b.classList.remove('active'));
    [menuDispatchTab, menuFleetTab, menuSettlementTab].forEach(l => {
      if (l) l.parentElement.classList.remove('active');
    });
    [contentDispatch, contentFleet, contentSettlement].forEach(c => c.classList.remove('active'));

    // Add active classes to targets
    if (target === 'dispatch') {
      tabDispatchBtn.classList.add('active');
      if (menuDispatchTab) menuDispatchTab.parentElement.classList.add('active');
      contentDispatch.classList.add('active');
    } else if (target === 'fleet') {
      tabFleetBtn.classList.add('active');
      if (menuFleetTab) menuFleetTab.parentElement.classList.add('active');
      contentFleet.classList.add('active');
      renderFleetTab();
    } else if (target === 'settlement') {
      tabSettlementBtn.classList.add('active');
      if (menuSettlementTab) menuSettlementTab.parentElement.classList.add('active');
      contentSettlement.classList.add('active');
      renderSettlementTab();
    }
  }

  // Bind clicks
  tabDispatchBtn.addEventListener('click', () => switchTab('dispatch'));
  tabFleetBtn.addEventListener('click', () => switchTab('fleet'));
  tabSettlementBtn.addEventListener('click', () => switchTab('settlement'));

  if (menuDispatchTab) menuDispatchTab.addEventListener('click', (e) => { e.preventDefault(); switchTab('dispatch'); });
  if (menuFleetTab) menuFleetTab.addEventListener('click', (e) => { e.preventDefault(); switchTab('fleet'); });
  if (menuSettlementTab) menuSettlementTab.addEventListener('click', (e) => { e.preventDefault(); switchTab('settlement'); });
}

/* ==========================================================================
   ADMIN DASHBOARD TAB RENDERING (dashboard.html)
   ========================================================================== */
function updateDashboardStats() {
  const totalOrdersEl = document.getElementById('stat-total-orders');
  const transitOrdersEl = document.getElementById('stat-transit-orders');
  const deliveredOrdersEl = document.getElementById('stat-delivered-orders');
  const totalEarningsEl = document.getElementById('stat-total-earnings');
  
  if (!totalOrdersEl) return;
  
  const total = orders.length;
  const transit = orders.filter(o => o.status === 'in_transit').length;
  const delivered = orders.filter(o => o.status === 'delivered').length;
  
  // Accumulated pending cash to settle from motoristas in streets (delivered cash today)
  const earnings = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.financials.totalCollected, 0);
  
  totalOrdersEl.textContent = total.toLocaleString();
  transitOrdersEl.textContent = transit.toLocaleString();
  deliveredOrdersEl.textContent = delivered.toLocaleString();
  totalEarningsEl.textContent = `RD$${earnings.toLocaleString()}`;
}

// Render unassigned inbox for dispatch tab
function renderDispatchInbox() {
  const tbody = document.getElementById('dispatch-inbox-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  const unassigned = orders.filter(o => o.status === 'pending' || o.courierName === 'No asignado');
  
  if (unassigned.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--gray-medium); padding: 24px;">No hay envíos pendientes por asignar repartidor.</td></tr>`;
    return;
  }
  
  unassigned.forEach(order => {
    const tr = document.createElement('tr');
    
    // Build select dropdown of available couriers
    let optionsHtml = `<option value="" disabled selected>Seleccionar...</option>`;
    optionsHtml += `<option value="Gina (Administrador)">Gina (Administrador - Yo)</option>`;
    couriers.forEach(c => {
      optionsHtml += `<option value="${c.name}">${c.name} (${c.vehicle})</option>`;
    });
    
    tr.innerHTML = `
      <td class="tracking-id">#${order.trackingId}</td>
      <td><strong>${order.storeName || 'Tienda'}</strong></td>
      <td>${order.customer.name}</td>
      <td style="font-size: 0.8rem; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${order.deliveryAddress.addressLine}, ${order.deliveryAddress.city.split(' - ')[0]}
      </td>
      <td>
        <span class="badge ${order.fulfillment ? 'badge-delivered' : 'badge-pending'}">
          ${order.fulfillment ? 'Fulfillment' : 'Tienda'}
        </span>
      </td>
      <td style="font-weight: 600;">RD$${order.financials.totalCollected.toLocaleString()}</td>
      <td>
        <select id="assign-select-${order.id}" style="padding: 6px 8px; font-size: 0.8rem;">
          ${optionsHtml}
        </select>
      </td>
      <td style="text-align: right;">
        <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.75rem;" onclick="dispatchOrder('${order.id}')">
          Despachar
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Trigger dispatcher action
window.dispatchOrder = function(orderId) {
  const select = document.getElementById(`assign-select-${orderId}`);
  if (!select || !select.value) {
    alert("Por favor, selecciona un motorista para realizar la asignación.");
    return;
  }
  
  const courierName = select.value;
  const orderIndex = orders.findIndex(o => o.id === orderId);
  
  if (orderIndex !== -1) {
    orders[orderIndex].courierName = courierName;
    orders[orderIndex].status = 'in_transit';
    
    // Sync with courier list status
    const cIndex = couriers.findIndex(c => c.name === courierName);
    if (cIndex !== -1) {
      couriers[cIndex].status = "En ruta";
    }
    
    localStorage.setItem('enkargord_orders', JSON.stringify(orders));
    localStorage.setItem('enkargord_couriers', JSON.stringify(couriers));
    
    updateDashboardStats();
    renderDispatchInbox();
    renderOrdersTable();
    renderMapPins();
    renderChart();
    renderActiveMonitoringTable();
    showToast(`Pedido #${orders[orderIndex].trackingId} despachado a ruta con ${courierName}.`);
  }
};

// Control Tower Active monitoring list
function renderActiveMonitoringTable() {
  const tbody = document.getElementById('monitoring-orders-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const inTransit = orders.filter(o => o.status === 'in_transit');
  
  if (inTransit.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--gray-medium); padding: 24px;">No hay motoristas activos con paquetes en la calle ahora mismo.</td></tr>`;
    return;
  }
  
  inTransit.forEach(order => {
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
      <td class="tracking-id">#${order.trackingId}</td>
      <td><strong>${order.courierName}</strong></td>
      <td>📍 <span id="monitor-zone-${order.id}">${order.deliveryAddress.city}</span></td>
      <td>
        ${order.customer.name}<br>
        <span style="font-size: 0.75rem; color: var(--gray-medium);">${order.customer.phone}</span>
      </td>
      <td>
        <select id="monitor-status-${order.id}" style="padding: 6px 8px; font-size: 0.8rem;" onchange="updateStreetStatus('${order.id}', this.value)">
          <option value="in_transit" selected>En tránsito</option>
          <option value="delivered">Entregado</option>
          <option value="no_contesta">No contesta / Fallido</option>
          <option value="pending">Pendiente</option>
        </select>
      </td>
      <td style="text-align: right;">
        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.75rem;" onclick="simulateSiguienteZona('${order.id}')">
          Siguiente Zona 🛵
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Realtime courier manual simulator triggers
window.simulateSiguienteZona = function(orderId) {
  const zoneText = document.getElementById(`monitor-zone-${orderId}`);
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (!zoneText || orderIndex === -1) return;
  
  const randSector = MOCK_SECTORS[Math.floor(Math.random() * MOCK_SECTORS.length)];
  orders[orderIndex].deliveryAddress.city = randSector.zone;
  orders[orderIndex].deliveryAddress.coordinates = { x: randSector.x, y: randSector.y };
  
  localStorage.setItem('enkargord_orders', JSON.stringify(orders));
  
  zoneText.textContent = randSector.zone;
  renderMapPins();
  showToast(`Courier de envío #${orders[orderIndex].trackingId} actualizó su sector a ${randSector.zone.split(' ')[0]}.`);
};

// Update active status in streets
window.updateStreetStatus = function(orderId, newStatus) {
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) return;
  
  orders[orderIndex].status = newStatus;
  
  // If delivered or returned/failed, courier is free
  if (newStatus === 'delivered' || newStatus === 'pending') {
    const courierName = orders[orderIndex].courierName;
    const activeRouteOrders = orders.filter(o => o.courierName === courierName && o.status === 'in_transit');
    if (activeRouteOrders.length === 0) {
      const cIndex = couriers.findIndex(c => c.name === courierName);
      if (cIndex !== -1) {
        couriers[cIndex].status = "Disponible";
      }
    }
  }
  
  localStorage.setItem('enkargord_orders', JSON.stringify(orders));
  localStorage.setItem('enkargord_couriers', JSON.stringify(couriers));
  
  updateDashboardStats();
  renderDispatchInbox();
  renderOrdersTable();
  renderMapPins();
  renderChart();
  renderActiveMonitoringTable();
  
  showToast(`Pedido #${orders[orderIndex].trackingId} marcado como "${newStatus === 'delivered' ? 'Entregado' : newStatus === 'no_contesta' ? 'No contesta' : newStatus}".`);
};

function renderOrdersTable() {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const sortedOrders = [...orders].sort((a, b) => b.trackingId.localeCompare(a.trackingId));
  
  sortedOrders.forEach(order => {
    const tr = document.createElement('tr');
    
    let badgeClass = 'badge-pending';
    let statusText = 'Pendiente';
    if (order.status === 'in_transit') {
      badgeClass = 'badge-transit';
      statusText = 'En tránsito';
    } else if (order.status === 'delivered') {
      badgeClass = 'badge-delivered';
      statusText = 'Entregado';
    } else if (order.status === 'no_contesta') {
      badgeClass = 'badge-failed';
      statusText = 'No contesta';
    }
    
    const courierHtml = order.courierName === 'No asignado'
      ? `<span style="color: var(--gray-medium);">--</span>`
      : `<div class="courier-info">
           <span>${order.courierName}</span>
         </div>`;
         
    tr.innerHTML = `
      <td class="tracking-id">#${order.trackingId}</td>
      <td>${order.customer.name}</td>
      <td><span class="badge ${badgeClass}">${statusText}</span></td>
      <td>${courierHtml}</td>
      <td style="font-weight: 600; text-align: right;">RD$${order.financials.totalCollected.toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });
}

let leafletMap = null;
let mapMarkers = {}; // key: courierName, value: Leaflet Marker

function renderMapPins() {
  const mapDiv = document.getElementById('map-leaflet');
  if (!mapDiv) return; // Not on dashboard.html
  
  // Initialize Leaflet map instance if not loaded yet
  if (!leafletMap) {
    // OSM Streets base layer
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    });
    
    // Esri World Imagery (Satellite) layer
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USDA, USGS, AeroGRID, and the GIS User Community'
    });

    leafletMap = L.map('map-leaflet', {
      center: [18.4861, -69.9312], // Center on Santo Domingo, RD
      zoom: 13,
      layers: [streetLayer] // Default layer
    });
    
    const baseLayers = {
      "Vista Calles": streetLayer,
      "Vista Satelital": satelliteLayer
    };
    
    // Add Layer control toggle widget to map (top right position)
    L.control.layers(baseLayers, null, { position: 'topright' }).addTo(leafletMap);
  }
  
  // Realtime updates (onSnapshot mock logic listening to active status changes)
  const activeOrdersInTransit = orders.filter(o => o.status === 'in_transit');
  
  // Tracking set of couriers currently active in transit
  const activeCouriersOnMap = new Set();
  
  activeOrdersInTransit.forEach(order => {
    const courierName = order.courierName;
    if (courierName === 'No asignado') return;
    
    activeCouriersOnMap.add(courierName);
    
    const coords = order.deliveryAddress.coordinates || { lat: 18.4861, lng: -69.9312 };
    const lat = coords.lat || 18.4861;
    const lng = coords.lng || -69.9312;
    
    // Compile stats to render inside the Leaflet TooltipPopup
    const pendingCount = orders.filter(o => o.courierName === courierName && o.status === 'in_transit').length;
    const courierObj = couriers.find(c => c.name === courierName);
    
    // Connection Status check: Active if they are currently carrying packages in transit
    const connectionStatus = courierObj && courierObj.status !== 'Offline' ? 'Activo 🟢' : 'Inactivo 🔴';
    const lastZone = order.deliveryAddress.city || 'Santo Domingo, RD';
    
    const tooltipContent = `
      <div style="font-family: var(--font-body); font-size: 0.85rem; line-height: 1.5; color: #1e293b; min-width: 170px;">
        <strong style="font-size: 0.95rem; color: var(--primary); display: block; margin-bottom: 6px; font-family: var(--font-display);">🛵 ${courierName}</strong>
        <b>Conexión:</b> ${connectionStatus}<br>
        <b>Zona Actual:</b> ${lastZone.split(' - ')[0]}<br>
        <b>Paquetes en Ruta:</b> ${pendingCount}<br>
        <span style="font-size: 0.7rem; color: var(--gray-medium); display: block; margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 4px;">📍 GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}</span>
      </div>
    `;
    
    if (mapMarkers[courierName]) {
      // Reposition marker smoothly in place
      mapMarkers[courierName].setLatLng([lat, lng]);
      mapMarkers[courierName].getPopup().setContent(tooltipContent);
    } else {
      // Build and bind new Leaflet marker instance
      const marker = L.marker([lat, lng]).addTo(leafletMap);
      marker.bindPopup(tooltipContent);
      mapMarkers[courierName] = marker;
    }
  });
  
  // Clean up markers of couriers that returned from their routes
  Object.keys(mapMarkers).forEach(cName => {
    if (!activeCouriersOnMap.has(cName)) {
      leafletMap.removeLayer(mapMarkers[cName]);
      delete mapMarkers[cName];
    }
  });
}

function renderChart() {
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const transitCount = orders.filter(o => o.status === 'in_transit').length;
  const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'no_contesta').length;
  const total = orders.length || 1;
  
  const pDelivered = (deliveredCount / total) * 100;
  const pTransit = (transitCount / total) * 100;
  const pPending = (pendingCount / total) * 100;
  
  const chartMock = document.getElementById('chart-mock');
  if (chartMock) {
    chartMock.style.background = `conic-gradient(
      var(--primary) 0% ${pDelivered}%, 
      var(--info) ${pDelivered}% ${pDelivered + pTransit}%, 
      var(--warning) ${pDelivered + pTransit}% 100%
    )`;
  }
  
  const chartTotalVal = document.getElementById('chart-total-val');
  if (chartTotalVal) chartTotalVal.textContent = orders.length;
  
  const lDelivered = document.getElementById('lbl-delivered');
  const lTransit = document.getElementById('lbl-transit');
  const lPending = document.getElementById('lbl-pending');
  
  if (lDelivered) lDelivered.innerHTML = `<span>${deliveredCount} (${pDelivered.toFixed(1)}%)</span>`;
  if (lTransit) lTransit.innerHTML = `<span>${transitCount} (${pTransit.toFixed(1)}%)</span>`;
  if (lPending) lPending.innerHTML = `<span>${pendingCount} (${pPending.toFixed(1)}%)</span>`;
}


/* ==========================================================================
   FLEET MANAGEMENT TAB RENDERING (Tab 2)
   ========================================================================== */
function renderFleetTab() {
  const container = document.getElementById('fleet-couriers-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (couriers.length === 0) {
    container.innerHTML = `<p style="color: var(--gray-medium);">No hay mensajeros registrados en la transportadora.</p>`;
    return;
  }
  
  couriers.forEach(c => {
    const card = document.createElement('div');
    card.className = 'fleet-card';
    
    let statusColor = 'var(--warning)';
    if (c.status === 'Disponible') statusColor = 'var(--success)';
    if (c.status === 'Offline') statusColor = 'var(--gray-medium)';
    
    card.innerHTML = `
      <div class="fleet-card-header">
        <span class="fleet-card-name">👤 ${c.name}</span>
        <span class="badge" style="background-color: ${statusColor}1A; color: ${statusColor}; font-weight: 700;">${c.status}</span>
      </div>
      <div class="fleet-card-body">
        📞 <strong>Tel:</strong> ${c.phone}<br>
        📦 <strong>Vehículo:</strong> ${c.vehicle}<br>
        🏷️ <strong>Placa:</strong> ${c.plate}<br>
        🔑 <strong>Usuario Acceso:</strong> ${c.id}
      </div>
      <div class="fleet-card-actions">
        <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.75rem; width: 100%; border-color: #ef4444; color: #ef4444;" onclick="deleteCourier('${c.id}')">
          Dar de Baja
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

window.deleteCourier = function(courierId) {
  if (confirm("¿Estás seguro de que deseas eliminar este mensajero de la flota?")) {
    couriers = couriers.filter(c => c.id !== courierId);
    localStorage.setItem('enkargord_couriers', JSON.stringify(couriers));
    renderFleetTab();
    renderDispatchInbox();
    showToast("Mensajero eliminado de la flota.");
  }
};


/* ==========================================================================
   FINANCIAL SETTLEMENT TAB RENDERING (Tab 3)
   ========================================================================== */
function renderSettlementTab() {
  const tbody = document.getElementById('settlement-table-body');
  const sumCollected = document.getElementById('settle-val-collected');
  const sumStore = document.getElementById('settle-val-store');
  const sumShipping = document.getElementById('settle-val-shipping');
  const sumPolanco = document.getElementById('settle-val-polanco');
  const sumTransport = document.getElementById('settle-val-transportadora');

  if (!tbody) return;
  
  tbody.innerHTML = '';
  const delivered = orders.filter(o => o.status === 'delivered');
  
  if (delivered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--gray-medium); padding: 24px;">No hay rutas de pedidos entregadas y listas para liquidación hoy.</td></tr>`;
    if (sumCollected) sumCollected.textContent = 'RD$0.00';
    if (sumStore) sumStore.textContent = 'RD$0.00';
    if (sumShipping) sumShipping.textContent = 'RD$0.00';
    if (sumPolanco) sumPolanco.textContent = 'RD$0.00';
    if (sumTransport) sumTransport.textContent = 'RD$0.00';
    return;
  }

  let totalCollected = 0;
  let totalStore = 0;
  let totalShipping = 0;
  let totalPolanco = 0;
  let totalTransport = 0;

  delivered.forEach(order => {
    const f = order.financials;
    const fulfillmentAdd = f.fulfillmentCost || 0;
    
    // Transportadora gets Shipping Cost - Polanco flat RD$50 + optional packaging fee (Fulfillment RD$40)
    const transportadoraNet = f.transportadoraCommission + fulfillmentAdd;

    totalCollected += f.totalCollected;
    totalStore += f.storeOwnerAmount;
    totalShipping += f.shippingCost;
    totalPolanco += f.polancoCommission;
    totalTransport += transportadoraNet;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="tracking-id">#${order.trackingId}</td>
      <td>${order.storeName || 'Tienda'}</td>
      <td><strong>${order.courierName}</strong></td>
      <td>RD$${f.storeOwnerAmount.toLocaleString()}</td>
      <td>RD$${f.shippingCost.toLocaleString()}</td>
      <td>RD$${fulfillmentAdd.toLocaleString()}</td>
      <td style="color: var(--primary);">RD$${f.polancoCommission.toLocaleString()}</td>
      <td style="color: var(--info); font-weight: 600;">RD$${transportadoraNet.toLocaleString()}</td>
      <td style="text-align: right; font-weight: 700; color: var(--success);">RD$${f.totalCollected.toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });

  // Write calculated sums to metrics labels
  if (sumCollected) sumCollected.textContent = `RD$${totalCollected.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
  if (sumStore) sumStore.textContent = `RD$${totalStore.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
  if (sumShipping) sumShipping.textContent = `RD$${totalShipping.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
  if (sumPolanco) sumPolanco.textContent = `RD$${totalPolanco.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
  if (sumTransport) sumTransport.textContent = `RD$${totalTransport.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
}


/* ==========================================================================
   STORE DASHBOARD COMPONENT RENDERING (store.html)
   ========================================================================== */
function renderStoreProducts() {
  const container = document.getElementById('store-products-list');
  const selector = document.getElementById('order-product-select');
  const countEl = document.getElementById('product-count');
  
  if (!container) return;
  
  container.innerHTML = '';
  if (selector) {
    selector.innerHTML = '<option value="" disabled selected>-- Elige un producto de tu inventario --</option>';
  }
  
  if (countEl) {
    countEl.textContent = `${products.length} productos`;
  }
  
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-store-card';
    card.innerHTML = `
      <div class="product-card-img">${p.icon}</div>
      <div class="product-card-title">${p.name}</div>
      <div class="product-card-sku">SKU: ${p.sku}</div>
      <div class="product-card-price">RD$${p.price.toLocaleString()}</div>
    `;
    container.appendChild(card);
    
    if (selector) {
      const opt = document.createElement('option');
      opt.value = p.sku;
      opt.textContent = `${p.icon} ${p.name} - RD$${p.price.toLocaleString()}`;
      selector.appendChild(opt);
    }
  });
}

function renderStoreOrdersTable() {
  const tbody = document.getElementById('store-orders-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const storeOrders = orders.filter(o => o.storeId === 'STORE_01');
  const sorted = [...storeOrders].sort((a, b) => b.trackingId.localeCompare(a.trackingId));
  
  sorted.forEach(order => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="tracking-id">#${order.trackingId}</td>
      <td>
        <strong>${order.customer.name}</strong><br>
        <span style="font-size: 0.75rem; color: var(--gray-medium);">${order.customer.phone}</span>
      </td>
      <td>${order.productSku || 'Ropa / Varios'}</td>
      <td>
        <span class="badge ${order.fulfillment ? 'badge-delivered' : 'badge-pending'}">
          ${order.fulfillment ? 'Fulfillment' : 'Tienda'}
        </span>
      </td>
      <td style="font-weight: 600;">RD$${order.financials.totalCollected.toLocaleString()}</td>
      <td style="text-align: right;">
        <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.75rem;" onclick="openLabelPrinter('${order.id}')">
          🖨️ Imprimir Label
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Shipping Label Generator HTML builder
window.openLabelPrinter = function(orderId) {
  const modal = document.getElementById('modal-label-printer');
  const container = document.getElementById('printable-label-area');
  if (!modal || !container) return;
  
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  container.innerHTML = `
    <div class="shipping-label-card">
      <div class="label-header">
        <div class="label-header-logo">Enkargo<span>RD</span></div>
        <div style="text-align: right; font-size: 0.8rem;">
          <strong>ID: #${order.trackingId}</strong><br>
          Fecha: ${new Date(order.createdAt).toLocaleDateString('es-DO')}
        </div>
      </div>
      
      <div class="label-routing-info">
        <div>
          <div class="label-section-title">ORIGEN (REMITENTE)</div>
          <strong>Moda Express RD</strong><br>
          Santo Domingo, RD
        </div>
        <div style="border-left: 1px solid #000; padding-left: 12px;">
          <div class="label-section-title">DESTINO</div>
          <strong>${order.deliveryAddress.city}</strong><br>
          Rep. Dominicana
        </div>
      </div>
      
      <div class="label-customer-section">
        <div class="label-section-title">ENTREGAR A (DESTINATARIO)</div>
        <div class="label-customer-name">${order.customer.name}</div>
        <div style="font-size: 0.9rem;">
          📞 Tel: ${order.customer.phone}<br>
          📍 Dir: ${order.deliveryAddress.addressLine}
        </div>
      </div>
      
      <div class="label-routing-info" style="border-bottom: none; margin-bottom: 0;">
        <div>
          <div class="label-section-title">DETALLES PAQUETE</div>
          Código: ${order.productSku || 'VEST-01'}<br>
          Cobro COD: <strong>RD$${order.financials.totalCollected.toLocaleString()}</strong>
        </div>
        <div style="border-left: 1px solid #000; padding-left: 12px; font-weight: bold; text-align: center; color: var(--primary);">
          ${order.fulfillment ? '<div class="label-badge-fulfillment" style="margin-top: 5px;">FULFILLMENT ACTIVO</div>' : '<div style="margin-top: 10px; font-size: 0.75rem; border: 1px dashed #000; padding: 4px;">EMPAQUE PROPIO</div>'}
        </div>
      </div>
      
      <div class="label-barcode-mock">
        <div class="barcode-lines"></div>
        <div class="barcode-number">*${order.trackingId}*</div>
      </div>
    </div>
  `;
  
  modal.classList.add('active');
};

// Courier Zone Tracking Simulation loop
function startCourierSimulation() {
  const statusHeader = document.getElementById('tracker-courier-name');
  const statusDetails = document.getElementById('tracker-courier-details');
  const zoneLabel = document.getElementById('map-courier-zone-label');
  const pin = document.querySelector('#store-tracking-map-container .map-pin');
  
  if (!statusHeader) return;
  
  setInterval(() => {
    currentSectorIndex = (currentSectorIndex + 1) % MOCK_SECTORS.length;
    const currentLoc = MOCK_SECTORS[currentSectorIndex];
    
    statusHeader.textContent = "Carlos M. (Motorizado)";
    statusDetails.textContent = `Sector: En tránsito por ${currentLoc.zone}`;
    if (zoneLabel) zoneLabel.textContent = `Carlos M. - ${currentLoc.zone.split(' ')[0]}`;
    
    if (pin) {
      pin.style.left = `${currentLoc.x}px`;
      pin.style.top = `${currentLoc.y}px`;
    }
  }, 6000);
}


/* ==========================================================================
   DOM COMPONENT EVENT BINDINGS
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // Bind Tabs navigation inside dashboard.html
  bindTabsNavigation();

  const openModalBtn = document.getElementById('btn-open-create-order');
  const closeModalBtn = document.getElementById('btn-close-modal');
  const cancelBtn = document.getElementById('btn-cancel-form');
  const modalOverlay = document.getElementById('modal-create-order');
  const createOrderForm = document.getElementById('create-order-form');
  
  const productCostInput = document.getElementById('prod-cost');
  const shippingCostInput = document.getElementById('ship-cost');
  const valCollected = document.getElementById('val-collected');
  const valStore = document.getElementById('val-store');
  const valPolanco = document.getElementById('val-polanco');
  const valLogistics = document.getElementById('val-logistics');
  
  function triggerFinancialPreview() {
    if (!productCostInput) return;
    const calc = calculateFinancials(productCostInput.value, shippingCostInput.value, false);
    if (valCollected) valCollected.textContent = `RD$${calc.totalCollected.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
    if (valStore) valStore.textContent = `RD$${calc.storeOwnerAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
    if (valPolanco) valPolanco.textContent = `RD$${calc.polancoCommission.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
    if (valLogistics) valLogistics.textContent = `RD$${calc.transportadoraCommission.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
  }
  
  if (productCostInput) {
    productCostInput.addEventListener('input', triggerFinancialPreview);
    shippingCostInput.addEventListener('input', triggerFinancialPreview);
  }
  
  if (openModalBtn && modalOverlay) {
    openModalBtn.addEventListener('click', () => {
      modalOverlay.classList.add('active');
      createOrderForm.reset();
      triggerFinancialPreview();
    });
  }
  
  function hideModal() {
    if (modalOverlay) modalOverlay.classList.remove('active');
  }
  
  if (closeModalBtn) closeModalBtn.addEventListener('click', hideModal);
  if (cancelBtn) cancelBtn.addEventListener('click', hideModal);
  
  // Admin Manual Order creator
  if (createOrderForm) {
    createOrderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const customerName = document.getElementById('cust-name').value;
      const customerPhone = document.getElementById('cust-phone').value;
      const address = document.getElementById('cust-address').value;
      const city = document.getElementById('cust-city').value;
      const productCost = parseFloat(productCostInput.value) || 0;
      const shippingCost = parseFloat(shippingCostInput.value) || 0;
      
      const financialDetails = calculateFinancials(productCost, shippingCost, false);
      const nextNum = orders.length > 0
        ? Math.max(...orders.map(o => parseInt(o.trackingId.split('-')[1]) || 0)) + 1
        : 1251;
        
      const newOrder = {
        id: `ENK-${nextNum}`,
        trackingId: `ENK-${nextNum}`,
        status: "pending",
        storeId: "STORE_01",
        storeName: "Moda Express RD",
        courierName: "No asignado",
        courierAvatar: "",
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
        customer: { name: customerName, phone: customerPhone },
        deliveryAddress: { addressLine: address, city, coordinates: { lat: 18.4861 + (Math.random() - 0.5) * 0.05, lng: -69.9312 + (Math.random() - 0.5) * 0.05 } },
        fulfillment: false,
        financials: financialDetails
      };
      
      orders.push(newOrder);
      localStorage.setItem('enkargord_orders', JSON.stringify(orders));
      
      updateDashboardStats();
      renderDispatchInbox();
      renderOrdersTable();
      renderMapPins();
      renderChart();
      hideModal();
      showToast(`Pedido #${newOrder.trackingId} creado en la bandeja de entrada.`);
    });
  }

  // Courier Add Form (Tab 2)
  const addCourierForm = document.getElementById('fleet-add-courier-form');
  if (addCourierForm) {
    addCourierForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('courier-form-name').value;
      const phone = document.getElementById('courier-form-phone').value;
      const vehicle = document.getElementById('courier-form-vehicle').value;
      const plate = document.getElementById('courier-form-plate').value;
      const user = document.getElementById('courier-form-user').value;
      
      const newCourier = {
        id: user,
        name,
        phone,
        vehicle,
        plate,
        status: "Disponible"
      };
      
      couriers.push(newCourier);
      localStorage.setItem('enkargord_couriers', JSON.stringify(couriers));
      
      renderFleetTab();
      renderDispatchInbox();
      addCourierForm.reset();
      showToast(`Mensajero "${name}" registrado en la flota.`);
    });
  }

  // Close Cashbox action (Tab 3)
  const closeCashboxBtn = document.getElementById('btn-close-cashbox');
  if (closeCashboxBtn) {
    closeCashboxBtn.addEventListener('click', () => {
      const deliveredCount = orders.filter(o => o.status === 'delivered').length;
      if (deliveredCount === 0) {
        alert("No hay pedidos entregados para liquidar en este cuadre.");
        return;
      }
      
      if (confirm(`¿Estás seguro de que deseas cerrar la caja? Se liquidarán ${deliveredCount} pedidos completados.`)) {
        // Clear delivered orders or set their status to settled so they disappear from active box
        orders = orders.filter(o => o.status !== 'delivered');
        localStorage.setItem('enkargord_orders', JSON.stringify(orders));
        
        updateDashboardStats();
        renderDispatchInbox();
        renderOrdersTable();
        renderMapPins();
        renderChart();
        renderSettlementTab();
        
        showToast("Cuadre finalizado. Caja cerrada y liquidaciones a tiendas transferidas.");
      }
    });
  }

  /* ==========================================================================
     STORE OWNER EVENT HANDLERS (store.html)
     ========================================================================== */
  const addProductForm = document.getElementById('store-add-product-form');
  const openModalStoreBtn = document.getElementById('btn-open-create-order-store');
  const closeModalStoreBtn = document.getElementById('btn-close-modal-store');
  const cancelStoreBtn = document.getElementById('btn-cancel-store-form');
  const modalStoreOverlay = document.getElementById('modal-create-order-store');
  const storeOrderForm = document.getElementById('store-create-order-form');
  const productSelect = document.getElementById('order-product-select');
  const fulfillmentToggle = document.getElementById('store-fulfillment-toggle');
  const storeShipCostInput = document.getElementById('store-ship-cost');
  
  const sPrevProd = document.getElementById('store-preview-prod');
  const sPrevShip = document.getElementById('store-preview-ship');
  const sPrevFulfillment = document.getElementById('store-preview-fulfillment');
  const sPrevPolanco = document.getElementById('store-preview-polanco');
  const sPrevLogistics = document.getElementById('store-preview-logistics');
  const sPrevCollected = document.getElementById('store-preview-collected');
  
  function triggerStoreFinancialPreview() {
    if (!productSelect) return;
    const selectedSku = productSelect.value;
    const prod = products.find(p => p.sku === selectedSku);
    const pCost = prod ? prod.price : 0;
    const sCost = parseFloat(storeShipCostInput.value) || 0;
    const requiresFulfillment = fulfillmentToggle.checked;
    
    const calc = calculateFinancials(pCost, sCost, requiresFulfillment);
    
    if (sPrevProd) sPrevProd.textContent = `RD$${calc.productCost.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
    if (sPrevShip) sPrevShip.textContent = `RD$${calc.shippingCost.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
    if (sPrevFulfillment) sPrevFulfillment.textContent = `RD$${calc.fulfillmentCost.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
    if (sPrevPolanco) sPrevPolanco.textContent = `RD$${calc.polancoCommission.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
    if (sPrevLogistics) sPrevLogistics.textContent = `RD$${calc.transportadoraCommission.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
    if (sPrevCollected) sPrevCollected.textContent = `RD$${calc.totalCollected.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
  }
  
  if (productSelect) {
    productSelect.addEventListener('change', triggerStoreFinancialPreview);
    fulfillmentToggle.addEventListener('change', triggerStoreFinancialPreview);
    storeShipCostInput.addEventListener('input', triggerStoreFinancialPreview);
  }
  
  if (openModalStoreBtn && modalStoreOverlay) {
    openModalStoreBtn.addEventListener('click', () => {
      modalStoreOverlay.classList.add('active');
      storeOrderForm.reset();
      triggerStoreFinancialPreview();
    });
  }
  
  function hideStoreModal() {
    if (modalStoreOverlay) modalStoreOverlay.classList.remove('active');
  }
  
  if (closeModalStoreBtn) closeModalStoreBtn.addEventListener('click', hideStoreModal);
  if (cancelStoreBtn) cancelStoreBtn.addEventListener('click', hideStoreModal);
  
  if (addProductForm) {
    addProductForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('prod-name').value;
      const sku = document.getElementById('prod-sku').value;
      const price = parseFloat(document.getElementById('prod-price').value) || 0;
      const icon = document.getElementById('prod-icon').value;
      
      const newProduct = { sku, name, price, icon };
      products.push(newProduct);
      localStorage.setItem('enkargord_products', JSON.stringify(products));
      
      renderStoreProducts();
      addProductForm.reset();
      showToast(`Producto "${name}" subido al inventario exitosamente.`);
    });
  }
  
  if (storeOrderForm) {
    storeOrderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const sku = productSelect.value;
      const prod = products.find(p => p.sku === sku);
      const name = document.getElementById('store-cust-name').value;
      const phone = document.getElementById('store-cust-phone').value;
      const address = document.getElementById('store-cust-address').value;
      const city = document.getElementById('store-cust-city').value;
      const sCost = parseFloat(storeShipCostInput.value) || 0;
      const requiresFulfillment = fulfillmentToggle.checked;
      
      const financialDetails = calculateFinancials(prod.price, sCost, requiresFulfillment);
      const nextNum = orders.length > 0
        ? Math.max(...orders.map(o => parseInt(o.trackingId.split('-')[1]) || 0)) + 1
        : 1251;
        
      const newOrder = {
        id: `ENK-${nextNum}`,
        trackingId: `ENK-${nextNum}`,
        status: "pending", // starts as pending in central inbox
        storeId: "STORE_01",
        storeName: "Moda Express RD",
        courierName: "No asignado",
        courierAvatar: "",
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
        customer: { name, phone },
        deliveryAddress: { addressLine: address, city, coordinates: { lat: 18.4795, lng: -69.9326 } },
        fulfillment: requiresFulfillment,
        productSku: sku,
        financials: financialDetails
      };
      
      orders.push(newOrder);
      localStorage.setItem('enkargord_orders', JSON.stringify(orders));
      
      renderStoreOrdersTable();
      hideStoreModal();
      showToast(`Envío #${newOrder.trackingId} enviado a la bandeja de despacho del Administrador.`);
    });
  }

  const labelModal = document.getElementById('modal-label-printer');
  const closePrinterBtn = document.getElementById('btn-close-printer');
  const closePrinterCancelBtn = document.getElementById('btn-close-printer-cancel');
  
  if (labelModal) {
    const hideLabelModal = () => labelModal.classList.remove('active');
    if (closePrinterBtn) closePrinterBtn.addEventListener('click', hideLabelModal);
    if (closePrinterCancelBtn) closePrinterCancelBtn.addEventListener('click', hideLabelModal);
  }

  // Initial draw selector
  if (document.getElementById('stat-total-orders')) {
    updateDashboardStats();
    renderDispatchInbox();
    renderActiveMonitoringTable();
    renderOrdersTable();
    renderMapPins();
    renderChart();
  }
  
  if (document.getElementById('store-products-list')) {
    renderStoreProducts();
    renderStoreOrdersTable();
    startCourierSimulation();
  }

  /* ==========================================================================
     COURIER MOBILE APP HANDLERS (courier.html)
     ========================================================================== */
  const courierUserSelect = document.getElementById('courier-user-select');
  const activeDeliveryContainer = document.getElementById('courier-active-delivery-container');
  const noDeliveriesPlaceholder = document.getElementById('courier-no-deliveries-placeholder');
  const gpsStatusText = document.getElementById('gps-status-text');

  function renderCourierActiveDelivery() {
    if (!courierUserSelect || !activeDeliveryContainer) return;
    
    const selectedCourier = courierUserSelect.value;
    // Find the first order in transit for this specific courier
    const activeOrder = orders.find(o => o.courierName === selectedCourier && o.status === 'in_transit');
    
    if (!activeOrder) {
      activeDeliveryContainer.innerHTML = '';
      activeDeliveryContainer.style.display = 'none';
      noDeliveriesPlaceholder.style.display = 'block';
      return;
    }
    
    noDeliveriesPlaceholder.style.display = 'none';
    activeDeliveryContainer.style.display = 'block';
    
    // Clean customer phone number for WhatsApp wa.me API (digits only)
    const cleanPhone = activeOrder.customer.phone.replace(/\D/g, '');
    const defaultText = `Hola, soy el repartidor de la tienda ${activeOrder.storeName}, estoy en camino con su pedido.`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultText)}`;
    
    activeDeliveryContainer.innerHTML = `
      <div class="active-delivery-card">
        <h3 style="font-size: 1.15rem; margin-bottom: 4px;">Envío #${activeOrder.trackingId}</h3>
        <p style="color: var(--gray-medium); font-size: 0.85rem; margin-bottom: 12px;">Tienda: <strong>${activeOrder.storeName}</strong></p>
        
        <div style="font-size: 0.9rem; line-height: 1.6; margin-bottom: 12px;">
          👤 <strong>Cliente:</strong> ${activeOrder.customer.name}<br>
          📍 <strong>Dirección:</strong> ${activeOrder.deliveryAddress.addressLine}<br>
          🏘️ <strong>Sector actual:</strong> <span style="color: var(--primary); font-weight: bold;">${activeOrder.deliveryAddress.city}</span>
        </div>
        
        <a href="${waUrl}" target="_blank" class="courier-phone-link">
          💬 Enviar WhatsApp (${activeOrder.customer.phone})
        </a>
        
        <div class="delivery-details-price">
          <span style="font-size: 0.75rem; color: var(--gray-medium); display: block; font-weight: normal; margin-bottom: 2px;">MONTO A COBRAR (COD)</span>
          RD$${activeOrder.financials.totalCollected.toLocaleString()}
        </div>
        
        <div style="margin-top: 16px; display: flex; flex-direction: column; gap: 16px;">
          <!-- Big next zone trigger -->
          <button class="big-zone-btn" onclick="mobileNextZone('${activeOrder.id}')">
            Siguiente Zona 🛵
          </button>
          
          <!-- Delivery States grid -->
          <div class="courier-status-grid">
            <button class="courier-btn-action btn-status-delivered" onclick="mobileUpdateStatus('${activeOrder.id}', 'delivered')">
              ✅ Entregado
            </button>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <button class="courier-btn-action btn-status-failed" style="font-size: 0.9rem; padding: 12px;" onclick="mobileUpdateStatus('${activeOrder.id}', 'no_contesta')">
                🚫 No Contesta
              </button>
              <button class="courier-btn-action btn-status-pending" style="font-size: 0.9rem; padding: 12px;" onclick="mobileUpdateStatus('${activeOrder.id}', 'pending')">
                ⏳ Pendiente
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Mobile simulator next zone trigger
  window.mobileNextZone = function(orderId) {
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;
    
    // Cycle sector
    currentSectorIndex = (currentSectorIndex + 1) % MOCK_SECTORS.length;
    const nextSector = MOCK_SECTORS[currentSectorIndex];
    orders[orderIndex].deliveryAddress.city = nextSector.zone;
    orders[orderIndex].deliveryAddress.coordinates = { x: nextSector.x, y: nextSector.y };
    
    localStorage.setItem('enkargord_orders', JSON.stringify(orders));
    
    renderCourierActiveDelivery();
    showToast(`Zona actualizada a ${nextSector.zone.split(' ')[0]}.`);
  };

  // Mobile status update action
  window.mobileUpdateStatus = function(orderId, newStatus) {
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;
    
    const order = orders[orderIndex];
    order.status = newStatus;
    
    // If completed or pending, courier is available again
    if (newStatus === 'delivered' || newStatus === 'pending') {
      const cName = order.courierName;
      const activeTransit = orders.filter(o => o.courierName === cName && o.status === 'in_transit');
      if (activeTransit.length === 0) {
        const cIndex = couriers.findIndex(c => c.name === cName);
        if (cIndex !== -1) {
          couriers[cIndex].status = "Disponible";
        }
      }
    }
    
    localStorage.setItem('enkargord_orders', JSON.stringify(orders));
    localStorage.setItem('enkargord_couriers', JSON.stringify(couriers));
    
    renderCourierActiveDelivery();
    
    let msg = `Pedido #${order.trackingId} actualizado.`;
    if (newStatus === 'delivered') msg = `¡Entrega #${order.trackingId} completada y registrada!`;
    showToast(msg);
  };

  // Browser HTML5 Geolocation API hook
  function initBrowserGeolocation() {
    if (!gpsStatusText) return;
    
    if ("geolocation" in navigator) {
      // Use watchPosition to monitor location in real-time
      navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          gpsStatusText.innerHTML = `<span class="gps-pulse-dot"></span> 📡 GPS Activo: Lat: ${lat}, Lng: ${lng}`;
          
          // Update selected courier GPS coords in local database
          if (courierUserSelect) {
            const selected = courierUserSelect.value;
            const cIndex = couriers.findIndex(c => c.name === selected);
            if (cIndex !== -1) {
              couriers[cIndex].lastLocation = { lat, lng };
              localStorage.setItem('enkargord_couriers', JSON.stringify(couriers));
            }
          }
        },
        (error) => {
          gpsStatusText.innerHTML = `⚠️ GPS inactivo (Señal estimada por antena)`;
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    } else {
      gpsStatusText.textContent = "❌ GPS no soportado por navegador";
    }
  }

  // Populate courier login list on mobile app view
  if (courierUserSelect) {
    courierUserSelect.innerHTML = '';
    
    // Add default admin first for testing
    const optAdmin = document.createElement('option');
    optAdmin.value = "Gina (Administrador)";
    optAdmin.textContent = "Gina (Admin/Yo)";
    courierUserSelect.appendChild(optAdmin);
    
    // Add all registered fleet couriers
    couriers.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.name;
      opt.textContent = `${c.name} (${c.vehicle})`;
      courierUserSelect.appendChild(opt);
    });
    
    // Bind change listener
    courierUserSelect.addEventListener('change', renderCourierActiveDelivery);
    
    // Initial calls
    renderCourierActiveDelivery();
    initBrowserGeolocation();
  }
});
