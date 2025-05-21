/**
 * A simple web component that shows a weather icon for the following weather types:
 *  - sunny
 *  - partly_cloudy
 *  - cloudy
 *  - foggy
 *  - light_rain
 *  - moderate_rain
 *  - heavy_rain
 *  - stormy
 *  - thunderstorm
 *  - light_snow
 *  - moderate_snow
 *  - heavy_snow
 *  - hail
 *  - windy
 */
class WeatherIcon extends HTMLElement {
  static get observedAttributes() {
    return ["condition"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "condition" && oldValue !== newValue) {
      this.render();
    }
  }

  get condition() {
    return this.getAttribute("condition") || "sunny";
  }

  set condition(value) {
    this.setAttribute("condition", value);
  }

  render() {
    const iconMap = {
      sunny: "☀️",
      partly_cloudy: "⛅",
      cloudy: "☁️",
      foggy: "🌫️",
      light_rain: "🌦️",
      moderate_rain: "🌧️",
      heavy_rain: "🌧️",
      stormy: "⛈️",
      thunderstorm: "⛈️",
      light_snow: "🌨️",
      moderate_snow: "❄️",
      heavy_snow: "❄️",
      hail: "🌨️",
      windy: "🌬️",
    };

    const icon = iconMap[this.condition] || "❓";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          line-height: 1;
        }
        .icon {
          font-size: 1.2em;
        }
      </style>
      <span class="icon" title="${this.condition.replace(
        "_",
        " "
      )}">${icon}</span>
    `;
  }
}

customElements.define("weather-icon", WeatherIcon);
