/**
 * A web component that presents a list of stays for an entire trip
 * Should show a large title for the trip name
 * Underneath that it should show a subtitle for the trip dates
 * After the header it should show a list of <stay-itinerary/> components
 * Takes in the data defined as a trip from the research.js JSON schema object
 */
import "./stay-itinerary.js";

class TripItinerary extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._trip = null;
    this.render();
  }

  get trip() {
    return this._trip;
  }

  set trip(value) {
    this._trip = value;
    this.render();
  }

  _formatDate(travelDate) {
    if (!travelDate) return "TBD";

    const { year, month, day } = travelDate;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  _getDateRange() {
    if (!this._trip || !this._trip.timeline) return "";

    const { start_date, end_date } = this._trip.timeline;
    return `${this._formatDate(start_date)} - ${this._formatDate(end_date)}`;
  }

  _getStayTimestamp(stay) {
    // First check if the stay has an arrival_time
    if (stay.arrival_time) {
      return stay.arrival_time;
    }
    
    // If no arrival_time, check day plans
    if (stay.day_plans && stay.day_plans.length > 0) {
      // Find the earliest start_time among all day plans
      return stay.day_plans.reduce((earliest, plan) => {
        // Convert to start of day for consistency
        const planDate = new Date(plan.start_time * 1000);
        planDate.setHours(0, 0, 0, 0);
        const dayTimestamp = planDate.getTime() / 1000;
        
        return dayTimestamp < earliest ? dayTimestamp : earliest;
      }, Infinity);
    }
    
    // If neither arrival_time nor day_plans, return Infinity to sort to the end
    return Infinity;
  }
  
  _getSortedStays(stays) {
    if (!stays || stays.length === 0) {
      return [];
    }
    
    // Create a copy with timestamp for sorting
    const staysWithDates = stays.map(stay => ({
      stay,
      timestamp: this._getStayTimestamp(stay)
    }));
    
    // Sort by timestamp (stays with no timestamp will be at the end)
    staysWithDates.sort((a, b) => a.timestamp - b.timestamp);
    
    // Return just the sorted stays
    return staysWithDates.map(item => item.stay);
  }

  render() {
    if (!this._trip) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            padding: 1rem;
          }
        </style>
        <div>No trip data available</div>
      `;
      return;
    }

    const { title, stays } = this._trip;
    const sortedStays = this._getSortedStays(stays);
    const dateRange = this._getDateRange();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: Arial, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .header {
          text-align: center;
          margin-bottom: 3rem;
          padding-bottom: 2rem;
          border-bottom: 3px solid #f0f0f0;
        }

        .title {
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
          color: #333;
        }

        .subtitle {
          font-size: 1.2rem;
          color: #666;
        }

        .stays {
          display: flex;
          flex-direction: column;
          gap: 3rem;
        }

        .separator {
          display: flex;
          align-items: center;
          margin: 1rem 0;
          color: #999;
          font-style: italic;
        }

        .separator::before,
        .separator::after {
          content: "";
          flex: 1;
          border-bottom: 1px dashed #ccc;
          margin: 0 1rem;
        }

        .empty-state {
          padding: 3rem;
          text-align: center;
          background-color: #f9f9f9;
          border-radius: 8px;
          color: #666;
        }
      </style>

      <div class="header">
        <h1 class="title">${title}</h1>
        <div class="subtitle">${dateRange}</div>
      </div>

      <div class="stays">
        ${
          sortedStays && sortedStays.length > 0
            ? sortedStays
                .map(
                  (stay, index) => `
            ${
              index > 0
                ? `<div class="separator">Traveling to next destination</div>`
                : ""
            }
            <stay-itinerary id="stay-${index}"></stay-itinerary>
          `
                )
                .join("")
            : '<div class="empty-state">No stays planned for this trip yet</div>'
        }
      </div>
    `;

    // Set data for stay itineraries after they're created
    if (sortedStays && sortedStays.length > 0) {
      sortedStays.forEach((stay, index) => {
        const element = this.shadowRoot.getElementById(`stay-${index}`);
        if (element) {
          element.stay = stay;
        }
      });
    }
  }
}

customElements.define("trip-itinerary", TripItinerary);
