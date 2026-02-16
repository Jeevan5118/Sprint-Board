# Teams Module - Postman Tests

## Prerequisites
- Login as Admin and get token
- Use token in all requests: `Authorization: Bearer YOUR_ADMIN_TOKEN`

---

## TEST 1: Create Team ✓

**POST** `http://localhost:5001/api/teams`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Team Gamma",
  "description": "QA and Testing Team",
  "team_lead_id": 3
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Team created successfully",
  "data": {
    "team": {
      "id": 3,
      "name": "Team Gamma",
      "description": "QA and Testing Team",
      "team_lead_id": 3,
      "team_lead_name": "Carol Williams",
      "team_lead_email": "carol.williams@scrumboard.com"
    }
  }
}
```

---

## TEST 2: Get All Teams ✓

**GET** `http://localhost:5001/api/teams`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "teams": [
      {
        "id": 1,
        "name": "Team Alpha",
        "description": "Frontend and Mobile Development Team",
        "team_lead_id": 2,
        "team_lead_name": "Alice Johnson",
        "member_count": 10
      },
      {
        "id": 2,
        "name": "Team Beta",
        "description": "Backend and Infrastructure Team",
        "team_lead_id": 12,
        "team_lead_name": "Kate Thomas",
        "member_count": 10
      }
    ]
  }
}
```

---

## TEST 3: Get Team by ID ✓

**GET** `http://localhost:5001/api/teams/1`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "team": {
      "id": 1,
      "name": "Team Alpha",
      "description": "Frontend and Mobile Development Team",
      "team_lead_id": 2,
      "team_lead_name": "Alice Johnson",
      "team_lead_email": "alice.johnson@scrumboard.com",
      "members": [
        {
          "id": 2,
          "email": "alice.johnson@scrumboard.com",
          "first_name": "Alice",
          "last_name": "Johnson",
          "role": "team_lead"
        },
        ...
      ]
    }
  }
}
```

---

## TEST 4: Add Member to Team ✓

**POST** `http://localhost:5001/api/teams/1/members`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "user_id": 22
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Member added to team successfully",
  "data": {
    "team": { ... }
  }
}
```

---

## TEST 5: Remove Member from Team ✓

**DELETE** `http://localhost:5001/api/teams/1/members/22`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Member removed from team successfully",
  "data": {
    "team": { ... }
  }
}
```

---

## TEST 6: Access as Member (Should Fail) ✓

**GET** `http://localhost:5001/api/teams`

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

## Test Sequence

1. **Login as Admin:**
   ```
   POST http://localhost:5001/api/auth/login
   Body: { "email": "admin@scrumboard.com", "password": "password123" }
   ```
   Note: If seed password doesn't work, register a new admin or update password.

2. **Copy admin token** from login response

3. **Create a new team**

4. **Get all teams**

5. **Get specific team with members**

6. **Add a member to team**

7. **Remove member from team**

8. **Login as member and try to access teams (should fail)**

---

## Error Cases

### Invalid Team Lead
```json
{
  "name": "Test Team",
  "team_lead_id": 9999
}
```
**Response (404):** Team lead not found

### Duplicate Member
Add same user twice
**Response (400):** User is already a team member

### Team Not Found
```
GET /api/teams/9999
```
**Response (404):** Team not found
