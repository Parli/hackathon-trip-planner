/**
 * A web component that presents a weather event item
 * Takes in the data defined as Weather from the research.js JSON schema object
 */
import './weather-icon.js';

class WeatherItem extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._weather = null;
    this.render();
  }

  get weather() {
    return this._weather;
  }

  set weather(value) {
    this._weather = value;
    this.render();
  }

  _formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  _formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }

  render() {
    if (!this._weather) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            padding: 0.5rem;
          }
        </style>
        <div>No weather data available</div>
      `;
      return;
    }

    const { condition, temperature, start_time, end_time } = this._weather;
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          align-items: center;
          padding: 0.5rem;
          border-radius: 4px;
          background-color: #f5f5f5;
          margin-bottom: 0.5rem;
        }
        
        .icon {
          margin-right: 0.5rem;
        }
        
        .details {
          flex-grow: 1;
        }
        
        .temperature {
          font-size: 1.1rem;
          font-weight: bold;
        }
        
        .time {
          font-size: 0.9rem;
          color: #666;
        }
      </style>
      
      <div class="icon">
        <weather-icon condition="${condition}"></weather-icon>
      </div>
      
      <div class="details">
        <div class="temperature">${temperature}°C</div>
        <div class="time">${this._formatDate(start_time)}, ${this._formatTime(start_time)} - ${this._formatTime(end_time)}</div>
      </div>
    `;
  }
}

customElements.define('weather-item', WeatherItem);
