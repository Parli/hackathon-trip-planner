// Trip planner form handler

// Setup interests management functionality
function setupInterestsManagement() {
  const interestsContainer = document.getElementById("interests-container");
  const interestInput = document.getElementById("interest-input");
  const addInterestBtn = document.getElementById("add-interest-btn");
  const suggestedInterests = document.querySelectorAll(".suggested-interest");
  const hiddenInterestsInput = document.getElementById("interests");

  // Array to store selected interests
  let selectedInterests = [];

  // Function to update suggested interests visibility
  function updateSuggestedInterests() {
    suggestedInterests.forEach((item) => {
      const interest = item.dataset.interest;
      if (selectedInterests.includes(interest)) {
        item.style.display = "none";
      } else {
        item.style.display = "inline-block";
      }
    });
  }

  // Function to update the hidden input with JSON string
  function updateHiddenInput() {
    hiddenInterestsInput.value = JSON.stringify(selectedInterests);
  }

  // Function to add a new interest tag
  function addInterest(interest) {
    // Don't add if empty or already exists
    if (!interest.trim() || selectedInterests.includes(interest)) {
      return;
    }

    // Add to array
    selectedInterests.push(interest);

    // Create tag element
    const tagElement = document.createElement("div");
    tagElement.className = "interest-tag";
    tagElement.setAttribute("data-interest", interest);
    tagElement.innerHTML = interest;
    tagElement.title = "Click to remove";

    // Add to container
    interestsContainer.appendChild(tagElement);

    // Update hidden input
    updateHiddenInput();

    // Update suggested interests
    updateSuggestedInterests();

    // Clear input field
    interestInput.value = "";
  }

  // Function to remove an interest
  function removeInterest(interest) {
    // Remove from array
    selectedInterests = selectedInterests.filter((item) => item !== interest);

    // Remove from UI - find tag with the matching data attribute
    const tags = interestsContainer.querySelectorAll(".interest-tag");
    tags.forEach((tag) => {
      if (tag.dataset.interest === interest) {
        tag.remove();
      }
    });

    // Update hidden input
    updateHiddenInput();

    // Update suggested interests
    updateSuggestedInterests();
  }

  // Event listener for add button
  addInterestBtn.addEventListener("click", () => {
    addInterest(interestInput.value);
  });

  // Event listener for enter key in input
  interestInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addInterest(interestInput.value);
    }
  });

  // Event listener for suggested interests
  suggestedInterests.forEach((item) => {
    item.addEventListener("click", () => {
      addInterest(item.dataset.interest);
    });
  });

  // Event delegation for clicking on interest tags
  interestsContainer.addEventListener("click", (e) => {
    // Check if we clicked on a tag or something inside a tag
    const tag = e.target.classList.contains("interest-tag")
      ? e.target
      : e.target.closest(".interest-tag");

    if (tag) {
      removeInterest(tag.dataset.interest);
    }
  });

  // Initialize
  updateSuggestedInterests();
}

document.addEventListener("DOMContentLoaded", () => {
  const tripForm = document.getElementById("tripForm");

  // Initialize interests management
  setupInterestsManagement();

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
          address: document.getElementById("originName").value,
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
        interests: document.getElementById("interests").value
          ? JSON.parse(document.getElementById("interests").value)
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
