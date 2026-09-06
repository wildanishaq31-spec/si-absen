import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_OFFICE_LOCATION } from '../utils/constants';
import { storageService } from '../services/storage';

/**
 * Calculates distance between 2 coordinates in meters using Haversine formula
 */
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function useGeolocation(customOfficeLocation = null) {
  const [settingsState, setSettingsState] = useState(() => storageService.getSettings());

  // Listen to local storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setSettingsState(storageService.getSettings());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const officeLocation = customOfficeLocation || {
    name: settingsState.officeName || DEFAULT_OFFICE_LOCATION.name,
    latitude: typeof settingsState.officeLatitude === 'number' ? settingsState.officeLatitude : DEFAULT_OFFICE_LOCATION.latitude,
    longitude: typeof settingsState.officeLongitude === 'number' ? settingsState.officeLongitude : DEFAULT_OFFICE_LOCATION.longitude,
    radiusMeters: typeof settingsState.officeRadiusMeters === 'number' ? settingsState.officeRadiusMeters : DEFAULT_OFFICE_LOCATION.radiusMeters
  };

  const [coords, setCoords] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [distance, setDistance] = useState(0);
  const [isInRadius, setIsInRadius] = useState(true);
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshLocation = useCallback(() => {
    return new Promise((resolve) => {
      setLoading(true);
      setGpsError(null);

      // Re-read latest settings on every refresh
      const latestSettings = storageService.getSettings();
      const currentOffice = customOfficeLocation || {
        latitude: latestSettings.officeLatitude || DEFAULT_OFFICE_LOCATION.latitude,
        longitude: latestSettings.officeLongitude || DEFAULT_OFFICE_LOCATION.longitude,
        radiusMeters: latestSettings.officeRadiusMeters || DEFAULT_OFFICE_LOCATION.radiusMeters
      };

      if (!navigator.geolocation) {
        const msg = 'Browser tidak mendukung GPS Geolocation.';
        setGpsError(msg);
        setGpsActive(false);
        setLoading(false);
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLat = parseFloat(pos.coords.latitude.toFixed(6));
          const userLng = parseFloat(pos.coords.longitude.toFixed(6));
          const acc = Math.round(pos.coords.accuracy);

          const newCoords = { latitude: userLat, longitude: userLng };
          setCoords(newCoords);
          setAccuracy(acc);
          setGpsActive(true);

          const dist = getDistanceInMeters(
            userLat,
            userLng,
            currentOffice.latitude,
            currentOffice.longitude
          );

          setDistance(dist);
          setIsInRadius(dist <= currentOffice.radiusMeters);
          setLoading(false);
          resolve(newCoords);
        },
        (err) => {
          console.warn('Geolocation fallback/error:', err);
          setGpsError('Izin GPS belum aktif atau perangkat menggunakan HTTP. Menggunakan titik default kantor.');
          const fallbackCoords = {
            latitude: currentOffice.latitude,
            longitude: currentOffice.longitude
          };
          setCoords(fallbackCoords);
          setAccuracy(acc => acc || 10);
          setDistance(0);
          setIsInRadius(true);
          setGpsActive(true);
          setLoading(false);
          resolve(fallbackCoords);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, [customOfficeLocation, officeLocation.latitude, officeLocation.longitude, officeLocation.radiusMeters]);

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  return {
    coords,
    accuracy,
    distance,
    isInRadius,
    gpsActive,
    gpsError,
    loading,
    refreshLocation,
    officeLocation,
    strictLocationLock: settingsState.strictLocationLock
  };
}
