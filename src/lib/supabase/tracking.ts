"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type CourierLocation = {
  courierId: string;
  courierUid: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  trackingStatus: "active" | "paused" | "inactive";
  updatedAt: string;
};

const LIVE_LOCATION_MAX_AGE_MS = 2 * 60 * 1000;

export function isLiveCourierLocation(
  location: CourierLocation | null | undefined,
  now = Date.now(),
): location is CourierLocation {
  if (!location || location.trackingStatus !== "active") return false;
  const updatedAt = Date.parse(location.updatedAt);
  return Number.isFinite(updatedAt) && now - updatedAt <= LIVE_LOCATION_MAX_AGE_MS;
}

type SaveLocation = Omit<CourierLocation, "updatedAt"> & {
  updatedAt?: string;
};

const organizationId = async () => {
  const { data, error } = await getSupabaseBrowserClient()
    .from("organizations")
    .select("id")
    .eq("slug", "enkargord")
    .single();
  if (error) throw error;
  return data.id;
};

const parseLocation = (value: unknown): [number, number] | null => {
  if (value && typeof value === "object" && "coordinates" in value) {
    const coordinates = (value as { coordinates?: unknown }).coordinates;
    if (
      Array.isArray(coordinates) &&
      coordinates.length >= 2 &&
      Number.isFinite(Number(coordinates[0])) &&
      Number.isFinite(Number(coordinates[1]))
    ) {
      return [Number(coordinates[0]), Number(coordinates[1])];
    }
  }
  if (typeof value === "string") {
    const match = value.match(/POINT\((-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)\)/i);
    if (match) return [Number(match[1]), Number(match[2])];

    // PostgREST serializes PostGIS geography points as EWKB hexadecimal.
    if (/^[0-9a-f]+$/i.test(value) && value.length >= 42) {
      try {
        const bytes = new Uint8Array(value.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)));
        const view = new DataView(bytes.buffer);
        const littleEndian = view.getUint8(0) === 1;
        const geometryType = view.getUint32(1, littleEndian);
        if ((geometryType & 0xff) !== 1) return null;
        const coordinateOffset = (geometryType & 0x20000000) !== 0 ? 9 : 5;
        const longitude = view.getFloat64(coordinateOffset, littleEndian);
        const latitude = view.getFloat64(coordinateOffset + 8, littleEndian);
        if (
          Number.isFinite(longitude) &&
          Number.isFinite(latitude) &&
          longitude >= -180 &&
          longitude <= 180 &&
          latitude >= -90 &&
          latitude <= 90
        ) {
          return [longitude, latitude];
        }
      } catch {
        return null;
      }
    }
  }
  return null;
};

export async function saveSupabaseCourierLocation(
  location: SaveLocation,
): Promise<void> {
  const { error } = await getSupabaseBrowserClient()
    .from("courier_locations")
    .upsert(
      {
        courier_id: location.courierId,
        organization_id: await organizationId(),
        courier_uid: location.courierUid,
        location: `POINT(${location.longitude} ${location.latitude})`,
        heading: location.heading,
        speed: location.speed,
        accuracy: location.accuracy,
        tracking_status: location.trackingStatus,
        updated_at: location.updatedAt || new Date().toISOString(),
      },
      { onConflict: "courier_id" },
    );
  if (error) throw error;
}

export async function updateSupabaseTrackingStatus(
  courierId: string,
  status: CourierLocation["trackingStatus"],
): Promise<void> {
  const { error } = await getSupabaseBrowserClient()
    .from("courier_locations")
    .update({ tracking_status: status, updated_at: new Date().toISOString() })
    .eq("courier_id", courierId);
  if (error) throw error;
}

export async function getSupabaseCourierLocation(
  courierId: string,
): Promise<CourierLocation | null> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("courier_locations")
    .select("*")
    .eq("courier_id", courierId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const coordinates = parseLocation(data.location);
  if (!coordinates) return null;
  return {
    courierId: data.courier_id,
    courierUid: data.courier_uid,
    longitude: coordinates[0],
    latitude: coordinates[1],
    accuracy: data.accuracy == null ? null : Number(data.accuracy),
    heading: data.heading == null ? null : Number(data.heading),
    speed: data.speed == null ? null : Number(data.speed),
    trackingStatus: data.tracking_status,
    updatedAt: data.updated_at,
  };
}

export async function listSupabaseCourierLocations(): Promise<CourierLocation[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("courier_locations")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).flatMap((row) => {
    const coordinates = parseLocation(row.location);
    if (!coordinates) return [];
    return [{
      courierId: row.courier_id,
      courierUid: row.courier_uid,
      longitude: coordinates[0],
      latitude: coordinates[1],
      accuracy: row.accuracy == null ? null : Number(row.accuracy),
      heading: row.heading == null ? null : Number(row.heading),
      speed: row.speed == null ? null : Number(row.speed),
      trackingStatus: row.tracking_status,
      updatedAt: row.updated_at,
    } satisfies CourierLocation];
  });
}

export function subscribeSupabaseCourierLocations(
  onData: (locations: CourierLocation[]) => void,
  onError?: (error: Error) => void,
) {
  const supabase = getSupabaseBrowserClient();
  let active = true;
  const refresh = async () => {
    try {
      const locations = await listSupabaseCourierLocations();
      if (active) onData(locations);
    } catch (error) {
      if (active && onError) {
        onError(error instanceof Error ? error : new Error("LOCATIONS_READ_FAILED"));
      }
    }
  };
  void refresh();
  const channel = supabase
    .channel(`courier-locations-${crypto.randomUUID()}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "courier_locations" },
      () => void refresh(),
    )
    .subscribe();
  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}

export function subscribeSupabaseCourierLocation(
  courierId: string,
  onData: (location: CourierLocation | null) => void,
  onError?: (error: Error) => void,
) {
  const supabase = getSupabaseBrowserClient();
  let active = true;
  const refresh = async () => {
    try {
      const location = await getSupabaseCourierLocation(courierId);
      if (active) onData(location);
    } catch (error) {
      if (active && onError) {
        onError(error instanceof Error ? error : new Error("LOCATION_READ_FAILED"));
      }
    }
  };
  void refresh();
  const channel = supabase
    .channel(`courier-location-${courierId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "courier_locations",
        filter: `courier_id=eq.${courierId}`,
      },
      () => void refresh(),
    )
    .subscribe();
  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}
