import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    startAt,
    endAt
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

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

const datePicker = document.getElementById('datePicker');
const sortBySelect = document.getElementById('sortBy');
const timelineContainer = document.getElementById('timelineContainer');
const searchKeywordInput = document.getElementById('searchKeyword');
const applySearchBtn = document.querySelector('.filters button:nth-of-type(1)');
const clearSearchBtn = document.querySelector('.filters button:nth-of-type(2)');
const filterDateBtn = document.querySelector('.filters button:nth-of-type(3)');
const clearDateBtn = document.querySelector('.filters button:nth-of-type(4)');

const memoryExpandedModal = document.getElementById('memoryExpandedModal');
const expandedPhotoContainer = document.getElementById('expandedPhotoContainer');
const expandedVideoContainer = document.getElementById('expandedVideoContainer');
const expandedAudioContainer = document.getElementById('expandedAudioContainer');
const expandedMemoryTitle = document.getElementById('expandedMemoryTitle');
const expandedMemoryDate = document.getElementById('expandedMemoryDate');
const expandedMemoryLocation = document.getElementById('expandedMemoryLocation');
const expandedMemoryDescription = document.getElementById('expandedMemoryDescription');
const expandedMemoryTags = document.getElementById('expandedMemoryTags');

let currentUser = null;
let allMemories = [];
let currentFilterDate = null;
let currentSearchKeyword = "";

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        console.log("User logged in to Timeline:", user.email, "UID:", currentUser.uid);
        loadAndRender();
    } else {
        console.log("No user logged in, redirecting to login.");
        window.location.href = "login.html";
    }
});

async function loadAndRender() {
    timelineContainer.innerHTML = '<p>⏳ Loading memories...</p>';
    if (!currentUser) {
        console.log("loadAndRender: No current user, cannot load memories.");
        timelineContainer.innerHTML = '<p>Please log in to view your memories.</p>';
        return;
    }

    try {
        const memoriesColRef = collection(db, "memories");
        let baseQuery = query(
            memoriesColRef,
            where("userId", "==", currentUser.uid),
            orderBy("date", "desc")
        );

        if (currentFilterDate) {
            baseQuery = query(
                baseQuery,
                where("date", "==", currentFilterDate)
            );
        }

        const querySnapshot = await getDocs(baseQuery);
        let fetchedMemories = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log("Fetched memories (before keyword filter):", fetchedMemories);

        if (currentSearchKeyword) {
            const keywordLower = currentSearchKeyword.toLowerCase();
            fetchedMemories = fetchedMemories.filter(memory => {
                const titleMatch = (memory.title || '').toLowerCase().includes(keywordLower);
                const descriptionMatch = (memory.description || '').toLowerCase().includes(keywordLower);
                const tagMatch = (Array.isArray(memory.tags) ? memory.tags : []).some(tag => tag.toLowerCase().includes(keywordLower));
                const locationMatch = (memory.location || '').toLowerCase().includes(keywordLower);
                return titleMatch || descriptionMatch || tagMatch || locationMatch;
            });
            console.log("Memories after keyword filter:", fetchedMemories);
        }

        allMemories = fetchedMemories;
        renderTimeline(allMemories);

    } catch (error) {
        console.error("Error loading memories:", error);
        timelineContainer.innerHTML = '<p>❌ Error loading memories. Please try again. Check your console for details (e.g., Firebase permissions or missing indexes).</p>';
    }
}

if (filterDateBtn) filterDateBtn.addEventListener('click', () => {
    const selectedDate = datePicker.value;
    if (selectedDate) {
        currentFilterDate = selectedDate;
    } else {
        currentFilterDate = null;
    }
    loadAndRender();
});

if (clearDateBtn) clearDateBtn.addEventListener('click', () => {
    datePicker.value = '';
    currentFilterDate = null;
    loadAndRender();
});

if (applySearchBtn) applySearchBtn.addEventListener('click', () => {
    currentSearchKeyword = searchKeywordInput.value.trim();
    loadAndRender();
});

if (clearSearchBtn) clearSearchBtn.addEventListener('click', () => {
    searchKeywordInput.value = '';
    currentSearchKeyword = '';
    loadAndRender();
});


sortBySelect.addEventListener('change', () => {
    renderTimeline(allMemories);
});

function renderTimeline(memories) {
    timelineContainer.innerHTML = '';

    if (memories.length === 0) {
        timelineContainer.innerHTML = '<p>😢 No memories found for the selected criteria.</p>';
        return;
    }

    const groupBy = sortBySelect.value;
    let groupedMemories = {};

    memories.forEach(memory => {
        let groupKey;
        if (groupBy === 'date') {
            groupKey = memory.date || 'Undated Memories';
        } else if (groupBy === 'tag') {
            const tags = (Array.isArray(memory.tags) && memory.tags.length > 0) ? memory.tags : ['Untagged Memories'];
            tags.forEach(tag => {
                if (!groupedMemories[tag]) {
                    groupedMemories[tag] = [];
                }
                groupedMemories[tag].push(memory);
            });
            return;
        } else if (groupBy === 'place') {
            groupKey = memory.location || 'Unknown Place';
        }

        if (!groupedMemories[groupKey]) {
            groupedMemories[groupKey] = [];
        }
        groupedMemories[groupKey].push(memory);
    });

    let sortedGroupKeys = Object.keys(groupedMemories).sort();
    if (groupBy === 'date') {
        sortedGroupKeys.sort((a, b) => new Date(b) - new Date(a));
    } else if (groupBy === 'tag' || groupBy === 'place') {
        sortedGroupKeys.sort((a, b) => a.localeCompare(b));
    }

    sortedGroupKeys.forEach(groupKey => {
        const groupDiv = document.createElement('div');
        groupDiv.classList.add('timeline-group');

        const groupTitle = document.createElement('h2');
        groupTitle.textContent = groupKey;
        groupDiv.appendChild(groupTitle);

        const groupContentDiv = document.createElement('div');
        groupContentDiv.classList.add('timeline-group-content');

        groupedMemories[groupKey].sort((a, b) => new Date(b.date || '0000-01-01') - new Date(a.date || '0000-01-01'));

        groupedMemories[groupKey].forEach(memory => {
            const item = createTimelineItem(memory);
            groupContentDiv.appendChild(item);
        });

        groupDiv.appendChild(groupContentDiv);
        timelineContainer.appendChild(groupDiv);
    });
}

function createTimelineItem(memory) {
    const item = document.createElement('div');
    item.classList.add('timeline-item');
    item.dataset.memoryId = memory.id;

    let mediaPreviewHtml = '';
    if (memory.photoURL) {
        mediaPreviewHtml = `<div class="media-preview"><img src="${memory.photoURL}" alt="Memory Photo"></div>`;
    } else if (memory.videoURL) {
        mediaPreviewHtml = `<div class="media-preview"><video src="${memory.videoURL}" controls></video></div>`;
    } else if (memory.audioURL) {
        mediaPreviewHtml = `<div class="media-preview"><audio src="${memory.audioURL}" controls></audio></div>`;
    }

    const tagsHtml = (Array.isArray(memory.tags) && memory.tags.length > 0)
        ? memory.tags.map(tag => `<span>${tag}</span>`).join('')
        : '<em>No tags</em>';

    item.innerHTML = `
        <h3>${memory.title || 'Untitled Memory'}</h3>
        ${mediaPreviewHtml}
        <p><strong>Date:</strong> ${memory.date || 'N/A'}</p>
        <p><strong>Location:</strong> ${memory.location || 'N/A'}</p>
        <div class="tags-display">
            ${tagsHtml}
        </div>
    `;

    item.addEventListener('click', () => openMemoryExpandedModal(memory));

    return item;
}

function openMemoryExpandedModal(memory) {
    expandedMemoryTitle.textContent = memory.title || 'Untitled Memory';
    expandedMemoryDate.textContent = memory.date || 'N/A';
    expandedMemoryLocation.textContent = memory.location || 'N/A';
    expandedMemoryDescription.textContent = memory.description || 'N/A';
    expandedMemoryTags.textContent = (Array.isArray(memory.tags) && memory.tags.length > 0) ? memory.tags.join(', ') : 'None';

    expandedPhotoContainer.innerHTML = '';
    expandedVideoContainer.innerHTML = '';
    expandedAudioContainer.innerHTML = '';

    if (memory.photoURL) {
        const img = document.createElement('img');
        img.src = memory.photoURL;
        img.alt = 'Memory Photo';
        expandedPhotoContainer.appendChild(img);
    }
    if (memory.videoURL) {
        const video = document.createElement('video');
        video.src = memory.videoURL;
        video.controls = true;
        expandedVideoContainer.appendChild(video);
    }
    if (memory.audioURL) {
        const audio = document.createElement('audio');
        audio.src = memory.audioURL;
        audio.controls = true;
        expandedAudioContainer.appendChild(audio);
    }

    memoryExpandedModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

window.closeMemoryExpandedModal = function() {
    memoryExpandedModal.style.display = 'none';
    document.body.style.overflow = '';
    const videos = memoryExpandedModal.querySelectorAll('video');
    videos.forEach(video => video.pause());
    const audios = memoryExpandedModal.querySelectorAll('audio');
    audios.forEach(audio => audio.pause());
};

memoryExpandedModal.addEventListener('click', (e) => {
    if (e.target === memoryExpandedModal || e.target.classList.contains('close-button')) {
        closeMemoryExpandedModal();
    }
});

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