# StudyPilot — Full-Stack MVP

StudyPilot is an adaptive study planning application for the FSD-1 and FSD-2 capstone.

## Features
- Student registration and login (JWT)
- Subject and task CRUD
- Priority scoring using urgency, importance, difficulty and confidence
- Greedy schedule generation with availability windows and daily workload limits
- Missed/completed study session tracking
- Adaptive rescheduling of unfinished sessions
- Workload feasibility warnings and schedule version history
- Dashboard analytics

## Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: bcryptjs + JSON Web Tokens

## Requirements
- Node.js 20+ recommended
- MongoDB local instance or MongoDB Atlas connection string

## Run locally
1. Copy `.env.example` to `server/.env` and set `MONGODB_URI` and `JWT_SECRET`.
2. In a terminal:
   ```bash
   cd server
   npm install
   npm run dev
   ```
3. In another terminal:
   ```bash
   cd client
   npm install
   npm run dev
   ```
4. Open the URL printed by Vite (usually http://localhost:5173).
5. Register a new account and add subjects/tasks. Set availability before generating a schedule.

## API overview
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET/POST /api/subjects`, `PATCH/DELETE /api/subjects/:id`
- `GET/POST /api/tasks`, `PATCH/DELETE /api/tasks/:id`
- `GET/POST /api/availability`
- `POST /api/schedules/generate`, `POST /api/schedules/reschedule`, `GET /api/schedules/latest`, `GET /api/schedules`
- `POST /api/sessions/:id/complete`, `POST /api/sessions/:id/miss`, `POST /api/sessions/:id/start`
- `GET /api/analytics/progress`

## Important implementation notes
- Times are stored as ISO dates. Availability entries are explicit date-time windows.
- Priority scores are heuristic, not scientifically validated predictions.
- The greedy scheduler is a baseline and does not guarantee a globally optimal schedule.
- A generated schedule can leave tasks unscheduled; the API returns these tasks and a feasibility summary rather than pretending the plan is complete.
- For production, add rate limiting, email verification, refresh-token strategy, CSRF protections appropriate to your auth storage, stronger audit logging, and more extensive tests.

## FSD-1 adaptation
Use the `client` as the interface reference and implement the same task/priority/scheduling concepts with HTML, CSS, Bootstrap and vanilla JavaScript using mock data.

## Project structure
```
studypilot/
  client/   React UI
  server/   Express API, Mongoose models, scheduler services
```

## FSD-1 standalone prototype
Open `fsd1-prototype/index.html` directly in a modern browser. It uses vanilla HTML/CSS/JavaScript and localStorage (no server needed). It demonstrates task creation, priority scoring, a simulated schedule, task completion and a basic recovery action. This is a teaching prototype; its schedule is intentionally simpler than the FSD-2 backend engine.
