// Trip planner - Trip page
import { marked } from "https://cdn.jsdelivr.net/npm/marked@15.0.11/+esm";

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
        throw new Error(`Failed to load trip data: ${response.status} ${response.statusText}`);
      }
      
      // Parse the trip data
      tripData = await response.json();
      
      // Render the trip
      renderTrip(tripData);
    } else {
      throw new Error('No valid trip ID found in URL');
    }
  } catch (error) {
    console.error('Error initializing trip:', error);
    
    // Hide loading state and show error state
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
    document.getElementById('errorMessage').textContent = error.message;
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
  document.getElementById('tripTitle').textContent = trip.title;
  document.getElementById('tripDates').textContent = 
    `Dates: ${formatDate(trip.timeline.start_date)} - ${formatDate(trip.timeline.end_date)}`;
  document.getElementById('tripDays').textContent = `${trip.timeline.trip_days} days`;
  document.getElementById('tripOrigin').textContent = `From: ${trip.preferences.origin.name}`;
  document.getElementById('tripTravelers').textContent = `Travelers: ${trip.preferences.traveler_count}`;
  document.getElementById('tripPace').textContent = `Pace: ${trip.preferences.pace}`;
  document.getElementById('tripBudget').textContent = `Budget: ${trip.preferences.budget_level}`;
  
  // Show or hide itinerary based on whether there are stays
  if (trip.stays.length > 0) {
    document.getElementById('emptyItineraryMessage').style.display = 'none';
    document.querySelector('trip-itinerary').style.display = 'block';
  } else {
    document.getElementById('emptyItineraryMessage').style.display = 'block';
    document.querySelector('trip-itinerary').style.display = 'none';
  }
  
  // Hide loading state and show trip content
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('tripContent').style.display = 'block';
  
  // Add event listener for search form
  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', handleDestinationSearch);
  }
}

// Handle destination search
async function handleDestinationSearch(event) {
  event.preventDefault();
  
  const searchQuery = document.getElementById('searchQuery').value;
  const searchResults = document.getElementById('searchResults');
  
  // Show loading state
  searchResults.innerHTML = '<p>Searching for destinations...</p>';
  
  try {
    // This would be replaced with an actual search API call
    // For now, display a placeholder message
    searchResults.innerHTML = `
      <p>Search functionality will be implemented to find destinations matching: "${searchQuery}"</p>
      <div class="city-card-container">
        <city-card></city-card>
      </div>
    `;
  } catch (error) {
    console.error('Error searching for destinations:', error);
    searchResults.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
}