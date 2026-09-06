import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { RefreshCw, Plus, Minus, Compass } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useAuth } from '../../contexts/AuthContext';

export function LocationRadarMap() {
  const { coords, accuracy, distance, isInRadius, gpsActive, loading, refreshLocation, officeLocation, strictLocationLock } = useGeolocation();
  const { currentUser } = useAuth();
  
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const officeCircleRef = useRef(null);
  const officeMarkerRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Default coordinate (UPTD Puskesmas Cermee, Bondowoso)
  const defaultLat = officeLocation?.latitude || -7.780344;
  const defaultLng = officeLocation?.longitude || 114.030344;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const currentLat = coords?.latitude || defaultLat;
    const currentLng = coords?.longitude || defaultLng;

    // Initialize map if not yet initialized
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 17,
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: true,
        doubleClickZoom: true
      });

      // Robust Google Maps Standard Roadmap Tiles with complete Indonesian locale & subdomains
      const googleRoadmap = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&hl=id&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['0', '1', '2', '3'],
        keepBuffer: 6,
        updateWhenIdle: false,
        updateWhenZooming: true
      });

      googleRoadmap.addTo(map);

      // 1. Office Geofence Radius Circle (Green Circle matching SIPP UI)
      const officeCircle = L.circle([defaultLat, defaultLng], {
        color: '#22C55E',
        fillColor: '#86EFAC',
        fillOpacity: 0.4,
        radius: officeLocation?.radiusMeters || 100,
        weight: 3
      }).addTo(map);

      // 2. Office Label Marker (PUSKESMAS CERMEE)
      const officeLabelIcon = L.divIcon({
        className: 'google-office-label-pin',
        html: `
          <div style="
            text-align: center;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 11px;
            font-weight: 800;
            color: #0F172A;
            line-height: 1.2;
            text-transform: uppercase;
            text-shadow: 0 1px 4px #FFFFFF, 0 0 2px #FFFFFF;
            pointer-events: none;
            white-space: nowrap;
          ">
            PUSKESMAS<br/>CERMEE
          </div>
        `,
        iconSize: [110, 30],
        iconAnchor: [55, -8]
      });

      const officeMarker = L.marker([defaultLat, defaultLng], { icon: officeLabelIcon }).addTo(map);

      // 3. User GPS Teardrop Avatar Marker (Matching SIPP Yellow Pin)
      const userTeardropIcon = L.divIcon({
        className: 'google-user-pin-custom',
        html: `
          <div class="user-teardrop-wrapper">
            <div class="user-teardrop-bubble">
              <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                <circle cx="50" cy="50" r="48" fill="#F1F5F9" />
                <circle cx="50" cy="38" r="18" fill="#64748B" />
                <path d="M 22 84 A 30 28 0 0 1 78 84 Z" fill="#64748B" />
              </svg>
            </div>
            <div class="user-teardrop-point"></div>
          </div>
        `,
        iconSize: [44, 50],
        iconAnchor: [22, 48]
      });

      const userMarker = L.marker([currentLat, currentLng], { 
        icon: userTeardropIcon,
        zIndexOffset: 1000 
      }).addTo(map);

      mapInstanceRef.current = map;
      userMarkerRef.current = userMarker;
      officeCircleRef.current = officeCircle;
      officeMarkerRef.current = officeMarker;
      setMapLoaded(true);
    } else {
      // Update existing user marker & office circle
      const map = mapInstanceRef.current;
      
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([currentLat, currentLng]);
      }

      if (officeCircleRef.current) {
        officeCircleRef.current.setLatLng([defaultLat, defaultLng]);
        officeCircleRef.current.setRadius(officeLocation?.radiusMeters || 100);
      }

      if (officeMarkerRef.current) {
        officeMarkerRef.current.setLatLng([defaultLat, defaultLng]);
      }
    }

    // Trigger invalidate size robustly to ensure map is NEVER cut off (half grey)
    const mapContainer = mapContainerRef.current;
    
    // 1. Multiple timeouts to catch any CSS transition or layout shifts
    const timeouts = [50, 200, 500, 1000].map(delay => 
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize(true);
        }
      }, delay)
    );

    // 2. ResizeObserver for absolute bulletproof container sizing
    let resizeObserver;
    if (mapContainer && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize(true);
        }
      });
      resizeObserver.observe(mapContainer);
    }

    return () => {
      timeouts.forEach(clearTimeout);
      if (resizeObserver && mapContainer) resizeObserver.disconnect();
    };

  }, [coords, officeLocation, defaultLat, defaultLng]);

  // Working Zoom In Button (+)
  const handleZoomIn = (e) => {
    e.stopPropagation();
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  // Working Zoom Out Button (-)
  const handleZoomOut = (e) => {
    e.stopPropagation();
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  // Working Compass / Center Location Button
  const handleCenterUser = async (e) => {
    if (e) e.stopPropagation();
    const newCoords = await refreshLocation();
    if (mapInstanceRef.current) {
      const targetLat = newCoords?.latitude || coords?.latitude || defaultLat;
      const targetLng = newCoords?.longitude || coords?.longitude || defaultLng;
      mapInstanceRef.current.flyTo([targetLat, targetLng], 18, {
        animate: true,
        duration: 0.8
      });
    }
  };

  // Refresh Peta Button with smooth tactile feedback and animation
  const handleRefreshBtn = async (e) => {
    if (e) e.stopPropagation();
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const newCoords = await refreshLocation();
      if (mapInstanceRef.current) {
        const targetLat = newCoords?.latitude || coords?.latitude || defaultLat;
        const targetLng = newCoords?.longitude || coords?.longitude || defaultLng;
        mapInstanceRef.current.flyTo([targetLat, targetLng], 18, { animate: true, duration: 0.8 });
      }
    } finally {
      // Keep feedback active briefly so user clearly perceives the refresh response
      setTimeout(() => {
        setIsRefreshing(false);
      }, 700);
    }
  };

  const isSpinning = isRefreshing || loading;

  return (
    <div className="map-card">
      {/* Header Lokasi Anda */}
      <div className="map-header">
        <div className="map-title">Lokasi Anda</div>
        <button 
          type="button"
          className={`btn-refresh-peta ${isSpinning ? 'is-refreshing' : ''}`}
          onClick={handleRefreshBtn} 
          disabled={isSpinning}
          title="Perbarui Koordinat GPS"
        >
          <span>Refresh Peta</span>
          <RefreshCw size={13} className={`refresh-icon ${isSpinning ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Interactive Google Maps Body Container */}
      <div className="map-card-body-wrapper">
        {/* Real Interactive Leaflet + Google Maps Tile Map */}
        <div 
          ref={mapContainerRef} 
          style={{ width: '100%', height: '100%', zIndex: 1 }} 
        />

        {/* 🟢 GPS Aktif Status Badge (Top-Left) */}
        <div className="sipp-gps-active-pill">
          <span 
            className="gps-green-dot" 
            style={{ 
              backgroundColor: !strictLocationLock ? '#3B82F6' : (isInRadius ? '#22C55E' : '#F59E0B') 
            }} 
          />
          <span className="gps-pill-text">
            {gpsActive 
              ? (!strictLocationLock 
                  ? `Bebas Lokasi (GPS: ${distance}m)` 
                  : (isInRadius ? `GPS Aktif (${distance}m dari Kantor)` : `GPS Aktif (Di Luar Radius: ${distance}m)`))
              : 'Mencari GPS...'}
          </span>
        </div>

        {/* Real Functioning Right Controls (Compass & Zoom Buttons) */}
        <div className="sipp-map-controls-group">
          {/* Target Compass Button -> Center to User Location */}
          <button 
            type="button"
            className="sipp-compass-radar-circle" 
            onClick={handleCenterUser} 
            title="Pusatkan ke Lokasi Saya"
          >
            <Compass size={24} color="#00838F" />
          </button>

          {/* Zoom Buttons (+ / -) -> Real Interactive Zoom */}
          <div className="sipp-zoom-pill">
            <button 
              type="button"
              className="sipp-zoom-button" 
              title="Perbesar Peta (+)" 
              onClick={handleZoomIn}
            >
              <Plus size={20} />
            </button>
            <div className="zoom-split-line" />
            <button 
              type="button"
              className="sipp-zoom-button" 
              title="Perkecil Peta (-)" 
              onClick={handleZoomOut}
            >
              <Minus size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
