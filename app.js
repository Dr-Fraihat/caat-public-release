// ✅ Replace this with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDHs0w6x1nBJ0TSydIgb8Hh3CjjJHTKVow",
  authDomain: "caat-tool.firebaseapp.com",
  projectId: "caat-tool",
  storageBucket: "caat-tool.firebasestorage.app",
  messagingSenderId: "877587046757",
  appId: "1:877587046757:web:e825ad4f018cc8315a418c"
};

// Initialize Firebase (namespaced style)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
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

  // ✅ Limit to 1 free report
  if (subscription === "trial" && used >= 1) {
    throw new Error("Free trial limit reached. Please subscribe to continue.");
  }

  await userRef.update({ reportsUsed: used + 1 });
  return used + 1;
}

const auth = firebase.auth();

// DOM Elements
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const status = document.getElementById("status");

document.getElementById("toggleToSignup").onclick = () => {
  loginForm.style.display = "none";
  signupForm.style.display = "block";
};

// Handle Login
loginForm.onsubmit = (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      status.textContent = "Login successful!";
      window.location.href = "caat.html"; // 🔄 redirect to intake form
    })
    .catch((error) => {
      alert(error.message);
    });
};

// Handle Signup
signupForm.onsubmit = (e) => {
  e.preventDefault();
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      status.textContent = "Signup successful!";
      window.location.href = "caat.html";
    })
    .catch((error) => {
      alert(error.message);
    });
};
