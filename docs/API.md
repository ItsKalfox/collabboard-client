# CollabBoard API Documentation

This document defines the REST API contract for the CollabBoard backend.

The API is built using **Node.js** and **Express.js** and provides authentication, project management, task management, and other services required by the CollabBoard application.

> **Status:** This document is updated as new API endpoints are implemented.

---

## Table of Contents

* [Base URL](#base-url)
* [API Conventions](#api-conventions)
* [HTTP Status Codes](#http-status-codes)
* [Authentication](#authentication)
* [Authentication Endpoints](#authentication-endpoints)

  * [Register](#1-register)
  * [Login](#2-login)
  * [Get Current User](#3-get-current-user)
  * [Forgot Password](#4-forgot-password)
  * [Reset Password](#5-reset-password)
* [Project Endpoints](#project-endpoints)

  * [Get All Projects](#1-get-all-projects)
  * [Get Project by ID](#2-get-project-by-id)
  * [Create Project](#3-create-project)
  * [Update Project](#4-update-project)
  * [Delete Project](#5-delete-project)
* [Error Handling](#error-handling)
* [Testing with Bruno](#testing-with-bruno)
* [API Development Status](#api-development-status)

---

# Base URL

During local development, the backend API is available at:

```text
http://localhost:5000/api
```

All API endpoints described in this document are relative to this base URL.

For example:

```text
GET http://localhost:5000/api/auth/me
```

---

# API Conventions

## Content Type

Requests containing a request body should use:

```http
Content-Type: application/json
```

Example:

```http
Content-Type: application/json
```

---

## Request Format

JSON is used for request and response bodies.

Example:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

---

## Response Format

Successful responses generally return JSON.

Example:

```json
{
  "message": "Operation successful",
  "data": {}
}
```

Error responses return a message describing the problem.

Example:

```json
{
  "message": "Invalid credentials"
}
```

---

# HTTP Status Codes

The API uses standard HTTP status codes.

| Status Code                 | Meaning                                          |
| --------------------------- | ------------------------------------------------ |
| `200 OK`                    | Request completed successfully                   |
| `201 Created`               | Resource successfully created                    |
| `204 No Content`            | Request successful with no response body         |
| `400 Bad Request`           | Invalid request data                             |
| `401 Unauthorized`          | Authentication required or authentication failed |
| `403 Forbidden`             | Authenticated user does not have permission      |
| `404 Not Found`             | Requested resource does not exist                |
| `409 Conflict`              | Request conflicts with existing data             |
| `500 Internal Server Error` | Unexpected server error                          |

---

# Authentication

CollabBoard uses **JSON Web Tokens (JWT)** for API authentication.

Authentication consists of:

```text
Register
   ↓
Login
   ↓
JWT Token
   ↓
Authenticated Request
   ↓
JWT Middleware
   ↓
Protected Endpoint
```

---

## Authentication Header

Protected endpoints require a JWT in the `Authorization` header.

Format:

```http
Authorization: Bearer <JWT_TOKEN>
```

Example:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## JWT Payload

The JWT should contain only the information required to identify the authenticated user.

Example payload:

```json
{
  "userId": "user-id"
}
```

Sensitive information such as passwords should **never** be stored inside the JWT payload.

---

# Authentication Endpoints

## 1. Register

Creates a new user account.

### Endpoint

```http
POST /auth/register
```

### Full URL

```text
http://localhost:5000/api/auth/register
```

### Authentication

Not required.

### Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Request Parameters

| Field      | Type   | Required | Description          |
| ---------- | ------ | -------- | -------------------- |
| `name`     | String | Yes      | User's display name  |
| `email`    | String | Yes      | User's email address |
| `password` | String | Yes      | User's password      |

### Successful Response

**Status:** `201 Created`

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "1",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Error — Missing Fields

**Status:** `400 Bad Request`

```json
{
  "message": "All fields are required"
}
```

### Error — Email Already Exists

**Status:** `409 Conflict`

```json
{
  "message": "Email is already registered"
}
```

### Notes

* Passwords must be hashed before being stored.
* Password hashes must never be returned in the API response.
* Email addresses should be treated as unique.

---

# 2. Login

Authenticates an existing user and returns a JWT.

### Endpoint

```http
POST /api/auth/login
```

### Full URL

```text
http://localhost:5000/api/auth/login
```

### Authentication

Not required.

### Request Body

```json
{
  "email": "test@test.com",
  "password": "password123"
}
```

### Request Parameters

| Field      | Type   | Required | Description              |
| ---------- | ------ | -------- | ------------------------ |
| `email`    | String | Yes      | Registered email address |
| `password` | String | Yes      | User's password          |

### Successful Response

**Status:** `200 OK`

```json
{
  "status": "success",
  "message": "User logged in successfully",
  "data": {
    "user": {
      "id": "1786340518154",
      "name": "Test",
      "email": "test@test.com"
    },
    "token": "<JWT_TOKEN>"
  }
}
```

### Decoded JWT Payload

If you decode the `token` (e.g., using jwt.io), the payload looks like this:
```json
{
  "id": "1786340518154",
  "email": "test@test.com",
  "iat": 1786341146,
  "exp": 1786427546
}
```
*Note: `iat` (Issued At) and `exp` (Expiration Time) are automatically tracked in seconds based on the `JWT_EXPIRES_IN_MINUTES` configuration.*

### Error — Invalid Credentials

**Status:** `401 Unauthorized`

```json
{
  "status": "error",
  "message": "Invalid credentials"
}
```

### Error — Missing Fields

**Status:** `400 Bad Request`

```json
{
  "status": "error",
  "message": "Email and password are required"
}
```

### Notes

The returned JWT must be included in the `Authorization` header when accessing protected endpoints.

Example:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

# 3. Get Current User

Returns information about the currently authenticated user.

### Endpoint

```http
GET /api/auth/me
```

### Full URL

```text
http://localhost:5000/api/auth/me
```

### Authentication

Required.

### Headers

```http
Authorization: Bearer <JWT_TOKEN>
```

### Successful Response

**Status:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "1786340518154",
      "name": "Test",
      "email": "test@test.com"
    }
  }
}
```

### Error — Missing Token

**Status:** `401 Unauthorized`

```json
{
  "status": "error",
  "message": "Authentication token is required"
}
```

### Error — Invalid Token

**Status:** `401 Unauthorized`

```json
{
  "status": "error",
  "message": "Invalid or expired token"
}
```

---

---

# Project Endpoints

All project endpoints require authentication via a JWT Bearer token.

---

## 1. Get All Projects

Returns a list of all projects. Supports optional search filtering.

### Endpoint

```http
GET /api/projects
```

### Full URL

```text
http://localhost:5000/api/projects
```

### Authentication

Required.

### Headers

```http
Authorization: Bearer <JWT_TOKEN>
```

### Query Parameters

| Parameter | Type   | Required | Description                              |
| --------- | ------ | -------- | ---------------------------------------- |
| `q`       | String | No       | Search term to filter projects by name   |

### Successful Response

**Status:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "projects": [
      {
        "id": "proj_001",
        "name": "Website Design",
        "description": "Redesign the company website with a modern look and feel.",
        "status": "active",
        "ownerId": "1786340518154",
        "coverImage": null,
        "createdAt": "2026-08-10T05:41:58.154Z",
        "updatedAt": "2026-08-10T05:41:58.154Z"
      }
    ]
  }
}
```

### Error — Unauthorized

**Status:** `401 Unauthorized`

```json
{
  "status": "error",
  "message": "Authentication token is required"
}
```

---

## 2. Get Project by ID

Returns the details of a single project by its ID.

### Endpoint

```http
GET /api/projects/:id
```

### Full URL

```text
http://localhost:5000/api/projects/proj_001
```

### Authentication

Required.

### Headers

```http
Authorization: Bearer <JWT_TOKEN>
```

### URL Parameters

| Parameter | Type   | Required | Description    |
| --------- | ------ | -------- | -------------- |
| `id`      | String | Yes      | Project ID     |

### Successful Response

**Status:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "project": {
      "id": "proj_001",
      "name": "Website Design",
      "description": "Redesign the company website with a modern look and feel.",
      "status": "active",
      "ownerId": "1786340518154",
      "coverImage": null,
      "createdAt": "2026-08-10T05:41:58.154Z",
      "updatedAt": "2026-08-10T05:41:58.154Z"
    }
  }
}
```

### Error — Not Found

**Status:** `404 Not Found`

```json
{
  "status": "error",
  "message": "Project not found"
}
```

### Error — Unauthorized

**Status:** `401 Unauthorized`

```json
{
  "status": "error",
  "message": "Authentication token is required"
}
```

---

## 3. Create Project

Creates a new project. The authenticated user becomes the project owner.

### Endpoint

```http
POST /api/projects
```

### Full URL

```text
http://localhost:5000/api/projects
```

### Authentication

Required.

### Headers

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Request Body

```json
{
  "name": "New Project",
  "description": "A brand new project",
  "status": "active"
}
```

### Request Parameters

| Field         | Type   | Required | Description                                       |
| ------------- | ------ | -------- | ------------------------------------------------- |
| `name`        | String | Yes      | Project name                                      |
| `description` | String | No       | Project description (defaults to empty string)    |
| `status`      | String | No       | Project status — `active` or `archived` (default: `active`) |

### Successful Response

**Status:** `201 Created`

```json
{
  "status": "success",
  "message": "Project created successfully",
  "data": {
    "project": {
      "id": "proj_1786340518154",
      "name": "New Project",
      "description": "A brand new project",
      "status": "active",
      "ownerId": "1786340518154",
      "coverImage": null,
      "createdAt": "2026-08-11T15:00:00.000Z",
      "updatedAt": "2026-08-11T15:00:00.000Z"
    }
  }
}
```

### Error — Missing Name

**Status:** `400 Bad Request`

```json
{
  "status": "error",
  "message": "Project name is required"
}
```

---

## 4. Update Project

Updates an existing project. Only the project owner can perform this action.

### Endpoint

```http
PUT /api/projects/:id
```

### Full URL

```text
http://localhost:5000/api/projects/proj_001
```

### Authentication

Required.

### Headers

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### URL Parameters

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `id`      | String | Yes      | Project ID  |

### Request Body

All fields are optional. Only provided fields will be updated.

```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "status": "archived"
}
```

### Request Parameters

| Field         | Type   | Required | Description                              |
| ------------- | ------ | -------- | ---------------------------------------- |
| `name`        | String | No       | New project name                         |
| `description` | String | No       | New project description                  |
| `status`      | String | No       | New project status (`active`/`archived`) |

### Successful Response

**Status:** `200 OK`

```json
{
  "status": "success",
  "message": "Project updated successfully",
  "data": {
    "project": {
      "id": "proj_001",
      "name": "Updated Project Name",
      "description": "Updated description",
      "status": "archived",
      "ownerId": "1786340518154",
      "coverImage": null,
      "createdAt": "2026-08-10T05:41:58.154Z",
      "updatedAt": "2026-08-11T15:00:00.000Z"
    }
  }
}
```

### Error — Not Found

**Status:** `404 Not Found`

```json
{
  "status": "error",
  "message": "Project not found"
}
```

### Error — Forbidden

**Status:** `403 Forbidden`

```json
{
  "status": "error",
  "message": "You are not authorized to update this project"
}
```

---

## 5. Delete Project

Permanently deletes a project. Only the project owner can perform this action.

### Endpoint

```http
DELETE /api/projects/:id
```

### Full URL

```text
http://localhost:5000/api/projects/proj_001
```

### Authentication

Required.

### Headers

```http
Authorization: Bearer <JWT_TOKEN>
```

### URL Parameters

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `id`      | String | Yes      | Project ID  |

### Successful Response

**Status:** `200 OK`

```json
{
  "status": "success",
  "message": "Project deleted successfully"
}
```

### Error — Not Found

**Status:** `404 Not Found`

```json
{
  "status": "error",
  "message": "Project not found"
}
```

### Error — Forbidden

**Status:** `403 Forbidden`

```json
{
  "status": "error",
  "message": "You are not authorized to delete this project"
}
```

---

# Error Handling

The API should return consistent error responses.

General format:

```json
{
  "message": "Description of the error"
}
```

For validation errors, additional information may be returned.

Example:

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

---

# 4. Forgot Password

Initiates the password reset flow by generating an OTP and sending it to the user's email.

### Endpoint

```http
POST /api/auth/forgot-password
```

### Request Body

```json
{
  "email": "test@test.com"
}
```

### Successful Response

**Status:** `200 OK`

```json
{
  "status": "success",
  "message": "OTP sent to email"
}
```

### Error — User Not Found

**Status:** `404 Not Found`

```json
{
  "status": "error",
  "message": "User not found"
}
```

---

# 5. Reset Password

Completes the password reset flow using the OTP sent to the user's email.

### Endpoint

```http
POST /api/auth/reset-password
```

### Request Body

```json
{
  "email": "test@test.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

### Successful Response

**Status:** `200 OK`

```json
{
  "status": "success",
  "message": "Password reset successfully"
}
```

### Error — Invalid OTP

**Status:** `400 Bad Request`

```json
{
  "status": "error",
  "message": "Invalid OTP"
}
```

---

# 6. Get Cloudinary Info

Retrieves Cloudinary account usage details (bandwidth, storage, requests, plan limits).

### Endpoint

```http
GET /api/cloudinary/info
```

### Authentication

Required.

### Headers

```http
Authorization: Bearer <JWT_TOKEN>
```

### Successful Response

**Status:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "plan": "Free",
    "last_updated": "2023-10-27T00:00:00Z",
    "bandwidth": {
      "usage": 1024,
      "limit": 26214400,
      "used_percent": 0.0
    },
    "storage": {
      "usage": 512,
      "limit": 26214400,
      "used_percent": 0.0
    },
    ...
  }
}
```

### Error — Unauthorized

**Status:** `401 Unauthorized`

```json
{
  "status": "error",
  "message": "Authentication token is required"
}
```

---

# Testing with Bruno

The CollabBoard repository includes a Bruno API collection.

The collection is located at:

```text
bruno-api/
```

The collection contains API requests organized by functionality.

Example:

```text
bruno-api/
├── Auth/
│   ├── Register
│   ├── Login
│   └── Get Current User
│
├── Projects/
│   ├── Get Projects
│   ├── Get Project
│   ├── Create Project
│   ├── Update Project
│   └── Delete Project
│
└── Tasks/
    ├── Get Tasks
    ├── Get Task
    ├── Create Task
    ├── Update Task
    └── Delete Task
```

---

## Running the Backend

Before testing the API, start the backend:

```bash
cd backend
node server.js
```

The API should be available at:

```text
http://localhost:5000
```

---

## Opening the Bruno Collection

1. Open Bruno.
2. Select **Open Collection**.
3. Navigate to the project repository.
4. Select the `bruno-api` directory.
5. Open the collection.
6. Select the desired request.
7. Send the request.

---

## Recommended Authentication Testing Flow

Test authentication in the following order:

```text
Register
   ↓
Login
   ↓
Copy JWT
   ↓
Set Authorization Header
   ↓
Get Current User
```

Protected requests should use:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

# API Development Status

The API is being implemented incrementally according to the project milestones.

## M2 — Working REST API

### Authentication

* [ ] User registration
* [ ] Password hashing
* [ ] User login
* [ ] JWT generation
* [ ] JWT verification middleware
* [ ] Get current authenticated user

### Projects

* [x] Get projects
* [x] Get project by ID
* [x] Create project
* [x] Update project
* [x] Delete project
* [ ] Upload project cover image
* [ ] Get project attachments
* [ ] Add project attachment
* [ ] Delete project attachment

### Tasks

* [ ] Get tasks
* [ ] Get task
* [ ] Create task
* [ ] Update task
* [ ] Delete task

### API Integration

* [ ] Connect frontend to authentication APIs
* [ ] Connect frontend to project APIs
* [ ] Connect frontend to task APIs
* [ ] Replace hardcoded frontend data

### Real-Time Communication

* [ ] WebSocket connection
* [ ] Task creation events
* [ ] Task update events
* [ ] Task movement events
* [ ] Task deletion events

---

# M3 — Persistence & Offline Support

The M3 milestone will replace temporary mock data with persistent MongoDB storage.

Planned work includes:

* [ ] MongoDB setup
* [ ] Mongoose integration
* [ ] User schema
* [ ] Project schema
* [ ] Task schema
* [ ] Database relationships
* [ ] Replace mock data
* [ ] Database schema diagram
* [ ] Client-side caching
* [ ] Offline support

---

# API Contract Guidelines

When adding or modifying an endpoint:

1. Define the endpoint and expected behavior.
2. Implement the backend endpoint.
3. Add the corresponding Bruno request.
4. Test the endpoint.
5. Update this `API.md` document.
6. Update the frontend integration if required.
7. Include all relevant changes in the Pull Request.

The API documentation, backend implementation, Bruno collection, and frontend integration should remain synchronized.

---

# Related Documentation

* [Main Project README](../README.md)
* [Bruno API Collection](../bruno-api/)

---

## API Version

Current API version:

```text
v1
```

Base path:

```text
/api
```

---

**CollabBoard API Documentation**
