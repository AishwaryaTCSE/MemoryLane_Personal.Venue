import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    startAfter,
    endBefore,
    limitToLast,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
    getStorage,
    ref,
    getDownloadURL,
    deleteObject
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

const memoryIdInput = document.getElementById("memoryId");
const tagInput = document.getElementById("tagInput");
const addTagBtn = document.getElementById("addTag");
const tagListUl = document.getElementById("tagList");
const tagForm = document.getElementById("tagForm");
const fetchMemoryBtn = document.getElementById("fetchMemoryBtn");
const memoryCardsContainer = document.getElementById("memoryCardsContainer");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageNumberSpan = document.getElementById("pageNumber");
const noMemoriesMessage = document.getElementById("noMemoriesMessage");

const memoryExpandedModal = document.getElementById('memoryExpandedModal');
const expandedPhotoContainer = document.getElementById('expandedPhotoContainer');
const expandedVideoContainer = document.getElementById('expandedVideoContainer');
const expandedMemoryTitle = document.getElementById('expandedMemoryTitle');
const expandedMemoryDate = document.getElementById('expandedMemoryDate');
const expandedMemoryLocation = document.getElementById('expandedMemoryLocation');
const expandedMemoryDescription = document.getElementById('expandedMemoryDescription');
const expandedMemoryTags = document.getElementById('expandedMemoryTags');
const editMemoryBtn = document.getElementById('editMemoryBtn');
const deleteMemoryBtn = document.getElementById('deleteMemoryBtn');

const editMemoryForm = document.getElementById('editMemoryForm');
const editTitleInput = document.getElementById('editTitle');
const editDateInput = document.getElementById('editDate');
const editLocationInput = document.getElementById('editLocation');
const editDescriptionInput = document.getElementById('editDescription');
const editTagInput = document.getElementById('editTagInput');
const addEditTagBtn = document.getElementById('addEditTag');
const editTagListUl = document.getElementById('editTagList');
const saveEditedMemoryBtn = document.getElementById('saveEditedMemoryBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

let currentUser = null;
let currentTags = new Set();
let currentMemoryForEdit = null;
let currentEditFormTags = new Set();

let lastVisible = null;
let firstVisible = null;
const PAGE_SIZE = 5;
let currentPage = 1;

function getMemoryIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('memoryId');
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        console.log("User logged in:", user.email, "UID:", currentUser.uid);

        const urlMemoryId = getMemoryIdFromURL();
        if (urlMemoryId) {
            memoryIdInput.value = urlMemoryId;
            await fetchAndPreviewMemory(urlMemoryId);
        }

        fetchMemories();
    } else {
        console.log("No user logged in, redirecting to login.");
        window.location.href = "login.html";
    }
});

addTagBtn.addEventListener("click", () => {
    const tagText = tagInput.value.trim();
    if (tagText && !currentTags.has(tagText)) {
        currentTags.add(tagText);
        renderTagsForForm(tagListUl, currentTags, (tag) => currentTags.delete(tag));
        tagInput.value = "";
    }
});

function renderTagsForForm(ulElement, tagsSet, deleteCallback) {
    ulElement.innerHTML = "";
    tagsSet.forEach(tag => {
        const li = document.createElement("li");
        li.textContent = tag;
        const removeBtn = document.createElement("span");
        removeBtn.textContent = "✖";
        removeBtn.classList.add("remove-tag-btn");
        removeBtn.onclick = (event) => {
            event.stopPropagation();
            deleteCallback(tag);
            renderTagsForForm(ulElement, tagsSet, deleteCallback);
        };
        li.appendChild(removeBtn);
        ulElement.appendChild(li);
    });
}

fetchMemoryBtn.addEventListener("click", () => {
    const memoryId = memoryIdInput.value.trim();
    if (!memoryId) {
        alert("Please enter a Memory ID to preview.");
        return;
    }
    fetchAndPreviewMemory(memoryId);
});

async function fetchAndPreviewMemory(memoryId) {
    if (!currentUser) {
        alert("User not authenticated.");
        return;
    }

    try {
        const memoryDocRef = doc(db, "memories", memoryId);
        const memoryDocSnap = await getDoc(memoryDocRef);

        if (memoryDocSnap.exists()) {
            const memoryData = memoryDocSnap.data();

            console.log("Memory data fetched for preview:", memoryData);
            console.log("Current user UID:", currentUser.uid);

            if (memoryData.userId !== currentUser.uid) {
                alert("You do not have permission to view this memory.");
                currentTags.clear();
                renderTagsForForm(tagListUl, currentTags, (tag) => currentTags.delete(tag));
                memoryIdInput.value = "";
                return;
            }

            console.log("Memory fetched for preview:", memoryData);
            currentTags = new Set(memoryData.tags || []);
            renderTagsForForm(tagListUl, currentTags, (tag) => currentTags.delete(tag));
        } else {
            alert("Memory not found for the given ID.");
            currentTags.clear();
            renderTagsForForm(tagListUl, currentTags, (tag) => currentTags.delete(tag));
            memoryIdInput.value = "";
        }
    } catch (error) {
        console.error("Error fetching memory for preview:", error);
        alert("Error fetching memory: " + error.message);
    }
}

tagForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const memoryId = memoryIdInput.value.trim();

    if (!memoryId) {
        alert("Please enter a Memory ID to save tags.");
        return;
    }
    if (!currentUser) {
        alert("User not authenticated.");
        return;
    }

    try {
        const memoryDocRef = doc(db, "memories", memoryId);
        const memoryDocSnap = await getDoc(memoryDocRef);

        if (!memoryDocSnap.exists()) {
            alert("Memory ID does not exist. Please create the memory first (e.g., in the Dashboard).");
            return;
        }

        const existingData = memoryDocSnap.data();
        if (existingData.userId !== currentUser.uid) {
            alert("You can only add tags to your own memories.");
            return;
        }

        console.log("Saving tags:", Array.from(currentTags), "to memory ID:", memoryId);
        await setDoc(memoryDocRef, {
            ...existingData,
            tags: Array.from(currentTags)
        }, { merge: true });

        alert(`Tags saved successfully for Memory ID: ${memoryId}!`);
        fetchMemories(1);
    } catch (error) {
        console.error("Error saving tags:", error);
        alert("Error saving tags: " + error.message);
    }
});

async function fetchMemories(page = 1) {
    if (!currentUser) {
        console.log("No current user to fetch memories.");
        return;
    }

    console.log("fetchMemories called for page:", page, "for user UID:", currentUser.uid);

    memoryCardsContainer.innerHTML = '<h3>Memories with Tags</h3>';
    noMemoriesMessage.style.display = 'block';
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
    pageNumberSpan.textContent = `Page ${page}`;

    const memoriesCollectionRef = collection(db, "memories");
    let q;

    let baseQuery = query(
        memoriesCollectionRef,
        where("userId", "==", currentUser.uid),
        orderBy("title", "asc")
    );

    if (page === 1) {
        q = query(baseQuery, limit(PAGE_SIZE));
    } else if (page > currentPage && lastVisible) {
        q = query(baseQuery, startAfter(lastVisible), limit(PAGE_SIZE));
    } else if (page < currentPage && firstVisible) {
        q = query(
            memoriesCollectionRef,
            where("userId", "==", currentUser.uid),
            orderBy("title", "desc"),
            startAfter(firstVisible),
            limit(PAGE_SIZE)
        );
    } else {
        q = query(baseQuery, limit(PAGE_SIZE));
    }

    try {
        const querySnapshot = await getDocs(q);
        let memoriesToDisplay = [];
        querySnapshot.forEach(doc => {
            const data = doc.data();
            console.log("Processing doc:", doc.id, "Data:", data);

            if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
                memoriesToDisplay.push({ id: doc.id, ...data });
            } else {
                console.log("Doc skipped (no tags or empty tags array):", doc.id);
            }
        });

        if (page < currentPage && firstVisible) {
            memoriesToDisplay.reverse();
        }

        console.log("Final memoriesToDisplay array for page", page, ":", memoriesToDisplay);
        displayMemoryCards(memoriesToDisplay);

        if (memoriesToDisplay.length > 0) {
            noMemoriesMessage.style.display = 'none';
            lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
            firstVisible = querySnapshot.docs[0];
            currentPage = page;
            pageNumberSpan.textContent = `Page ${currentPage}`;

            const nextQuery = query(baseQuery, startAfter(lastVisible), limit(1));
            const nextSnapshot = await getDocs(nextQuery);
            nextPageBtn.disabled = nextSnapshot.empty;
        } else {
            lastVisible = null;
            firstVisible = null;
            nextPageBtn.disabled = true;
            if (querySnapshot.empty && page > 1) {
                currentPage = page - 1;
                pageNumberSpan.textContent = `Page ${currentPage}`;
            }
        }

        prevPageBtn.disabled = currentPage === 1;

    } catch (error) {
        console.error("Error fetching memories:", error);
        memoryCardsContainer.innerHTML = '<h3>Memories with Tags</h3><p>Error loading memories.</p>';
        noMemoriesMessage.style.display = 'block';
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
    }
}

function displayMemoryCards(memories) {
    memoryCardsContainer.innerHTML = '<h3>Memories with Tags</h3>';
    if (memories.length === 0) {
        noMemoriesMessage.style.display = 'block';
    } else {
        noMemoriesMessage.style.display = 'none';
        memories.forEach(memory => {
            createMemoryCard(memory);
        });
    }
}

function createMemoryCard(memory) {
    console.log("Creating card for memory ID:", memory.id);
    const card = document.createElement("div");
    card.classList.add("memory-card");
    card.dataset.memoryId = memory.id;

    const tagsHtml = memory.tags && Array.isArray(memory.tags) && memory.tags.length > 0
        ? memory.tags.map(tag => `<span>${tag}</span>`).join('')
        : '<em>No tags</em>';

    let mediaPreviewHtml = '';
    if (memory.photoURL) {
        mediaPreviewHtml = `<img src="${memory.photoURL}" alt="Memory Photo">`;
    } else if (memory.videoURL) {
        mediaPreviewHtml = `<video src="${memory.videoURL}" controls></video>`;
    }

    card.innerHTML = `
        <h4>${memory.title || 'Untitled Memory'}</h4>
        <div class="card-media-preview">
            ${mediaPreviewHtml}
        </div>
        <p><strong>Date:</strong> ${memory.date || 'N/A'}</p>
        <p><strong>Location:</strong> ${memory.location || 'N/A'}</p>
        <div class="tags-display">
            ${tagsHtml}
        </div>
    `;

    card.addEventListener('click', () => openMemoryExpandedModal(memory));
    memoryCardsContainer.appendChild(card);
}

prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
        fetchMemories(currentPage - 1);
    }
});

nextPageBtn.addEventListener("click", () => {
    fetchMemories(currentPage + 1);
});

function openMemoryExpandedModal(memory) {
    currentMemoryForEdit = memory;

    expandedMemoryTitle.textContent = memory.title || 'Untitled Memory';
    expandedMemoryDate.textContent = memory.date || 'N/A';
    expandedMemoryLocation.textContent = memory.location || 'N/A';
    expandedMemoryDescription.textContent = memory.description || 'N/A';
    expandedMemoryTags.textContent = memory.tags && memory.tags.length > 0 ? memory.tags.join(', ') : 'None';

    expandedPhotoContainer.innerHTML = '';
    expandedVideoContainer.innerHTML = '';

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

    memoryExpandedModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    editMemoryForm.style.display = 'none';
}

window.closeMemoryExpandedModal = function() {
    memoryExpandedModal.style.display = 'none';
    document.body.style.overflow = '';
    const videos = memoryExpandedModal.querySelectorAll('video');
    videos.forEach(video => video.pause());
    currentMemoryForEdit = null;
};

memoryExpandedModal.addEventListener('click', (e) => {
    if (e.target === memoryExpandedModal || e.target.classList.contains('close-button')) {
        closeMemoryExpandedModal();
    }
});

editMemoryBtn.addEventListener('click', () => {
    if (!currentMemoryForEdit) return;

    editTitleInput.value = currentMemoryForEdit.title || '';
    editDateInput.value = currentMemoryForEdit.date || '';
    editLocationInput.value = currentMemoryForEdit.location || '';
    editDescriptionInput.value = currentMemoryForEdit.description || '';
    currentEditFormTags = new Set(currentMemoryForEdit.tags || []);
    renderTagsForForm(editTagListUl, currentEditFormTags, (tag) => currentEditFormTags.delete(tag));
    editTagInput.value = '';
    editMemoryForm.style.display = 'block';
});

addEditTagBtn.addEventListener('click', () => {
    const tagText = editTagInput.value.trim();
    if (tagText && !currentEditFormTags.has(tagText)) {
        currentEditFormTags.add(tagText);
        renderTagsForForm(editTagListUl, currentEditFormTags, (tag) => currentEditFormTags.delete(tag));
        editTagInput.value = '';
    }
});

saveEditedMemoryBtn.addEventListener('click', async () => {
    if (!currentMemoryForEdit || !currentUser) return;

    const updatedMemoryData = {
        title: editTitleInput.value.trim(),
        date: editDateInput.value,
        location: editLocationInput.value.trim(),
        description: editDescriptionInput.value.trim(),
        tags: Array.from(currentEditFormTags)
    };

    try {
        const memoryDocRef = doc(db, "memories", currentMemoryForEdit.id);
        await setDoc(memoryDocRef, updatedMemoryData, { merge: true });

        alert("Memory updated successfully!");
        closeMemoryExpandedModal();
        fetchMemories(currentPage);
    } catch (error) {
        console.error("Error updating memory:", error);
        alert("Error updating memory: " + error.message);
    }
});

cancelEditBtn.addEventListener('click', () => {
    editMemoryForm.style.display = 'none';
});

deleteMemoryBtn.addEventListener('click', async () => {
    if (!currentMemoryForEdit || !currentUser) return;

    if (confirm(`Are you sure you want to delete the memory titled "${currentMemoryForEdit.title || 'Untitled'}"? This action cannot be undone.`)) {
        try {
            const memoryId = currentMemoryForEdit.id;
            const userId = currentUser.uid;

            if (currentMemoryForEdit.photoURL) {
                try {
                    const photoRef = ref(storage, `memories/${userId}/${memoryId}/photo.jpg`);
                    await deleteObject(photoRef);
                    console.log("Photo deleted from storage.");
                } catch (storageError) {
                    console.warn("Could not delete photo from storage (might not exist or path is wrong):", storageError);
                }
            }
            if (currentMemoryForEdit.videoURL) {
                try {
                    const videoRef = ref(storage, `memories/${userId}/${memoryId}/video.mp4`);
                    await deleteObject(videoRef);
                    console.log("Video deleted from storage.");
                } catch (storageError) {
                    console.warn("Could not delete video from storage (might not exist or path is wrong):", storageError);
                }
            }

            const memoryDocRef = doc(db, "memories", currentMemoryForEdit.id);
            await deleteDoc(memoryDocRef);

            alert("Memory deleted successfully!");
            closeMemoryExpandedModal();
            fetchMemories(1);
        } catch (error) {
            console.error("Error deleting memory:", error);
            alert("Error deleting memory: " + error.message);
        }
    }
});