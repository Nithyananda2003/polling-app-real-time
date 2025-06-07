import { initializeApp } from "firebase/app"
import { getDatabase } from "firebase/database"
import { getAuth } from "firebase/auth"
import { getAnalytics, isSupported } from "firebase/analytics"

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDwpPBAo1fTKaFCRM6gadQIwx6QLai35eQ",
  authDomain: "real-time-polling-app-12ad3.firebaseapp.com",
  databaseURL: "https://real-time-polling-app-12ad3-default-rtdb.firebaseio.com/",
  projectId: "real-time-polling-app-12ad3",
  storageBucket: "real-time-polling-app-12ad3.firebasestorage.app",
  messagingSenderId: "121168479609",
  appId: "1:121168479609:web:179a67bd34085c8ef49ba8",
  measurementId: "G-RY6FQGBLYL",
}

// Initialize Firebase
let app: any
let database: any
let auth: any
let analytics: any

try {
  console.log("🔥 Initializing Firebase...")
  app = initializeApp(firebaseConfig)

  console.log("🔐 Initializing Auth...")
  auth = getAuth(app)

  console.log("📊 Initializing Realtime Database...")
  database = getDatabase(app)

  // Initialize Analytics (only in browser environment)
  if (typeof window !== "undefined") {
    isSupported()
      .then((supported) => {
        if (supported) {
          analytics = getAnalytics(app)
          console.log("📈 Analytics initialized")
        }
      })
      .catch((error) => {
        console.warn("Analytics initialization failed:", error)
      })
  }

  console.log("✅ Firebase initialization successful")
} catch (error) {
  console.error("❌ Firebase initialization failed:", error)
  throw error
}

// Export Firebase services
export { database as db, auth, analytics }

// Export configuration status
export const isFirebaseConfigured = true
export const projectId = firebaseConfig.projectId

export default app
