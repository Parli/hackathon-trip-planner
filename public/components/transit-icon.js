/**
 * A simple web component that shows a transportation icon for the following modes of transit:
 *  - plane
 *  - train
 *  - bus
 *  - car
 *  - taxi
 *  - bike
 *  - boat
 *  - ferry
 *  - subway
 *  - tram
 *  - walk
 */
class TransitIcon extends HTMLElement {
  static get observedAttributes() {
    return ["mode"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "mode" && oldValue !== newValue) {
      this.render();
    }
  }

  get mode() {
    return this.getAttribute("mode") || "walk";
  }

  set mode(value) {
    this.setAttribute("mode", value);
  }

  render() {
    const iconMap = {
      plane: "✈️",
      train: "🚆",
      bus: "🚌",
      car: "🚗",
      taxi: "🚕",
      bike: "🚲",
      boat: "⛵",
      ferry: "🛥️",
      subway: "🚇",
      tram: "🚊",
      walk: "🚶",
    };

    const icon = iconMap[this.mode] || "🚶";

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
      <span class="icon" title="${this.mode}">${icon}</span>
    `;
  }
}

customElements.define("transit-icon", TransitIcon);
