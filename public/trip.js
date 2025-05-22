// Trip planner - Trip page
import { marked } from "https://cdn.jsdelivr.net/npm/marked@15.0.11/+esm";
import { getStayResearch } from "/research.js";
import "./components/card-carousel.js";
import * as TripState from "/state.js";

// Initialize the trip page
(async function init() {
  try {
    // Get the trip ID from URL parameters
    const tripId = TripState.getIdFromUrl();

    // Check if parameter is a valid trip ID
    if (tripId) {
      // Show loading state (already visible by default)

      // Retrieve the stored trip data
      const tripData = await TripState.loadTrip(tripId);

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

// Add event listeners for state changes
TripState.addEventListener('trip-updated', (tripData) => {
  // Re-render trip when data is updated
  renderTrip(tripData);
});

TripState.addEventListener('trip-error', (error) => {
  console.error("Trip state error:", error);
});

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
  const searchResults = document.getElementById("searchResults");
  
  try {
    // Get current trip data
    const tripData = TripState.getTrip();
    
    // Check if this stay already exists in the trip by comparing destinations
    const existingStay = tripData.stays.find(
      (existingStay) =>
        existingStay.destination.city === stay.destination.city &&
        existingStay.destination.country === stay.destination.country
    );
    
    if (existingStay) {
      // If the stay already exists, show a message
      searchResults.innerHTML = `<p>Destination ${stay.destination.city}, ${stay.destination.country} is already in your itinerary.</p>`;
      return;
    }
    
    // Add stay to the trip
    const updatedTrip = {
      ...tripData,
      stays: [...tripData.stays, stay]
    };
    
    // Update the trip state
    TripState.update(tripData.id, updatedTrip);
    
    // Show a success message
    searchResults.innerHTML = `<p>Added ${stay.destination.city}, ${stay.destination.country} to your itinerary!</p>`;
    
    // Save the updated trip data
    TripState.saveTrip();
  } catch (error) {
    console.error("Error adding stay to trip:", error);
    searchResults.innerHTML = `<p class="error">Error adding destination: ${error.message}</p>`;
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