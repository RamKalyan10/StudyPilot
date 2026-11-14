# StudyPilot — Codebase & Developer Guide

## 1. Project Directory Structure

```
FSDIILab/
├── docs/                               # Comprehensive Technical & Internal Documentation
│   ├── ARCHITECTURE.md                 # System architecture, scheduling math & algorithms, ERD
│   ├── API_DOCUMENTATION.md            # REST API reference catalog and request/response schemas
│   └── CODEBASE_GUIDE.md               # Directory breakdown, coding standards, dev guide (this file)
│
├── client/                             # React 18 + Vite Frontend Application
│   ├── public/                         # Static assets (favicons, icons)
│   ├── src/
│   │   ├── components/                 # Modals and major UI feature views
│   │   │   ├── AvailabilityView.jsx    # Dedicated study window management view
│   │   │   ├── CalendarView.jsx        # Multi-view timetable (Week, Month, Agenda)
│   │   │   ├── InsightsView.jsx        # Performance and study analytics dashboard
│   │   │   ├── SmartStudyGuide.jsx     # Dynamic contextual onboarding & suggestions banner
│   │   │   ├── StudyTimer.jsx          # Pomodoro / focus study timer modal & floating badge
│   │   │   ├── SubjectsView.jsx        # Course cards, progress bars & syllabus shortcuts
│   │   │   ├── SyllabusModal.jsx       # Document upload, extraction preview & task generator
│   │   │   └── TasksView.jsx           # Task Kanban board and priority-filtered list
│   │   ├── utils/
│   │   │   └── docExtractor.js         # Client-side FileReader & server extraction helper
│   │   ├── api.js                      # Centralized API fetch wrapper and JWT token manager
│   │   ├── App.jsx                     # Top-level state orchestrator, modals, and navigation
│   │   ├── main.jsx                    # React 18 DOM mount point with StrictMode
│   │   └── styles.css                  # Modern UI stylesheet with CSS variables & responsive layout
│   ├── index.html                      # HTML5 entrypoint
│   ├── package.json                    # Client dependencies & scripts (Vite, Lucide React)
│   ├── vercel.json                     # Vercel SPA routing rewrite rules
│   └── vite.config.js                  # Vite bundler configuration
│
├── server/                             # Express.js REST API & Backend Services
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js                 # JWT verification & request user decoration
│   │   ├── models/                     # Mongoose schemas for MongoDB
│   │   │   ├── Availability.js         # Free study time windows model
│   │   │   ├── Schedule.js             # Generated timetable snapshot & session schema
│   │   │   ├── Subject.js              # Enrolled academic course model
│   │   │   ├── Syllabus.js             # Structured course curriculum & unit model
│   │   │   ├── Task.js                 # Academic task, deadline & priority rating model
│   │   │   └── User.js                 # Student credentials & workload preferences
│   │   ├── routes/                     # Domain controller route handlers
│   │   │   ├── analytics.js            # Study progress aggregation endpoint
│   │   │   ├── auth.js                 # Student registration, login, and /me profile
│   │   │   ├── availability.js         # Availability window CRUD
│   │   │   ├── schedules.js            # Generation & adaptive re-scheduling endpoints
│   │   │   ├── sessions.js             # Study session state transitions & task decrements
│   │   │   ├── subjects.js             # Subject CRUD & initial syllabus attachment
│   │   │   ├── syllabus.js             # Syllabus extraction, CRUD, and task creation
│   │   │   └── tasks.js                # Task CRUD with dynamic priority scoring
│   │   ├── services/                   # Core business logic & algorithmic engines
│   │   │   ├── docParser.js            # Multi-format document parser (pdf-parse, mammoth)
│   │   │   ├── scheduler.js            # Heuristic priority formula & greedy scheduler
│   │   │   └── syllabusParser.js       # Syllabus text cleaner, regex parser & heuristics
│   │   ├── utils/
│   │   │   └── asyncHandler.js         # Async Promise rejection wrapper for Express routes
│   │   └── app.js                      # Express application entry, CORS, rate limits, DB setup
│   ├── .env.example                    # Environment variable template for server
│   └── package.json                    # Server dependencies (Express, Mongoose, JWT, pdf-parse)
│
├── package.json                        # Root workspace scripts for monorepo operations
├── sample_syllabus.md                  # Sample Markdown syllabus for testing
├── sample_syllabus.pdf                 # Sample PDF syllabus for testing
└── README.md                           # Main repository entry document
```

---

## 2. Coding Conventions & Best Practices

1. **Modern JavaScript (ES Modules)**:
   - Always use standard `import` / `export` syntax (both in client and server with `"type": "module"`).
2. **Asynchronous Route Handling**:
   - Wrap all async Express route handlers with `asyncHandler(...)` located in `server/src/utils/asyncHandler.js`. Do not write boilerplate `try/catch` in every route.
3. **Mongoose Schema & Indexing**:
   - Compound indexes should be explicitly defined (e.g., `{ user: 1, version: -1 }` on `Schedule`, `{ user: 1, name: 1 }` on `Subject`).
   - Use Mongoose lifecycle hooks (e.g., `pre('save')` or `pre('validate')`) for field defaults and chronological constraints.
4. **JSDoc Documentation**:
   - All modules, exported functions, and React components must include clean JSDoc block comments detailing purpose, parameters, return types, and business assumptions.
5. **State Management**:
   - React state in `App.jsx` handles global student models (`user`, `tasks`, `subjects`, `availability`, `schedule`).
   - Components receive state and action handlers via clean, documented props.
6. **API Client & Authentication**:
   - All network requests from the client must go through `client/src/api.js`. This guarantees that Bearer tokens are attached consistently and errors are normalized into readable user messages.

---

## 3. Environment Configuration

### Server Environment (`server/.env`)
Create `server/.env` based on `server/.env.example`:
```ini
# Port where Express listens
PORT=5000

# MongoDB Connection URI (Local instance or MongoDB Atlas)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/studypilot?retryWrites=true&w=majority

# Secret key used to sign and verify JSON Web Tokens (min 32 characters recommended)
JWT_SECRET=super_secret_jwt_key_here

# Allowed origins for CORS (comma-separated or wildcard *)
CLIENT_ORIGIN=http://localhost:5173,http://localhost:3000
```

### Client Environment (`client/.env`)
Optional during local development (defaults to `http://localhost:5000/api`):
```ini
VITE_API_URL=http://localhost:5000/api
```

---

## 4. Local Development Workflow

### Starting the Server
```bash
cd server
npm install
npm run dev     # Starts server with nodemon auto-reload on port 5000
```

### Starting the Client
```bash
cd client
npm install
npm run dev     # Launches Vite development server (default: http://localhost:5173)
```

### Building for Production
```bash
# Verify client build
cd client
npm run build

# Syntax check backend files
node --check server/src/app.js
```

