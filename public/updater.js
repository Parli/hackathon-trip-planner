/**
 * updater.js - A module for showing floating update messages
 * This module displays notification messages in the bottom right of the screen
 * that float upwards and fade away continuously.
 */

// Container for all update messages
let messageContainer = null;

/**
 * Initialize the message container
 * Creates a container div for all update messages if it doesn't exist yet
 */
function initContainer() {
  if (!messageContainer) {
    messageContainer = document.createElement("div");
    messageContainer.className = "update-message-container";
    messageContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      pointer-events: none;
      width: 300px;
      height: 0;
    `;
    document.body.appendChild(messageContainer);

    // Add style to head
    const style = document.createElement("style");
    style.textContent = `
      .update-message {
        background-color: rgba(255, 255, 255, 0.7);
        color: black;
        padding: 10px 15px;
        border-radius: 5px;
        max-width: 300px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        pointer-events: none;
        box-shadow: 0 2px 10px rgba(255, 255, 255, 0.2);
        position: absolute;
        bottom: 0;
        right: 0;
        animation: float-fade 2s linear forwards;
      }

      @keyframes float-fade {
        0% {
          transform: translateY(0) translateX(0);
          opacity: 1;
        }
        100% {
          transform: translateY(-400px) translateX(0);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Show an update message that floats up and fades away
 * @param {string} message - The message to display
 */
export function showUpdate(message) {
  // Initialize container if needed
  initContainer();

  // Random horizontal position with jitter
  const jitter = Math.floor(Math.random() * 60) - 30; // -30 to +30px

  // Create message element
  const messageElement = document.createElement("div");
  messageElement.className = "update-message";
  messageElement.textContent = message;
  messageElement.style.right = `${jitter}px`;

  // Add to container
  messageContainer.appendChild(messageElement);

  // Remove element after animation completes
  setTimeout(() => {
    if (messageElement.parentNode) {
      messageElement.parentNode.removeChild(messageElement);
    }
  }, 5000);
}
