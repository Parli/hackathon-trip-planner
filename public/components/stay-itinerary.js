/**
 * A web component that presents a list of day plans for a stay
 * Should show a title for the city name
 * Underneath that it should show a section titled "Things to do" with
 * a carousel of <place-card/> components with food places filtered out
 * After that section it should show one titled "Food Places" with
 * a carousel of <place-card/> components filtered by food places
 * Takes in the data defined as a stay from the research.js JSON schema object
 */
import "./day-plan.js";
import "./place-card.js";
import "./card-carousel.js";
import { getPlaceResearch } from "/research.js";
import * as TripState from "/state.js";

class StayItinerary extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._stay = null;
    this._dayPlans = [];
    this._handlePlaceDelete = this._handlePlaceDelete.bind(this);
    this._handleDayDelete = this._handleDayDelete.bind(this);
    this._handlePlanDelete = this._handlePlanDelete.bind(this);
    this.render();
  }
  
  connectedCallback() {
    this.shadowRoot.addEventListener('place-delete', this._handlePlaceDelete);
    this.shadowRoot.addEventListener('day-delete', this._handleDayDelete);
    this.shadowRoot.addEventListener('plan-delete', this._handlePlanDelete);
  }
  
  disconnectedCallback() {
    this.shadowRoot.removeEventListener('place-delete', this._handlePlaceDelete);
    this.shadowRoot.removeEventListener('day-delete', this._handleDayDelete);
    this.shadowRoot.removeEventListener('plan-delete', this._handlePlanDelete);
  }

  get stay() {
    return this._stay;
  }

  set stay(value) {
    this._stay = value;
    if (value && value.day_plans) {
      this._processStayData();
    }
    this.render();
  }

  _processStayData() {
    if (!this._stay || !this._stay.day_plans) return;

    // Group day plans by day
    const dayPlans = {};

    // Sort day plans by start time
    const sortedPlans = [...this._stay.day_plans].sort(
      (a, b) => a.start_time - b.start_time
    );

    // Group by day
    sortedPlans.forEach((plan) => {
      const date = new Date(plan.start_time * 1000);
      const dayKey = `${date.getFullYear()}-${
        date.getMonth() + 1
      }-${date.getDate()}`;

      if (!dayPlans[dayKey]) {
        dayPlans[dayKey] = {
          date: new Date(date).setHours(0, 0, 0, 0) / 1000, // Beginning of the day in seconds
          activities: [],
          weather: null,
        };
      }

      dayPlans[dayKey].activities.push(plan);
    });

    // Add weather to each day if available
    if (this._stay.weather && this._stay.weather.length > 0) {
      this._stay.weather.forEach((weather) => {
        const date = new Date(weather.start_time * 1000);
        const dayKey = `${date.getFullYear()}-${
          date.getMonth() + 1
        }-${date.getDate()}`;

        if (dayPlans[dayKey]) {
          dayPlans[dayKey].weather = weather;
        }
      });
    }

    // Convert to array and sort by date
    this._dayPlans = Object.values(dayPlans).sort((a, b) => a.date - b.date);
  }

  _filterActivitiesByFood(activities, wantFood) {
    if (!activities || !activities.length) return [];

    return activities.filter((activity) => {
      if (activity.kind !== "plan") return false;

      const isFood = activity.location.kind === "food";
      return wantFood ? isFood : !isFood;
    });
  }

  render() {
    if (!this._stay) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            padding: 1rem;
          }
        </style>
        <div>No stay data available</div>
      `;
      return;
    }

    const { destination, options } = this._stay;
    const cityName = destination.city;

    // Filter options by food and non-food
    const foodPlaces = options
      ? options.filter((place) => place.kind === "food")
      : [];
    const activityPlaces = options
      ? options.filter((place) => place.kind !== "food")
      : [];

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 1rem;
          font-family: Arial, sans-serif;
        }

        .title {
          font-size: 1.8rem;
          font-weight: bold;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #333;
        }

        .section {
          margin-bottom: 2rem;
        }

        .section-title {
          font-size: 1.4rem;
          font-weight: bold;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
        }

        .section-icon {
          margin-right: 0.5rem;
          font-size: 1.4rem;
        }
        
        .search-container {
          margin-left: auto;
          position: relative;
        }
        
        .search-input {
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 0.9rem;
          width: 200px;
        }
        
        .search-loading {
          position: absolute;
          top: 35px;
          right: 0;
          background-color: #f8f8f8;
          padding: 5px 10px;
          border-radius: 4px;
          border: 1px solid #ddd;
          font-size: 0.8rem;
          z-index: 100;
        }

        card-carousel {
          width: 100%;
          margin-bottom: 1rem;
        }

        .day-plans {
          margin-top: 2rem;
        }

        .empty-state {
          padding: 2rem;
          text-align: center;
          background-color: #f9f9f9;
          border-radius: 8px;
          color: #666;
          margin: 1rem 0;
        }
      </style>

      <h1 class="title">${cityName}</h1>

      <div class="section">
        <div class="section-title">
          <span class="section-icon">🎭</span>
          <span>Things to Do</span>
          <div class="search-container">
            <input type="text" id="activities-search" placeholder="Search for activities..." class="search-input">
          </div>
        </div>

        ${
          activityPlaces.length > 0
            ? '<card-carousel id="activities-carousel"></card-carousel>'
            : '<div class="empty-state">No activities available for this destination yet</div>'
        }
      </div>

      <div class="section">
        <div class="section-title">
          <span class="section-icon">🍽️</span>
          <span>Food Places</span>
          <div class="search-container">
            <input type="text" id="food-search" placeholder="Search for restaurants..." class="search-input">
          </div>
        </div>

        ${
          foodPlaces.length > 0
            ? '<card-carousel id="food-carousel"></card-carousel>'
            : '<div class="empty-state">No food places available for this destination yet</div>'
        }
      </div>

      <div class="day-plans">
        ${
          this._dayPlans.length > 0
            ? this._dayPlans
                .map(
                  (dayPlan, index) => `<day-plan id="day-${index}"></day-plan>`
                )
                .join("")
            : '<div class="empty-state">No daily plans available for this destination yet</div>'
        }
      </div>
    `;

    // Create and populate place cards for activities carousel
    if (activityPlaces.length > 0) {
      const activitiesCarousel = this.shadowRoot.getElementById('activities-carousel');
      if (activitiesCarousel) {
        const activityCards = activityPlaces.map(place => {
          const card = document.createElement('place-card');
          card.place = place;
          return card;
        });
        activitiesCarousel.cards = activityCards;
      }
    }

    // Create and populate place cards for food carousel
    if (foodPlaces.length > 0) {
      const foodCarousel = this.shadowRoot.getElementById('food-carousel');
      if (foodCarousel) {
        const foodCards = foodPlaces.map(place => {
          const card = document.createElement('place-card');
          card.place = place;
          return card;
        });
        foodCarousel.cards = foodCards;
      }
    }

    // Set data for day plans
    this._dayPlans.forEach((dayPlan, index) => {
      const element = this.shadowRoot.getElementById(`day-${index}`);
      if (element) {
        element.date = dayPlan.date;
        element.activities = dayPlan.activities;
        element.weather = dayPlan.weather;
      }
    });
    
    // Add event listeners for search inputs
    const activitiesSearch = this.shadowRoot.getElementById('activities-search');
    const foodSearch = this.shadowRoot.getElementById('food-search');
    
    if (activitiesSearch) {
      activitiesSearch.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter' && activitiesSearch.value.trim()) {
          const query = activitiesSearch.value.trim();
          const destination = this._stay.destination;
          
          try {
            // Show loading indicator
            const loadingIndicator = document.createElement('div');
            loadingIndicator.textContent = 'Searching...';
            loadingIndicator.className = 'search-loading';
            activitiesSearch.parentNode.appendChild(loadingIndicator);
            
            // Get new activities
            const newPlaces = await getPlaceResearch(query, destination);
            
            // Update the underlying data structure
            if (newPlaces.length > 0 && this._stay) {
              // Get existing options
              const existingOptions = this._stay.options || [];
              
              // Get food places from existing options
              const foodPlaces = existingOptions.filter(place => place.kind === "food");
              
              // Get existing non-food places
              const existingNonFoodPlaces = existingOptions.filter(place => place.kind !== "food");
              
              // Get new non-food places from search results
              const newNonFoodPlaces = newPlaces.filter(place => place.kind !== "food");
              
              // Create updated stay with new options - new places at the start
              const updatedStay = {
                ...this._stay,
                options: [...newNonFoodPlaces, ...existingNonFoodPlaces, ...foodPlaces]
              };
              
              // Update the stay in the trip state using its ID
              TripState.update(this._stay.id, updatedStay);
              
              // Save the updated trip data
              TripState.saveTrip();
            }
            
            // Remove loading indicator
            if (loadingIndicator && loadingIndicator.parentNode) {
              loadingIndicator.parentNode.removeChild(loadingIndicator);
            }
          } catch (error) {
            console.error('Error searching for activities:', error);
          }
        }
      });
    }
    
    if (foodSearch) {
      foodSearch.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter' && foodSearch.value.trim()) {
          const query = foodSearch.value.trim();
          const destination = this._stay.destination;
          
          try {
            // Show loading indicator
            const loadingIndicator = document.createElement('div');
            loadingIndicator.textContent = 'Searching...';
            loadingIndicator.className = 'search-loading';
            foodSearch.parentNode.appendChild(loadingIndicator);
            
            // Get new food places
            const newPlaces = await getPlaceResearch(query, destination);
            
            // Update the underlying data structure
            if (newPlaces.length > 0 && this._stay) {
              // Get existing options
              const existingOptions = this._stay.options || [];
              
              // Get non-food places from existing options
              const nonFoodPlaces = existingOptions.filter(place => place.kind !== "food");
              
              // Get existing food places
              const existingFoodPlaces = existingOptions.filter(place => place.kind === "food");
              
              // Get new food places from search results
              const newFoodPlaces = newPlaces.filter(place => place.kind === "food");
              
              // Create updated stay with new options - new places at the start
              const updatedStay = {
                ...this._stay,
                options: [...newFoodPlaces, ...existingFoodPlaces, ...nonFoodPlaces]
              };
              
              // Update the stay in the trip state using its ID
              TripState.update(this._stay.id, updatedStay);
              
              // Save the updated trip data
              TripState.saveTrip();
            }
            
            // Remove loading indicator
            if (loadingIndicator && loadingIndicator.parentNode) {
              loadingIndicator.parentNode.removeChild(loadingIndicator);
            }
          } catch (error) {
            console.error('Error searching for food places:', error);
          }
        }
      });
    }
  }
  
  /**
   * Handle the place-delete event from a place-card
   * @param {CustomEvent} event The place-delete event
   */
  _handlePlaceDelete(event) {
    const place = event.detail.place;
    
    if (!place || !place.id || !this._stay || !this._stay.options) return;
    
    // Filter out the place with the matching ID
    const updatedOptions = this._stay.options.filter(option => option.id !== place.id);
    
    // Create an updated stay object
    const updatedStay = {
      ...this._stay,
      options: updatedOptions
    };
    
    // Update the stay in the trip state
    TripState.update(this._stay.id, updatedStay);
    
    // Save the updated trip data
    TripState.saveTrip();
  }
  
  /**
   * Handle the day-delete event from a day-plan
   * @param {CustomEvent} event The day-delete event
   */
  _handleDayDelete(event) {
    const { date, activities } = event.detail;
    
    if (!date || !this._stay || !this._stay.day_plans) return;
    
    // Get the beginning of the day in seconds
    const dayStart = new Date(date * 1000).setHours(0, 0, 0, 0) / 1000;
    const dayEnd = new Date(date * 1000).setHours(23, 59, 59, 999) / 1000;
    
    // Filter out all activities for this day
    const updatedDayPlans = this._stay.day_plans.filter(plan => {
      return plan.start_time < dayStart || plan.start_time > dayEnd;
    });
    
    // Create an updated stay object
    const updatedStay = {
      ...this._stay,
      day_plans: updatedDayPlans
    };
    
    // Update the stay in the trip state
    TripState.update(this._stay.id, updatedStay);
    
    // Save the updated trip data
    TripState.saveTrip();
  }
  
  /**
   * Handle the plan-delete event from a plan-item
   * @param {CustomEvent} event The plan-delete event
   */
  _handlePlanDelete(event) {
    const { plan } = event.detail;
    
    if (!plan || !plan.id || !this._stay || !this._stay.day_plans) return;
    
    // Filter out the plan with the matching ID
    const updatedDayPlans = this._stay.day_plans.filter(item => {
      // Check if the item has an ID and it doesn't match the plan ID
      return !item.id || item.id !== plan.id;
    });
    
    // Create an updated stay object
    const updatedStay = {
      ...this._stay,
      day_plans: updatedDayPlans
    };
    
    // Update the stay in the trip state
    TripState.update(this._stay.id, updatedStay);
    
    // Save the updated trip data
    TripState.saveTrip();
  }
}

customElements.define("stay-itinerary", StayItinerary);
