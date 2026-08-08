# Screenshots

Captured against the seeded demo data (student `student@demo.io`, mentor `mentor@demo.io`).

## Desktop (1440px)

| File | View |
|---|---|
| `01-login.png` | Login screen with one-click demo accounts |
| `02-student-dashboard.png` | Student dashboard — KPIs, trend chart, donut, recommendations, activity feed |
| `03-courses.png` | Course catalog with enrollment/progress state |
| `04-course-detail.png` | Course detail with lessons and "mark complete" |
| `06-mentor-cohort.png` | Mentor cohort — roll-up KPIs + student roster |
| `07-mentor-student-detail.png` | Mentor's per-student deep dive with charts |
| `11-course-pdf-student.png` | Student viewing a mentor-uploaded PDF inline |
| `12-course-pdf-mentor.png` | Mentor uploading / managing course PDFs |
| `13-lesson-reader.png` | In-app lesson reader rendering full markdown content |

## Responsive

| File | View |
|---|---|
| `05-mobile-dashboard.png` | Student dashboard at 375px — cards + charts stack to one column |
| `08-mobile-menu.png` | Mobile hamburger navigation panel |
| `09-mobile-mentor.png` | Mentor cohort at 375px — roster table scrolls within its card |
| `10-tablet-dashboard.png` | Student dashboard at 768px (tablet) — 2×2 KPIs, stacked charts |

All charts are rendered with Recharts' `ResponsiveContainer`, so they reflow to
any width. The layout uses CSS grid/flex with breakpoints at 900px, 640px
(navbar → hamburger), 560px, and 380px.
