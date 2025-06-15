// === Import Firebase Modular SDK ===
import { auth, database, storage } from './firebase.js';
import {
  ref as dbRef,
  set,
  get,
  child
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

import {
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// === Theme Toggle ===
const themeBtn = document.getElementById("theme-btn");
themeBtn?.addEventListener("click", () => {
  const body = document.body;
  const currentTheme = body.getAttribute("data-theme");
  body.setAttribute("data-theme", currentTheme === "dark" ? "light" : "dark");
});

// === Logout Functionality ===
const logoutBtn = document.getElementById("logout-btn");
logoutBtn?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    alert("✅ Logged out successfully!");
    window.location.href = "login.html";
  } catch (error) {
    alert("❌ Logout failed: " + error.message);
  }
});

// === Track Current User ===
let currentUser = null;
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("⚠️ Please log in to access this page.");
    window.location.href = "login.html";
  } else {
    currentUser = user;
  }
});

// === Sanitize File Names ===
function sanitizeFileName(name) {
  return name.replace(/[^\w\-\.]/gi, "_");
}

// === Memory Form Submission ===
const memoryForm = document.getElementById("memoryForm");
memoryForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) {
    alert("⚠️ User not logged in.");
    return;
  }

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const date = document.getElementById("date").value;
  const location = document.getElementById("location").value.trim();
  const photoFile = document.getElementById("photo").files[0];
  const videoFile = document.getElementById("video").files[0];

  const memoryId = Date.now();
  const userId = currentUser.uid;
  const memoryRef = dbRef(database, `memories/${userId}/${memoryId}`);
  const userMemoryPath = `memories/${userId}/${memoryId}`;
  const submitBtn = document.getElementById("submit-btn");
  if (submitBtn) submitBtn.disabled = true;

  try {
    // === Check for duplicate title ===
    const snapshot = await get(child(dbRef(database), `memories/${userId}`));
    let isDuplicate = false;
    if (snapshot.exists()) {
      snapshot.forEach((childSnap) => {
        if (childSnap.val().title === title) {
          isDuplicate = true;
        }
      });
    }

    if (isDuplicate) {
      alert("🚫 Duplicate memory title found. Use a different title.");
      return;
    }

    const dataToSave = {
      title,
      description,
      date,
      location,
      photoURL: "",
      videoURL: "",
      createdAt: new Date().toISOString()
    };

    // === Upload Photo ===
    if (photoFile) {
      const photoRef = storageRef(storage, `${userMemoryPath}/photo_${sanitizeFileName(photoFile.name)}`);
      await uploadBytes(photoRef, photoFile);
      const photoURL = await getDownloadURL(photoRef);
      dataToSave.photoURL = photoURL;
    }

    // === Upload Video ===
    if (videoFile) {
      const videoRef = storageRef(storage, `${userMemoryPath}/video_${sanitizeFileName(videoFile.name)}`);
      await uploadBytes(videoRef, videoFile);
      const videoURL = await getDownloadURL(videoRef);
      dataToSave.videoURL = videoURL;
    }

    // === Save to Realtime Database ===
    await set(memoryRef, dataToSave);

    // === Display Memory ID ===
    const idDisplay = document.getElementById("memoryIdDisplay");
    if (idDisplay) {
      idDisplay.textContent = `🆔 Memory ID: ${memoryId}`;
    }

    alert("✅ Memory saved successfully!");
    memoryForm.reset();
  } catch (err) {
    console.error("❌ Error saving memory:", err);
    alert(`❌ Error saving memory:\n${err.code || ''}\n${err.message}`);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

// === Sidebar Feature Toggle ===
function toggleFeatures() {
  const list = document.getElementById("features-list");
  if (list) {
    list.classList.toggle("hidden");
  }
}
window.toggleFeatures = toggleFeatures;

// === Open Memory Entry Modal ===
function openMemoryEntry() {
  const modal = document.getElementById("memoryEntryModal");
  if (modal) modal.style.display = "block";
}
window.openMemoryEntry = openMemoryEntry;

// === Close Memory Entry Modal ===
function closeMemoryEntry() {
  const modal = document.getElementById("memoryEntryModal");
  if (modal) modal.style.display = "none";
}
window.closeMemoryEntry = closeMemoryEntry;

// === Show Tagging Modal ===
function showTagging() {
  const modal = document.getElementById("taggingModal");
  if (modal) modal.style.display = "block";
}
window.showTagging = showTagging;

// === Close Tagging Modal ===
function closeTaggingModal() {
  const modal = document.getElementById("taggingModal");
  if (modal) modal.style.display = "none";
}
window.closeTaggingModal = closeTaggingModal;

// === Load Feature Section Dynamically ===
function loadFeature(name) {
  const container = document.getElementById("main-content");
  if (container) {
    container.innerHTML = `<div class="glass-card"><h2>${name}</h2><p>Feature coming soon...</p></div>`;
  }
}
window.loadFeature = loadFeature;




