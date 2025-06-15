import { auth, database } from "./firebase.js";
import {
  ref as dbRef,
  get,
  update
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let currentPage = 1;
const itemsPerPage = 4;
let globalTagGroups = {};
let globalRawMemories = {};

let photoContainer, videoContainer, previewBox;

const formatDateISO = (ts) => new Date(ts).toISOString().split("T")[0];

function groupMemoriesByTag(memories, filterDate = null) {
  const tagGroups = {};

  for (const [id, memory] of Object.entries(memories)) {
    const { photoURL = memory.media?.photoURL, videoURL = memory.media?.videoURL } = memory;
    if (!photoURL && !videoURL) continue;

    const memoryDate = formatDateISO(memory.timestamp || Date.now());
    if (filterDate && memoryDate !== filterDate) continue;

    const tags = memory.tags || ["untagged"];
    for (const tag of tags) {
      if (!tagGroups[tag]) tagGroups[tag] = { photos: [], videos: [] };
      const memoryData = { ...memory, id, photoURL, videoURL };
      if (photoURL) tagGroups[tag].photos.push(memoryData);
      if (videoURL) tagGroups[tag].videos.push(memoryData);
    }
  }

  return tagGroups;
}

function createMemoryCard({ id, title, description, photoURL, videoURL, tags }) {
  const card = document.createElement("div");
  card.className = "memory-card";
  card.innerHTML = `
    <p><strong>🆔 ${id}</strong></p>
    <p><strong>${title || "Untitled"}</strong></p>
    <p>${description || ""}</p>
    ${photoURL ? `<img src="${photoURL}" class="memory-media" />` : ""}
    ${videoURL ? `<video src="${videoURL}" controls class="memory-media"></video>` : ""}
    <div>${(tags || []).map(tag => `<span class="tag-label">🏷️ ${tag}</span>`).join(" ")}</div>
  `;
  return card;
}

function renderTagGroups(tagGroups, page) {
  photoContainer.innerHTML = "";
  videoContainer.innerHTML = "";

  if (!Object.keys(tagGroups).length) {
    photoContainer.innerHTML = "<p>No tagged photo memories found.</p>";
    videoContainer.innerHTML = "<p>No tagged video memories found.</p>";
    return;
  }

  for (const [tag, { photos, videos }] of Object.entries(tagGroups)) {
    if (photos.length > 0) {
      const photoGroupDiv = document.createElement("div");
      photoGroupDiv.className = "tag-photo-group";
      photoGroupDiv.innerHTML = `<div class="tag-group-title">📸 ${tag} - Photos</div>`;
      const photoGrid = document.createElement("div");
      photoGrid.className = "memory-grid";
      photos.slice((page - 1) * itemsPerPage, page * itemsPerPage).forEach(mem => {
        photoGrid.appendChild(createMemoryCard(mem));
      });
      photoGroupDiv.appendChild(photoGrid);
      photoContainer.appendChild(photoGroupDiv);
    }

    if (videos.length > 0) {
      const videoGroupDiv = document.createElement("div");
      videoGroupDiv.className = "tag-video-group";
      videoGroupDiv.innerHTML = `<div class="tag-group-title">🎥 ${tag} - Videos</div>`;
      const videoGrid = document.createElement("div");
      videoGrid.className = "memory-grid";
      videos.slice((page - 1) * itemsPerPage, page * itemsPerPage).forEach(mem => {
        videoGrid.appendChild(createMemoryCard(mem));
      });
      videoGroupDiv.appendChild(videoGrid);
      videoContainer.appendChild(videoGroupDiv);
    }
  }

  document.getElementById("pageNumber").textContent = `Page ${page}`;
}

async function fetchUserMemories(userId) {
  const userMemoriesRef = dbRef(database, `memories/${userId}`);
  const snapshot = await get(userMemoriesRef);
  return snapshot.exists() ? snapshot.val() : null;
}

async function loadAllTaggedMemories() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const data = await fetchUserMemories(user.uid);

    if (!data) {
      photoContainer.innerHTML = "<p>No memories found.</p>";
      videoContainer.innerHTML = "<p>No memories found.</p>";
      return;
    }

    globalRawMemories = data;
    globalTagGroups = groupMemoriesByTag(globalRawMemories);
    renderTagGroups(globalTagGroups, currentPage);
  });
}

async function handleTagSubmit(e) {
  e.preventDefault();
  const memoryId = document.getElementById("memoryId").value.trim();
  const newTag = document.getElementById("newTag").value.trim().toLowerCase();

  if (!memoryId || !newTag) return alert("Both Memory ID and Tag are required.");

  previewBox.innerHTML = "<p>⏳ Adding tag... Please wait</p>";

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const memoryRef = dbRef(database, `memories/${user.uid}/${memoryId}`);
    const snapshot = await get(memoryRef);

    if (!snapshot.exists()) {
      previewBox.innerHTML = "<p>❌ Memory not found.</p>";
      return;
    }

    const memory = snapshot.val();
    const updatedTags = memory.tags?.includes(newTag)
      ? memory.tags
      : [...(memory.tags || []), newTag];

    await update(memoryRef, { tags: updatedTags });

    alert("✅ Tag added successfully!");
    document.getElementById("memoryId").value = "";
    document.getElementById("newTag").value = "";
    previewBox.innerHTML = "";
    loadAllTaggedMemories();
  });
}

async function handlePreviewFetch() {
  const memoryId = document.getElementById("memoryId").value.trim();
  if (!memoryId) return alert("Please enter a Memory ID");

  previewBox.innerHTML = "<p>⏳ Loading memory...</p>";

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const memoryRef = dbRef(database, `memories/${user.uid}/${memoryId}`);
    const snapshot = await get(memoryRef);

    if (!snapshot.exists()) {
      previewBox.innerHTML = "<p>❌ Memory not found.</p>";
      return;
    }

    const { title, description, photoURL, videoURL, tags } = snapshot.val();

    previewBox.innerHTML = `
      <h3>🔎 Memory Preview</h3>
      <p><strong>Title:</strong> ${title || "Untitled"}</p>
      <p><strong>Description:</strong> ${description || "No description"}</p>
      ${photoURL ? `<img src="${photoURL}" class="memory-media" />` : ""}
      ${videoURL ? `<video src="${videoURL}" controls class="memory-media"></video>` : ""}
      <p><strong>Tags:</strong> ${(tags || []).map(t => `<span class="tag-label">${t}</span>`).join(", ") || "None"}</p>
    `;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  photoContainer = document.getElementById("photoTagGroupsContainer");
  videoContainer = document.getElementById("videoTagGroupsContainer");
  previewBox = document.getElementById("memoryPreview");

  document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTagGroups(globalTagGroups, currentPage);
    }
  });

  document.getElementById("nextPage").addEventListener("click", () => {
    currentPage++;
    renderTagGroups(globalTagGroups, currentPage);
  });

  document.getElementById("filterDateBtn")?.addEventListener("click", () => {
    const selectedDate = document.getElementById("dateFilter").value;
    if (!selectedDate) return alert("Please select a date to filter.");
    const filteredGroups = groupMemoriesByTag(globalRawMemories, selectedDate);
    currentPage = 1;
    renderTagGroups(filteredGroups, currentPage);
  });

  document.getElementById("resetDateBtn")?.addEventListener("click", () => {
    currentPage = 1;
    renderTagGroups(globalTagGroups, currentPage);
    document.getElementById("dateFilter").value = "";
  });

  document.getElementById("tagForm").addEventListener("submit", handleTagSubmit);
  document.getElementById("fetchMemoryBtn").addEventListener("click", handlePreviewFetch);

  loadAllTaggedMemories();
});
