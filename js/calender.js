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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const CLIENT_ID = "1086350853623-crq127qaf1cflknv2m56gg985ug2itvo.apps.googleusercontent.com";
const API_KEY = "AIzaSyDfB0AX7Ad2PaNodHYKv1Y3r84JSTxYHw0";
let tokenClient;

gapi.load("client", async () => {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
  });
});

function signIn() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: "https://www.googleapis.com/auth/calendar.events",
    callback: (tokenResponse) => {
      if (tokenResponse.access_token) {
        document.getElementById("status").innerText = "✅ Signed in!";
      }
    },
  });

  tokenClient.requestAccessToken();
}

document.getElementById("milestoneForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const date = document.getElementById("date").value;

  const event = {
    summary: `🎉 Milestone: ${title}`,
    description: description,
    start: {
      dateTime: new Date(date).toISOString(),
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: new Date(new Date(date).getTime() + 60 * 60 * 1000).toISOString(),
      timeZone: "Asia/Kolkata",
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 60 },
        { method: "email", minutes: 1440 },
      ],
    },
  };

  try {
    const response = await gapi.client.calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    document.getElementById("status").innerText =
      "✅ Milestone added to your Google Calendar!";
    console.log("Event created:", response.result.htmlLink);
  } catch (error) {
    console.error("Failed to add event:", error);
    document.getElementById("status").innerText =
      "❌ Failed to add milestone. Check console.";
  }
});