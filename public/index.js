// Trip planner form handler
document.addEventListener("DOMContentLoaded", () => {
  const tripForm = document.getElementById("tripForm");

  tripForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const idArray = crypto.getRandomValues(new Uint8Array(16));
    const id = btoa(String.fromCharCode.apply(null, idArray))
      .replaceAll("=", "")
      .replaceAll("+", "-")
      .replaceAll("/", "_");

    // Gather form data
    const tripData = {
      id,
      title: document.getElementById("tripTitle").value,
      timeline: {
        start_date: {
          year: parseInt(document.getElementById("startYear").value),
          month: parseInt(document.getElementById("startMonth").value),
          day: parseInt(document.getElementById("startDay").value),
          flexibility: document.getElementById("startFlexibility").value,
        },
        end_date: {
          year: parseInt(document.getElementById("endYear").value),
          month: parseInt(document.getElementById("endMonth").value),
          day: parseInt(document.getElementById("endDay").value),
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
