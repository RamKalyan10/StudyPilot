# StudyPilot — Intelligent Adaptive Study Planner

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)](https://mongoosejs.com/)

**StudyPilot** is an intelligent, full-stack adaptive study planner engineered for university students. Rather than relying on rigid calendars or manual to-do lists, StudyPilot calculates dynamic multi-factor priority scores and greedily allocates study blocks into student-defined availability windows while strictly respecting deadlines, daily study caps, and rest intervals.

---

## 📚 Technical Documentation Suite

For deep internal documentation, design diagrams, and architectural breakdowns, please refer to the dedicated `docs/` repository:

| Document | Purpose & Contents |
| :--- | :--- |
| **[System Architecture Guide](file:///D:/projects%20and%20their%20versions/FSDIILab/docs/ARCHITECTURE.md)** | High-level architecture, Mermaid diagrams, scheduling engine math, heuristic formulas, syllabus parsing pipeline, and Database ERD. |
| **[REST API Reference](file:///D:/projects%20and%20their%20versions/FSDIILab/docs/API_DOCUMENTATION.md)** | Complete endpoint specifications, authentication schemas, request body shapes, status codes, and JSON response examples. |
| **[Codebase & Developer Guide](file:///D:/projects%20and%20their%20versions/FSDIILab/docs/CODEBASE_GUIDE.md)** | Detailed directory tree, component responsibilities, coding conventions, JSDoc rules, and local development setup. |

---

## ⚡ Core Features

- **🔐 Student Authentication & Workload Profiles**: Secure registration, login, and token-based authentication (JWT + bcryptjs). Personalized daily study limits (preventing burnout) and preferred session durations.
- **📚 Color-Coded Academic Course Hub**: Organize courses, color badges, semesters, and associated study goals.
- **📄 Intelligent Syllabus Ingestion & Document Parser**: Upload PDF, DOCX, Markdown, or plain text syllabus outlines. Automatic extraction of curriculum units, key terms, estimated hours, and difficulty rating.
- **✨ One-Click Task Generator**: Instantly transform syllabus modules into scheduled study tasks with staggered deadlines.
- **🎯 Multi-Factor Heuristic Priority Scoring**: Dynamically scores tasks ($0.0$ to $1.0$) balancing deadline urgency, user importance, difficulty rating, and inverted confidence gap.
- **🗓️ Greedy Interval Scheduling Engine**: Packs study sessions into custom availability windows, maintaining daily caps and 5-minute breather buffers.
- **⏱️ Focus / Pomodoro Study Timer**: Built-in countdown timer with pause/resume, minimization to floating badge, and auto-sync of completed study minutes to database.
- **🔄 Missed Session Recovery**: Detects skipped or interrupted sessions and triggers adaptive rescheduling to protect academic deadlines.
- **📊 Study Analytics Dashboard**: Visualizes completion percentage, study hour investments, and subject-wise progress breakdowns.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Lucide React Icons, Native HTML5 Audio API, CSS3 Variables |
| **Backend** | Node.js (ES Modules), Express 4.x, Express Rate Limit, CORS |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Document Processing** | `pdf-parse`, `mammoth` (DOCX), FileReader API |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- A running MongoDB instance or MongoDB Atlas connection string

### 1. Backend Setup
```bash
cd server
npm install

# Configure environment variables
cp .env.example .env
# Edit server/.env and supply MONGODB_URI and JWT_SECRET

# Start API server in development mode
npm run dev
```
The server will start listening at `http://localhost:5000` (or configured `PORT`).

### 2. Frontend Setup
```bash
cd client
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📂 Project Structure Overview

```
FSDIILab/
├── docs/                     # System architecture, API docs, and developer guide
├── client/                   # Vite + React 18 Single Page Application
│   ├── src/
│   │   ├── components/       # Calendar, Tasks, Availability, Subjects, Timer, Modals
│   │   ├── utils/            # Document extraction helpers
│   │   ├── api.js            # Fetch wrapper & JWT token manager
│   │   ├── App.jsx           # Main orchestrator & application state
│   │   └── styles.css        # Responsive design & theme styles
├── server/                   # Express REST API
│   ├── src/
│   │   ├── middleware/       # JWT authentication middleware
│   │   ├── models/           # Mongoose schemas (User, Task, Subject, Schedule, etc.)
│   │   ├── routes/           # Domain controllers & route endpoints
│   │   ├── services/         # Greedy scheduler & document parsing services
│   │   ├── utils/            # Async handler wrapper
│   │   └── app.js            # Express app entry & database connection
└── package.json              # Monorepo root configuration
```
