import { ref, push, set, get, onValue, off, serverTimestamp, update } from "firebase/database"
import { db } from "./firebase"

export interface Poll {
  id: string
  sessionId: string
  question: string
  options: string[]
  responses: { [key: string]: number }
  isActive: boolean
  createdAt: number | object
  createdBy: string
}

export interface Session {
  id: string
  code: string
  title: string
  createdBy: string
  participants: string[]
  createdAt: number | object
  isActive: boolean
}

export interface UserResponse {
  id: string
  userId: string
  userName: string
  pollId: string
  sessionId: string
  selectedOption: string
  createdAt: number | object
}

// Mock data store for fallback
const mockData: {
  sessions: { [key: string]: Session }
  polls: { [key: string]: Poll }
  responses: { [key: string]: UserResponse }
} = {
  sessions: {},
  polls: {},
  responses: {},
}

// Helper to simulate real-time updates for mock data
const mockListeners: { [key: string]: Function[] } = {}

const triggerMockListeners = (type: string, data: any) => {
  if (mockListeners[type]) {
    mockListeners[type].forEach((callback) => callback(data))
  }
}

// Test Realtime Database connection
export const testFirestoreConnection = async (userId: string) => {
  console.log("🔍 Testing Realtime Database connection...")

  try {
    // Test 1: Basic connection
    console.log("📡 Testing basic database connection...")
    const testRef = ref(db, `test/connection-test`)

    // Test 2: Write permission
    console.log("✍️ Testing write permissions...")
    await set(testRef, {
      message: "Connection test",
      timestamp: serverTimestamp(),
      userId: userId,
    })
    console.log("✅ Write test successful")

    // Test 3: Read permission
    console.log("📖 Testing read permissions...")
    const snapshot = await get(testRef)
    if (snapshot.exists()) {
      console.log("✅ Read test successful:", snapshot.val())
    } else {
      console.log("❌ Document doesn't exist after write")
    }

    return { success: true, message: "Realtime Database connection successful" }
  } catch (error: any) {
    console.error("❌ Database test failed:", error)
    return {
      success: false,
      message: `Database error: ${error.code || error.message}`,
      error: error,
    }
  }
}

// Session operations
export const createSession = async (title: string, userId: string): Promise<Session> => {
  console.log("🚀 Creating session:", { title, userId })

  // Test database connection first
  try {
    const connectionTest = await testFirestoreConnection(userId)
    if (!connectionTest.success) {
      console.warn("⚠️ Database connection failed, using mock data")
      return createSessionMock(title, userId)
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const sessionData = {
      code,
      title,
      createdBy: userId,
      participants: [userId],
      createdAt: serverTimestamp(),
      isActive: true,
    }

    console.log("📝 Adding session to Realtime Database...")

    const sessionsRef = ref(db, "sessions")
    const newSessionRef = push(sessionsRef)

    await set(newSessionRef, sessionData)

    console.log("✅ Session created successfully:", newSessionRef.key)

    // Return session with explicit properties to avoid spread issues
    const session: Session = {
      id: newSessionRef.key!,
      code: code,
      title: title,
      createdBy: userId,
      participants: [userId],
      createdAt: Date.now(),
      isActive: true,
    }

    return session
  } catch (error: any) {
    console.error("❌ Database session creation failed:", error)
    console.log("🔄 Falling back to mock data...")
    return createSessionMock(title, userId)
  }
}

const createSessionMock = (title: string, userId: string): Session => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase()
  const session: Session = {
    id: `mock_${Date.now()}`,
    code,
    title,
    createdBy: userId,
    participants: [userId],
    createdAt: Date.now(),
    isActive: true,
  }

  mockData.sessions[session.id] = session
  triggerMockListeners("sessions", Object.values(mockData.sessions))

  return session
}

export const joinSession = async (code: string, userId: string, userName: string): Promise<Session> => {
  console.log("🔗 Joining session:", { code, userId })

  try {
    const sessionsRef = ref(db, "sessions")
    const snapshot = await get(sessionsRef)

    if (snapshot.exists()) {
      const sessions = snapshot.val()
      const sessionEntry = Object.entries(sessions).find(
        ([_, session]: [string, any]) => session.code === code && session.isActive,
      )

      if (sessionEntry) {
        const [sessionId, sessionData] = sessionEntry as [string, any]
        const sessionRef = ref(db, `sessions/${sessionId}`)

        // Safely handle participants array
        let participants: string[] = []
        if (sessionData.participants && Array.isArray(sessionData.participants)) {
          participants = sessionData.participants
        } else if (sessionData.createdBy) {
          participants = [sessionData.createdBy]
        }

        if (!participants.includes(userId)) {
          const updatedParticipants = [...participants, userId]
          await update(sessionRef, {
            participants: updatedParticipants,
          })
          participants = updatedParticipants
        }

        console.log("✅ Successfully joined session:", sessionId)

        // Return session with explicit properties
        const session: Session = {
          id: sessionId,
          code: sessionData.code || code,
          title: sessionData.title || "Unknown Session",
          createdBy: sessionData.createdBy || "",
          participants: participants,
          createdAt: sessionData.createdAt || Date.now(),
          isActive: sessionData.isActive !== false,
        }

        return session
      }
    }

    throw new Error("Session not found")
  } catch (error: any) {
    console.error("❌ Error joining session:", error)

    // Try mock data
    const session = Object.values(mockData.sessions).find((s) => s.code === code && s.isActive)
    if (session) {
      if (!session.participants.includes(userId)) {
        session.participants.push(userId)
      }
      return session
    }

    throw new Error("Session not found")
  }
}

export const endSession = async (sessionId: string) => {
  try {
    const sessionRef = ref(db, `sessions/${sessionId}`)
    await update(sessionRef, {
      isActive: false,
    })
  } catch (error) {
    console.error("Error ending session:", error)
    throw new Error("Failed to end session")
  }
}

// Poll operations with fallback
export const createPoll = async (
  sessionId: string,
  question: string,
  options: string[],
  userId: string,
): Promise<Poll> => {
  console.log("📊 Creating poll:", { sessionId, question, options, userId })

  if (!sessionId || !question.trim() || !options.length || !userId) {
    throw new Error("Missing required fields for poll creation")
  }

  if (options.some((option) => !option.trim())) {
    throw new Error("All poll options must be non-empty")
  }

  const pollData = {
    sessionId,
    question: question.trim(),
    options: options.map((opt) => opt.trim()),
    responses: options.reduce((acc, option) => ({ ...acc, [option.trim()]: 0 }), {}),
    isActive: false,
    createdAt: serverTimestamp(),
    createdBy: userId,
  }

  try {
    console.log("📝 Adding poll to Realtime Database...")

    const pollsRef = ref(db, "polls")
    const newPollRef = push(pollsRef)

    await set(newPollRef, pollData)

    console.log("✅ Poll created successfully:", newPollRef.key)

    // Return poll with explicit properties
    const poll: Poll = {
      id: newPollRef.key!,
      sessionId: sessionId,
      question: question.trim(),
      options: options.map((opt) => opt.trim()),
      responses: options.reduce((acc, option) => ({ ...acc, [option.trim()]: 0 }), {}),
      isActive: false,
      createdAt: Date.now(),
      createdBy: userId,
    }

    return poll
  } catch (error: any) {
    console.error("❌ Database poll creation failed:", error)
    console.log("🔄 Falling back to mock data...")
    return createPollMock(sessionId, question, options, userId)
  }
}

const createPollMock = (sessionId: string, question: string, options: string[], userId: string): Poll => {
  const poll: Poll = {
    id: `mock_poll_${Date.now()}`,
    sessionId,
    question: question.trim(),
    options: options.map((opt) => opt.trim()),
    responses: options.reduce((acc, option) => ({ ...acc, [option.trim()]: 0 }), {}),
    isActive: false,
    createdAt: Date.now(),
    createdBy: userId,
  }

  mockData.polls[poll.id] = poll
  triggerMockListeners(
    `polls_${sessionId}`,
    Object.values(mockData.polls).filter((p) => p.sessionId === sessionId),
  )

  return poll
}

export const launchPoll = async (pollId: string, sessionId: string): Promise<void> => {
  console.log("🚀 Launching poll:", pollId)

  try {
    // First, get all polls to deactivate others in the session
    const pollsRef = ref(db, "polls")
    const snapshot = await get(pollsRef)

    if (snapshot.exists()) {
      const polls = snapshot.val()

      // Create individual update operations for each poll
      const updatePromises: Promise<void>[] = []

      Object.entries(polls).forEach(([id, poll]: [string, any]) => {
        if (poll.sessionId === sessionId) {
          const pollRef = ref(db, `polls/${id}`)
          const updatePromise = update(pollRef, { isActive: id === pollId })
          updatePromises.push(updatePromise)
        }
      })

      // Wait for all updates to complete
      await Promise.all(updatePromises)
    } else {
      // If no polls exist yet, just activate this one
      const pollRef = ref(db, `polls/${pollId}`)
      await update(pollRef, { isActive: true })
    }

    console.log("✅ Poll launched successfully")
  } catch (error: any) {
    console.error("❌ Error launching poll:", error)

    // Mock fallback
    Object.values(mockData.polls).forEach((poll) => {
      if (poll.sessionId === sessionId) {
        poll.isActive = poll.id === pollId
      }
    })

    triggerMockListeners(
      `polls_${sessionId}`,
      Object.values(mockData.polls).filter((p) => p.sessionId === sessionId),
    )
  }
}

export const stopPoll = async (pollId: string): Promise<void> => {
  console.log("⏹️ Stopping poll:", pollId)

  try {
    const pollRef = ref(db, `polls/${pollId}`)
    await update(pollRef, { isActive: false })
    console.log("✅ Poll stopped successfully")
  } catch (error: any) {
    console.error("❌ Error stopping poll:", error)

    // Mock fallback
    if (mockData.polls[pollId]) {
      mockData.polls[pollId].isActive = false
      const sessionId = mockData.polls[pollId].sessionId
      triggerMockListeners(
        `polls_${sessionId}`,
        Object.values(mockData.polls).filter((p) => p.sessionId === sessionId),
      )
    }
  }
}

export const submitResponse = async (
  pollId: string,
  sessionId: string,
  userId: string,
  userName: string,
  selectedOption: string,
): Promise<void> => {
  console.log("📝 Submitting response:", { pollId, userId, selectedOption })

  try {
    // Check if user already responded
    const responsesRef = ref(db, "responses")
    const snapshot = await get(responsesRef)

    if (snapshot.exists()) {
      const responses = snapshot.val()
      const existingResponse = Object.values(responses).find(
        (response: any) => response.pollId === pollId && response.userId === userId,
      )

      if (existingResponse) {
        throw new Error("You have already responded to this poll")
      }
    }

    // Add response
    const responseData = {
      userId,
      userName,
      pollId,
      sessionId,
      selectedOption,
      createdAt: serverTimestamp(),
    }

    const newResponseRef = push(ref(db, "responses"))
    await set(newResponseRef, responseData)

    // Update poll response count
    const pollResponseRef = ref(db, `polls/${pollId}/responses/${selectedOption}`)
    const currentSnapshot = await get(pollResponseRef)
    const currentCount = currentSnapshot.exists() ? currentSnapshot.val() : 0
    await set(pollResponseRef, currentCount + 1)

    console.log("✅ Response submitted successfully")
  } catch (error: any) {
    console.error("❌ Error submitting response:", error)
    throw error
  }
}

// Real-time listeners
export const subscribeToSession = (sessionId: string, callback: (session: Session) => void) => {
  console.log("👂 Subscribing to session:", sessionId)

  try {
    const sessionRef = ref(db, `sessions/${sessionId}`)

    const listener = onValue(
      sessionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          console.log("📡 Session updated:", sessionId)
          const data = snapshot.val()

          // Create session with explicit properties
          const session: Session = {
            id: sessionId,
            code: data.code || "",
            title: data.title || "Unknown Session",
            createdBy: data.createdBy || "",
            participants: Array.isArray(data.participants) ? data.participants : [data.createdBy || ""],
            createdAt: data.createdAt || Date.now(),
            isActive: data.isActive !== false,
          }

          callback(session)
        }
      },
      (error) => {
        console.error("❌ Error listening to session:", error)
        // Fallback to mock data
        if (mockData.sessions[sessionId]) {
          callback(mockData.sessions[sessionId])
        }
      },
    )

    return () => off(sessionRef, "value", listener)
  } catch (error) {
    console.error("❌ Failed to set up session listener:", error)
    // Return mock listener
    const listenerKey = `session_${sessionId}`
    if (!mockListeners[listenerKey]) {
      mockListeners[listenerKey] = []
    }
    mockListeners[listenerKey].push(callback)

    // Immediately call with current data
    if (mockData.sessions[sessionId]) {
      callback(mockData.sessions[sessionId])
    }

    return () => {
      mockListeners[listenerKey] = mockListeners[listenerKey].filter((cb) => cb !== callback)
    }
  }
}

export const subscribeToSessionPolls = (sessionId: string, callback: (polls: Poll[]) => void) => {
  console.log("👂 Subscribing to polls for session:", sessionId)

  try {
    const pollsRef = ref(db, "polls")

    const listener = onValue(
      pollsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const allPolls = snapshot.val()
          const sessionPolls = Object.entries(allPolls)
            .filter(([_, poll]: [string, any]) => poll.sessionId === sessionId)
            .map(([id, pollData]: [string, any]) => {
              // Create poll with explicit properties
              const poll: Poll = {
                id: id,
                sessionId: pollData.sessionId || sessionId,
                question: pollData.question || "",
                options: Array.isArray(pollData.options) ? pollData.options : [],
                responses: pollData.responses || {},
                isActive: pollData.isActive === true,
                createdAt: pollData.createdAt || Date.now(),
                createdBy: pollData.createdBy || "",
              }
              return poll
            })
            .sort((a, b) => {
              // Handle both serverTimestamp and client-side timestamps
              const aTime =
                a.createdAt && typeof a.createdAt === "object" && (a.createdAt as any).seconds
                  ? (a.createdAt as any).seconds * 1000
                  : (a.createdAt as number) || 0
              const bTime =
                b.createdAt && typeof b.createdAt === "object" && (b.createdAt as any).seconds
                  ? (b.createdAt as any).seconds * 1000
                  : (b.createdAt as number) || 0
              return bTime - aTime
            })

          console.log("📡 Polls updated, count:", sessionPolls.length)
          callback(sessionPolls)
        } else {
          callback([])
        }
      },
      (error) => {
        console.error("❌ Error listening to polls:", error)
        // Fallback to mock data
        const sessionPolls = Object.values(mockData.polls).filter((p) => p.sessionId === sessionId)
        callback(sessionPolls)
      },
    )

    return () => off(pollsRef, "value", listener)
  } catch (error) {
    console.error("❌ Failed to set up polls listener:", error)
    // Return mock listener
    const listenerKey = `polls_${sessionId}`
    if (!mockListeners[listenerKey]) {
      mockListeners[listenerKey] = []
    }
    mockListeners[listenerKey].push(callback)

    // Immediately call with current data
    const sessionPolls = Object.values(mockData.polls).filter((p) => p.sessionId === sessionId)
    callback(sessionPolls)

    return () => {
      mockListeners[listenerKey] = mockListeners[listenerKey].filter((cb) => cb !== callback)
    }
  }
}

export const subscribeToUserSessions = (userId: string, callback: (sessions: Session[]) => void) => {
  console.log("👂 Subscribing to user sessions:", userId)

  try {
    const sessionsRef = ref(db, "sessions")

    const listener = onValue(
      sessionsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const allSessions = snapshot.val()
          const userSessions = Object.entries(allSessions)
            .filter(([_, sessionData]: [string, any]) => {
              // Handle case where participants might be undefined or not an array
              const participants = sessionData.participants || []
              return Array.isArray(participants) && participants.includes(userId)
            })
            .map(([id, sessionData]: [string, any]) => {
              // Create session with explicit properties
              const session: Session = {
                id: id,
                code: sessionData.code || "",
                title: sessionData.title || "Unknown Session",
                createdBy: sessionData.createdBy || "",
                participants: Array.isArray(sessionData.participants)
                  ? sessionData.participants
                  : [sessionData.createdBy || ""],
                createdAt: sessionData.createdAt || Date.now(),
                isActive: sessionData.isActive !== false,
              }
              return session
            })
            .sort((a, b) => {
              // Handle both serverTimestamp and client-side timestamps
              const aTime =
                a.createdAt && typeof a.createdAt === "object" && (a.createdAt as any).seconds
                  ? (a.createdAt as any).seconds * 1000
                  : (a.createdAt as number) || 0
              const bTime =
                b.createdAt && typeof b.createdAt === "object" && (b.createdAt as any).seconds
                  ? (b.createdAt as any).seconds * 1000
                  : (b.createdAt as number) || 0
              return bTime - aTime
            })

          console.log("📡 User sessions updated, count:", userSessions.length)
          callback(userSessions)
        } else {
          callback([])
        }
      },
      (error) => {
        console.error("❌ Error listening to user sessions:", error)
        // Fallback to mock data
        const userSessions = Object.values(mockData.sessions).filter((s) => s.participants.includes(userId))
        callback(userSessions)
      },
    )

    return () => off(sessionsRef, "value", listener)
  } catch (error) {
    console.error("❌ Failed to set up user sessions listener:", error)
    // Return mock listener
    const listenerKey = "sessions"
    if (!mockListeners[listenerKey]) {
      mockListeners[listenerKey] = []
    }
    mockListeners[listenerKey].push(callback)

    // Immediately call with current data
    const userSessions = Object.values(mockData.sessions).filter((s) => s.participants.includes(userId))
    callback(userSessions)

    return () => {
      mockListeners[listenerKey] = mockListeners[listenerKey].filter((cb) => cb !== callback)
    }
  }
}
