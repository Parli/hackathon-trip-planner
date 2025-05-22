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
    this._handleDeleteClick = this._handleDeleteClick.bind(this);
    this.render();
  }
  
  connectedCallback() {
    this.shadowRoot.addEventListener('click', this._handleDeleteClick);
  }
  
  disconnectedCallback() {
    this.shadowRoot.removeEventListener('click', this._handleDeleteClick);
  }

  get plan() {
    return this._plan;
  }

  set plan(value) {
    this._plan = value;
    this.render();
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

        .container {
          display: flex;
          align-items: flex-start;
          position: relative;
        }

        .content {
          flex-grow: 1;
          margin-right: 1rem;
        }
        
        .delete-button {
          position: absolute;
          top: 5px;
          right: 5px;
          background-color: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.2rem 0.4rem;
          cursor: pointer;
          font-size: 0.7rem;
          transition: background-color 0.2s;
        }
        
        .delete-button:hover {
          background-color: #d32f2f;
        }

        .header {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .time {
          font-weight: bold;
          margin-right: 0.5rem;
          white-space: nowrap;
          font-size: 0.9rem;
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
          margin-top: 0.5rem;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .image {
          width: 100px;
          height: 100px;
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
      </style>

      <div class="date">${this._formatDate(start_time)}</div>

      <div class="container">
        <div class="content">
          <div class="header">
            <div class="time">${this._formatTime(
              start_time
            )} - ${this._formatTime(end_time)}</div>
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

        <img class="image" src="${placeholderImage}" alt="${location.name}">
        <button class="delete-button" data-action="delete-plan">Delete</button>
      </div>
    `;
  }
  
  /**
   * Handle clicks on the delete button
   * @param {Event} event The click event
   */
  _handleDeleteClick(event) {
    const target = event.target;
    
    if (target.dataset.action === 'delete-plan') {
      // Dispatch a plan-delete event with the plan data
      this.dispatchEvent(
        new CustomEvent("plan-delete", {
          detail: {
            plan: this._plan
          },
          bubbles: true,
          composed: true,
        })
      );
    }
  }
}

customElements.define("plan-item", PlanItem);
