# 🏆 Urban Legends

A web-based tournament tracking platform that enables administrators to create and manage tournaments while users can form teams, join tournaments, and submit entries for tournament activities.

## ✨ Features

- **🎯 Tournament Management**: Admins can create, edit, and manage tournaments with customizable team sizes and date ranges
- **👥 Team Formation**: Users can create teams and join tournaments with role-based team management (captain/member)
- **📊 Activity Tracking**: Teams submit daily activities that require admin approval
- **🔒 Role-Based Access Control**: Admin and user roles with protected routes and operations
- **⚡ Real-time Updates**: Live data synchronization powered by Convex
- **🔐 OAuth Authentication**: Seamless sign-in/sign-up flow via Clerk

## 🛠️ Tech Stack

- **💻 Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **🚀 Backend**: Convex (serverless backend with real-time data)
- **🔑 Authentication**: Clerk (OAuth integration)
- **🎨 UI**: Tailwind CSS, Radix UI, shadcn/ui patterns
- **📝 Forms**: TanStack Form with Zod validation
- **📋 Tables**: TanStack Table

## 🚀 Getting Started

### 📦 Prerequisites

- [Bun](https://bun.sh) 🥟 (recommended) or Node.js 18+
- [Convex](https://convex.dev) account ⚡
- [Clerk](https://clerk.com) account 🔐

### 📥 Installation

1. 📂 Clone the repository:

```bash
git clone <repository-url>
cd urban-legends
```

2. 📦 Install dependencies:

```bash
bun install
```

3. ⚙️ Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Convex and Clerk credentials:

```bash
# Convex Backend Configuration
# Get these values from https://dashboard.convex.dev
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=

# Clerk Authentication Configuration
# Get these values from https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER_DOMAIN=
CLERK_WEBHOOK_SECRET=

# Clerk URL Configuration
# These control the authentication flow redirects
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

4. 🚀 Run the development servers:

**Terminal 1** 💻 - Next.js frontend:

```bash
bun run dev
```

**Terminal 2** ⚡ - Convex backend:

```bash
bunx convex dev
```

5. 🌐 Open [http://localhost:3000](http://localhost:3000) in your browser

## 💻 Development Commands

### 🏃 Application

```bash
bun run dev              # 🚀 Start Next.js dev server with Turbopack
bunx convex dev          # ⚡ Start Convex backend (run in separate terminal)
bun run build           # 🏗️ Build for production
bun run start           # ▶️ Start production server
```

### ✅ Code Quality

```bash
bun run lint            # 🔍 Run Biome linter
bun run lint:fix        # 🔧 Auto-fix linting issues
bun run format          # 📐 Check code formatting
bun run format:fix      # ✨ Auto-format code
```

**📝 Note**: This project uses [Biome](https://biomejs.dev) for linting and formatting (not ESLint/Prettier).

## 📁 Project Structure

```
📦 /convex/             # ⚡ Convex backend functions
  schema.ts              # 🗄️ Database schema
  tournaments.ts         # 🎯 Tournament logic
  teams.ts               # 👥 Team management
  submissions.ts         # 📊 Submission tracking

📦 /src/
  /app/                 # 🌐 Next.js App Router
    /(auth)/             # 🔓 Public auth routes
    /(all)/              # 🔒 Protected routes
      /admin/             # 👑 Admin-only pages
      /tournaments/       # 🏆 Tournament pages
      /teams/             # 👥 Team pages

  /components/          # 🧩 React components
  /hooks/               # 🪝 Custom hooks
  /lib/                 # 🛠️ Utilities
```

## 📚 Documentation

For detailed development guidelines, architecture details, and common patterns, see [CLAUDE.md](./CLAUDE.md). 📖

## 📄 License

[License information] ⚖️
