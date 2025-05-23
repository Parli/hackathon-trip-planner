/**
 * A web component that presents a plan item
 * Should show a title in the format of:
 * "11:00am-1:00pm <place-icon/> Neuschwanstein Castle"
 * Under the title it should show a short description
 * An image of the place should be shown on the right side of the item
 * Takes in the data defined as a Plan from the research.js JSON schema object
 */
import "./place-icon.js";

class PlanItem extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._plan = null;
    this._handleActionClick = this._handleActionClick.bind(this);
    this._handleTimeClick = this._handleTimeClick.bind(this);
    this._handleTimeChange = this._handleTimeChange.bind(this);
    this.render();
  }

  connectedCallback() {
    this.shadowRoot.addEventListener("click", this._handleActionClick);
    this.shadowRoot.addEventListener("click", this._handleTimeClick);
    this._setupTimeInputs();
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener("click", this._handleActionClick);
    this.shadowRoot.removeEventListener("click", this._handleTimeClick);
  }

  get plan() {
    return this._plan;
  }

  set plan(value) {
    this._plan = value;
    this.render();
    this._setupTimeInputs();
  }

  _formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  _formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  _getTimeFromTimestamp(timestamp) {
    const date = new Date(timestamp * 1000);
    return `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
  }

  _getTimestampFromTimeString(timeString, referenceTimestamp) {
    const [hours, minutes] = timeString.split(":").map(Number);
    const date = new Date(referenceTimestamp * 1000);
    date.setHours(hours, minutes, 0, 0);
    return Math.floor(date.getTime() / 1000);
  }

  _setupTimeInputs() {
    if (!this._plan) return;

    const startTimeInput = this.shadowRoot.querySelector(".start-time-input");
    const endTimeInput = this.shadowRoot.querySelector(".end-time-input");

    if (startTimeInput && endTimeInput) {
      startTimeInput.value = this._getTimeFromTimestamp(this._plan.start_time);
      endTimeInput.value = this._getTimeFromTimestamp(this._plan.end_time);

      startTimeInput.addEventListener("change", this._handleTimeChange);
      endTimeInput.addEventListener("change", this._handleTimeChange);
    }
  }

  _handleTimeClick(event) {
    // Check if the click is on the time span
    if (event.target.classList.contains("time-display")) {
      const timeInput = event.target.previousElementSibling;
      if (timeInput && timeInput.type === "time") {
        timeInput.showPicker();
      }
    }
  }

  _handleTimeChange(event) {
    if (!this._plan) return;

    const input = event.target;
    const newTimeValue = input.value;
    const duration = this._plan.end_time - this._plan.start_time;

    const updatedPlan = { ...this._plan };

    if (input.classList.contains("start-time-input")) {
      const newStartTime = this._getTimestampFromTimeString(
        newTimeValue,
        this._plan.start_time
      );
      updatedPlan.start_time = newStartTime;

      // If start time is after end time, adjust end time to maintain duration
      if (newStartTime > this._plan.end_time) {
        updatedPlan.end_time = newStartTime + duration;
      }
    } else if (input.classList.contains("end-time-input")) {
      const newEndTime = this._getTimestampFromTimeString(
        newTimeValue,
        this._plan.end_time
      );
      updatedPlan.end_time = newEndTime;

      // If end time is before start time, adjust start time to maintain duration
      if (newEndTime < this._plan.start_time) {
        updatedPlan.start_time = newEndTime - duration;
      }
    }

    // Dispatch an event to update the plan
    this.dispatchEvent(
      new CustomEvent("plan-update", {
        detail: {
          oldPlan: this._plan,
          newPlan: updatedPlan,
        },
        bubbles: true,
        composed: true,
      })
    );

    // Update the local plan
    this._plan = updatedPlan;
    this.render();
  }

  render() {
    if (!this._plan) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            padding: 0.5rem;
          }
        </style>
        <div>No plan data available</div>
      `;
      return;
    }

    const { location, start_time, end_time } = this._plan;
    const placeholderImage = "/images/no-image.jpg";
    const image = this._plan.location.photos?.[0] ?? placeholderImage;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 0;
        }

        .container {
          display: flex;
          align-items: flex-start;
          position: relative;
          padding: 0.25rem 0;
          margin-left: -20px;
        }

        .content {
          flex-grow: 1;
          margin-right: 1rem;
        }

        .action-buttons {
          display: flex;
          visibility: hidden;
          margin-right: 3px;
        }

        .container:hover .action-buttons {
          visibility: visible;
        }

        .delete-button, .map-button {
          display: flex;
          align-items: center;
          justify-content: center;
          background-color:rgb(230, 230, 230);
          color: black;
          border: none;
          border-radius: 50%;
          padding: 0;
          margin: 3px;
          width: 20px;
          height: 20px;
          cursor: pointer;
          font-size: 1rem;
          transition: background-color 0.2s;
        }

        .delete-button:hover {
          background-color: #d32f2f;
          color: white;
        }

        .map-button {
          position: absolute;
          right: 0;
          top: 5px;
          font-size: 0.8rem;
        }

        .map-button:hover {
          background-color: #2196F3;
          color: white;
        }

        .move-buttons {
          display: flex;
          flex-direction: column;
        }

        .move-button {
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

        .move-button:hover {
          background-color: #0b7dda;
          color: white;
        }

        .move-button-icon {
          pointer-events: none;
          transform: scaleY(0.6666);
        }

        .header {
          display: flex;
          align-items: center;
          margin-bottom: 0.25rem;
        }

        .time {
          display: flex;
          font-weight: bold;
          margin-right: 0.5rem;
          white-space: nowrap;
          font-size: 0.9rem;
          position: relative;
        }

        .icon {
          margin-right: 0.5rem;
          display: flex;
          align-items: center;
        }

        .title {
          font-weight: bold;
          font-size: 1.1rem;
        }

        .description {
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .image {
          width: 120px;
          height: 80px;
          object-fit: cover;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .date {
          font-size: 0.8rem;
          color: #666;
          margin-bottom: 0.2rem;
        }

        .meta {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
          font-size: 0.8rem;
          color: #666;
        }

        .tag {
          background-color: #e0e0e0;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }

        .time-picker {
          width: 0;
          height: 0;
          opacity: 0;
          position: absolute;
          border: none;
          background: transparent;
          padding: 0;
          margin: 0;
        }

        .time-display {
          cursor: pointer;
        }

        .time-display:hover {
          text-decoration: underline;
        }
      </style>

      <div class="container">
        <div class="action-buttons">
          <button class="delete-button" data-action="delete-plan" title="Remove">×</button>
          <button class="map-button" data-action="show-on-map" title="Show on map">🗺️</button>
          <div class="move-buttons">
            <button class="move-button move-up-button" data-action="move-up" title="Earlier (-1hr)">
              <div class="move-button-icon">▲</div>
            </button>
            <button class="move-button move-down-button" data-action="move-down" title="Later (+1hr)">
              <div class="move-button-icon">▼</div>
            </button>
          </div>
        </div>
        <div class="content">
          <div class="header">
            <div class="time">
              <input class="time-picker start-time-input" type="time" value="${this._getTimeFromTimestamp(
                start_time
              )}"/>
              <span class="time-display">${this._formatTime(start_time)}</span>
              &nbsp;-&nbsp;
              <input class="time-picker end-time-input" type="time" value="${this._getTimeFromTimestamp(
                end_time
              )}"/>
              <span class="time-display">${this._formatTime(end_time)}</span>
              &nbsp;
            </div>
            <div class="icon">
            <place-icon kind="${location.kind}"></place-icon>
            </div>
            <div class="title">${location.name}</div>
          </div>

          <div class="description">${location.description}</div>

          <div class="meta">
            ${
              location.budget
                ? `<span class="tag">${location.budget}</span>`
                : ""
            }
            ${
              location.physical_level
                ? `<span class="tag">${location.physical_level} activity</span>`
                : ""
            }
            ${
              location.setting
                ? `<span class="tag">${location.setting}</span>`
                : ""
            }
          </div>
        </div>

        <img class="image" src="${image}" alt="${location.name}">
      </div>
    `;
  }

  /**
   * Handle clicks on the buttons
   * @param {Event} event The click event
   */
  _handleActionClick(event) {
    const target = event.target;
    const action = target.dataset.action;

    if (!action || !this._plan) return;

    if (action === "delete-plan") {
      // Dispatch a plan-delete event with the plan data
      this.dispatchEvent(
        new CustomEvent("plan-delete", {
          detail: {
            plan: this._plan,
          },
          bubbles: true,
          composed: true,
        })
      );
    } else if (action === "move-up") {
      // Dispatch a plan-move event to move the plan up
      this.dispatchEvent(
        new CustomEvent("plan-move", {
          detail: {
            plan: this._plan,
            direction: "up",
          },
          bubbles: true,
          composed: true,
        })
      );
    } else if (action === "move-down") {
      // Dispatch a plan-move event to move the plan down
      this.dispatchEvent(
        new CustomEvent("plan-move", {
          detail: {
            plan: this._plan,
            direction: "down",
          },
          bubbles: true,
          composed: true,
        })
      );
    } else if (action === "show-on-map") {
      // Dispatch an event to show this place on the map
      this.dispatchEvent(
        new CustomEvent("show-on-map", {
          detail: {
            place: this._plan.location,
          },
          bubbles: true,
          composed: true,
        })
      );
    }
  }
}

customElements.define("plan-item", PlanItem);
