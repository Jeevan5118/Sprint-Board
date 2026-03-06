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

- Authentication with JWT (`admin`, `team_lead`, and `member` roles)
- Team-based access control across projects, sprints, and tasks
- Sprint board with drag-and-drop task movement
- Timeline roadmap page with project/sprint planning view (`/timeline`)
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
- Each team has a single `team_lead` (`teams.team_lead_id`).
- `team_lead` can manage projects, sprints, tasks, comments, and team members for their own team only.
- `member` can access data only for teams they belong to.
- `admin` can create, edit, assign, and delete issues on Sprint Board.
- `member` can move issues (drag/drop), update status/story points, and add comments/links/attachments.
- Scope difference: `admin` can do this across all accessible projects; `member` only within their own team projects.
- Members now see only their own teams in Teams screen (`/api/teams/my`).
- Members can read team members for their own team (`/api/teams/:id/members`), but not other teams.

## Current Implemented Features (Verified)

> This section reflects the current behavior implemented in code.

### Platform Features
- JWT authentication with protected routes and logout/session clearing.
- Role-based access with `admin`, `team_lead`, and `member`.
- Team-based data scoping across teams, projects, sprints, tasks, and comments.
- Sprint board with drag-and-drop task movement across backlog and workflow columns.
- Timeline roadmap page with project/sprint ranges, filters, and zoom controls.
- Task detail drawer with full issue editing (role-scoped), assignee management, story points, comments, links, and attachments.
- Dashboard endpoints and UI for user/team/project/sprint summaries.
- Assignment notifications with unread list and mark-read/mark-all-read.
- Validation middleware, centralized error handling, CORS, Helmet, and request logging.
- MySQL schema + seed + migration support and CI build/authz checks.

### Role Capability Matrix (Current)

| Capability | Admin | Team Lead | Member |
|---|---|---|---|
| Login / Logout | Yes | Yes | Yes |
| Register | No (provisioned) | No | Yes |
| View Teams | All | Own teams | Own teams |
| Create Team | Yes | No | No |
| Set Team Lead (existing team) | Yes | No | No |
| Add Members | Yes | Yes (own team only) | No |
| Remove Members | Yes | Yes (own team only) | No |
| View Projects | All | Team-scoped | Team-scoped |
| Create Project | Yes | Yes (own team only) | No |
| Delete Project | Yes | Yes (own team only) | No |
| Create Sprint | Yes | Yes (own team project only) | No |
| Start/Complete Sprint | Yes | Yes (own team project only) | No |
| Open Sprint Board | Yes | Yes (team-scoped) | Yes (team-scoped) |
| Create Task | Yes | Yes (own team project only) | No |
| Edit Full Task Fields | Yes | Yes (own team project only) | No |
| Move Task / Update Status | Yes | Yes | Yes (team-scoped) |
| Delete Task | Yes | Yes (own team project only) | No |
| Add Comment / Link / Attachment | Yes | Yes | Yes (team-scoped) |
| Delete Any Comment | Yes | Yes (own team project only) | No |
| Delete Own Comment | Yes | Yes | Yes |
| Access `GET /api/auth/users` | Yes | No | No |
| Assignment Notifications | Optional | Yes | Yes |

## Admin vs Team Lead vs Member Quick Sheet

### Admin
- Login/logout.
- View all teams, projects, sprints, tasks.
- Create teams, add/remove members.
- Create/delete projects.
- Create/start/complete sprints.
- Create issues.
- Edit full issue fields (title, description, type, priority, due date, status, assignee, story points).
- Move issues using drag/drop.
- Delete issues.
- Add comments, delete any comment.
- Add links and attachments.
- Access `GET /api/auth/users`.

### Team Lead
- View only projects/boards in teams they belong to.
- Manage only teams where they are assigned as `team_lead_id`.
- Can create/delete projects in their own team.
- Can create/start/complete sprints in their own team projects.
- Can create/edit/delete tasks in their own team projects.
- Can update assignees and full issue fields in their own team projects.
- Can add/remove members in their own team.
- Can delete any comment in their own team projects.

### Member
- Register/login/logout.
- No team selection at registration.
- Sees data only after admin adds member to a team.
- View only own teams, team projects, team sprints, team tasks.
- Open sprint board for accessible projects.
- Move issues using drag/drop.
- Update status and story points.
- Add comments, delete only own comments.
- Add links and attachments.
- Cannot create issue.
- Cannot delete issue.
- Cannot edit full issue fields (title/description/type/priority/due date/assignee).
- Receives assignment notifications in navbar.

## Application Structure and Flow

### Main Navigation (After Login)
- `Dashboard` (`/`)
- `Projects` (`/projects`)
- `Timeline` (`/timeline`)
- `Teams` (`/teams`)
- `Sprint Board` (`/projects/:projectId/sprints/:sprintId/board`)

### Authentication Flow
1. User opens `Login` or `Register`.
2. On success, JWT token and user data are stored.
3. User is redirected to `Dashboard`.
4. All protected routes require valid login.
5. On logout, token/user are cleared and user returns to login.

### Timeline Module (`/timeline`)
- Jira-style roadmap view across projects and their sprints.
- Uses existing project/sprint APIs and team-based access control.
- Shows project rows with sprint bars plotted by start/end dates.
- Supports:
  - search (project/sprint)
  - project filter
  - sprint status filter (`planned`, `active`, `completed`, `cancelled`)
  - zoom levels (`week`, `month`, `quarter`)
  - current-day marker for execution context

## Role-Based Capabilities

### Admin End-to-End Flow
1. Login -> Dashboard.
2. `Teams`:
- View all teams.
- Create team.
- View members of any team.
- Add/remove members.
3. `Projects`:
- View all projects.
- Create project.
- Open project details.
- Delete project.
4. `Project Details`:
- Create sprint.
- Start sprint.
- Complete sprint.
- Open sprint board.
5. `Sprint Board`:
- Create issue.
- Drag/drop tasks between backlog and workflow columns.
- Open issue details.
6. `Issue Details`:
- Edit issue fields.
- Change assignee.
- Update story points.
- Add/delete comments.
- Add links.
- Upload attachments.
- Delete issue.

### Team Lead End-to-End Flow
1. Login -> Dashboard.
2. `Teams`:
- View own teams.
- Manage members only in teams where user is assigned as `team_lead_id`.
3. `Projects`:
- View team-scoped projects.
- Create project only for own team.
- Delete project only for own team.
4. `Project Details`:
- Create sprint in own team projects.
- Start/complete sprint in own team projects.
- Open sprint board.
5. `Sprint Board`:
- Create issue.
- Drag/drop tasks and move between backlog/workflow.
- Open issue details.
6. `Issue Details`:
- Edit full issue fields in own team projects.
- Change assignee.
- Update story points.
- Add/delete comments.
- Add links and upload attachments.
- Delete issue.
7. `Timeline`:
- View roadmap timeline for team-scoped projects and sprints.

### Member End-to-End Flow
1. Register/Login -> Dashboard.
2. `Teams`:
- See only own teams.
- View members only for own teams.
3. `Projects`:
- See only projects of teams they belong to.
- Open project details.
4. `Project Details`:
- View sprints.
- Open sprint board.
5. `Sprint Board`:
- Move issues (drag/drop).
- Update status and story points.
- Search and filter "Only my issues".
6. `Issue Details`:
- View issue fields.
- Update story points.
- Add comments.
- Delete own comments.
- Add links and attachments.
- Cannot create/delete issue or edit full issue fields.
7. `Notifications`:
- When assigned a task, member sees unread notification in navbar.
- Can mark single or all notifications as read.

### Capability Matrix

| Category | Admin | Team Lead | Member |
|---|---|---|---|
| Login/Logout | Yes | Yes | Yes |
| Register | No (admin is provisioned) | No | Yes (member only) |
| Dashboard | Yes | Yes | Yes |
| View teams | All teams | Own teams | Own teams only |
| Create team | Yes | No | No |
| Set team lead (existing team) | Yes | No | No |
| Add members | Yes | Yes (own team only) | No |
| Remove members | Yes | Yes (own team only) | No |
| View projects | All projects | Team-scoped | Team-scoped |
| Create/delete project | Yes | Yes (own team only) | No |
| View project details | Yes | Yes (team-scoped) | Yes (team-scoped) |
| Create sprint | Yes | Yes (own team projects) | No |
| Start/complete sprint | Yes | Yes (own team projects) | No |
| Open sprint board | Yes | Yes (team-scoped) | Yes (team-scoped) |
| Create tasks | Yes | Yes (own team projects) | No |
| Update tasks | Yes (full) | Yes (full in own team projects) | Limited (`status`, `story_points`, sprint movement) |
| Delete tasks | Yes | Yes (own team projects) | No |
| Move task status (drag/drop) | Yes | Yes | Yes |
| Assign/reassign task | Yes | Yes (own team projects) | No |
| Add comments | Yes | Yes | Yes |
| Delete comments | Any comment | Any comment (own team projects) | Own comments only |
| Add links/attachments | Yes | Yes | Yes |
| Timeline access (`/timeline`) | Yes | Yes (team-scoped) | Yes (team-scoped) |
| Assignment notifications | Optional | Shown in navbar | Shown in navbar |

## Complete Functionalities (Detailed, With Duplicates Kept Intentionally)

> Note: This section contains detailed legacy breakdowns and may duplicate items.
> The canonical up-to-date capability list is in:
> - `Current Implemented Features (Verified)`
> - `Role Capability Matrix (Current)`
> - `Capability Matrix` (above)

### 1. Authentication Module

#### Admin
- Open Login page.
- Admin account is provisioned by seed/manual setup.
- Login with email and password.
- JWT token is generated after successful login.
- User data + token are stored in local storage.
- Access protected routes after login.
- Auto-redirect to login on unauthorized token/session.
- Logout from navbar.

#### Member
- Open Login page.
- Open Register page.
- Register account as `member` only.
- Team is not selected in registration.
- Until admin adds member to a team, member cannot access team/project/sprint data.
- Login with email and password.
- JWT token is generated after successful login.
- User data + token are stored in local storage.
- Access protected routes after login.
- Auto-redirect to login on unauthorized token/session.
- Logout from navbar.

### 2. Dashboard Module

#### Admin
- View dashboard summary cards:
  - Total Tasks
  - Completed
  - Pending
  - Progress %
- Click Progress card to open pie chart popup.
- Click Total/Completed/Pending cards to open category-wise detail modal.
- View team-wise and project-wise progress table.
- View project done/pending/total and progress bar details.

#### Member
- View dashboard summary cards:
  - Total Tasks
  - Completed
  - Pending
  - Progress %
- Click Progress card to open pie chart popup.
- Click Total/Completed/Pending cards to open category-wise detail modal.
- View team-wise and project-wise progress table.
- View project done/pending/total and progress bar details.

### 3. Teams Module

#### Admin
- View all teams.
- Search teams.
- Pagination in teams list.
- Create team.
- Expand team row to view team members.
- Add member to team.
- Remove member from team.
- View member details (name, email, role visuals).

#### Member
- View only own teams (`/api/teams/my`).
- Search teams.
- Pagination in teams list.
- Expand team row to view team members.
- View member details (name, email, role visuals).
- Cannot create team.
- Cannot add/remove members.

### 4. Projects Module

#### Admin
- View all projects.
- Search projects.
- Pagination in projects table.
- Create project with:
  - Name
  - Key
  - Description
  - Team
  - Start date
  - End date
- Project key validation.
- Date validation.
- Open project details.
- Delete project.

#### Member
- View only team-based accessible projects.
- Search projects.
- Pagination in projects table.
- Open project details.
- Cannot create project.
- Cannot delete project.

### 5. Project Details + Sprint Lifecycle

#### Admin
- View project header, key, description, duration, status, sprint count.
- View all sprints in project timeline.
- Create sprint.
- Start planned sprint.
- Complete active sprint.
- Open sprint board from sprint row.

#### Member
- View project header, key, description, duration, status, sprint count.
- View all sprints in project timeline.
- Open sprint board from sprint row.
- Sprint create/start/complete actions are hidden in UI.

### 6. Sprint Board Module

#### Admin
- Open sprint board for a project sprint.
- View columns:
  - Backlog
  - To Do
  - In Progress
  - Review
  - Done
- Create issue from top button or quick-create in a column.
- Drag and drop tasks:
  - Backlog -> board
  - board -> board
  - board -> backlog
- Search tasks by title/key.
- Toggle "Only my issues".
- Open issue detail drawer.
- See task assignee avatars, story points, priority/type indicators.

#### Member
- Open sprint board for accessible project sprint.
- View columns:
  - Backlog
  - To Do
  - In Progress
  - Review
  - Done
- Drag and drop tasks:
  - Backlog -> board
  - board -> board
  - board -> backlog
- Search tasks by title/key.
- Toggle "Only my issues".
- Open issue detail drawer.
- See task assignee avatars, story points, priority/type indicators.

### 7. Issue Creation Module

#### Admin
- Create issue with:
  - Summary (title)
  - Description
  - Type
  - Priority
  - Assignee
  - Story points
  - Due date
- Validate required title.
- Validate non-negative story points.
- Validate due date not in past.
- Auto-generate task key if not provided.
- Assignee must belong to project team.

#### Member
- Create issue is not allowed for member.

### 8. Issue Detail Drawer Module

#### Admin
- Open task detail drawer.
- View task key/title/description.
- Edit issue fields:
  - Title
  - Description
  - Type
  - Priority
  - Status
  - Due date
- Change assignee (including unassign).
- Update story points.
- View comments list.
- Add comment.
- Delete any comment.
- View attachments.
- Upload attachment (type/size checked in UI).
- View links.
- Add link.
- Delete task.

#### Member
- Open task detail drawer.
- View task key/title/description.
- Cannot edit full issue fields.
- Cannot change assignee.
- Update story points.
- Update status (including drag/drop on board).
- View comments list.
- Add comment.
- Delete own comment only.
- View attachments.
- Upload attachment (type/size checked in UI).
- View links.
- Add link.
- Cannot delete task.

### 9. Notification Module (Task Assignment)

#### Admin
- Assignment notification is created when task is assigned/reassigned to a user.
- Admin navbar currently does not show member notification dropdown.

#### Member
- When a task is assigned to the member, unread notification appears in navbar.
- Notification count badge displayed.
- Open notification panel.
- View assigned-task notifications with timestamp.
- Mark single notification as read.
- Mark all notifications as read.

### 10. Access Control and Security Behavior

#### Admin
- Full cross-team visibility/access for core modules.
- Can manage teams/projects/sprint lifecycle.
- Can fetch all users (admin endpoint).
- Can delete any comment.

#### Member
- Team-based access enforced for projects, sprints, tasks, comments, dashboard.
- Can only view teams they belong to.
- Can only view team members of own teams.
- Cannot use admin-only team/project lifecycle actions.
- Cannot create/delete tasks.
- Cannot update task title/description/type/priority/assignee/due date.
- Cannot delete others' comments.

### 11. API Groups (Functional Summary)

#### Auth
- Register
- Login
- Profile
- All users (admin)

#### Teams
- My teams
- Team members (team-scoped for member)
- Team member assigned tasks (`/api/teams/:id/members/:userId/tasks`)
- Available members not in any team (`/api/teams/available-members/list`, admin)
- Create team (admin)
- Add/remove member (admin)

#### Projects
- List projects (team filtered for member)
- Get project details
- Create project (admin)
- Delete project (admin)

#### Sprints
- Create sprint
- Get sprints by project
- Get sprint by id
- Start sprint
- Complete sprint

#### Tasks
- Get by project
- Get by sprint
- Get by id
- Create task (admin)
- Update task (admin full, member limited)
- Update task status
- Delete task (admin)
- Add links
- Add attachments

#### Comments
- Add comment
- Get task comments
- Delete comment

#### Dashboard
- User dashboard
- Sprint dashboard
- Project dashboard
- Team dashboard
- Team-project progress

#### Notifications
- Get unread notifications
- Mark one as read
- Mark all as read

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
  - You can override via env: `REACT_APP_API_URL`
  - Example in `frontend/.env`:
    - `REACT_APP_API_URL=http://localhost:5001/api`

## Smoke Tests

- Frontend smoke flow:
```bash
cd frontend
npm run test:smoke
```

- Backend smoke flow:
```bash
cd backend
npm run test:smoke
```

## CI and Release Process

### CI Workflow
- GitHub Actions workflow: `.github/workflows/ci.yml`
- Runs on push/PR to `main`/`master`
- Validates:
  - backend install + DB setup + migrations
  - backend auth/authorization checks (`npm run test:authz`)
  - frontend production build (`npm run build`)

### Run CI-Equivalent Checks Locally (Before Deployment)

1. Backend checks:
```bash
cd backend
npm ci
npm run migrate
npm run test:authz
```

2. Frontend checks:
```bash
cd frontend
npm ci
npm run build
```

### Production Readiness Documents
- Release checklist: `docs/PROD_RELEASE_CHECKLIST.md`
- Rollback SOP: `docs/ROLLBACK_SOP.md`

## Main API Groups

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/users` (admin)

### Teams
- `GET /api/teams/my` (authenticated, returns only user's teams)
- `GET /api/teams/:id/members` (authenticated, restricted by team membership for members)
- `GET /api/teams/:id/members/:userId/tasks` (team member assigned tasks)
- `GET /api/teams/available-members/list` (admin)
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
- `POST /api/tasks` (admin)
- `PUT /api/tasks/:id` (admin full, member limited)
- `PATCH /api/tasks/:id/status`
- `DELETE /api/tasks/:id` (admin)
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
