// ✅ Firebase Configuration and Initialization
var firebaseConfig = {
  apiKey: "AIzaSyDHs0w6x1nBJ0TSydIgb8Hh3CjjJHTKVow",
  authDomain: "caat-tool.firebaseapp.com",
  projectId: "caat-tool",
  storageBucket: "caat-tool.firebasestorage.app",
  messagingSenderId: "877587046757",
  appId: "1:877587046757:web:e825ad4f018cc8315a418c"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);



window.db = window.db || firebase.firestore();
window.auth = window.auth || firebase.auth();
firebase.auth().onAuthStateChanged((user) => {
  window.currentUser = user;

  const loginSection = document.getElementById("loginSection");
  const protectedAppSection = document.getElementById("protectedAppSection");

  if (user) {
    // Show protected content, hide login
    if (protectedAppSection) protectedAppSection.style.display = "block";
    if (loginSection) loginSection.style.display = "none";
  } else {
    // Show login, hide protected content
    if (protectedAppSection) protectedAppSection.style.display = "none";
    if (loginSection) loginSection.style.display = "block";
  }
});


// ✅ Track user globally
firebase.auth().onAuthStateChanged((user) => {
  window.currentUser = user;
});

// ✅ Handle DOM-dependent code
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const status = document.getElementById("status");

  const toggleToSignup = document.getElementById("toggleToSignup");
  if (toggleToSignup) {
    toggleToSignup.onclick = () => {
      if (loginForm) loginForm.style.display = "none";
      if (signupForm) signupForm.style.display = "block";
    };
  }

  if (loginForm) {
    loginForm.onsubmit = (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          window.currentUser = user;
          console.log("✅ Logged in:", user.email);
          if (status) status.textContent = "Login successful!";
          alert("Login successful!");
          location.reload(); // ✅ refresh the page so it re-renders for the authenticated user

        })
        .catch((error) => {
          console.error("❌ Login failed:", error.message);
          if (status) status.textContent = "";
          alert("Login failed: " + error.message);
        });
    };
  }

  if (signupForm) {
    signupForm.onsubmit = (e) => {
      e.preventDefault();
      const email = document.getElementById("signupEmail").value;
      const password = document.getElementById("signupPassword").value;

      auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
          if (status) status.textContent = "Signup successful!";
          alert("Signup successful!");
         location.reload(); // ✅ refresh the page so it re-renders for the authenticated user

        })
        .catch((error) => {
          alert(error.message);
        });
    };
  }
});

// ✅ Usage counter
async function incrementReportCount(uid, email) {
  const userRef = db.collection("users").doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    await userRef.set({ email, reportsUsed: 1, subscription: "trial" });
    return 1;
  }

  const data = userDoc.data();
  const used = data.reportsUsed || 0;
  const subscription = data.subscription || "trial";

  if (subscription === "trial" && used >= 1) {
    throw new Error("Free trial limit reached. Please subscribe to continue.");
  }

  await userRef.update({ reportsUsed: used + 1 });
  return used + 1;
}
document.addEventListener("DOMContentLoaded", () => {
  if (typeof generateNarrativeReport !== "undefined") {
    window.generateNarrativeReport = generateNarrativeReport;
  }
});
