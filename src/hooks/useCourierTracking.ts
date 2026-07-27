"use client";

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  saveSupabaseCourierLocation,
  updateSupabaseTrackingStatus,
} from '@/lib/supabase/tracking';

// Configurable constants
const LOCATION_UPDATE_INTERVAL_MS = 15000;
const LOCATION_MIN_DISTANCE_METERS = 20;
const MAX_ACCEPTABLE_ACCURACY_METERS = 100;     // 100 meters

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function useCourierTracking(courierIdOverride?: string) {
  const { profile } = useAuth() as any;
  const courierId =
    courierIdOverride ||
    profile?.courierId ||
    (profile?.role === 'Admin' ? profile?.uid : '');
  const [trackingStatus, setTrackingStatus] = useState<"inactive" | "active" | "paused">("inactive");
  const [lastLocation, setLastLocation] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastSavedLocationRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);

  // Stop tracking when component unmounts
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Update tracking status in Supabase
  const updateTrackingStatus = async (
    status: "inactive" | "active" | "paused",
    additionalFields: Record<string, any> = {}
  ) => {
    if (!courierId) return;

    try {
      await updateSupabaseTrackingStatus(courierId, status);
    } catch (e) {
      console.error("Error updating tracking status in Supabase:", e);
    }
  };

  // 1. SEND MANUAL POSITION (Puntual)
  const sendManualLocation = async (orderId?: string): Promise<{ success: boolean; msg: string }> => {
    if (!courierId) {
      return { success: false, msg: "No se identificó el perfil del motorista" };
    }

    if (!navigator.geolocation) {
      return { success: false, msg: "Tu navegador no soporta geolocalización" };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          if (accuracy > MAX_ACCEPTABLE_ACCURACY_METERS) {
            resolve({ success: false, msg: "No pudimos obtener una ubicación precisa" });
            return;
          }

          try {
            const now = new Date().toISOString();
            await saveSupabaseCourierLocation({
              courierId,
              courierUid: profile.uid,
              latitude,
              longitude,
              accuracy,
              heading: position.coords.heading || null,
              speed: position.coords.speed || null,
              trackingStatus: trackingStatus === "paused" ? "paused" : "active",
              updatedAt: now,
            });

            resolve({ success: true, msg: "Ubicación enviada correctamente" });
          } catch (error) {
            console.error(error);
            resolve({ success: false, msg: "Error al guardar ubicación en base de datos" });
          }
        },
        (error) => {
          let msg = "Activa el GPS e inténtalo nuevamente";
          if (error.code === error.PERMISSION_DENIED) {
            msg = "Debes permitir el acceso a tu ubicación";
          }
          resolve({ success: false, msg });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  // 2. LIVE TRACKING START
  const startTracking = async () => {
    if (!courierId) return;
    if (!navigator.geolocation) {
      setErrorMsg("Geolocalización no disponible");
      return;
    }

    if (watchIdRef.current !== null) return;
    setErrorMsg(null);

    const onWatchSuccess = async (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy, heading, speed } = position.coords;
      const now = Date.now();

      // Check accuracy
      if (accuracy > MAX_ACCEPTABLE_ACCURACY_METERS) return;

      setTrackingStatus("active");
      setErrorMsg(null);

      const lastSaved = lastSavedLocationRef.current;
      let shouldSave = false;

      if (!lastSaved) {
        shouldSave = true;
      } else {
        const timeDiff = now - lastSaved.timestamp;
        const distance = getDistanceMeters(lastSaved.lat, lastSaved.lng, latitude, longitude);

        // Rule: Save only if 30s elapsed OR distance > 50 meters
        if (timeDiff >= LOCATION_UPDATE_INTERVAL_MS || distance >= LOCATION_MIN_DISTANCE_METERS) {
          shouldSave = true;
        }
      }

      setLastLocation({
        latitude,
        longitude,
        accuracy,
        heading,
        speed,
        updatedAt: new Date().toISOString()
      });

      if (shouldSave) {
        lastSavedLocationRef.current = { lat: latitude, lng: longitude, timestamp: now };
        
        try {
          const nowStr = new Date().toISOString();
          await saveSupabaseCourierLocation({
            courierId,
            courierUid: profile.uid,
            latitude,
            longitude,
            accuracy,
            heading: heading || null,
            speed: speed || null,
            trackingStatus: "active",
            updatedAt: nowStr,
          });
        } catch (e) {
          console.error("Error saving automatic tracking snapshot:", e);
        }
      }
    };

    const onWatchError = (error: GeolocationPositionError) => {
      let msg = "Error de GPS desconocido";
      if (error.code === error.PERMISSION_DENIED) {
        msg = "Debes permitir el acceso a tu ubicación";
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setTrackingStatus("inactive");
      void updateTrackingStatus("inactive");
      setErrorMsg(msg);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      onWatchSuccess,
      onWatchError,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // 3. LIVE TRACKING PAUSE
  const pauseTracking = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTrackingStatus("paused");
    await updateTrackingStatus("paused");
  };

  // 4. LIVE TRACKING RESUME
  const resumeTracking = async () => {
    await startTracking();
  };

  // 5. LIVE TRACKING STOP
  const stopTracking = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    lastSavedLocationRef.current = null;
    setTrackingStatus("inactive");
    await updateTrackingStatus("inactive");
  };

  return {
    trackingStatus,
    lastLocation,
    errorMsg,
    sendManualLocation,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking
  };
}
