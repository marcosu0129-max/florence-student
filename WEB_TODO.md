# Florence Student Web App — TODO / Audit

## Priority 1 — High (Must Fix: broken demo flows)

- [x] **My Courses / Saved courses page** (`/profile/favorites` or `/profile/courses`)
  - No real page exists; routes back to `Profile` which shows static data.
  - Need `MyCourses.tsx` page listing saved courses with course cards.
  - Save course IDs in `localStorage` key `florence:saved-course-ids`.
  - CourseDetail heart button must read/write that key; persist across refresh.

- [x] **Review submission in demo mode** (no auth required)
  - `AddReview.tsx` currently blocks on no session (`"Devi effettuare il login..."`).
  - `createReview(...)` service in `dataService.ts` should save locally via `localStorage` key `florence:demo-reviews` when no Supabase session exists.
  - Reviews must survive navigation/refresh — merge local reviews into `fetchReviewsByCourse`, `fetchAllReviews`, `fetchUserReviews`.

- [x] **My Reviews page** (`/profile/reviews`)
  - Currently shows `fetchAllReviews().slice(0, 4)` — all reviews, not current user.
  - Must show demo user's own reviews (from localStorage) + Supabase reviews if logged in.

- [x] **Review loop entry points** — make "Scrivi recensione" FAB on CourseDetail accessible to unauthenticated users, and surface it from My Courses page.

## Priority 2 — Medium (Improve community feel)

- [ ] **Professor review submission** — currently no way to review a professor directly; add a "Recensisci il docente" action from `ProfessorDetail`.
- [ ] **Helpful votes** — "Utile" button on review cards is display-only; needs `markHelpful(reviewId)` service + localStorage.
- [ ] **Review editing** — `MyReviews` shows "Modifica" link but edit flow is not wired up.
- [ ] **Community dashboard** — `/reviews` page could show trending/top-rated courses, most active reviewers.
- [ ] **Empty states** — many pages show blank containers instead of helpful sticky-note empty states with CTAs.

## Priority 3 — Low (Polish & future)

- [ ] **Profile page** — uses hardcoded "Mario" user; should read from Supabase profile or localStorage demo user.
- [ ] **Notifications** — static page, no real notification system.
- [ ] **Materials upload** — FAB on `/materials` not wired up.
- [ ] **Settings** — static page.
- [ ] **教授评分聚合** — `fetchProfessors` uses hardcoded `rating: 4.0` instead of computing from `reviews` table.
- [ ] **Performance** — `fetchCourses()` is called repeatedly on every navigation (no caching layer); consider a lightweight in-memory cache.
- [ ] **Responsive polish** — some pages (CourseDetail, ProgramDetail) overflow on mobile viewports.

## Done

- [x] Supabase integration (courses, professors, reviews — read)
- [x] RLS updated for public read on courses/professors
- [x] Home, Courses, CourseDetail, Professors, ProfessorDetail, AllReviews, ProgramDetail pages connected to Supabase

---

*Last updated: 2026-05-09 (follow-up fix)*
