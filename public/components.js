// Component Library Demo
import "/components/place-icon.js";
import "/components/weather-icon.js";
import "/components/transit-icon.js";
import "/components/place-card.js";
import "/components/city-card.js";
import "/components/weather-item.js";
import "/components/plan-item.js";
import "/components/transportation-item.js";
import "/components/day-plan.js";
import "/components/stay-itinerary.js";
import "/components/trip-itinerary.js";
import "/components/card-carousel.js";

// Current timestamp (for demo purposes)
const now = Math.floor(Date.now() / 1000);
const oneHourInSeconds = 60 * 60;
const oneDayInSeconds = 24 * oneHourInSeconds;

// ==================== Icon Components ====================

// Place Icons
const placeIconsContainer = document.getElementById("place-icons");
if (placeIconsContainer) {
  const placeTypes = [
    "accommodation",
    "food",
    "landmark",
    "visit",
    "experience",
    "event",
    "transit",
  ];

  let html = '<div style="display: flex; gap: 1rem; flex-wrap: wrap;">';

  placeTypes.forEach((type) => {
    html += `
      <div style="display: flex; flex-direction: column; align-items: center; width: 80px; text-align: center;">
        <place-icon kind="${type}"></place-icon>
        <span style="font-size: 0.8rem; margin-top: 0.5rem;">${type}</span>
      </div>
    `;
  });

  html += "</div>";
  placeIconsContainer.innerHTML = html;
}

// Weather Icons
const weatherIconsContainer = document.getElementById("weather-icons");
if (weatherIconsContainer) {
  const weatherTypes = [
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
  ];

  let html = '<div style="display: flex; gap: 1rem; flex-wrap: wrap;">';

  weatherTypes.forEach((type) => {
    html += `
      <div style="display: flex; flex-direction: column; align-items: center; width: 80px; text-align: center;">
        <weather-icon condition="${type}"></weather-icon>
        <span style="font-size: 0.8rem; margin-top: 0.5rem;">${type.replace(
          "_",
          " "
        )}</span>
      </div>
    `;
  });

  html += "</div>";
  weatherIconsContainer.innerHTML = html;
}

// Transit Icons
const transitIconsContainer = document.getElementById("transit-icons");
if (transitIconsContainer) {
  const transitTypes = [
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
  ];

  let html = '<div style="display: flex; gap: 1rem; flex-wrap: wrap;">';

  transitTypes.forEach((type) => {
    html += `
      <div style="display: flex; flex-direction: column; align-items: center; width: 80px; text-align: center;">
        <transit-icon mode="${type}"></transit-icon>
        <span style="font-size: 0.8rem; margin-top: 0.5rem;">${type}</span>
      </div>
    `;
  });

  html += "</div>";
  transitIconsContainer.innerHTML = html;
}

// ==================== Item Components ====================

// Weather Item
const weatherItemContainer = document.getElementById("weather-item");
if (weatherItemContainer) {
  const weatherItem = document.createElement("weather-item");
  weatherItem.weather = {
    condition: "partly_cloudy",
    temperature: 22,
    start_time: now,
    end_time: now + oneHourInSeconds * 3,
  };
  weatherItemContainer.appendChild(weatherItem);
}

// Plan Item
const planItemContainer = document.getElementById("plan-item");
if (planItemContainer) {
  const planItem = document.createElement("plan-item");
  planItem.plan = {
    kind: "plan",
    start_time: now + oneHourInSeconds,
    end_time: now + oneHourInSeconds * 3,
    location: {
      kind: "visit",
      name: "Louvre Museum",
      description:
        "World-famous art museum in Paris housing thousands of works of art including the Mona Lisa.",
      coordinates: {
        latitude: 48.8606,
        longitude: 2.3376,
      },
      destination: {
        name: "Paris",
        city: "Paris",
        country: "France",
      },
      budget: "moderate",
      physical_level: "moderate",
      setting: "indoor",
    },
  };
  planItemContainer.appendChild(planItem);
}

// Transportation Item
const transportationItemContainer = document.getElementById(
  "transportation-item"
);
if (transportationItemContainer) {
  const transportationItem = document.createElement("transportation-item");
  transportationItem.transportation = {
    kind: "transportation",
    mode: "plane",
    start_time: now + oneDayInSeconds,
    end_time: now + oneDayInSeconds + oneHourInSeconds * 3,
    departure: {
      kind: "transit",
      name: "JFK International Airport",
      coordinates: {
        latitude: 40.6413,
        longitude: -73.7781,
      },
    },
    arrival: {
      kind: "transit",
      name: "Charles de Gaulle Airport",
      coordinates: {
        latitude: 49.0097,
        longitude: 2.5479,
      },
    },
  };
  transportationItemContainer.appendChild(transportationItem);
}

// ==================== Card Components ====================

// Place Card
const placeCardContainer = document.getElementById("place-card");
if (placeCardContainer) {
  const placeCard = document.createElement("place-card");
  placeCard.place = {
    kind: "landmark",
    name: "Eiffel Tower",
    category: ["Historical Landmark", "Tourist Attraction"],
    description:
      "Iconic iron lattice tower on the Champ de Mars in Paris, France, named after engineer Gustave Eiffel.",
    photos: [
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAIzAesW6PZwoCTvak2e4GEmlso56VCYv27A&s",
    ],
    coordinates: {
      latitude: 48.8584,
      longitude: 2.2945,
    },
    destination: {
      name: "Paris",
      city: "Paris",
      country: "France",
    },
    rating: 9.2,
    budget: "moderate",
    interest_level: "interested",
  };
  placeCardContainer.appendChild(placeCard);
}

// City Card
const cityCardContainer = document.getElementById("city-card");
if (cityCardContainer) {
  const cityCard = document.createElement("city-card");
  cityCard.stay = {
    destination: {
      name: "Paris",
      city: "Paris",
      country: "France",
    },
    description:
      "The City of Light, famous for its art, cuisine, fashion, and iconic landmarks.",
    // Photos are now on places, not on the stay itself
    arrival_time: now + oneDayInSeconds,
    departure_time: now + oneDayInSeconds * 5,
    options: [
      {
        kind: "accomodation",
        name: "Hotel Eiffel Seine",
        photos: [
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/21048555.jpg?k=e8723ea59bb60039a17bea87247043812e087c1ebcb3c6bf7c85cfb7d15aa696&o=&hp=1",
        ],
        destination: {
          name: "Paris",
          city: "Paris",
          country: "France",
        },
      },
      {
        kind: "food",
        name: "Chouchou",
        photos: [
          "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2d/10/47/e6/retrouvez-a-la-carte.jpg?w=900&h=500&s=1",
        ],
        destination: {
          name: "Paris",
          city: "Paris",
          country: "France",
        },
      },
      {
        kind: "landmark",
        name: "Eiffel Tower",
        photos: [
          "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/960px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg",
        ],
        destination: {
          name: "Paris",
          city: "Paris",
          country: "France",
        },
      },
    ],
    weather: [
      {
        condition: "sunny",
        temperature: 24,
        start_time: now + oneDayInSeconds,
        end_time: now + oneDayInSeconds + oneHourInSeconds * 12,
      },
    ],
  };
  cityCardContainer.appendChild(cityCard);
}

// ==================== Complex Components ====================

// Day Plan
const dayPlanContainer = document.getElementById("day-plan");
if (dayPlanContainer) {
  const dayPlan = document.createElement("day-plan");
  dayPlan.date = now + oneDayInSeconds * 2;
  dayPlan.weather = {
    condition: "sunny",
    temperature: 24,
    start_time: now + oneDayInSeconds * 2,
    end_time: now + oneDayInSeconds * 2 + oneHourInSeconds * 12,
  };

  const activities = [
    {
      kind: "plan",
      start_time: now + oneDayInSeconds * 2 + oneHourInSeconds * 9,
      end_time: now + oneDayInSeconds * 2 + oneHourInSeconds * 12,
      location: {
        kind: "visit",
        name: "Louvre Museum",
        description:
          "World-famous art museum housing thousands of works of art.",
        photos: [
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1FKV2I_7_MfOmqXFUsnuftQy1FoftQ-zdGA&s",
        ],
        coordinates: {
          latitude: 48.8606,
          longitude: 2.3376,
        },
        destination: {
          name: "Paris",
          city: "Paris",
          country: "France",
        },
      },
    },
    {
      kind: "plan",
      start_time: now + oneDayInSeconds * 2 + oneHourInSeconds * 13,
      end_time: now + oneDayInSeconds * 2 + oneHourInSeconds * 14,
      location: {
        kind: "food",
        name: "Café de Flore",
        description: "Historic café in the heart of Saint-Germain-des-Prés.",
        coordinates: {
          latitude: 48.8535,
          longitude: 2.3333,
        },
        destination: {
          name: "Paris",
          city: "Paris",
          country: "France",
        },
      },
    },
    {
      kind: "plan",
      start_time: now + oneDayInSeconds * 2 + oneHourInSeconds * 15,
      end_time: now + oneDayInSeconds * 2 + oneHourInSeconds * 17,
      location: {
        kind: "landmark",
        name: "Eiffel Tower",
        description: "Iconic iron lattice tower on the Champ de Mars in Paris.",
        coordinates: {
          latitude: 48.8584,
          longitude: 2.2945,
        },
        destination: {
          name: "Paris",
          city: "Paris",
          country: "France",
        },
      },
    },
  ];

  dayPlan.activities = activities;
  dayPlanContainer.appendChild(dayPlan);
}

// Stay Itinerary
const stayItineraryContainer = document.getElementById("stay-itinerary");
if (stayItineraryContainer) {
  const stayItinerary = document.createElement("stay-itinerary");
  stayItinerary.stay = {
    destination: {
      name: "Paris",
      city: "Paris",
      country: "France",
    },
    description:
      "The City of Light, famous for its art, cuisine, fashion, and iconic landmarks.",
    // Photos are now on places, not on the stay itself
    arrival_time: now + oneDayInSeconds,
    departure_time: now + oneDayInSeconds * 4,

    // Sample places to visit
    options: [
      {
        kind: "landmark",
        name: "Eiffel Tower",
        category: ["Historical Landmark", "Tourist Attraction"],
        description: "Iconic iron lattice tower on the Champ de Mars in Paris.",
        coordinates: {
          latitude: 48.8584,
          longitude: 2.2945,
        },
        destination: {
          name: "Paris",
          city: "Paris",
          country: "France",
        },
        rating: 9.2,
        budget: "moderate",
      },
      {
        kind: "visit",
        name: "Louvre Museum",
        category: ["Museum", "Art Gallery"],
        description:
          "World-famous art museum housing thousands of works of art.",
        coordinates: {
          latitude: 48.8606,
          longitude: 2.3376,
        },
        destination: {
          name: "Paris",
          city: "Paris",
          country: "France",
        },
        rating: 9.5,
        budget: "moderate",
      },
      {
        kind: "visit",
        name: "Notre-Dame Cathedral",
        category: ["Religious Site", "Historical Site"],
        description: "Medieval Catholic cathedral on the Île de la Cité.",
        coordinates: {
          latitude: 48.853,
          longitude: 2.3499,
        },
        destination: {
          name: "Paris",
          city: "Paris",
          country: "France",
        },
        rating: 9.0,
        budget: "free",
      },
      {
        kind: "food",
        name: "Café de Flore",
        category: ["Café", "Restaurant"],
        description: "Historic café in the heart of Saint-Germain-des-Prés.",
        coordinates: {
          latitude: 48.8535,
          longitude: 2.3333,
        },
        destination: {
          name: "Paris",
          city: "Paris",
          country: "France",
        },
        rating: 8.5,
        budget: "splurge",
      },
      {
        kind: "food",
        name: "Boulangerie Poilâne",
        category: ["Bakery"],
        description: "Famous Parisian bakery known for sourdough bread.",
        coordinates: {
          latitude: 48.8513,
          longitude: 2.3326,
        },
        destination: {
          name: "Paris",
          city: "Paris",
          country: "France",
        },
        rating: 9.3,
        budget: "moderate",
      },
    ],

    // Day plans
    day_plans: [
      {
        kind: "plan",
        start_time: now + oneDayInSeconds * 2 + oneHourInSeconds * 9,
        end_time: now + oneDayInSeconds * 2 + oneHourInSeconds * 12,
        location: {
          kind: "visit",
          name: "Louvre Museum",
          description:
            "World-famous art museum housing thousands of works of art.",
          coordinates: {
            latitude: 48.8606,
            longitude: 2.3376,
          },
          destination: {
            name: "Paris",
            city: "Paris",
            country: "France",
          },
        },
      },
      {
        kind: "plan",
        start_time: now + oneDayInSeconds * 2 + oneHourInSeconds * 13,
        end_time: now + oneDayInSeconds * 2 + oneHourInSeconds * 14,
        location: {
          kind: "food",
          name: "Café de Flore",
          description: "Historic café in the heart of Saint-Germain-des-Prés.",
          coordinates: {
            latitude: 48.8535,
            longitude: 2.3333,
          },
          destination: {
            name: "Paris",
            city: "Paris",
            country: "France",
          },
        },
      },
      {
        kind: "plan",
        start_time: now + oneDayInSeconds * 2 + oneHourInSeconds * 15,
        end_time: now + oneDayInSeconds * 2 + oneHourInSeconds * 17,
        location: {
          kind: "landmark",
          name: "Eiffel Tower",
          description:
            "Iconic iron lattice tower on the Champ de Mars in Paris.",
          coordinates: {
            latitude: 48.8584,
            longitude: 2.2945,
          },
          destination: {
            name: "Paris",
            city: "Paris",
            country: "France",
          },
        },
      },
    ],

    // Weather information
    weather: [
      {
        condition: "sunny",
        temperature: 24,
        start_time: now + oneDayInSeconds * 2,
        end_time: now + oneDayInSeconds * 2 + oneHourInSeconds * 12,
      },
      {
        condition: "partly_cloudy",
        temperature: 22,
        start_time: now + oneDayInSeconds * 2 + oneHourInSeconds * 12,
        end_time: now + oneDayInSeconds * 2 + oneHourInSeconds * 24,
      },
    ],
  };
  stayItineraryContainer.appendChild(stayItinerary);
}

// Card Carousel
const cardCarouselContainer = document.getElementById("card-carousel");
if (cardCarouselContainer) {
  const cardCarousel = document.createElement("card-carousel");
  
  // Create place cards for the carousel
  const places = [
    {
      kind: "landmark",
      name: "Eiffel Tower",
      category: ["Historical Landmark", "Tourist Attraction"],
      description: "Iconic iron lattice tower on the Champ de Mars in Paris, France.",
      photos: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAIzAesW6PZwoCTvak2e4GEmlso56VCYv27A&s"],
      coordinates: { latitude: 48.8584, longitude: 2.2945 },
      destination: { name: "Paris", city: "Paris", country: "France" },
      rating: 9.2,
      budget: "moderate",
      interest_level: "interested",
    },
    {
      kind: "visit",
      name: "Louvre Museum",
      category: ["Museum", "Art Gallery"],
      description: "World-famous art museum housing thousands of works of art including the Mona Lisa.",
      photos: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1FKV2I_7_MfOmqXFUsnuftQy1FoftQ-zdGA&s"],
      coordinates: { latitude: 48.8606, longitude: 2.3376 },
      destination: { name: "Paris", city: "Paris", country: "France" },
      rating: 9.5,
      budget: "moderate",
      interest_level: "very_interested",
    },
    {
      kind: "food",
      name: "Café de Flore",
      category: ["Café", "Restaurant"],
      description: "Historic café in the heart of Saint-Germain-des-Prés, known for famous literary patrons.",
      photos: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzh8SXVvnaYDQFrLTdH7lzFwcdXQtb7_nH3g&s"],
      coordinates: { latitude: 48.8535, longitude: 2.3333 },
      destination: { name: "Paris", city: "Paris", country: "France" },
      rating: 8.5,
      budget: "splurge",
      interest_level: "somewhat_interested",
    },
    {
      kind: "landmark",
      name: "Notre-Dame Cathedral",
      category: ["Religious Site", "Historical Site"],
      description: "Medieval Catholic cathedral on the Île de la Cité in Paris.",
      photos: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHWy6XFrwQMT_ZmNRjVdsPmvRBgG5XIVhRXA&s"],
      coordinates: { latitude: 48.853, longitude: 2.3499 },
      destination: { name: "Paris", city: "Paris", country: "France" },
      rating: 9.0,
      budget: "free",
      interest_level: "interested",
    },
    {
      kind: "landmark",
      name: "Colosseum",
      category: ["Historical Site", "Ancient Ruin"],
      description: "Ancient Roman amphitheater in the center of Rome, Italy.",
      photos: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnQn9_MUxuyr9bpFfRdrr648f7RvB7DPQ0dQ&s"],
      coordinates: { latitude: 41.8902, longitude: 12.4922 },
      destination: { name: "Rome", city: "Rome", country: "Italy" },
      rating: 9.4,
      budget: "moderate",
      interest_level: "very_interested",
    }
  ];
  
  // Create place card elements and add them to carousel
  const cards = places.map(place => {
    const placeCard = document.createElement("place-card");
    placeCard.place = place;
    return placeCard;
  });
  
  cardCarousel.cards = cards;
  cardCarouselContainer.appendChild(cardCarousel);
}

// Trip Itinerary
const tripItineraryContainer = document.getElementById("trip-itinerary");
if (tripItineraryContainer) {
  const tripItinerary = document.createElement("trip-itinerary");
  tripItinerary.trip = {
    title: "European Adventure",
    timeline: {
      start_date: {
        year: 2025,
        month: 6,
        day: 15,
        flexibility: "somewhat_flexible",
      },
      end_date: {
        year: 2025,
        month: 6,
        day: 30,
        flexibility: "somewhat_flexible",
      },
      trip_days: 15,
    },
    preferences: {
      origin: {
        kind: "transit",
        name: "New York City",
        coordinates: {
          latitude: 40.7128,
          longitude: -74.006,
        },
        destination: {
          name: "New York",
          city: "New York City",
          country: "United States",
        },
      },
      traveler_count: 2,
      pace: "moderate",
      morning_type: "standard_riser",
      budget_level: "value",
      special_needs: [],
    },
    stays: [
      {
        destination: {
          name: "Paris",
          city: "Paris",
          country: "France",
        },
        description:
          "The City of Light, famous for its art, cuisine, fashion, and iconic landmarks.",
        // Photos are now on places, not on the stay itself
        arrival_time: now + oneDayInSeconds,
        departure_time: now + oneDayInSeconds * 5,
        options: [
          {
            kind: "landmark",
            name: "Eiffel Tower",
            description:
              "Iconic iron lattice tower on the Champ de Mars in Paris.",
            photos: [
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAIzAesW6PZwoCTvak2e4GEmlso56VCYv27A&s",
            ],
            coordinates: {
              latitude: 48.8584,
              longitude: 2.2945,
            },
            destination: {
              name: "Paris",
              city: "Paris",
              country: "France",
            },
          },
        ],
        day_plans: [
          {
            kind: "plan",
            start_time: now + oneDayInSeconds * 2,
            end_time: now + oneDayInSeconds * 2 + oneHourInSeconds * 2,
            location: {
              kind: "landmark",
              name: "Eiffel Tower",
              description:
                "Iconic iron lattice tower on the Champ de Mars in Paris.",
              photos: [
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAIzAesW6PZwoCTvak2e4GEmlso56VCYv27A&s",
              ],
              coordinates: {
                latitude: 48.8584,
                longitude: 2.2945,
              },
              destination: {
                name: "Paris",
                city: "Paris",
                country: "France",
              },
            },
          },
        ],
        weather: [
          {
            condition: "sunny",
            temperature: 24,
            start_time: now + oneDayInSeconds * 2,
            end_time: now + oneDayInSeconds * 2 + oneHourInSeconds * 24,
          },
        ],
      },
      {
        destination: {
          name: "Rome",
          city: "Rome",
          country: "Italy",
        },
        description:
          "The Eternal City, full of ancient history, stunning architecture, and incredible food.",
        // Photos are now on places, not on the stay itself
        arrival_time: now + oneDayInSeconds * 6,
        departure_time: now + oneDayInSeconds * 10,
        options: [
          {
            kind: "landmark",
            name: "Colosseum",
            description: "Ancient Roman amphitheater in the center of Rome.",
            photos: [
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnQn9_MUxuyr9bpFfRdrr648f7RvB7DPQ0dQ&s",
            ],
            coordinates: {
              latitude: 41.8902,
              longitude: 12.4922,
            },
            destination: {
              name: "Rome",
              city: "Rome",
              country: "Italy",
            },
          },
        ],
        day_plans: [
          {
            kind: "plan",
            start_time: now + oneDayInSeconds * 7,
            end_time: now + oneDayInSeconds * 7 + oneHourInSeconds * 2,
            location: {
              kind: "landmark",
              name: "Colosseum",
              description: "Ancient Roman amphitheater in the center of Rome.",
              photos: [
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnQn9_MUxuyr9bpFfRdrr648f7RvB7DPQ0dQ&s",
              ],
              coordinates: {
                latitude: 41.8902,
                longitude: 12.4922,
              },
              destination: {
                name: "Rome",
                city: "Rome",
                country: "Italy",
              },
            },
          },
        ],
        weather: [
          {
            condition: "sunny",
            temperature: 28,
            start_time: now + oneDayInSeconds * 7,
            end_time: now + oneDayInSeconds * 7 + oneHourInSeconds * 24,
          },
        ],
      },
    ],
  };
  tripItineraryContainer.appendChild(tripItinerary);
}
