/**
 * Real-Time Leaflet.js Tracking Script
 * Supports WebSockets, Firebase, or Geolocation watchPosition
 * Dynamically updates marker position with marker.setLatLng() and pans map with map.panTo()
 */

class RealTimeLeafletTracker {
  constructor(mapInstance, initialLatLng, options = {}) {
    this.map = mapInstance;
    this.marker = null;
    this.accuracyCircle = null;
    this.options = {
      animatePan: true,
      panDuration: 0.8,
      markerIcon: options.markerIcon || null,
      popupText: options.popupText || 'Live Marker Location',
      showAccuracyCircle: options.showAccuracyCircle !== false,
      ...options
    };

    this.initMarker(initialLatLng);
  }

  /**
   * Initialize marker on the map
   */
  initMarker(latLng) {
    if (!this.map) return;

    const markerOptions = {};
    if (this.options.markerIcon) {
      markerOptions.icon = this.options.markerIcon;
    }

    this.marker = L.marker(latLng, markerOptions).addTo(this.map);
    if (this.options.popupText) {
      this.marker.bindPopup(this.options.popupText);
    }
  }

  /**
   * Main method to dynamically update marker location and pan map smoothly
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} [accuracy] - Accuracy radius in meters
   */
  updatePosition(lat, lng, accuracy = null) {
    const newLatLng = [lat, lng];

    // 1. Dynamically update existing marker position (no map re-render)
    if (this.marker) {
      this.marker.setLatLng(newLatLng);
    } else {
      this.initMarker(newLatLng);
    }

    // 2. Smoothly pan map view to center on the new location
    if (this.map && this.options.animatePan) {
      this.map.panTo(newLatLng, {
        animate: true,
        duration: this.options.panDuration
      });
    }

    // 3. Update optional accuracy radius circle
    if (accuracy && this.options.showAccuracyCircle && this.map) {
      if (this.accuracyCircle) {
        this.accuracyCircle.setLatLng(newLatLng);
        this.accuracyCircle.setRadius(accuracy);
      } else {
        this.accuracyCircle = L.circle(newLatLng, {
          radius: accuracy,
          color: '#2563eb',
          fillColor: '#3b82f6',
          fillOpacity: 0.15,
          weight: 1
        }).addTo(this.map);
      }
    }
  }

  /**
   * Connect to WebSocket server for streaming lat/lng updates
   * Expected format from WS: { "lat": 22.3039, "lng": 70.8022, "accuracy": 15 }
   * @param {string} wsUrl - WebSocket server URL
   */
  connectWebSocket(wsUrl) {
    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[RealTimeTracker] WebSocket connected to', wsUrl);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (typeof data.lat === 'number' && typeof data.lng === 'number') {
            this.updatePosition(data.lat, data.lng, data.accuracy || null);
          }
        } catch (err) {
          console.error('[RealTimeTracker] Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('[RealTimeTracker] WebSocket error:', err);
      };

      ws.onclose = () => {
        console.warn('[RealTimeTracker] WebSocket connection closed.');
      };

      return ws;
    } catch (e) {
      console.error('[RealTimeTracker] Failed to initialize WebSocket:', e);
    }
  }

  /**
   * Connect to browser Geolocation API watchPosition
   */
  startGeolocationWatch() {
    if (!navigator.geolocation) {
      console.error('[RealTimeTracker] Geolocation API not supported');
      return null;
    }

    return navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        this.updatePosition(latitude, longitude, accuracy);
      },
      (err) => {
        console.warn('[RealTimeTracker] Geolocation watch error:', err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000
      }
    );
  }
}

// Export for ES modules and browser globals
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RealTimeLeafletTracker;
} else {
  window.RealTimeLeafletTracker = RealTimeLeafletTracker;
}
