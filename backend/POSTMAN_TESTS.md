# Postman API Testing Guide

## Base URL
```
http://localhost:5001/api
```

---

## 1. Health Check
**GET** `/health`

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-..."
}
```

---

## 2. Register User (Member)
**POST** `/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "john.doe@test.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "member"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 22,
      "email": "john.doe@test.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "member",
      "is_active": 1
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 3. Register Admin (Should Fail - Admin Already Exists)
**POST** `/auth/register`

**Body (JSON):**
```json
{
  "email": "admin2@test.com",
  "password": "password123",
  "first_name": "Admin",
  "last_name": "Two",
  "role": "admin"
}
```

**Response (403):**
```json
{
  "success": false,
  "message": "Admin already exists. Only one admin allowed in the system."
}
```

---

## 4. Login
**POST** `/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "admin@scrumboard.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@scrumboard.com",
      "first_name": "System",
      "last_name": "Admin",
      "role": "admin",
      "is_active": 1
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 5. Get Profile (Protected Route)
**GET** `/auth/profile`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@scrumboard.com",
      "first_name": "System",
      "last_name": "Admin",
      "role": "admin",
      "is_active": 1
    }
  }
}
```

---

## 6. Get Profile Without Token (Should Fail)
**GET** `/auth/profile`

**No Authorization Header**

**Response (401):**
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

---

## Test Sequence

### Step 1: Health Check
```
GET http://localhost:5001/api/health
```

### Step 2: Login as Admin (from seed data)
```
POST http://localhost:5001/api/auth/login
Body:
{
  "email": "admin@scrumboard.com",
  "password": "password123"
}
```
**Note:** Password in seed data is hashed. You need to update it first or use the actual password.

### Step 3: Register New User
```
POST http://localhost:5001/api/auth/register
Body:
{
  "email": "test@test.com",
  "password": "test123",
  "first_name": "Test",
  "last_name": "User",
  "role": "member"
}
```

### Step 4: Login with New User
```
POST http://localhost:5001/api/auth/login
Body:
{
  "email": "test@test.com",
  "password": "test123"
}
```
**Copy the token from response**

### Step 5: Get Profile
```
GET http://localhost:5001/api/auth/profile
Headers:
Authorization: Bearer YOUR_TOKEN_HERE
```

### Step 6: Try to Register Another Admin (Should Fail)
```
POST http://localhost:5001/api/auth/register
Body:
{
  "email": "admin2@test.com",
  "password": "admin123",
  "first_name": "Admin",
  "last_name": "Two",
  "role": "admin"
}
```

---

## Validation Tests

### Invalid Email
```json
{
  "email": "invalid-email",
  "password": "test123",
  "first_name": "Test",
  "last_name": "User"
}
```
**Response (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Valid email is required",
      "param": "email"
    }
  ]
}
```

### Short Password
```json
{
  "email": "test@test.com",
  "password": "123",
  "first_name": "Test",
  "last_name": "User"
}
```
**Response (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Password must be at least 6 characters",
      "param": "password"
    }
  ]
}
```

---

## Notes
- The seed data has hashed passwords. To test login with seed users, you need to know the original password or create new users.
- Save the token after login to use in protected routes.
- Token expires in 7 days (configured in .env).
