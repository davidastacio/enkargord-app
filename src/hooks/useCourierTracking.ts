"use client";

import { useState, useRef, useEffect } from 'react';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';

// Configurable constants
const LOCATION_UPDATE_INTERVAL_MS = 30000;      // 30 seconds
const LOCATION_MIN_DISTANCE_METERS = 50;        // 50 meters
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

export function useCourierTracking() {
  const { profile } = useAuth() as any;
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

  // Update tracking status in Firestore couriers/{courierId}
  const updateFirestoreStatus = async (
    status: "inactive" | "active" | "paused",
    additionalFields: Record<string, any> = {}
  ) => {
    if (!profile?.courierId) return;

    try {
      const now = new Date().toISOString();
      const payload: Record<string, any> = {
        trackingStatus: status,
        updatedAt: now
      };

      if (status === "active") {
        payload.trackingStartedAt = now;
      } else if (status === "paused") {
        payload.trackingPausedAt = now;
      } else if (status === "inactive") {
        payload.trackingEndedAt = now;
      }

      await updateDoc(doc(db, 'couriers', profile.courierId), {
        ...payload,
        ...additionalFields
      });
    } catch (e) {
      console.error("Error updating tracking status in Firestore:", e);
    }
  };

  // 1. SEND MANUAL POSITION (Puntual)
  const sendManualLocation = async (orderId?: string): Promise<{ success: boolean; msg: string }> => {
    if (!profile?.courierId) {
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
            const locationSnapshot = {
              courierId: profile.courierId,
              courierUid: profile.uid,
              orderId: orderId || null,
              latitude,
              longitude,
              accuracy,
              heading: position.coords.heading || null,
              speed: position.coords.speed || null,
              source: "manual",
              createdAt: now
            };

            // Write snapshot
            await addDoc(collection(db, 'courier_locations'), locationSnapshot);

            // Update last location on courier profile
            await updateDoc(doc(db, 'couriers', profile.courierId), {
              lastLocation: {
                latitude,
                longitude,
                accuracy,
                updatedAt: now
              }
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
    if (!profile?.courierId) return;
    if (!navigator.geolocation) {
      setErrorMsg("Geolocalización no disponible");
      return;
    }

    setErrorMsg(null);
    setTrackingStatus("active");
    await updateFirestoreStatus("active");

    const onWatchSuccess = async (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy, heading, speed } = position.coords;
      const now = Date.now();

      // Check accuracy
      if (accuracy > MAX_ACCEPTABLE_ACCURACY_METERS) return;

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
          const locationSnapshot = {
            courierId: profile.courierId,
            courierUid: profile.uid,
            latitude,
            longitude,
            accuracy,
            heading: heading || null,
            speed: speed || null,
            source: "automatic",
            createdAt: nowStr
          };

          // Save snapshot to history
          await addDoc(collection(db, 'courier_locations'), locationSnapshot);

          // Update real-time courier coords
          await updateDoc(doc(db, 'couriers', profile.courierId), {
            lastLocation: {
              latitude,
              longitude,
              accuracy,
              heading: heading || null,
              speed: speed || null,
              updatedAt: nowStr
            }
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
    await updateFirestoreStatus("paused");
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
    await updateFirestoreStatus("inactive");
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
