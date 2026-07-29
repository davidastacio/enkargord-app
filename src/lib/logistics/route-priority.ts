type RoutableOrder = {
  id: string;
  latitude?: unknown;
  longitude?: unknown;
  deliveryLatitude?: unknown;
  deliveryLongitude?: unknown;
  provinceName?: unknown;
  municipalityName?: unknown;
  sectorName?: unknown;
  routeOrder?: unknown;
};

export type RoutePoint = { latitude: number; longitude: number };

function coordinate(value: unknown, min: number, max: number): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

export function orderPoint(order: RoutableOrder): RoutePoint | null {
  const latitude = coordinate(order.latitude ?? order.deliveryLatitude, -90, 90);
  const longitude = coordinate(order.longitude ?? order.deliveryLongitude, -180, 180);
  return latitude === null || longitude === null ? null : { latitude, longitude };
}

function normalize(value: unknown): string {
  return String(value ?? '').trim().toLocaleLowerCase('es-DO');
}

export function distanceKm(from: RoutePoint, to: RoutePoint): number {
  const radius = 6371;
  const lat1 = from.latitude * Math.PI / 180;
  const lat2 = to.latitude * Math.PI / 180;
  const deltaLat = (to.latitude - from.latitude) * Math.PI / 180;
  const deltaLng = (to.longitude - from.longitude) * Math.PI / 180;
  const value =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function localityScore(current: RoutableOrder | null, candidate: RoutableOrder): number {
  if (!current) return Number(candidate.routeOrder ?? 9999);
  if (
    normalize(current.sectorName) &&
    normalize(current.sectorName) === normalize(candidate.sectorName) &&
    normalize(current.municipalityName) === normalize(candidate.municipalityName)
  ) return 0;
  if (
    normalize(current.municipalityName) &&
    normalize(current.municipalityName) === normalize(candidate.municipalityName)
  ) return 1000;
  if (
    normalize(current.provinceName) &&
    normalize(current.provinceName) === normalize(candidate.provinceName)
  ) return 2000;
  return 5000 + Number(candidate.routeOrder ?? 9999);
}

export function prioritizeDeliveryOrders<T extends RoutableOrder>(
  orders: T[],
  startingPoint?: RoutePoint | null,
): T[] {
  const remaining = [...orders];
  const prioritized: T[] = [];
  let point = startingPoint || null;
  let previous: T | null = null;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    remaining.forEach((candidate, index) => {
      const candidatePoint = orderPoint(candidate);
      const score = point && candidatePoint
        ? distanceKm(point, candidatePoint)
        : localityScore(previous, candidate);
      if (score < bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    const [next] = remaining.splice(bestIndex, 1);
    prioritized.push(next);
    previous = next;
    point = orderPoint(next) || point;
  }

  return prioritized;
}
