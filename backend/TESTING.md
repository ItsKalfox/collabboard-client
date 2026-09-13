# Server-side Automated Testing Suite Documentation

## Overview
The CollabBoard backend features an automated integration and regression testing suite built using **Jest**, **Supertest**, and **mongodb-memory-server**. All tests run natively with ECMAScript Modules (`"type": "module"`).

---

## Key Testing Capabilities
1. **Isolated In-Memory Database**:
   - Ephemeral MongoDB instances instantiated on-demand via `mongodb-memory-server`.
   - Collections are cleared between individual tests to ensure zero cross-test state leakage.
2. **Optimistic Concurrency Control (OCC) Verification**:
   - Real-world simulation of simultaneous multi-user updates.
   - Verification of `409 Conflict` status when stale document versions (`__v`) are submitted.
   - Verification of resolution mechanisms (`force: true` override and fresh version refetch).
3. **Authentication & Authorization**:
   - JWT validation (missing token, malformed format, expired token, non-existent user).
   - Project and task resource permission enforcement (`403 Forbidden`).
4. **Endpoint Coverage**:
   - User registration, login, profile management, and OTP password reset.
   - Project lifecycle, member management, and pagination.
   - Kanban task workflows, status transitions, and subtasks.
   - Dashboard analytics and timeline aggregations.

---

## Test Commands

### Run all tests:
```bash
npm test
```

### Run tests in watch mode:
```bash
npm run test:watch
```

### Generate test coverage report:
```bash
npm run test:coverage
```

---

## Test Directory Structure
```
backend/
├── jest.config.js
├── tests/
│   ├── setup/
│   │   └── db.js                  # In-memory MongoDB lifecycle management
│   ├── helpers/
│   │   └── authHelper.js          # User creation and JWT token helpers
│   └── integration/
│       ├── health.test.js         # Health check and error middleware
│       ├── auth.test.js           # Registration and login authentication
│       ├── account.test.js        # Profile updates and password reset
│       ├── authorization.test.js  # JWT and role-based permissions (401/403)
│       ├── projects.test.js       # Project CRUD and member management
│       ├── tasks.test.js          # Kanban task workflows
│       ├── concurrency.test.js    # OCC conflict detection (409) & resolution
│       ├── subtasks.test.js       # Subtask management
│       └── dashboard.test.js      # Dashboard metrics & analytics
```
