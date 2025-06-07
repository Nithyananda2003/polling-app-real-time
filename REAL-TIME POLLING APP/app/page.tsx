"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import {
  Users,
  Plus,
  Play,
  Clock,
  BarChart3,
  LogOut,
  Loader2,
  AlertCircle,
  Sparkles,
  QrCode,
  Square,
  TrendingUp,
  CheckCircle,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import AuthGuard from "@/components/auth-guard"
import DebugPanel from "@/components/debug-panel"
import {
  createSession,
  joinSession,
  createPoll,
  launchPoll,
  stopPoll,
  submitResponse,
  subscribeToSession,
  subscribeToSessionPolls,
  subscribeToUserSessions,
  type Poll,
  type Session,
} from "@/lib/firestore"
import { toast } from "sonner"

const COLORS = ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"]

// Enhanced Poll Card Component (inline)
function EnhancedPollCard({
  poll,
  userRole,
  userResponse,
  onLaunch,
  onStop,
  onVote,
  loading = false,
}: {
  poll: Poll
  userRole: "admin" | "user"
  userResponse?: string
  onLaunch?: (pollId: string) => void
  onStop?: (pollId: string) => void
  onVote?: (pollId: string, option: string) => void
  loading?: boolean
}) {
  const [showResults, setShowResults] = useState(false)
  const totalVotes = Object.values(poll.responses).reduce((a, b) => a + b, 0)
  const hasVoted = !!userResponse

  const getChartData = () => {
    return poll.options.map((option, index) => ({
      name: option,
      value: poll.responses[option] || 0,
      fill: COLORS[index % COLORS.length],
      percentage: totalVotes > 0 ? ((poll.responses[option] || 0) / totalVotes) * 100 : 0,
    }))
  }

  const handleVote = (option: string) => {
    if (hasVoted || loading) return
    onVote?.(poll.id, option)
  }

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold leading-tight mb-2">{poll.question}</CardTitle>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{totalVotes} votes</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{poll.options.length} options</span>
              </div>
              <Badge variant={poll.isActive ? "default" : "secondary"}>{poll.isActive ? "Live" : "Ended"}</Badge>
            </div>
          </div>

          {userRole === "admin" && (
            <div className="flex gap-2 ml-4">
              {!poll.isActive ? (
                <Button size="sm" onClick={() => onLaunch?.(poll.id)} disabled={loading}>
                  <Play className="h-4 w-4 mr-1" />
                  Launch
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => onStop?.(poll.id)} disabled={loading}>
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Voting Interface */}
        {poll.isActive && userRole === "user" && !hasVoted && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Choose your answer:</h4>
            <div className="grid gap-2">
              {poll.options.map((option, index) => (
                <Button
                  key={option}
                  variant="outline"
                  className="justify-start h-auto p-4 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/50"
                  onClick={() => handleVote(option)}
                  disabled={loading}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                      style={{ borderColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="flex-1">{option}</span>
                    {loading && (
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* User's Vote Confirmation */}
        {hasVoted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">You voted for: {userResponse}</span>
            </div>
          </div>
        )}

        {/* Results Section */}
        {(hasVoted || userRole === "admin" || !poll.isActive) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Results
              </h4>
              <Button variant="ghost" size="sm" onClick={() => setShowResults(!showResults)} className="text-xs">
                {showResults ? "Hide Chart" : "Show Chart"}
              </Button>
            </div>

            {/* Progress Bars */}
            <div className="space-y-3">
              {poll.options.map((option, index) => {
                const votes = poll.responses[option] || 0
                const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0
                const isUserChoice = userResponse === option

                return (
                  <div key={option} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className={`font-medium ${isUserChoice ? "text-primary" : ""}`}>
                          {option}
                          {isUserChoice && " ✓"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{votes} votes</span>
                        <span>({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Chart Visualization */}
            {showResults && totalVotes > 0 && (
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                  <h5 className="text-sm font-medium mb-3">Bar Chart</h5>
                  <div className="h-48">
                    <ChartContainer
                      config={{
                        value: {
                          label: "Votes",
                          color: "hsl(var(--chart-1))",
                        },
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getChartData()}>
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis fontSize={12} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </div>

                <div className="rounded-lg border bg-card p-4 shadow-sm">
                  <h5 className="text-sm font-medium mb-3">Distribution</h5>
                  <div className="h-48">
                    <ChartContainer
                      config={{
                        value: {
                          label: "Votes",
                          color: "hsl(var(--chart-1))",
                        },
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getChartData()}
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            dataKey="value"
                            label={({ percentage }) => `${percentage.toFixed(1)}%`}
                            labelLine={false}
                          >
                            {getChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No votes yet */}
        {totalVotes === 0 && (poll.isActive || userRole === "admin") && (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Waiting for votes...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Session Stats Component (inline)
function SessionStats({ session, polls }: { session: Session; polls: Poll[] }) {
  const totalPolls = polls.length
  const activePolls = polls.filter((poll) => poll.isActive).length
  const totalVotes = polls.reduce((acc, poll) => acc + Object.values(poll.responses).reduce((a, b) => a + b, 0), 0)

  const stats = [
    {
      title: "Participants",
      value: session.participants.length,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Polls",
      value: totalPolls,
      icon: BarChart3,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Active Polls",
      value: activePolls,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Total Votes",
      value: totalVotes,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={stat.title}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function PollingApp() {
  const { user, signOut, getUserDisplayName } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [currentPolls, setCurrentPolls] = useState<Poll[]>([])
  const [userRole, setUserRole] = useState<"admin" | "user" | null>(null)
  const [sessionCode, setSessionCode] = useState("")
  const [newPollQuestion, setNewPollQuestion] = useState("")
  const [newPollOptions, setNewPollOptions] = useState(["", ""])
  const [userResponses, setUserResponses] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [activeTab, setActiveTab] = useState("polls")

  const userName = getUserDisplayName()
  const userId = useMemo(() => user?.uid, [user?.uid])
  const currentSessionId = useMemo(() => currentSession?.id, [currentSession?.id])

  // Subscribe to user's sessions
  useEffect(() => {
    if (!userId) {
      setSessions([])
      return
    }

    const unsubscribe = subscribeToUserSessions(userId, (userSessions) => {
      setSessions(userSessions)
    })

    return unsubscribe
  }, [userId])

  // Subscribe to current session
  useEffect(() => {
    if (!currentSessionId) return

    const unsubscribe = subscribeToSession(currentSessionId, (session) => {
      setCurrentSession(session)
    })

    return unsubscribe
  }, [currentSessionId])

  // Subscribe to current session's polls
  useEffect(() => {
    if (!currentSessionId) {
      setCurrentPolls([])
      return
    }

    const unsubscribe = subscribeToSessionPolls(currentSessionId, (polls) => {
      setCurrentPolls(polls)
    })

    return unsubscribe
  }, [currentSessionId])

  const handleCreateSession = useCallback(
    async (title: string) => {
      if (!userId || !title.trim()) return

      setLoading(true)
      setError(null)
      try {
        const session = await createSession(title.trim(), userId)
        setCurrentSession(session)
        setUserRole("admin")
        setActiveTab("create")
        toast.success("🎉 Session created successfully!", {
          description: `Session code: ${session.code}`,
        })
      } catch (error: any) {
        setError(error.message)
        toast.error("Failed to create session", {
          description: error.message,
        })
      } finally {
        setLoading(false)
      }
    },
    [userId],
  )

  const handleJoinSession = useCallback(
    async (code: string) => {
      if (!userId || !code.trim()) return

      setLoading(true)
      setError(null)
      try {
        const session = await joinSession(code.trim().toUpperCase(), userId, userName)
        setCurrentSession(session)
        setUserRole(session.createdBy === userId ? "admin" : "user")
        setActiveTab("polls")
        toast.success("🎉 Joined session successfully!", {
          description: `Welcome to ${session.title}`,
        })
      } catch (error: any) {
        setError(error.message)
        toast.error("Failed to join session", {
          description: error.message,
        })
      } finally {
        setLoading(false)
      }
    },
    [userId, userName],
  )

  const handleCreatePoll = useCallback(async () => {
    if (!currentSession || !userId || !newPollQuestion.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    const validOptions = newPollOptions.filter((opt) => opt.trim())
    if (validOptions.length < 2) {
      toast.error("Please provide at least 2 poll options")
      return
    }

    setLoading(true)
    setError(null)
    try {
      await createPoll(currentSession.id, newPollQuestion.trim(), validOptions, userId)
      setNewPollQuestion("")
      setNewPollOptions(["", ""])
      toast.success("✨ Poll created successfully!", {
        description: "You can now launch it to start collecting votes",
      })
    } catch (error: any) {
      setError(error.message)
      toast.error("Failed to create poll", {
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }, [currentSession, userId, newPollQuestion, newPollOptions])

  const handleLaunchPoll = useCallback(
    async (pollId: string) => {
      if (!currentSession) return

      setLoading(true)
      try {
        await launchPoll(pollId, currentSession.id)
        setActiveTab("polls")
        toast.success("🚀 Poll launched!", {
          description: "Participants can now vote",
        })
      } catch (error: any) {
        toast.error("Failed to launch poll", {
          description: error.message,
        })
      } finally {
        setLoading(false)
      }
    },
    [currentSession],
  )

  const handleStopPoll = useCallback(async (pollId: string) => {
    setLoading(true)
    try {
      await stopPoll(pollId)
      toast.success("⏹️ Poll stopped!", {
        description: "No more votes will be accepted",
      })
    } catch (error: any) {
      toast.error("Failed to stop poll", {
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSubmitResponse = useCallback(
    async (pollId: string, option: string) => {
      if (!currentSession || !userId) return

      setLoading(true)
      try {
        await submitResponse(pollId, currentSession.id, userId, userName, option)
        setUserResponses((prev) => ({ ...prev, [pollId]: option }))
        toast.success("✅ Vote submitted!", {
          description: `You voted for: ${option}`,
        })
      } catch (error: any) {
        toast.error("Failed to submit vote", {
          description: error.message,
        })
      } finally {
        setLoading(false)
      }
    },
    [currentSession, userId, userName],
  )

  const handleLeaveSession = useCallback(() => {
    setCurrentSession(null)
    setCurrentPolls([])
    setUserRole(null)
    setUserResponses({})
    setSessionCode("")
    setError(null)
    setActiveTab("polls")
    toast.info("Left session")
  }, [])

  const addPollOption = useCallback(() => {
    setNewPollOptions((prev) => [...prev, ""])
  }, [])

  const updatePollOption = useCallback((index: number, value: string) => {
    setNewPollOptions((prev) => {
      const updated = [...prev]
      updated[index] = value
      return updated
    })
  }, [])

  const removePollOption = useCallback((index: number) => {
    setNewPollOptions((prev) => {
      if (prev.length > 2) {
        return prev.filter((_, i) => i !== index)
      }
      return prev
    })
  }, [])

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-blue-600 rounded-full">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">Real-Time Polling</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Create interactive polls and engage with your audience in real-time with beautiful charts and analytics
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Badge variant="secondary">Welcome, {userName}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)}>
                Debug
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {showDebug && (
            <div className="mb-8">
              <DebugPanel />
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Main Action Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Create Session
                </CardTitle>
                <CardDescription>Start a new polling session and manage polls as an admin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="session-title">Session Title</Label>
                  <Input
                    id="session-title"
                    placeholder="Enter session title"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCreateSession((e.target as HTMLInputElement).value)
                      }
                    }}
                    disabled={loading}
                  />
                </div>
                <Button
                  onClick={() => {
                    const input = document.getElementById("session-title") as HTMLInputElement
                    if (input.value.trim()) {
                      handleCreateSession(input.value.trim())
                    }
                  }}
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create Session
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Join Session
                </CardTitle>
                <CardDescription>Enter session code to participate in polls as a user</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="session-code">Session Code</Label>
                  <Input
                    id="session-code"
                    placeholder="Enter session code"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                    className="font-mono"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && sessionCode.trim()) {
                        handleJoinSession(sessionCode)
                      }
                    }}
                    disabled={loading}
                  />
                </div>
                <Button
                  onClick={() => handleJoinSession(sessionCode)}
                  disabled={!sessionCode.trim() || loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Join Session
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Sessions */}
          {sessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Your Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{session.title}</div>
                        <div className="text-sm text-gray-500">
                          Code: <span className="font-mono">{session.code}</span> • {session.participants.length}{" "}
                          participants
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={session.isActive ? "default" : "secondary"}>
                          {session.isActive ? "Active" : "Ended"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCurrentSession(session)
                            setUserRole(session.createdBy === userId ? "admin" : "user")
                          }}
                        >
                          {session.createdBy === userId ? "Manage" : "Join"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentSession.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <span>
                  Code: <span className="font-mono font-bold text-primary">{currentSession.code}</span>
                </span>
                <span>•</span>
                <span>{currentSession.participants.length} participants</span>
                <span>•</span>
                <Badge variant={userRole === "admin" ? "default" : "secondary"}>
                  {userRole === "admin" ? "Admin" : `User: ${userName}`}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
              <Button variant="outline" onClick={handleLeaveSession}>
                Leave Session
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Session Stats */}
        <SessionStats session={currentSession} polls={currentPolls} />

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="polls">Live Polls</TabsTrigger>
            {userRole === "admin" && <TabsTrigger value="create">Create Poll</TabsTrigger>}
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="polls" className="space-y-6">
            {currentPolls.filter((poll) => poll.isActive).length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Polls</h3>
                  <p className="text-gray-600 mb-4">
                    {userRole === "admin"
                      ? "Create and launch a poll to get started with real-time engagement"
                      : "Waiting for the admin to launch a poll..."}
                  </p>
                  {userRole === "admin" && (
                    <Button onClick={() => setActiveTab("create")} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Poll
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {currentPolls
                  .filter((poll) => poll.isActive)
                  .map((poll) => (
                    <EnhancedPollCard
                      key={poll.id}
                      poll={poll}
                      userRole={userRole!}
                      userResponse={userResponses[poll.id]}
                      onLaunch={handleLaunchPoll}
                      onStop={handleStopPoll}
                      onVote={handleSubmitResponse}
                      loading={loading}
                    />
                  ))}
              </div>
            )}
          </TabsContent>

          {userRole === "admin" && (
            <TabsContent value="create" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create New Poll
                  </CardTitle>
                  <CardDescription>
                    Create engaging polls to collect real-time feedback from your audience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="poll-question">Poll Question *</Label>
                    <Input
                      id="poll-question"
                      placeholder="What would you like to ask your audience?"
                      value={newPollQuestion}
                      onChange={(e) => setNewPollQuestion(e.target.value)}
                      disabled={loading}
                      className="mt-1"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Answer Options * (minimum 2)</Label>
                    {newPollOptions.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => updatePollOption(index, e.target.value)}
                          disabled={loading}
                        />
                        {newPollOptions.length > 2 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removePollOption(index)}
                            disabled={loading}
                            className="px-3"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addPollOption} disabled={loading} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  </div>

                  <Button
                    onClick={handleCreatePoll}
                    disabled={
                      !newPollQuestion.trim() || newPollOptions.filter((opt) => opt.trim()).length < 2 || loading
                    }
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Poll...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Create Poll
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {currentPolls.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Manage Your Polls</CardTitle>
                    <CardDescription>Launch, stop, and monitor your created polls</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentPolls.map((poll) => (
                        <div
                          key={poll.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{poll.question}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {poll.options.length} options • {Object.values(poll.responses).reduce((a, b) => a + b, 0)}{" "}
                              votes
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={poll.isActive ? "default" : "secondary"}>
                              {poll.isActive ? "Live" : "Draft"}
                            </Badge>
                            {!poll.isActive ? (
                              <Button size="sm" onClick={() => handleLaunchPoll(poll.id)} disabled={loading}>
                                <Play className="h-4 w-4 mr-1" />
                                Launch
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStopPoll(poll.id)}
                                disabled={loading}
                              >
                                <Square className="h-4 w-4 mr-1" />
                                Stop
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          <TabsContent value="results" className="space-y-6">
            {currentPolls.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Polls Yet</h3>
                  <p className="text-gray-600">Create some polls to see results and analytics here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {currentPolls.map((poll) => (
                  <EnhancedPollCard
                    key={poll.id}
                    poll={poll}
                    userRole={userRole!}
                    userResponse={userResponses[poll.id]}
                    loading={loading}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Session History</CardTitle>
                <CardDescription>Complete overview of all polls and their performance in this session</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentPolls.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No polls created yet</p>
                    </div>
                  ) : (
                    currentPolls.map((poll) => {
                      const totalVotes = Object.values(poll.responses).reduce((a, b) => a + b, 0)
                      return (
                        <div key={poll.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-lg">{poll.question}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant={poll.isActive ? "default" : "secondary"}>
                                {poll.isActive ? "Live" : "Ended"}
                              </Badge>
                              <span className="text-sm text-gray-500">{totalVotes} votes</span>
                            </div>
                          </div>
                          <div className="grid gap-2">
                            {poll.options.map((option) => {
                              const votes = poll.responses[option] || 0
                              const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0
                              return (
                                <div key={option} className="flex items-center justify-between text-sm py-1">
                                  <span className="font-medium">{option}</span>
                                  <div className="flex items-center gap-2 text-gray-500">
                                    <span>{votes} votes</span>
                                    <span>({percentage.toFixed(1)}%)</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthGuard>
      <PollingApp />
    </AuthGuard>
  )
}
