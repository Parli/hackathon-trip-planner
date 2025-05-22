// Trip planner - Trip page
import { marked } from "https://cdn.jsdelivr.net/npm/marked@15.0.11/+esm";
import { getStayResearch } from "/research.js";
import "./components/card-carousel.js";

// Global state
let tripData = null;

// Initialize the trip page
(async function init() {
  try {
    // Get the trip ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const [id, value] = [...urlParams.entries()][0] ?? [];

    // Check if parameter is a valid trip ID
    if (id && !value) {
      // Show loading state (already visible by default)

      // Retrieve the stored trip from the ID
      const response = await fetch(`/api/save/${id}`);

      if (!response.ok) {
        throw new Error(
          `Failed to load trip data: ${response.status} ${response.statusText}`
        );
      }

      // Parse the trip data
      tripData = await response.json();

      // Render the trip
      renderTrip(tripData);
    } else {
      throw new Error("No valid trip ID found in URL");
    }
  } catch (error) {
    console.error("Error initializing trip:", error);

    // Hide loading state and show error state
    document.getElementById("loadingState").style.display = "none";
    document.getElementById("errorState").style.display = "block";
    document.getElementById("errorMessage").textContent = error.message;
  }
})();

// Render the trip data
function renderTrip(trip) {
  // Update page title
  document.title = `${trip.title} - Trip Planner`;

  // Format dates
  const formatDate = (date) => {
    return `${date.month}/${date.day}/${date.year}`;
  };

  // Populate trip content
  document.getElementById("tripTitle").textContent = trip.title;
  document.getElementById("tripDates").textContent = `Dates: ${formatDate(
    trip.timeline.start_date
  )} - ${formatDate(trip.timeline.end_date)}`;
  document.getElementById(
    "tripDays"
  ).textContent = `${trip.timeline.trip_days} days`;
  document.getElementById(
    "tripOrigin"
  ).textContent = `From: ${trip.preferences.origin.name}`;
  document.getElementById(
    "tripTravelers"
  ).textContent = `Travelers: ${trip.preferences.traveler_count}`;
  document.getElementById(
    "tripPace"
  ).textContent = `Pace: ${trip.preferences.pace}`;
  document.getElementById(
    "tripBudget"
  ).textContent = `Budget: ${trip.preferences.budget_level}`;

  // Show or hide itinerary based on whether there are stays
  const tripItinerary = document.querySelector("trip-itinerary");
  if (trip.stays.length > 0) {
    document.getElementById("emptyItineraryMessage").style.display = "none";
    tripItinerary.style.display = "block";

    // Set the trip data for the itinerary component
    tripItinerary.trip = trip;
  } else {
    document.getElementById("emptyItineraryMessage").style.display = "block";
    tripItinerary.style.display = "none";
  }

  // Hide loading state and show trip content
  document.getElementById("loadingState").style.display = "none";
  document.getElementById("tripContent").style.display = "block";

  // Add event listener for search form
  const searchForm = document.getElementById("searchForm");
  if (searchForm) {
    searchForm.addEventListener("submit", handleDestinationSearch);
  }
}

/**
 * Add a stay to the trip data and update the UI
 * @param {Object} stay The stay to add to the trip
 */
function addStayToTrip(stay) {
  // Add the stay to the trip data
  if (!tripData.stays) {
    tripData.stays = [];
  }

  // Check if this stay already exists in the trip by comparing destinations
  const existingStayIndex = tripData.stays.findIndex(
    (existingStay) =>
      existingStay.destination.city === stay.destination.city &&
      existingStay.destination.country === stay.destination.country
  );

  if (existingStayIndex !== -1) {
    // If the stay already exists, show a message
    const searchResults = document.getElementById("searchResults");
    searchResults.innerHTML = `<p>Destination ${stay.destination.city}, ${stay.destination.country} is already in your itinerary.</p>`;
    return;
  }

  // Add the stay to the trip
  tripData.stays.push(stay);

  // Update the trip itinerary display
  const emptyItineraryMessage = document.getElementById(
    "emptyItineraryMessage"
  );
  const tripItinerary = document.querySelector("trip-itinerary");

  // Hide the empty message and show the itinerary
  if (tripData.stays.length > 0) {
    emptyItineraryMessage.style.display = "none";
    tripItinerary.style.display = "block";

    // Update the trip-itinerary component with the updated trip data
    tripItinerary.trip = tripData;
  }

  // Show a success message
  const searchResults = document.getElementById("searchResults");
  searchResults.innerHTML = `<p>Added ${stay.destination.city}, ${stay.destination.country} to your itinerary!</p>`;

  // Save the updated trip data
  saveTrip();
}

/**
 * Save the current trip data
 */
async function saveTrip() {
  try {
    // Get the trip ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const [id, value] = [...urlParams.entries()][0] ?? [];

    if (!id) {
      console.error("No trip ID found for saving");
      return;
    }

    // Send the updated trip data to the server
    const response = await fetch(`/api/save/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tripData),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to save trip data: ${response.status} ${response.statusText}`
      );
    }

    console.log("Trip data saved successfully");
  } catch (error) {
    console.error("Error saving trip:", error);
  }
}

// Handle destination search
async function handleDestinationSearch(event) {
  event.preventDefault();

  const searchQuery = document.getElementById("searchQuery").value;
  const searchResults = document.getElementById("searchResults");
  const cityCarousel = document.getElementById("cityCarousel");
  const stayCarousel = document.getElementById("stayCarousel");

  // Show loading state
  searchResults.innerHTML = "<p>Searching for destinations...</p>";
  cityCarousel.style.display = "none";

  try {
    // Call getStayResearch with the search query
    const stays = await getStayResearch(searchQuery);

    // Clear the loading message
    searchResults.innerHTML = "";

    if (stays && stays.length > 0) {
      // Create city cards for each stay
      const cityCards = stays.map((stay) => {
        const card = document.createElement("city-card");
        card.stay = stay;
        // Add click handler to add the stay to the trip
        card.addEventListener("click", () => addStayToTrip(stay));
        return card;
      });

      // Clear any existing cards
      while (stayCarousel.firstChild) {
        stayCarousel.removeChild(stayCarousel.firstChild);
      }

      // Add the cards to the carousel
      stayCarousel.cards = cityCards;

      // Show the carousel
      cityCarousel.style.display = "block";
    } else {
      searchResults.innerHTML =
        "<p>No destinations found. Try a different search.</p>";
    }
  } catch (error) {
    console.error("Error searching for destinations:", error);
    searchResults.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
}
