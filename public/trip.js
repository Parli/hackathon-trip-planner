// Trip planner - Trip page
import {
  getStayResearch,
  getHistoricWeatherForStay,
  getDayPlanResearch,
} from "/research.js";
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

// Function to preserve scroll position by fixing container height during renders
function preserveHeightDuringRender(callback) {
  const itineraryContent = document.getElementById("itineraryContent");

  if (itineraryContent) {
    // Get and set the current height of the container
    const currentHeight = itineraryContent.offsetHeight;
    itineraryContent.style.height = `${currentHeight}px`;

    // Call the callback function (render)
    callback();

    // Reset the height after a short delay to allow rendering to complete
    setTimeout(() => {
      itineraryContent.style.height = "";
    }, 0);
  } else {
    // If container not found, just call the callback
    callback();
  }
}

// Add event listeners for state changes
TripState.addEventListener("trip-updated", (tripData) => {
  // Re-render trip when data is updated
  preserveHeightDuringRender(() => renderTrip(tripData));
});

// Add event listener for stay-deleted events
document.addEventListener("stay-deleted", (event) => {
  console.log("Stay deleted event received:", event.detail.stayId);
  // The state is already updated in the component, just update the UI
  preserveHeightDuringRender(() => renderTrip(TripState.getTrip()));
});

// Add event listener for day-enhance events (magic wand)
document.addEventListener("day-enhance", async (event) => {
  console.log("Day enhance event received:", event.detail);
  try {
    const { stayId, startTime, endTime } = event.detail;
    const stay = TripState.get(stayId);
    if (!stay) {
      return;
    }

    // Call getDayPlanResearch to get enhanced plans for the day
    const enhancedPlans = await getDayPlanResearch(stay, {
      startTime,
      endTime,
      count: 10,
    });

    if (enhancedPlans && enhancedPlans.length > 0) {
      // Create a set of plan IDs from the enhanced plans
      const enhancedPlanIds = new Set(enhancedPlans.map((plan) => plan.id));

      // Filter out plans from the existing plans that have IDs matching enhanced plans
      const filteredExistingPlans = stay.day_plans.filter(
        (plan) => !enhancedPlanIds.has(plan.id)
      );

      // Combine filtered existing plans with new enhanced plans
      stay.day_plans = [...filteredExistingPlans, ...enhancedPlans];

      // Update the stay in the trip state
      TripState.update(stay.id, stay);

      // Save the trip data
      await TripState.saveTrip();
    }
  } catch (error) {
    console.error("Error enhancing day plan:", error);
  }
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
async function addStayToTrip(stay) {
  const searchResults = document.getElementById("searchResults");
  const cityCarousel = document.getElementById("cityCarousel");

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

    // Show a "working on it" message
    searchResults.innerHTML = `<p>Adding ${stay.destination.city}, ${stay.destination.country} to your itinerary and fetching weather data...</p>`;
    cityCarousel.classList.add("section-disabled");

    // Get historical weather data for the stay based on trip's start and end dates
    let stayWithWeather = { ...stay };

    const startDate = tripData.timeline?.start_date;
    const endDate = tripData.timeline?.end_date;

    if (startDate && endDate) {
      // Convert the date objects to timestamps (seconds since epoch)
      const startTime = Math.floor(
        new Date(startDate.year, startDate.month - 1, startDate.day).getTime() /
          1000
      );
      const endTime =
        Math.floor(
          new Date(endDate.year, endDate.month - 1, endDate.day).getTime() /
            1000
        ) + 86399; // End of day

      // Fetch and add historical weather data
      const stayWeather = await getHistoricWeatherForStay(stay, {
        startTime,
        endTime,
      });
      // Create updated stay with weather data
      stayWithWeather = {
        ...stay,
        weather: stayWeather,
      };
    }

    // Add stay to the trip
    const updatedTrip = {
      ...tripData,
      stays: [...tripData.stays, stayWithWeather],
    };

    cityCarousel.classList.remove("section-disabled");

    // Update the trip state
    TripState.update(tripData.id, updatedTrip);

    // Show a success message
    const weatherMessage =
      stayWithWeather.weather && stayWithWeather.weather.length > 0
        ? " with historical weather data"
        : "";

    searchResults.innerHTML = `<p>Added ${stay.destination.city}, ${stay.destination.country} to your itinerary${weatherMessage}!</p>`;

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
        card.addEventListener("click", async () => {
          await addStayToTrip(stay);
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
    card.addEventListener("click", async () => {
      await addStayToTrip(stay);
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
