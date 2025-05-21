# Trip Planner Documentation

## Project Overview

The Trip Planner is a hackathon project for creating AI-assisted travel itineraries. It leverages multiple AI providers (Anthropic Claude, OpenAI GPT, Google Gemini) along with search APIs, weather data, and structured data processing to help users plan comprehensive trips.

## Pages

### 1. Main Page (`index.html`)
- Main entry point for the application
- Has trip setup input to provide your trip preferences
- After submitting your trip info, it stores the trip json and then redirects you to `trip.html?${id}` from the storage id value.

### 2. Trip Page (`trip.html?${id}`)
- Loads your saved trip from the storage id query key
- Lets you search for destinations to visit with a free form search bar
- After submitting your search suggested destinations are populated as a city card carousel below
- City cards have an add button. When they are added they are added to the trip itinerary section below

## Test Pages

### 1. Dashboard (`dashboard.html`)
- Testing environment for all application features
- Tab-based interface for testing different API functionalities:
  - Search: Test search API (web, places, images, maps)
  - Weather: Test weather API with coordinates and date ranges
  - Query Plan: Generate search queries for travel topics
  - Page Content: Extract content from URLs
  - Research: Research travel topics using web search
  - Place Info: Get detailed information about places
  - Place Research: Find places in cities matching criteria
  - Stay Research: Find destinations matching preferences

### 2. Components Library (`components.html`)
- Showcases all UI components used in the application
- Demonstrates how components can be combined to create interfaces

## Utility Files

### 1. Main (`main.js`)
- Core functionality for the AI prototype
- Sets up AI provider registry with Vercel AI SDK
- Handles user queries and streaming responses
- Manages conversation storage and sharing
- Renders markdown content with marked.js

### 2. Search (`search.js`)
- Provides search functionality via SERPER API
- `getSearch()`: Searches web with various types (search, images, places, maps)
- `getHistoricWeather()`: Retrieves weather data using Open-Meteo API
- Defines TypeScript interfaces for search results and weather data

### 3. Research (`research.js`)
- Advanced research and trip planning utilities
- `getQueryPlan()`: Generates search queries based on user input
- `getPageContent()`: Extracts readable content from web pages
- `getResearch()`: Searches web for travel information
- `getStayResearch()`: Finds destinations matching preferences
- `getPlaceInfo()`: Extracts structured place information
- `getPlaceResearch()`: Finds places in destinations matching criteria
- Defines comprehensive JSON schemas for trip planning

### 4. Dashboard (`dashboard.js`)
- Implements dashboard functionality
- Handles tab navigation and form processing
- Integrates with research and search utilities
- Creates and renders UI components dynamically

## Server Functionality (`server.ts`)

Node.js HTTP server with three main functionalities:

### 1. Static File Serving
- Serves files from the public directory
- Handles MIME types for different file extensions

### 2. Storage API
- `GET /api/store/[hash]`: Retrieves stored text by hash ID
- `POST /api/store/`: Stores text and returns a hash ID
- Persists storage to filesystem

### 3. Proxy API
- `[METHOD] /api/proxy/[proxy-url]`: Proxies requests to external APIs
- Handles environment variable interpolation with hostname verification
- Supports streaming responses
- Used for proxying requests to search APIs, weather APIs, etc.

## Components

### Utility Components

1. **image-container.js**
   - Displays images with blurred background effect
   - Handles missing images with placeholder


### Card Components

1. **place-card.js**
   - Displays place information (attractions, restaurants)
   - Interest level selection (must do, interested, maybe)
   - Place categorization with icons

2. **city-card.js**
   - Shows city destination details
   - Displays images, weather, arrival/departure times
   - Calculates stay duration

### Icon Components

1. **place-icon.js**
   - Icons for different place types (accommodation, food, landmark, etc.)

2. **transit-icon.js**
   - Icons for transportation modes (plane, train, bus, etc.)

3. **weather-icon.js**
   - Icons for weather conditions (sunny, cloudy, etc.)

### Item Components

1. **plan-item.js**
   - Shows scheduled activities with details
   - Displays time range, place info, and metadata

2. **transportation-item.js**
   - Shows transportation details between locations
   - Displays departure/arrival times and transit icon

3. **weather-item.js**
   - Displays weather condition, temperature, and time range

### Complex Components

1. **trip-itinerary.js**
   - Top-level component for the entire trip
   - Displays trip title, date range, and organized stays

2. **stay-itinerary.js**
   - Organizes all information for a city stay
   - Groups activities by type and day plans chronologically

3. **day-plan.js**
   - Shows schedule for a single day
   - Displays weather and chronological activities

4. **card-carousel.js**
   - Horizontally scrollable carousel of cards
   - Navigation controls and smooth scrolling

## Schema Types

The application uses a comprehensive set of schemas for structured data:

### Basic Types

1. **TravelDate**
   - Date information with flexibility options

2. **Weather**
   - Weather conditions with temperature and timestamps

3. **Timestamp**
   - Unicode time in seconds

4. **Coordinates**
   - Exact location with latitude and longitude

5. **Schedule**
   - Base interface for time-specific events

### Location Types

1. **Destination**
   - Area-based locations (city, country, region)

2. **Place**
   - Specific locations with detailed properties:
   - Kind (accommodation, food, landmark, visit, experience, event, transit)
   - Photos, address, coordinates
   - Opening times, ratings, budget
   - Physical level, booking requirements, etc.

### Activity Types

1. **Plan**
   - Time-sensitive activities associated with places

2. **Transportation**
   - Travel between places with mode specification

### Trip Planning Types

1. **Stay**
   - Destination stays with arrival/departure times
   - Options, day plans, and weather

2. **Timeline**
   - Trip date range and duration

3. **Preferences**
   - User preferences for the trip
   - Origin, traveler count, pace, budget level

4. **Trip**
   - Main schema combining all components
   - Title, timeline, preferences, and stays
