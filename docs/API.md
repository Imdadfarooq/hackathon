# API Reference — Progressive Student Dashboard

Base URL (development): **`http://localhost:5000/api`**

All request/response bodies are JSON unless noted (CSV exports return `text/csv`).

---

## Table of contents
- [Authentication](#authentication)
- [Error format](#error-format)
- [Rate limiting](#rate-limiting)
- [Auth endpoints](#auth-endpoints)
- [Dashboard endpoints (student)](#dashboard-endpoints-student)
- [Recommendation endpoint (student)](#recommendation-endpoint-student)
- [Course & lesson endpoints](#course--lesson-endpoints)
- [Activity endpoints (student)](#activity-endpoints-student)
- [Mentor endpoints](#mentor-endpoints)
- [Health](#health)

---

## Authentication

The API issues a **JWT** on register/login. Send it on subsequent requests in
**either** of two ways:

- `Authorization: Bearer <token>` header (used by the SPA), **or**
- the `token` httpOnly cookie (set automatically on login/register).

Tokens expire after `JWT_EXPIRES_IN` (default `7d`).

Roles: `student` and `mentor`. Endpoints are guarded by role — a mismatch returns
`403`.

---

## Error format

Every error is returned with an appropriate HTTP status and a consistent envelope:

```json
{
  "error": {
    "message": "Human-readable message",
    "details": [{ "field": "email", "message": "A valid email is required" }]
  }
}
```

`details` is present only for validation errors (`400`). Server errors (`5xx`)
include a `stack` field in non-production environments.

| Status | Meaning |
|---|---|
| `400` | Validation failed / bad input |
| `401` | Missing or invalid token / bad credentials |
| `403` | Authenticated but wrong role |
| `404` | Resource not found |
| `409` | Conflict (e.g. email already registered) |
| `429` | Too many requests (rate limited) |
| `500` | Unexpected server error |

---

## Rate limiting

- Global: **300 requests / 15 min** per IP on `/api/*`.
- Auth: **30 requests / 15 min** per IP on `/api/auth/login` and `/api/auth/register`.

(Rate limiting is disabled under the test environment.)

---

## Auth endpoints

### `POST /api/auth/register`
Create a student or mentor account.

**Request**
```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "Password123",
  "role": "student"
}
```
`role` is optional and defaults to `student`. `password` must be ≥ 6 chars.

**Response `201`**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "66b0f1...",
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "role": "student",
    "mentor": null,
    "avatarColor": "#6366f1",
    "lastLoginAt": "2026-08-08T05:00:00.000Z",
    "createdAt": "2026-08-08T05:00:00.000Z"
  }
}
```
Errors: `400` validation, `409` email already exists.

---

### `POST /api/auth/login`
**Request**
```json
{ "email": "student@demo.io", "password": "Password123" }
```
**Response `200`** — same shape as register (`token` + `user`).
Errors: `401` invalid credentials.

---

### `POST /api/auth/logout`
Clears the auth cookie. **Response `200`** `{ "message": "Logged out" }`.

---

### `GET /api/auth/me`
Returns the current authenticated user. Requires auth.

**Response `200`**
```json
{ "user": { "id": "…", "name": "Ava Student", "email": "student@demo.io", "role": "student", "avatarColor": "#6366f1" } }
```

---

## Dashboard endpoints (student)

All require a **student** token.

### `GET /api/dashboard/summary`
KPI totals for the dashboard header.

**Response `200`**
```json
{
  "totalTimeMinutes": 931,
  "totalTimeHours": 15.5,
  "completedLessons": 30,
  "totalCourses": 4,
  "activeCourses": 4,
  "completedCourses": 0,
  "activeDays": 25,
  "overallProgress": 73
}
```

---

### `GET /api/dashboard/course-progress`
Per-course progress rows.

**Response `200`**
```json
{
  "courses": [
    {
      "enrollmentId": "…",
      "courseId": "…",
      "title": "React from Scratch",
      "slug": "react-from-scratch",
      "category": "Programming",
      "difficulty": "intermediate",
      "color": "#06b6d4",
      "status": "active",
      "completedLessons": 10,
      "totalLessons": 12,
      "progress": 83,
      "timeMinutes": 316,
      "enrolledAt": "2026-07-05T…",
      "lastActivityAt": "2026-08-07T…"
    }
  ]
}
```

---

### `GET /api/dashboard/time-series`
Daily study minutes for the trend chart. Returns a **dense** series (missing days
filled with zeros).

**Query params**: `days` (7–365, default `30`).

**Response `200`**
```json
{
  "days": 30,
  "series": [
    { "date": "2026-07-10", "minutes": 42, "lessonsCompleted": 2, "events": 5 },
    { "date": "2026-07-11", "minutes": 0,  "lessonsCompleted": 0, "events": 0 }
  ]
}
```

---

### `GET /api/dashboard/distribution`
Donut chart data.

**Query params**: `by` = `time` (default) or `status`.

**Response `200` (by=time)**
```json
{
  "by": "time",
  "data": [
    { "courseId": "…", "title": "React from Scratch", "color": "#06b6d4", "category": "Programming", "minutes": 316 }
  ]
}
```
**Response `200` (by=status)**
```json
{ "by": "status", "data": [ { "status": "active", "count": 4 }, { "status": "completed", "count": 0 }, { "status": "paused", "count": 0 } ] }
```

---

### `GET /api/dashboard/export`
CSV download (stretch feature).

**Query params**: `type` = `progress` (default) or `timeseries`; `days` (for timeseries).

**Response `200`** — `Content-Type: text/csv`, `Content-Disposition: attachment`.
```csv
Course,Category,Difficulty,Status,Completed Lessons,Total Lessons,Progress (%),Time Spent (min)
React from Scratch,Programming,intermediate,active,10,12,83,316
```

---

## Recommendation endpoint (student)

### `GET /api/recommendations`
Adaptive next-step recommendations.

**Query params**: `limit` (1–20, default `6`).

**Response `200`**
```json
{
  "generatedAt": "2026-08-08T05:10:00.000Z",
  "adaptiveSignal": {
    "avgQuizScore": 82,
    "targetDifficulty": "advanced",
    "favoredCategories": ["Programming", "Computer Science", "Data Science"]
  },
  "recommendations": [
    {
      "type": "continue",
      "priority": 183,
      "reason": "You are 83% through \"React from Scratch\". Pick up where you left off.",
      "course": { "id": "…", "title": "React from Scratch", "slug": "react-from-scratch", "color": "#06b6d4", "category": "Programming" },
      "lesson": { "id": "…", "title": "Performance & Memoization", "order": 11, "estimatedMinutes": 15 }
    },
    {
      "type": "explore",
      "priority": 42,
      "reason": "Popular in Data Science, a topic you spend the most time on — matched to your advanced level based on quiz results.",
      "course": { "id": "…", "title": "Python for Data Analysis", "slug": "python-for-data-analysis", "color": "#10b981", "category": "Data Science", "difficulty": "intermediate" },
      "lesson": null
    }
  ]
}
```
`type` ∈ `continue | revisit | explore`.

---

## Course & lesson endpoints

Require auth (any role).

### `GET /api/courses`
Course catalog annotated with the caller's enrollment state.

**Response `200`**
```json
{
  "courses": [
    {
      "id": "…", "title": "JavaScript Fundamentals", "slug": "javascript-fundamentals",
      "description": "Master the building blocks…", "category": "Programming",
      "difficulty": "beginner", "tags": ["javascript","web","basics"], "color": "#f59e0b",
      "totalLessons": 10, "estimatedMinutes": 220,
      "enrolled": true, "status": "active", "completedLessons": 7
    }
  ]
}
```

---

### `GET /api/courses/:id`
Course detail with ordered lessons and per-lesson completion state.

**Response `200`**
```json
{
  "course": { "id": "…", "title": "…", "totalLessons": 10, "estimatedMinutes": 220, "…": "…" },
  "enrollment": { "id": "…", "status": "active", "completedLessons": 7, "totalTimeMinutes": 175 },
  "lessons": [
    { "id": "…", "title": "Values, Variables & Types", "order": 1, "summary": "…", "estimatedMinutes": 18, "difficulty": "beginner", "completed": true }
  ]
}
```
`enrollment` is `null` if the caller is not enrolled.

---

### `GET /api/courses/:id/lessons/:lessonId`
Full lesson content.

**Response `200`**
```json
{ "lesson": { "id": "…", "course": "…", "title": "…", "order": 1, "summary": "…", "content": "# …markdown…", "estimatedMinutes": 18, "difficulty": "beginner", "completed": true } }
```

---

### `POST /api/courses/:id/enroll`
Enroll the current student (idempotent). Requires **student**.

**Response `201`**
```json
{ "enrollment": { "id": "…", "course": "…", "status": "active", "enrolledAt": "…" } }
```

---

## Activity endpoints (student)

Require a **student** token.

### `POST /api/activities`
Record an activity event. This is the single write-path that also updates
enrollment progress and time counters, auto-enrolls on first interaction, and
auto-completes a course when all lessons are done.

**Request**
```json
{
  "type": "lesson_completed",
  "courseId": "66b0…",
  "lessonId": "66b0…",
  "durationMinutes": 18,
  "score": null,
  "occurredAt": "2026-08-08T05:00:00.000Z",
  "meta": {}
}
```
`type` ∈ `lesson_started | lesson_completed | quiz_attempt | quiz_passed | video_watched | login`.
`courseId`/`lessonId`/`score`/`occurredAt`/`meta` are optional. If only `lessonId`
is given, the course is inferred from the lesson.

**Response `201`**
```json
{ "event": { "id": "…", "type": "lesson_completed", "course": "…", "lesson": "…", "durationMinutes": 18, "score": null, "occurredAt": "…" } }
```
Errors: `400` invalid `type` / unknown course or lesson.

---

### `GET /api/activities`
Recent activity feed for the current student.

**Query params**: `limit` (1–100, default `20`), `courseId` (optional filter).

**Response `200`**
```json
{
  "activities": [
    { "id": "…", "type": "quiz_passed", "course": { "id": "…", "title": "…", "color": "#8b5cf6" }, "lesson": { "id": "…", "title": "Graphs & BFS/DFS", "order": 7 }, "durationMinutes": 0, "score": 91, "occurredAt": "…" }
  ]
}
```

---

## Mentor endpoints

Require a **mentor** token. A mentor may only access students where
`student.mentor === mentor.id` (else `403`/`404`).

### `GET /api/mentor/students`
Cohort roster with per-student summary and a cohort roll-up.

**Response `200`**
```json
{
  "students": [
    {
      "id": "…", "name": "Ava Student", "email": "student@demo.io", "avatarColor": "#6366f1",
      "lastLoginAt": "…",
      "totalTimeMinutes": 931, "totalTimeHours": 15.5, "completedLessons": 30,
      "totalCourses": 4, "activeCourses": 4, "completedCourses": 0, "activeDays": 25, "overallProgress": 73
    }
  ],
  "cohort": { "studentCount": 5, "totalTimeHours": 47.8, "completedLessons": 95, "activeCourses": 11, "avgProgress": 56 }
}
```

---

### `GET /api/mentor/students/:studentId`
Deep view of one student: summary + course progress + trend + distribution.

**Query params**: `days` (7–365, default `30`).

**Response `200`**
```json
{
  "student": { "id": "…", "name": "Ava Student", "email": "student@demo.io", "avatarColor": "#6366f1", "lastLoginAt": "…" },
  "summary": { "…": "same shape as /dashboard/summary" },
  "courses": [ { "…": "same shape as /dashboard/course-progress rows" } ],
  "timeSeries": [ { "date": "2026-07-10", "minutes": 42, "lessonsCompleted": 2, "events": 5 } ],
  "distribution": [ { "courseId": "…", "title": "…", "color": "#06b6d4", "category": "Programming", "minutes": 316 } ]
}
```
Errors: `403` student not assigned to this mentor, `404` unknown student.

---

### `GET /api/mentor/students/:studentId/export`
CSV of one student's course progress. **Response `200`** — `text/csv` attachment.

---

## Health

### `GET /api/health`
No auth. **Response `200`** `{ "status": "ok", "timestamp": "…" }`.

---

## cURL quickstart

```bash
# Login and capture the token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"student@demo.io","password":"Password123"}' | jq -r .token)

# Summary
curl -s http://localhost:5000/api/dashboard/summary -H "Authorization: Bearer $TOKEN" | jq

# Time-series (last 30 days)
curl -s "http://localhost:5000/api/dashboard/time-series?days=30" -H "Authorization: Bearer $TOKEN" | jq

# Recommendations
curl -s http://localhost:5000/api/recommendations -H "Authorization: Bearer $TOKEN" | jq

# Export progress CSV
curl -s "http://localhost:5000/api/dashboard/export?type=progress" -H "Authorization: Bearer $TOKEN" -o progress.csv
```
