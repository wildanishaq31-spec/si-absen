import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Search, MapPin, Crosshair, Navigation, Check, Loader2, AlertCircle, Link2, Sparkles } from 'lucide-react';
import { useAttendance } from '../../contexts/AttendanceContext';

// Direktori POI Fasilitas Kesehatan & Pemerintahan Kabupaten Bondowoso
const LOCAL_POI_DATABASE = [
  {
    name: 'UPTD Puskesmas Cermee',
    keywords: ['puskesmas cermee', 'cermee', 'pkm cermee', 'suling kulon', 'puskesmas suling kulon'],
    lat: -7.780344,
    lon: 114.030344,
    address: 'Jl. Krajan II, Suling Kulon, Kec. Cermee, Kabupaten Bondowoso, Jawa Timur 68286'
  },
  {
    name: 'Puskesmas Prajekan',
    keywords: ['puskesmas prajekan', 'prajekan'],
    lat: -7.801550,
    lon: 113.987820,
    address: 'Jl. Raya Situbondo No. 45, Prajekan Lor, Kec. Prajekan, Kab. Bondowoso'
  },
  {
    name: 'Puskesmas Botolinggo',
    keywords: ['puskesmas botolinggo', 'botolinggo'],
    lat: -7.828450,
    lon: 114.028910,
    address: 'Jl. Raya Botolinggo, Kec. Botolinggo, Kab. Bondowoso'
  },
  {
    name: 'Puskesmas Klabang',
    keywords: ['puskesmas klabang', 'klabang'],
    lat: -7.854610,
    lon: 113.968140,
    address: 'Jl. Raya Klabang, Kec. Klabang, Kab. Bondowoso'
  },
  {
    name: 'Puskesmas Tapen',
    keywords: ['puskesmas tapen', 'tapen'],
    lat: -7.886320,
    lon: 113.931250,
    address: 'Jl. Raya Tapen, Kec. Tapen, Kab. Bondowoso'
  },
  {
    name: 'Puskesmas Wringin',
    keywords: ['puskesmas wringin', 'wringin'],
    lat: -7.805210,
    lon: 113.784510,
    address: 'Jl. Raya Wringin, Kec. Wringin, Kab. Bondowoso'
  },
  {
    name: 'Dinas Kesehatan Kabupaten Bondowoso',
    keywords: ['dinas kesehatan', 'dinkes', 'dinkes bondowoso'],
    lat: -7.915230,
    lon: 113.821340,
    address: 'Jl. Piere Tendean No. 1, Dabasah, Kec. Bondowoso, Kab. Bondowoso'
  },
  {
    name: 'RSUD Dr. H. Koesnadi Bondowoso',
    keywords: ['rsud koesnadi', 'rsud bondowoso', 'rumah sakit koesnadi'],
    lat: -7.917410,
    lon: 113.825630,
    address: 'Jl. Piere Tendean No. 3, Kotakulon, Kec. Bondowoso, Kab. Bondowoso'
  },
  {
    name: 'Alun-Alun Ki Ronggo Bondowoso',
    keywords: ['alun alun', 'alun-alun', 'alun alun bondowoso', 'ki ronggo'],
    lat: -7.913060,
    lon: 113.821420,
    address: 'Kotakulon, Kec. Bondowoso, Kabupaten Bondowoso, Jawa Timur'
  }
];

export function AdminLocationPickerMap({
  latitude,
  longitude,
  radiusMeters,
  locationName,
  onChange
}) {
  const { showError, showSuccess } = useAttendance();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [successInfo, setSuccessInfo] = useState('');

  const currentLat = typeof latitude === 'number' && !isNaN(latitude) ? latitude : -7.780344;
  const currentLng = typeof longitude === 'number' && !isNaN(longitude) ? longitude : 114.030344;
  const currentRadius = radiusMeters || 100;

  // Inisialisasi peta Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 17,
        zoomControl: true,
        attributionControl: false
      });

      // Google Maps Tile Layer
      L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&hl=id&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['0', '1', '2', '3'],
        keepBuffer: 6,
        updateWhenIdle: false,
        updateWhenZooming: true
      }).addTo(map);

      // Custom Draggable Pin Icon
      const pinIcon = L.divIcon({
        className: 'custom-admin-pin',
        html: `
          <div style="
            position: relative;
            transform: translate(-50%, -100%);
            display: flex;
            flex-direction: column;
            align-items: center;
          ">
            <div style="
              background: #00838F;
              color: white;
              font-weight: 800;
              font-size: 11px;
              padding: 4px 8px;
              border-radius: 6px;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              white-space: nowrap;
              border: 1.5px solid white;
              margin-bottom: 4px;
            ">
              📍 Titik Kunci Absensi
            </div>
            <div style="
              width: 32px;
              height: 32px;
              background: #00838F;
              border: 3px solid #FFFFFF;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 4px 12px rgba(0, 131, 143, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
            </div>
          </div>
        `,
        iconSize: [32, 40],
        iconAnchor: [16, 40]
      });

      // 1. Draggable Marker
      const marker = L.marker([currentLat, currentLng], {
        icon: pinIcon,
        draggable: true,
        zIndexOffset: 1000
      }).addTo(map);

      // 2. Geofence Radius Circle
      const circle = L.circle([currentLat, currentLng], {
        color: '#00838F',
        fillColor: '#26C6DA',
        fillOpacity: 0.3,
        radius: currentRadius,
        weight: 2
      }).addTo(map);

      // Event saat marker digeser (dragend)
      marker.on('dragend', (e) => {
        const newPos = e.target.getLatLng();
        circle.setLatLng(newPos);
        setSuccessInfo(`Titik koordinat diperbarui: ${newPos.lat.toFixed(6)}, ${newPos.lng.toFixed(6)}`);
        if (onChange) {
          onChange({
            latitude: parseFloat(newPos.lat.toFixed(6)),
            longitude: parseFloat(newPos.lng.toFixed(6))
          });
        }
      });

      // Event saat peta diklik (click to place marker)
      map.on('click', (e) => {
        const newPos = e.latlng;
        marker.setLatLng(newPos);
        circle.setLatLng(newPos);
        setSuccessInfo(`Titik dikunci pada klik peta: ${newPos.lat.toFixed(6)}, ${newPos.lng.toFixed(6)}`);
        if (onChange) {
          onChange({
            latitude: parseFloat(newPos.lat.toFixed(6)),
            longitude: parseFloat(newPos.lng.toFixed(6))
          });
        }
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
    } else {
      const map = mapInstanceRef.current;
      if (markerRef.current) {
        markerRef.current.setLatLng([currentLat, currentLng]);
      }
      if (circleRef.current) {
        circleRef.current.setLatLng([currentLat, currentLng]);
        circleRef.current.setRadius(currentRadius);
      }
    }

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

  }, [currentLat, currentLng, currentRadius]);

  // Fungsi Parser Google Maps URL / Raw Coordinates
  const parseGoogleMapsLinkOrCoords = (input) => {
    if (!input) return null;

    // 1. Check Google Maps URL with @lat,lng (e.g. google.com/maps/place/.../@-7.7803437,114.0303438,179m/...)
    const atMatch = input.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
    if (atMatch) {
      let placeName = locationName;
      const placeMatch = input.match(/\/place\/([^/@]+)/);
      if (placeMatch) {
        placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      }
      return {
        name: placeName,
        lat: parseFloat(atMatch[1]),
        lon: parseFloat(atMatch[2]),
        address: 'Google Maps Pin Location'
      };
    }

    // 2. Check query param ?q=lat,lng or ?ll=lat,lng
    const qMatch = input.match(/[?&](?:q|ll)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
    if (qMatch) {
      return {
        name: locationName,
        lat: parseFloat(qMatch[1]),
        lon: parseFloat(qMatch[2]),
        address: 'Google Maps Coordinates'
      };
    }

    // 3. Check plain coordinate format (e.g. -7.7803437, 114.0303438)
    const plainMatch = input.match(/(-?\d{1,2}\.\d+)[,\s]+(-?\d{2,3}\.\d+)/);
    if (plainMatch) {
      return {
        name: locationName,
        lat: parseFloat(plainMatch[1]),
        lon: parseFloat(plainMatch[2]),
        address: 'Koordinat Manual'
      };
    }

    return null;
  };

  // Fungsi Cari Lokasi Multi-Engine (Local POI Database + Photon Komoot + OSM Nominatim + Gmaps URL)
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchError('');
    setSuccessInfo('');
    setSearchResults([]);

    const cleanQuery = searchQuery.trim().toLowerCase();

    // 1. Cek apakah user menempelkan Link Google Maps atau Koordinat Angka
    const parsedLink = parseGoogleMapsLinkOrCoords(searchQuery);
    if (parsedLink) {
      handleSelectLocation({
        name: parsedLink.name,
        display_name: parsedLink.address,
        lat: parsedLink.lat,
        lon: parsedLink.lon
      });
      setSuccessInfo(`Berhasil mengekstrak koordinat dari link/angka: ${parsedLink.lat}, ${parsedLink.lon}`);
      setSearching(false);
      return;
    }

    const matchedResults = [];

    // 2. Cari dari Database POI Lokal Bondowoso & Puskesmas (100% Akurat & Cepat)
    for (const poi of LOCAL_POI_DATABASE) {
      const isMatch = poi.keywords.some(k => cleanQuery.includes(k) || k.includes(cleanQuery)) ||
                      poi.name.toLowerCase().includes(cleanQuery);
      if (isMatch) {
        matchedResults.push({
          name: poi.name,
          display_name: poi.address,
          lat: poi.lat,
          lon: poi.lon,
          isLocalPoi: true
        });
      }
    }

    // 3. Jika belum cukup, query ke Photon Komoot Geocoder (Mendukung typo/fuzzy dan POI)
    try {
      const photonRes = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&lat=-7.85&lon=114.0&limit=5`
      );
      const photonData = await photonRes.json();
      if (photonData?.features?.length > 0) {
        for (const feat of photonData.features) {
          const props = feat.properties;
          const [lon, lat] = feat.geometry.coordinates;
          const addrParts = [props.name, props.street, props.city || props.district, props.state, props.country].filter(Boolean);
          matchedResults.push({
            name: props.name || searchQuery,
            display_name: addrParts.join(', '),
            lat: lat,
            lon: lon
          });
        }
      }
    } catch (err) {
      console.warn('Photon geocoding error:', err);
    }

    // 4. Query ke OpenStreetMap Nominatim dengan prioritas Indonesia
    try {
      const osmRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&countrycodes=id&limit=5&addressdetails=1`
      );
      const osmData = await osmRes.json();
      if (osmData && osmData.length > 0) {
        for (const item of osmData) {
          // Cegah duplikat koordinat
          const exists = matchedResults.some(r => Math.abs(r.lat - parseFloat(item.lat)) < 0.0001 && Math.abs(r.lon - parseFloat(item.lon)) < 0.0001);
          if (!exists) {
            matchedResults.push({
              name: item.name || item.display_name.split(',')[0],
              display_name: item.display_name,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon)
            });
          }
        }
      }
    } catch (err) {
      console.warn('OSM Nominatim error:', err);
    }

    // 5. Evaluasi Hasil
    if (matchedResults.length > 0) {
      // Jika tepat 1 hasil (misal UPTD Puskesmas Cermee), langsung pilih & kunci otomatis!
      if (matchedResults.length === 1) {
        handleSelectLocation(matchedResults[0]);
      } else {
        setSearchResults(matchedResults);
      }
    } else {
      setSearchError(`Lokasi "${searchQuery}" tidak ditemukan. Anda dapat menempelkan link Google Maps, koordinat (contoh: -7.780344, 114.030344), atau mengklik langsung pada peta.`);
    }

    setSearching(false);
  };

  // Pilih salah satu hasil pencarian
  const handleSelectLocation = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const name = item.name || item.display_name.split(',')[0] || locationName;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 18, { animate: true, duration: 1 });
      if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
      if (circleRef.current) circleRef.current.setLatLng([lat, lng]);
    }

    if (onChange) {
      onChange({
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lng.toFixed(6)),
        name: name
      });
    }

    setSearchResults([]);
    setSearchQuery(name);
    setSuccessInfo(`Lokasi terkunci pada: ${name} (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
  };

  // Quick Preset: Puskesmas Cermee (Sesuai Google Maps -7.780344, 114.030344)
  const handlePresetCermee = () => {
    const target = {
      name: 'UPTD Puskesmas Cermee',
      display_name: 'Jl. Krajan II, Suling Kulon, Kec. Cermee, Kabupaten Bondowoso, Jawa Timur 68286',
      lat: -7.780344,
      lon: 114.030344
    };
    handleSelectLocation(target);
  };

  // Quick GPS: Lokasi Saat Ini
  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) {
      showError('Browser tidak mendukung GPS Geolocation.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 18, { animate: true });
          if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
          if (circleRef.current) circleRef.current.setLatLng([lat, lng]);
        }

        if (onChange) {
          onChange({
            latitude: lat,
            longitude: lng
          });
        }
        setSuccessInfo(`Lokasi terkunci pada GPS saat ini: ${lat}, ${lng}`);
        showSuccess(`Lokasi GPS saat ini berhasil diambil: ${lat}, ${lng}`);
      },
      (err) => {
        showError('Gagal mengambil koordinat GPS: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* Search Bar Lokasi & Tempel Link Google Maps */}
      <div>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search 
              size={18} 
              style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#64748B' }} 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tempat (misal: Puskesmas Cermee) atau tempel link Google Maps..."
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.9rem',
                outline: 'none',
                backgroundColor: '#FFFFFF'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={searching}
            style={{
              backgroundColor: '#00838F',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 18px',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(0, 131, 143, 0.25)'
            }}
          >
            {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Cari di Maps
          </button>
        </form>

        {/* Quick Presets Badge */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
          <button
            type="button"
            onClick={handlePresetCermee}
            style={{
              backgroundColor: '#E0F7FA',
              color: '#00838F',
              border: '1.5px solid #80DEEA',
              borderRadius: '20px',
              padding: '5px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            🏢 Kunci ke UPTD Puskesmas Cermee
          </button>

          <button
            type="button"
            onClick={handleUseCurrentGPS}
            style={{
              backgroundColor: '#F1F5F9',
              color: '#334155',
              border: '1px solid #CBD5E1',
              borderRadius: '20px',
              padding: '5px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Crosshair size={13} color="#00838F" /> Kunci GPS Saya Saat Ini
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successInfo && (
        <div style={{
          backgroundColor: '#ECFDF5',
          border: '1px solid #A7F3D0',
          color: '#047857',
          padding: '10px 14px',
          borderRadius: '10px',
          fontSize: '0.82rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={16} color="#059669" />
          {successInfo}
        </div>
      )}

      {/* Error Message */}
      {searchError && (
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#DC2626',
          padding: '10px 14px',
          borderRadius: '10px',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          {searchError}
        </div>
      )}

      {/* Dropdown Hasil Pencarian */}
      {searchResults.length > 0 && (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #00838F',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          zIndex: 10
        }}>
          <div style={{ padding: '8px 14px', background: '#E0F7FA', color: '#00838F', fontWeight: 800, fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Pilih salah satu lokasi untuk mengunci:</span>
            <span>{searchResults.length} Ditemukan</span>
          </div>
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {searchResults.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectLocation(item)}
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid #F1F5F9',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0FDFA'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
              >
                <MapPin size={18} style={{ color: '#00838F', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {item.name}
                    {item.isLocalPoi && (
                      <span style={{ backgroundColor: '#CCFBF1', color: '#0F766E', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        Terverifikasi
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: '1.3', marginTop: '2px' }}>
                    {item.display_name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#00838F', fontWeight: 600, marginTop: '2px' }}>
                    Koordinat: {parseFloat(item.lat).toFixed(6)}, {parseFloat(item.lon).toFixed(6)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Container Peta Interaktif Leaflet */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '350px',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '2px solid #00838F',
        boxShadow: '0 4px 14px rgba(0, 131, 143, 0.15)'
      }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {/* Petunjuk Interaktif Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          right: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(4px)',
          padding: '8px 14px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: '#334155',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#00838F', display: 'inline-block' }} />
            <span>Klik peta atau geser pin 📍 untuk mengatur titik kunci kantor.</span>
          </div>
          <span style={{ color: '#00838F', fontWeight: 800 }}>
            Radius: {currentRadius}m
          </span>
        </div>
      </div>

    </div>
  );
}
