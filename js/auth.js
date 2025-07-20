import { auth, db } from "./firebase.js";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    ref as dbRef,
    set
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const redirectToDashboard = () => {
    alert("✅ Success!");
    window.location.href = "dashboard.html";
};

const handleLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
        alert("❌ Please fill in all fields.");
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        redirectToDashboard();
    } catch (error) {
        alert("❌ Login failed: " + error.message);
    }
};

const handleRegister = async (e) => {
    e.preventDefault();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (!email || !password || !confirmPassword) {
        alert("❌ Please fill in all fields.");
        return;
    }

    if (password !== confirmPassword) {
        alert("❌ Passwords do not match!");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userRef = dbRef(db, `users/${user.uid}`);
        await set(userRef, {
            email,
            provider: 'email',
            isVerified: user.emailVerified || false,
            createdAt: new Date().toISOString()
        });

        redirectToDashboard();
    } catch (error) {
        alert("❌ Registration failed: " + error.message);
    }
};

document.getElementById("loginForm")?.addEventListener("submit", handleLogin);
document.getElementById("registerForm")?.addEventListener("submit", handleRegister);
