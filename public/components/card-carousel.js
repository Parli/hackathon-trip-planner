/**
 * A web component that presents a horizontal scrollable carousel of cards.
 * Takes in an array of elements that will be displayed as cards in the carousel.
 * Provides navigation controls for scrolling through the cards.
 */
class CardCarousel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._cards = [];
    this._currentIndex = 0;
    this.render();
  }

  /**
   * Set the cards for the carousel
   * @param {Array<HTMLElement>} cards Array of HTMLElements to display as cards
   */
  set cards(cards) {
    this._cards = cards || [];
    this.render();
    this._setupEventListeners();
  }

  /**
   * Get the currently displayed cards
   * @returns {Array<HTMLElement>} The array of cards in the carousel
   */
  get cards() {
    return this._cards;
  }

  /**
   * Add a single card to the carousel
   * @param {HTMLElement} card HTMLElement to add to the carousel
   */
  addCard(card) {
    this._cards.push(card);
    this.render();
    this._setupEventListeners();
  }

  /**
   * Move to the next set of cards
   */
  next() {
    const container = this.shadowRoot.querySelector(".carousel-container");
    const cardWidth = this.shadowRoot.querySelector(".carousel-card")?.offsetWidth || 300;
    const visibleCards = Math.floor(container.offsetWidth / cardWidth);
    
    if (this._currentIndex < this._cards.length - visibleCards) {
      this._currentIndex++;
      this._scrollToIndex();
    }
  }

  /**
   * Move to the previous set of cards
   */
  previous() {
    if (this._currentIndex > 0) {
      this._currentIndex--;
      this._scrollToIndex();
    }
  }

  /**
   * Scroll the container to show the current index
   */
  _scrollToIndex() {
    const container = this.shadowRoot.querySelector(".carousel-container");
    const cardWidth = this.shadowRoot.querySelector(".carousel-card")?.offsetWidth || 300;
    const scrollPos = this._currentIndex * cardWidth;
    
    container.scrollTo({
      left: scrollPos,
      behavior: "smooth"
    });
    
    this._updateControls();
  }

  /**
   * Update the enabled/disabled state of navigation controls
   */
  _updateControls() {
    const container = this.shadowRoot.querySelector(".carousel-container");
    const cardWidth = this.shadowRoot.querySelector(".carousel-card")?.offsetWidth || 300;
    const visibleCards = Math.floor(container.offsetWidth / cardWidth);
    
    const prevButton = this.shadowRoot.querySelector(".prev-button");
    const nextButton = this.shadowRoot.querySelector(".next-button");
    
    if (prevButton) {
      prevButton.disabled = this._currentIndex <= 0;
    }
    
    if (nextButton) {
      nextButton.disabled = this._currentIndex >= this._cards.length - visibleCards;
    }
  }

  /**
   * Setup event listeners for the carousel
   */
  _setupEventListeners() {
    // Add event listeners after rendering
    const prevButton = this.shadowRoot.querySelector(".prev-button");
    const nextButton = this.shadowRoot.querySelector(".next-button");
    
    if (prevButton) {
      prevButton.addEventListener("click", () => this.previous());
    }
    
    if (nextButton) {
      nextButton.addEventListener("click", () => this.next());
    }
    
    // Add resize observer to update controls when container size changes
    if (!this._resizeObserver) {
      this._resizeObserver = new ResizeObserver(() => {
        this._updateControls();
      });
      
      const container = this.shadowRoot.querySelector(".carousel-container");
      if (container) {
        this._resizeObserver.observe(container);
      }
    }
  }

  /**
   * Handle carousel container scroll events
   */
  _handleScroll() {
    const container = this.shadowRoot.querySelector(".carousel-container");
    const cardWidth = this.shadowRoot.querySelector(".carousel-card")?.offsetWidth || 300;
    
    // Update current index based on scroll position
    this._currentIndex = Math.round(container.scrollLeft / cardWidth);
    this._updateControls();
  }

  /**
   * Disconnect observers and clean up event listeners
   */
  disconnectedCallback() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          width: 100%;
        }

        .carousel {
          position: relative;
          width: 100%;
          overflow: hidden;
        }

        .carousel-container {
          display: flex;
          gap: 1rem;
          overflow-x: auto;
          scroll-behavior: smooth;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
          padding: 1rem 0.5rem;
          scroll-snap-type: x mandatory;
        }

        .carousel-container::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }

        .carousel-card {
          flex: 0 0 auto;
          width: 280px;
          scroll-snap-align: start;
        }

        .carousel-controls {
          display: flex;
          justify-content: space-between;
          position: absolute;
          width: 100%;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }

        .carousel-button {
          background-color: white;
          border: 1px solid #ddd;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          pointer-events: auto;
          transition: opacity 0.2s ease;
          margin: 0 0.5rem;
        }

        .carousel-button:hover:not(:disabled) {
          background-color: #f5f5f5;
        }

        .carousel-button:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .carousel-button svg {
          width: 20px;
          height: 20px;
        }

        .empty-state {
          padding: 2rem;
          text-align: center;
          background-color: #f9f9f9;
          border-radius: 8px;
          color: #666;
        }
      </style>

      <div class="carousel">
        <div class="carousel-container">
          ${
            this._cards.length > 0
              ? this._cards.map((_, index) => `
                  <div class="carousel-card" id="card-${index}">
                  </div>
                `).join("")
              : '<div class="empty-state">No cards to display</div>'
          }
        </div>

        ${
          this._cards.length > 1
            ? `
              <div class="carousel-controls">
                <button class="carousel-button prev-button" aria-label="Previous">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <button class="carousel-button next-button" aria-label="Next">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            `
            : ""
        }
      </div>
    `;

    // Add cards to slots after rendering - use the original elements, not clones
    this._cards.forEach((card, index) => {
      const slot = this.shadowRoot.getElementById(`card-${index}`);
      if (slot) {
        slot.appendChild(card);
      }
    });

    // Set up scroll event listener
    const container = this.shadowRoot.querySelector(".carousel-container");
    if (container) {
      container.addEventListener("scroll", () => this._handleScroll());
    }

    this._setupEventListeners();
    this._updateControls();
  }
}

customElements.define("card-carousel", CardCarousel);