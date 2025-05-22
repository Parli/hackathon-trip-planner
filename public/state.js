// Trip state management module
// Manages loading, saving, and accessing trip data

// Private trip data state
let _tripData = null;

// Event listeners for state changes
const eventListeners = {
  "trip-loaded": [],
  "trip-updated": [],
  "trip-saved": [],
  "trip-error": [],
};

/**
 * Add a listener for state change events
 * @param {string} event The event to listen for ('trip-loaded', 'trip-updated', 'trip-saved', 'trip-error')
 * @param {Function} callback The callback function to execute when the event occurs
 */
export function addEventListener(event, callback) {
  if (eventListeners[event]) {
    eventListeners[event].push(callback);
  }
}

/**
 * Remove a listener for state change events
 * @param {string} event The event to remove the listener from
 * @param {Function} callback The callback function to remove
 */
export function removeEventListener(event, callback) {
  if (eventListeners[event]) {
    const index = eventListeners[event].indexOf(callback);
    if (index !== -1) {
      eventListeners[event].splice(index, 1);
    }
  }
}

/**
 * Trigger an event and execute all registered callbacks
 * @param {string} event The event to trigger
 * @param {*} data The data to pass to the callbacks
 */
function triggerEvent(event, data) {
  if (eventListeners[event]) {
    eventListeners[event].forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} event listener:`, error);
      }
    });
  }
}

/**
 * Initialize the trip state from URL parameters
 * @returns {Promise<string|null>} The trip ID if found, null otherwise
 */
export function getIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const [id, value] = [...urlParams.entries()][0] ?? [];

  // Check if parameter is a valid trip ID
  if (id && !value) {
    return id;
  }

  return null;
}

/**
 * Load trip data from the server by ID
 * @param {string} id The trip ID to load
 * @returns {Promise<Object>} The loaded trip data
 */
export async function loadTrip(id) {
  try {
    if (!id) {
      id = getIdFromUrl();
    }

    // Show loading state (handled by caller)

    // Retrieve the stored trip from the ID
    const response = await fetch(`/api/save/${id}`);

    if (!response.ok) {
      const error = new Error(
        `Failed to load trip data: ${response.status} ${response.statusText}`
      );
      triggerEvent("trip-error", error);
      throw error;
    }

    // Parse the trip data
    _tripData = await response.json();

    // Trigger loaded event
    triggerEvent("trip-loaded", _tripData);

    return _tripData;
  } catch (error) {
    console.error("Error loading trip:", error);
    triggerEvent("trip-error", error);
    throw error;
  }
}

/**
 * Save the current trip data to the server
 * @returns {Promise<void>}
 */
export async function saveTrip() {
  try {
    if (!_tripData) {
      const error = new Error("No trip data found for saving");
      triggerEvent("trip-error", error);
      throw error;
    }

    // Send the updated trip data to the server
    const response = await fetch(`/api/save/${_tripData.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(_tripData),
    });

    if (!response.ok) {
      const error = new Error(
        `Failed to save trip data: ${response.status} ${response.statusText}`
      );
      triggerEvent("trip-error", error);
      throw error;
    }

    console.log("Trip data saved successfully");
    triggerEvent("trip-saved", _tripData);
  } catch (error) {
    console.error("Error saving trip:", error);
    triggerEvent("trip-error", error);
    throw error;
  }
}

/**
 * Get a copy of the current trip data
 * @returns {Object} A copy of the current trip data
 */
export function getTrip() {
  return _tripData ? JSON.parse(JSON.stringify(_tripData)) : null;
}

/**
 * Helper function to find the path to an item by ID in the trip data structure
 * The path includes all objects with IDs along the way to the target
 * 
 * @param {Object} obj The object to search in
 * @param {string} id The ID to search for
 * @param {Array} path Array of objects with IDs encountered so far (for recursive calls)
 * @param {Object} itemInfo Additional info about the item's location in its parent
 * @returns {Object|null} Object containing the path array and item location info, or null if not found
 */
function findPathById(obj, id, path = [], itemInfo = null) {
  // Skip if not an object
  if (!obj || typeof obj !== "object") return null;
  
  // Create current path and info
  const hasId = obj.id !== undefined;
  const currentPath = hasId ? [...path, obj] : path;
  
  // If this is the target, return the path and item info
  if (hasId && obj.id === id) {
    return { path: currentPath, info: itemInfo };
  }
  
  // If obj is an array, search through its elements
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const item = obj[i];
      
      // Create info about the item's location in this array
      const childItemInfo = { parent: obj, accessor: i };
      
      // Recursively search in this item
      const result = findPathById(item, id, currentPath, childItemInfo);
      if (result) return result;
    }
  } 
  // If obj is an object, search through its properties
  else {
    for (const key in obj) {
      // Skip prototype chain
      if (!obj.hasOwnProperty(key)) continue;
      
      const value = obj[key];
      
      // Skip primitives
      if (!value || typeof value !== "object") continue;
      
      // Create info about the item's location in this object
      const childItemInfo = { parent: obj, accessor: key };
      
      // Recursively search in this property
      const result = findPathById(value, id, currentPath, childItemInfo);
      if (result) return result;
    }
  }

  // If no match found, return null
  return null;
}

/**
 * Get a data structure by id
 * @param {string} id id of data structure to get
 * @returns {Object|null} The found object or null if not found
 */
export function get(id) {
  if (!_tripData) return null;
  
  // If the ID matches the trip ID, return the trip data
  if (_tripData.id === id) {
    return JSON.parse(JSON.stringify(_tripData));
  }
  
  // Find the path to the item
  const result = findPathById(_tripData, id);
  
  // If found, return a deep copy of the last item in the path (the target)
  if (result && result.path.length > 0) {
    const target = result.path[result.path.length - 1];
    return JSON.parse(JSON.stringify(target));
  }
  
  return null;
}

/**
 * Get next level up data structure with an id above the given id
 * @param {string} id id of data structure to get the parent of
 * @returns {Object|null} The parent object or null if not found or if no parent with ID exists
 */
export function parent(id) {
  if (!_tripData || _tripData.id === id) return null;
  
  // Find the path to the item
  const result = findPathById(_tripData, id);
  
  // If found and there's a parent with an ID in the path, return it
  if (result && result.path.length > 1) {
    // Return the second-to-last item in the path (the parent with ID)
    const parent = result.path[result.path.length - 2];
    return JSON.parse(JSON.stringify(parent));
  }
  
  return null;
}

/**
 * Update the data structure of the id and trigger an update event
 * @param {string} id id of data structure to update
 * @param {Object} newData The new data to put in place of the id
 * @returns {boolean} True if the update was successful, false otherwise
 */
export function update(id, newData) {
  if (!_tripData) return false;
  
  // If the ID matches the trip ID, update the trip data
  if (_tripData.id === id) {
    // Preserve the ID
    newData.id = id;
    _tripData = newData;
    triggerEvent("trip-updated", _tripData);
    return true;
  }
  
  // Find the path to the item and info about its location
  const result = findPathById(_tripData, id);
  if (!result || !result.info) return false;
  
  // Preserve the ID
  newData.id = id;
  
  // Update the item using the location info
  const { parent, accessor } = result.info;
  
  // Update using the accessor (works for both arrays and objects)
  parent[accessor] = newData;
  
  triggerEvent("trip-updated", _tripData);
  return true;
}

/**
 * Remove the data structure with the id from the trip
 * If the data structure is in an array, it is removed from the array
 * Does not remove the top level trip data structure
 * @param {string} id The id of the data structure to remove
 * @returns {boolean} True if the removal was successful, false otherwise
 */
export function remove(id) {
  if (!_tripData || _tripData.id === id) return false;
  
  // Find the path to the item and info about its location
  const result = findPathById(_tripData, id);
  if (!result || !result.info) return false;
  
  // Remove the item using the location info
  const { parent, accessor } = result.info;
  
  // Handle removal differently based on parent type
  if (Array.isArray(parent)) {
    // For arrays, we need to splice to maintain array integrity
    parent.splice(accessor, 1);
  } else {
    // For objects, we can delete the property
    delete parent[accessor];
  }
  
  triggerEvent("trip-updated", _tripData);
  return true;
}