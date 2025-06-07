"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Play, Square, Users, Clock, TrendingUp, CheckCircle } from "lucide-react"
import type { Poll } from "@/lib/firestore"

interface EnhancedPollCardProps {
  poll: Poll
  userRole: "admin" | "user"
  userResponse?: string
  onLaunch?: (pollId: string) => void
  onStop?: (pollId: string) => void
  onVote?: (pollId: string, option: string) => void
  loading?: boolean
}

const COLORS = ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"]

export default function EnhancedPollCard({
  poll,
  userRole,
  userResponse,
  onLaunch,
  onStop,
  onVote,
  loading = false,
}: EnhancedPollCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
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
    setSelectedOption(option)
    onVote?.(poll.id, option)
  }

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg animate-fade-in">
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
              <Badge
                variant={poll.isActive ? "default" : "secondary"}
                className={poll.isActive ? "animate-pulse-glow" : ""}
              >
                {poll.isActive ? "Live" : "Ended"}
              </Badge>
            </div>
          </div>

          {userRole === "admin" && (
            <div className="flex gap-2 ml-4">
              {!poll.isActive ? (
                <Button size="sm" onClick={() => onLaunch?.(poll.id)} disabled={loading} className="vote-button">
                  <Play className="h-4 w-4 mr-1" />
                  Launch
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStop?.(poll.id)}
                  disabled={loading}
                  className="vote-button"
                >
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
                  className={`justify-start h-auto p-4 text-left poll-option-hover vote-button ${
                    selectedOption === option ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => handleVote(option)}
                  disabled={loading}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                      style={{ borderColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="flex-1">{option}</span>
                    {selectedOption === option && loading && (
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 animate-vote-success">
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
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowResults(!showResults)} className="text-xs">
                  {showResults ? "Hide Chart" : "Show Chart"}
                </Button>
              </div>
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
                    <Progress
                      value={percentage}
                      className="h-2"
                      style={{
                        background: `${COLORS[index % COLORS.length]}20`,
                      }}
                    />
                  </div>
                )
              })}
            </div>

            {/* Chart Visualization */}
            {showResults && totalVotes > 0 && (
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="chart-container">
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
                          <XAxis dataKey="name" fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                          <YAxis fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </div>

                <div className="chart-container">
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
