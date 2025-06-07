"use client"

import type React from "react"

import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState } from "react"
import { Loader2, Users, AlertCircle, ExternalLink, RefreshCw } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, error, signInAnonymous, clearError } = useAuth()
  const [displayName, setDisplayName] = useState("")
  const [isSigningIn, setIsSigningIn] = useState(false)

  const handleSignIn = async () => {
    if (!displayName.trim()) return

    setIsSigningIn(true)
    try {
      await signInAnonymous(displayName.trim())
    } catch (error) {
      console.error("Sign in failed:", error)
      // Error is already set in useAuth
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleRetry = () => {
    clearError()
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Connecting to Firebase...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto mt-20">
          <div className="text-center mb-8">
            <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Real-Time Polling</h1>
            <p className="text-gray-600">Enter your name to get started</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Join the Platform</CardTitle>
              <CardDescription>Enter your display name to create or join polling sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="space-y-3">
                    <div>{error}</div>
                    <div className="flex gap-2">
                      {error.includes("Anonymous authentication") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              "https://console.firebase.google.com/project/real-time-polling-app-12ad3/authentication/providers",
                              "_blank",
                            )
                          }
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Firebase Console
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={handleRetry}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && displayName.trim()) {
                      handleSignIn()
                    }
                  }}
                  disabled={isSigningIn}
                />
              </div>

              <Button onClick={handleSignIn} disabled={!displayName.trim() || isSigningIn} className="w-full">
                {isSigningIn ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Get Started"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
