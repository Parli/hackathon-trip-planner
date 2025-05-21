/**
 * A web component that presents a transportation item
 * Should show a title in the format of:
 * "<transit-icon/>  11:00am Los Angeles International Airport → Austin-Bergstrom International Airport 2:30pm"
 * Takes in the data defined as Transportation from the research.js JSON schema object
 */
import './transit-icon.js';

class TransportationItem extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._transportation = null;
    this.render();
  }

  get transportation() {
    return this._transportation;
  }

  set transportation(value) {
    this._transportation = value;
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
    if (!this._transportation) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            padding: 0.5rem;
          }
        </style>
        <div>No transportation data available</div>
      `;
      return;
    }

    const { mode, departure, arrival, start_time, end_time } = this._transportation;
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 1rem;
          border-radius: 8px;
          background-color: #f5f5f5;
          margin-bottom: 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .header {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .icon {
          margin-right: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          background-color: #e0e0e0;
          border-radius: 50%;
        }
        
        .title {
          font-weight: bold;
          flex-grow: 1;
        }
        
        .content {
          display: flex;
          align-items: center;
          padding-left: 2.5rem;
        }
        
        .time {
          font-weight: bold;
          margin-right: 0.5rem;
        }
        
        .location {
          flex-grow: 1;
        }
        
        .arrow {
          margin: 0 0.5rem;
          color: #666;
        }
        
        .date {
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 0.5rem;
          padding-left: 2.5rem;
        }
      </style>
      
      <div class="header">
        <div class="icon">
          <transit-icon mode="${mode}"></transit-icon>
        </div>
        <div class="title">${mode.charAt(0).toUpperCase() + mode.slice(1)} Journey</div>
      </div>
      
      <div class="date">${this._formatDate(start_time)}</div>
      
      <div class="content">
        <div class="time">${this._formatTime(start_time)}</div>
        <div class="location">${departure ? departure.name : 'Departure'}</div>
      </div>
      
      <div class="content">
        <div class="arrow">↓</div>
      </div>
      
      <div class="content">
        <div class="time">${this._formatTime(end_time)}</div>
        <div class="location">${arrival ? arrival.name : 'Arrival'}</div>
      </div>
    `;
  }
}

customElements.define('transportation-item', TransportationItem);
