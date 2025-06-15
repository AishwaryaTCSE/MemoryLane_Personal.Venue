// === Import initialized Firebase services ===
import { auth, database } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  ref as dbRef,
  set
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// === LOGIN ===
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("✅ Login successful!");
      window.location.href = "dashboard.html";
    } catch (error) {
      alert("❌ Login failed: " + error.message);
    }
  });
}

// === REGISTER ===
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (password !== confirmPassword) {
      alert("❌ Passwords do not match!");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = dbRef(database, `users/${user.uid}`);
      await set(userRef, {
        email: email,
        isVerified: false,
        createdAt: new Date().toISOString()
      });

      alert("✅ Registration successful!");
      window.location.href = "dashboard.html";
    } catch (error) {
      alert("❌ Registration failed: " + error.message);
    }
  });
}
