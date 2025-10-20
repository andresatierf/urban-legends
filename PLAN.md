# Urban Legends Application Plan

## Application Overview

Urban Legends is a web-based platform for hosting and participating in competitive tournaments. It allows administrators to create and manage tournaments, while users can register, form teams, and submit their entries for various activities within a tournament.

## MVP Features

- **User Authentication:**
  - User registration and login.
  - Password reset functionality.
- **Admin Dashboard:**
  - Manage users, teams, and tournaments.
  - Approve or reject submissions.
  - View reports and ledger.
- **User Dashboard:**
  - View user profile and stats.
  - Create and manage teams.
  - View tournament listings.
- **Tournaments:**
  - Admins can create, edit, and delete tournaments.
  - Users can view tournament details and leaderboards.
  - Users can join tournaments with their teams.
- **Teams:**
  - Users can create and manage their own teams.
  - Users can invite other users to their team.
- **Submissions:**
  - Teams can make submissions for tournament activities.
  - Admins can review and approve submissions.

## User Flow

### Admin Flow

1. Admin logs in.
2. Admin is redirected to the Admin Dashboard.
3. Admin can navigate to manage tournaments, users, teams, or review submissions.
4. Admin creates a new tournament, specifying details like name, dates, and activities.
5. Admin reviews submissions made by teams and approves or rejects them.

### User/Participant Flow

1. A new user registers for an account.
2. User logs in and is taken to their dashboard.
3. User can edit their profile.
4. User creates a new team.
5. User invites other users to the team.
6. User browses the list of available tournaments.
7. User joins a tournament with their team.
8. During the tournament, the user's team makes submissions for activities.
9. User can view the tournament leaderboard to see their team's ranking.

## Timeline/Order of Completion

### Phase 1: Core MVP (Authentication & Basic Structure)

- [x] User Authentication
  - [x] Registration Page (`/register`)
  - [x] Login Page (`/login`)
  - [x] Forgot Password Page (`/forgot-password`)
  - [x] Convex Authentication Backend
- [x] Basic Application Layout
  - [x] Main Layout (`layout.tsx`)
  - [x] Sidebar Navigation
  - [x] Responsive Design for Mobile
- [x] User Dashboard
  - [x] User Profile Display
  - [x] User Statistics
- [x] Admin Dashboard
  - [x] Basic Admin Dashboard Layout
  - [x] User Management Table
  - [x] Tournament Management Table
  - [x] Team Management Table

### Phase 2: Tournaments & Teams

- [x] Tournament Management (Admin)
  - [x] Create Tournament Form
  - [x] Edit Tournament Form
  - [x] View Tournament Details
- [x] Team Management (User)
  - [x] Create Team Form
  - [x] View Team Details
  - [ ] Invite Team Members
- [x] Tournament Participation (User)
  - [x] View List of Tournaments
  - [x] View Tournament Details Page
  - [ ] Join a tournament with a team

### Phase 3: Submissions & Leaderboards

- [x] Submissions
  - [x] New Submission Form
  - [x] Edit Submission Form
  - [x] View Submission Details
- [ ] Submission Approval (Admin)
  - [ ] Submission Approval Queue
  - [ ] Approve/Reject Buttons
- [x] Leaderboards
  - [x] View Tournament Leaderboard

### Phase 4: Post-MVP Features (Enhancements)

- [ ] Notifications
  - [ ] In-app notification system
  - [ ] Email notifications for key events
- [ ] Public Profiles
  - [ ] Public User Profile Page
  - [ ] Public Team Profile Page
- [ ] Advanced Reporting (Admin)
  - [ ] Data export (CSV/JSON)
  - [ ] Visualizations and charts
- [ ] Commenting System
  - [ ] Commenting on submissions
  - [ ] Commenting on tournament pages

### Phase 5: Future Features (Growth)

- [ ] Achievements/Badges
- [ ] Social Sharing
- [ ] Direct Messaging
- [ ] Customizable Tournament Rules
- [ ] Payment Integration

- [ ] Notifications: Email or in-app notifications for events like team invitations, submission status changes, and tournament reminders.
- [ ] Public Profiles: Publicly viewable user and team profiles.
- [ ] Commenting System: Ability for users to comment on submissions or tournament pages.
- [ ] Direct Messaging: A way for users to communicate with each other directly.
- [ ] Achievements/Badges: Gamification elements to reward users for participation and performance.
- [ ] Social Sharing: Ability to share tournament results or profiles on social media.
- [ ] Advanced Reporting: More detailed analytics and data export options for admins.
- [ ] Customizable Tournament Rules: More flexibility for admins to define custom rules and scoring for tournaments.
- [ ] Payment Integration: For paid tournaments.
