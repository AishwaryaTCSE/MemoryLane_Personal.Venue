// // js/firebase.js

// // Import required Firebase modules
// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
// import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
// import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
// import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// // Your Firebase config
//  const firebaseConfig = {
//   apiKey: "AIzaSyBVCX368AI2r3qiPCM6nilR02TpgUfD9PM",
//   authDomain: "memorylane-personal.firebaseapp.com",
//   databaseURL: "https://memorylane-personal-default-rtdb.asia-southeast1.firebasedatabase.app",
//   projectId: "memorylane-personal",
//   storageBucket: "memorylane-personal.firebasestorage.app",
//   messagingSenderId: "1086350853623",
//   appId: "1:1086350853623:web:5c7a0fc63e84981f539af2",
//   measurementId: "G-SC5KE37NFY"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const database = getDatabase(app);
// const storage = getStorage(app);

// // Export instances
// export { app, auth, database, storage };
// js/firebase.js

//Import required Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  get
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// Your Firebase config
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// ✅ Export everything needed
export { app, auth, database, storage, ref, get };
