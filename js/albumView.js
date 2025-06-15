import { auth, database } from "./firebase.js";
import {
  ref as dbRef,
  get
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const tag = localStorage.getItem("selectedTag");
const albumTitle = document.getElementById("albumTitle");
const mediaGrid = document.getElementById("mediaGrid");

albumTitle.textContent = `📁 ${tag}`;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    mediaGrid.innerHTML = "<p>🔒 Please log in.</p>";
    return;
  }

  try {
    const snap = await get(dbRef(database, `memories/${user.uid}`));
    if (!snap.exists()) {
      mediaGrid.innerHTML = "<p>📭 No media in this album.</p>";
      return;
    }

    const memories = snap.val();
    let found = false;

    for (const id in memories) {
      const memory = memories[id];
      const tags = memory.tags || ["Untagged"];
      if (tags.includes(tag)) {
        found = true;

        const div = document.createElement("div");
        div.className = "media-card";

        if (memory.photoURL) {
          const img = document.createElement("img");
          img.src = memory.photoURL;
          div.appendChild(img);
        }

        if (memory.videoURL) {
          const vid = document.createElement("video");
          vid.src = memory.videoURL;
          vid.controls = true;
          div.appendChild(vid);
        }

        mediaGrid.appendChild(div);
      }
    }

    if (!found) {
      mediaGrid.innerHTML = "<p>📂 No media in this tag folder.</p>";
    }

  } catch (e) {
    console.error(e);
    mediaGrid.innerHTML = "❌ Error loading media.";
  }
});
