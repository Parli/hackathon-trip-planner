/**
 * A web component that displays a modal dialog
 * Used to show content in a popup over the page
 */

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._handleBackdropClick = this._handleBackdropClick.bind(this);
    this._handleCloseClick = this._handleCloseClick.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this.render();
  }

  connectedCallback() {
    // Add event listeners
    const backdrop = this.shadowRoot.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', this._handleBackdropClick);
    }
    
    const closeButton = this.shadowRoot.querySelector('.modal-close');
    if (closeButton) {
      closeButton.addEventListener('click', this._handleCloseClick);
    }
    
    document.addEventListener('keydown', this._handleKeyDown);
  }

  disconnectedCallback() {
    // Remove event listeners
    const backdrop = this.shadowRoot.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.removeEventListener('click', this._handleBackdropClick);
    }
    
    const closeButton = this.shadowRoot.querySelector('.modal-close');
    if (closeButton) {
      closeButton.removeEventListener('click', this._handleCloseClick);
    }
    
    document.removeEventListener('keydown', this._handleKeyDown);
  }

  /**
   * Handle click on backdrop to close modal
   * @param {Event} event Click event
   * @private
   */
  _handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  /**
   * Handle click on close button
   * @private
   */
  _handleCloseClick() {
    this.close();
  }

  /**
   * Handle keydown event to close modal on ESC
   * @param {KeyboardEvent} event Keyboard event
   * @private
   */
  _handleKeyDown(event) {
    if (event.key === 'Escape') {
      this.close();
    }
  }

  /**
   * Close the modal and dispatch event
   */
  close() {
    this.style.display = 'none';
    this.dispatchEvent(new CustomEvent('modal-closed', {
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Open the modal
   */
  open() {
    this.style.display = 'block';
    this.dispatchEvent(new CustomEvent('modal-opened', {
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Set the title of the modal
   * @param {string} title The title to display
   */
  setTitle(title) {
    const titleElement = this.shadowRoot.querySelector('.modal-title');
    if (titleElement) {
      titleElement.textContent = title;
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1000;
        }
        
        .modal-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .modal-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          width: 90%;
          max-width: 900px; /* Increased from 800px */
          height: 80vh;     /* Set specific height */
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #eee;
          flex-shrink: 0; /* Prevent header from shrinking */
        }
        
        .modal-title {
          font-size: 1.2rem;
          font-weight: bold;
          margin: 0;
        }
        
        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #888;
          padding: 0;
          margin: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s;
          z-index: 10; /* Ensure it's above other content */
        }
        
        .modal-close:hover {
          background-color: #f0f0f0;
          color: #333;
        }
        
        .modal-body {
          padding: 0; /* Remove padding for map to fill space */
          flex: 1;
          min-height: 500px; /* Ensure minimum height for map */
          display: flex; /* For child components to fill space */
          overflow: hidden; /* Prevent scrollbars */
        }
        
        .modal-footer {
          padding: 16px;
          border-top: 1px solid #eee;
          display: flex;
          justify-content: flex-end;
        }
        
        ::slotted(*) {
          max-width: 100%;
        }
      </style>
      
      <div class="modal-backdrop">
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title">Modal Title</h2>
            <button class="modal-close" title="Close">×</button>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
          <div class="modal-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("modal-dialog", ModalDialog);