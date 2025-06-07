# 🗳️ Real-Time Polling App

A modern, interactive polling application built with Next.js and Firebase that enables real-time audience engagement with beautiful charts and analytics.

![Real-Time Polling App](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-Realtime%20Database-orange?style=for-the-badge&logo=firebase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🎯 Core Functionality

- **Real-time Polling**: Create and participate in live polls with instant results
- **Session Management**: Secure session-based polling with unique codes
- **Role-based Access**: Admin controls for poll creation and management
- **Anonymous Authentication**: Quick join without complex registration

### 📊 Analytics & Visualization

- **Live Charts**: Beautiful bar charts and pie charts using Recharts
- **Real-time Updates**: Watch results update instantly as votes come in
- **Progress Bars**: Visual representation of voting progress
- **Session Statistics**: Comprehensive analytics dashboard

### 🎨 User Experience

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Dark Mode Ready**: Built-in support for light and dark themes
- **Accessibility**: WCAG compliant with screen reader support

### 🔧 Technical Features

- **Offline Fallback**: Mock data system for development and testing
- **Error Handling**: Comprehensive error management with user-friendly messages
- **Type Safety**: Full TypeScript implementation
- **Performance Optimized**: Efficient real-time subscriptions and state management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project with Realtime Database

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Nithyananda2003/Real-Time-Polling-app.git
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up Firebase**

   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Realtime Database
   - Enable Anonymous Authentication
   - Copy your Firebase configuration

4. **Configure environment variables**

   ```bash
   # Update lib/firebase.ts with your Firebase config
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
     projectId: "your-project-id",
     storageBucket: "your-project.firebasestorage.app",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id"
   }
   ```

5. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎮 How to Use

### For Administrators

1. **Create a Session**

   - Enter a session title
   - Click "Create Session"
   - Share the generated session code with participants

2. **Create Polls**

   - Navigate to "Create Poll" tab
   - Enter your question and answer options
   - Click "Create Poll"

3. **Launch Polls**

   - Go to "Manage Your Polls" section
   - Click "Launch" on any poll to make it live
   - Monitor real-time results as votes come in

4. **Manage Sessions**
   - View participant count and session statistics
   - Stop polls when voting is complete
   - Access historical data and analytics

### For Participants

1. **Join a Session**

   - Enter the session code provided by the admin
   - Choose your display name
   - Click "Join Session"

2. **Vote on Polls**

   - View active polls in the "Live Polls" tab
   - Select your preferred option
   - Submit your vote

3. **View Results**
   - See real-time results after voting
   - Explore charts and analytics
   - Check session history

## 🏗️ Project Structure

```
├── app/
│   ├── globals.css          # Global styles and Tailwind configuration
│   ├── layout.tsx           # Root layout with providers
│   └── page.tsx             # Main application component
├── components/
│   ├── ui/                  # Reusable UI components (shadcn/ui)
│   ├── auth-guard.tsx       # Authentication wrapper
│   ├── debug-panel.tsx      # Development debugging tools
│   ├── enhanced-poll-card.tsx # Poll display component
│   ├── session-stats.tsx    # Analytics dashboard
│   └── mobile-navigation.tsx # Mobile-responsive navigation
├── hooks/
│   └── useAuth.ts           # Authentication hook
├── lib/
│   ├── firebase.ts          # Firebase configuration
│   ├── firestore.ts         # Database operations
│   ├── firestore-debug.ts   # Connection testing utilities
│   └── utils.ts             # Utility functions
└── tailwind.config.ts       # Tailwind CSS configuration
```

## 🛠️ Tech Stack

### Frontend

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern component library
- **Recharts**: Data visualization library
- **Lucide React**: Beautiful icons

### Backend & Database

- **Firebase Realtime Database**: Real-time data synchronization
- **Firebase Authentication**: Anonymous user authentication
- **Firebase Hosting**: (Optional) For deployment

### Development Tools

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Static type checking

## 🔧 Configuration

### Firebase Setup

1. **Realtime Database Rules**

   ```json
   {
     "rules": {
       ".read": "auth != null",
       ".write": "auth != null"
     }
   }
   ```

2. **Authentication Settings**
   - Enable Anonymous Authentication in Firebase Console
   - Configure authorized domains for production

### Environment Variables

The app uses Firebase configuration directly in the code. For production, consider using environment variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## 📱 Mobile Support

The app is fully responsive and optimized for mobile devices:

- **Touch-friendly interface**: Large buttons and touch targets
- **Mobile navigation**: Collapsible sidebar for small screens
- **Responsive charts**: Charts adapt to screen size
- **Optimized performance**: Efficient rendering on mobile devices

## 🎨 Customization

### Theming

- Modify `tailwind.config.ts` for custom colors
- Update CSS variables in `globals.css` for theme changes
- Add custom animations and transitions

### Components

- All UI components are in `components/ui/`
- Easily customizable with Tailwind classes
- Support for dark mode out of the box
