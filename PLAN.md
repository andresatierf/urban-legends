# Urban Legends Application Plan

## Application Overview

Urban Legends is a web-based platform for hosting and participating in competitive tournaments. It allows administrators to create and manage tournaments, while users can register, form teams, and submit their entries for various activities within a tournament.

## MVP Features

*   **User Authentication:**
    *   User registration and login.
    *   Password reset functionality.
*   **Admin Dashboard:**
    *   Manage users, teams, and tournaments.
    *   Approve or reject submissions.
    *   View reports and ledger.
*   **User Dashboard:**
    *   View user profile and stats.
    *   Create and manage teams.
    *   View tournament listings.
*   **Tournaments:**
    *   Admins can create, edit, and delete tournaments.
    *   Users can view tournament details and leaderboards.
    *   Users can join tournaments with their teams.
*   **Teams:**
    *   Users can create and manage their own teams.
    *   Users can invite other users to their team.
*   **Submissions:**
    *   Teams can make submissions for tournament activities.
    *   Admins can review and approve submissions.

## User Flow

### Admin Flow

1.  Admin logs in.
2.  Admin is redirected to the Admin Dashboard.
3.  Admin can navigate to manage tournaments, users, teams, or review submissions.
4.  Admin creates a new tournament, specifying details like name, dates, and activities.
5.  Admin reviews submissions made by teams and approves or rejects them.

### User/Participant Flow

1.  A new user registers for an account.
2.  User logs in and is taken to their dashboard.
3.  User can edit their profile.
4.  User creates a new team.
5.  User invites other users to the team.
6.  User browses the list of available tournaments.
7.  User joins a tournament with their team.
8.  During the tournament, the user's team makes submissions for activities.
9.  User can view the tournament leaderboard to see their team's ranking.
