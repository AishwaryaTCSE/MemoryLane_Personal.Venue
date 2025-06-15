import { auth, database } from "./firebase.js";
import {
  ref as dbRef,
  get
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const albumContainer = document.getElementById("albumContainer");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    albumContainer.innerHTML = "<p>🔒 Please log in.</p>";
    return;
  }

  try {
    const snap = await get(dbRef(database, `memories/${user.uid}`));
    if (!snap.exists()) {
      albumContainer.innerHTML = "<p>📭 No albums yet.</p>";
      return;
    }

    const memories = snap.val();
    const tagGroups = {};

    for (const id in memories) {
      const memory = memories[id];
      const tags = memory.tags || ["Untagged"];
      tags.forEach(tag => {
        if (!tagGroups[tag]) tagGroups[tag] = [];
        tagGroups[tag].push({ ...memory, id });
      });
    }

    for (const tag in tagGroups) {
      const div = document.createElement("div");
      div.className = "album-folder";
      div.innerHTML = `📁 <strong>${tag}</strong> (${tagGroups[tag].length} items)`;
      div.addEventListener("click", () => {
        localStorage.setItem("selectedTag", tag);
        location.href = "albumView.html";
      });
      albumContainer.appendChild(div);
    }

  } catch (e) {
    console.error(e);
    albumContainer.innerHTML = "❌ Error loading albums.";
  }
});
