/**
 * A simple web component that shows a place icon for the following kinds of places:
 *  - accommodation
 *  - food
 *  - landmark
 *  - visit
 *  - experience
 *  - event
 *  - transit
 */
class PlaceIcon extends HTMLElement {
  static get observedAttributes() {
    return ['kind'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'kind' && oldValue !== newValue) {
      this.render();
    }
  }

  get kind() {
    return this.getAttribute('kind') || 'visit';
  }

  set kind(value) {
    this.setAttribute('kind', value);
  }

  render() {
    const iconMap = {
      accommodation: '🏨',
      food: '🍽️',
      landmark: '🗿',
      visit: '🏛️',
      experience: '🎭',
      event: '📅',
      transit: '🚆'
    };

    const icon = iconMap[this.kind] || '📍';

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
      <span class="icon" title="${this.kind}">${icon}</span>
    `;
  }
}

customElements.define('place-icon', PlaceIcon);
