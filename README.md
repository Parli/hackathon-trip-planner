# Itinerary Trip Planner

A trip planner application to help you choose travel destinations, find things to do, and plan your trip

## Prerequisites

Node.js 23.6.0

## Trip Planning Workflow

### Exploration phase
* Get locations based on specific cities or countries or regions
* Get rough date range and trip length or specific dates if already known
* Ask user for general interests and budget
  * Shoestring (focuses on free and cheap things to do)
  * Cheap (focuses on cheap things to do)
  * Value (Aims for value)
  * High-end (Higher quality options and splurges)
  * Luxury (Cost is no limit)
* Show a bunch of things to do and get user feedback on which things the user is interested in
  * Ask for general interests
    * Activity level
    * Activity interests
      * Hiking, walking, sports, adventure activities (zip-lining etc)
    * Location type interests
      * City, countryside, nature
    * Culture interests
      * History, art, science, trendy scene
  * Events and landmarks. No travel, restaurants, or accommodations yet
  * Add interested things to a list to use later with locations, times, estimated activity time, and dates
* Find cool things to do from tripadvisor, reddit, and instagram

### Scheduling phase
* Provide
* Narrow down dates and locations
  * Provide estimated travel and accommodation price ranges for dates
  * Provide weather estimates for dates
  * Provide crowdedness estimates for dates
  * Reminder of things you showed interest in during exploration phase
* Finalize

### Planning phase
* Determining day timeline, what you want to do each day
* Group locations, activities, and events by neighborhood and location density
* Prioritize locations of time sensitive events
* Based on number of days allocated to the city
* Show a list of interested things on locations to help user choose locations and how long they want to stay

### Iteration phase
* Continue exploration iterating between scheduling and planning phase as user narrows down what specifically they want to do.

## Client Features

### Create Trip Overview

* Name your trip
* Choose a place of origin for your home
* Choose a timeline
  * Provide tentative start and end dates and the flexibility of each
  * Provide number of days you can travel for
* Provide preferences and extra data
  * Number of travelers
  * Your budget
  * Pace of activities
  * Wake up time preference
  * Extra freeform considerations

### Destination Explorer
* Submit text field for searching for destinations, can be cities or countries or regions or a description of a type of place you want to go to
* Destination cards of places to explore based on your query
  * Does a google search of the query to find information on suitable cities to generate cards for
  * Cards are specific cities
  * From cities, a search is done to find the most iconic landmarks, pictures of those landmarks are added to the card
  * A search is done for flight cost range for the selected dates from the user origin to the city
  * User can select a card to be added to the planner

### Trip Planner
* City and day based ordered itinerary of your trip
* Main header is city name
* A things to do carousel contains a list of place cards
  * Populated from google, google maps, yelp, trip advisor, reddit, etc
  * Cards have an interest selector for delete, maybe, interested, and must do
  * Clicking a card opens a modal with more info
    * Modal includes pictures, a map, extra data
  *


## Trip artifact schema

```ts
// A day granularity time for narrowing down potential dates
interface TravelDate {
  year: number
  month: number
  day: number
  flexibility: "fixed" | "somewhat_flexible" | "very_flexible"
}

// Data on weather for a specific time
interface Weather {
  condition: "sunny" | "partly_cloudy" | "cloudy" | "foggy" | "light_rain" | "moderate_rain" | "heavy_rain" | "stormy" | "thunderstorm" | "light_snow" | "moderate_snow" | "heavy_snow" | "hail" | "windy"
  temperature: number
  start_time: Timestamp
  end_time: Timestamp
}

// Unicode time in seconds
type Timestamp = number

// A area based location as opposed to a specific place, like a city, country, or region
interface Destination {
  name: string
  neighborhood: string | null
  city: string | null
  country: string | null
  region: string | null
}

// A specific location, like a venue, or hotel, or park, or restaurant, etc that the user may want to do
interface Place {
  kind:
    // Location for a stay
    | "accommodation"
    // Place to get food at a restaurant, or market, etc
    | "food"
    // A location to look at and pass by
    | "landmark"
    // A location with flexible timing, like a museum or park
    | "visit"
    // A location with specific activity that requires booking but can have multiple slots during the day
    | "experience"
    // A place that is hosting a specific event that has a specific time it is held
    | "event"
    // Location for a transit location like an airport or train station or bus stop or car rental lot etc
    | "transit"
  name: string
  category: string[] | null // More specifically, what category of the kind of place it is
  // e.g. e.g. Chinese Restaurant, Aerospace Museum, Bed and Breakfast, Historical Landmark, Natural Landmark, etc.
  description: string // Short description about the place
  photos: string[] // URLs of pictures of the place
  coordinates: { // Exact location of the place
    latitude: number
    longitude: number
  }
  destination: Destination // Broad location of the place
  notes: string | null // Useful information the user should know about the place
  tips: string | null // Longer explanation of things that could help the user in markdown format
  open_time: Timestamp | null // When the place opens for entry
  close_time: Timestamp | null // When the place closes or ends
  url: string | null // URL for the place
  rating: number | null // Rating from 0-10
  budget: "free" | "cheap" | "moderate" | "splurge" | "expensive" | null // Relative budget level
  cost: number | null // Exact cost in USD
  interest_level: "maybe" | "interested" | "must_do" | null
  physical_level: "light" | "moderate" | "active" | null
  booking_required: boolean | null
  booking_deadline: Timestamp | null
  availability: "low" | "medium" | "high" | null
  setting: "indoor" | "outdoor" | "mixed" | null
  time_minutes_allocation: number | null
}

// Type to express things that will happen over a specific time
interface Schedule {
  start_time: Timestamp
  end_time: Timestamp
}

// A time sensitive activity associated with a place, like a concert or hotel check in, or plan to go to a museum
interface Plan extends Schedule{
  kind: "plan"
  location: Place
}

// Plans for getting around
interface Transportation extends Schedule {
  kind: "transportation"
  departure: Place
  arrival: Place
  mode: "plane" | "train" | "bus" | "car" | "taxi" | "bike" | "boat" | "ferry" | "subway" | "tram" | "walk"
}

export interface Trip {
  // Name of the trip
  title: string
  timeline: {
    // Starting tentative date for travel
    start_date: TravelDate
    // Ending tentative date for travel
    end_date: TravelDate
    // Number of days you can travel for
    trip_days: number
  }
  // General preferences and important information for the entire trip
  preferences: {
    // Where you're coming from
    origin: Place
    // Number of people traveling
    traveler_count: number,
    // How much you want to pack into the trip
    pace: "relaxed" | "moderate" | "intense"
    // Prefer doing things earlier or later
    morning_type: "early_bird" | "standard_riser" | "late_riser"
    // How much the traveler wants to spend
    budget_level: "shoestring" | "budget" | "value" | "premium" | "luxury"
    // Open ended extra considerations
    special_needs: string[]
  }
  // Travel stays with plans for the destinations
  stays: {
    destination: Destination
    description: string
    // Time you will arrive to the destination
    arrival_time: Timestamp | null
    // Time you will depart the destination
    departure_time: Timestamp | null
    // Options of things to choose from in the city
    options: Place[]
    // Specific plans that were chosen from options
    day_plans: (Transportation | Plan)[]
    // Weather events
    weather: Weather[]
  }[]
}
```

## Server Features

This project has a server with api endpoints to assist in prototyping.

### Persistant Storage

`GET /api/store/[hash]`

Gets an arbitrary `plain/text` string stored by its url safe base64 encoded MD5 `hash`.

`POST /api/store/`

Stores an arbitrary `plain/text` body string and returns the MD5 `hash` as a url safe base64 encoded plain text string.

### External Service Proxy

`[GET|POST|PUT|DELETE] /api/proxy/[proxy-url]`

Allows proxying to the `proxy-url`, forwarding any request and supports streaming.

Any string matching `${ENV_NAME}` in the header will replace the string with the value of that environment variable.

An accompanying `[ENV_VAR]_ACCESS` variable must be defined to allowlist proxy hosts for filling out these values to prevent leakage. The hosts must include the full host including the subdomain and can be a comma separated list of host names.

### Static File Server

`GET /[file-name]`

If no other route matches, files in the `public` directory will be returned.

This ignores the path and hash URL segments.

## Setup

### Environment Variables

`STORAGE_LOCATION` will define a custom location for writing the storage file. By default it will go to `./storage`.

A mounted cloud bucket can be used for persistence on a deployed server.

`OPENAI_API_KEY`
`ANTHROPIC_API_KEY`
`GEMINI_API_KEY`
`SERPER_API_KEY`

## Deployment

### Google Cloud Run

Simple Server can be easily deployed to Google Cloud Run using source based deployment.

1. [Build and deploy a Node.js app.](https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-nodejs-service#deploy)
2. [Configure environment variables.](https://cloud.google.com/run/docs/configuring/services/environment-variables)
3. [Mount a storage bucket as a volume mount.](https://cloud.google.com/run/docs/configuring/services/cloud-storage-volume-mounts)
