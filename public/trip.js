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
TripState.addEventListener("trip-updated", (tripData) => {
  // Re-render trip when data is updated
  renderTrip(tripData);
});

TripState.addEventListener("trip-error", (error) => {
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
      stays: [...tripData.stays, stay],
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

// Store the current search results
let currentSearchResults = [];

// Handle destination search
async function handleDestinationSearch(event) {
  event.preventDefault();

  const searchQuery = document.getElementById("searchQuery");
  const searchResults = document.getElementById("searchResults");
  const cityCarousel = document.getElementById("cityCarousel");
  const stayCarousel = document.getElementById("stayCarousel");

  // Show loading state
  searchResults.innerHTML = "";
  cityCarousel.style.display = "none";

  // Add loading indicator
  const loadingIndicator = document.createElement("div");
  loadingIndicator.className = "search-loading-indicator";
  document.getElementById("searchForm").appendChild(loadingIndicator);

  // Grey out the search input
  searchQuery.classList.add("loading");
  searchQuery.disabled = true;

  try {
    // Call getStayResearch with the search query
    const stays = await getStayResearch(searchQuery.value);

    // Clear the loading message
    searchResults.innerHTML = "";

    // Get current trip data to filter out destinations already in the trip
    const tripData = TripState.getTrip();
    const existingDestinations = tripData.stays.map(
      (stay) =>
        `${stay.destination.city.toLowerCase()},${stay.destination.country.toLowerCase()}`
    );

    // Filter out destinations that are already in the trip
    const filteredStays = stays.filter((stay) => {
      const stayKey = `${stay.destination.city.toLowerCase()},${stay.destination.country.toLowerCase()}`;
      return !existingDestinations.includes(stayKey);
    });

    // Update current search results
    currentSearchResults = filteredStays;

    if (filteredStays && filteredStays.length > 0) {
      // Create city cards for each stay
      const cityCards = filteredStays.map((stay) => {
        const card = document.createElement("city-card");
        card.stay = stay;
        // Add click handler to add the stay to the trip
        card.addEventListener("click", () => {
          addStayToTrip(stay);
          // Remove the added stay from the carousel
          updateSearchResultsAfterAdd(stay);
        });
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
      if (stays.length > 0 && filteredStays.length === 0) {
        searchResults.innerHTML =
          "<p>All found destinations are already in your itinerary. Try searching for different destinations.</p>";
      } else {
        searchResults.innerHTML =
          "<p>No destinations found. Try a different search.</p>";
      }
      cityCarousel.style.display = "none";
    }
  } catch (error) {
    console.error("Error searching for destinations:", error);
    searchResults.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    cityCarousel.style.display = "none";
  } finally {
    // Remove loading indicator
    const loadingIndicator = document.querySelector(
      ".search-loading-indicator"
    );
    if (loadingIndicator && loadingIndicator.parentNode) {
      loadingIndicator.parentNode.removeChild(loadingIndicator);
    }

    // Restore search input
    searchQuery.classList.remove("loading");
    searchQuery.disabled = false;

    // Clear the search input
    searchQuery.value = "";
  }
}

/**
 * Update the search results carousel after adding a stay
 * @param {Object} addedStay The stay that was added
 */
function updateSearchResultsAfterAdd(addedStay) {
  const cityCarousel = document.getElementById("cityCarousel");
  const stayCarousel = document.getElementById("stayCarousel");
  const searchResults = document.getElementById("searchResults");

  // Remove the added stay from current results
  currentSearchResults = currentSearchResults.filter(
    (stay) =>
      !(
        stay.destination.city === addedStay.destination.city &&
        stay.destination.country === addedStay.destination.country
      )
  );

  if (currentSearchResults.length === 0) {
    // Hide carousel if no results left
    cityCarousel.style.display = "none";
    searchResults.innerHTML =
      "<p>All destinations added to your itinerary!</p>";
    return;
  }

  // Create new city cards for remaining stays
  const cityCards = currentSearchResults.map((stay) => {
    const card = document.createElement("city-card");
    card.stay = stay;
    // Add click handler to add the stay to the trip
    card.addEventListener("click", () => {
      addStayToTrip(stay);
      // Remove the added stay from the carousel
      updateSearchResultsAfterAdd(stay);
    });
    return card;
  });

  // Clear any existing cards
  while (stayCarousel.firstChild) {
    stayCarousel.removeChild(stayCarousel.firstChild);
  }

  // Add the updated cards to the carousel
  stayCarousel.cards = cityCards;
}
