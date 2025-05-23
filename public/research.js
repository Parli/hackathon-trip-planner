import {
  getSearch,
  getHistoricWeather,
  getCoordinatesLocation,
} from "/search.js";
import { showUpdate } from "/updater.js";

// `ai` Vercel AI SDK https://ai-sdk.dev/docs/
import {
  generateObject,
  generateText,
  createProviderRegistry,
  jsonSchema,
} from "https://cdn.jsdelivr.net/npm/ai@4.3.15/+esm";
// `@ai-sdk/openai` Vercel AI SDK OpenAI Provider https://ai-sdk.dev/providers/ai-sdk-providers/openai
import { createOpenAI } from "https://cdn.jsdelivr.net/npm/@ai-sdk/openai@1.3.22/+esm";
// `@ai-sdk/anthropic` Vercel AI SDK Anthropic Provider https://ai-sdk.dev/providers/ai-sdk-providers/anthropic
import { createAnthropic } from "https://cdn.jsdelivr.net/npm/@ai-sdk/anthropic@1.2.11/+esm";
// `@ai-sdk/google` Vercel AI SDK Google Provider https://ai-sdk.dev/providers/ai-sdk-providers/google
import { createGoogleGenerativeAI } from "https://cdn.jsdelivr.net/npm/@ai-sdk/google@1.2.18/+esm";

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
import {
  Readability,
  isProbablyReaderable,
} from "https://cdn.jsdelivr.net/npm/@mozilla/readability@0.6.0/+esm";

// Shared config
const defaultProvider = "google";
const defaultObjectProvider = "openai";

// Mapping of models for each provider
const modelMap = {
  openai: {
    object: "gpt-4o-2024-08-06",
    fast: "gpt-4.1-nano-2025-04-14",
    standard: "gpt-4.1-mini-2025-04-14",
    best: "gpt-4.1",
  },
  anthropic: {
    object: "claude-3-5-sonnet-20241022",
    fast: "claude-3-5-haiku-20241022",
    standard: "claude-3-5-sonnet-20241022",
    best: "claude-3-7-sonnet-latest",
  },
  google: {
    object: "gemini-2.0-flash",
    fast: "gemini-2.0-flash",
    standard: "gemini-2.5-flash-preview-04-17",
    best: "gemini-2.5-pro-preview-05-06",
  },
};

const defaultModel = `${defaultProvider}:${modelMap[defaultProvider]["standard"]}`;
const defaultObjectModel = `${defaultObjectProvider}:${modelMap[defaultObjectProvider]["object"]}`;

// Initialize providers with the proxy url and server side env var interpolation strings
// https://ai-sdk.dev/docs/reference/ai-sdk-core/provider-registry
const registry = createProviderRegistry({
  openai: createOpenAI({
    baseURL: "/api/proxy/https://api.openai.com/v1",
    apiKey: "${OPENAI_API_KEY}",
  }),
  anthropic: createAnthropic({
    baseURL: "/api/proxy/https://api.anthropic.com/v1",
    apiKey: "${ANTHROPIC_API_KEY}",
  }),
  google: createGoogleGenerativeAI({
    baseURL: "/api/proxy/https://generativelanguage.googleapis.com/v1beta",
    apiKey: "${GEMINI_API_KEY}",
  }),
});

// Canonical JSON Schema description for trip itinerary artiface used to produce the page UI
// Travel Date Schema
const travelDateSchema = {
  title: "Travel Date Schema",
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
};

// Weather Schema
const weatherSchema = {
  title: "Weather Schema",
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
};

// Destination Schema
const destinationSchema = {
  title: "Destination Schema",
  type: "object",
  description:
    "An area-based location as opposed to a specific place, like a city, country, or region",
  properties: {
    neighborhood: {
      type: ["string", "null"],
      description: "Neighborhood within the destination, if applicable",
    },
    city: {
      type: ["string", "null"],
      description: "City of the destination, if applicable",
    },
    state: {
      type: ["string", "null"],
      description: "State/Province of the destination, if applicable",
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
};

// Coordinates Schema
const coordinatesSchema = {
  title: "Coordinates Schema",
  type: "object",
  description: "Exact location of a place",
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
};

// Place Schema
const placeSchema = {
  title: "Place Schema",
  type: "object",
  description:
    "A specific location, like a venue, hotel, park, restaurant, etc. that the user may want to visit",
  properties: {
    id: {
      type: "string",
      description: "Unique identifier for the place",
    },
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
    photos: {
      type: "array",
      items: {
        type: "string",
      },
      description: "URLs of pictures of the place",
    },
    address: {
      type: "string",
      description:
        "Best available full address of the place including number, street, city, country and zip code if available",
    },
    coordinates: coordinatesSchema,
    destination: destinationSchema,
    notes: {
      type: ["string", "null"],
      description: "Useful information the user should know about the place",
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
      description: "Rating from 0-5",
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
};

// Schedule Schema
const scheduleSchema = {
  title: "Schedule Schema",
  type: "object",
  description: "Type to express things that will happen over a specific time",
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
};

// Plan Schema
const planSchema = {
  title: "Plan Schema",
  type: "object",
  description:
    "A time-sensitive activity associated with a place, like a concert, hotel check-in, or plan to go to a museum",
  properties: {
    id: {
      type: "string",
      description: "Unique identifier for the plan",
    },
    // Schedule properties
    start_time: scheduleSchema.properties.start_time,
    end_time: scheduleSchema.properties.end_time,

    // Plan specific properties
    kind: {
      type: "string",
      enum: ["plan"],
      description: "Type identifier for a plan",
    },
    location: placeSchema,
  },
  required: ["start_time", "end_time", "kind", "location"],
};

// Transportation Schema
const transportationSchema = {
  title: "Transportation Schema",
  type: "object",
  description: "Plans for getting around",
  properties: {
    id: {
      type: "string",
      description: "Unique identifier for the transportation",
    },
    // Schedule properties
    start_time: scheduleSchema.properties.start_time,
    end_time: scheduleSchema.properties.end_time,

    // Transportation specific properties
    kind: {
      type: "string",
      enum: ["transportation"],
      description: "Type identifier for transportation",
    },
    departure: placeSchema,
    arrival: placeSchema,
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
  required: ["start_time", "end_time", "kind", "departure", "arrival", "mode"],
};

// Timeline Schema
const timelineSchema = {
  title: "Timeline Schema",
  type: "object",
  description: "Timeline information for the trip",
  properties: {
    start_date: travelDateSchema,
    end_date: travelDateSchema,
    trip_days: {
      type: "integer",
      description: "Number of days you can travel for",
    },
  },
  required: ["start_date", "end_date", "trip_days"],
};

// Preferences Schema
const preferencesSchema = {
  title: "Preferences Schema",
  type: "object",
  description:
    "General preferences and important information for the entire trip",
  properties: {
    origin: placeSchema,
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
    interests: {
      type: "array",
      items: {
        type: "string",
      },
      description:
        "A list of the kinds of things the traveler is interested in",
    },
    special_needs: {
      type: "string",
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
};

// Stay Schema
const staySchema = {
  title: "Stay Schema",
  type: "object",
  description: "Travel stay with plans for a destination",
  properties: {
    id: {
      type: "string",
      description: "Unique identifier for the stay",
    },
    destination: destinationSchema,
    description: {
      type: "string",
      description: "Description of the stay",
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
      items: placeSchema,
      description: "Options of things to choose from in the city",
    },
    day_plans: {
      type: "array",
      items: {
        oneOf: [transportationSchema, planSchema],
      },
      description: "Specific plans that were chosen from options",
    },
    weather: {
      type: "array",
      items: weatherSchema,
      description: "Weather events",
    },
  },
  required: ["destination"],
};

// Main Trip Schema
const tripSchema = {
  id: {
    type: "string",
    description: "Unique identifier for the trip",
  },
  title: "Trip Schema",
  description:
    "Schema for planning a detailed trip with destinations, accommodations, activities, and transportation",
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Name of the trip",
    },
    timeline: timelineSchema,
    preferences: preferencesSchema,
    stays: {
      type: "array",
      description: "Travel stays with plans for destinations",
      items: staySchema,
    },
  },
  required: ["title", "timeline", "preferences", "stays"],
};

/**
 * Generates a set of search queries that would be able to find data to fulfill the user message request
 * @param {string} message User message
 * @param {Object} options Query plan options
 * @param {number} options.count Max count of queries to generate
 * @returns {Promise<Array.<string>>} Search query strings to fulfill the user request
 */
async function getQueryPlan(message, { count = 8 } = {}) {
  try {
    // System prompt to guide query generation
    const systemPrompt = `
You are an AI assistant specialized in creating effective Google search query plans. Your task is to generate multiple simple search queries that, when combined, will find information to comprehensively answer a user's complex request.

Please follow these steps to create a query plan:

1. Analyze the user request carefully.
2. Break down the request into main topics and subtopics.
3. For each identified subtopic, create one or more simple search queries.
4. Ensure that all aspects of the user's request are covered by the queries.

Guidelines for creating queries:
- Keep each query simple and focused.
- Avoid using advanced search operators or complex Boolean logic.
- Use unambiguous keywords that are likely to appear in relevant articles.
- Use enough keywords to find relavant results, but not so many that it becomes too long tail.
- Consider including alternative terms or phrasings to broaden the search.
- Break down the main topics and subtopics.
- Use potential alternative terms for key concepts.
- Consider the search intent behind each subtopic.
- Queries should be diverse to avoid getting duplicate results.
- Queries should be written in keyword form.
- Queries should expand on the original input for related or sub topics that would help answer the user request

Output Format:
Provide the search queries as a JSON array of strings, where each string is a single search query. Maximum of ${count} queries.
For example:

User Example: "South east asia chill island vibes, affordable, relaxing, nature with comfort"

\`\`\`json
[
  "best island destinations southeast asia",
  "affordable island vacations southeast asia",
  "relaxing beach islands southeast asia",
  "southeast asia islands with natural beauty",
  "comfortable accommodation island southeast asia",
  "thailand indonesia philippines best islands",
  "boutique resorts southeast asia islands",
  "southeast asia islands good amenities",
]
\`\`\`
`;

    const { object: queries } = await generateObject({
      model: registry.languageModel(defaultObjectModel),
      output: "array",
      system: systemPrompt,
      prompt: message,
      schema: jsonSchema({
        type: "string",
      }),
    });
    showUpdate(`💡 Query planned`);

    return queries.slice(0, count);
  } catch (error) {
    showUpdate(`❌ Query plan failed`);
    console.error("Error in getQueryPlan:", error);
    throw error;
  }
}

/**
 * A page content result
 * @typedef {Object} PageContent
 * @property {string} url
 * @property {string} siteName
 * @property {string} title
 * @property {string} content
 * @property {boolean} success
 */

/**
 * Gets a web page and returns its content
 * The content may be filtered for main content
 * The content may or may not contain HTML
 * @param {string} url URL of the page to retrieve content from
 * @returns {Promise<PageContent>} Main content pulled from the web page
 */
async function getPageContent(url) {
  try {
    // Special handling for Reddit URLs
    if (url.includes("reddit.com")) {
      return await getRedditContent(url);
    }

    // Use the proxy endpoint to fetch the web page
    const proxyUrl = `/api/proxy/${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch page: ${response.status} ${response.statusText}`
      );
    }

    // Get the HTML content
    const html = await response.text();

    showUpdate(`📄 Page scraped`);

    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Use Readability to extract the main content
    // https://www.npmjs.com/package/@mozilla/readability
    const reader = new Readability(doc);
    const article = reader.parse();
    // If article couldn't be parsed, return the raw HTML

    if (!article || !isProbablyReaderable(doc)) {
      return {
        url,
        siteName:
          doc.querySelector('meta[property="og:site_name"]')?.content ||
          new URL(url).hostname,
        title: doc.title || "Unknown Title",
        content: [...doc.querySelectorAll("h1,h2,h3,h4,h5,h6,p")]
          .map((el) => el.textContent)
          .filter((text) => text)
          .join("\n")
          .slice(0, 10000),
        success: true,
      };
    }

    // Return the parsed article content
    const result = {
      url,
      siteName: article.siteName || new URL(url).hostname,
      title: article.title,
      content: article.textContent,
      success: true,
    };
    return result;
  } catch (error) {
    showUpdate(`❌ Scrape failed`);
    console.error("Error in getPageContent:", error);
    return {
      url,
      siteName: new URL(url).hostname,
      title: `Get Page Content Error ${url}: ${error.message}`,
      content: "",
      success: false,
    };
  }
}

/**
 * Gets content from a Reddit URL by using the JSON API
 * @param {string} url Reddit URL
 * @returns {Promise<PageContent>} Reddit content in markdown format
 */
async function getRedditContent(url) {
  try {
    // Add .json to the Reddit URL to get the JSON version
    const jsonUrl = url.endsWith("/") ? `${url}.json` : `${url}.json`;

    // Fetch the JSON directly from client side
    const response = await fetch(jsonUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch Reddit JSON: ${response.status}`);
    }

    const data = await response.json();

    showUpdate(`📄 Page scraped`);

    // Extract post information
    const post = data[0]?.data?.children[0]?.data;
    if (!post) {
      throw new Error("Could not find post data in Reddit JSON response");
    }

    // Get comments from the second part of the response
    const comments = data[1]?.data?.children || [];

    // Build markdown content
    let markdown = `# ${post.title}\n\n`;

    // Add post content if available
    if (post.selftext) {
      markdown += `${post.selftext}\n\n`;
    }

    markdown += `\n`;

    // Process comments recursively
    function processComments(comments, depth = 0) {
      let result = "";
      // Use > characters to indicate depth: >, >>, >>>, etc.
      const indent = ">".repeat(depth + 1) + " ";

      for (const comment of comments) {
        // Skip deleted/removed comments and non-comment objects
        if (
          comment.kind !== "t1" ||
          !comment.data ||
          comment.data.body === "[deleted]" ||
          comment.data.body === "[removed]"
        ) {
          continue;
        }

        // Add comment with proper indentation
        result += `${indent}${comment.data.body.replace(
          /\n+/g,
          "\n" + indent
        )}\n\n`;

        // Process replies recursively if they exist
        if (
          comment.data.replies &&
          comment.data.replies.data &&
          comment.data.replies.data.children
        ) {
          result += processComments(
            comment.data.replies.data.children,
            depth + 1
          );
        }
      }

      return result;
    }

    // Add comments to markdown
    markdown += processComments(comments);

    const result = {
      url,
      siteName: "Reddit",
      title: post.title,
      content: markdown,
      success: true,
    };
    return result;
  } catch (error) {
    console.error("Error fetching Reddit content:", error);

    showUpdate(`❌ Scrape failed`);
    // Return error info
    return {
      url,
      siteName: "Reddit",
      title: `Reddit Content Error: ${error.message}`,
      content: "",
      success: false,
    };
  }
}

/**
 * A search result
 * @typedef {Object} PageSummary
 * @property {PageContent} page
 * @property {string|null} summary
 */

/**
 * Given a user input request, search the web and get page results and synthesizes them
 * @param {string} message User message
 * @param {Object} options Research options
 * @param {number} options.queryCount Research options
 * @param {number} options.resultCount Research options
 * @returns {Promise<Array.<PageSummary>>} Pages with an accompanying summary of the page data
 *  that contains relavant information to fulfill the user message
 */
async function getResearch(message, { queryCount = 4, resultCount = 5 } = {}) {
  try {
    // Get queries for the user message
    console.log(`Generating search queries for: ${message}`);
    const queries = await getQueryPlan(message, { count: queryCount });
    console.log(`Generated ${queries.length} queries:`, queries);

    // Get search results from the queries
    const searches = await Promise.all(
      queries.map((query) => getSearch(query, "search", { count: resultCount }))
    );

    // Extract unique URLs from the search results
    const urlSet = new Set();
    searches.forEach((search) => {
      // Extract URLs from organic search results
      if (search.organic) {
        search.organic.forEach((result) => {
          if (result.link) urlSet.add(result.link);
        });
      }

      // Extract URLs from knowledge graph if present
      if (search.knowledgeGraph && search.knowledgeGraph.attributes) {
        const values = Object.values(search.knowledgeGraph.attributes);
        values.forEach((value) => {
          if (typeof value === "string" && value.startsWith("http")) {
            urlSet.add(value);
          }
        });
      }
    });

    const urls = Array.from(urlSet);
    console.log(`Fetching content from ${urls.length} unique URLs`);

    // Get page content from the search results
    const pages = await Promise.all(urls.map((url) => getPageContent(url)));
    return pages;
  } catch (error) {
    console.error("Error in getResearch:", error);
    throw error;
  }
}

/**
 * Given a user input request, search the web and get page results and convert them into a stay data structures
 * @param {string} message User message
 * @param {Object} options
 * @param {number} options.count Count of places to retrieve
 * @returns {Promise<Array.<Stay>>} Stays relevent to the user message
 *  that contains relavant information to fulfill the user message
 */
async function getStayResearch(message, { count = 3 } = {}) {
  try {
    // Get research for finding stays for the user request
    const research = await getResearch(
      `${message}\n\nContext: User is looking for trip destinations to stay and visit`,
      { queryCount: 4, resultCount: 3 }
    );
    const systemPrompt = `
Using the research provided, extract the best travel destinations that meet the user request.

Evaluate each location for whether they are appropriate for the user request.

Your output should provide a sorted array of objects with a destination and description.
It should be sorted based on relevancy to the user request.
There should be no duplicates in the output.
Each destination must be a specific city or town that can be visited.

The description should be short and tailored to the user request highlighting relavant aspects.

Research:

${JSON.stringify(research, null, 2)}
  `;
    const { object: stays } = await generateObject({
      model: registry.languageModel(defaultObjectModel),
      output: "array",
      system: systemPrompt,
      prompt: message,
      schema: jsonSchema({
        title: "Destination",
        type: "object",
        description: "Destination address and description",
        properties: {
          destination: {
            title: "Destination Schema",
            type: "object",
            description:
              "A city or town destination, some place where it's possible to stay",
            properties: {
              city: {
                type: ["string"],
                description: "Full city name of the destination",
              },
              state: {
                type: ["string"],
                description: "State/Province of the destination, if applicable",
              },
              country: {
                type: ["string"],
                description: "Full country name of the destination",
              },
              region: {
                type: ["string"],
                description:
                  "Best region description of the destination e.g. Europe, South East Asia, Great Lakes",
              },
            },
            required: ["city", "country", "region"],
          },
          description: {
            type: "string",
            description: "Description of the destination",
          },
        },
        required: ["destination", "description"],
      }),
    });
    showUpdate(`🌎 Destinations found`);

    console.log(
      `Found ${stays.length} destinations:`,
      stays.map(
        ({ destination }) =>
          `${destination?.city}, ${destination?.country}, ${destination?.region}`
      )
    );
    console.debug("stays results:", JSON.stringify(stays));

    const results = (
      await Promise.all(
        stays.slice(0, count).map(async (stay) => {
          try {
            const result = {
              id: crypto.randomUUID(),
              ...stay,
              options: await getPlaceResearch(message, stay.destination),
            };
            return result;
          } catch (error) {
            console.error("Error in getStayResearch:", error);
            return null;
          }
        })
      )
    ).filter(Boolean);

    return results;
  } catch (error) {
    showUpdate(`❌ Destination research failed`);
    throw error;
  }
}

/**
 * Extracts structured place information from web search results and content
 * @param {string} placeName Name of the place
 * @param {string} address Optional address or location context
 * @returns {Promise<Place>} A place object as defined in the trip JSON Schema
 */
async function getPlaceInfo(placeName, address = "") {
  try {
    // Do a SERPER web search
    const searchQuery = `${placeName} ${address}`.trim();
    console.log(`Searching for place info: ${searchQuery}`);

    // Run multiple search types concurrently
    const [search, mapsSearch, imagesSearch] = await Promise.all([
      getSearch(searchQuery, { type: "search" }),
      getSearch(searchQuery, { type: "maps" }),
      getSearch(searchQuery, { type: "images" }),
    ]);

    console.log(
      `Got results - Web: ${search.organic?.length || 0} results, Maps: ${
        mapsSearch.places?.length || 0
      } results, Images: ${imagesSearch.images?.length || 0} results`
    );

    // Extract data from search results
    let placeData = {
      name: placeName,
      description: "",
      coordinates: { latitude: 0, longitude: 0 },
      category: [],
      photos: [],
      rating: null,
      tips: null,
      budget: null,
      url: null,
      physical_level: null,
      setting: null,
    };

    // Use images search results for photos
    if (imagesSearch.images && imagesSearch.images.length > 0) {
      // Add up to 5 images from dedicated image search results
      imagesSearch.images.slice(0, 5).forEach((img) => {
        if (img.imageUrl && !placeData.photos.includes(img.imageUrl)) {
          placeData.photos.push(img.imageUrl);
        }
      });
    }

    // Try to extract structured data from the knowledge graph if available
    if (search.knowledgeGraph) {
      const kg = search.knowledgeGraph;
      placeData.name = kg.title || placeName;
      placeData.description = kg.description || "";
      placeData.rating = kg.rating || null;

      // Add image from knowledge graph if available
      if (kg.imageUrl) {
        placeData.photos.push(kg.imageUrl);
      }

      if (kg.attributes) {
        if (kg.attributes.Address) {
          placeData.notes = `Address: ${kg.attributes.Address}`;
        }

        if (kg.attributes.Hours) {
          placeData.tips = `Hours: ${kg.attributes.Hours}`;
        }
      }
    }

    // Extract data from maps results (which often has different/additional information)
    if (mapsSearch.places && mapsSearch.places.length > 0) {
      const mapPlace = mapsSearch.places[0];

      // Only override coordinates if we don't have them yet
      if (!placeData.coordinates.latitude && !placeData.coordinates.longitude) {
        placeData.coordinates = {
          latitude: mapPlace.latitude || 0,
          longitude: mapPlace.longitude || 0,
        };
      }

      // Add thumbnail from maps if available
      if (
        mapPlace.thumbnailUrl &&
        !placeData.photos.includes(mapPlace.thumbnailUrl)
      ) {
        placeData.photos.push(mapPlace.thumbnailUrl);
      }

      // If we have types from maps, use them to enhance categories
      if (mapPlace.types && mapPlace.types.length > 0) {
        mapPlace.types.forEach((type) => {
          if (!placeData.category.includes(type)) {
            placeData.category.push(type);
          }
        });
      }

      // Try to determine physical level and setting from types
      const types = mapPlace.types || [];
      if (
        types.some(
          (t) =>
            t.includes("hike") ||
            t.includes("trail") ||
            t.includes("mountain") ||
            t.includes("climb")
        )
      ) {
        placeData.physical_level = "active";
        placeData.setting = "outdoor";
      } else if (
        types.some(
          (t) => t.includes("walk") || t.includes("tour") || t.includes("park")
        )
      ) {
        placeData.physical_level = "moderate";
        placeData.setting = types.some((t) => t.includes("park"))
          ? "outdoor"
          : "mixed";
      }

      // Extract opening hours as additional tips
      if (mapPlace.openingHours) {
        const hoursText = Object.entries(mapPlace.openingHours)
          .map(([day, hours]) => `${day}: ${hours}`)
          .join("\n");

        placeData.tips = placeData.tips
          ? `${placeData.tips}\n\nHours:\n${hoursText}`
          : `Hours:\n${hoursText}`;
      }
    }

    // Determine basic place type
    const inferKind = () => {
      const name = placeData.name.toLowerCase();
      const category = placeData.category.join(" ").toLowerCase();

      // Check for accommodation
      if (
        category.includes("hotel") ||
        category.includes("motel") ||
        category.includes("resort") ||
        category.includes("inn") ||
        category.includes("hostel") ||
        name.includes("hotel") ||
        name.includes("motel") ||
        name.includes("resort") ||
        name.includes("stay")
      ) {
        return "accommodation";
      }

      // Check for food
      if (
        category.includes("restaurant") ||
        category.includes("café") ||
        category.includes("cafe") ||
        category.includes("bar") ||
        category.includes("pub") ||
        category.includes("bakery") ||
        category.includes("food")
      ) {
        return "food";
      }

      // Check for landmarks
      if (
        category.includes("landmark") ||
        category.includes("monument") ||
        category.includes("memorial") ||
        category.includes("statue") ||
        category.includes("historical") ||
        category.includes("historic site")
      ) {
        return "landmark";
      }

      // Check for visit
      if (
        category.includes("museum") ||
        category.includes("gallery") ||
        category.includes("park") ||
        category.includes("zoo") ||
        category.includes("garden")
      ) {
        return "visit";
      }

      // Check for experience
      if (
        category.includes("tour") ||
        category.includes("activity") ||
        category.includes("adventure") ||
        category.includes("experience")
      ) {
        return "experience";
      }

      // Check for event
      if (
        category.includes("event") ||
        category.includes("concert") ||
        category.includes("show") ||
        category.includes("performance") ||
        category.includes("festival")
      ) {
        return "event";
      }

      // Check for transit
      if (
        category.includes("airport") ||
        category.includes("station") ||
        category.includes("terminal") ||
        category.includes("port") ||
        category.includes("transit")
      ) {
        return "transit";
      }

      // Default to visit
      return "visit";
    };

    // Extract top URL if available
    if (search.organic && search.organic.length > 0) {
      placeData.url = search.organic[0].link;
    }

    // Determine the kind of place
    const kind = inferKind();

    // Create destination object
    let destination = {
      name: address || "Unknown location",
      neighborhood: null,
      city: null,
      state: null,
      country: null,
      region: null,
    };

    // Try to parse the location information from address
    if (
      mapsSearch.places &&
      mapsSearch.places.length > 0 &&
      mapsSearch.places[0].address
    ) {
      const addressParts = mapsSearch.places[0].address
        .split(",")
        .map((part) => part.trim());

      if (addressParts.length >= 3) {
        destination.city = addressParts[addressParts.length - 3];
        destination.region = addressParts[addressParts.length - 2];
        destination.country = addressParts[addressParts.length - 1];
      } else if (addressParts.length === 2) {
        destination.city = addressParts[0];
        destination.country = addressParts[1];
      }
    }

    // Final place object
    const place = {
      id: crypto.randomUUID(),
      kind,
      name: placeData.name,
      category: placeData.category.length > 0 ? placeData.category : null,
      description:
        placeData.description || `Information about ${placeData.name}`,
      photos: placeData.photos.length > 0 ? placeData.photos : [],
      coordinates: placeData.coordinates,
      destination,
      notes: placeData.notes,
      tips: placeData.tips,
      open_time: null,
      close_time: null,
      url: placeData.url,
      rating: placeData.rating,
      budget: placeData.budget,
      cost: null,
      interest_level: null,
      physical_level: placeData.physical_level,
      booking_required: null,
      booking_deadline: null,
      availability: null,
      setting: placeData.setting,
      time_minutes_allocation: null,
    };

    return place;
  } catch (error) {
    showUpdate(`❌ Place lookup failed`);
    console.error("Error in getPlaceInfo:", error);

    // Return a minimal place object if there's an error
    return {
      id: crypto.randomUUID(),
      kind: "visit",
      name: placeName,
      category: null,
      description: `Information about ${placeName}`,
      photos: [],
      coordinates: { latitude: 0, longitude: 0 },
      destination: {
        name: address || "Unknown location",
        neighborhood: null,
        city: null,
        state: null,
        country: null,
        region: null,
      },
      notes: null,
      tips: null,
      open_time: null,
      close_time: null,
      url: null,
      rating: null,
      budget: null,
      cost: null,
      interest_level: null,
      physical_level: null,
      booking_required: null,
      booking_deadline: null,
      availability: null,
      setting: null,
      time_minutes_allocation: null,
    };
  }
}

/**
 * Given a user input request, search the web and get page results and convert them into a stay data structures
 * @param {string} message User message
 * @param {Destination} destination Location to find places
 * @param {Object} options
 * @param {number} options.count Count of places to retrieve
 * @returns {Promise<Array.<Place>>} Places relevent to the user message and destination
 *  that contains relavant information to fulfill the user message
 */
async function getPlaceResearch(message, destination, { count = 3 } = {}) {
  try {
    // Get research for finding places for the user request
    const research = await getResearch(
      `Find places in the destination of ${destination.city}, ${destination.country}

Context: User originally looked for destinations based on this query:

${message}
`,
      { queryCount: 2, resultCount: 3 }
    );
    const systemPrompt = `
Using the research provided, extract the best places to visit based on the user request.

Evaluate each place for whether they are appropriate for the user request.

Your output should provide a sorted array of place objects with an address and description.
It should be sorted based on relevancy to the user request.
The address should be the most complete you can generate.
Description should be short and tailored to the context.
There should be no duplicates in the output.
Places must be specific locations, like a landmark, restaurant, hotel, museum, store, park, etc.
Do not use cities, countries, or regions as places

Research:

${JSON.stringify(research, null, 2)}
  `;
    const { object: places } = await generateObject({
      model: registry.languageModel(defaultObjectModel),
      output: "array",
      system: systemPrompt,
      prompt: message,
      schema: jsonSchema({
        title: "Place",
        type: "object",
        description: "Place address and description",
        properties: {
          name: {
            type: "string",
            description: "Name of the place",
          },
          address: {
            type: "string",
            description:
              "Best available full address of the place including number, street, city, country and zip code if available",
          },
          description: {
            type: "string",
            description: "Description of the place",
          },
        },
        required: ["address", "description"],
      }),
    });
    showUpdate(`🏛️ Places found`);

    console.log(
      `Found ${places.length} destinations:`,
      places.map(({ name }) => `${name}`)
    );
    console.debug("places results:", JSON.stringify(places));

    const results = (
      await Promise.all(
        places.slice(0, count).map(async (place) => {
          try {
            const result = {
              id: crypto.randomUUID(),
              ...place,
              ...(await getPlaceInfo(place.name, place.address)),
              destination,
              description: place.description,
            };
            return result;
          } catch (error) {
            console.error("Error in getPlaceResearch:", error);
            return null;
          }
        })
      )
    ).filter(Boolean);

    return results;
  } catch (error) {
    showUpdate(`❌ Place research failed`);
    throw error;
  }
}

/**
 * Gets day plan recommendations for a specific day in a stay, based on existing plans
 * @param {Stay} stay The stay object containing day plans and other places
 * @param {Object} options Options for the day plan research
 * @param {number} options.startTime Timestamp in seconds of the plan start time
 * @param {number} options.endTime Timestamp in seconds of the plan end time
 * @param {number} [options.count=10] Number of places to find
 * @param {Array.<Preferences>} [preferences] Array of interests
 * @returns {Promise<Array.<Plan>>} Array of plans for the day
 */
async function getDayPlanResearch(
  stay,
  { startTime, endTime, preferences, count = 10 }
) {
  try {
    // First process the stay day plans to extract all existing plans that start within the start and end time
    const existingPlans = (stay.day_plans || []).filter(
      (plan) => plan.start_time >= startTime && plan.start_time <= endTime
    );

    // Extract places from the existing plans
    const existingPlaces = existingPlans
      .map((plan) => plan.location)
      .filter(Boolean);

    if (existingPlaces.length === 0) {
      // If no existing places, return empty array
      return [];
    }

    // Then, from those existing places, find the average coordinate of where those places are
    const planCentralCoordinates = {
      latitude:
        existingPlaces.reduce(
          (sum, place) => sum + (place.coordinates?.latitude || 0),
          0
        ) / existingPlaces.length,
      longitude:
        existingPlaces.reduce(
          (sum, place) => sum + (place.coordinates?.longitude || 0),
          0
        ) / existingPlaces.length,
    };

    // Look up the location of the coordinates to get the neighborhood, city, and country
    const planNeighborhood = await getCoordinatesLocation(
      planCentralCoordinates
    );

    // Using the found neighborhood, create a neighborhood query string
    const neighborhoodString = [
      planNeighborhood.neighborhood,
      planNeighborhood.city,
      planNeighborhood.state,
      planNeighborhood.country,
    ]
      .filter(Boolean)
      .join(", ");

    // Get a list of all existing places
    const allOldPlaces = [
      ...(stay.options ?? []),
      ...(stay.day_plans ?? []).map((plan) => plan.location).filter(Boolean),
    ];

    const allOldPlacesContext = allOldPlaces
      .filter((place) => place && place.name)
      .map(
        (place) =>
          `${place.name}: [${place.category ?? "No Category"}] ${
            place.description ?? "No Description"
          }`
      )
      .join("\n\n");

    // Get research for finding places for the user request
    const research = await getResearch(
      `Find places to eat and things to do in the neighborhood of "${neighborhoodString}"

Context: User is looking to plan a day in this neighborhood. Make sure search queries include the full neighborhood string`,
      { queryCount: 4, resultCount: 3 }
    );

    // Clean up the research to find a list of locations that the user may be interested in
    const placesPrompt = `
Using the research provided, extract the best places to visit based on the user's stay.

Evaluate each place for whether they are things the user may be interested based on their interests and the places they are already interested in.
Be flexible in what you suggest and provide variety.

Your output should provide a sorted array of place objects with an address and description.
It should be sorted based on relevancy to the traveler's interests and existing places they want to visit.
The address should be the most complete you can generate.
Description should be short and tailored to both the traveler interests and context.
There should be no duplicates in the output.
Places must be specific locations, like a landmark, restaurant, hotel, museum, store, park, etc.
Do not use neighborhoods, cities, countries, or regions as places
The output should NOT include any of the existing places provided.

Places already being visited:

${allOldPlacesContext}

Traveler Preferences:
${JSON.stringify(preferences)}

Research:

${JSON.stringify(research, null, 2)}
  `;

    const { object: neighborhoodResults } = await generateObject({
      model: registry.languageModel(defaultObjectModel),
      output: "array",
      prompt: placesPrompt,
      schema: jsonSchema({
        title: "Place",
        type: "object",
        description: "Place address and description",
        properties: {
          name: {
            type: "string",
            description: "Name of the place",
          },
          address: {
            type: "string",
            description:
              "Best available full address of the place including number, street, city, country and zip code if available",
          },
          description: {
            type: "string",
            description: "Description of the place",
          },
        },
        required: ["name", "address", "description"],
      }),
    });

    showUpdate(`🏛️ Places found`);

    console.log(
      `Found ${neighborhoodResults.length} destinations:`,
      neighborhoodResults.map(({ name }) => `${name}`)
    );
    console.debug(
      "neighborhood places results:",
      JSON.stringify(neighborhoodResults)
    );

    // Get detailed information for each place
    const neighborhoodPlaces = (
      await Promise.all(
        neighborhoodResults.slice(0, count).map(async (place) => {
          try {
            const result = {
              id: crypto.randomUUID(),
              ...place,
              ...(await getPlaceInfo(place.name, place.address)),
              destination: { ...planNeighborhood },
              description: place.description,
            };
            return result;
          } catch (error) {
            console.error("Error in getPlaceResearch:", error);
            return null;
          }
        })
      )
    ).filter(Boolean);

    // Create contexts for the existing places and new neighborhoods places
    const existingPlaceContext = existingPlaces
      .map(({ id, kind, category, description, coordinates }) => ({
        id,
        kind,
        category,
        description,
        coordinates,
      }))
      .map(JSON.stringify)
      .join("\n");
    const neighborhoodPlacesContext = neighborhoodPlaces
      .map(({ id, kind, category, description, coordinates }) => ({
        id,
        kind,
        category,
        description,
        coordinates,
      }))
      .map(JSON.stringify)
      .join("\n");

    // Clean up the research to find a list of locations that the user may be interested in
    const filterPrompt = `
Given the following places, come up with a plan for visiting them based on start and end times for each place.

The plan should schedule places in an efficient order based on the nearness of their coordinates.
The plan should allow for time to get between places.
The plan should not be too overloaded.
The most interesting potential places should be prioritized.
The plan should take place during reasonable hours.
Restaurants should be planned at an appropriate time of day to eat.
Take into account how hungry the user may be at different times based on activity level.
Restaurants should only be included if they are conveniently located, otherwise the user can look up additional restaurants later.
The places listed must visit do not have to be the first places visited. They should be sensibly scheduled with the other places.
The places under the must visit section MUST be included in the output plan.

Traveler Preferences:
${JSON.stringify(preferences)}

Potential Places to Visit:
${neighborhoodPlacesContext}

Must Visit Places:
${existingPlaceContext}
`;

    const { object: planPlaces } = await generateObject({
      model: registry.languageModel(defaultObjectModel),
      output: "array",
      prompt: filterPrompt,
      schema: jsonSchema({
        title: "PlannedDestination",
        type: "object",
        description: "Planned destination with timing",
        properties: {
          id: {
            type: "string",
            description: "Exact id of the input place",
          },
          name: {
            type: "string",
            description: "Name of the place",
          },
          start_hour: {
            type: "number",
            description:
              "Hour of day to start visit from 0-24. May be fractional.",
          },
          end_hour: {
            type: "number",
            description:
              "Hour of day to end visit from 0-24. May be fractional.",
          },
        },
        required: ["id", "name", "start_hour", "end_hour"],
      }),
    });

    showUpdate(`📅 Day plan created`);

    console.log(
      `Made ${planPlaces.length} plans:`,
      planPlaces.map(({ name }) => `${name}`)
    );
    console.debug("Plan places results:", JSON.stringify(planPlaces));

    // Collect a list of all old and new places
    const allPlaces = [...allOldPlaces, ...neighborhoodPlaces];

    // Get the date from the startTime (we'll use this for converting hours to timestamps)
    const planDate = new Date(startTime * 1000);
    planDate.setHours(0, 0, 0, 0); // Reset to beginning of day
    const dayStartTimestamp = Math.floor(planDate.getTime() / 1000);

    // Convert planPlaces into standard plans based on the plan schema
    const plans = planPlaces
      .map((planPlace) => {
        // Find the matching place from all places
        const placeDetails = allPlaces.find((p) => p.id === planPlace.id);

        if (!placeDetails) {
          console.warn(
            `Could not find details for place with id ${planPlace.id}`
          );
          return null;
        }

        // Convert start_hour and end_hour to timestamps
        const startTimestamp =
          dayStartTimestamp + Math.floor(planPlace.start_hour * 3600);
        const endTimestamp =
          dayStartTimestamp + Math.floor(planPlace.end_hour * 3600);

        // Check if an existing plan has this place
        const existingPlan = existingPlans.find(
          (plan) => plan.location?.id === planPlace.id
        );

        return {
          kind: "plan",
          id: existingPlan?.id || crypto.randomUUID(),
          start_time: startTimestamp,
          end_time: endTimestamp,
          location: placeDetails,
        };
      })
      .filter(Boolean);

    return plans;
  } catch (error) {
    showUpdate(`❌ Day plan research failed`);
    throw error;
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

/**
 * Fetches historical weather data for a stay's location and date range
 * @param {Object} stay - The stay object to update with weather data
 * @param {Object} [options]
 * @param {number} options.startTime - Start timestamp in seconds
 * @param {number} options.endTime - End timestamp in seconds
 * @returns {Promise<Object>} - The stay object with weather data added
 */
async function getHistoricWeatherForStay(
  stay,
  { startTime: fallbackStartTime, endTime: fallbackEndTime } = {}
) {
  const startTime = stay?.arrival_time ?? fallbackStartTime;
  const endTime = stay?.departure_time ?? fallbackEndTime;
  if (!stay || !stay.destination || !startTime || !endTime) {
    return [];
  }

  try {
    // Get coordinates for the location using the search util
    const { city, country } = stay.destination;
    const locationQuery = `${city}, ${country}`;

    const searchResult = await getSearch(locationQuery, { type: "maps" });

    // Check if we got valid coordinates
    if (!searchResult || !searchResult.places || !searchResult.places.length) {
      console.error("Could not find coordinates for location:", locationQuery);
      return [];
    }

    // Get coordinates from the first place result
    const { latitude, longitude } = searchResult.places[0];

    // Get historical weather data for the previous year
    const oneYearAgo = 365 * 24 * 60 * 60; // Seconds in a year
    const historicStartDate = startTime - oneYearAgo;
    const historicEndDate = endTime - oneYearAgo;

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
      return [];
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

    return weatherArray;
  } catch (error) {
    console.error("Error getting historical weather data:", error);
    return stay;
  }
}

export {
  getQueryPlan,
  getPageContent,
  getResearch,
  getStayResearch,
  getPlaceInfo,
  getPlaceResearch,
  getDayPlanResearch,
  getHistoricWeatherForStay,
};
