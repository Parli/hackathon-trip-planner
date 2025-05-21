/**
 * A web component that presents a list of day plans for a stay
 * Should show a title for the city name
 * Underneath that it should show a section titled "Things to do" with
 * a carousel of <place-card/> components with food places filtered out
 * After that section it should show one titled "Food Places" with
 * a carousel of <place-card/> components filtered by food places
 * Takes in the data defined as a stay from the research.js JSON schema object
 */
import './day-plan.js';
import './place-card.js';

class StayItinerary extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._stay = null;
    this._dayPlans = [];
    this.render();
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
    const sortedPlans = [...this._stay.day_plans].sort((a, b) => a.start_time - b.start_time);
    
    // Group by day
    sortedPlans.forEach(plan => {
      const date = new Date(plan.start_time * 1000);
      const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      
      if (!dayPlans[dayKey]) {
        dayPlans[dayKey] = {
          date: new Date(date).setHours(0, 0, 0, 0) / 1000, // Beginning of the day in seconds
          activities: [],
          weather: null
        };
      }
      
      dayPlans[dayKey].activities.push(plan);
    });
    
    // Add weather to each day if available
    if (this._stay.weather && this._stay.weather.length > 0) {
      this._stay.weather.forEach(weather => {
        const date = new Date(weather.start_time * 1000);
        const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        
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
    
    return activities.filter(activity => {
      if (activity.kind !== 'plan') return false;
      
      const isFood = activity.location.kind === 'food';
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
    const cityName = destination.city || destination.name;
    
    // Filter options by food and non-food
    const foodPlaces = options ? options.filter(place => place.kind === 'food') : [];
    const activityPlaces = options ? options.filter(place => place.kind !== 'food') : [];
    
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
        
        .carousel {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
          overflow-x: auto;
          padding: 0.5rem;
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
        </div>
        
        <div class="carousel" id="activities-carousel">
          ${activityPlaces.length > 0 ?
            activityPlaces.map((place, index) => 
              `<place-card id="activity-${index}"></place-card>`
            ).join('') :
            '<div class="empty-state">No activities available for this destination yet</div>'
          }
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">
          <span class="section-icon">🍽️</span>
          <span>Food Places</span>
        </div>
        
        <div class="carousel" id="food-carousel">
          ${foodPlaces.length > 0 ?
            foodPlaces.map((place, index) => 
              `<place-card id="food-${index}"></place-card>`
            ).join('') :
            '<div class="empty-state">No food places available for this destination yet</div>'
          }
        </div>
      </div>
      
      <div class="day-plans">
        ${this._dayPlans.length > 0 ?
          this._dayPlans.map((dayPlan, index) =>
            `<day-plan id="day-${index}"></day-plan>`
          ).join('') :
          '<div class="empty-state">No daily plans available for this destination yet</div>'
        }
      </div>
    `;
    
    // Set data for place cards after they're created
    activityPlaces.forEach((place, index) => {
      const element = this.shadowRoot.getElementById(`activity-${index}`);
      if (element) {
        element.place = place;
      }
    });
    
    foodPlaces.forEach((place, index) => {
      const element = this.shadowRoot.getElementById(`food-${index}`);
      if (element) {
        element.place = place;
      }
    });
    
    // Set data for day plans
    this._dayPlans.forEach((dayPlan, index) => {
      const element = this.shadowRoot.getElementById(`day-${index}`);
      if (element) {
        element.date = dayPlan.date;
        element.activities = dayPlan.activities;
        element.weather = dayPlan.weather;
      }
    });
  }
}

customElements.define('stay-itinerary', StayItinerary);
