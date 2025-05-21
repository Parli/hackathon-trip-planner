/**
 * A card web component that presents a place
 * Can be one of the following types:
 *  - accommodation
 *  - food
 *  - landmark
 *  - visit
 *  - experience
 *  - event
 *  - transit
 * Takes in the data defined as Place from the research.js JSON schema object
 */
import "./place-icon.js";

class PlaceCard extends HTMLElement {
  static get observedAttributes() {
    return ["interest"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._place = null;
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "interest" && oldValue !== newValue) {
      this.render();
    }
  }

  get place() {
    return this._place;
  }

  set place(value) {
    this._place = value;
    this.render();
  }

  get interest() {
    return this.getAttribute("interest") || null;
  }

  set interest(value) {
    if (value) {
      this.setAttribute("interest", value);
    } else {
      this.removeAttribute("interest");
    }
  }

  connectedCallback() {
    this.shadowRoot.addEventListener(
      "click",
      this._handleInterestClick.bind(this)
    );
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener(
      "click",
      this._handleInterestClick.bind(this)
    );
  }

  _handleInterestClick(event) {
    const target = event.target;
    if (target.classList.contains("interest-button")) {
      const interest = target.dataset.interest;
      this.interest = interest;

      // Also update the place object
      if (this._place) {
        this._place.interest_level = interest;
      }

      // Dispatch an event
      this.dispatchEvent(
        new CustomEvent("interest-change", {
          detail: {
            interest,
            place: this._place,
          },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  render() {
    if (!this._place) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 1rem;
            background: #f9f9f9;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 1rem;
            min-height: 100px;
          }
          .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
          }
        </style>
        <div class="loading">Loading place information...</div>
      `;
      return;
    }

    const {
      kind,
      name,
      category,
      description,
      photos,
      rating,
      budget,
      interest_level,
    } = this._place;

    const budgetDisplay = budget
      ? budget.charAt(0).toUpperCase() + budget.slice(1)
      : "N/A";
    const categoryDisplay = category ? category.join(", ") : "";
    const ratingDisplay = rating ? `${rating}/10` : "No rating";
    const placeholderImage = "/images/no-image.jpg";
    const imageUrl = photos && photos.length > 0 ? photos[0] : placeholderImage;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          background: #f9f9f9;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 1rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        :host(:hover) {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .image {
          width: 100%;
          height: 160px;
          object-fit: cover;
          display: block;
        }

        .content {
          padding: 1rem;
        }

        :host([interest="must_do"]) {
          border-color: #4CAF50;
          background-color: #E8F5E9;
        }

        :host([interest="interested"]) {
          border-color: #2196F3;
          background-color: #E3F2FD;
        }

        :host([interest="maybe"]) {
          border-color: #FFC107;
          background-color: #FFF8E1;
        }

        .header {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .title {
          font-size: 1.2rem;
          font-weight: bold;
          margin: 0 0 0 0.5rem;
          flex-grow: 1;
        }

        .meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          color: #666;
        }

        .description {
          margin-bottom: 1rem;
          line-height: 1.4;
        }

        .actions {
          display: flex;
          justify-content: space-between;
        }

        .interest-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .interest-button {
          padding: 0.3rem 0.6rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .interest-button:hover {
          opacity: 1;
        }

        .interest-button[data-interest="must_do"] {
          background-color: #4CAF50;
          color: white;
        }

        .interest-button[data-interest="interested"] {
          background-color: #2196F3;
          color: white;
        }

        .interest-button[data-interest="maybe"] {
          background-color: #FFC107;
          color: black;
        }

        .interest-button.active {
          opacity: 1;
          font-weight: bold;
        }
      </style>
      <img class="image" src="${imageUrl}" alt="${name}">

      <div class="content">
        <div class="header">
          <place-icon kind="${kind}"></place-icon>
          <h3 class="title">${name}</h3>
        </div>

        <div class="meta">
          <span class="category">${categoryDisplay}</span>
          <span class="rating">${ratingDisplay}</span>
          <span class="budget">${budgetDisplay}</span>
        </div>

        <div class="description">${description}</div>

        <div class="actions">
          <div class="interest-buttons">
            <button
              class="interest-button ${
                interest_level === "maybe" ? "active" : ""
              }"
              data-interest="maybe">Maybe</button>
            <button
              class="interest-button ${
                interest_level === "interested" ? "active" : ""
              }"
              data-interest="interested">Interested</button>
            <button
              class="interest-button ${
                interest_level === "must_do" ? "active" : ""
              }"
              data-interest="must_do">Must Do</button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("place-card", PlaceCard);
