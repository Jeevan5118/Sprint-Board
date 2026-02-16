# Scrum Board Project

A full-stack Agile project management application inspired by Jira.

This project helps teams manage:
- teams and members
- projects and sprints
- sprint board tasks (backlog, todo, in progress, review, done)
- task details (story points, assignee, comments, links, attachments)
- user dashboard metrics

## What Is In This Repo

- `frontend/`: React application (CRA + React Router + Axios + Tailwind CSS)
- `backend/`: Node.js + Express REST API with MySQL

## Core Features

- Authentication with JWT (`admin` and `member` roles)
- Team-based access control across projects, sprints, and tasks
- Sprint board with drag-and-drop task movement
- Task detail drawer with:
  - story points update
  - assignee update
  - comments
  - links
  - attachments
- Team management UI
- Dashboard summary for logged-in user

## Access Rules (Important)

- `admin` can manage teams, projects, and sprint lifecycle actions.
- `member` can access data only for teams they belong to.
- Members now see only their own teams in Teams screen (`/api/teams/my`).
- Members can read team members for their own team (`/api/teams/:id/members`), but not other teams.

## Tech Stack

### Frontend
- React 18
- React Router DOM
- Axios
- Tailwind CSS

### Backend
- Node.js
- Express
- MySQL (`mysql2`)
- JWT (`jsonwebtoken`)
- Password hashing (`bcryptjs`)
- Validation (`express-validator`)

## Database (High Level)

Main tables:
- `users`
- `teams`
- `team_members`
- `projects`
- `sprints`
- `tasks`
- `comments`
- `task_links`
- `task_attachments`

SQL files:
- `backend/database/schema.sql`
- `backend/database/seeds.sql`

## How To Run Locally

## 1. Prerequisites

- Node.js 16+
- MySQL server

## 2. Backend Setup

1. Go to backend:
```bash
cd backend
```
2. Install dependencies:
```bash
npm install
```
3. Create `.env` file (see `backend/src/config/env.js` for required keys):
- `PORT`
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_PORT`
- `JWT_SECRET`
- `JWT_EXPIRE`
- `CLIENT_URL`
4. Create DB schema and seed data:
```bash
mysql -u <user> -p < database/schema.sql
mysql -u <user> -p < database/seeds.sql
```
5. Start backend:
```bash
npm run dev
```

## 3. Frontend Setup

1. Go to frontend:
```bash
cd frontend
```
2. Install dependencies:
```bash
npm install
```
3. Start frontend:
```bash
npm start
```

Default frontend URL:
- `http://localhost:3000`

Backend API base URL in frontend:
- `frontend/src/services/api.js` (currently points to `http://localhost:5001/api`)

## Main API Groups

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/users` (admin)

### Teams
- `GET /api/teams` (public list for registration dropdown)
- `GET /api/teams/my` (authenticated, returns only user’s teams)
- `GET /api/teams/:id/members` (authenticated, restricted by team membership for members)
- `POST /api/teams` (admin)
- `POST /api/teams/:id/members` (admin)
- `DELETE /api/teams/:id/members/:userId` (admin)

### Projects
- `GET /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects` (admin)
- `DELETE /api/projects/:id` (admin)

### Sprints
- `GET /api/sprints/project/:projectId`
- `GET /api/sprints/:id`
- `POST /api/sprints`
- `PATCH /api/sprints/:id/start`
- `PATCH /api/sprints/:id/complete`

### Tasks
- `GET /api/tasks/project/:projectId`
- `GET /api/tasks/sprint/:sprintId`
- `GET /api/tasks/:id`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `PATCH /api/tasks/:id/status`
- `DELETE /api/tasks/:id`
- `POST /api/tasks/:id/links`
- `POST /api/tasks/:id/attachments`

### Comments / Dashboard
- `GET /api/comments/task/:taskId`
- `POST /api/comments/task/:taskId`
- `DELETE /api/comments/:id`
- `GET /api/dashboard/user`

## Useful Notes

- If frontend behaves unexpectedly after backend changes, restart backend server.
- If API auth fails, clear browser local storage token/user and login again.
- For quick API health check:
  - `GET /api/health`

## License

For learning and internal project use.
