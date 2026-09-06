# CollabBoard

A collaborative project management and Kanban board application designed to help teams organize projects, manage tasks, collaborate in real time, and track project progress.

CollabBoard provides a centralized workspace where project members can create and manage projects, organize tasks using a Kanban board, communicate changes in real time, and monitor project progress through a structured dashboard.

---

## Table of Contents

* [Overview](#overview)
* [Features](#features)
* [Technology Stack](#technology-stack)
* [Project Structure](#project-structure)
* [Prerequisites](#prerequisites)
* [Getting Started](#getting-started)

  * [Clone the Repository](#1-clone-the-repository)
  * [Install Frontend Dependencies](#2-install-frontend-dependencies)
  * [Install Backend Dependencies](#3-install-backend-dependencies)
  * [Configure Environment Variables](#4-configure-environment-variables)
* [Running the Application](#running-the-application)

  * [Running with Docker (Recommended)](#running-with-docker-recommended)
  * [Running Manually](#running-manually)
    * [Terminal 1 — Backend](#terminal-1--backend)
    * [Terminal 2 — Frontend](#terminal-2--frontend)
* [API Documentation](#api-documentation)
* [Bruno API Collection](#bruno-api-collection)
* [Development Workflow](#development-workflow)
* [Git Branching Strategy](#git-branching-strategy)
* [Environment Variables](#environment-variables)
* [Project Architecture](#project-architecture)
* [Database](#database)
* [Real-Time Communication](#real-time-communication)
* [Contributing](#contributing)
* [Troubleshooting](#troubleshooting)
* [License](#license)

---

# Overview

CollabBoard is a full-stack collaborative project management system built as a team software engineering project.

The application combines project management, task tracking, Kanban boards, authentication, real-time communication, and project insights into a single platform.

The system is designed around a client-server architecture:

```text
┌──────────────────────────┐
│      React Frontend      │
│                          │
│  Dashboard               │
│  Projects                │
│  Kanban Board            │
│  Authentication          │
│  Project Management      │
└────────────┬─────────────┘
             │
             │ REST API
             ▼
┌──────────────────────────┐
│      Express Backend     │
│                          │
│  Authentication          │
│  Project API             │
│  Task API                │
│  WebSocket Communication │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│         MongoDB          │
│                          │
│  Users                   │
│  Projects                │
│  Tasks                   │
│  Project Members         │
└──────────────────────────┘
```

During the initial development phase, mock data is used by the backend before MongoDB persistence is introduced.

---

# Features

## Authentication

* User registration
* User login
* JWT-based authentication
* Password hashing
* Protected API endpoints
* Authenticated user information
* Authentication middleware

## Project Management

* Create projects
* View projects
* View individual project details
* Update project information
* Delete projects
* Manage project members
* Project ownership and permissions

## Task Management

* Create tasks
* View tasks
* Update tasks
* Delete tasks
* Assign tasks to project members
* Set task priorities
* Track task status
* Organize tasks using Kanban columns

## Kanban Board

* Multiple task columns
* Drag-and-drop task management
* Task status updates
* Real-time task changes
* Collaborative board updates

## Dashboard

* Project overview
* Ongoing projects
* Project progress
* Team overview
* Timeline information
* Project insights

## Real-Time Collaboration

* WebSocket-based communication
* Real-time Kanban updates
* Real-time task changes
* Synchronization between connected users

---

# Technology Stack

### Frontend
- **React.js** - UI Library
- **Vite** - Build Tool
- **Dnd-kit** - Drag and drop functionality for Kanban board
- **Recharts** - Charts for the dashboard
- **PouchDB** - Client-side data caching layer

## Backend

* Node.js
* Express.js
* REST API
* JSON Web Tokens (JWT)
* bcrypt
* Socket.IO / WebSockets

## Database

* MongoDB
* Mongoose

## API Testing

* Bruno

## Development Tools

* Git
* GitHub
* Visual Studio Code
* npm

---

# Project Structure

The repository is organized into separate frontend, backend, API testing, and documentation directories.

```text
CollabBoard/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   ├── .env
│   └── ...
│
├── bruno-api/
│   ├── Auth/
│   ├── Projects/
│   ├── Tasks/
│   ├── environments/
│   └── ...
│
├── docs/
│   └── API.md
│
├── .gitignore
├── README.md
└── ...
```

### `frontend/`

Contains the React client application.

### `backend/`

Contains the Node.js and Express REST API, authentication logic, middleware, controllers, and real-time communication functionality.

### `bruno-api/`

Contains the Bruno API collection used for testing and developing the backend API.

### `docs/`

Contains additional project documentation, including the API contract.

### `README.md`

The main project documentation and setup guide.

---

# Prerequisites

Before running the project, make sure the following software is installed.

### Node.js

Node.js is required to run both the frontend and backend.

Verify your installation:

```bash
node --version
```

and:

```bash
npm --version
```

### Git

Git is required to clone and manage the repository.

Verify:

```bash
git --version
```

### Bruno

Bruno is recommended for testing the REST API.

The Bruno application can be downloaded from:

https://www.usebruno.com/

MongoDB will be required once the database persistence stage of the project is implemented.

---

# Getting Started

## 1. Clone the Repository

Clone the repository:

```bash
git clone https://github.com/ItsKalfox/collabboard-client.git
```

Navigate into the project:

```bash
cd collabboard-client
```



---

## 2. Install Frontend Dependencies

Navigate to the frontend directory:

```bash
cd frontend
```

Install the required dependencies:

```bash
npm install
```

Return to the project root:

```bash
cd ..
```

---

## 3. Install Backend Dependencies

Navigate to the backend directory:

```bash
cd backend
```

Install the required dependencies:

```bash
npm install
```

Return to the project root:

```bash
cd ..
```

---

## 4. Configure Environment Variables

The backend uses environment variables for configuration and sensitive information.

Create a `.env` file inside the `backend` directory:

```text
backend/
└── .env
```

Example:

```env
PORT=5000
JWT_SECRET=your-secret-key
```

### Important

The `.env` file contains sensitive information and must **not** be committed to Git.

A `.env.example` file should be used to document the required environment variables without exposing actual secrets.

Example:

```env
PORT=5000
JWT_SECRET=
```

---

# Running the Application

The frontend and backend are separate applications and should be run in separate terminal windows.

---

## Run the Backend

Open a terminal at the project root and navigate to the backend:

```bash
cd backend
```

Start the backend server:

```bash
node server.js
```

The backend will start on the configured port.

By default:

```text
http://localhost:5000
```

The backend API is available under:

```text
http://localhost:5000/api
```

### Example Health Check

```http
GET http://localhost:5000/api/health
```

A successful response should indicate that the backend is running.


---

## Run the Frontend

Open a **new terminal window** at the project root.

Navigate to the frontend:

```bash
cd frontend
```

Start the Vite development server:

```bash
npm run dev
```

Vite will display the local development URL in the terminal.

Typically:

```text
http://localhost:5173
```

Open the displayed URL in a web browser.

## Running with Docker (Recommended)

CollabBoard is fully dockerized, making it incredibly easy to run both the frontend and backend simultaneously without needing multiple terminals or manual dependency installation.

### Prerequisites for Docker
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running on your machine.
- Ensure Docker is set to use Linux containers.

### How to Run

1. Open a single terminal at the project root (`collabboard-client`).
2. Run the following command:

```bash
docker compose up --build
```

Docker will automatically build the images, install dependencies, and start both the backend (on port `5000`) and the frontend (on port `5173`). 
The `--build` flag ensures that any new dependencies in `package.json` are installed. **You only need to include the `--build` flag the first time you run it, or if you modify dependencies/Dockerfiles.** For subsequent runs, you can simply use:

```bash
docker compose up
```

### Hot Reloading
The Docker setup uses volume mapping. This means that any changes you make to the code locally in your IDE will immediately hot-reload inside the running Docker containers, exactly as if you were running it natively!

### Stopping the Application
To stop the running containers, simply press `Ctrl + C` in the terminal where Docker Compose is running. 

If you started the containers in detached mode (using `docker compose up -d`), you can stop them by running:

```bash
docker compose down
```

---

## Running Manually

You can also run the applications manually if you prefer not to use Docker. You will need two terminals running.

### Terminal 1 — Backend

```bash
cd backend
node server.js
```

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

The overall development environment will look like:

```text
Browser
   │
   │ http://localhost:5173
   ▼
React Frontend
   │
   │ HTTP REST API
   ▼
Express Backend
   │
   │
   ▼
MongoDB
```

---

# API Documentation

The complete API contract is maintained separately from this README.

You can find the API documentation here:

**[API Documentation](docs/API.md)**

The API documentation describes:

* Available endpoints
* HTTP methods
* Request parameters
* Request bodies
* Authentication requirements
* Response formats
* HTTP status codes
* Error responses
* JWT authentication
* Protected endpoints

The API documentation should be updated whenever a new endpoint is introduced or an existing endpoint is changed.

---

# Bruno API Collection

CollabBoard uses **Bruno** for REST API development and testing.

The Bruno collection is stored directly inside the repository:

```text
bruno-api/
```

This allows all team members to use the same API requests and ensures that the API testing configuration can be version-controlled alongside the project.

## Opening the Bruno Collection

1. Install Bruno.
2. Open Bruno.
3. Select **Open Collection**.
4. Navigate to the `bruno-api` directory inside the cloned repository.
5. Open the collection.

The collection contains requests organized by API functionality.

---

## Using Bruno

Make sure the backend server is running before sending requests from Bruno.

Start the backend:

```bash
cd backend
node server.js
```

Then open the required request in Bruno and send it.

For example:

```text
POST /api/auth/register
```

followed by:

```text
POST /api/auth/login
```

The login response will provide a JWT token that can be used to authenticate protected API requests.

---

# API Authentication

CollabBoard uses **JSON Web Tokens (JWT)** for API authentication.

Public endpoints such as registration and login do not require authentication.

Protected endpoints require a valid JWT:

```http
Authorization: Bearer <token>
```

The general authentication flow is:

```text
User
 │
 │ Register
 ▼
POST /api/auth/register
 │
 ▼
User Account
 │
 │ Login
 ▼
POST /api/auth/login
 │
 ▼
JWT Token
 │
 │ Authorization: Bearer <token>
 ▼
Protected API
```

---

# Development Workflow

The project follows a feature-based development workflow.

Before starting new work, update your local development branch:

```bash
git switch development
git pull origin development
```

Create a new feature branch:

```bash
git switch -c feature/<feature-name>
```

Examples:

```text
feature/backend/auth
feature/backend/projects
feature/backend/tasks
feature/backend/websocket
feature/frontend/auth
feature/frontend/project-api
```

Make your changes and test them locally.

Then:

```bash
git add .
git commit -m "feat: description of change"
```

Push the branch:

```bash
git push -u origin feature/<feature-name>
```

Create a Pull Request targeting the `development` branch.

---

# Git Branching Strategy

The project uses `main` and `development` as the primary shared branches.

```text
main
  │
  │ Pull Request
  ▼
development
  │
  ├── feature/backend/auth
  │
  ├── feature/backend/projects
  │
  ├── feature/backend/tasks
  │
  ├── feature/backend/websocket
  │
  ├── feature/frontend/auth
  │
  └── feature/frontend/project-api
```

## `main`

The `main` branch represents the stable version of the project.

Direct pushes to `main` should be avoided.

## `development`

The `development` branch is the main integration branch for completed and reviewed features.

Changes should be introduced through Pull Requests.

## Feature Branches

Feature branches are created from the latest `development` branch.

Each feature should be developed and tested independently before being merged through a Pull Request.

---

# Environment Variables

Backend environment variables are stored in:

```text
backend/.env
```

Example:

```env
PORT=5000
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN_MINUTES=1440
```

| Variable     | Description                     | Example           |
| ------------ | ------------------------------- | ----------------- |
| `PORT`       | Port used by the Express server | `5000`            |
| `JWT_SECRET` | Secret used to sign JWT tokens  | `your-secret-key` |
| `JWT_EXPIRES_IN_MINUTES` | JWT token expiration time  | `1440(24h)` |

Do not commit actual secret values to the repository.

Use `.env.example` to document required variables.

---

# Project Architecture

CollabBoard follows a client-server architecture.

```text
┌──────────────────────────────┐
│          Frontend            │
│                              │
│            React             │
│                              │
│  Dashboard                   │
│  Projects                    │
│  Kanban Board                │
│  Authentication              │
└──────────────┬───────────────┘
               │
               │ REST API
               │
               ▼
┌──────────────────────────────┐
│           Backend            │
│                              │
│           Node.js            │
│           Express            │
│                              │
│  Authentication              │
│  Project API                 │
│  Task API                    │
│  Middleware                  │
│  WebSocket Communication     │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│           Database           │
│                              │
│           MongoDB            │
│                              │
│  Users                       │
│  Projects                    │
│  Tasks                       │
└──────────────────────────────┘
```

---

# Database

MongoDB is used as the persistent database for the application.

Mongoose is used on the backend to define schemas and interact with MongoDB.

The main entities include:

* Users
* Projects
* Project Members
* Tasks
* Attachments
* Comments
* Notifications

During the initial REST API implementation, temporary mock data may be used before MongoDB persistence is introduced.

The database implementation will replace the temporary mock data while keeping the REST API contract consistent.

---

# Real-Time Communication

The Kanban board requires real-time communication between connected users.

WebSockets are used to allow changes made by one user to be reflected on other connected clients without requiring a page refresh.

Example:

```text
User A
  │
  │ Moves task
  ▼
Kanban Board
  │
  ▼
WebSocket Server
  │
  ├───────────────► User B
  │
  ├───────────────► User C
  │
  └───────────────► User D
```

Potential real-time events include:

```text
taskCreated
taskUpdated
taskMoved
taskDeleted
```

The exact WebSocket event structure will be documented as the real-time functionality is implemented.

---

# Testing

## Backend API Testing

REST API endpoints should be tested using Bruno.

The Bruno collection is located at:

```text
bruno-api/
```

Before testing:

```bash
cd backend
node server.js
```

Then open the Bruno collection and execute the required requests.

---

## Frontend Testing

Run the frontend development server:

```bash
cd frontend
npm run dev
```

Verify that:

* Pages load correctly.
* Navigation works.
* API requests are successful.
* Authentication works.
* Protected pages behave correctly.
* Kanban operations update correctly.
* Real-time functionality works between multiple clients where implemented.

---

# Troubleshooting

## `npm` is not recognized

Make sure Node.js is installed and available in your system PATH.

Verify:

```bash
node --version
npm --version
```

---

## Dependencies are missing

Run:

```bash
npm install
```

inside the relevant directory.

For the frontend:

```bash
cd frontend
npm install
```

For the backend:

```bash
cd backend
npm install
```

---

## Backend does not start

Make sure you are inside the backend directory:

```bash
cd backend
```

Then run:

```bash
node server.js
```

Check that the required environment variables are present in:

```text
backend/.env
```

---

## Frontend cannot connect to backend

Make sure both servers are running.

Backend:

```text
http://localhost:5000
```

Frontend:

```text
http://localhost:5173
```

Also verify that the frontend is using the correct backend API URL.

---

## Bruno requests fail

Make sure the Express backend is running before sending requests.

Verify the API base URL and request path.

For example:

```text
http://localhost:5000/api/auth/login
```

Also check the request method and required authentication headers.

---

# Contributing

Contributions should follow the project's Git workflow.

1. Update the `development` branch.
2. Create a feature branch.
3. Implement the feature.
4. Test the changes locally.
5. Commit the changes using a meaningful commit message.
6. Push the feature branch.
7. Open a Pull Request targeting `development`.
8. Address review feedback.
9. Merge the Pull Request after approval.

Avoid committing:

* `node_modules/`
* `.env`
* Build output
* IDE-specific files
* Temporary files
* Personal configuration files

---

# Commit Message Convention

The project generally follows conventional commit-style messages.

Examples:

```text
feat: add project creation API
feat(auth): implement JWT authentication
fix: resolve task update validation
chore(backend): initialize Express backend
docs: update API documentation
refactor: simplify task controller
```

Common prefixes:

| Prefix     | Purpose                      |
| ---------- | ---------------------------- |
| `feat`     | New functionality            |
| `fix`      | Bug fix                      |
| `refactor` | Code restructuring           |
| `docs`     | Documentation                |
| `chore`    | Configuration or maintenance |
| `test`     | Tests                        |
| `style`    | Formatting/style changes     |

---

# Documentation

Additional project documentation is available in the `docs/` directory.

### API Documentation

The complete REST API contract is available here:

**[View API Documentation](docs/API.md)**

### API Testing

API requests are maintained in the Bruno collection:

```text
bruno-api/
```

---

# Project Status

The project is currently under active development.

Current development stages include:

* [x] Frontend application structure
* [x] Initial Express backend
* [x] API testing setup with Bruno
* [ ] JWT authentication
* [ ] Project CRUD API
* [ ] Task CRUD API
* [ ] WebSocket-based Kanban updates
* [ ] MongoDB integration
* [ ] Mongoose schemas
* [ ] Client-side caching
* [ ] Offline support
* [ ] Final integration and testing

This checklist should be updated as project milestones are completed.

---

# License

This project is developed as part of an academic software engineering project.

All rights and usage are subject to the requirements and policies of the project team and associated academic institution.
