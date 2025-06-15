# MemoryLane_Personal.Venue

📸 MemoryLane_Personal ReadME file for easy understanding.

MemoryLane_Personal is a full-featured web app that helps users preserve and relive precious memories.
It allows users to securely register, log in, and create multimedia-rich memory entries — including photos, videos, text, locations, and gallary — organized in a beautiful, interactive interface.

Tech Stack
Frontend: HTML, CSS (Linear Gradients + 3D Styling), JavaScript (ES6+)
Backend/Database: Firebase Realtime Database
Authentication:Firebase Authentication
Libraries/Tools:Firebase SDK, Responsive Web Design

Features

User Authentication:Secure Register/Login system with role-based access control.
Creatng Memory and Tagging:Create memory albums with photos, notes, videos,more... and ten we can tagg the memories by using memory id for easy view
Reminisce:Displays a random saved memory (with image/video and details) when the user clicks the 'Reminisce' button after verifying Firebase authentication.
Album:Displays user's tagged memory albums after authentication using Firebase Realtime Database and redirects to detailed album view on click.
AlbumView:Loads and displays media items (photos/videos) from a selected tag-based album after Firebase user authentication.
Cloud Storage Ready:Files and data are saved securely using Firebase.

## 📁 Folder Structure (Recommended)
MemoryLane\_Personal/
│
MemoryLane_Personal/
|── home.html               #Landing Page
├── index.html              #Registration Page/Login Page
├── Login.html              #Login Page
├── dashboard.html          # Main Dashboard
├── memory-entry.html       # Create/View Memory
├── reminisce.html          # Give the random memory
├── album.html              # create the folder for albums
│
├── style/                  # All CSS Files
│   ├── index.css
│   ├── dashboard.css
│   ├── map.css
│   ├── album.css
│   ├── albumView.css
│   ├── home.css
│   ├── login.css
│   ├── memory-entry.css
│   ├── memory-timeline.css
│   ├── reminisce.css
│   └── tagging.css
│
├── js/                     # All JavaScript Files
│   ├── album.html
│   ├── albumView.html
│   ├── dashboard.html
│   ├── index.html
│   ├── login.html
│   ├── reminisce.html
│   ├── tagging.html
│   └── timeline.html
│
├── images/                 # Media Files
│   ├── kisspng-drawing...
│   └── memory.jpg
│
├── users.json              # Optional user data (example or backup)
└── readme.md               # Project Documentation

Rules for database Connection 
1. Set up Firebase:

   * Create a Firebase project at [https://firebase.google.com/](https://firebase.google.com/)
   * Enable Authentication (Email/Password)
   *Firestore Database rules:
   rules_version = '2';

  service cloud.firestore {
  match /databases/{database}/documents {
    
    // Secure rule: Only logged-in users can read/write their own memories
    match /users/{userId}/memories/{memoryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // If you store tags separately, secure them similarly
    match /users/{userId}/tags/{tagId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
   * Enable Realtime Database and set security rules:

  {
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "memories": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid",
        "$folder": {
          ".read": "auth != null && auth.uid === $uid",
          ".write": "auth != null && auth.uid === $uid"
        }
      }
    }
  }
}

2. Add your Firebase config to `firebase.js`.

3. Open `index.html` in your browser.

4. Firebase Storage Ruls.

rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /memories/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}

## 🌐 Live Demo

🔗 [Deployed Project Link](https://your-deployment-link.netlify.app)



