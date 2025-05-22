/**
 * A web component that displays a map for a stay with pins for options and plans
 * Uses OpenStreetMap to show locations of places in the stay
 * The map should be zoomed to contain all pins with buffer room
 */
import Leaflet from "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm";

class StayMap extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._stay = null;
    this._map = null;
    this._markers = [];
    this.render();
  }

  connectedCallback() {
    // Initialize the map when the component is connected to the DOM
    if (this._stay) {
      this._initMap();
    }
  }

  disconnectedCallback() {
    // Clean up if needed
    if (this._map) {
      this._map.remove();
      this._map = null;
    }
  }

  get stay() {
    return this._stay;
  }

  set stay(value) {
    this._stay = value;
    this.render();

    // Initialize map after rendering if the component is connected to DOM
    if (this.isConnected) {
      this._initMap();
    }
  }

  /**
   * Collect all locations from the stay (options and plans)
   * @returns {Array} Array of location objects with coordinates
   * @private
   */
  _getAllLocations() {
    if (!this._stay) return [];

    const locations = [];

    // Add options
    if (this._stay.options && this._stay.options.length > 0) {
      this._stay.options.forEach((option) => {
        if (
          option.coordinates &&
          option.coordinates.latitude &&
          option.coordinates.longitude
        ) {
          locations.push({
            type: "option",
            name: option.name,
            kind: option.kind || "place",
            coordinates: option.coordinates,
            item: option,
          });
        }
      });
    }

    // Add day plans
    if (this._stay.day_plans && this._stay.day_plans.length > 0) {
      this._stay.day_plans.forEach((plan) => {
        if (
          plan.kind === "plan" &&
          plan.location &&
          plan.location.coordinates &&
          plan.location.coordinates.latitude &&
          plan.location.coordinates.longitude
        ) {
          locations.push({
            type: "plan",
            name: plan.location.name,
            kind: plan.location.kind || "place",
            coordinates: plan.location.coordinates,
            startTime: plan.start_time,
            endTime: plan.end_time,
            item: plan,
          });
        }
      });
    }

    return locations;
  }

  /**
   * Calculate the bounding box for all locations
   * @param {Array} locations Array of location objects with coordinates
   * @returns {Object} Bounding box with min/max lat/lng values
   * @private
   */
  _calculateBoundingBox(locations) {
    if (!locations || locations.length === 0) {
      // Default to destination coordinates if available
      if (
        this._stay &&
        this._stay.destination &&
        this._stay.destination.coordinates &&
        this._stay.destination.coordinates.latitude &&
        this._stay.destination.coordinates.longitude
      ) {
        const lat = this._stay.destination.coordinates.latitude;
        const lng = this._stay.destination.coordinates.longitude;
        return {
          minLat: lat - 0.05, // Increased buffer (approximately 5km)
          maxLat: lat + 0.05,
          minLng: lng - 0.05,
          maxLng: lng + 0.05,
        };
      }

      // Fallback to a default location (will be adjusted by city name)
      return {
        minLat: 0,
        maxLat: 0,
        minLng: 0,
        maxLng: 0,
      };
    }

    // Calculate bounds based on all locations
    const bounds = {
      minLat: Infinity,
      maxLat: -Infinity,
      minLng: Infinity,
      maxLng: -Infinity,
    };

    locations.forEach((location) => {
      const lat = location.coordinates.latitude;
      const lng = location.coordinates.longitude;

      bounds.minLat = Math.min(bounds.minLat, lat);
      bounds.maxLat = Math.max(bounds.maxLat, lat);
      bounds.minLng = Math.min(bounds.minLng, lng);
      bounds.maxLng = Math.max(bounds.maxLng, lng);
    });

    // Add buffer (about 20% of the range, with a minimum buffer of 0.02 degrees)
    const latRange = bounds.maxLat - bounds.minLat;
    const lngRange = bounds.maxLng - bounds.minLng;
    
    // If there's only one point or points are very close, ensure a minimum buffer
    const latBuffer = Math.max(latRange * 0.2, 0.02);
    const lngBuffer = Math.max(lngRange * 0.2, 0.02);

    return {
      minLat: bounds.minLat - latBuffer,
      maxLat: bounds.maxLat + latBuffer,
      minLng: bounds.minLng - lngBuffer,
      maxLng: bounds.maxLng + lngBuffer,
    };
  }

  /**
   * Initialize the map with locations from the stay
   * @private
   */
  _initMap() {
    if (!this._stay) return;

    // Clear previous map if it exists
    if (this._map) {
      this._map.remove();
      this._map = null;
      this._markers = [];
    }

    const mapContainer = this.shadowRoot.getElementById("map");
    if (!mapContainer) return;

    // Get all locations and calculate bounding box
    const locations = this._getAllLocations();
    const bounds = this._calculateBoundingBox(locations);

    // Center point (middle of bounding box)
    let centerLat, centerLng;

    if (bounds.minLat === Infinity) {
      // If no locations with coordinates, try to geocode the city name
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        this._stay.destination.city
      )},${encodeURIComponent(this._stay.destination.country)}`;

      fetch(geocodeUrl)
        .then((response) => response.json())
        .then((data) => {
          if (data && data.length > 0) {
            centerLat = parseFloat(data[0].lat);
            centerLng = parseFloat(data[0].lon);

            // Create custom bounds around the city coordinates for better zoom
            const cityBounds = {
              minLat: centerLat - 0.05, // Increased buffer (approximately 5km)
              maxLat: centerLat + 0.05,
              minLng: centerLng - 0.05,
              maxLng: centerLng + 0.05,
            };

            // Create the map with the city coordinates and bounds
            this._createMap(centerLat, centerLng, 13, cityBounds);
          } else {
            // Fallback to a default location with a reasonable zoom
            console.warn(
              "No geocoding results found for:",
              this._stay.destination.city
            );
            this._createMap(0, 0, 3);
          }
        })
        .catch((error) => {
          console.error("Error geocoding city:", error);
          this._createMap(0, 0, 3);
        });
    } else {
      // Use calculated bounds
      centerLat = (bounds.minLat + bounds.maxLat) / 2;
      centerLng = (bounds.minLng + bounds.maxLng) / 2;

      // Create the map and add markers
      this._createMap(centerLat, centerLng, 13, bounds);
    }
  }

  /**
   * Create the map with the given center and zoom
   * @param {number} lat Center latitude
   * @param {number} lng Center longitude
   * @param {number} zoom Initial zoom level
   * @param {Object} bounds Optional bounds to fit
   * @private
   */
  _createMap(lat, lng, zoom, bounds = null) {
    const mapContainer = this.shadowRoot.getElementById("map");
    if (!mapContainer) return;

    // Create the map with a higher default zoom
    this._map = Leaflet.map(mapContainer, {
      minZoom: 2,
      maxZoom: 18,
    }).setView([lat, lng], zoom);

    // Add the OpenStreetMap tile layer
    Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this._map);

    // Add markers for all locations
    this._addMarkers();

    // Fit bounds if provided with padding to ensure markers are visible
    if (bounds) {
      this._map.fitBounds(
        [
          [bounds.minLat, bounds.minLng],
          [bounds.maxLat, bounds.maxLng],
        ],
        {
          padding: [100, 100], // Increased padding around the bounds
          maxZoom: 14, // Reduced max zoom to show more context
        }
      );
      
      // Force map to recalculate size to ensure proper fit
      setTimeout(() => {
        this._map.invalidateSize();
        // Re-fit bounds after invalidation to ensure proper display
        this._map.fitBounds(
          [
            [bounds.minLat, bounds.minLng],
            [bounds.maxLat, bounds.maxLng],
          ],
          {
            padding: [100, 100],
            maxZoom: 14,
          }
        );
      }, 100);
    } else {
      // If no bounds provided but we have a center, ensure we're at a reasonable zoom level
      this._map.setZoom(12); // Slightly wider city-level zoom
    }
  }

  /**
   * Add markers for all locations
   * @private
   */
  _addMarkers() {
    if (!this._map || !this._stay) return;

    const locations = this._getAllLocations();

    // Add markers for all locations
    locations.forEach((location) => {
      const marker = Leaflet.marker(
        [location.coordinates.latitude, location.coordinates.longitude],
        {
          icon: this._createIcon(location.type, location.kind),
        }
      ).addTo(this._map);

      // Get the place object from the location
      const place = location.item;

      // Create basic popup content
      let popupContent = `<b>${location.name}</b>`;

      // Add time and date if it's a planned activity
      let timeInfo = "";
      if (location.type === "plan" && location.startTime && location.endTime) {
        const startDate = new Date(location.startTime * 1000);
        const endDate = new Date(location.endTime * 1000);

        timeInfo = `
          <div class="popup-time">
            <p>Time: ${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}</p>
            <p>Date: ${startDate.toLocaleDateString()}</p>
          </div>
        `;
      }

      // Check if the place has photos and include the first one
      if (place && place.photos && place.photos.length > 0) {
        const photo = place.photos[0];
        popupContent = `
          <div class="popup-content">
            ${
              photo
                ? `
                <div class="popup-image-container">
                  <img src="${photo}" alt="${location.name}" class="popup-image">
                </div>`
                : ""
            }
            <div class="popup-info">
              <h3>${location.name}</h3>
              ${
                place.description
                  ? `<p class="popup-description">${place.description.substring(
                      0,
                      100
                    )}${place.description.length > 100 ? "..." : ""}</p>`
                  : ""
              }
              ${timeInfo}
            </div>
          </div>
        `;
      } else {
        // No photo available
        popupContent = `
          <div class="popup-content">
            <div class="popup-info">
              <h3>${location.name}</h3>
              ${
                place && place.description
                  ? `<p class="popup-description">${place.description.substring(
                      0,
                      100
                    )}${place.description.length > 100 ? "..." : ""}</p>`
                  : ""
              }
              ${timeInfo}
            </div>
          </div>
        `;
      }

      marker.bindPopup(popupContent, { maxWidth: 300 });
      this._markers.push(marker);
    });
  }

  /**
   * Create a custom icon for the marker type
   * @param {string} type Type of location ('option', 'plan')
   * @param {string} kind Kind of place ('food', 'activity', etc.)
   * @returns {L.Icon} Leaflet icon object
   * @private
   */
  _createIcon(type, kind = "") {
    // Default icon
    let iconUrl =
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png";

    // Different colors for different types
    if (type === "plan") {
      iconUrl =
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png";
    } else if (type === "option") {
      if (kind === "food") {
        iconUrl =
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png";
      } else {
        iconUrl =
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png";
      }
    }

    return Leaflet.icon({
      iconUrl: iconUrl,
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
        }

        .map-container {
          width: 100%;
          height: 100%;
          min-height: 500px;
          border-radius: 0; /* Remove border radius for modal */
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        #map {
          width: 100%;
          flex: 1; /* Take up all available space */
          min-height: 500px;
        }

        .legend {
          background: white;
          padding: 10px;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          margin-top: 10px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          margin-bottom: 5px;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 5px;
        }

        .legend-text {
          font-size: 0.8rem;
        }

        .plan-color { background-color: #0a0; }
        .food-color { background-color: #f80; }
        .option-color { background-color: #cc0; }

        /* Popup styles */
        .popup-content {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 280px;
        }

        .popup-image-container {
          width: 100%;
          height: 160px;
          overflow: hidden;
          border-radius: 4px;
          margin-bottom: 4px;
        }

        .popup-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 4px;
        }

        .popup-info h3 {
          margin: 0 0 6px;
          font-size: 16px;
          font-weight: bold;
        }

        .popup-info p {
          margin: 0 0 6px;
          font-size: 14px;
          color: #333;
        }

        .popup-description {
          font-style: italic;
          color: #666;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .popup-time {
          font-size: 12px;
          margin-top: 6px;
          color: #555;
        }

        .popup-time p {
          margin: 0 0 3px;
          font-size: 12px;
        }

        /* Leaflet styles */
        .leaflet-pane,
        .leaflet-tile,
        .leaflet-marker-icon,
        .leaflet-marker-shadow,
        .leaflet-tile-container,
        .leaflet-pane > svg,
        .leaflet-pane > canvas,
        .leaflet-zoom-box,
        .leaflet-image-layer,
        .leaflet-layer {
          position: absolute;
          left: 0;
          top: 0;
        }
        .leaflet-container {
          overflow: hidden;
        }
        .leaflet-tile,
        .leaflet-marker-icon,
        .leaflet-marker-shadow {
          -webkit-user-select: none;
          -moz-user-select: none;
          user-select: none;
          -webkit-user-drag: none;
        }
        .leaflet-tile::selection {
          background: transparent;
        }
        .leaflet-safari .leaflet-tile {
          image-rendering: -webkit-optimize-contrast;
        }
        .leaflet-safari .leaflet-tile-container {
          width: 1600px;
          height: 1600px;
          -webkit-transform-origin: 0 0;
        }
        .leaflet-marker-icon,
        .leaflet-marker-shadow {
          display: block;
        }
        .leaflet-container .leaflet-overlay-pane svg,
        .leaflet-container .leaflet-marker-pane img,
        .leaflet-container .leaflet-shadow-pane img,
        .leaflet-container .leaflet-tile-pane img,
        .leaflet-container img.leaflet-image-layer,
        .leaflet-container .leaflet-tile {
          max-width: none !important;
          max-height: none !important;
          width: auto;
          padding: 0;
        }
        .leaflet-container img.leaflet-tile {
          mix-blend-mode: plus-lighter;
        }
        .leaflet-container.leaflet-touch-zoom {
          -ms-touch-action: pan-x pan-y;
          touch-action: pan-x pan-y;
        }
        .leaflet-container.leaflet-touch-drag {
          -ms-touch-action: pinch-zoom;
          touch-action: none;
          touch-action: pinch-zoom;
        }
        .leaflet-container.leaflet-touch-drag.leaflet-touch-zoom {
          -ms-touch-action: none;
          touch-action: none;
        }
        .leaflet-container {
          -webkit-tap-highlight-color: transparent;
        }
        .leaflet-container a {
          -webkit-tap-highlight-color: rgba(51, 181, 229, 0.4);
        }
        .leaflet-tile {
          filter: inherit;
          visibility: hidden;
        }
        .leaflet-tile-loaded {
          visibility: inherit;
        }
        .leaflet-zoom-box {
          width: 0;
          height: 0;
          -moz-box-sizing: border-box;
          box-sizing: border-box;
          z-index: 800;
        }
        .leaflet-overlay-pane svg {
          -moz-user-select: none;
        }
        .leaflet-pane {
          z-index: 400;
        }
        .leaflet-tile-pane {
          z-index: 200;
        }
        .leaflet-overlay-pane {
          z-index: 400;
        }
        .leaflet-shadow-pane {
          z-index: 500;
        }
        .leaflet-marker-pane {
          z-index: 600;
        }
        .leaflet-tooltip-pane {
          z-index: 650;
        }
        .leaflet-popup-pane {
          z-index: 700;
        }
        .leaflet-map-pane canvas {
          z-index: 100;
        }
        .leaflet-map-pane svg {
          z-index: 200;
        }
        .leaflet-vml-shape {
          width: 1px;
          height: 1px;
        }
        .lvml {
          behavior: url(#default#VML);
          display: inline-block;
          position: absolute;
        }
        .leaflet-control {
          position: relative;
          z-index: 800;
          pointer-events: visiblePainted;
          pointer-events: auto;
        }
        .leaflet-top,
        .leaflet-bottom {
          position: absolute;
          z-index: 1000;
          pointer-events: none;
        }
        .leaflet-top {
          top: 0;
        }
        .leaflet-right {
          right: 0;
        }
        .leaflet-bottom {
          bottom: 0;
        }
        .leaflet-left {
          left: 0;
        }
        .leaflet-control {
          float: left;
          clear: both;
        }
        .leaflet-right .leaflet-control {
          float: right;
        }
        .leaflet-top .leaflet-control {
          margin-top: 10px;
        }
        .leaflet-bottom .leaflet-control {
          margin-bottom: 10px;
        }
        .leaflet-left .leaflet-control {
          margin-left: 10px;
        }
        .leaflet-right .leaflet-control {
          margin-right: 10px;
        }
        .leaflet-fade-anim .leaflet-popup {
          opacity: 0;
          -webkit-transition: opacity 0.2s linear;
          -moz-transition: opacity 0.2s linear;
          transition: opacity 0.2s linear;
        }
        .leaflet-fade-anim .leaflet-map-pane .leaflet-popup {
          opacity: 1;
        }
        .leaflet-zoom-animated {
          -webkit-transform-origin: 0 0;
          -ms-transform-origin: 0 0;
          transform-origin: 0 0;
        }
        svg.leaflet-zoom-animated {
          will-change: transform;
        }
        .leaflet-zoom-anim .leaflet-zoom-animated {
          -webkit-transition: -webkit-transform 0.25s cubic-bezier(0, 0, 0.25, 1);
          -moz-transition: -moz-transform 0.25s cubic-bezier(0, 0, 0.25, 1);
          transition: transform 0.25s cubic-bezier(0, 0, 0.25, 1);
        }
        .leaflet-zoom-anim .leaflet-tile,
        .leaflet-pan-anim .leaflet-tile {
          -webkit-transition: none;
          -moz-transition: none;
          transition: none;
        }
        .leaflet-zoom-anim .leaflet-zoom-hide {
          visibility: hidden;
        }
        .leaflet-interactive {
          cursor: pointer;
        }
        .leaflet-grab {
          cursor: -webkit-grab;
          cursor: -moz-grab;
          cursor: grab;
        }
        .leaflet-crosshair,
        .leaflet-crosshair .leaflet-interactive {
          cursor: crosshair;
        }
        .leaflet-popup-pane,
        .leaflet-control {
          cursor: auto;
        }
        .leaflet-dragging .leaflet-grab,
        .leaflet-dragging .leaflet-grab .leaflet-interactive,
        .leaflet-dragging .leaflet-marker-draggable {
          cursor: move;
          cursor: -webkit-grabbing;
          cursor: -moz-grabbing;
          cursor: grabbing;
        }
        .leaflet-marker-icon,
        .leaflet-marker-shadow,
        .leaflet-image-layer,
        .leaflet-pane > svg path,
        .leaflet-tile-container {
          pointer-events: none;
        }
        .leaflet-marker-icon.leaflet-interactive,
        .leaflet-image-layer.leaflet-interactive,
        .leaflet-pane > svg path.leaflet-interactive,
        svg.leaflet-image-layer.leaflet-interactive path {
          pointer-events: visiblePainted;
          pointer-events: auto;
        }
        .leaflet-container {
          background: #ddd;
          outline-offset: 1px;
        }
        .leaflet-container a {
          color: #0078A8;
        }
        .leaflet-zoom-box {
          border: 2px dotted #38f;
          background: rgba(255, 255, 255, 0.5);
        }
        .leaflet-container {
          font-family: "Helvetica Neue", Arial, Helvetica, sans-serif;
          font-size: 12px;
          font-size: 0.75rem;
          line-height: 1.5;
        }
        .leaflet-bar {
          box-shadow: 0 1px 5px rgba(0, 0, 0, 0.65);
          border-radius: 4px;
        }
        .leaflet-bar a {
          background-color: #fff;
          border-bottom: 1px solid #ccc;
          width: 26px;
          height: 26px;
          line-height: 26px;
          display: block;
          text-align: center;
          text-decoration: none;
          color: black;
        }
        .leaflet-bar a,
        .leaflet-control-layers-toggle {
          background-position: 50% 50%;
          background-repeat: no-repeat;
          display: block;
        }
        .leaflet-bar a:hover,
        .leaflet-bar a:focus {
          background-color: #f4f4f4;
        }
        .leaflet-bar a:first-child {
          border-top-left-radius: 4px;
          border-top-right-radius: 4px;
        }
        .leaflet-bar a:last-child {
          border-bottom-left-radius: 4px;
          border-bottom-right-radius: 4px;
          border-bottom: none;
        }
        .leaflet-bar a.leaflet-disabled {
          cursor: default;
          background-color: #f4f4f4;
          color: #bbb;
        }
        .leaflet-touch .leaflet-bar a {
          width: 30px;
          height: 30px;
          line-height: 30px;
        }
        .leaflet-touch .leaflet-bar a:first-child {
          border-top-left-radius: 2px;
          border-top-right-radius: 2px;
        }
        .leaflet-touch .leaflet-bar a:last-child {
          border-bottom-left-radius: 2px;
          border-bottom-right-radius: 2px;
        }
        .leaflet-control-zoom-in,
        .leaflet-control-zoom-out {
          font: bold 18px 'Lucida Console', Monaco, monospace;
          text-indent: 1px;
        }
        .leaflet-touch .leaflet-control-zoom-in, .leaflet-touch .leaflet-control-zoom-out {
          font-size: 22px;
        }
        .leaflet-control-layers {
          box-shadow: 0 1px 5px rgba(0, 0, 0, 0.4);
          background: #fff;
          border-radius: 5px;
        }
        .leaflet-control-layers-toggle {
          width: 36px;
          height: 36px;
        }
        .leaflet-control-layers .leaflet-control-layers-list,
        .leaflet-control-layers-expanded .leaflet-control-layers-toggle {
          display: none;
        }
        .leaflet-control-layers-expanded .leaflet-control-layers-list {
          display: block;
          position: relative;
        }
        .leaflet-control-layers-expanded {
          padding: 6px 10px 6px 6px;
          color: #333;
          background: #fff;
        }
        .leaflet-control-layers-scrollbar {
          overflow-y: scroll;
          overflow-x: hidden;
          padding-right: 5px;
        }
        .leaflet-control-layers-selector {
          margin-top: 2px;
          position: relative;
          top: 1px;
        }
        .leaflet-control-layers label {
          display: block;
          font-size: 13px;
          font-size: 1.08333em;
        }
        .leaflet-control-layers-separator {
          height: 0;
          border-top: 1px solid #ddd;
          margin: 5px -10px 5px -6px;
        }
        .leaflet-popup {
          position: absolute;
          text-align: center;
          margin-bottom: 20px;
        }
        .leaflet-popup-content-wrapper {
          padding: 1px;
          text-align: left;
          border-radius: 12px;
        }
        .leaflet-popup-content {
          margin: 13px 24px 13px 20px;
          line-height: 1.3;
          font-size: 13px;
          min-height: 1px;
        }
        .leaflet-popup-content p {
          margin: 17px 0;
        }
        .leaflet-popup-tip-container {
          width: 40px;
          height: 20px;
          position: absolute;
          left: 50%;
          margin-top: -1px;
          margin-left: -20px;
          overflow: hidden;
          pointer-events: none;
        }
        .leaflet-popup-tip {
          width: 17px;
          height: 17px;
          padding: 1px;
          margin: -10px auto 0;
          pointer-events: auto;
          transform: rotate(45deg);
        }
        .leaflet-popup-content-wrapper,
        .leaflet-popup-tip {
          background: white;
          color: #333;
          box-shadow: 0 3px 14px rgba(0, 0, 0, 0.4);
        }
        .leaflet-container a.leaflet-popup-close-button {
          position: absolute;
          top: 0;
          right: 0;
          border: none;
          text-align: center;
          width: 24px;
          height: 24px;
          font: 16px/24px Tahoma, Verdana, sans-serif;
          color: #757575;
          text-decoration: none;
          background: transparent;
        }
        .leaflet-container a.leaflet-popup-close-button:hover,
        .leaflet-container a.leaflet-popup-close-button:focus {
          color: #585858;
        }
        .leaflet-popup-scrolled {
          overflow: auto;
        }
        .leaflet-control-attribution {
          background: rgba(255, 255, 255, 0.7);
          padding: 0 5px;
          margin: 0;
          color: #333;
        }
      </style>

      <div class="map-container">
        <div id="map"></div>
      </div>

      <div class="legend">
        <div class="legend-item">
          <div class="legend-color plan-color"></div>
          <div class="legend-text">Planned Activity</div>
        </div>
        <div class="legend-item">
          <div class="legend-color food-color"></div>
          <div class="legend-text">Food Option</div>
        </div>
        <div class="legend-item">
          <div class="legend-color option-color"></div>
          <div class="legend-text">Activity Option</div>
        </div>
      </div>
    `;
  }
}

customElements.define("stay-map", StayMap);
