// Dashboard for testing the research and search functionality
import { getSearch, getHistoricWeather, getWebSearch } from "/search.js";
import {
  getQueryPlan,
  getPageContent,
  getResearch,
  getPlaceInfo,
} from "/research.js";
import "./components/place-card.js";

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
    const result = await getSearch(query, searchType);

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
    pageContentForm.text.innerHTML = textContent
      .split("\n")
      .map((line) => (line.trim() ? `<p>${line}</p>` : "<br>"))
      .join("");

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
    for (const pageSummary of result) {
      html += `
        <div style="margin-bottom: 1.5rem; padding: 1rem; border: 1px solid #ddd; border-radius: 4px;">
          <h5 style="margin-top: 0;">${pageSummary.page.title}</h5>
          <p style="font-size: 0.9rem; color: #666;">${pageSummary.page.url}</p>
          <p>${pageSummary.summary}</p>
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

// Set default dates for the weather form (last 7 days)
const today = new Date();
const oneWeekAgo = new Date();
oneWeekAgo.setDate(today.getDate() - 7);

weatherForm.startDate.valueAsDate = oneWeekAgo;
weatherForm.endDate.valueAsDate = today;
