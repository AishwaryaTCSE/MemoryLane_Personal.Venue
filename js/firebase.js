import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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

export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

export { ref, uploadBytes, getDownloadURL };
