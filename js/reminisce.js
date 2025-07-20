import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth();

const reminisceBtn = document.getElementById("reminisceBtn");
const memoryDisplay = document.getElementById("memoryDisplay");
const diceIcon = document.getElementById("diceIcon");

const titleEl = document.getElementById("memoryTitle");
const dateEl = document.getElementById("memoryDate");
const locationEl = document.getElementById("memoryLocation");
const descEl = document.getElementById("memoryDescription");
const photoContainer = document.getElementById("memoryPhotoContainer");
const videoContainer = document.getElementById("memoryVideoContainer");
const audioContainer = document.getElementById("memoryAudioContainer");

let userMemories = [];
let currentUser = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        console.log("User logged in:", user.email, "UID:", currentUser.uid);
        await fetchUserMemories();
    } else {
        currentUser = null;
        userMemories = [];
        console.log("No user logged in, redirecting to login.");
    }
});

async function fetchUserMemories() {
    if (!currentUser) {
        console.log("Cannot fetch memories: No user logged in.");
        return;
    }

    try {
        console.log(`Fetching memories for user: ${currentUser.uid}`);
        const q = query(collection(db, "memories"), where("userId", "==", currentUser.uid));
        const memoriesSnap = await getDocs(q);
        userMemories = memoriesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log("Memories fetched:", userMemories.length);

        if (userMemories.length === 0) {
            console.log("No memories found for this user.");
        }
    } catch (error) {
        console.error("Error fetching user memories:", error);
        alert("Error loading your memories. Please check your internet connection or try again later.");
    }
}

reminisceBtn.addEventListener("click", async () => {
    if (!currentUser) {
        alert("Please log in to reminisce a memory.");
        return;
    }

    if (userMemories.length === 0) {
        alert("You don't have any memories to reminisce yet! Add some memories in your dashboard.");
        await fetchUserMemories();
        if (userMemories.length === 0) return;
    }

    diceIcon.style.display = 'block';
    diceIcon.play();

    memoryDisplay.classList.add("hidden");

    setTimeout(() => {
        diceIcon.pause();
        diceIcon.currentTime = 0;
        diceIcon.style.display = 'none';

        const randomMemory = userMemories[Math.floor(Math.random() * userMemories.length)];
        displayMemory(randomMemory);

    }, 1500);
});

function displayMemory(memory) {
    titleEl.textContent = memory.title || "Untitled Memory";
    dateEl.textContent = memory.date || "No Date";
    locationEl.textContent = memory.location || "No Location";
    descEl.textContent = memory.description || "No Description";

    photoContainer.innerHTML = "";
    videoContainer.innerHTML = "";
    audioContainer.innerHTML = "";

    if (memory.photoURL) {
        const img = document.createElement("img");
        img.src = memory.photoURL;
        img.alt = `Photo for ${memory.title || 'memory'}`;
        photoContainer.appendChild(img);
    }

    if (memory.videoURL) {
        const video = document.createElement("video");
        video.src = memory.videoURL;
        video.controls = true;
        videoContainer.appendChild(video);
    }

    if (memory.audioURL) {
        const audio = document.createElement("audio");
        audio.src = memory.audioURL;
        audio.controls = true;
        audioContainer.appendChild(audio);
    }

    memoryDisplay.classList.remove("hidden");
}

function applyDarkModePreference() {
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const currentTheme = localStorage.getItem("theme");

    if (currentTheme === "dark") {
        document.body.setAttribute("data-theme", "dark");
    } else if (currentTheme === "light") {
        document.body.removeAttribute("data-theme");
    } else if (prefersDarkScheme.matches) {
        document.body.setAttribute("data-theme", "dark");
    }
}

applyDarkModePreference();

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
    if (!localStorage.getItem("theme")) {
        if (event.matches) {
            document.body.setAttribute("data-theme", "dark");
        } else {
            document.body.removeAttribute("data-theme");
        }
    }
});