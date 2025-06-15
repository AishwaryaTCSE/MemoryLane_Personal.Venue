import { auth, database } from "./firebase.js";
import {
  ref as dbRef,
  get,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const timelineContainer = document.getElementById("timelineContainer");
const datePicker = document.getElementById("datePicker");
const sortBySelect = document.getElementById("sortBy");

let allMemories = {};

function createCard(memory) {
  const cardWrapper = document.createElement("div");
  cardWrapper.className = "flip-card";

  cardWrapper.innerHTML = `
    <div class="flip-card-inner">
      <div class="flip-card-front">
        <h3>${memory.title || "Untitled Memory"}</h3>
        ${memory.photoURL ? `<img src="${memory.photoURL}" class="memory-media" />` : ""}
        ${memory.videoURL ? `<video src="${memory.videoURL}" controls class="memory-media"></video>` : ""}
      </div>
      <div class="flip-card-back">
        <h4>Description:</h4>
        <p>${memory.description || "No description provided."}</p>
        <h4>📍 Place:</h4>
        <p>${memory.place || "Unknown Place"}</p>
        <h4>📅 Date:</h4>
        <p>${memory.date || "Unknown Date"}</p>
        <h4>🏷️ Tags:</h4>
        <p>${(memory.tags || []).map(tag => `<span class="tag-label">${tag}</span>`).join(" ")}</p>
      </div>
    </div>
  `;
  return cardWrapper;
}


function groupMemories(memories, key) {
  const groups = {};
  for (const [id, memory] of Object.entries(memories)) {
    const value = (key === "tag" ? (memory.tags || ["Untagged"]) : [memory[key] || `Unknown ${key}`]);
    const media = {
      ...memory,
      id,
      photoURL: memory.photoURL || memory.media?.photoURL || null,
      videoURL: memory.videoURL || memory.media?.videoURL || null,
    };

    value.forEach(v => {
      if (!groups[v]) groups[v] = [];
      groups[v].push(media);
    });
  }
  return groups;
}

function renderGroupedMemories(groupedData) {
  timelineContainer.innerHTML = "";
  for (const [groupName, items] of Object.entries(groupedData)) {
    const groupDiv = document.createElement("div");
    groupDiv.innerHTML = `<h2>📁 ${groupName}</h2>`;
    items.forEach(memory => groupDiv.appendChild(createCard(memory)));
    timelineContainer.appendChild(groupDiv);
  }
}

export function loadAndRender() {
  timelineContainer.innerHTML = "⏳ Loading...";
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      timelineContainer.innerHTML = "<p>🔒 Please log in to view your timeline.</p>";
      return;
    }

    const snapshot = await get(dbRef(database, `memories/${user.uid}`));
    if (!snapshot.exists()) {
      timelineContainer.innerHTML = "<p>📭 No memories found.</p>";
      return;
    }

    allMemories = snapshot.val();
    const sortKey = sortBySelect.value; // 'date' | 'tag' | 'place'
    const grouped = groupMemories(allMemories, sortKey);
    renderGroupedMemories(grouped);
  });
}

window.loadAndRender = loadAndRender;

window.filterByCalendarDate = () => {
  const selectedDate = datePicker.value;
  if (!selectedDate) return alert("Please select a date.");
  const filtered = {};
  for (const [id, memory] of Object.entries(allMemories)) {
    if ((memory.date || "").startsWith(selectedDate)) {
      filtered[id] = memory;
    }
  }

  if (Object.keys(filtered).length === 0) {
    timelineContainer.innerHTML = "<p>📭 No memories found for selected date.</p>";
  } else {
    const grouped = groupMemories(filtered, sortBySelect.value);
    renderGroupedMemories(grouped);
  }
};

// Initial load
loadAndRender();
