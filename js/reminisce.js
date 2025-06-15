import { auth, database } from "./firebase.js";
import { ref as dbRef, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// HTML Elements
const reminisceBtn = document.getElementById("reminisceBtn");
const memoryCard = document.getElementById("memoryCard");
const memoryTitle = document.getElementById("memoryTitle");
const memoryDate = document.getElementById("memoryDate");
const memoryDescription = document.getElementById("memoryDescription");
const memoryLocation = document.getElementById("memoryLocation");
const memoryImage = document.getElementById("memoryImage");
const memoryVideo = document.getElementById("memoryVideo");

reminisceBtn.addEventListener("click", () => {
  console.log("Reminisce button clicked. Checking auth...");
  
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("You must be logged in to use this feature.");
      console.warn("No user is logged in.");
      return;
    }

    const uid = user.uid;
    console.log("Logged-in user UID:", uid);

    const userMemoriesRef = dbRef(database, `memories/${uid}`);

    try {
      const snapshot = await get(userMemoriesRef);
      if (!snapshot.exists()) {
        alert("No memories found.");
        console.log("Snapshot does not exist for user:", uid);
        return;
      }

      const memoriesData = snapshot.val();
      const allMemories = [];

      console.log("Fetched memory data:", memoriesData);

      // Support both 1-level and 2-level nested memory structure
      for (let outerKey in memoriesData) {
        const value = memoriesData[outerKey];
        if (typeof value === "object" && value !== null && !value.title) {
          // Likely nested
          for (let memoryId in value) {
            allMemories.push(value[memoryId]);
          }
        } else {
          // Direct structure
          allMemories.push(value);
        }
      }

      if (allMemories.length === 0) {
        alert("No memories available.");
        console.warn("No memories found in the database for UID:", uid);
        return;
      }

      const randomMemory = allMemories[Math.floor(Math.random() * allMemories.length)];

      // Fill memory details
      memoryTitle.textContent = `📝 ${randomMemory.title || "Untitled"}`;
      memoryDate.textContent = `📅 ${randomMemory.date || "Unknown Date"}`;
      memoryDescription.textContent = `📖 ${randomMemory.description || "No description"}`;
      memoryLocation.textContent = `📍 ${randomMemory.location || "Unknown"}`;

      // Show image or video
      if (randomMemory.photoURL) {
        memoryImage.src = randomMemory.photoURL;
        memoryImage.style.display = "block";
        memoryVideo.style.display = "none";
      } else if (randomMemory.videoURL) {
        memoryVideo.src = randomMemory.videoURL;
        memoryVideo.style.display = "block";
        memoryImage.style.display = "none";
      } else {
        memoryImage.style.display = "none";
        memoryVideo.style.display = "none";
      }

      memoryCard.style.display = "block";

    } catch (err) {
      console.error("Error fetching memory:", err.message);
      alert("⚠️ Failed to fetch memory. Please check Firebase rules, data path, or console for logs.");
    }
  });
});
