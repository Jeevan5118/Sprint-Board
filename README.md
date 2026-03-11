# SprintBoard

Enterprise Agile project management platform with Scrum + Kanban support, team-scoped RBAC, task collaboration, notifications, attachments, and analytics.

## 1. What This Project Is
SprintBoard is a full-stack web application for managing teams, projects, sprints, and tasks.

- Frontend: React (CRA), React Router, Axios, Tailwind CSS
- Backend: Node.js, Express, MySQL
- Auth: JWT
- Roles: `admin`, `team_lead`, `member`
- Access model: team-scoped authorization

## 2. Repository Structure

- `frontend/` - React UI
- `backend/` - Express API + business logic + DB access
- `backend/database/` - schema and seed SQL
- `backend/migrations/` - migration files
- `api/[...all].js` - Vercel serverless entry for backend
- `.github/workflows/` - CI workflows
- `e2e/` + `playwright.config.js` - Playwright automation

## 3. Main Features Implemented

### Core Platform
- JWT authentication and protected routes
- Role-based authorization (`admin`, `team_lead`, `member`)
- Team-scoped data access across projects/sprints/tasks/comments
- Dashboard metrics and team/project progress summaries
- Notifications for task assignment events
- File attachments for tasks (Cloudinary-backed support)

### Team Management
- Create, edit, and delete teams (admin)
- Add/remove team members
- Set/remove one team lead per team
- Team lead assignment is done **after** team creation

### Project Management
- Create/list/view/delete projects
- Project grouping by team in admin projects view
- Project board mode support via `board_type` (`scrum` / `kanban`)
- Project details page with sprint lifecycle + Kanban entry

### Scrum
- Sprint creation/start/complete
- Sprint board with columns and drag/drop status movement
- Task creation and issue details drawer
- Task comments, links, attachments

### Kanban
- Dedicated route: `/projects/:projectId/kanban`
- Only valid for projects configured as Kanban
- WIP limit enforcement with transactional checks
- Status history tracking for workflow analytics
- Kanban analytics endpoint for lead/cycle/throughput metrics

### Time Logging
- Add/list/delete time logs per task
- RBAC deletion rules enforced (owner/admin/team_lead in scope)

### Admin CSV Import
- Admin-only bulk CSV import endpoint
- Supports employees, teams, projects, and team_members import types
- Employee import can auto-create missing teams/projects and map users

## 4. Role Access Matrix

| Capability | Admin | Team Lead | Member |
|---|---|---|---|
| Login / Logout | Yes | Yes | Yes |
| Update own email/password | Yes | Yes | Yes |
| Create user accounts | Yes | No | No |
| Create/Edit/Delete teams | Yes | No | No |
| Set/Remove team lead | Yes | No | No |
| Add/Remove team members | Yes | Yes (own managed team scope) | No |
| Create/Delete projects | Yes | Yes (team scope) | No |
| Create/Start/Complete sprints | Yes | Yes (team scope) | No |
| Use Sprint Board | Yes | Yes | Yes (scope-limited) |
| Create tasks | Yes | Yes (scope-limited) | No |
| Move tasks (drag/drop) | Yes | Yes | Yes (scope-limited) |
| View/Use Kanban board | Yes | Yes | Yes (scope-limited, kanban projects only) |
| Use CSV import | Yes | No | No |

## 5. User Manual (How To Use)

## 5.1 Login
1. Open the app URL.
2. Go to `Login`.
3. Enter your email and password.
4. On success, you are redirected to Dashboard.

Notes:
- Account creation is controlled by admin (no open public signup flow).
- If token expires, app redirects to login automatically.

## 5.2 Dashboard
- View total/completed/pending/progress cards.
- View team/project progress tables.
- Use sidebar links to navigate to Projects, Timeline, Teams, Sprint Board, and Kanban Board.

## 5.3 Teams
Admin can:
1. Open `Teams`.
2. Create a new team (without selecting lead during creation).
3. Add members to the team.
4. Set one member as team lead using team member actions.
5. Remove lead and assign another lead when needed.
6. Edit team name/description.
7. Delete team when required.

Team lead can:
- Manage members for allowed team scope.

Member can:
- View only their own team data.

## 5.4 Projects
1. Open `Projects`.
2. Admin/team lead can create new projects.
3. Fill project name, key, team, dates, description.
4. Open a project row to go to Project Details.

In Project Details:
- Create sprints
- Start/complete sprints
- Open Sprint Board
- Open Kanban Board (`Open Kanban Board` button)

## 5.5 Scrum Board Workflow
Route format:
- `/projects/:projectId/sprints/:sprintId/board`

Typical flow:
1. Create sprint and start sprint.
2. Create task/issue in sprint board.
3. Open issue details drawer to update assignee, points, comments, links, attachments.
4. Drag and drop cards across columns.
5. Complete sprint when done.

## 5.6 Kanban Board Workflow
Route format:
- `/projects/:projectId/kanban`

How it works:
1. Project must be Kanban board type.
2. Open Kanban from Project Details.
3. Move tasks across columns via drag/drop.
4. WIP limits are validated by backend.
5. If limit exceeded, move is blocked and error is returned.

## 5.7 Timeline
- Open `Timeline` from sidebar.
- View sprint/project timeline with color-coded status.
- Click a sprint item to open sprint details/board (as configured in UI).

## 5.8 Account Page
Route:
- `/account`

All users can:
- Change their own email
- Change their own password (current password required)

Admin additionally sees:
- `Create Employee Account` form
- Fields: member name, email, password, team, role

## 5.9 CSV Import (Admin)
Location:
- Projects page -> `Import CSV`

Endpoint:
- `POST /api/admin/import/csv`

Upload form fields:
- `import_type`: `employees` | `teams` | `projects` | `team_members`
- `file`: CSV file

### Recommended Employee CSV format
```csv
name,email,password,team,projects,role
John Doe,john@example.com,Password@123,Team A,"Project One;Project Two",member
```

Behavior for `employees` import:
- Creates user if not existing
- Adds user to team
- Creates team if missing
- Creates listed projects for team if missing
- Adds user to project membership
- Supports `role` (`member` default, `team_lead` optional)

## 6. API Overview (High-Level)

### Health
- `GET /api/health`

### Auth
- `POST /api/auth/login`
- `GET /api/auth/profile`
- `PATCH /api/auth/profile`
- `POST /api/auth/users` (admin create user)
- `GET /api/auth/users` (admin)

### Teams
- `GET /api/teams`
- `GET /api/teams/my`
- `GET /api/teams/:id`
- `GET /api/teams/:id/members`
- `POST /api/teams` (admin)
- `PATCH /api/teams/:id` (admin)
- `DELETE /api/teams/:id` (admin)
- `POST /api/teams/:id/members`
- `DELETE /api/teams/:id/members/:userId`
- `PATCH /api/teams/:id/lead` (admin)
- `DELETE /api/teams/:id/lead` (admin)

### Projects / Sprints / Tasks
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `DELETE /api/projects/:id`
- `GET /api/sprints/project/:projectId`
- `POST /api/sprints`
- `PATCH /api/sprints/:id/start`
- `PATCH /api/sprints/:id/complete`
- `GET /api/tasks/sprint/:sprintId`
- `PUT /api/tasks/:id`
- `PATCH /api/tasks/:id/status`

### Kanban / Analytics / Time Logs
- `GET /api/kanban/:projectId`
- `GET /api/analytics/kanban/:projectId`
- `POST /api/tasks/:id/time-logs`
- `GET /api/tasks/:id/time-logs`
- `DELETE /api/time-logs/:id`

## 7. Local Setup

## 7.1 Prerequisites
- Node.js 18+
- npm
- MySQL 8+

## 7.2 Backend
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=scrum_board
JWT_SECRET=your_long_random_secret
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000

# Optional Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Load schema and seed:
```bash
# from project root in PowerShell
Get-Content .\backend\database\schema.sql | mysql -h localhost -P 3306 -u root -p scrum_board
Get-Content .\backend\database\seeds.sql | mysql -h localhost -P 3306 -u root -p scrum_board
```

Run backend:
```bash
cd backend
npm run dev
```

## 7.3 Frontend
```bash
cd frontend
npm install
npm start
```

Frontend default URL:
- `http://localhost:3000`

API base config:
- `frontend/src/services/api.js`
- defaults to `/api` when `REACT_APP_API_URL` is not set

For local separate backend, create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5001/api
```

## 8. Deployment (Vercel + MySQL + Cloudinary)

## 8.1 Current Deployment Pattern
- Frontend deployed on Vercel static build (`frontend/build`)
- Backend served through Vercel serverless route `/api/[...all].js` -> `backend/src/app`
- MySQL hosted externally (for example Railway/Aiven/PlanetScale)

## 8.2 Required Environment Variables in Vercel
Set in Vercel Project -> Settings -> Environment Variables:

```env
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
JWT_SECRET=
CLIENT_URL=https://your-vercel-domain
CORS_ALLOWED_ORIGINS=https://your-vercel-domain

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Important:
- Use public DB host/port from your cloud DB provider.
- Do not use internal-only hostnames in Vercel.
- `JWT_SECRET` should be long/random (32+ chars).

## 8.3 Build Settings (if asked manually)
- Root directory: `./`
- Install command: `npm --prefix backend install && npm --prefix frontend install --include=dev`
- Build command: `npm --prefix frontend run build`
- Output directory: `frontend/build`

## 9. Test Commands

### Backend checks
```bash
cd backend
npm run test:smoke
npm run test:authz
npm run test:dnd-roles
```

### Frontend smoke
```bash
cd frontend
npm run test:smoke
```

### Playwright E2E
```bash
npm install
npx playwright install
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:report
```

## 10. Common Troubleshooting

### 1) `react-scripts: command not found` in Vercel
- Ensure frontend dev dependencies are installed:
  - `npm --prefix frontend install --include=dev`

### 2) `npm ci` lockfile mismatch
- Run `npm install` in affected workspace and commit updated `package-lock.json`.

### 3) Cannot login on deployed app but local works
- Deployed DB likely has different data.
- Seed/import your users into cloud DB.
- Verify Vercel env vars point to correct DB.

### 4) PowerShell `<` redirection errors with mysql
Use pipeline style in PowerShell:
```powershell
Get-Content .\backend\database\schema.sql | mysql -h <host> -P <port> -u <user> -p <db>
```

### 5) `Unknown MySQL server host 'mysql.railway.internal'`
- That host is internal/private.
- Use public host from provider connection details.

### 6) Kanban route not working
- Confirm project `board_type = 'kanban'`.
- Open Kanban from Project Details: `Open Kanban Board`.

## 11. Security Notes
- Keep `JWT_SECRET`, DB credentials, and Cloudinary secret only in environment variables.
- Never commit `.env` to git.
- Restrict CORS to your production domains.

## 12. License
Internal / educational use unless you add your own license file.
