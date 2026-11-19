import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

// Custom SVG Pin Icon matching the user's screenshot
const createPinIcon = (color = '#2563EB', isDraggable = false) => {
  return L.divIcon({
    className: 'ls-leaflet-marker',
    html: `
      <div style="position: relative; width: 34px; height: 44px; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.4)); cursor: ${isDraggable ? 'grab' : 'pointer'};">
        <svg width="34" height="44" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.16344 0 0 7.16344 0 16C0 27.5 16 42 16 42C16 42 32 27.5 32 16C32 7.16344 24.8366 0 16 0Z" fill="${color}"/>
          <path d="M16 1C7.71573 1 1 7.71573 1 16C1 26.8 16 40.5 16 40.5C16 40.5 31 26.8 31 16C31 7.71573 24.2843 1 16 1Z" stroke="#1D4ED8" stroke-width="0.8"/>
          <circle cx="16" cy="16" r="6" fill="#FFFFFF"/>
        </svg>
      </div>
    `,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -40],
  });
};

const userLocationIcon = L.divIcon({
  className: 'ls-leaflet-user-marker',
  html: `
    <div style="position: relative; width: 22px; height: 22px;">
      <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background-color: rgba(16, 185, 129, 0.35); animation: pulse 1.8s infinite;"></div>
      <div style="position: absolute; top: 4px; left: 4px; width: 14px; height: 14px; border-radius: 50%; background-color: #10b981; border: 2.5px solid #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.3);"></div>
    </div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
});

// Haversine formula to calculate distance in km
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

export const LeafletMapPicker = ({
  initialLat = 53.5511, // Default Hamburg, Germany matching screenshot
  initialLng = 9.9937,
  initialZoom = 10,
  locationName = 'Hamburg, Germany',
  isAdmin = false,
  onLocationChange,
  value,
  onChange,
  height = '380px',
  allowUserSelect = false,
  showInfoCard = true,
  accentColor = '#2563eb',
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const userMarkerRef = useRef(null);

  const [currentLat, setCurrentLat] = useState(
    value?.lat !== undefined ? value.lat : initialLat
  );
  const [currentLng, setCurrentLng] = useState(
    value?.lng !== undefined ? value.lng : initialLng
  );
  const [currentZoom, setCurrentZoom] = useState(
    value?.zoom !== undefined ? value.zoom : initialZoom
  );
  const [currentLabel, setCurrentLabel] = useState(
    value?.locationName || locationName || 'Hamburg, Germany'
  );

  const [userLocation, setUserLocation] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: currentZoom,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false, // Prevent page scroll interference
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors | <a href="https://leafletjs.com" target="_blank" rel="noreferrer">Leaflet</a> &#127482;&#127462;',
    }).addTo(map);

    // Add the primary marker set by admin
    const marker = L.marker([currentLat, currentLng], {
      icon: createPinIcon('#2563EB', isAdmin),
      draggable: isAdmin,
    }).addTo(map);

    const popupContent = `
      <div style="font-family: inherit; font-size: 13px; min-width: 170px; padding: 2px;">
        <strong style="color: #0f172a; font-size: 13.5px; display: block; margin-bottom: 3px;">
          ${currentLabel}
        </strong>
        <div style="color: #64748b; font-size: 12px; margin-bottom: 6px;">
          Lat: ${currentLat.toFixed(5)}<br/>Lng: ${currentLng.toFixed(5)}
        </div>
        <div style="font-size: 11px; color: #2563eb; font-weight: 600;">
          📍 Location set by admin
        </div>
      </div>
    `;
    marker.bindPopup(popupContent);

    // If admin is dragging the marker
    if (isAdmin) {
      marker.on('dragend', (e) => {
        const newPos = e.target.getLatLng();
        const updatedLat = Number(newPos.lat.toFixed(5));
        const updatedLng = Number(newPos.lng.toFixed(5));
        setCurrentLat(updatedLat);
        setCurrentLng(updatedLng);
        if (onLocationChange) {
          onLocationChange({
            lat: updatedLat,
            lng: updatedLng,
            zoom: map.getZoom(),
            locationName: currentLabel,
          });
        }
      });

      // Admin can click on the map to reposition pin
      map.on('click', (e) => {
        const updatedLat = Number(e.latlng.lat.toFixed(5));
        const updatedLng = Number(e.latlng.lng.toFixed(5));
        marker.setLatLng([updatedLat, updatedLng]);
        setCurrentLat(updatedLat);
        setCurrentLng(updatedLng);
        if (onLocationChange) {
          onLocationChange({
            lat: updatedLat,
            lng: updatedLng,
            zoom: map.getZoom(),
            locationName: currentLabel,
          });
        }
      });
    }

    // If survey respondent is allowed to click to select their location
    if (!isAdmin && allowUserSelect) {
      map.on('click', (e) => {
        const updatedLat = Number(e.latlng.lat.toFixed(5));
        const updatedLng = Number(e.latlng.lng.toFixed(5));
        marker.setLatLng([updatedLat, updatedLng]);
        setCurrentLat(updatedLat);
        setCurrentLng(updatedLng);
        if (onChange) {
          onChange({
            lat: updatedLat,
            lng: updatedLng,
            adminLat: initialLat,
            adminLng: initialLng,
            locationName: currentLabel,
            userSelected: true,
          });
        }
      });
    }

    // Save map references
    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Trigger invalidateSize after render to ensure seamless tiles
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      userMarkerRef.current = null;
    };
  }, []);

  // Update marker position if props change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      if (initialLat !== currentLat || initialLng !== currentLng) {
        setCurrentLat(initialLat);
        setCurrentLng(initialLng);
        markerRef.current.setLatLng([initialLat, initialLng]);
        mapInstanceRef.current.setView([initialLat, initialLng], initialZoom);
      }
    }
  }, [initialLat, initialLng, initialZoom]);

  // Update popup label if label changes
  useEffect(() => {
    if (markerRef.current) {
      const popupContent = `
        <div style="font-family: inherit; font-size: 13px; min-width: 170px; padding: 2px;">
          <strong style="color: #0f172a; font-size: 13.5px; display: block; margin-bottom: 3px;">
            ${currentLabel}
          </strong>
          <div style="color: #64748b; font-size: 12px; margin-bottom: 6px;">
            Lat: ${currentLat.toFixed(5)}<br/>Lng: ${currentLng.toFixed(5)}
          </div>
          <div style="font-size: 11px; color: #2563eb; font-weight: 600;">
            📍 Location set by admin
          </div>
        </div>
      `;
      markerRef.current.setPopupContent(popupContent);
    }
  }, [currentLabel, currentLat, currentLng]);

  // Handle Respondent detecting their own location & calculating distance to pin
  const handleDetectUserLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const uLat = Number(pos.coords.latitude.toFixed(5));
        const uLng = Number(pos.coords.longitude.toFixed(5));
        setUserLocation({ lat: uLat, lng: uLng });

        const dist = calculateDistanceKm(uLat, uLng, currentLat, currentLng);
        setDistanceKm(dist);

        if (mapInstanceRef.current) {
          // Add or update respondent marker
          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([uLat, uLng]);
          } else {
            const uMarker = L.marker([uLat, uLng], {
              icon: userLocationIcon,
            }).addTo(mapInstanceRef.current);
            uMarker.bindPopup('<strong>Your Current Location</strong>');
            userMarkerRef.current = uMarker;
          }

          // Fit bounds to show both admin pin and user pin
          const bounds = L.latLngBounds([
            [currentLat, currentLng],
            [uLat, uLng],
          ]);
          mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
        }

        if (onChange) {
          onChange({
            adminLocation: {
              lat: currentLat,
              lng: currentLng,
              name: currentLabel,
            },
            userLocation: {
              lat: uLat,
              lng: uLng,
              distanceKm: dist,
            },
            timestamp: new Date().toISOString(),
          });
        }
      },
      (err) => {
        setIsLocating(false);
        alert(err.message || 'Unable to retrieve your location.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleCopyCoordinates = () => {
    const text = `${currentLat.toFixed(5)}, ${currentLng.toFixed(5)}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCenterOnAdminPin = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([currentLat, currentLng], currentZoom);
      markerRef.current?.openPopup();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        maxWidth: '720px',
      }}
    >
      {/* Map Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: height,
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: '100%',
            zIndex: 1,
          }}
        />

        {/* Top-Right Location Floating Pill / Info Card */}
        {showInfoCard && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 1000,
              backgroundColor: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(4px)',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              padding: '8px 12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              maxWidth: '240px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                  {currentLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '2px',
                  fontSize: '14px',
                }}
                title={showDetails ? 'Hide details' : 'Show details'}
              >
                <i className={showDetails ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
              </button>
            </div>

            {showDetails && (
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '4px', fontSize: '11px', color: '#64748b' }}>
                <div>Lat: <strong>{currentLat.toFixed(5)}°</strong></div>
                <div>Lng: <strong>{currentLng.toFixed(5)}°</strong></div>
                {distanceKm !== null && (
                  <div style={{ marginTop: '3px', color: '#059669', fontWeight: 600 }}>
                    📏 {distanceKm} km from you
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bottom Left Map Action Pill */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            zIndex: 1000,
            display: 'flex',
            gap: '6px',
          }}
        >
          <button
            type="button"
            onClick={handleCenterOnAdminPin}
            style={{
              padding: '5px 10px',
              fontSize: '11.5px',
              fontWeight: 600,
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
            }}
            title="Focus on Location Pin"
          >
            <i className="ri-focus-3-line" style={{ color: '#2563eb' }} />
            Center Pin
          </button>

          <button
            type="button"
            onClick={handleCopyCoordinates}
            style={{
              padding: '5px 10px',
              fontSize: '11.5px',
              fontWeight: 600,
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
            }}
            title="Copy Latitude & Longitude"
          >
            <i className={copied ? 'ri-check-line' : 'ri-file-copy-line'} style={{ color: copied ? '#10b981' : '#64748b' }} />
            {copied ? 'Copied!' : 'Coordinates'}
          </button>
        </div>
      </div>

      {/* Location Info & Respondent Action Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '10px 14px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          fontSize: '12.5px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="ri-map-pin-2-fill" style={{ color: '#2563eb', fontSize: '18px' }} />
          <div>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{currentLabel}</span>
            <span style={{ color: '#64748b', marginLeft: '6px', fontFamily: 'monospace', fontSize: '11.5px' }}>
              ({currentLat.toFixed(5)}, {currentLng.toFixed(5)})
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* External Directions Link */}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '12px',
              color: '#2563eb',
              textDecoration: 'none',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <span>Open in Google Maps</span>
            <i className="ri-external-link-line" />
          </a>

          {/* Respondent distance button */}
          {!isAdmin && (
            <button
              type="button"
              onClick={handleDetectUserLocation}
              disabled={isLocating}
              className="ls-btn ls-btn-outline ls-btn-sm"
              style={{
                fontSize: '11.5px',
                padding: '4px 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <i className={isLocating ? 'ri-loader-4-line ri-spin' : 'ri-navigation-line'} style={{ color: '#10b981' }} />
              {isLocating ? 'Locating...' : 'Get My Distance'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
