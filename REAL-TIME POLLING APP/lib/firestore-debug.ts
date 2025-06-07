import { db } from "./firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"

// Test Firestore connection and permissions
export const testFirestoreConnection = async (userId: string) => {
  console.log("🔍 Testing Firestore connection...")
  
  try {
    // Test 1: Basic connection
    console.log("📡 Testing basic Firestore connection...")
    const testDoc = doc(db, "test", "connection-test")
    
    // Test 2: Write permission
    console.log("✍️ Testing write permissions...")
    await setDoc(testDoc, {
      message: "Connection test",
      timestamp: new Date(),
      userId: userId
    })
    console.log("✅ Write test successful")
    
    // Test 3: Read permission
    console.log("📖 Testing read permissions...")
    const docSnap = await getDoc(testDoc)
    if (docSnap.exists()) {
      console.log("✅ Read test successful:", docSnap.data())
    } else {
      console.log("❌ Document doesn't exist after write")
    }
    
    return { success: true, message: "Firestore connection successful" }
  } catch (error: any) {
    console.error("❌ Firestore test failed:", error)
    return { 
      success: false, 
      message: `Firestore error: ${error.code || error.message}`,
      error: error
    }
  }
}
