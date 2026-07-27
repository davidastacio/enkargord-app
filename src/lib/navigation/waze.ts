type OrderLocation = {
  latitude?: unknown;
  longitude?: unknown;
  deliveryLatitude?: unknown;
  deliveryLongitude?: unknown;
  formattedAddress?: unknown;
  street?: unknown;
  sectorName?: unknown;
  municipalityName?: unknown;
  provinceName?: unknown;
  deliveryAddress?: {
    fullAddress?: unknown;
    addressLine?: unknown;
    coordinates?: { lat?: unknown; lng?: unknown };
  };
};

function finiteCoordinate(value: unknown): number | null {
  const coordinate = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(coordinate) ? coordinate : null;
}

function nonEmptyText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function buildWazeUrl(order: OrderLocation): string {
  const latitude = finiteCoordinate(
    order.latitude ?? order.deliveryLatitude ?? order.deliveryAddress?.coordinates?.lat,
  );
  const longitude = finiteCoordinate(
    order.longitude ?? order.deliveryLongitude ?? order.deliveryAddress?.coordinates?.lng,
  );
  const params = new URLSearchParams({ navigate: 'yes', utm_source: 'enkargord' });

  if (
    latitude !== null &&
    longitude !== null &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  ) {
    params.set('ll', `${latitude},${longitude}`);
  } else {
    const address = [
      nonEmptyText(order.formattedAddress) ||
        nonEmptyText(order.street) ||
        nonEmptyText(order.deliveryAddress?.fullAddress) ||
        nonEmptyText(order.deliveryAddress?.addressLine),
      nonEmptyText(order.sectorName),
      nonEmptyText(order.municipalityName),
      nonEmptyText(order.provinceName),
      'República Dominicana',
    ]
      .filter(Boolean)
      .join(', ');
    params.set('q', address);
  }

  return `https://www.waze.com/ul?${params.toString()}`;
}
