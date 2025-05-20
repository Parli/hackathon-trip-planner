import "/search.js";

/**
 * https://www.npmjs.com/package/@mozilla/readability
 * @example const article = new Readability(document).parse();
 * Readability.prototype.constructor
 * @param {Document} doc     The document to parse.
 * @param {Object}   options The options object.
 */
/**
 * Readability.prototype.parse
 * @returns {ReadabilityResult}
 * }
 */
/**
 * @typedef {Object} ReadabilityResult
 * @property {string} title string article title
 * @property {string} siteName name of the site
 * @property {string} textContent text content of the article, with all the HTML tags removed
 */
import { Readability } from "https://cdn.jsdelivr.net/npm/@mozilla/readability@0.6.0/+esm";

// Canonical JSON Schema description for trip itinerary artiface used to produce the page UI
const tripSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Trip Schema",
  description:
    "Schema for planning a detailed trip with destinations, accommodations, activities, and transportation",
  type: "object",
  definitions: {
    TravelDate: {
      type: "object",
      description: "A day granularity time for narrowing down potential dates",
      properties: {
        year: {
          type: "integer",
          description: "Year of travel",
        },
        month: {
          type: "integer",
          description: "Month of travel (1-12)",
        },
        day: {
          type: "integer",
          description: "Day of travel (1-31, depending on month)",
        },
        flexibility: {
          type: "string",
          enum: ["fixed", "somewhat_flexible", "very_flexible"],
          description: "How flexible the date is",
        },
      },
      required: ["year", "month", "day", "flexibility"],
    },
    Weather: {
      type: "object",
      description: "Data on weather for a specific time",
      properties: {
        condition: {
          type: "string",
          enum: [
            "sunny",
            "partly_cloudy",
            "cloudy",
            "foggy",
            "light_rain",
            "moderate_rain",
            "heavy_rain",
            "stormy",
            "thunderstorm",
            "light_snow",
            "moderate_snow",
            "heavy_snow",
            "hail",
            "windy",
          ],
          description: "Weather condition during the time period",
        },
        temperature: {
          type: "number",
          description: "Temperature (in degrees, presumably Celsius)",
        },
        start_time: {
          type: "number",
          description: "Start timestamp of the weather condition (in seconds)",
        },
        end_time: {
          type: "number",
          description: "End timestamp of the weather condition (in seconds)",
        },
      },
      required: ["condition", "temperature", "start_time", "end_time"],
    },
    Destination: {
      type: "object",
      description:
        "An area-based location as opposed to a specific place, like a city, country, or region",
      properties: {
        name: {
          type: "string",
          description: "Name of the destination",
        },
        neighborhood: {
          type: ["string", "null"],
          description: "Neighborhood within the destination, if applicable",
        },
        city: {
          type: ["string", "null"],
          description: "City of the destination, if applicable",
        },
        country: {
          type: ["string", "null"],
          description: "Country of the destination, if applicable",
        },
        region: {
          type: ["string", "null"],
          description: "Region of the destination, if applicable",
        },
      },
      required: ["name"],
    },
    Place: {
      type: "object",
      description:
        "A specific location, like a venue, hotel, park, restaurant, etc. that the user may want to visit",
      properties: {
        kind: {
          type: "string",
          enum: [
            "accommodation",
            "food",
            "landmark",
            "visit",
            "experience",
            "event",
            "transit",
          ],
          description:
            "The type of place - accommodation (for stays), food (restaurants/markets), landmark (to look at), visit (flexible timing like museums/parks), experience (requires booking but multiple slots available), event (specific time), transit (airports/stations)",
        },
        name: {
          type: "string",
          description: "Name of the place",
        },
        category: {
          type: ["array", "null"],
          items: {
            type: "string",
          },
          description:
            "More specific categories of the kind of place (e.g., Chinese Restaurant, Aerospace Museum, etc.)",
        },
        description: {
          type: "string",
          description: "Short description about the place",
        },
        coordinates: {
          type: "object",
          description: "Exact location of the place",
          properties: {
            latitude: {
              type: "number",
              description: "Latitude coordinate",
            },
            longitude: {
              type: "number",
              description: "Longitude coordinate",
            },
          },
          required: ["latitude", "longitude"],
        },
        destination: {
          $ref: "#/definitions/Destination",
          description: "Broad location of the place",
        },
        notes: {
          type: ["string", "null"],
          description:
            "Useful information the user should know about the place",
        },
        tips: {
          type: ["string", "null"],
          description:
            "Longer explanation of things that could help the user in markdown format",
        },
        open_time: {
          type: ["number", "null"],
          description: "When the place opens for entry (timestamp in seconds)",
        },
        close_time: {
          type: ["number", "null"],
          description: "When the place closes or ends (timestamp in seconds)",
        },
        url: {
          type: ["string", "null"],
          description: "URL for the place",
        },
        rating: {
          type: ["number", "null"],
          description: "Rating from 0-10",
        },
        budget: {
          type: ["string", "null"],
          enum: ["free", "cheap", "moderate", "splurge", "expensive"],
          description: "Relative budget level",
        },
        cost: {
          type: ["number", "null"],
          description: "Exact cost in USD",
        },
        interest_level: {
          type: ["string", "null"],
          enum: ["maybe", "interested", "must_do"],
          description: "Level of interest in visiting this place",
        },
        physical_level: {
          type: ["string", "null"],
          enum: ["light", "moderate", "active"],
          description: "Level of physical activity required",
        },
        booking_required: {
          type: ["boolean", "null"],
          description: "Whether booking is required",
        },
        booking_deadline: {
          type: ["number", "null"],
          description: "Deadline for booking (timestamp in seconds)",
        },
        availability: {
          type: ["string", "null"],
          enum: ["low", "medium", "high"],
          description: "Availability level",
        },
        setting: {
          type: ["string", "null"],
          enum: ["indoor", "outdoor", "mixed"],
          description: "Whether the place is indoor, outdoor, or mixed",
        },
        time_minutes_allocation: {
          type: ["number", "null"],
          description: "Recommended time to spend at this place in minutes",
        },
      },
      required: ["kind", "name", "description", "coordinates", "destination"],
    },
    Schedule: {
      type: "object",
      description:
        "Type to express things that will happen over a specific time",
      properties: {
        start_time: {
          type: "number",
          description: "Start timestamp (in seconds)",
        },
        end_time: {
          type: "number",
          description: "End timestamp (in seconds)",
        },
      },
      required: ["start_time", "end_time"],
    },
    Plan: {
      type: "object",
      description:
        "A time-sensitive activity associated with a place, like a concert, hotel check-in, or plan to go to a museum",
      allOf: [
        { $ref: "#/definitions/Schedule" },
        {
          properties: {
            kind: {
              type: "string",
              enum: ["plan"],
              description: "Type identifier for a plan",
            },
            location: {
              $ref: "#/definitions/Place",
              description: "The place where the plan takes place",
            },
          },
          required: ["kind", "location"],
        },
      ],
    },
    Transportation: {
      type: "object",
      description: "Plans for getting around",
      allOf: [
        { $ref: "#/definitions/Schedule" },
        {
          properties: {
            kind: {
              type: "string",
              enum: ["transportation"],
              description: "Type identifier for transportation",
            },
            departure: {
              $ref: "#/definitions/Place",
              description: "Place of departure",
            },
            arrival: {
              $ref: "#/definitions/Place",
              description: "Place of arrival",
            },
            mode: {
              type: "string",
              enum: [
                "plane",
                "train",
                "bus",
                "car",
                "taxi",
                "bike",
                "boat",
                "ferry",
                "subway",
                "tram",
                "walk",
              ],
              description: "Mode of transportation",
            },
          },
          required: ["kind", "departure", "arrival", "mode"],
        },
      ],
    },
  },
  properties: {
    title: {
      type: "string",
      description: "Name of the trip",
    },
    timeline: {
      type: "object",
      description: "Timeline information for the trip",
      properties: {
        start_date: {
          $ref: "#/definitions/TravelDate",
          description: "Starting tentative date for travel",
        },
        end_date: {
          $ref: "#/definitions/TravelDate",
          description: "Ending tentative date for travel",
        },
        trip_days: {
          type: "integer",
          description: "Number of days you can travel for",
        },
      },
      required: ["start_date", "end_date", "trip_days"],
    },
    preferences: {
      type: "object",
      description:
        "General preferences and important information for the entire trip",
      properties: {
        origin: {
          $ref: "#/definitions/Place",
          description: "Where you're coming from",
        },
        traveler_count: {
          type: "integer",
          description: "Number of people traveling",
        },
        pace: {
          type: "string",
          enum: ["relaxed", "moderate", "intense"],
          description: "How much you want to pack into the trip",
        },
        morning_type: {
          type: "string",
          enum: ["early_bird", "standard_riser", "late_riser"],
          description: "Prefer doing things earlier or later",
        },
        budget_level: {
          type: "string",
          enum: ["shoestring", "budget", "value", "premium", "luxury"],
          description: "How much the traveler wants to spend",
        },
        special_needs: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Open-ended extra considerations",
        },
      },
      required: [
        "origin",
        "traveler_count",
        "pace",
        "morning_type",
        "budget_level",
        "special_needs",
      ],
    },
    stays: {
      type: "array",
      description: "Travel stays with plans for destinations",
      items: {
        type: "object",
        properties: {
          destination: {
            $ref: "#/definitions/Destination",
            description: "The destination of the stay",
          },
          description: {
            type: "string",
            description: "Description of the stay",
          },
          photos: {
            type: "array",
            items: {
              type: "string",
            },
            description: "URLs of pictures of the place",
          },
          arrival_time: {
            type: ["number", "null"],
            description:
              "Time you will arrive at the destination (timestamp in seconds)",
          },
          departure_time: {
            type: ["number", "null"],
            description:
              "Time you will depart the destination (timestamp in seconds)",
          },
          options: {
            type: "array",
            items: {
              $ref: "#/definitions/Place",
            },
            description: "Options of things to choose from in the city",
          },
          day_plans: {
            type: "array",
            items: {
              oneOf: [
                { $ref: "#/definitions/Transportation" },
                { $ref: "#/definitions/Plan" },
              ],
            },
            description: "Specific plans that were chosen from options",
          },
          weather: {
            type: "array",
            items: {
              $ref: "#/definitions/Weather",
            },
            description: "Weather events",
          },
        },
        required: [
          "destination",
          "description",
          "photos",
          "options",
          "day_plans",
          "weather",
        ],
      },
    },
  },
  required: ["title", "timeline", "preferences", "stays"],
};

/**
 * Generates a set of search queries that would be able to find data to fulfill the user message request
 * @param {string} message User message
 * @returns {Array.<string>} Search query strings to fulfill the user request
 */
async function getQueryPlan() {
  // Prompt AI SDK to get search queries that are likely to find content the user needs
}

/**
 * A page content result
 * @typedef {Object} PageContent
 * @property {string} url
 * @property {string} siteName
 * @property {string} title
 * @property {string} content
 */

/**
 * Gets a web page and returns its content
 * The content may be filtered for main content
 * The content may or may not contain HTML
 * @param {string} url URL of the page to retrieve content from
 * @returns {PageContent} Main content pulled from the web page
 */
async function getPageContent(url) {
  // Hit Proxy API endpoint to get web page content
  // Return main text content using readability algorithm
}

/**
 * A search result
 * @typedef {Object} PageSummary
 * @property {PageContent} page
 * @property {string} summary
 */

/**
 * Given a user input request, search the web and get page results and synthesizes them
 * @param {string} message User message
 * @returns {Array.<PageSummary>} Pages with an accompanying summary of the page data
 *  that contains relavant information to fulfill the user message
 */
async function getResearch(message) {
  // Get queries for the user message
  const queries = await getQueryPlan(message);
  // Get search results from the queries
  const searches = await Promise.all(
    queries.map((query) => getWebSearch(query))
  );
  const urls = []; // Extract urls to retrieve and make them unique
  // Get page content from the search results
  const pages = await Promise.all(urls.map((url) => getPageContent(url)));
  // Use LLM to summarize the pages to filter data tailored to the user message
}

/**
 * Given a user input request, search the web and get page results and synthesizes them
 * @param {string} placeName User message
 * @returns {Place} A place object as defined from the trip JSON Schema
 */
async function getPlaceInfo(placeName, address) {
  // Do a SERPER web search
  const search = await getWebSearch(`${placeName} ${address}`);
  // Extract URLs for the place homepage,

  // Use an LLM to process page data and convert it to the place info for data that is not already structured
}
