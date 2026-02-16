# Projects Module - Postman Tests

## Team-Based Data Isolation
- Admin can create/delete projects and view all projects
- Members can only view projects from their teams
- Members cannot access projects from other teams

---

## TEST 1: Create Project (Admin Only) ✓

**POST** `http://localhost:5001/api/projects`

**Headers:**
```
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Mobile App Redesign",
  "key_code": "MAR",
  "description": "Complete redesign of mobile application",
  "team_id": 1,
  "start_date": "2024-03-01",
  "end_date": "2024-12-31"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "project": {
      "id": 5,
      "name": "Mobile App Redesign",
      "key_code": "MAR",
      "description": "Complete redesign of mobile application",
      "team_id": 1,
      "team_name": "Team Alpha",
      "created_by": 1,
      "created_by_name": "System Admin",
      "status": "active"
    }
  }
}
```

---

## TEST 2: Get All Projects (Admin) ✓

**GET** `http://localhost:5001/api/projects`

**Headers:**
```
Authorization: Bearer ADMIN_TOKEN
```

**Expected:** Admin sees ALL projects from all teams (4 from seed + newly created)

---

## TEST 3: Get All Projects (Team Member) ✓

**GET** `http://localhost:5001/api/projects`

**Headers:**
```
Authorization: Bearer MEMBER_TOKEN
```

**Expected:** Member sees ONLY projects from their team(s)

---

## TEST 4: Get Project by ID (Team Member - Own Team) ✓

**GET** `http://localhost:5001/api/projects/1`

**Headers:**
```
Authorization: Bearer MEMBER_TOKEN (Team Alpha member)
```

**Expected:** Success - Can view project from own team

---

## TEST 5: Get Project by ID (Team Member - Other Team) ✓

**GET** `http://localhost:5001/api/projects/3`

**Headers:**
```
Authorization: Bearer MEMBER_TOKEN (Team Alpha member trying to access Team Beta project)
```

**Expected Response (403):**
```json
{
  "success": false,
  "message": "Access denied. You are not a member of this project's team."
}
```

---

## TEST 6: Delete Project (Admin Only) ✓

**DELETE** `http://localhost:5001/api/projects/5`

**Headers:**
```
Authorization: Bearer ADMIN_TOKEN
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

## TEST 7: Delete Project (Member - Should Fail) ✓

**DELETE** `http://localhost:5001/api/projects/1`

**Headers:**
```
Authorization: Bearer MEMBER_TOKEN
```

**Expected Response (403):**
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions."
}
```

---

## TEST 8: Create Project with Duplicate Key Code ✓

**POST** `http://localhost:5001/api/projects`

**Headers:**
```
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Test Project",
  "key_code": "ECP",
  "team_id": 1
}
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Project key code already exists"
}
```

---

## Test Sequence

### Setup: Get Tokens

1. **Login as Admin:**
   ```
   POST /api/auth/login
   Body: { "email": "admin@scrumboard.com", "password": "admin123" }
   ```
   Save token as ADMIN_TOKEN

2. **Login as Team Alpha Member:**
   ```
   POST /api/auth/login
   Body: { "email": "bob.smith@scrumboard.com", "password": "password123" }
   ```
   Note: If password fails, register new member in Team Alpha
   Save token as MEMBER_TOKEN

### Test Flow:

1. **Admin creates project** for Team Alpha
2. **Admin views all projects** (sees all teams)
3. **Team Alpha member views projects** (sees only Team Alpha projects)
4. **Team Alpha member views own team project** (success)
5. **Team Alpha member tries to view Team Beta project** (403 error)
6. **Member tries to delete project** (403 error)
7. **Admin deletes project** (success)

---

## Seed Data Projects

From database seeds:
- Project 1: E-Commerce Platform (Team Alpha)
- Project 2: Mobile Banking App (Team Alpha)
- Project 3: Cloud Infrastructure (Team Beta)
- Project 4: API Gateway Service (Team Beta)

---

## Notes
- Admin can perform all operations
- Members can only view projects from their teams
- Project key_code must be unique
- Team-based data isolation is enforced
