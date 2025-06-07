"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Menu, Users, BarChart3, History, Plus, LogOut } from "lucide-react"

interface MobileNavigationProps {
  userRole: "admin" | "user"
  activeTab: string
  onTabChange: (tab: string) => void
  onSignOut: () => void
  sessionCode?: string
  participantCount?: number
}

export default function MobileNavigation({
  userRole,
  activeTab,
  onTabChange,
  onSignOut,
  sessionCode,
  participantCount,
}: MobileNavigationProps) {
  const [open, setOpen] = useState(false)

  const navItems = [
    { id: "polls", label: "Live Polls", icon: BarChart3 },
    ...(userRole === "admin" ? [{ id: "create", label: "Create Poll", icon: Plus }] : []),
    { id: "results", label: "Results", icon: BarChart3 },
    { id: "history", label: "History", icon: History },
  ]

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                  <h2 className="mb-2 px-4 text-lg font-semibold">Navigation</h2>
                  <div className="space-y-1">
                    {navItems.map((item) => (
                      <Button
                        key={item.id}
                        variant={activeTab === item.id ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => {
                          onTabChange(item.id)
                          setOpen(false)
                        }}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {sessionCode && (
                  <div className="px-3 py-2 border-t">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Session Info</div>
                      <div className="text-xs text-muted-foreground">
                        Code: <span className="font-mono font-bold">{sessionCode}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {participantCount} participants
                      </div>
                    </div>
                  </div>
                )}

                <div className="px-3 py-2 border-t">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      onSignOut()
                      setOpen(false)
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {sessionCode && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {sessionCode}
              </Badge>
              <Badge variant={userRole === "admin" ? "default" : "secondary"}>
                {userRole === "admin" ? "Admin" : "User"}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
