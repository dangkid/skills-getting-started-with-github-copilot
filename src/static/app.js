document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const cardsContainer = document.getElementById("activities");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  // Modal elements for removal confirmation
  const deleteModal = document.getElementById('delete-modal');
  const deleteModalMessage = deleteModal ? document.getElementById('delete-modal-message') : null;
  const deleteCancelBtn = deleteModal ? document.getElementById('delete-cancel') : null;
  const deleteConfirmBtn = deleteModal ? document.getElementById('delete-confirm') : null;

  let pendingRemoval = null; // { activity, email }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

  // Clear loading message / previous content
  activitiesList.innerHTML = "";
  if (cardsContainer) cardsContainer.innerHTML = "";

      // Reset select options (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        // Compact entry for the left list
        const entry = document.createElement("div");
        entry.className = "activity-entry";
        entry.innerHTML = `<strong>${escapeHtml(name)}</strong> — ${escapeHtml(details.schedule)} (<em>${(details.participants||[]).length} signed</em>)`;
        activitiesList.appendChild(entry);

        // Detailed card for the main cards container (visible on the page)
        if (cardsContainer) {
          const card = document.createElement("div");
          card.className = "activity-card";

          const spotsLeft = details.max_participants - (details.participants || []).length;

          // Build participants section
          const participants = details.participants || [];
          let participantsHtml = "";
          if (participants.length === 0) {
            participantsHtml = `<p class=\"participants-empty\">No participants yet — be the first!</p>`;
          } else {
            participantsHtml = `<h5 class=\"participants-heading\">Participants</h5>
                                <ul class=\"participants-list\">
                                  ${participants.map(email => `
                                    <li class=\"participant-item\">
                                      <span class=\"participant-email\">${escapeHtml(email)}</span>
                                      <button class=\"participant-remove\" data-activity=\"${escapeHtml(name)}\" data-email=\"${escapeHtml(email)}\" aria-label=\"Remove ${escapeHtml(email)}\">✕</button>
                                    </li>
                                  `).join("")}
                                </ul>`;
          }

          card.innerHTML = `
            <div class=\"activity-header\">
              <h4 class=\"activity-title\">${escapeHtml(name)}</h4>
              <span class=\"activity-schedule\">${escapeHtml(details.schedule)}</span>
            </div>
            <div class=\"activity-body\">
              <p class=\"activity-desc\">${escapeHtml(details.description)}</p>
              <p class=\"activity-capacity\"><strong>Availability:</strong> ${spotsLeft} spots left</p>
              <div class=\"participants\">${participantsHtml}</div>
            </div>
          `;

          cardsContainer.appendChild(card);
        }

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // simple HTML escape helper
  function escapeHtml(str) {
    if (typeof str !== "string") return str;
    return str.replace(/[&<>"']/g, function (m) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m];
    });
  }

  // Helper to show a message in the messageDiv
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');
    setTimeout(() => messageDiv.classList.add('hidden'), 4500);
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh activities to show new participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();

  // Delegated listener for remove buttons using modal confirmation
  if (cardsContainer) {
    cardsContainer.addEventListener('click', (ev) => {
      const btn = ev.target.closest('.participant-remove');
      if (!btn) return;

      const activity = btn.dataset.activity;
      const email = btn.dataset.email;
      if (!activity || !email) return;

      // show modal
      pendingRemoval = { activity, email };
      if (deleteModalMessage) deleteModalMessage.textContent = `Remove ${email} from ${activity}?`;
      if (deleteModal) deleteModal.classList.remove('hidden');
      if (deleteModal) deleteModal.focus && deleteModal.focus();
    });

    // modal buttons
    if (deleteCancelBtn) deleteCancelBtn.addEventListener('click', () => {
      pendingRemoval = null;
      if (deleteModal) deleteModal.classList.add('hidden');
    });

    if (deleteConfirmBtn) deleteConfirmBtn.addEventListener('click', async () => {
      if (!pendingRemoval) return;
      const { activity, email } = pendingRemoval;
      pendingRemoval = null;
      if (deleteModal) deleteModal.classList.add('hidden');

      try {
        const res = await fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
        const result = await res.json().catch(() => ({}));
        if (res.ok) {
          showMessage(result.message || 'Participant removed', 'success');
          fetchActivities();
        } else {
          showMessage(result.detail || 'Failed to remove participant', 'error');
        }
      } catch (err) {
        console.error('Error removing participant', err);
        showMessage('Failed to remove participant', 'error');
      }
    });
  }
});
