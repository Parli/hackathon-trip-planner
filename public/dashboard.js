// Dashboard for testing the research and search functionality
import { getSearch, getHistoricWeather } from "/search.js";
import {
  getQueryPlan,
  getPageContent,
  getResearch,
  getPlaceInfo,
  getPlaceResearch,
  getStayResearch,
} from "/research.js";
import "./components/place-card.js";
import "./components/city-card.js";
import "./components/stay-itinerary.js";
import "./components/card-carousel.js";

// Initialize all tabs and their functionality

// Tab navigation
const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const tabId = tab.getAttribute("data-tab");

    // Update active tab
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    // Show corresponding tab content
    tabContents.forEach((content) => {
      content.classList.remove("active");
      if (content.id === `${tabId}-tab`) {
        content.classList.add("active");
      }
    });
  });
});

// Helper function to format JSON
function formatJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

// Search tab functionality
const searchForm = {
  query: document.getElementById("search-query"),
  typeRadios: document.querySelectorAll('input[name="search-type"]'),
  button: document.getElementById("search-button"),
  loading: document.getElementById("search-loading"),
  error: document.getElementById("search-error"),
  result: document.getElementById("search-result"),
  resultJSON: document.getElementById("search-result-json"),
};

searchForm.button.addEventListener("click", async () => {
  const query = searchForm.query.value.trim();
  if (!query) {
    searchForm.error.textContent = "Please enter a search query";
    searchForm.error.style.display = "block";
    return;
  }

  // Get selected search type
  let searchType = "search";
  searchForm.typeRadios.forEach((radio) => {
    if (radio.checked) {
      searchType = radio.value;
    }
  });

  try {
    // Hide previous results and show loading
    searchForm.result.style.display = "none";
    searchForm.error.style.display = "none";
    searchForm.loading.style.display = "block";

    // Perform search
    const result = await getSearch(query, { type: searchType });

    // Display results
    searchForm.resultJSON.textContent = formatJSON(result);
    searchForm.result.style.display = "block";
  } catch (error) {
    searchForm.error.textContent = `Error: ${error.message}`;
    searchForm.error.style.display = "block";
  } finally {
    searchForm.loading.style.display = "none";
  }
});

// Weather tab functionality
const weatherForm = {
  latitude: document.getElementById("weather-latitude"),
  longitude: document.getElementById("weather-longitude"),
  startDate: document.getElementById("weather-start-date"),
  endDate: document.getElementById("weather-end-date"),
  button: document.getElementById("weather-button"),
  loading: document.getElementById("weather-loading"),
  error: document.getElementById("weather-error"),
  result: document.getElementById("weather-result"),
  resultJSON: document.getElementById("weather-result-json"),
};

weatherForm.button.addEventListener("click", async () => {
  const latitude = parseFloat(weatherForm.latitude.value);
  const longitude = parseFloat(weatherForm.longitude.value);
  const startDate = new Date(weatherForm.startDate.value);
  const endDate = new Date(weatherForm.endDate.value);

  if (isNaN(latitude) || isNaN(longitude)) {
    weatherForm.error.textContent =
      "Please enter valid latitude and longitude coordinates";
    weatherForm.error.style.display = "block";
    return;
  }

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    weatherForm.error.textContent = "Please enter valid start and end dates";
    weatherForm.error.style.display = "block";
    return;
  }

  try {
    // Hide previous results and show loading
    weatherForm.result.style.display = "none";
    weatherForm.error.style.display = "none";
    weatherForm.loading.style.display = "block";

    // Convert dates to timestamps
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    // Get weather data
    const result = await getHistoricWeather(
      { latitude, longitude },
      startTimestamp,
      endTimestamp
    );

    // Display results
    weatherForm.resultJSON.textContent = formatJSON(result);
    weatherForm.result.style.display = "block";
  } catch (error) {
    weatherForm.error.textContent = `Error: ${error.message}`;
    weatherForm.error.style.display = "block";
  } finally {
    weatherForm.loading.style.display = "none";
  }
});

// Query Plan tab functionality
const queryPlanForm = {
  input: document.getElementById("query-plan-input"),
  button: document.getElementById("query-plan-button"),
  loading: document.getElementById("query-plan-loading"),
  error: document.getElementById("query-plan-error"),
  result: document.getElementById("query-plan-result"),
  resultContent: document.getElementById("query-plan-result-content"),
};

queryPlanForm.button.addEventListener("click", async () => {
  const query = queryPlanForm.input.value.trim();
  if (!query) {
    queryPlanForm.error.textContent = "Please enter a travel topic or question";
    queryPlanForm.error.style.display = "block";
    return;
  }

  try {
    // Hide previous results and show loading
    queryPlanForm.result.style.display = "none";
    queryPlanForm.error.style.display = "none";
    queryPlanForm.loading.style.display = "block";

    // Generate query plan
    const queries = await getQueryPlan(query);

    // Create HTML to display results
    let html = '<ul style="padding-left: 1.5rem;">';
    for (const q of queries) {
      html += `<li style="margin-bottom: 0.5rem;">${q}</li>`;
    }
    html += "</ul>";

    // Display results
    queryPlanForm.resultContent.innerHTML = html;
    queryPlanForm.result.style.display = "block";
  } catch (error) {
    queryPlanForm.error.textContent = `Error: ${error.message}`;
    queryPlanForm.error.style.display = "block";
  } finally {
    queryPlanForm.loading.style.display = "none";
  }
});

// Page Content tab functionality
const pageContentForm = {
  url: document.getElementById("page-content-url"),
  button: document.getElementById("page-content-button"),
  loading: document.getElementById("page-content-loading"),
  error: document.getElementById("page-content-error"),
  result: document.getElementById("page-content-result"),
  title: document.getElementById("page-content-title"),
  site: document.getElementById("page-content-site"),
  text: document.getElementById("page-content-text"),
};

pageContentForm.button.addEventListener("click", async () => {
  const url = pageContentForm.url.value.trim();
  if (!url) {
    pageContentForm.error.textContent = "Please enter a URL";
    pageContentForm.error.style.display = "block";
    return;
  }

  try {
    // Hide previous results and show loading
    pageContentForm.result.style.display = "none";
    pageContentForm.error.style.display = "none";
    pageContentForm.loading.style.display = "block";

    // Extract page content
    const content = await getPageContent(url);

    // Display results
    pageContentForm.title.textContent = content.title;
    pageContentForm.site.textContent = `${content.siteName} | ${content.url}`;

    // Format the content text for readability
    const textContent = content.content || "No content extracted";
    pageContentForm.text.innerHTML = textContent;

    pageContentForm.result.style.display = "block";
  } catch (error) {
    pageContentForm.error.textContent = `Error: ${error.message}`;
    pageContentForm.error.style.display = "block";
  } finally {
    pageContentForm.loading.style.display = "none";
  }
});

// Research tab functionality
const researchForm = {
  query: document.getElementById("research-query"),
  button: document.getElementById("research-button"),
  loading: document.getElementById("research-loading"),
  error: document.getElementById("research-error"),
  result: document.getElementById("research-result"),
  resultContent: document.getElementById("research-result-content"),
};

researchForm.button.addEventListener("click", async () => {
  const query = researchForm.query.value.trim();
  if (!query) {
    researchForm.error.textContent = "Please enter a research topic";
    researchForm.error.style.display = "block";
    return;
  }

  try {
    // Hide previous results and show loading
    researchForm.result.style.display = "none";
    researchForm.error.style.display = "none";
    researchForm.loading.style.display = "block";

    // Perform research
    const result = await getResearch(query);

    // Create HTML to display results
    let html = "<h4>Research Results:</h4>";

    // Display summaries
    for (const page of result) {
      html += `
        <div style="margin-bottom: 1.5rem; padding: 1rem; border: 1px solid #ddd; border-radius: 4px;">
          <h5 style="margin-top: 0;">${page.title}</h5>
          <p style="font-size: 0.9rem; color: #666;">${page.url}</p>
          <p>length: ${page.content.length}</p>
          <p>${page.content}</p>
        </div>
      `;
    }

    // Display results
    researchForm.resultContent.innerHTML = html;
    researchForm.result.style.display = "block";
  } catch (error) {
    researchForm.error.textContent = `Error: ${error.message}`;
    researchForm.error.style.display = "block";
  } finally {
    researchForm.loading.style.display = "none";
  }
});

// Place info tab functionality
const placeForm = {
  name: document.getElementById("place-name"),
  address: document.getElementById("place-address"),
  button: document.getElementById("place-button"),
  loading: document.getElementById("place-loading"),
  error: document.getElementById("place-error"),
  result: document.getElementById("place-result"),
  resultContent: document.getElementById("place-result-content"),
  resultJSON: document.getElementById("place-result-json"),
};

placeForm.button.addEventListener("click", async () => {
  const name = placeForm.name.value.trim();
  const address = placeForm.address.value.trim();

  if (!name) {
    placeForm.error.textContent = "Please enter a place name";
    placeForm.error.style.display = "block";
    return;
  }

  try {
    // Hide previous results and show loading
    placeForm.result.style.display = "none";
    placeForm.error.style.display = "none";
    placeForm.loading.style.display = "block";

    // Get place info
    const place = await getPlaceInfo(name, address);

    // Create a place card to display the result
    const placeCard = document.createElement("place-card");
    placeCard.place = place;

    // Display results
    placeForm.resultContent.innerHTML = "";
    placeForm.resultContent.appendChild(placeCard);
    placeForm.resultJSON.textContent = formatJSON(place);
    placeForm.result.style.display = "block";
  } catch (error) {
    placeForm.error.textContent = `Error: ${error.message}`;
    placeForm.error.style.display = "block";
  } finally {
    placeForm.loading.style.display = "none";
  }
});

// Place Research tab functionality
const placeResearchForm = {
  query: document.getElementById("place-research-query"),
  city: document.getElementById("place-research-city"),
  state: document.getElementById("place-research-state"),
  country: document.getElementById("place-research-country"),
  button: document.getElementById("place-research-button"),
  loading: document.getElementById("place-research-loading"),
  error: document.getElementById("place-research-error"),
  result: document.getElementById("place-research-result"),
  resultContent: document.getElementById("place-research-result-content"),
};

placeResearchForm.button.addEventListener("click", async () => {
  const query = placeResearchForm.query.value.trim();
  const city = placeResearchForm.city.value.trim();
  const state = placeResearchForm.state.value.trim();
  const country = placeResearchForm.country.value.trim();

  if (!query || !city || !country) {
    placeResearchForm.error.textContent = "Please enter all required fields";
    placeResearchForm.error.style.display = "block";
    return;
  }

  try {
    // Hide previous results and show loading
    placeResearchForm.result.style.display = "none";
    placeResearchForm.error.style.display = "none";
    placeResearchForm.loading.style.display = "block";

    // Set up the destination object
    const destination = {
      city: city,
      state: state,
      country: country,
      region: "", // Optional, not required for the test
    };

    // Perform place research
    const places = await getPlaceResearch(query, destination);

    // Create HTML for place cards
    placeResearchForm.resultContent.innerHTML = "";

    if (places.length === 0) {
      placeResearchForm.resultContent.innerHTML = `
        <div style="padding: 1rem; text-align: center; background-color: #f9f9f9; border-radius: 4px;">
          No places found matching your criteria.
        </div>
      `;
    } else {
      // Create a heading
      const heading = document.createElement("h4");
      heading.textContent = `Places in ${city}, ${country}`;
      heading.style.marginBottom = "1rem";
      placeResearchForm.resultContent.appendChild(heading);

      // Create a card carousel for the places
      const carousel = document.createElement("card-carousel");

      // Create place cards and add them to the carousel
      const placeCards = places.map((place) => {
        const placeCard = document.createElement("place-card");
        // Store the full place data on the element
        placeCard.place = place;
        return placeCard;
      });

      carousel.cards = placeCards;
      placeResearchForm.resultContent.appendChild(carousel);
    }

    // Show results
    placeResearchForm.result.style.display = "block";
  } catch (error) {
    placeResearchForm.error.textContent = `Error: ${error.message}`;
    placeResearchForm.error.style.display = "block";
  } finally {
    placeResearchForm.loading.style.display = "none";
  }
});

// Stay Research tab functionality
const stayResearchForm = {
  query: document.getElementById("stay-research-query"),
  button: document.getElementById("stay-research-button"),
  loading: document.getElementById("stay-research-loading"),
  error: document.getElementById("stay-research-error"),
  result: document.getElementById("stay-research-result"),
  resultContent: document.getElementById("stay-research-result-content"),
};

stayResearchForm.button.addEventListener("click", async () => {
  const query = stayResearchForm.query.value.trim();

  if (!query) {
    stayResearchForm.error.textContent = "Please enter a research query";
    stayResearchForm.error.style.display = "block";
    return;
  }

  try {
    // Hide previous results and show loading
    stayResearchForm.result.style.display = "none";
    stayResearchForm.error.style.display = "none";
    stayResearchForm.loading.style.display = "block";

    // Perform stay research
    const stays = await getStayResearch(query);

    // Create HTML for stay results
    stayResearchForm.resultContent.innerHTML = "";

    if (stays.length === 0) {
      stayResearchForm.resultContent.innerHTML = `
        <div style="padding: 1rem; text-align: center; background-color: #f9f9f9; border-radius: 4px;">
          No destinations found matching your criteria.
        </div>
      `;
    } else {
      // Create a heading
      const heading = document.createElement("h4");
      heading.textContent = "Suggested Destinations";
      heading.style.marginBottom = "1rem";
      stayResearchForm.resultContent.appendChild(heading);

      // Create a card carousel for destinations
      const carousel = document.createElement("card-carousel");

      // Create city cards and add them to the carousel
      const cityCards = stays.map((stay, index) => {
        const cityCard = document.createElement("city-card");

        // Store the complete stay data on the card
        cityCard.stay = {
          destination: stay.destination,
          description: stay.description,
          options: stay.options || [],
          arrival_time: Date.now() / 1000 + 86400, // Example arrival time (tomorrow)
          departure_time: Date.now() / 1000 + 86400 * 7, // Example departure time (in a week)
          weather: stay.weather || [],
        };

        cityCard.style.cursor = "pointer";
        cityCard.setAttribute("data-index", index);

        // Add click event to show detailed itinerary
        cityCard.addEventListener("click", () => {
          // Hide all detailed itineraries
          document.querySelectorAll(".stay-details").forEach((el) => {
            el.style.display = "none";
          });

          // Show the clicked one
          const detailsEl = document.getElementById(`stay-details-${index}`);
          if (detailsEl) {
            detailsEl.style.display = "block";
          }
        });

        return cityCard;
      });

      carousel.cards = cityCards;
      carousel.style.marginBottom = "2rem";
      stayResearchForm.resultContent.appendChild(carousel);

      // Add detailed itineraries (hidden by default)
      const itinerariesContainer = document.createElement("div");

      stays.forEach((stay, index) => {
        const detailsContainer = document.createElement("div");
        detailsContainer.id = `stay-details-${index}`;
        detailsContainer.className = "stay-details";
        detailsContainer.style.display = "none";
        detailsContainer.style.marginTop = "2rem";
        detailsContainer.style.padding = "1rem";
        detailsContainer.style.border = "1px solid #ddd";
        detailsContainer.style.borderRadius = "8px";

        const backButton = document.createElement("button");
        backButton.textContent = "← Back to All Destinations";
        backButton.style.marginBottom = "1rem";
        backButton.addEventListener("click", () => {
          detailsContainer.style.display = "none";
        });

        detailsContainer.appendChild(backButton);

        const stayItinerary = document.createElement("stay-itinerary");
        stayItinerary.stay = stay;

        detailsContainer.appendChild(stayItinerary);
        itinerariesContainer.appendChild(detailsContainer);
      });

      stayResearchForm.resultContent.appendChild(itinerariesContainer);
    }

    // Show results
    stayResearchForm.result.style.display = "block";
  } catch (error) {
    stayResearchForm.error.textContent = `Error: ${error.message}`;
    stayResearchForm.error.style.display = "block";
  } finally {
    stayResearchForm.loading.style.display = "none";
  }
});

// Set default dates for the weather form (last 7 days)
const today = new Date();
const oneWeekAgo = new Date();
oneWeekAgo.setDate(today.getDate() - 7);

weatherForm.startDate.valueAsDate = oneWeekAgo;
weatherForm.endDate.valueAsDate = today;
