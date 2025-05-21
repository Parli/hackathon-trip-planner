/**
 * A web component that displays an image with a blurred version of itself as the background.
 * The image is always fully visible and centered within the container.
 */
class ImageContainer extends HTMLElement {
  static get observedAttributes() {
    return ["image", "alt"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.render();
  }

  connectedCallback() {
    this.image = this.getAttribute("image");
    this.alt = this.getAttribute("alt");
    this.render();
  }

  /**
   * Called when an observed attribute has been changed
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.connectedCallback();
    }
  }

  render() {
    const imageUrl = this.image || "/images/no-image.jpg";
    const altText = this.alt || "Image";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          width: 100%;
          height: 100%;
        }

        .image-container {
          position: relative;
          width: 100%;
          overflow: hidden;
        }

        .background-image {
          position: absolute;
          width: 100%;
          height: 100%;
          z-index: 0;
          background-color: grey;
          background-size: cover;
          background-position: center;
          filter: blur(50px) contrast(0.8) brightness(1.2);
          transform: scale(1.5);
        }

        .image {
          position: relative;
          width: 100%;
          height: 100%;
          max-height: 300px;
          z-index: 100;
          object-fit: contain;
          display: block;
          margin: 0 auto;
        }
      </style>

      <div class="image-container">
        <div class="background-image" style="background-image: url(${imageUrl});"></div>
        <img class="image" src="${imageUrl}" alt="${altText}">
      </div>
    `;
  }
}

customElements.define("image-container", ImageContainer);
