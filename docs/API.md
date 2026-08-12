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
  * [Upload Cover Image](#6-upload-cover-image)
  * [Get Attachments](#7-get-attachments)
  * [Add Attachment](#8-add-attachment)
  * [Delete Attachment](#9-delete-attachment)
  * [Get Project Tasks](#3-get-project-tasks)
  * [Create Project Task](#4-create-project-task)
* [Tasks Endpoints](#tasks-endpoints)
  * [Get Task](#1-get-task)
  * [Update Task](#2-update-task)
  * [Delete Task](#3-delete-task)
  * [Update Task Status](#4-update-task-status)
  * [Review Task](#5-review-task)
  * [Reject Task](#6-reject-task)
  * [Get Task Reviews](#7-get-task-reviews)
* [Dashboard Endpoints](#dashboard-endpoints)
  * [Get Timeline](#1-get-timeline)
  * [Get Ongoing Projects Stats](#2-get-ongoing-projects-stats)
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

# User Endpoints

All user endpoints require authentication via a JWT Bearer token.

---

## 1. Search Users

Searches users by name or email query string (`q`). Returns matching users (excluding passwords).

### Endpoint

```http
GET /api/users/search
```

### Full URL

```text
http://localhost:5000/api/users/search?q=test
```

### Authentication

Required.

### Headers

```http
Authorization: Bearer <JWT_TOKEN>
```

### Query Parameters

| Parameter | Type   | Required | Description                                                    |
| --------- | ------ | -------- | -------------------------------------------------------------- |
| `q`       | String | No       | Search term to filter users by name or email (case-insensitive) |

### Successful Response

**Status:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": "1786340518154",
        "name": "Test",
        "email": "test@test.com",
        "date": "2026-08-10T05:41:58.154Z"
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

## 6. Upload Cover Image

Uploads or replaces the cover image for a project. The image is stored in Cloudinary and its URL is saved to the project. Only the project owner can upload a cover image.

### Endpoint

```http
POST /api/projects/:id/cover-image
```

### Full URL

```text
http://localhost:5000/api/projects/proj_001/cover-image
```

### Authentication

Required.

### Headers

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

### URL Parameters

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `id`      | String | Yes      | Project ID  |

### Request Body

Send as `multipart/form-data`:

| Field   | Type | Required | Description                               |
| ------- | ---- | -------- | ----------------------------------------- |
| `image` | File | Yes      | Image file (JPEG, PNG, WebP, GIF, max 5MB) |

### Successful Response

**Status:** `200 OK`

```json
{
  "status": "success",
  "message": "Cover image uploaded successfully",
  "data": {
    "coverImage": "https://res.cloudinary.com/your-cloud/image/upload/collabboard/covers/proj_001/cover_123456.jpg"
  }
}
```

### Error — No File

**Status:** `400 Bad Request`

```json
{
  "status": "error",
  "message": "Image file is required"
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

## 7. Get Attachments

Returns all attachments for a specific project.

### Endpoint

```http
GET /api/projects/:id/attachments
```

### Full URL

```text
http://localhost:5000/api/projects/proj_001/attachments
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
  "data": {
    "attachments": [
      {
        "id": "att_1786340518154",
        "projectId": "proj_001",
        "filename": "design_brief.pdf",
        "url": "https://res.cloudinary.com/your-cloud/.../design_brief.pdf",
        "publicId": "collabboard/attachments/proj_001/att_123456",
        "mimeType": "application/pdf",
        "size": 204800,
        "uploadedBy": "1786340518154",
        "uploadedAt": "2026-08-11T15:00:00.000Z"
      }
    ]
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

---

## 8. Add Attachment

Uploads a new attachment to a project. The file is stored in Cloudinary and the record is saved to the attachments store.

### Endpoint

```http
POST /api/projects/:id/attachments
```

### Full URL

```text
http://localhost:5000/api/projects/proj_001/attachments
```

### Authentication

Required.

### Headers

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

### URL Parameters

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `id`      | String | Yes      | Project ID  |

### Request Body

Send as `multipart/form-data`:

| Field  | Type | Required | Description                      |
| ------ | ---- | -------- | -------------------------------- |
| `file` | File | Yes      | Any file type, maximum size 20MB |

### Successful Response

**Status:** `201 Created`

```json
{
  "status": "success",
  "message": "Attachment uploaded successfully",
  "data": {
    "attachment": {
      "id": "att_1786340518154",
      "projectId": "proj_001",
      "filename": "design_brief.pdf",
      "url": "https://res.cloudinary.com/your-cloud/.../design_brief.pdf",
      "publicId": "collabboard/attachments/proj_001/att_123456",
      "mimeType": "application/pdf",
      "size": 204800,
      "uploadedBy": "1786340518154",
      "uploadedAt": "2026-08-11T15:00:00.000Z"
    }
  }
}
```

### Error — No File

**Status:** `400 Bad Request`

```json
{
  "status": "error",
  "message": "Attachment file is required"
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

---

## 9. Delete Attachment

Permanently deletes an attachment from a project. The file is also removed from Cloudinary. Only the user who uploaded the attachment or the project owner can delete it.

### Endpoint

```http
DELETE /api/projects/:id/attachments/:attachmentId
```

### Full URL

```text
http://localhost:5000/api/projects/proj_001/attachments/att_1786340518154
```

### Authentication

Required.

### Headers

```http
Authorization: Bearer <JWT_TOKEN>
```

### URL Parameters

| Parameter      | Type   | Required | Description   |
| -------------- | ------ | -------- | ------------- |
| `id`           | String | Yes      | Project ID    |
| `attachmentId` | String | Yes      | Attachment ID |

### Successful Response

**Status:** `200 OK`

```json
{
  "status": "success",
  "message": "Attachment deleted successfully"
}
```

### Error — Project Not Found

**Status:** `404 Not Found`

```json
{
  "status": "error",
  "message": "Project not found"
}
```

### Error — Attachment Not Found

**Status:** `404 Not Found`

```json
{
  "status": "error",
  "message": "Attachment not found"
}
```

### Error — Forbidden

**Status:** `403 Forbidden`

```json
{
  "status": "error",
  "message": "You are not authorized to delete this attachment"
}
```

---

## 10. Get Project Members

Retrieves all team members of a project.

### Endpoint

```http
GET /api/projects/:id/members
```

### Full URL

```text
http://localhost:5000/api/projects/proj_001/members
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
  "data": {
    "members": [
      {
        "userId": "1786340518154",
        "name": "Test",
        "email": "test@test.com",
        "role": "owner",
        "joinedAt": "2026-08-10T05:41:58.154Z"
      },
      {
        "userId": "1786356291453",
        "name": "Nipun Manusha",
        "email": "nipunmanusha2003@gmail.com",
        "role": "member",
        "joinedAt": "2026-08-10T06:00:00.000Z"
      }
    ]
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

---

## 11. Add Project Member

Adds a user to a project team by `userId` or `email`.

### Endpoint

```http
POST /api/projects/:id/members
```

### Full URL

```text
http://localhost:5000/api/projects/proj_001/members
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

```json
{
  "userId": "1786431927127",
  "role": "member"
}
```

### Request Parameters

| Field    | Type   | Required | Description                                            |
| -------- | ------ | -------- | ------------------------------------------------------ |
| `userId` | String | No*      | User ID of member to add (*either `userId` or `email`) |
| `email`  | String | No*      | Email of user to add (*either `userId` or `email`)    |
| `role`   | String | No       | Member role (default: `member`)                        |

### Successful Response

**Status:** `201 Created`

```json
{
  "status": "success",
  "message": "Member added successfully",
  "data": {
    "member": {
      "userId": "1786431927127",
      "name": "Isuri Perera",
      "email": "isuriupp@gmail.com",
      "role": "member",
      "joinedAt": "2026-08-11T18:00:00.000Z"
    }
  }
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

### Error — Already Member

**Status:** `409 Conflict`

```json
{
  "status": "error",
  "message": "User is already a member of this project"
}
```

---

## 12. Remove Project Member

Removes a member from a project team.

### Endpoint

```http
DELETE /api/projects/:id/members/:userId
```

### Full URL

```text
http://localhost:5000/api/projects/proj_001/members/1786431927127
```

### Authentication

Required.

### Headers

```http
Authorization: Bearer <JWT_TOKEN>
```

### URL Parameters

| Parameter | Type   | Required | Description         |
| --------- | ------ | -------- | ------------------- |
| `id`      | String | Yes      | Project ID          |
| `userId`  | String | Yes      | Member User ID      |

### Successful Response

**Status:** `200 OK`

```json
{
  "status": "success",
  "message": "Member removed successfully"
}
```

### Error — Member Not Found

**Status:** `404 Not Found`

```json
{
  "status": "error",
  "message": "Member not found in project"
}
```

### Error — Cannot Remove Owner

**Status:** `400 Bad Request`

```json
{
  "status": "error",
  "message": "Cannot remove project owner"
}
```

---

## 13. Get Project Tasks

Retrieves all tasks and subtasks associated with a specific project.

### Endpoint

```http
GET /api/projects/:id/tasks
```

### Full URL

```text
http://localhost:5000/api/projects/proj_001/tasks
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
  "data": {
    "tasks": [
      {
        "id": "task_001",
        "projectId": "proj_001",
        "title": "Design Homepage Wireframes",
        "description": "Create low-fidelity wireframes for desktop and mobile layouts.",
        "status": "in_progress",
        "priority": "high",
        "assigneeId": "1786340518154",
        "dueDate": "2026-08-20T18:00:00.000Z",
        "subtasks": [
          {
            "id": "sub_101",
            "title": "Desktop navbar layout",
            "completed": true
          },
          {
            "id": "sub_102",
            "title": "Hero section banner",
            "completed": false
          }
        ],
        "createdAt": "2026-08-10T08:00:00.000Z",
        "updatedAt": "2026-08-11T10:00:00.000Z"
      }
    ]
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

---

## 14. Get Project Timeline

Retrieves the activity history/timeline for a project.

### Endpoint

```http
GET /api/projects/:id/timeline
```

### Full URL

```text
http://localhost:5000/api/projects/proj_001/timeline
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

### Query Parameters

| Parameter | Type    | Required | Description                                          |
| --------- | ------- | -------- | ---------------------------------------------------- |
| `limit`   | Integer | No       | Optional limit on the number of activities returned   |

### Successful Response

**Status:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "timeline": [
      {
        "id": "act_005",
        "projectId": "proj_001",
        "type": "attachment_uploaded",
        "title": "Attachment Uploaded",
        "description": "Uploaded design brief file.",
        "userId": "1786340518154",
        "userName": "Test",
        "timestamp": "2026-08-11T15:00:00.000Z"
      },
      {
        "id": "act_004",
        "projectId": "proj_001",
        "type": "task_updated",
        "title": "Subtask Completed",
        "description": "Desktop navbar layout subtask completed.",
        "userId": "1786340518154",
        "userName": "Test",
        "timestamp": "2026-08-11T10:00:00.000Z"
      }
    ]
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

---

## 15. Refresh Project Timeline

Fetches new project activities logged since a specified timestamp (`since`).

### Endpoint

```http
GET /api/projects/:id/timeline/refresh
```

### Full URL

```text
http://localhost:5000/api/projects/proj_001/timeline/refresh?since=2026-08-11T00:00:00.000Z
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

### Query Parameters

| Parameter | Type   | Required | Description                                                    |
| --------- | ------ | -------- | -------------------------------------------------------------- |
| `since`   | String | No       | ISO timestamp or epoch timestamp to filter newer activity items |

### Successful Response

**Status:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "newActivities": [
      {
        "id": "act_005",
        "projectId": "proj_001",
        "type": "attachment_uploaded",
        "title": "Attachment Uploaded",
        "description": "Uploaded design brief file.",
        "userId": "1786340518154",
        "userName": "Test",
        "timestamp": "2026-08-11T15:00:00.000Z"
      }
    ],
    "lastRefreshedAt": "2026-08-11T18:15:00.000Z"
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

---

## 16. Download Attachment

Downloads an attachment file by attachment ID and project ID. Returns file stream or attachment redirect with `Content-Disposition` header.

### Endpoint

```http
GET /api/projects/:id/attachments/:attachmentId/download
```

### Full URL

```text
http://localhost:5000/api/projects/proj_001/attachments/att_001/download
```

### Authentication

Required.

### Headers

```http
Authorization: Bearer <JWT_TOKEN>
```

### URL Parameters

| Parameter      | Type   | Required | Description   |
| -------------- | ------ | -------- | ------------- |
| `id`           | String | Yes      | Project ID    |
| `attachmentId` | String | Yes      | Attachment ID |

### Response Headers

```http
Content-Disposition: attachment; filename="design_brief.pdf"
Content-Type: application/pdf
```

### Successful Response

**Status:** `200 OK` or `302 Found` (File binary data or URL redirect)

### Error — Attachment Not Found

**Status:** `404 Not Found`

```json
{
  "status": "error",
  "message": "Attachment not found"
}
```

### Error — Project Not Found

**Status:** `404 Not Found`

```json
{
  "status": "error",
  "message": "Project not found"
}
```

---

# Dashboard Endpoints

## 1. Get Timeline

Retrieves aggregated task data for the management timeline card, grouping tasks by their tracks (projects) and calculating durations.

**Endpoint:**

```http
GET /api/dashboard/timeline
```

**Headers:**

```http
Authorization: Bearer <token>
```

**Response: `200 OK`**

```json
{
  "status": "success",
  "data": [
    {
      "trackId": "proj_001",
      "trackName": "Website Design",
      "tasks": [
        {
          "id": "task_001",
          "title": "Design Homepage Wireframes",
          "status": "in_progress",
          "priority": "high",
          "duration": "about 10 days",
          "startDate": "2026-08-10T08:00:00.000Z",
          "dueDate": "2026-08-20T18:00:00.000Z",
          "assignee": {
            "id": "1786340518154",
            "name": "Test",
            "avatar": "https://ui-avatars.com/api/?name=Test"
          }
        }
      ]
    }
  ]
}
```

---

## 2. Get Ongoing Projects Stats

Retrieves statistics for ongoing active projects. It calculates the overall progress percentage based on completed subtasks across active projects, and provides a breakdown by project categories (e.g., Design Reviews, Development).

**Endpoint:**

```http
GET /api/dashboard/projects/ongoing
```

**Headers:**

```http
Authorization: Bearer <token>
```

**Response: `200 OK`**

```json
{
  "status": "success",
  "data": {
    "overallProgress": 68.5,
    "categories": [
      {
        "name": "Design Reviews",
        "totalProjects": 2,
        "completedTasks": 3,
        "totalTasks": 5,
        "progress": 60.0
      },
      {
        "name": "Development",
        "totalProjects": 1,
        "completedTasks": 0,
        "totalTasks": 2,
        "progress": 0.0
      }
    ]
  }
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

## 3. Get Project Tasks

Retrieves all tasks for a specific project.

**Endpoint:**

```http
GET /api/projects/:projectId/tasks
```

**Authentication:** Required (Bearer Token)

**Parameters:**

*   `projectId` (URL Parameter): The unique ID of the project.

**Response:**

`200 OK`

```json
{
  "status": "success",
  "data": {
    "tasks": [
      {
        "id": "101",
        "projectId": "1",
        "title": "Design Database Schema",
        "description": "Create the initial database schema",
        "status": "todo",
        "assignee": "1786340518154",
        "reviews": [],
        "createdAt": "2026-08-11T16:00:00.000Z"
      }
    ]
  }
}
```

---

## 4. Create Project Task

Creates a new task within a specific project.

**Endpoint:**

```http
POST /api/projects/:projectId/tasks
```

**Authentication:** Required (Bearer Token)

**Parameters:**

*   `projectId` (URL Parameter): The unique ID of the project.

**Request Body:**

```json
{
  "title": "Design Database Schema",
  "description": "Create the initial database schema",
  "status": "todo",
  "assignee": "1786340518154"
}
```

**Response:**

`201 Created`

```json
{
  "status": "success",
  "data": {
    "task": {
      "id": "101",
      "projectId": "1",
      "title": "Design Database Schema",
      "description": "Create the initial database schema",
      "status": "todo",
      "assignee": "1786340518154",
      "reviews": [],
      "createdAt": "2026-08-11T16:00:00.000Z"
    }
  }
}
```

`400 Bad Request`

```json
{
  "status": "error",
  "message": "Title is required"
}
```

---

# Tasks Endpoints

## 1. Get Task

Retrieves details of a specific task.

**Endpoint:**

```http
GET /api/tasks/:taskId
```

**Authentication:** Required (Bearer Token)

**Parameters:**

*   `taskId` (URL Parameter): The unique ID of the task.

**Response:**

`200 OK`

```json
{
  "status": "success",
  "data": {
    "task": {
      "id": "101",
      "projectId": "1",
      "title": "Design Database Schema",
      "description": "Create the initial database schema",
      "status": "todo",
      "assignee": "1786340518154",
      "reviews": [],
      "createdAt": "2026-08-11T16:00:00.000Z"
    }
  }
}
```

`404 Not Found`

```json
{
  "status": "error",
  "message": "Task not found"
}
```

---

## 2. Update Task

Updates an existing task.

**Endpoint:**

```http
PATCH /api/tasks/:taskId
```

**Authentication:** Required (Bearer Token)

**Parameters:**

*   `taskId` (URL Parameter): The unique ID of the task.

**Request Body (Partial):**

```json
{
  "status": "in_progress",
  "description": "Updated database schema description"
}
```

**Response:**

`200 OK`

```json
{
  "status": "success",
  "data": {
    "task": {
      "id": "101",
      "projectId": "1",
      "title": "Design Database Schema",
      "description": "Updated database schema description",
      "status": "in_progress",
      "assignee": "1786340518154",
      "reviews": [],
      "createdAt": "2026-08-11T16:00:00.000Z"
    }
  }
}
```

---

## 3. Delete Task

Deletes a specific task.

**Endpoint:**

```http
DELETE /api/tasks/:taskId
```

**Authentication:** Required (Bearer Token)

**Parameters:**

*   `taskId` (URL Parameter): The unique ID of the task.

**Response:**

`200 OK`

```json
{
  "status": "success",
  "message": "Task deleted successfully"
}
```

---

## 4. Update Task Status

Updates the status of a specific task.

**Endpoint:**

```http
PATCH /api/tasks/:taskId/status
```

**Authentication:** Required (Bearer Token)

**Parameters:**

*   `taskId` (URL Parameter): The unique ID of the task.

**Request Body:**

```json
{
  "status": "in_review"
}
```

**Response:**

`200 OK`

```json
{
  "status": "success",
  "data": {
    "task": {
      "id": "101",
      "projectId": "1",
      "title": "Design Database Schema",
      "description": "Updated database schema description",
      "status": "in_review",
      "assignee": "1786340518154",
      "reviews": [],
      "createdAt": "2026-08-11T16:00:00.000Z"
    }
  }
}
```

---

## 5. Review Task

Approves and adds a review comment to a task.

**Endpoint:**

```http
POST /api/tasks/:taskId/review
```

**Authentication:** Required (Bearer Token)

**Parameters:**

*   `taskId` (URL Parameter): The unique ID of the task.

**Request Body:**

```json
{
  "comment": "Looks good, approved."
}
```

**Response:**

`201 Created`

```json
{
  "status": "success",
  "data": {
    "review": {
      "id": "1691763123456",
      "reviewerId": "1786340518154",
      "comment": "Looks good, approved.",
      "decision": "approved",
      "createdAt": "2026-08-11T16:05:00.000Z"
    },
    "task": {
      "id": "101",
      "status": "reviewed"
    }
  }
}
```

---

## 6. Reject Task

Rejects and adds a rejection comment to a task.

**Endpoint:**

```http
POST /api/tasks/:taskId/reject
```

**Authentication:** Required (Bearer Token)

**Parameters:**

*   `taskId` (URL Parameter): The unique ID of the task.

**Request Body:**

```json
{
  "comment": "Needs more work."
}
```

**Response:**

`201 Created`

```json
{
  "status": "success",
  "data": {
    "review": {
      "id": "1691763123456",
      "reviewerId": "1786340518154",
      "comment": "Needs more work.",
      "decision": "rejected",
      "createdAt": "2026-08-11T16:05:00.000Z"
    },
    "task": {
      "id": "101",
      "status": "rejected"
    }
  }
}
```

---

## 7. Get Task Reviews

Retrieves all reviews for a specific task.

**Endpoint:**

```http
GET /api/tasks/:taskId/reviews
```

**Authentication:** Required (Bearer Token)

**Parameters:**

*   `taskId` (URL Parameter): The unique ID of the task.

**Response:**

`200 OK`

```json
{
  "status": "success",
  "data": {
    "reviews": [
      {
        "id": "1691763123456",
        "reviewerId": "1786340518154",
        "comment": "Looks good, approved.",
        "decision": "approved",
        "createdAt": "2026-08-11T16:05:00.000Z"
      }
    ]
  }
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
* [x] Upload project cover image
* [x] Get project attachments
* [x] Add project attachment
* [x] Delete project attachment

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
