"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { testFirestoreConnection } from "@/lib/firestore-debug"
import { useAuth } from "@/hooks/useAuth"
import { Bug, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function DebugPanel() {
  const { user } = useAuth()
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  const runDiagnostics = async () => {
    if (!user) return
    
    setTesting(true)
    setTestResult(null)
    
    try {
      const result = await testFirestoreConnection(user.uid)
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        message: "Diagnostic test failed",
        error: error
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button onClick={runDiagnostics} disabled={testing || !user}>
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              "Run Firestore Diagnostics"
            )}
          </Button>
          
          {testResult && (
            <Badge variant={testResult.success ? "default" : "destructive"}>
              {testResult.success ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-1" />
                  Failed
                </>
              )}
            </Badge>
          )}
        </div>
        
        {testResult && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm">{testResult.message}</p>
            {testResult.error && (
              <details className="mt-2">
                <summary className="text-xs text-gray-600 cursor-pointer">Error Details</summary>
                <pre className="text-xs mt-1 text-red-600">
                  {JSON.stringify(testResult.error, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
        
        <div className="text-xs text-gray-600">
          <p><strong>User ID:</strong> {user?.uid || 'Not authenticated'}</p>
          <p><strong>Project ID:</strong> real-time-polling-app-12ad3</p>
          <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
        </div>
      </CardContent>
    </Card>
  )
}
