"use client"

import { useState, useEffect } from "react"
import { signInAnonymously, signOut as firebaseSignOut, onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log("🔐 Setting up auth state listener...")

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        console.log("👤 Auth state changed:", user ? `User: ${user.uid}` : "No user")
        setUser(user)
        setLoading(false)
        setError(null)
      },
      (error) => {
        console.error("❌ Auth state change error:", error)
        const errorCode = (error as any)?.code || error?.message || "unknown-error"
        setError(getErrorMessage(errorCode))
        setLoading(false)
      },
    )

    return () => {
      console.log("🔐 Cleaning up auth listener")
      unsubscribe()
    }
  }, [])

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case "auth/admin-restricted-operation":
        return "Anonymous authentication is not enabled. Please enable it in Firebase Console."
      case "auth/operation-not-allowed":
        return "This authentication method is not allowed. Please check Firebase settings."
      case "auth/network-request-failed":
        return "Network error. Please check your internet connection."
      case "auth/invalid-api-key":
        return "Invalid Firebase API key. Please check your configuration."
      case "auth/app-deleted":
        return "Firebase app has been deleted. Please check your configuration."
      case "auth/invalid-user-token":
        return "User token is invalid. Please sign in again."
      case "auth/user-token-expired":
        return "User token has expired. Please sign in again."
      case "auth/null-user":
        return "User is null. Please sign in again."
      case "auth/invalid-tenant-id":
        return "Invalid tenant ID. Please check your configuration."
      case "auth/too-many-requests":
        return "Too many requests. Please try again later."
      case "auth/user-disabled":
        return "This user account has been disabled."
      case "auth/web-storage-unsupported":
        return "Web storage is not supported or disabled."
      default:
        return `Authentication error: ${errorCode || "Unknown error occurred"}`
    }
  }

  const signInAnonymous = async (displayName?: string): Promise<User> => {
    try {
      setError(null)
      setLoading(true)

      console.log("🚀 Starting anonymous sign in...")

      if (!auth) {
        throw new Error("Firebase Auth is not initialized")
      }

      const result = await signInAnonymously(auth)

      if (!result.user) {
        throw new Error("Sign in failed - no user returned")
      }

      if (displayName && result.user) {
        // Store display name in localStorage since anonymous users can't update profile
        localStorage.setItem(`user_${result.user.uid}_name`, displayName)
        console.log("💾 Display name stored:", displayName)
      }

      console.log("✅ Anonymous sign in successful:", result.user.uid)
      return result.user
    } catch (error: any) {
      console.error("❌ Error signing in anonymously:", error)
      const errorCode = error?.code || error?.message || "unknown-error"
      const errorMessage = getErrorMessage(errorCode)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      setError(null)
      console.log("🚪 Signing out...")

      if (!auth) {
        throw new Error("Firebase Auth is not initialized")
      }

      await firebaseSignOut(auth)

      // Clear stored display name
      if (user) {
        localStorage.removeItem(`user_${user.uid}_name`)
        console.log("🗑️ Display name cleared")
      }

      console.log("✅ Sign out successful")
    } catch (error: any) {
      console.error("❌ Error signing out:", error)
      const errorCode = error?.code || error?.message || "unknown-error"
      const errorMessage = getErrorMessage(errorCode)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const getUserDisplayName = (): string => {
    if (!user) return ""
    const storedName = localStorage.getItem(`user_${user.uid}_name`)
    return storedName || `User ${user.uid.slice(-4)}`
  }

  const clearError = (): void => {
    setError(null)
  }

  return {
    user,
    loading,
    error,
    signInAnonymous,
    signOut,
    getUserDisplayName,
    clearError,
    isAuthenticated: !!user,
  }
}
