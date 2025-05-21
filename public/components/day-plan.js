/**
 * A web component that presents the plan for a single day.
 * It shows a title with the following example format:
 * "August 17th <transit-icon/> <weather-icon/> 58-65°F"
 * The transit icon is only shown if it's a transportation day to go from one place to another
 * After the title there is a list of <plan-item/>, <transportation-item/>, and <weather-item/> components
 * Takes in the data defined as a stay from the research.js JSON schema object
 */
import "./weather-icon.js";
import "./transit-icon.js";
import "./plan-item.js";
import "./transportation-item.js";
import "./weather-item.js";

class DayPlan extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._date = null;
    this._activities = [];
    this._hasTransportation = false;
    this._weather = null;
    this.render();
  }

  /**
   * Set the date for the day plan
   * @param {number} timestamp Unix timestamp in seconds
   */
  set date(timestamp) {
    this._date = timestamp;
    this.render();
  }

  /**
   * Set the activities for this day
   * @param {Array<Plan|Transportation>} activities Array of Plan or Transportation objects
   */
  set activities(activities) {
    this._activities = activities || [];
    this._hasTransportation = activities.some(
      (activity) => activity.kind === "transportation"
    );
    this.render();
  }

  /**
   * Set the weather for this day
   * @param {Weather} weather Weather object
   */
  set weather(weather) {
    this._weather = weather;
    this.render();
  }

  _formatDate(timestamp) {
    if (!timestamp) return "Date TBD";
    const date = new Date(timestamp * 1000);

    // Format like "August 17th"
    const options = { month: "long", day: "numeric" };
    let formattedDate = date.toLocaleDateString("en-US", options);

    // Add ordinal suffix
    const day = date.getDate();
    const suffixes = ["th", "st", "nd", "rd"];
    const relevantDigits = day % 100 > 10 && day % 100 < 14 ? 0 : day % 10;
    formattedDate = formattedDate.replace(
      /\d+$/,
      `${day}${suffixes[relevantDigits] || suffixes[0]}`
    );

    return formattedDate;
  }

  _getTemperatureRange() {
    if (!this._weather) return "";

    return `${this._weather.temperature}°C`;
  }

  _sortActivities(activities) {
    return [...activities].sort((a, b) => a.start_time - b.start_time);
  }

  render() {
    const dateDisplay = this._formatDate(this._date);
    const sortedActivities = this._sortActivities(this._activities);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: 2rem;
        }

        .header {
          display: flex;
          align-items: center;
          padding: 0.8rem 1rem;
          background-color: #f0f0f0;
          border-radius: 8px;
          margin-bottom: 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .date {
          font-size: 1.2rem;
          font-weight: bold;
          margin-right: 0.8rem;
        }

        .icons {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-right: auto;
        }

        .temp {
          font-weight: bold;
          margin-left: 0.5rem;
        }

        .activities {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .empty-state {
          padding: 2rem;
          text-align: center;
          background-color: #f9f9f9;
          border-radius: 8px;
          color: #666;
        }
      </style>

      <div class="header">
        <div class="date">${dateDisplay}</div>

        <div class="icons">
          ${
            this._hasTransportation
              ? '<transit-icon mode="plane"></transit-icon>'
              : ""
          }
          ${
            this._weather
              ? `<weather-icon condition="${this._weather.condition}"></weather-icon>`
              : ""
          }
        </div>

        ${
          this._weather
            ? `<div class="temp">${this._getTemperatureRange()}</div>`
            : ""
        }
      </div>

      <div class="activities">
        ${
          sortedActivities.length > 0
            ? sortedActivities
                .map((activity) => {
                  if (activity.kind === "transportation") {
                    return `<transportation-item id="activity-${activity.start_time}"></transportation-item>`;
                  } else if (activity.kind === "plan") {
                    return `<plan-item id="activity-${activity.start_time}"></plan-item>`;
                  }
                  return "";
                })
                .join("")
            : '<div class="empty-state">No activities planned for this day yet</div>'
        }
      </div>
    `;

    // Set data for activity components after they're created
    sortedActivities.forEach((activity) => {
      const element = this.shadowRoot.getElementById(
        `activity-${activity.start_time}`
      );
      if (element) {
        if (activity.kind === "transportation") {
          element.transportation = activity;
        } else if (activity.kind === "plan") {
          element.plan = activity;
        }
      }
    });
  }
}

customElements.define("day-plan", DayPlan);
