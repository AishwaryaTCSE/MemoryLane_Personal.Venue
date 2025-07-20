
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";


const firebaseConfig = {
  apiKey: "AIzaSyBVCX368AI2r3qiPCM6nilR02TpgUfD9PM",
  authDomain: "memorylane-personal.firebaseapp.com",
  databaseURL: "https://memorylane-personal-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "memorylane-personal",
  storageBucket: "memorylane-personal.firebasestorage.app", 
  messagingSenderId: "1086350853623",
  appId: "1:1086350853623:web:5c7a0fc63e84981f539af2",
  measurementId: "G-SC5KE37NFY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const themeToggle = document.getElementById("themeToggle");
themeToggle?.addEventListener("click", () => {
  const body = document.body;
  const isDark = body.getAttribute("data-theme") === "dark";
  body.setAttribute("data-theme", isDark ? "light" : "dark");
  themeToggle.textContent = isDark ? "🌙 Dark" : "☀️ Light";
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      alert("Logged out!");
      window.location.href = "login.html";
    })
    .catch((error) => alert("Logout failed: " + error.message));
});

let currentUser = null;
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    const memoryId = window.currentMemoryId || "";
    document.getElementById("memoryIdDisplay").textContent =
      `User: ${user.email}${memoryId ? " | Memory ID: " + memoryId : ""}`;
  } else {
    window.location.href = "login.html";
  }
});

document.querySelectorAll(".feature-item").forEach((item) => {
  item.addEventListener("click", () => {
    const feature = item.dataset.feature;

    if (window.innerWidth <= 768) {
      document.querySelector(".sidebar")?.classList.remove('active');
      document.getElementById("features-list")?.classList.remove('show');
    }

    const routes = {
      "Memory Entry": openMemoryEntry,
      "Tagging Memories": () => window.location.href = "tagging.html",
      "Timeline & Albums": () => window.location.href = "timeline.html",
      "Reminisce Time": () => window.location.href = "reminisce.html",
      "Milestone Time": () => window.location.href = "calender.html"
    };

    routes[feature]?.() || console.warn(`Unhandled feature: ${feature}`);
  });
});

function openMemoryEntry() {
  const memoryId = `memory_${Date.now()}`;
  window.currentMemoryId = memoryId;

  if (currentUser) {
    document.getElementById("memoryIdDisplay").textContent =
      `User: ${currentUser.email} | Memory ID: ${memoryId}`;
  }

  document.getElementById("memoryEntryModal").style.display = "block";
}

function closeMemoryEntry() {
  document.getElementById("memoryEntryModal").style.display = "none";
}
window.closeMemoryEntry = closeMemoryEntry;

document.getElementById("memoryForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) {
    alert("User not authenticated!");
    return;
  }

  const getValue = (id) => document.getElementById(id).value;
  const getFile = (id) => document.getElementById(id).files[0];

  const title = getValue("title");
  const description = getValue("description");
  const date = getValue("date");
  const location = getValue("location");
  const photoFile = getFile("photo");
  const videoFile = getFile("video");

  const userId = currentUser.uid;
  const memoryId = window.currentMemoryId;
  let photoURL = "", videoURL = "";

  try {
    if (photoFile) {
      const photoRef = ref(storage, `memories/${userId}/${memoryId}/photo_${photoFile.name}`);
      await uploadBytes(photoRef, photoFile);
      photoURL = await getDownloadURL(photoRef);
    }

    if (videoFile) {
      const videoRef = ref(storage, `memories/${userId}/${memoryId}/video_${videoFile.name}`);
      await uploadBytes(videoRef, videoFile);
      videoURL = await getDownloadURL(videoRef);
    }

    await setDoc(doc(db, "memories", memoryId), {
      memoryId,
      userId,
      title,
      description,
      date,
      location,
      photoURL,
      videoURL,
      createdAt: new Date().toISOString()
    });

    document.getElementById("savedMemoryId").textContent = `Memory ID: ${memoryId}`;
    alert("✅ Memory saved successfully!");
    document.getElementById("memoryForm").reset();
    closeMemoryEntry();
  } catch (err) {
    console.error(err);
    alert("❌ Error saving memory: " + err.message);
  }
});
