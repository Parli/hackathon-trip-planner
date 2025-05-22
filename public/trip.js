// Trip planner - Trip page
import { marked } from "https://cdn.jsdelivr.net/npm/marked@15.0.11/+esm";
import { getStayResearch } from "/research.js";
import "./components/card-carousel.js";
import * as TripState from "/state.js";
import { getSearch, getHistoricWeather } from "/search.js";

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
      stayWithWeather = await getHistoricWeatherForStay(
        stay,
        startTime,
        endTime
      );
    }

    // Add stay to the trip
    const updatedTrip = {
      ...tripData,
      stays: [...tripData.stays, stayWithWeather],
    };

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

/**
 * Fetches historical weather data for a stay's location and date range
 * @param {Object} stay - The stay object to update with weather data
 * @returns {Promise<Object>} - The stay object with weather data added
 */
async function getHistoricWeatherForStay(stay, start_time, end_time) {
  if (!stay || !stay.destination || !start_time || !end_time) {
    return stay;
  }

  try {
    // Get coordinates for the location using the search util
    const { city, country } = stay.destination;
    const locationQuery = `${city}, ${country}`;

    const searchResult = await getSearch(locationQuery, { type: "maps" });

    // Check if we got valid coordinates
    if (!searchResult || !searchResult.places || !searchResult.places.length) {
      console.error("Could not find coordinates for location:", locationQuery);
      return stay;
    }

    // Get coordinates from the first place result
    const { latitude, longitude } = searchResult.places[0];

    // Get historical weather data for the previous year
    const oneYearAgo = 365 * 24 * 60 * 60; // Seconds in a year
    const historicStartDate = start_time - oneYearAgo;
    const historicEndDate = end_time - oneYearAgo;

    const weatherData = await getHistoricWeather(
      { latitude, longitude },
      historicStartDate,
      historicEndDate
    );

    // Check if we got valid weather data
    if (
      !weatherData ||
      !weatherData.daily ||
      !weatherData.daily.time ||
      !weatherData.daily.time.length
    ) {
      console.error("Could not get historical weather data");
      return stay;
    }

    // Map the daily weather data to the stay's weather array
    const weatherArray = weatherData.daily.time.map((dateStr, index) => {
      // Get the weather code and other relevant data
      const weatherCode = weatherData.daily.weather_code[index];
      const precipitation = weatherData.daily.precipitation_sum[index] || 0;
      const windSpeed = weatherData.daily.wind_speed_10m_max[index] || 0;
      const temperature = weatherData.daily.temperature_2m_mean[index] || 0;

      // Map to the app's weather condition format
      const condition = mapWeatherCodeToCondition(
        weatherCode,
        precipitation,
        windSpeed
      );

      // Convert the date to timestamps
      const date = new Date(dateStr);
      const startTime = Math.floor(date.getTime() / 1000);
      const endTime = startTime + 86400; // Add one day in seconds

      // Return the weather object
      return {
        condition,
        temperature,
        start_time: startTime + oneYearAgo, // Adjust back to the current year
        end_time: endTime + oneYearAgo, // Adjust back to the current year
      };
    });

    // Create updated stay with weather data
    const updatedStay = {
      ...stay,
      weather: weatherArray,
    };

    return updatedStay;
  } catch (error) {
    console.error("Error getting historical weather data:", error);
    return stay;
  }
}

/**
 * Maps WMO weather codes to app's weather condition format
 * @param {number} weatherCode - WMO weather code
 * @param {number} precipitation - Precipitation amount in mm
 * @param {number} windSpeed - Wind speed in km/h
 * @returns {string} Weather condition as used in the app
 */
function mapWeatherCodeToCondition(weatherCode, precipitation, windSpeed) {
  // WMO Weather codes: https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM

  // Check for windy conditions first (regardless of other weather)
  if (windSpeed > 30) {
    return "windy";
  }

  // Clear, Sunny (codes 0, 1)
  if (weatherCode === 0 || weatherCode === 1) {
    return "sunny";
  }

  // Partly cloudy (codes 2, 3)
  if (weatherCode === 2 || weatherCode === 3) {
    return "partly_cloudy";
  }

  // Cloudy (codes 4-9)
  if (weatherCode >= 4 && weatherCode <= 9) {
    return "cloudy";
  }

  // Fog (codes 40-49)
  if (weatherCode >= 40 && weatherCode <= 49) {
    return "foggy";
  }

  // Light rain (codes 50-59, 60-61, 80-81)
  if (
    (weatherCode >= 50 && weatherCode <= 59) ||
    weatherCode === 60 ||
    weatherCode === 61 ||
    weatherCode === 80 ||
    weatherCode === 81
  ) {
    return "light_rain";
  }

  // Moderate rain (codes 62, 82, 63 with lower precipitation)
  if (
    weatherCode === 62 ||
    weatherCode === 82 ||
    (weatherCode === 63 && precipitation < 10)
  ) {
    return "moderate_rain";
  }

  // Heavy rain (codes 63 with higher precipitation, 64-65, 83-84)
  if (
    (weatherCode === 63 && precipitation >= 10) ||
    weatherCode === 64 ||
    weatherCode === 65 ||
    weatherCode === 83 ||
    weatherCode === 84
  ) {
    return "heavy_rain";
  }

  // Light snow (codes 70-71, 85)
  if (weatherCode === 70 || weatherCode === 71 || weatherCode === 85) {
    return "light_snow";
  }

  // Moderate snow (code 72, 73 with lower amounts, 86)
  if (
    weatherCode === 72 ||
    (weatherCode === 73 && precipitation < 5) ||
    weatherCode === 86
  ) {
    return "moderate_snow";
  }

  // Heavy snow (codes 73 with higher amounts, 74-79, 87-90)
  if (
    (weatherCode === 73 && precipitation >= 5) ||
    (weatherCode >= 74 && weatherCode <= 79) ||
    (weatherCode >= 87 && weatherCode <= 90)
  ) {
    return "heavy_snow";
  }

  // Hail (codes 89, 90)
  if (weatherCode === 89 || weatherCode === 90) {
    return "hail";
  }

  // Thunderstorm (codes 95-99, 17-19)
  if (
    (weatherCode >= 95 && weatherCode <= 99) ||
    (weatherCode >= 17 && weatherCode <= 19)
  ) {
    return "thunderstorm";
  }

  // Stormy (codes 91-94)
  if (weatherCode >= 91 && weatherCode <= 94) {
    return "stormy";
  }

  // Default to partly_cloudy if we can't determine
  return "partly_cloudy";
}

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
