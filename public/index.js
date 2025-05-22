// Trip planner form handler
document.addEventListener("DOMContentLoaded", () => {
  const tripForm = document.getElementById("tripForm");
  
  // Add event listener to update trip days when dates change
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const tripDaysInput = document.getElementById("tripDays");
  
  function updateTripDays() {
    const start = new Date(startDateInput.value);
    const end = new Date(endDateInput.value);
    
    if (start && end && !isNaN(start) && !isNaN(end)) {
      // Calculate difference in days
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end day
      
      // Update trip days field
      tripDaysInput.value = diffDays;
    }
  }
  
  // Add event listeners
  startDateInput.addEventListener("change", updateTripDays);
  endDateInput.addEventListener("change", updateTripDays);

  tripForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const idArray = crypto.getRandomValues(new Uint8Array(16));
    const id = btoa(String.fromCharCode.apply(null, idArray))
      .replaceAll("=", "")
      .replaceAll("+", "-")
      .replaceAll("/", "_");

    // Parse dates from date inputs and update hidden fields
    const startDate = new Date(document.getElementById("startDate").value);
    document.getElementById("startYear").value = startDate.getFullYear();
    document.getElementById("startMonth").value = startDate.getMonth() + 1; // Months are 0-indexed
    document.getElementById("startDay").value = startDate.getDate();
    
    const endDate = new Date(document.getElementById("endDate").value);
    document.getElementById("endYear").value = endDate.getFullYear();
    document.getElementById("endMonth").value = endDate.getMonth() + 1;
    document.getElementById("endDay").value = endDate.getDate();
    
    // Gather form data
    const tripData = {
      id,
      title: document.getElementById("tripTitle").value,
      timeline: {
        start_date: {
          year: startDate.getFullYear(),
          month: startDate.getMonth() + 1,
          day: startDate.getDate(),
          flexibility: document.getElementById("startFlexibility").value,
        },
        end_date: {
          year: endDate.getFullYear(),
          month: endDate.getMonth() + 1,
          day: endDate.getDate(),
          flexibility: document.getElementById("endFlexibility").value,
        },
        trip_days: parseInt(document.getElementById("tripDays").value),
      },
      preferences: {
        origin: {
          kind: "transit",
          name: document.getElementById("originName").value,
          category: null,
          description: `Origin location: ${
            document.getElementById("originName").value
          }`,
          photos: [],
          address: document.getElementById("originName").value,
          coordinates: {
            latitude: 0,
            longitude: 0,
          },
          destination: {
            name: document.getElementById("originName").value,
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
        },
        traveler_count: parseInt(
          document.getElementById("travelerCount").value
        ),
        pace: document.getElementById("pace").value,
        morning_type: document.getElementById("morningType").value,
        budget_level: document.getElementById("budgetLevel").value,
        special_needs: document.getElementById("specialNeeds").value
          ? document
              .getElementById("specialNeeds")
              .value.split("\n")
              .filter((item) => item.trim() !== "")
          : [],
      },
      stays: [],
    };

    try {
      // Save trip data to server
      const saveResponse = await fetch(`/api/save/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tripData),
      });

      if (!saveResponse.ok) {
        throw new Error(
          `Server returned ${saveResponse.status}: ${saveResponse.statusText}`
        );
      }

      // Get the save ID
      const saveId = await saveResponse.text();

      // Redirect to trip page with the ID
      window.location.href = `/trip?${saveId}`;
    } catch (error) {
      console.error("Error saving trip data:", error);
      alert(`Failed to save trip data: ${error.message}`);
    }
  });
});
