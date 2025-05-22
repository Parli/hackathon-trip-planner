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
    this._handlePlaceDelete = this._handlePlaceDelete.bind(this);
    this._handleDayDelete = this._handleDayDelete.bind(this);
    this._handlePlanDelete = this._handlePlanDelete.bind(this);
    this._handleAddToPlan = this._handleAddToPlan.bind(this);
    this._handlePlanMove = this._handlePlanMove.bind(this);
    this._handleDayMove = this._handleDayMove.bind(this);
    this._handleAddDay = this._handleAddDay.bind(this);
    this._updateStayBoundaries = this._updateStayBoundaries.bind(this);
    this.render();
  }

  connectedCallback() {
    this.shadowRoot.addEventListener("place-delete", this._handlePlaceDelete);
    this.shadowRoot.addEventListener("day-delete", this._handleDayDelete);
    this.shadowRoot.addEventListener("plan-delete", this._handlePlanDelete);
    this.shadowRoot.addEventListener(
      "place-add-to-plan",
      this._handleAddToPlan
    );
    this.shadowRoot.addEventListener("plan-move", this._handlePlanMove);
    this.shadowRoot.addEventListener("day-move", this._handleDayMove);
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener(
      "place-delete",
      this._handlePlaceDelete
    );
    this.shadowRoot.removeEventListener("day-delete", this._handleDayDelete);
    this.shadowRoot.removeEventListener("plan-delete", this._handlePlanDelete);
    this.shadowRoot.removeEventListener(
      "place-add-to-plan",
      this._handleAddToPlan
    );
    this.shadowRoot.removeEventListener("plan-move", this._handlePlanMove);
    this.shadowRoot.removeEventListener("day-move", this._handleDayMove);
  }

  get stay() {
    return this._stay;
  }

  set stay(value) {
    this._stay = value;
    this.render();
  }

  /**
   * Gets an array of day timestamps for each day in the stay duration
   * @returns {Array<number>} Array of timestamps for the beginning of each day in the stay
   */
  _getDaysInStayDuration() {
    // Return empty array if no arrival or departure time
    if (!this._stay || !this._stay.arrival_time || !this._stay.departure_time) {
      return [];
    }

    // Convert timestamps to Date objects
    const arrivalDate = new Date(this._stay.arrival_time * 1000);
    const departureDate = new Date(this._stay.departure_time * 1000);

    // Set to beginning of day for consistent comparison
    arrivalDate.setHours(0, 0, 0, 0);
    departureDate.setHours(0, 0, 0, 0);

    // Calculate number of days in the stay
    const dayDiff = Math.floor(
      (departureDate - arrivalDate) / (1000 * 60 * 60 * 24)
    );

    // Return empty array if invalid date range
    if (dayDiff < 0) {
      return [];
    }

    // Create array of day timestamps
    const days = [];
    for (let i = 0; i <= dayDiff; i++) {
      const currentDate = new Date(arrivalDate);
      currentDate.setDate(arrivalDate.getDate() + i);
      currentDate.setHours(0, 0, 0, 0);
      days.push(Math.floor(currentDate.getTime() / 1000));
    }

    return days;
  }

  /**
   * Get unique dates for all days in the stay, including empty days
   * @returns {Array} Array of day objects with just date property for each day in stay duration
   * @private
   */
  _getProcessedDayPlans() {
    if (!this._stay) return [];

    // Get all days in the stay duration
    const daysInStay = this._getDaysInStayDuration();

    // If there are no days in the stay duration (no arrival/departure times)
    if (daysInStay.length === 0) {
      // If there are plans but no arrival/departure times, create days for those plans
      if (this._stay.day_plans && this._stay.day_plans.length > 0) {
        return this._getDaysFromPlans();
      }
      return [];
    }

    // Create a map of all days with just the date property
    const dayPlans = {};

    // Initialize days from the stay duration
    daysInStay.forEach((dayTimestamp) => {
      const date = new Date(dayTimestamp * 1000);
      const dayKey = `${date.getFullYear()}-${
        date.getMonth() + 1
      }-${date.getDate()}`;

      dayPlans[dayKey] = {
        date: dayTimestamp,
      };
    });

    // If there are plans, add any days not already in our map
    if (this._stay.day_plans && this._stay.day_plans.length > 0) {
      this._stay.day_plans.forEach((plan) => {
        const date = new Date(plan.start_time * 1000);
        const dayKey = `${date.getFullYear()}-${
          date.getMonth() + 1
        }-${date.getDate()}`;

        // If this day isn't in our day map (could be outside stay duration), create it
        if (!dayPlans[dayKey]) {
          dayPlans[dayKey] = {
            date: new Date(date).setHours(0, 0, 0, 0) / 1000,
          };
        }
      });
    }

    // Convert to array and sort by date
    return Object.values(dayPlans).sort((a, b) => a.date - b.date);
  }

  /**
   * Get unique dates from plans when there's no arrival/departure times
   * @returns {Array} Array of day objects with just date property
   * @private
   */
  _getDaysFromPlans() {
    if (
      !this._stay ||
      !this._stay.day_plans ||
      this._stay.day_plans.length === 0
    ) {
      return [];
    }

    // Group plans by day
    const dayPlans = {};

    // Group plans by day, just keeping the date
    this._stay.day_plans.forEach((plan) => {
      const date = new Date(plan.start_time * 1000);
      const dayKey = `${date.getFullYear()}-${
        date.getMonth() + 1
      }-${date.getDate()}`;

      if (!dayPlans[dayKey]) {
        dayPlans[dayKey] = {
          date: new Date(date).setHours(0, 0, 0, 0) / 1000,
        };
      }
    });

    // Convert to array and sort by date
    return Object.values(dayPlans).sort((a, b) => a.date - b.date);
  }

  /**
   * Calculate the earliest start time and latest end time from day plans
   * @param {Array} dayPlans Array of day plans to analyze
   * @returns {Object} Object with earliestStartTime and latestEndTime
   * @private
   */
  _calculatePlanBoundaries(dayPlans) {
    if (!dayPlans || dayPlans.length === 0) {
      return { earliestStartTime: null, latestEndTime: null };
    }

    // Find the earliest plan start day (beginning of day)
    const earliestPlanDay = Math.min(
      ...dayPlans.map((plan) => {
        const planDate = new Date(plan.start_time * 1000);
        planDate.setHours(0, 0, 0, 0);
        return Math.floor(planDate.getTime() / 1000);
      })
    );

    // Find the latest plan end day (end of day)
    const latestPlanDay = Math.max(
      ...dayPlans.map((plan) => {
        const planDate = new Date(plan.end_time * 1000);
        planDate.setHours(23, 59, 59, 999);
        return Math.floor(planDate.getTime() / 1000);
      })
    );

    return {
      earliestStartTime: earliestPlanDay,
      latestEndTime: latestPlanDay,
    };
  }

  /**
   * Update the stay's arrival and departure times based on day plans
   * @param {Object} stay The stay object to update
   * @returns {Object} Updated stay object with adjusted arrival and departure times
   * @private
   */
  _updateStayBoundaries(stay) {
    if (!stay || !stay.day_plans || stay.day_plans.length === 0) {
      return stay;
    }

    // Calculate plan boundaries
    const { earliestStartTime, latestEndTime } = this._calculatePlanBoundaries(
      stay.day_plans
    );

    // Only update if we found valid times
    const updatedStay = { ...stay };

    if (earliestStartTime !== null) {
      // Update arrival time if not set or if plans start earlier
      if (
        !updatedStay.arrival_time ||
        earliestStartTime < updatedStay.arrival_time
      ) {
        updatedStay.arrival_time = earliestStartTime;
      }
    }

    if (latestEndTime !== null) {
      // Update departure time if not set or if plans end later
      if (
        !updatedStay.departure_time ||
        latestEndTime > updatedStay.departure_time
      ) {
        updatedStay.departure_time = latestEndTime;
      }
    }

    return updatedStay;
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

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .add-day-button {
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .add-day-button:hover {
          background-color: #45a049;
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

      <div class="day-plans-section">
        <div class="section-header">
          <h2 class="section-title">
            <span class="section-icon">📅</span>
            <span>Daily Plans</span>
          </h2>
        </div>
        <div class="day-plans">
          ${(() => {
            const dayPlans = this._getProcessedDayPlans();
            return dayPlans.length > 0
              ? dayPlans
                  .map(
                    (dayPlan, index) =>
                      `<day-plan id="day-${index}"></day-plan>`
                  )
                  .join("")
              : '<div class="empty-state">No daily plans available for this destination yet<br><button id="add-day-button" class="add-day-button">+ Add New Day</button></div>';
          })()}
        </div>
      </div>
    `;

    // Create and populate place cards for activities carousel
    if (activityPlaces.length > 0) {
      const activitiesCarousel = this.shadowRoot.getElementById(
        "activities-carousel"
      );
      if (activitiesCarousel) {
        const activityCards = activityPlaces.map((place) => {
          const card = document.createElement("place-card");
          card.place = place;
          return card;
        });
        activitiesCarousel.cards = activityCards;
      }
    }

    // Create and populate place cards for food carousel
    if (foodPlaces.length > 0) {
      const foodCarousel = this.shadowRoot.getElementById("food-carousel");
      if (foodCarousel) {
        const foodCards = foodPlaces.map((place) => {
          const card = document.createElement("place-card");
          card.place = place;
          return card;
        });
        foodCarousel.cards = foodCards;
      }
    }

    // Set data for day plans
    const dayPlans = this._getProcessedDayPlans();
    dayPlans.forEach((dayPlan, index) => {
      const element = this.shadowRoot.getElementById(`day-${index}`);
      if (element) {
        // Set stay and date properties
        element.stay = this._stay;
        element.date = dayPlan.date;
      }
    });

    // Add event listener for add day button (now in empty state)
    const addDayButton = this.shadowRoot.getElementById("add-day-button");
    if (addDayButton) {
      addDayButton.addEventListener("click", this._handleAddDay);
    }

    // Add event listeners for search inputs
    const activitiesSearch =
      this.shadowRoot.getElementById("activities-search");
    const foodSearch = this.shadowRoot.getElementById("food-search");

    if (activitiesSearch) {
      activitiesSearch.addEventListener("keypress", async (e) => {
        if (e.key === "Enter" && activitiesSearch.value.trim()) {
          const query = activitiesSearch.value.trim();
          const destination = this._stay.destination;

          try {
            // Show loading indicator
            const loadingIndicator = document.createElement("div");
            loadingIndicator.textContent = "Searching...";
            loadingIndicator.className = "search-loading";
            activitiesSearch.parentNode.appendChild(loadingIndicator);

            // Get new activities
            const newPlaces = await getPlaceResearch(query, destination);

            // Update the underlying data structure
            if (newPlaces.length > 0 && this._stay) {
              // Get existing options
              const existingOptions = this._stay.options || [];

              // Get food places from existing options
              const foodPlaces = existingOptions.filter(
                (place) => place.kind === "food"
              );

              // Get existing non-food places
              const existingNonFoodPlaces = existingOptions.filter(
                (place) => place.kind !== "food"
              );

              // Get new non-food places from search results
              const newNonFoodPlaces = newPlaces.filter(
                (place) => place.kind !== "food"
              );

              // Create updated stay with new options - new places at the start
              const updatedStay = {
                ...this._stay,
                options: [
                  ...newNonFoodPlaces,
                  ...existingNonFoodPlaces,
                  ...foodPlaces,
                ],
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
            console.error("Error searching for activities:", error);
          }
        }
      });
    }

    if (foodSearch) {
      foodSearch.addEventListener("keypress", async (e) => {
        if (e.key === "Enter" && foodSearch.value.trim()) {
          const query = foodSearch.value.trim();
          const destination = this._stay.destination;

          try {
            // Show loading indicator
            const loadingIndicator = document.createElement("div");
            loadingIndicator.textContent = "Searching...";
            loadingIndicator.className = "search-loading";
            foodSearch.parentNode.appendChild(loadingIndicator);

            // Get new food places
            const newPlaces = await getPlaceResearch(query, destination);

            // Update the underlying data structure
            if (newPlaces.length > 0 && this._stay) {
              // Get existing options
              const existingOptions = this._stay.options || [];

              // Get non-food places from existing options
              const nonFoodPlaces = existingOptions.filter(
                (place) => place.kind !== "food"
              );

              // Get existing food places
              const existingFoodPlaces = existingOptions.filter(
                (place) => place.kind === "food"
              );

              // Get new food places from search results
              const newFoodPlaces = newPlaces.filter(
                (place) => place.kind === "food"
              );

              // Create updated stay with new options - new places at the start
              const updatedStay = {
                ...this._stay,
                options: [
                  ...newFoodPlaces,
                  ...existingFoodPlaces,
                  ...nonFoodPlaces,
                ],
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
            console.error("Error searching for food places:", error);
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
    const updatedOptions = this._stay.options.filter(
      (option) => option.id !== place.id
    );

    // Create an updated stay object
    const updatedStay = {
      ...this._stay,
      options: updatedOptions,
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

    // Get current options or initialize empty array
    const currentOptions = this._stay.options || [];

    // Determine if this is the first day in the stay
    const isFirstDay = dayStart === this._stay.arrival_time;

    // Separate day plans into those for this day, before this day, and after this day
    const removedDayPlans = [];
    const updatedDayPlans = [];

    this._stay.day_plans.forEach((plan) => {
      if (plan.start_time >= dayStart && plan.start_time <= dayEnd) {
        removedDayPlans.push(plan);
      } else if (plan.start_time < dayStart) {
        updatedDayPlans.push(plan);
      } else if (plan.start_time > dayEnd) {
        // Create a copy of the plan to modify
        const updatedPlan = { ...plan };

        // Only shift times if it's not the first day
        if (!isFirstDay) {
          // Decrement time by 1 day (86400 seconds) for plans after the deleted day
          updatedPlan.start_time -= 86400;
          updatedPlan.end_time -= 86400;
        }

        updatedDayPlans.push(updatedPlan);
      }
    });

    // Extract locations from day plans to move back to options
    const locationsToAdd = removedDayPlans
      .filter((plan) => plan.kind === "plan" && plan.location)
      .map((plan) => plan.location);

    // Create updated options list with the removed locations added back
    const updatedOptions = [...locationsToAdd, ...currentOptions];

    // Create a preliminary updated stay object
    let updatedStay = {
      ...this._stay,
      day_plans: updatedDayPlans,
      options: updatedOptions,
    };

    // Handle the time adjustments based on whether it's the first day or not
    if (isFirstDay) {
      // If deleting the first day, increment arrival time by 1 day
      if (updatedStay.arrival_time) {
        updatedStay.arrival_time += 86400;
      }
    } else {
      // If not the first day, decrement departure time by 1 day
      if (updatedStay.departure_time) {
        updatedStay.departure_time -= 86400;
      }
    }

    // Reset times to null if there are no more days
    if (updatedStay.departure_time < updatedStay.arrival_time) {
      updatedStay.arrival_time = null;
      updatedStay.departure_time = null;
    }

    // Update arrival and departure times based on remaining plans
    updatedStay = this._updateStayBoundaries(updatedStay);

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
    const updatedDayPlans = this._stay.day_plans.filter((item) => {
      // Check if the item has an ID and it doesn't match the plan ID
      return !item.id || item.id !== plan.id;
    });

    // Get the location from the plan to add back to options
    const location = plan.location;

    // Get current options or initialize empty array
    const currentOptions = this._stay.options || [];

    // Create an updated options list with the removed location added back
    const updatedOptions = [location, ...currentOptions];

    // Create a preliminary updated stay object
    let updatedStay = {
      ...this._stay,
      day_plans: updatedDayPlans,
      options: updatedOptions,
    };

    // Update stay boundaries based on the remaining plans
    updatedStay = this._updateStayBoundaries(updatedStay);

    // Update the stay in the trip state
    TripState.update(this._stay.id, updatedStay);

    // Save the updated trip data
    TripState.saveTrip();
  }

  /**
   * Handle the plan-move event from a plan-item
   * @param {CustomEvent} event The plan-move event
   */
  _handlePlanMove(event) {
    const { plan, direction } = event.detail;

    if (!plan || !plan.id || !this._stay || !this._stay.day_plans) return;

    // Find the index of the plan to move
    const planIndex = this._stay.day_plans.findIndex(
      (item) => item.id === plan.id
    );

    if (planIndex === -1) return; // Plan not found

    // Create a copy of the day plans
    const updatedDayPlans = [...this._stay.day_plans];
    const planToUpdate = { ...updatedDayPlans[planIndex] };

    // Calculate duration of the plan
    const duration = planToUpdate.end_time - planToUpdate.start_time;

    // Create Date objects for start and end times
    const startDate = new Date(planToUpdate.start_time * 1000);
    const endDate = new Date(planToUpdate.end_time * 1000);

    // Adjust time based on direction - move up or down by 1 hour
    if (direction === "up") {
      // Move up (earlier) by 1 hour
      startDate.setHours(startDate.getHours() - 1);
      endDate.setHours(endDate.getHours() - 1);
    } else if (direction === "down") {
      // Move down (later) by 1 hour
      startDate.setHours(startDate.getHours() + 1);
      endDate.setHours(endDate.getHours() + 1);
    }

    // Update the plan with new times
    planToUpdate.start_time = Math.floor(startDate.getTime() / 1000);
    planToUpdate.end_time = Math.floor(endDate.getTime() / 1000);

    // Update the plan in the day plans array
    updatedDayPlans[planIndex] = planToUpdate;

    // Create a preliminary updated stay object
    let updatedStay = {
      ...this._stay,
      day_plans: updatedDayPlans,
    };

    // Update arrival and departure times based on the updated plans
    updatedStay = this._updateStayBoundaries(updatedStay);

    // Update the stay in the trip state
    TripState.update(this._stay.id, updatedStay);

    // Save the updated trip data
    TripState.saveTrip();
  }

  /**
   * Handle the place-add-to-plan event from a place-card
   * @param {CustomEvent} event The place-add-to-plan event
   */
  _handleAddToPlan(event) {
    const place = event.detail.place;

    if (!place || !place.id || !this._stay) return;

    // Get current options or initialize empty array
    const currentOptions = this._stay.options || [];

    // Remove the place from options
    const updatedOptions = currentOptions.filter(
      (option) => option.id !== place.id
    );

    // Initialize day_plans if it doesn't exist
    if (!this._stay.day_plans) {
      this._stay.day_plans = [];
    }

    // Determine the start time for the plan
    let startTime;

    // First check if there are any existing day_plans
    if (this._stay.day_plans.length > 0) {
      // Find the latest end time among all existing plans
      const latestEndTime = Math.max(
        ...this._stay.day_plans.map((plan) => plan.end_time || 0)
      );
      startTime = latestEndTime;
    } else if (this._stay.arrival_time) {
      // If no existing plans but arrival time is set, use that
      startTime = this._stay.arrival_time;
    } else {
      // If no arrival time, use the trip start time
      const trip = TripState.getTrip();
      if (trip && trip.timeline && trip.timeline.start_date) {
        // Convert trip start date to timestamp
        const startDate = new Date(
          trip.timeline.start_date.year,
          trip.timeline.start_date.month - 1, // JavaScript months are 0-indexed
          trip.timeline.start_date.day
        );
        startDate.setHours(0, 0, 0, 0);
        startTime = Math.floor(startDate.getTime() / 1000);
      } else {
        // Fallback to current time
        startTime = Math.floor(Date.now() / 1000);
      }
    }

    // Create a new plan with 1 hour duration
    const endTime = startTime + 3600; // Add 1 hour (3600 seconds)

    // Create a unique ID for the plan
    const planId = `plan-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create the plan object
    const plan = {
      id: planId,
      kind: "plan",
      location: place,
      start_time: startTime,
      end_time: endTime,
    };

    // Add the new plan to day_plans
    let updatedStay = {
      ...this._stay,
      options: updatedOptions,
      day_plans: [...this._stay.day_plans, plan],
    };

    // Update stay boundaries based on the new plan
    updatedStay = this._updateStayBoundaries(updatedStay);

    // Update the stay in the trip state
    TripState.update(this._stay.id, updatedStay);

    // Save the updated trip data
    TripState.saveTrip();
  }

  /**
   * Handle the day-move event from a day-plan
   * @param {CustomEvent} event The day-move event
   */
  _handleDayMove(event) {
    const { date, activities, direction, isEmpty } = event.detail;

    if (!date || !this._stay) return;

    // Get the beginning and end of the day in seconds
    const dayStart = new Date(date * 1000).setHours(0, 0, 0, 0) / 1000;
    const dayEnd = new Date(date * 1000).setHours(23, 59, 59, 999) / 1000;

    // Calculate the time shift (86400 seconds = 1 day)
    const timeShift = direction === "earlier" ? -86400 : 86400;

    // Initialize day_plans if it doesn't exist
    if (!this._stay.day_plans) {
      this._stay.day_plans = [];
    }

    // Separate day plans into those for this day and other days
    const dayPlans = [];
    const otherDayPlans = [];

    this._stay.day_plans.forEach((plan) => {
      if (plan.start_time >= dayStart && plan.start_time <= dayEnd) {
        dayPlans.push(plan);
      } else {
        otherDayPlans.push(plan);
      }
    });

    // Create a copy of the stay to modify
    let updatedStay = { ...this._stay };

    // If there are plans in the day, move them
    if (dayPlans.length > 0) {
      // Create a copy of the day plans to be moved and shift their times
      const movedDayPlans = dayPlans.map((plan) => {
        const updatedPlan = { ...plan };
        updatedPlan.start_time += timeShift;
        updatedPlan.end_time += timeShift;
        return updatedPlan;
      });

      // Combine the moved plans with the other plans
      updatedStay.day_plans = [...otherDayPlans, ...movedDayPlans];

      // Update arrival and departure times based on the updated plans
      updatedStay = this._updateStayBoundaries(updatedStay);
    } else {
      // No plans to move, just adjust the stay's arrival/departure times
      if (direction === "earlier") {
        // Moving day earlier
        const newDayStart = dayStart + timeShift; // Subtract one day

        // Update arrival time if this affects it
        if (
          !updatedStay.arrival_time ||
          newDayStart < updatedStay.arrival_time
        ) {
          updatedStay.arrival_time = newDayStart;
        }
      } else {
        // Moving day later
        const newDayEnd = dayEnd + timeShift; // Add one day

        // Update departure time if this affects it
        if (
          !updatedStay.departure_time ||
          newDayEnd > updatedStay.departure_time
        ) {
          updatedStay.departure_time = newDayEnd;
        }
      }
    }

    // Update the stay in the trip state
    TripState.update(this._stay.id, updatedStay);

    // Save the updated trip data
    TripState.saveTrip();
  }

  /**
   * Handle clicks on the Add New Day button
   * @param {Event} event The click event
   */
  _handleAddDay(event) {
    if (!this._stay) return;

    // Initialize day_plans if it doesn't exist
    if (!this._stay.day_plans) {
      this._stay.day_plans = [];
    }

    // Get the trip data
    const trip = TripState.getTrip();

    // Calculate the arrival time for the new day
    let arrivalTime = 0;

    // Check if there are other stays with departure times
    if (trip && trip.stays) {
      let latestDepartureTime = 0;

      // Find the latest departure time from all other stays
      trip.stays.forEach((stay) => {
        if (stay.id !== this._stay.id && stay.departure_time) {
          latestDepartureTime = Math.max(
            latestDepartureTime,
            stay.departure_time
          );
        }
      });

      if (latestDepartureTime > 0) {
        // Use the latest departure time from other stays
        arrivalTime = latestDepartureTime;
      }
    }

    // If no other stays with departure times, use trip start date
    if (
      arrivalTime === 0 &&
      trip &&
      trip.timeline &&
      trip.timeline.start_date
    ) {
      const startDate = new Date(
        trip.timeline.start_date.year,
        trip.timeline.start_date.month - 1, // JavaScript months are 0-indexed
        trip.timeline.start_date.day
      );
      startDate.setHours(0, 0, 0, 0);
      arrivalTime = Math.floor(startDate.getTime() / 1000);
    }

    // If no trip start date, fallback to current day
    if (arrivalTime === 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      arrivalTime = Math.floor(today.getTime() / 1000);
    }

    // Set the departure time to the end of the same day (23:59:59)
    const departureDate = new Date(arrivalTime * 1000);
    departureDate.setHours(23, 59, 59, 999);
    const departureTime = Math.floor(departureDate.getTime() / 1000);

    // Create an updated stay object with the new arrival/departure times
    const updatedStay = {
      ...this._stay,
      arrival_time: arrivalTime,
      departure_time: departureTime,
    };

    // Update the stay in the trip state
    TripState.update(this._stay.id, updatedStay);

    // Save the updated trip data
    TripState.saveTrip();
  }
}

customElements.define("stay-itinerary", StayItinerary);
