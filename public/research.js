import { getSearch, getHistoricWeather } from "/search.js";

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
    fast: "gpt-4.1-nano-2025-04-14",
    standard: "gpt-4.1-mini-2025-04-14",
    best: "gpt-4.1",
  },
  anthropic: {
    fast: "claude-3-5-haiku-20241022",
    standard: "claude-3-5-sonnet-20241022",
    best: "claude-3-7-sonnet-latest",
  },
  google: {
    fast: "gemini-2.0-flash",
    standard: "gemini-2.5-flash-preview-04-17",
    best: "gemini-2.5-pro-preview-05-06",
  },
};

const defaultModel = `${defaultProvider}:${modelMap[defaultProvider]["standard"]}`;
const defaultObjectModel = `${defaultObjectProvider}:${modelMap[defaultObjectProvider]["fast"]}`;

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
};

// Stay Schema
const staySchema = {
  title: "Stay Schema",
  type: "object",
  description: "Travel stay with plans for a destination",
  properties: {
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
    return queries.slice(0, count);
  } catch (error) {
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
    return {
      url,
      siteName: article.siteName || new URL(url).hostname,
      title: article.title,
      content: article.textContent,
      success: true,
    };
  } catch (error) {
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

    return {
      url,
      siteName: "Reddit",
      title: post.title,
      content: markdown,
      success: true,
    };
  } catch (error) {
    console.error("Error fetching Reddit content:", error);

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
async function getStayResearch(message, { count = 6 } = {}) {
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
  console.log(
    `Found ${stays.length} destinations:`,
    stays.map(
      ({ destination }) =>
        `${destination?.city}, ${destination?.country}, ${destination?.region}`
    )
  );
  console.debug("stays results:", JSON.stringify(stays));
  return (
    await Promise.all(
      stays.slice(0, count).map(async (stay) => {
        try {
          return {
            ...stay,
            options: await getPlaceResearch(message, stay.destination),
          };
        } catch (error) {
          console.error("Error in getStayResearch:", error);
          return null;
        }
      })
    )
  ).filter(Boolean);
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
      placeData.category = [kg.type];
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
    console.error("Error in getPlaceInfo:", error);

    // Return a minimal place object if there's an error
    return {
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
 * @returns {Promise<Array.<Place>>} Stays relevent to the user message
 *  that contains relavant information to fulfill the user message
 */
async function getPlaceResearch(message, destination, { count = 3 } = {}) {
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
Do not cities, countries, or regions as places

Research:

${JSON.stringify(research, null, 2)}
  `;
  const { object: places } = await generateObject({
    model: registry.languageModel(defaultObjectModel),
    output: "array",
    system: systemPrompt,
    prompt: message,
    schema: jsonSchema({
      title: "Destination",
      type: "object",
      description: "Destination address and description",
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
          description: "Description of the destination",
        },
      },
      required: ["address", "description"],
    }),
  });
  console.log(
    `Found ${places.length} destinations:`,
    places.map(({ name }) => `${name}`)
  );
  console.debug("places results:", JSON.stringify(places));
  return (
    await Promise.all(
      places.slice(0, count).map(async (place) => {
        try {
          return {
            ...place,
            ...(await getPlaceInfo(place.name, place.address)),
            destination,
          };
        } catch (error) {
          console.error("Error in getPlaceResearch:", error);
          return null;
        }
      })
    )
  ).filter(Boolean);
}

export {
  getQueryPlan,
  getPageContent,
  getResearch,
  getStayResearch,
  getPlaceInfo,
  getPlaceResearch,
};
