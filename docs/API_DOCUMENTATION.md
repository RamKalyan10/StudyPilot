# StudyPilot — REST API Reference Documentation

All endpoints are hosted relative to the `/api` prefix (e.g. `http://localhost:5000/api` or deployed base URL).

---

## 1. Authentication & Security

- **Mechanism**: JSON Web Tokens (JWT).
- **Header Format**: `Authorization: Bearer <token>`
- **Token Validity**: 3 days.
- **Rate Limiting**: `/api/auth/*` is limited to **100 requests per 15 minutes** per IP.

---

## 2. API Endpoints Catalog

### 2.1 Health Check

#### `GET /api/health`
Checks server status and uptime.
- **Access**: Public
- **Response `200 OK`**:
  ```json
  {
    "status": "ok",
    "app": "StudyPilot API",
    "uptime": 124.5,
    "timestamp": "2026-11-13T12:00:00.000Z"
  }
  ```

---

### 2.2 Authentication (`/api/auth`)

#### `POST /api/auth/register`
Initiates student registration and dispatches a 6-digit verification code and activation link to the student's email inbox. Access is blocked until email ownership is confirmed.
- **Access**: Public
- **Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@gmail.com",
    "password": "securepassword123"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "message": "Verification email sent! Please check your inbox and enter the 6-digit code to activate your account.",
    "email": "jane@gmail.com",
    "requiresVerification": true
  }
  ```

#### `POST /api/auth/verify-email`
Verifies email ownership using either the 6-digit numeric OTP or URL token. Activates the account and issues a session JWT.
- **Access**: Public
- **Body (Option A - OTP Code)**:
  ```json
  {
    "email": "jane@gmail.com",
    "code": "482910"
  }
  ```
- **Body (Option B - Link Token)**:
  ```json
  {
    "email": "jane@gmail.com",
    "token": "7a9f8b1c4e2d3..."
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Email verified successfully! Welcome to StudyPilot.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6718a1...",
      "name": "Jane Doe",
      "email": "jane@gmail.com",
      "authProvider": "local",
      "isEmailVerified": true,
      "hasPassword": true
    }
  }
  ```

#### `POST /api/auth/resend-verification`
Generates a fresh 6-digit code and resends the verification email.
- **Access**: Public
- **Body**:
  ```json
  {
    "email": "jane@gmail.com"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "A fresh verification code has been dispatched to your email.",
    "email": "jane@gmail.com"
  }
  ```

#### `POST /api/auth/login`
Authenticates credentials. Rejects unverified accounts with HTTP 403.
- **Access**: Public
- **Body**:
  ```json
  {
    "email": "jane@gmail.com",
    "password": "securepassword123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6718a1...",
      "name": "Jane Doe",
      "email": "jane@gmail.com",
      "authProvider": "local",
      "isEmailVerified": true,
      "hasPassword": true
    }
  }
  ```
- **Error Response `403 Forbidden` (Unverified Account)**:
  ```json
  {
    "message": "Your email address is not verified yet. Please enter the verification code sent to your email to access StudyPilot.",
    "emailUnverified": true,
    "email": "jane@gmail.com"
  }
  ```

#### `POST /api/auth/google`
Authenticates Google OAuth 2.0 credential (ID Token) and performs **Intelligent Account Synchronization**:
- If an account with this Gmail address already exists (e.g. registered manually), it automatically links the Google identity and merges access into the exact same study workspace.
- If the account is new, it creates a verified user profile.
- **Access**: Public
- **Body**:
  ```json
  {
    "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFhMmIzY..."
  }
  ```
- **Response `200 OK` / `201 Created`**:
  ```json
  {
    "message": "Successfully signed in with Google! Your account is synchronized.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6718a1...",
      "name": "Jane Doe",
      "email": "jane@gmail.com",
      "avatar": "https://lh3.googleusercontent.com/a/...",
      "authProvider": "both",
      "isEmailVerified": true,
      "hasPassword": true
    }
  }
  ```

#### `POST /api/auth/set-password`
Allows accounts created through Google Sign-In to set a manual password so students can log in using either Google or email/password.
- **Access**: Private (Bearer JWT)
- **Body**:
  ```json
  {
    "password": "myNewPassword123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Password set successfully! You can now log in using either Google or your email and password.",
    "user": {
      "id": "6718a1...",
      "authProvider": "both",
      "hasPassword": true
    }
  }
  ```

#### `GET /api/auth/me`
Retrieves the active student profile.
- **Access**: Private (Bearer JWT)
- **Response `200 OK`**:
  ```json
  {
    "user": {
      "id": "6718a1...",
      "name": "Jane Doe",
      "email": "jane@gmail.com",
      "avatar": "https://lh3.googleusercontent.com/a/...",
      "authProvider": "both",
      "isEmailVerified": true,
      "hasPassword": true
    }
  }
  ```
      "email": "jane@university.edu"
    }
  }
  ```

---

### 2.3 Subjects (`/api/subjects`)

#### `GET /api/subjects`
Retrieves all enrolled subjects for the student.
- **Access**: Private
- **Response `200 OK`**: Array of Subject objects.

#### `POST /api/subjects`
Creates a new course/subject. Optionally accepts syllabus document data to auto-parse on creation.
- **Access**: Private
- **Body**:
  ```json
  {
    "name": "Distributed Systems",
    "color": "#8b7cff",
    "semester": "Semester 5",
    "syllabusText": "Optional raw syllabus string...",
    "syllabusFileBase64": "data:application/pdf;base64,JVBERi0xLj..."
  }
  ```
- **Response `201 Created`**: Created Subject object.

#### `PATCH /api/subjects/:id`
Updates subject details.
- **Access**: Private
- **Body**: `{ "name": "Advanced Distributed Systems", "color": "#38bdf8" }`
- **Response `200 OK`**: Updated Subject object.

#### `DELETE /api/subjects/:id`
Deletes subject and cascade deletes all attached syllabus documents.
- **Access**: Private
- **Response `200 OK`**: `{ "message": "Subject and associated syllabus deleted successfully." }`

---

### 2.4 Tasks (`/api/tasks`)

#### `GET /api/tasks`
Lists all study tasks. Dynamically enriches each task with its calculated `priorityScore` (0.0 to 1.0).
- **Access**: Private
- **Query Params**: `status` (optional: `pending` | `in-progress` | `completed`)
- **Response `200 OK`**:
  ```json
  [
    {
      "_id": "6720b...",
      "title": "Raft Consensus Algorithm",
      "subject": { "_id": "6719a...", "name": "Distributed Systems", "color": "#8b7cff" },
      "type": "topic",
      "deadline": "2026-11-20T18:00:00.000Z",
      "estimatedMinutes": 180,
      "remainingMinutes": 180,
      "importance": 5,
      "difficulty": 4,
      "confidence": 2,
      "priority": 0.825,
      "status": "pending"
    }
  ]
  ```

#### `POST /api/tasks`
Creates a new task.
- **Access**: Private
- **Body**:
  ```json
  {
    "title": "Prepare Lab Assignment 2",
    "subject": "6719a...",
    "deadline": "2026-11-25T23:59:00.000Z",
    "estimatedMinutes": 120,
    "type": "assignment",
    "importance": 4,
    "difficulty": 3,
    "confidence": 3,
    "notes": "Include test cases"
  }
  ```
- **Response `201 Created`**: Created Task object populated with subject.

#### `PATCH /api/tasks/:id`
Updates task attributes or marks completion.
- **Access**: Private
- **Response `200 OK`**: Updated Task object.

#### `DELETE /api/tasks/:id`
Deletes a task.
- **Access**: Private
- **Response `200 OK`**: `{ "message": "Task deleted successfully." }`

---

### 2.5 Availability Windows (`/api/availability`)

#### `GET /api/availability`
Fetches all configured study availability windows sorted chronologically by start time.
- **Access**: Private
- **Response `200 OK`**: Array of Availability objects.

#### `POST /api/availability`
Adds a new availability window.
- **Access**: Private
- **Body**:
  ```json
  {
    "start": "2026-11-14T09:00:00.000Z",
    "end": "2026-11-14T12:00:00.000Z",
    "label": "Morning Study Block"
  }
  ```
- **Response `201 Created`**: Created Availability object.

#### `DELETE /api/availability/:id`
Deletes an availability window.
- **Access**: Private
- **Response `200 OK`**: `{ "message": "Availability window deleted successfully." }`

---

### 2.6 Schedules (`/api/schedules`)

#### `POST /api/schedules/generate`
Generates a fresh study timetable using active tasks and future availability windows.
- **Access**: Private
- **Response `201 Created`**: Schedule object with version, sessions, unscheduled list, and feasibility summary.

#### `POST /api/schedules/reschedule`
Re-runs the scheduling engine adaptively following missed sessions or schedule shifts.
- **Access**: Private
- **Body**: `{ "reason": "Recover missed Saturday sessions" }`
- **Response `201 Created`**: Newly incremented Schedule object.

#### `GET /api/schedules/latest`
Fetches the student's active current schedule.
- **Access**: Private
- **Response `200 OK`**: Most recent Schedule object or `null`.

#### `GET /api/schedules`
Fetches schedule revision history (up to last 20 versions).
- **Access**: Private
- **Response `200 OK`**: Array of Schedule objects.

---

### 2.7 Sessions (`/api/sessions`)

#### `POST /api/sessions/:id/start`
Marks a planned session as `in-progress`.
- **Access**: Private
- **Response `200 OK`**: `{ "schedule": {...}, "session": {...} }`

#### `POST /api/sessions/:id/complete`
Marks a session as `completed`, records actual minutes, and decrements task remaining minutes.
- **Access**: Private
- **Body**:
  ```json
  {
    "actualMinutes": 50,
    "confidenceAfter": 4
  }
  ```
- **Response `200 OK`**: `{ "schedule": {...}, "session": {...}, "task": {...} }`

#### `POST /api/sessions/:id/miss`
Marks a session as `missed` without deducting task minutes.
- **Access**: Private
- **Response `200 OK`**: `{ "message": "Session marked missed...", "schedule": {...}, "session": {...} }`

---

### 2.8 Syllabus (`/api/syllabus`)

#### `POST /api/syllabus/extract-document`
Uploads binary document (PDF, DOCX, TXT, MD) and extracts clean text along with a preview of curriculum units.
- **Access**: Private
- **Body**:
  ```json
  {
    "fileBase64": "data:application/pdf;base64,...",
    "fileName": "DSA_Syllabus.pdf",
    "mimeType": "application/pdf"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "text": "UNIT I: ...",
    "fileName": "DSA_Syllabus.pdf",
    "detectedType": "PDF Document",
    "pages": 4,
    "units": [...],
    "totalUnits": 5,
    "totalTopics": 28
  }
  ```

#### `GET /api/syllabus`
Lists all uploaded course syllabi.
- **Access**: Private

#### `GET /api/syllabus/subject/:subjectId`
Gets the syllabus attached to a specific subject.
- **Access**: Private

#### `POST /api/syllabus`
Creates or updates a subject's syllabus document.
- **Access**: Private

#### `POST /api/syllabus/:id/create-tasks`
Automatically converts syllabus units into scheduled study tasks with staggered deadlines.
- **Access**: Private
- **Body**: `{ "unitNumbers": [1, 2, 3] }` (optional filter array)
- **Response `201 Created`**:
  ```json
  {
    "message": "Successfully created 3 study tasks from syllabus!",
    "tasks": [...]
  }
  ```

---

### 2.9 Analytics (`/api/analytics`)

#### `GET /api/analytics/progress`
Aggregates overall student study metrics.
- **Access**: Private
- **Response `200 OK`**:
  ```json
  {
    "totalTasks": 12,
    "completedTasks": 5,
    "pendingTasks": 7,
    "completionRate": 42,
    "actualStudyMinutes": 250,
    "latestPlannedMinutes": 600,
    "latestSchedule": {
      "totalRequestedMinutes": 600,
      "scheduledMinutes": 600,
      "unscheduledMinutes": 0,
      "conflicts": 0,
      "feasible": true
    },
    "bySubject": [
      {
        "subject": "Data Structures",
        "total": 6,
        "completed": 3,
        "remainingMinutes": 180
      }
    ],
    "scheduleVersions": 3
  }
  ```

