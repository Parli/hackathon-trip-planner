/**
 * A web component that presents the plan for a single day.
 * It shows a title with the following example format:
 * "August 17th <transit-icon/> <weather-icon/> 58-65°F"
 * The transit icon is only shown if it's a transportation day to go from one place to another
 * After the title there is a list of <plan-item/>, <transportation-item/>, and <weather-item/> components
 * Takes in the data defined as a stay from the research.js JSON schema object and a date
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
    this._stay = null;
    this._date = null;
    this._handleButtonClick = this._handleButtonClick.bind(this);
    this._handleDateClick = this._handleDateClick.bind(this);
    this._handleDateChange = this._handleDateChange.bind(this);
    this.render();
  }

  connectedCallback() {
    this.shadowRoot.addEventListener("click", this._handleButtonClick);
    this.shadowRoot.addEventListener("click", this._handleDateClick);
    this._setupDatePicker();
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener("click", this._handleButtonClick);
    this.shadowRoot.removeEventListener("click", this._handleDateClick);
  }

  /**
   * Set the stay data for this day plan
   * @param {Object} stay The stay object containing day_plans and weather data
   */
  set stay(stay) {
    this._stay = stay;
    this.render();
  }

  /**
   * Get the stay data for this day plan
   * @returns {Object} The stay object
   */
  get stay() {
    return this._stay;
  }

  /**
   * Set the date for the day plan
   * @param {number} timestamp Unix timestamp in seconds
   */
  set date(timestamp) {
    this._date = timestamp;
    this.render();
    this._setupDatePicker();
  }

  /**
   * Get the date for the day plan
   * @returns {number} Unix timestamp in seconds
   */
  get date() {
    return this._date;
  }

  /**
   * Get the day start time (beginning of day) from the date
   * @returns {number} Unix timestamp in seconds for the beginning of the day
   * @private
   */
  _getStartTime() {
    if (!this._date) return null;

    const startDate = new Date(this._date * 1000);
    startDate.setHours(0, 0, 0, 0);
    return Math.floor(startDate.getTime() / 1000);
  }

  /**
   * Get the day end time (end of day) from the date
   * @returns {number} Unix timestamp in seconds for the end of the day
   * @private
   */
  _getEndTime() {
    if (!this._date) return null;

    const endDate = new Date(this._date * 1000);
    endDate.setHours(23, 59, 59, 999);
    return Math.floor(endDate.getTime() / 1000);
  }

  /**
   * Get the activities for this day from the stay
   * @returns {Array<Plan|Transportation>} Array of activities for this day
   * @private
   */
  _getActivities() {
    if (!this._stay || !this._stay.day_plans || !this._date) return [];

    const startTime = this._getStartTime();
    const endTime = this._getEndTime();

    // Filter day_plans to only include plans for this day
    return this._stay.day_plans.filter(
      (plan) => plan.start_time >= startTime && plan.start_time <= endTime
    );
  }

  /**
   * Check if there are transportation activities for this day
   * @returns {boolean} True if the day has transportation activities
   * @private
   */
  _hasTransportation() {
    const activities = this._getActivities();
    return activities.some((activity) => activity.kind === "transportation");
  }

  /**
   * Get the weather for this day from the stay
   * @returns {Weather|null} Weather object for this day or null if not available
   * @private
   */
  _getWeather() {
    if (!this._stay || !this._stay.weather || !this._date) return null;

    const startTime = this._getStartTime();
    const endTime = this._getEndTime();

    // Find the first weather object for this day
    return (
      this._stay.weather.find(
        (weather) =>
          weather.start_time >= startTime && weather.start_time <= endTime
      ) || null
    );
  }

  /**
   * Check if this day is empty (has no activities)
   * @returns {boolean} True if the day is empty
   * @private
   */
  _isEmpty() {
    // If no stay or date, consider it empty
    if (!this._stay || !this._date) return true;

    // If there are no day_plans in the stay at all, it's empty
    if (!this._stay.day_plans || this._stay.day_plans.length === 0) return true;

    // Check if there are any activities for this day
    return this._getActivities().length === 0;
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

  _getDateValue(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp * 1000);
    // Adjust for local timezone to prevent date shifts
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`; // Format as YYYY-MM-DD
  }

  _getTimestampFromDateString(dateString) {
    // Create a new date object from the date string
    // Use UTC parsing to avoid timezone issues
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return Math.floor(date.getTime() / 1000);
  }

  _setupDatePicker() {
    if (!this._date) return;

    const datePicker = this.shadowRoot.querySelector(".date-picker");

    if (datePicker) {
      datePicker.value = this._getDateValue(this._date);
      datePicker.addEventListener("change", this._handleDateChange);
    }
  }

  _handleDateClick(event) {
    // Check if the click is on the date display
    if (event.target.classList.contains("date-display")) {
      const datePicker = this.shadowRoot.querySelector(".date-picker");
      if (datePicker) {
        datePicker.showPicker();
      }
    }
  }

  _handleDateChange(event) {
    if (!this._date || !this._stay) return;

    const newDateValue = event.target.value;
    const newTimestamp = this._getTimestampFromDateString(newDateValue);

    // If the date hasn't changed, do nothing
    if (newTimestamp === this._date) return;

    // Get the beginning of the old day
    const oldDayStart = new Date(this._date * 1000);
    oldDayStart.setHours(0, 0, 0, 0);
    const oldTimestamp = Math.floor(oldDayStart.getTime() / 1000);

    // Get the beginning of the new day
    const newDayStart = new Date(newTimestamp * 1000);
    newDayStart.setHours(0, 0, 0, 0);
    const adjustedNewTimestamp = Math.floor(newDayStart.getTime() / 1000);

    // Calculate the difference in days between old and new date
    const dayDiff = Math.round((adjustedNewTimestamp - oldTimestamp) / 86400);

    // Update the date property
    this._date = adjustedNewTimestamp;

    // Dispatch a day-date-change event
    this.dispatchEvent(
      new CustomEvent("day-date-change", {
        detail: {
          oldDate: oldTimestamp,
          newDate: adjustedNewTimestamp,
          activities: this._getActivities(),
          dayDiff: dayDiff,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _getTemperatureRange() {
    const weather = this._getWeather();
    if (!weather) return "";

    return `${weather.temperature}°C`;
  }

  _sortActivities(activities) {
    return [...activities].sort((a, b) => a.start_time - b.start_time);
  }

  render() {
    if (!this._stay || !this._date) {
      this.shadowRoot.innerHTML = `
        <div>Missing stay data or date</div>
      `;
      return;
    }

    const dateDisplay = this._formatDate(this._date);
    const activities = this._getActivities();
    const sortedActivities = this._sortActivities(activities);
    const hasTransportation = this._hasTransportation();
    const weather = this._getWeather();
    const isEmpty = this._isEmpty();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: 1rem;
        }

        .header {
          display: flex;
          align-items: center;
          padding: 0 0 1rem;
          position: relative;
        }

        .date-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-right: 0.8rem;
        }

        .action-buttons {
          display: flex;
          visibility: hidden;
          margin-right: 3px;
          margin-left: -20px;
        }

        .header:hover .action-buttons {
          visibility: visible;
        }

        .day-buttons {
          display: flex;
          flex-direction: column;
        }

        .day-button {
          background-color:white;
          color: black;
          border: none;
          border-radius: 4px;
          width: 15px;
          height: 12px;
          padding: 0;
          cursor: pointer;
          font-size: 0.7rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .day-button:hover {
          background-color: #0b7dda;
          color: white;
        }

        .day-button-icon {
          pointer-events: none;
          transform: scaleY(0.6666);
        }

        .delete-button {
          background-color:rgb(230, 230, 230);
          color: black;
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          padding: 0;
          margin: 3px;
          cursor: pointer;
          font-size: 1rem;
          transition: background-color 0.2s;
        }

        .delete-button:hover {
          background-color: #d32f2f;
          color: white;
        }

        .date {
          font-size: 1.2rem;
          font-weight: bold;
          position: relative;
          cursor: pointer;
        }

        .date:hover {
          text-decoration: underline;
        }

        .date-picker {
          width: 0;
          height: 0;
          opacity: 0;
          position: absolute;
          border: none;
          background: transparent;
          padding: 0;
          margin: 0;
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
        <div class="action-buttons">
          <button class="delete-button" data-action="delete-day">×</button>
          <div class="day-buttons">
            <button class="day-button day-up-button" data-action="day-earlier" title="Move day earlier (-1 day)">
              <div class="day-button-icon">▲</div>
            </button>
            <button class="day-button day-down-button" data-action="day-later" title="Move day later (+1 day)">
              <div class="day-button-icon">▼</div>
            </button>
          </div>
        </div>
        <div class="date-section">
          <div class="date">
            <input type="date" class="date-picker" value="${this._getDateValue(
              this._date
            )}"/>
            <span class="date-display">${dateDisplay}</span>
          </div>
        </div>

        <div class="icons">
          ${
            hasTransportation
              ? '<transit-icon mode="plane"></transit-icon>'
              : ""
          }
          ${
            weather
              ? `<weather-icon condition="${weather.condition}"></weather-icon>`
              : ""
          }
        </div>

        ${
          weather
            ? `<div class="temp">${this._getTemperatureRange()}</div>`
            : ""
        }
      </div>

      <div class="activities">
        ${
          isEmpty
            ? '<div class="empty-state">Day allocated in your itinerary. Add activities above.</div>'
            : sortedActivities.length > 0
            ? sortedActivities
                .map((activity, index) => {
                  // Use both index and ID to ensure uniqueness
                  const uniqueId = `activity-${index}-${
                    activity.id || activity.start_time
                  }`;
                  if (activity.kind === "transportation") {
                    return `<transportation-item id="${uniqueId}"></transportation-item>`;
                  } else if (activity.kind === "plan") {
                    return `<plan-item id="${uniqueId}"></plan-item>`;
                  }
                  return "";
                })
                .join("")
            : '<div class="empty-state">No activities planned for this day yet</div>'
        }
      </div>
    `;

    // Set data for activity components after they're created
    sortedActivities.forEach((activity, index) => {
      const uniqueId = `activity-${index}-${
        activity.id || activity.start_time
      }`;
      const element = this.shadowRoot.getElementById(uniqueId);
      if (element) {
        if (activity.kind === "transportation") {
          element.transportation = activity;
        } else if (activity.kind === "plan") {
          element.plan = activity;
        }
      }
    });
  }

  /**
   * Handle clicks on buttons
   * @param {Event} event The click event
   */
  _handleButtonClick(event) {
    const target = event.target;
    const action = target.dataset.action;

    if (!action) return;

    if (action === "delete-day") {
      // Dispatch a day-delete event with the day's date
      this.dispatchEvent(
        new CustomEvent("day-delete", {
          detail: {
            date: this._date,
            activities: this._getActivities(),
          },
          bubbles: true,
          composed: true,
        })
      );
    } else if (action === "day-earlier" || action === "day-later") {
      // Dispatch day-move event for all days (empty or not)
      this.dispatchEvent(
        new CustomEvent("day-move", {
          detail: {
            date: this._date,
            activities: this._getActivities(),
            direction: action === "day-earlier" ? "earlier" : "later",
            isEmpty: this._isEmpty(),
          },
          bubbles: true,
          composed: true,
        })
      );
    }
  }
}

customElements.define("day-plan", DayPlan);
