/**
 * @typedef {Object} SearchParameters
 * @property {string} q - The search query
 * @property {string} type - The type of search (e.g., "search", "places", "maps", "images")
 * @property {string} [location] - The location context for the search (used in search and places)
 * @property {string} [ll] - The latitude/longitude coordinates with zoom level (used in maps)
 * @property {string} engine - The search engine used (e.g., "google")
 * @property {string} [gl] - The country code for the search (e.g., "us")
 * @property {number} [num] - The number of results to return (used in images)
 */

import { showUpdate } from "/updater.js";

/**
 * @typedef {Object} KnowledgeGraphAttributes
 * @property {string} Address - The business address
 * @property {string} Hours - The business hours information
 * @property {string} Phone - The business phone number
 */

/**
 * @typedef {Object} KnowledgeGraph
 * @property {string} title - The title of the business or entity
 * @property {string} type - The type of business or entity
 * @property {number} rating - The average rating (typically out of 5)
 * @property {number} ratingCount - The number of ratings/reviews
 * @property {string} imageUrl - URL to the entity's image
 * @property {string} description - A brief description of the entity
 * @property {KnowledgeGraphAttributes} attributes - Additional attributes about the entity
 */

/**
 * @typedef {Object} OrganicResultAttributes
 * @property {string} [Missing] - Information about what might be missing from the result
 */

/**
 * @typedef {Object} OrganicResult
 * @property {string} title - The title of the search result
 * @property {string} link - The URL of the search result
 * @property {string} snippet - A brief excerpt or description of the result
 * @property {number} [rating] - The rating of the entity (if applicable)
 * @property {number} [ratingCount] - The number of ratings/reviews (if applicable)
 * @property {string} [priceRange] - The price range indicator (e.g., "$$")
 * @property {OrganicResultAttributes} [attributes] - Additional attributes about the result
 * @property {number} position - The position of the result in the search results page
 */

/**
 * @typedef {Object} RelatedSearch
 * @property {string} query - A related search query suggestion
 */

/**
 * @typedef {Object} OpeningHours
 * @property {string} Monday - Operating hours for Monday
 * @property {string} Tuesday - Operating hours for Tuesday
 * @property {string} Wednesday - Operating hours for Wednesday
 * @property {string} Thursday - Operating hours for Thursday
 * @property {string} Friday - Operating hours for Friday
 * @property {string} Saturday - Operating hours for Saturday
 * @property {string} Sunday - Operating hours for Sunday
 */

/**
 * @typedef {Object} Place
 * @property {number} position - The position of the place in search results
 * @property {string} title - The name of the place
 * @property {string} address - The full address of the place
 * @property {number} latitude - The geographical latitude coordinate
 * @property {number} longitude - The geographical longitude coordinate
 * @property {number} rating - The average rating (typically out of 5)
 * @property {number} ratingCount - The number of ratings/reviews
 * @property {string} priceLevel - The price range indicator (e.g., "$10–20")
 * @property {string} [category] - The category or type of place (in places results)
 * @property {string} [type] - The primary category or type of place (in maps results)
 * @property {string[]} [types] - Array of all categories or types associated with the place (in maps results)
 * @property {string} phoneNumber - The contact phone number
 * @property {OpeningHours} [openingHours] - Business hours for each day of the week (in maps results)
 * @property {string} [thumbnailUrl] - URL to the thumbnail image of the place (in maps results)
 * @property {string} cid - The unique Google client ID for the place
 * @property {string} [fid] - The unique Google feature ID for the place (in maps results)
 * @property {string} [placeId] - The unique Google place ID (in maps results)
 */

/**
 * @typedef {Object} ImageResult
 * @property {string} title - The title of the image result
 * @property {string} imageUrl - The URL to the full-size image
 * @property {number} imageWidth - The width of the full-size image in pixels
 * @property {number} imageHeight - The height of the full-size image in pixels
 * @property {string} thumbnailUrl - The URL to the thumbnail image
 * @property {number} thumbnailWidth - The width of the thumbnail image in pixels
 * @property {number} thumbnailHeight - The height of the thumbnail image in pixels
 * @property {string} source - The name of the source website
 * @property {string} domain - The domain of the source website
 * @property {string} link - The URL to the webpage containing the image
 * @property {string} googleUrl - The Google URL that redirects to the image
 * @property {number} position - The position of the result in the search results
 */

/**
 * @typedef {Object} SerperResult
 * @property {SearchParameters} searchParameters - Parameters used for the search
 * @property {KnowledgeGraph} [knowledgeGraph] - Knowledge graph information about the entity (in search results)
 * @property {OrganicResult[]} [organic] - List of organic search results (in search results)
 * @property {RelatedSearch[]} [relatedSearches] - List of related search queries (in search results)
 * @property {Place[]} [places] - Array of place results (in places and maps results)
 * @property {ImageResult[]} [images] - Array of image results (in images results)
 * @property {number} credits - Credits used or associated with the search
 */

/**
 * Searches web results against a query
 * @param {string} query Queries to search against SERPER web search API
 * @param {Object} options Search options
 * @param {"search"|"images"|"places"|"maps"} options.type Type of query to search against SERPER web search API
 * @param {number} options.count Number of results to retrieve
 * @returns {Promise<SerperResult>} SERPER Search result object
 */
async function getSearch(query, { type = "search", count = 5 } = {}) {
  try {
    const url = `/api/proxy/https://google.serper.dev/${type}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": "${SERPER_API_KEY}",
      },
      body: JSON.stringify({
        q: query,
        gl: "us",
        num: count,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Search API error: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    showUpdate(`🔎 Search completed`);
    return result;
  } catch (error) {
    showUpdate(`❌ Search failed`);
    console.error("Error in getSearch:", error);
    throw error;
  }
}

/**
 * @typedef {Object} WeatherData
 * @property {number} latitude - Geographic latitude coordinate
 * @property {number} longitude - Geographic longitude coordinate
 * @property {number} generationtime_ms - Time taken to generate the data in milliseconds
 * @property {number} utc_offset_seconds - UTC offset in seconds
 * @property {string} timezone - Timezone name
 * @property {string} timezone_abbreviation - Timezone abbreviation
 * @property {number} elevation - Elevation in meters
 *
 * @property {Object} daily_units - Units for daily measurements
 * @property {string} daily_units.time - Time unit format
 * @property {string} daily_units.weather_code - Weather code unit
 * @property {string} daily_units.temperature_2m_mean - Mean temperature unit
 * @property {string} daily_units.temperature_2m_max - Maximum temperature unit
 * @property {string} daily_units.temperature_2m_min - Minimum temperature unit
 * @property {string} daily_units.sunrise - Sunrise time format
 * @property {string} daily_units.sunset - Sunset time format
 * @property {string} daily_units.precipitation_sum - Precipitation sum unit
 * @property {string} daily_units.rain_sum - Rain sum unit
 * @property {string} daily_units.snowfall_sum - Snowfall sum unit
 * @property {string} daily_units.wind_speed_10m_max - Maximum wind speed unit
 * @property {string} daily_units.wind_gusts_10m_max - Maximum wind gusts unit
 *
 * @property {Object} daily - Daily weather data
 * @property {string[]} daily.time - Array of dates in ISO 8601 format
 * @property {number[]} daily.weather_code - Array of WMO weather codes
 * @property {number[]} daily.temperature_2m_mean - Array of mean temperatures in °C
 * @property {number[]} daily.temperature_2m_max - Array of maximum temperatures in °C
 * @property {number[]} daily.temperature_2m_min - Array of minimum temperatures in °C
 * @property {string[]} daily.sunrise - Array of sunrise times in ISO 8601 format
 * @property {string[]} daily.sunset - Array of sunset times in ISO 8601 format
 * @property {number[]} daily.precipitation_sum - Array of precipitation sums in mm
 * @property {number[]} daily.rain_sum - Array of rain sums in mm
 * @property {number[]} daily.snowfall_sum - Array of snowfall sums in cm
 * @property {number[]} daily.wind_speed_10m_max - Array of maximum wind speeds in km/h
 * @property {number[]} daily.wind_gusts_10m_max - Array of maximum wind gusts in km/h
 */

/**
 * Searches historical weather data
 * @param {{latitude:number,longitude:number}} coordinates
 * @param {Timestamp} startDate Unix timestamp in seconds
 * @param {Timestamp} endDate Unix timestamp in seconds
 * @returns {Promise<WeatherData>} Open-meteo historic weather result object
 */
async function getHistoricWeather(coordinates, startDate, endDate) {
  try {
    // Convert timestamps to YYYY-MM-DD format
    const formatDate = (timestamp) => {
      const date = new Date(timestamp * 1000);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(date.getDate()).padStart(2, "0")}`;
    };

    const startDateFormatted = formatDate(startDate);
    const endDateFormatted = formatDate(endDate);

    // Create the API URL with query parameters
    const url =
      `/api/proxy/https://archive-api.open-meteo.com/v1/archive?` +
      `latitude=${coordinates.latitude}&` +
      `longitude=${coordinates.longitude}&` +
      `start_date=${startDateFormatted}&` +
      `end_date=${endDateFormatted}&` +
      `daily=weather_code,temperature_2m_mean,temperature_2m_max,temperature_2m_min,sunrise,sunset,` +
      `precipitation_sum,rain_sum,snowfall_sum,wind_speed_10m_max,wind_gusts_10m_max`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Weather API error: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    showUpdate(`🌡️ Weather retrieved`);
    return result;
  } catch (error) {
    showUpdate(`❌ Weather lookup failed`);
    console.error("Error in getHistoricWeather:", error);
    throw error;
  }
}

/**
 * Gets location information from coordinates using HERE API
 * @param {{latitude:number,longitude:number}} coordinates - Object containing latitude and longitude
 * @returns {Promise<Destination>} - Returns a Promise that resolves to a Destination object
 */
async function getCoordinatesLocation({ latitude, longitude }) {
  try {
    // Create the API URL with query parameters
    const url =
      `/api/proxy/https://revgeocode.search.hereapi.com/v1/revgeocode?` +
      `at=${latitude},${longitude}&` +
      `apiKey=\${HERE_API_KEY}&limit=1&show=countryInfo,streetInfo`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `HERE API error: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    showUpdate(`📍 Location retrieved`);
    const address = result.items[0]?.address;

    return {
      neighborhood: address.district ?? null,
      city: address.city ?? null,
      state: (address.countryCode === "USA" && address.stateCode) || null,
      country: address.countryName ?? null,
      region: null,
    };
  } catch (error) {
    showUpdate(`❌ Location lookup failed`);
    console.error("Error in getCoordinatesLocation:", error);
    throw error;
  }
}

export { getSearch, getHistoricWeather, getCoordinatesLocation };
