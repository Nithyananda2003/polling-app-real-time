"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, BarChart3, Clock, TrendingUp } from "lucide-react"
import type { Session, Poll } from "@/lib/firestore"

interface SessionStatsProps {
  session: Session
  polls: Poll[]
}

export default function SessionStats({ session, polls }: SessionStatsProps) {
  const totalPolls = polls.length
  const activePolls = polls.filter((poll) => poll.isActive).length
  const totalVotes = polls.reduce((acc, poll) => acc + Object.values(poll.responses).reduce((a, b) => a + b, 0), 0)
  const avgVotesPerPoll = totalPolls > 0 ? (totalVotes / totalPolls).toFixed(1) : "0"

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
        <Card key={stat.title} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
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
