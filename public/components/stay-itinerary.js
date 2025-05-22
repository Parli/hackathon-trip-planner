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
    this._handlePlanUpdate = this._handlePlanUpdate.bind(this);
    this._handleDayDateChange = this._handleDayDateChange.bind(this);
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
    this.shadowRoot.addEventListener("plan-update", this._handlePlanUpdate);
    this.shadowRoot.addEventListener("day-move", this._handleDayMove);
    this.shadowRoot.addEventListener("day-date-change", this._handleDayDateChange);
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
    this.shadowRoot.removeEventListener("plan-update", this._handlePlanUpdate);
    this.shadowRoot.removeEventListener("day-move", this._handleDayMove);
    this.shadowRoot.removeEventListener("day-date-change", this._handleDayDateChange);
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

        .title-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #333;
        }

        .title {
          font-size: 1.8rem;
          font-weight: bold;
          margin: 0;
        }

        .delete-destination-button {
          background-color: #f44336;
          color: white;
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          cursor: pointer;
          transition: background-color 0.2s, transform 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .delete-destination-button:hover {
          background-color: #d32f2f;
          transform: scale(1.1);
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
          width: 100%;
          position: relative;
        }

        .search-input {
          padding: 0.75rem 1rem;
          padding-right: 40px;
          border: 1px solid #ccc;
          border-radius: 8px;
          font-size: 1rem;
          width: 100%;
          box-sizing: border-box;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: background-color 0.3s, color 0.3s;
        }

        .search-input.loading {
          background-color: #f5f5f5;
          color: #888;
        }

        .search-loading-indicator {
          position: absolute;
          top: 50%;
          right: 16px;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-top: 2px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          z-index: 100;
        }

        @keyframes spin {
          0% { transform: translateY(-50%) rotate(0deg); }
          100% { transform: translateY(-50%) rotate(360deg); }
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

      <div class="title-container">
        <h1 class="title">${cityName}</h1>
        <button class="delete-destination-button" title="Delete destination">×</button>
      </div>

      <div class="section">
        <div class="search-container">
          <input type="text" id="places-search" placeholder="Search for places in ${cityName}${
      destination.country ? ", " + destination.country : ""
    }" class="search-input">
        </div>

        ${
          options && options.length > 0
            ? '<card-carousel id="places-carousel"></card-carousel>'
            : '<div class="empty-state">No places available for this destination yet</div>'
        }
      </div>

      <div class="day-plans-section">
        <div class="section-header">
          <h2 class="section-title">
            <span class="section-icon">📅</span>
            <span>Daily Plans</span>
          </h2>
          <button id="add-day-button" class="add-day-button">+ Add New Day</button>
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
              : '<div class="empty-state">No daily plans available for this destination yet</div>';
          })()}
        </div>
      </div>
    `;

    // Create and populate place cards for the combined places carousel
    if (options && options.length > 0) {
      const placesCarousel = this.shadowRoot.getElementById("places-carousel");
      if (placesCarousel) {
        const placeCards = options.map((place) => {
          const card = document.createElement("place-card");
          card.place = place;
          return card;
        });
        placesCarousel.cards = placeCards;
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

    // Add event listener for delete destination button
    const deleteButton = this.shadowRoot.querySelector(
      ".delete-destination-button"
    );
    if (deleteButton) {
      deleteButton.addEventListener("click", () => {
        // Confirm before deleting
        if (
          confirm(`Are you sure you want to remove ${cityName} from your trip?`)
        ) {
          const trip = TripState.getTrip();
          if (trip && trip.stays) {
            // Filter out this stay
            const updatedStays = trip.stays.filter(
              (stay) => stay.id !== this._stay.id
            );

            // Update trip
            const updatedTrip = {
              ...trip,
              stays: updatedStays,
            };

            // Save updated trip
            TripState.update(trip.id, updatedTrip);
            TripState.saveTrip();

            // Dispatch event to notify parent components
            this.dispatchEvent(
              new CustomEvent("stay-deleted", {
                bubbles: true,
                composed: true,
                detail: { stayId: this._stay.id },
              })
            );
          }
        }
      });
    }

    // Add event listener for places search input
    const placesSearch = this.shadowRoot.getElementById("places-search");

    if (placesSearch) {
      placesSearch.addEventListener("keypress", async (e) => {
        if (e.key === "Enter" && placesSearch.value.trim()) {
          const query = placesSearch.value.trim();
          const destination = this._stay.destination;

          try {
            // Show loading indicator
            const loadingIndicator = document.createElement("div");
            loadingIndicator.className = "search-loading-indicator";
            placesSearch.parentNode.appendChild(loadingIndicator);

            // Grey out the search input
            placesSearch.classList.add("loading");
            placesSearch.disabled = true;

            // Get new places (any kind)
            const newPlaces = await getPlaceResearch(query, destination);

            // Update the underlying data structure
            if (newPlaces.length > 0 && this._stay) {
              // Get existing options
              const existingOptions = this._stay.options || [];

              // Create updated stay with new options at the start
              const updatedStay = {
                ...this._stay,
                options: [...newPlaces, ...existingOptions],
              };

              // Update the stay in the trip state using its ID
              TripState.update(this._stay.id, updatedStay);

              // Save the updated trip data
              TripState.saveTrip();
            }

            // Remove loading indicator and restore search input
            if (loadingIndicator && loadingIndicator.parentNode) {
              loadingIndicator.parentNode.removeChild(loadingIndicator);
            }

            placesSearch.classList.remove("loading");
            placesSearch.disabled = false;

            // Clear the search input
            placesSearch.value = "";
          } catch (error) {
            console.error("Error searching for places:", error);
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
   * Handle the plan-update event from a plan-item
   * @param {CustomEvent} event The plan-update event
   */
  _handlePlanUpdate(event) {
    const { oldPlan, newPlan } = event.detail;

    if (!oldPlan || !oldPlan.id || !newPlan || !this._stay || !this._stay.day_plans) return;

    // Find the index of the plan to update
    const planIndex = this._stay.day_plans.findIndex(
      (item) => item.id === oldPlan.id
    );

    if (planIndex === -1) return; // Plan not found

    // Create a copy of the day plans
    const updatedDayPlans = [...this._stay.day_plans];
    
    // Update the plan in the day plans array
    updatedDayPlans[planIndex] = newPlan;

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
   * Handle the day-date-change event from a day-plan
   * @param {CustomEvent} event The day-date-change event
   */
  _handleDayDateChange(event) {
    const { oldDate, newDate, activities, dayDiff } = event.detail;
    
    if (!oldDate || !newDate || !this._stay) return;
    
    
    // Get the beginning and end of the old day in seconds
    const oldDayStart = oldDate;
    const oldDayEnd = new Date(oldDate * 1000);
    oldDayEnd.setHours(23, 59, 59, 999);
    const oldDayEndTs = Math.floor(oldDayEnd.getTime() / 1000);
    
    // Get the beginning and end of the new day in seconds
    const newDayStart = newDate;
    const newDayEnd = new Date(newDate * 1000);
    newDayEnd.setHours(23, 59, 59, 999);
    const newDayEndTs = Math.floor(newDayEnd.getTime() / 1000);
    
    // Calculate the time shift in seconds
    const timeShift = (newDate - oldDate);
    
    // Initialize day_plans if it doesn't exist
    if (!this._stay.day_plans) {
      this._stay.day_plans = [];
    }
    
    // Separate day plans into those for this day and other days
    const dayPlans = [];
    const otherDayPlans = [];
    
    this._stay.day_plans.forEach((plan) => {
      if (plan.start_time >= oldDayStart && plan.start_time <= oldDayEndTs) {
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
      // Check if this is the first or last day of the stay
      const isFirstDay = Math.abs(oldDayStart - this._stay.arrival_time) < 86400;
      const isLastDay = Math.abs(oldDayEndTs - this._stay.departure_time) < 86400;
      
      if (isFirstDay) {
        // Update arrival time
        updatedStay.arrival_time = newDate;
      }
      
      if (isLastDay) {
        // Update departure time to end of the new day
        updatedStay.departure_time = newDayEndTs;
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

    // Check if the stay already has arrival and departure times
    if (this._stay.arrival_time && this._stay.departure_time) {
      // If stay already has times, just extend the departure time by 24 hours
      const updatedStay = {
        ...this._stay,
        departure_time: this._stay.departure_time + 86400, // Add 24 hours (86400 seconds)
      };

      // Update the stay in the trip state
      TripState.update(this._stay.id, updatedStay);

      // Save the updated trip data
      TripState.saveTrip();
      return;
    }

    // Get the trip data for new stays
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
