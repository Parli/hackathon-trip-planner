/**
 * A card web component that presents a city
 * Takes in the data defined as a stay from the research.js JSON schema object
 */
import "./weather-icon.js";

class CityCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._stay = null;
    this.render();
  }

  get stay() {
    return this._stay;
  }

  set stay(value) {
    this._stay = value;
    this.render();
  }

  _formatTime(timestamp) {
    if (!timestamp) return "TBD";
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  _formatDate(timestamp) {
    if (!timestamp) return "TBD";
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  _getDuration() {
    if (!this._stay || !this._stay.arrival_time || !this._stay.departure_time) {
      return "Duration: TBD";
    }

    const arrivalDate = new Date(this._stay.arrival_time * 1000);
    const departureDate = new Date(this._stay.departure_time * 1000);
    const diffTime = Math.abs(departureDate - arrivalDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return `Duration: ${diffDays} day${diffDays !== 1 ? "s" : ""}`;
  }

  _getWeatherSummary() {
    if (!this._stay || !this._stay.weather || this._stay.weather.length === 0) {
      return null;
    }

    // Just use the first weather item for simplicity
    return this._stay.weather[0];
  }

  render() {
    if (!this._stay) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            padding: 0.5rem;
          }
        </style>
        <div>No city data available</div>
      `;
      return;
    }

    const { destination, description, arrival_time, departure_time } =
      this._stay;
    const cityName = destination.city || "";
    const countryName = destination.country || "";
    const weatherSummary = this._getWeatherSummary();
    const placeholderImage = "/images/no-image.jpg";

    // Get up to 3 images
    const options = this._stay.options ?? [];
    const plans = this._stay.day_plans ?? [];
    const places = [
      ...options,
      ...plans.filter((plan) => plan.type === "plan"),
    ];
    const priority = [
      "landmark",
      "visit",
      "experience",
      "event",
      "food",
      "accomodation",
      "transit",
    ].reverse();
    const sortedPlaces = places.sort((placeA, placeB) => {
      const priorityA = priority.indexOf(placeA.kind);
      const priorityB = priority.indexOf(placeB.kind);
      return priorityB - priorityA;
    });
    const topImages = sortedPlaces.slice(0, 3).flatMap((place) => {
      const photo = place.photos?.[0];
      return photo ?? [];
    });
    if (topImages.length === 0) {
      topImages.push(placeholderImage);
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          height: 100%;
          border-radius: 8px;
          background-color: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
          transition: transform 0.3s, box-shadow 0.3s;
          margin-bottom: 1rem;
          cursor: pointer;
        }

        :host(:hover) {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .image-gallery {
          display: flex;
          width: 100%;
          height: 100px;
        }

        .image-gallery img {
          flex: 1;
          object-fit: cover;
          height: 100%;
        }

        .image-gallery img:not(:first-child) {
          margin-left: 2px;
        }

        .content {
          padding: 1rem;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }

        .title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: bold;
        }

        .subtitle {
          margin: 0;
          color: #666;
          font-size: 1rem;
        }

        .weather {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background-color: #f5f5f5;
          border-radius: 4px;
        }

        .temperature {
          font-weight: bold;
        }

        .description {
          margin: 1rem 0;
          line-height: 1.4;
        }
      </style>

      <div class="image-gallery">
        ${topImages
          .map((img) => `<img src="${img}" alt="${cityName}" />`)
          .join("")}
      </div>

      <div class="content">
        <div class="header">
          <div>
            <h2 class="title">${cityName}</h2>
            <p class="subtitle">${countryName}</p>
          </div>

          ${
            weatherSummary
              ? `
            <div class="weather">
              <weather-icon condition="${weatherSummary.condition}"></weather-icon>
              <span class="temperature">${weatherSummary.temperature}°C</span>
            </div>
          `
              : ""
          }
        </div>

        <div class="description">${description}</div>
      </div>
    `;
  }
}

customElements.define("city-card", CityCard);
