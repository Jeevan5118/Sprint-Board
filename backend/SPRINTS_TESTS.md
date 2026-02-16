# Sprints Module - Postman Tests

## Sprint Lifecycle
1. **Planned** → Created but not started
2. **Active** → Sprint is running (only 1 active sprint per project)
3. **Completed** → Sprint finished

---

## TEST 1: Create Sprint ✓

**POST** `http://localhost:5001/api/sprints`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Sprint 4",
  "goal": "Implement user dashboard and analytics",
  "project_id": 1,
  "start_date": "2024-03-01",
  "end_date": "2024-03-14"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Sprint created successfully",
  "data": {
    "sprint": {
      "id": 8,
      "name": "Sprint 4",
      "goal": "Implement user dashboard and analytics",
      "project_id": 1,
      "project_name": "E-Commerce Platform",
      "project_key": "ECP",
      "start_date": "2024-03-01",
      "end_date": "2024-03-14",
      "status": "planned"
    }
  }
}
```

---

## TEST 2: Get Sprints by Project ✓

**GET** `http://localhost:5001/api/sprints/project/1`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "sprints": [
      {
        "id": 3,
        "name": "Sprint 3",
        "goal": "Payment integration and checkout",
        "project_id": 1,
        "start_date": "2024-01-29",
        "end_date": "2024-02-11",
        "status": "active",
        "task_count": 4
      },
      {
        "id": 2,
        "name": "Sprint 2",
        "goal": "Product catalog and shopping cart",
        "project_id": 1,
        "start_date": "2024-01-15",
        "end_date": "2024-01-28",
        "status": "completed",
        "task_count": 3
      }
    ]
  }
}
```

---

## TEST 3: Get Sprint by ID ✓

**GET** `http://localhost:5001/api/sprints/3`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "sprint": {
      "id": 3,
      "name": "Sprint 3",
      "goal": "Payment integration and checkout",
      "project_id": 1,
      "project_name": "E-Commerce Platform",
      "project_key": "ECP",
      "start_date": "2024-01-29",
      "end_date": "2024-02-11",
      "status": "active"
    }
  }
}
```

---

## TEST 4: Start Sprint ✓

**PATCH** `http://localhost:5001/api/sprints/8/start`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Sprint started successfully",
  "data": {
    "sprint": {
      "id": 8,
      "name": "Sprint 4",
      "status": "active"
    }
  }
}
```

---

## TEST 5: Start Sprint (Already Has Active) ✓

Try to start another sprint when project already has an active sprint.

**PATCH** `http://localhost:5001/api/sprints/9/start`

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Project already has an active sprint. Complete it before starting a new one."
}
```

---

## TEST 6: Complete Sprint ✓

**PATCH** `http://localhost:5001/api/sprints/3/complete`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Sprint completed successfully",
  "data": {
    "sprint": {
      "id": 3,
      "name": "Sprint 3",
      "status": "completed"
    }
  }
}
```

---

## TEST 7: Access Other Team's Sprint (Should Fail) ✓

Team Alpha member tries to access Team Beta sprint.

**GET** `http://localhost:5001/api/sprints/5`

**Headers:**
```
Authorization: Bearer TEAM_ALPHA_MEMBER_TOKEN
```

**Expected Response (403):**
```json
{
  "success": false,
  "message": "Access denied. You are not a member of this project's team."
}
```

---

## Test Sequence

### 1. Create Sprint (Planned)
```
POST /api/sprints
Body: { name, goal, project_id, start_date, end_date }
Status: "planned"
```

### 2. View Sprints by Project
```
GET /api/sprints/project/1
See all sprints for project
```

### 3. Start Sprint
```
PATCH /api/sprints/8/start
Status changes: planned → active
```

### 4. Try Starting Another Sprint (Should Fail)
```
PATCH /api/sprints/9/start
Error: Only 1 active sprint allowed per project
```

### 5. Complete Sprint
```
PATCH /api/sprints/3/complete
Status changes: active → completed
```

### 6. Now Start Next Sprint
```
PATCH /api/sprints/9/start
Success: Previous sprint completed
```

---

## Sprint Status Flow

```
CREATE → planned
         ↓
      START → active
         ↓
     COMPLETE → completed
```

**Rules:**
- Only planned sprints can be started
- Only active sprints can be completed
- Only 1 active sprint per project
- Team-based access control applies

---

## Seed Data Sprints

- Sprint 1: E-Commerce (completed)
- Sprint 2: E-Commerce (completed)
- Sprint 3: E-Commerce (active)
- Sprint 4: Mobile Banking (active)
- Sprint 5: Cloud Infrastructure (completed)
- Sprint 6: Cloud Infrastructure (active)
- Sprint 7: API Gateway (planned)

---

## Notes
- Team members can manage sprints in their team's projects
- Admin can manage all sprints
- Sprint dates are validated
- Task count shows number of tasks in sprint
