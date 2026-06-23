# SYLLABUS Technical Project Report

## 1. Project Overview

SYLLABUS is a static browser-based KIU academic catalogue for students who need course information before enrollment. It solves the problem of scattered course knowledge by centralizing course descriptions, prerequisites, assessment details, professor pages, student reviews, ratings, helpful votes, and student-uploaded materials. The project has five HTML pages (`index.html`, `course.html`, `professors.html`, `professor.html`, `about.html`), shared and page-specific CSS, shared JavaScript helpers, page-specific JavaScript modules, and JSON data files under `/data/`. It has no backend, framework, or build step.

## 2. File & Architecture Summary

### HTML Pages

- `index.html`: Homepage and course catalogue shell; contains hero, filters, search input, course grid container, header, and footer.
- `course.html`: Course detail page shell; contains poster, rating widget, materials area, course detail placeholders, review form, reviews list, and related courses container.
- `professors.html`: Professor catalogue shell; contains professor search and the professor grid container.
- `professor.html`: Individual professor page shell; contains professor biography placeholders and the professor course grid.
- `about.html`: Static explanatory page describing the project and student workflow.

### CSS Files

- `style.css`: Global design system, variables, reset, typography, header, catalogue cards, professor cards, footer, auth modal, and shared responsive rules.
- `course.css`: Course detail layout, poster column, rating stars, materials panel, prerequisite/assessment styling, reviews, helpful button states, and related-course cards.
- `professor.css`: Individual professor profile layout, large professor image, biography column, course grid layout, and empty biography placeholder styling.
- `about.css`: About page sections, feature cards, visual cards, problem grid, and how-it-works timeline.

### JavaScript Files

- `js/app.js`: Shared utilities and global behavior: escaping HTML, loading JSON data, shared semester chips, localStorage helpers, simulated auth modal/session, ratings storage, average-rating calculation, auth header injection, and shared event dispatching.
- `js/catalogue.js`: Renders the fetched course catalogue, handles search/filter/sort/semester chips, and displays live average rating summaries per course.
- `js/course.js`: Renders a course detail page from JSON, handles reviews, logged-in rating, average rating, helpful votes, local course materials, and related courses.
- `js/professors.js`: Renders all professor cards and professor search results from JSON data.
- `js/professor.js`: Renders one professor detail page and the courses attached to that professor.

### Data Files

- `data/courses.json`: Course records keyed by slug. Each record contains title, department, degree, code, credits, professor, poster image path, description, prerequisites, assessment, workflow, materials, related courses, and semester list.
- `data/professors.json`: Professor records with name, slug, match names, department, biography, photo URL/path, and explicit course slug assignments.

### Assets

- `/assets/*.png`: Local course poster images used by catalogue cards and course detail pages.
- `assets/zaalberiashvili.jpg`: Local professor image fallback for Zaal Beriashvili.

## 3. Feature Inventory

### Course Catalogue

- User perspective: Users see all courses as poster cards, each linking to a detail page.
- Files: `index.html`, `style.css`, `js/catalogue.js`, `data/courses.json`.
- Implementation: `initCatalogue()` in `js/catalogue.js` calls `loadCourses()`, converts the slug-keyed object with `Object.entries(coursesBySlug).map(([slug, course]) => ({ slug, ...course }))`, then calls `renderCourses()`. `renderCourseCard(course)` generates each card with template literals and `grid.innerHTML`.
- JS techniques: Fetch API, async/await, array `.map()`, destructuring, spread, template literals, `innerHTML`.

### Search, Degree Filter, Sort, and Semester Chips

- User perspective: Users can search courses/professors, filter by degree, sort, and select semesters.
- Files: `index.html`, `style.css`, `js/catalogue.js`, `js/app.js`.
- Implementation: `wireFilters()` in `js/catalogue.js` attaches `input` and `change` listeners. `getVisibleCourses()` filters by query, degree, and semester. `initSemesterChips()` in `js/app.js` toggles `.sem-chip--active` and calls a provided `onChange` callback.
- JS techniques: DOM selection, `addEventListener`, `classList`, callbacks, debounce, array `.filter()` and `.sort()`.

### Course Detail Page

- User perspective: A course page shows title, professor link, poster, description, prerequisites, assessment table, workflow, materials, reviews, and related courses.
- Files: `course.html`, `course.css`, `js/course.js`, `data/courses.json`.
- Implementation: `initCoursePage()` loads all course data, reads the URL `course` parameter, and calls `renderCourse(currentCourse)`. `renderCourse()` updates `document.title`, breadcrumb text, poster styles, course text, prerequisites, assessment table, materials, and related courses.
- JS techniques: URLSearchParams, DOM selection, `textContent`, `innerHTML`, `style.backgroundImage`, `style.backgroundSize`, `style.backgroundPosition`, async/await.

### Professor Catalogue

- User perspective: Users can browse professor cards, see course lists, and open professor detail pages.
- Files: `professors.html`, `professor.css`, `style.css`, `js/professors.js`, `data/professors.json`, `data/courses.json`.
- Implementation: `initProfessors()` loads professors and courses with `Promise.all`, then `renderProfessors()` builds cards. `coursesForProfessor(professor)` resolves explicit professor course slugs into course objects.
- JS techniques: async/await, `Promise.all`, `.map()`, `.filter()`, `innerHTML`, debounced search.

### Individual Professor Pages

- User perspective: A professor page shows profile photo or initials, department, biography or placeholder, and course cards taught by that professor.
- Files: `professor.html`, `professor.css`, `style.css`, `js/professor.js`.
- Implementation: `initProfessor()` loads course and professor JSON, finds the professor by URL slug, then `renderProfessor(professor)` fills biography, department, avatar, course count, and course grid.
- JS techniques: URLSearchParams, `Promise.all`, destructuring, spread, DOM text/style/class manipulation.

### Simulated Account System

- User perspective: Users can register, log in, log out, and see their nickname in the header. Reviews and ratings require login.
- Files: `js/app.js`, `style.css`, all HTML pages indirectly through the shared header.
- Implementation: `initAuthUI()` injects an auth indicator into each `.nav-inner`. `openAuthModal()` and `initAuthModal()` create a modal dynamically. `handleAuthSubmit(event)` handles registration/login, stores users in `syllabus_users`, writes `syllabus_session`, and dispatches `syllabus:auth-change`.
- JS techniques: dynamic DOM creation, event delegation, localStorage, custom events, template literals, regex validation, non-cryptographic demo password hashing.
- Security note: `demoPasswordHash()` is explicitly documented as demo-only and not cryptographically secure.

### Star Ratings and Average Ratings

- User perspective: Logged-in users can rate a course once and update their rating later. Course cards and course pages display a real average or "Not yet rated".
- Files: `js/app.js`, `js/course.js`, `js/catalogue.js`, `course.css`, `style.css`.
- Implementation: `saveCourseRating(courseSlug, userId, rating)` stores one rating per user in `syllabus_ratings`. `calculateAverageRating(courseSlug)` computes average and count. `renderAverageRating()` in `js/course.js` shows the detail-page average, and `ratingSummaryText(slug)` is used by `renderCourseCard()` in `js/catalogue.js`.
- JS techniques: localStorage object storage, `.reduce()`, `.filter()`, `classList.toggle`, custom `syllabus:ratings-change` event.

### Reviews

- User perspective: Logged-in users can write reviews without retyping name/email/degree; their nickname is pulled from the account.
- Files: `course.html`, `course.css`, `js/course.js`.
- Implementation: The form in `course.html` keeps only rating and review body. `saveReview(event)` uses `requireAuth()`, creates `{ id, userId, nickname, rating, body, date, helpfulCount, helpfulUserIds }`, stores it under `syllabus_reviews_<courseSlug>`, updates the course rating, and re-renders reviews.
- JS techniques: FormData, destructuring, spread, localStorage, event listeners.

### Helpful Button

- User perspective: Logged-in users can mark another user's review helpful only once. Authors cannot mark their own reviews helpful. Logged-out users are prompted to log in.
- Files: `js/course.js`, `course.css`.
- Implementation: `renderReviewCard(review)` checks `getCurrentUser()`, `review.userId`, and `review.helpfulUserIds` to render active/disabled states. `incrementHelpful(button)` requires auth, blocks self-help and duplicates, writes updated review objects, and calls `renderReviews()`.
- JS techniques: localStorage, array membership checks, spread, conditional template generation, disabled button attributes.

### Course Materials

- User perspective: Users can add a material filename from the course page; it persists for that course.
- Files: `course.html`, `course.css`, `js/course.js`.
- Implementation: `renderMaterials()` combines JSON-provided materials with `readStoredArray(storageKey('materials'))`. The upload button prompts for a file name and writes to `syllabus_materials_<courseSlug>`.
- JS techniques: localStorage arrays, spread, prompt, `innerHTML`, event listeners.

### Poster Images and Fallbacks

- User perspective: Course posters appear on catalogue cards, course pages, and professor course cards.
- Files: `style.css`, `js/app.js`, `js/catalogue.js`, `js/course.js`, `js/professor.js`.
- Implementation: `posterBackground(course)` chooses the local `posterImage` or fallback gradient. `posterBackgroundStyle(course)` returns inline CSS used in generated card markup; `renderCourse()` directly sets poster `style.backgroundImage`.
- JS techniques: object lookup, template literals, escaping, inline style manipulation.

## 4. Requirement Coverage

### DOM

Meaningful DOM selection and manipulation is used throughout:

- `js/catalogue.js:24-28`: selects `#course-grid`, `#global-search`, selects, and `.filter-meta strong` with `getElementById()` and `querySelector()`.
- `js/catalogue.js:96-98`: updates `filterCount.textContent` and `grid.innerHTML` to render filtered courses.
- `js/course.js:29-50`: selects all course detail placeholders, forms, review list, rating hint, and average rating node.
- `js/course.js:88`: writes the assessment table with `assessmentDiv.innerHTML`.
- `js/course.js:120-122`: updates course material count and list with `textContent` and `innerHTML`.
- `js/course.js:166-168`: uses `averageRatingNode.classList.toggle()` and `innerHTML` to show average-rating state.
- `js/course.js:193-201`: uses `detailPoster.style.backgroundImage`, `style.backgroundSize`, `style.backgroundPosition`, and the same for backdrop poster.
- `js/course.js:331-370`: attaches click, submit, and change listeners for review form, helpful buttons, rating stars, auth changes, and uploads.
- `js/app.js:220`: dynamically writes auth form fields into the modal with `innerHTML`.
- `js/app.js:329`: creates the auth modal markup dynamically.
- `js/app.js:353-360`: updates header auth indicator `innerHTML`.
- `js/professor.js:115-119`: uses `textContent` and `classList.add/remove` to show either real biography or the placeholder.

These are not incidental uses: they drive live rendering, user input flows, page state changes, and conditional UI states.

### ES6+

#### Arrow Functions

- `js/app.js:15`: `const classNames = (...args) => args.filter(Boolean).join(' ');`
- `js/catalogue.js:36`: `const renderCourseCard = course => { ... }`
- `js/course.js:209`: `const renderReviewCard = review => { ... }`
- `js/professors.js:104`: debounced search listener `event => { ... }`
- `js/app.js:91`: semester chip click handler `() => { ... }`

#### Template Literals

- `js/catalogue.js:42-61`: `renderCourseCard(course)` returns a multi-line HTML template with dynamic course fields.
- `js/course.js:88-108`: `renderAssessment(course)` generates the assessment table rows from JSON.
- `js/app.js:220-248`: `renderAuthForm()` generates login/register form fields conditionally.
- `js/course.js:149-161`: `renderRelatedCourses()` generates related course cards.

#### Destructuring

Object destructuring:

- `js/app.js:196`: `const { average, count } = calculateAverageRating(courseSlug);`
- `js/catalogue.js:37`: `const { title, professor, professorSlug, posterClass, degree, department, credits, code, slug } = course;`
- `js/course.js:165`: `const { average, count } = calculateAverageRating(courseKey);`
- `js/course.js:210`: `const { id, userId, nickname, name, rating, body, date, helpfulCount = 0 } = review;`
- `js/course.js:256`: `const { rating, review } = Object.fromEntries(formData.entries());`
- `js/professor.js:65`: `const { slug, title, professor, posterClass, code, department, degree, credits } = course;`
- `js/professors.js:58`: `const { name, slug, department, bio } = professor;`

Module-style helper destructuring:

- `js/catalogue.js:5-13`, `js/course.js:5-19`, `js/professor.js:5-12`, and `js/professors.js:5-11` destructure shared helpers from `window.Syllabus`.

Array destructuring:

- `js/professor.js:137`: `const [courseData, professors] = await Promise.all([...]);`
- `js/professors.js:123`: `const [courseData, professorData] = await Promise.all([...]);`
- `js/catalogue.js:130`, `js/professor.js:61`, and `js/professors.js:37` use `([slug, course]) => ...` while iterating `Object.entries(...)`.

#### Spread / Rest

- `js/app.js:15`: rest parameter `(...args)` in `classNames()` accepts any number of class values.
- `js/app.js:58`: rest parameter `(...args)` inside `debounce()` forwards all arguments to the delayed function.
- `js/app.js:89`: `[...document.querySelectorAll('.sem-chip')]` converts a NodeList to an array.
- `js/app.js:190`: `[...existing, nextEntry]` appends a rating without mutating the existing array.
- `js/app.js:310`: `[...users, newUser]` appends a newly registered user.
- `js/catalogue.js:72`: `[...courses]` clones before sorting, avoiding mutation of state.
- `js/catalogue.js:130`: `({ slug, ...course })` merges slug with the course object.
- `js/course.js:114-115`: combines JSON materials with stored materials using array spread.
- `js/course.js:267`: `[...getReviews(), newReview]` appends a review.
- `js/course.js:293`: `[...helpfulUserIds, user.id]` records one helpful vote by user.
- `js/course.js:297`: `{ ...review, helpfulUserIds, helpfulCount }` immutably updates a review.
- `js/course.js:375`: `[...existing, { name, meta }]` appends uploaded material metadata.
- `js/professor.js:54`, `js/professors.js:30`: `({ slug, ...coursesBySlug[slug] })` builds course objects from slugs.

### Async JavaScript

#### Callback Pattern

- `js/app.js:52-53`: `delay(callback, ms)` passes a callback to `window.setTimeout(callback, ms)`.
- `js/app.js:56-61`: `debounce(fn, delayMs)` stores a timeout and later calls `fn(...args)` from inside `setTimeout()`. This is a genuine asynchronous callback pattern because execution is deferred.
- `js/catalogue.js:103` and `js/professors.js:104`: search input listeners wrap handlers in `debounce(...)`.

#### Promise `.then()` Chain

- `js/app.js:77-84`: `loadProfessors()` uses `fetch(...).then(res => { ... return res.json(); }).catch(...)`.
- This satisfies Promise chaining. It is somewhat formulaic because it is a fetch chain; most other async code uses async/await.

#### `async/await` with `try/catch`

- `js/app.js:64-72`: `async function loadCourses()` awaits `fetch()` and `res.json()` inside `try/catch`.
- `js/catalogue.js:124-136`: `initCatalogue()` awaits `loadCourses()` inside `try/catch`.
- `js/course.js:381-397`: `initCoursePage()` awaits `loadCourses()` inside `try/catch`.
- `js/professor.js:135-155`: `initProfessor()` awaits `Promise.all([...])` inside `try/catch`.
- `js/professors.js:114-133`: `initProfessors()` awaits `Promise.all([...])` inside `try/catch`.

### Fetch API + JSON

Every fetch call is centralized in `js/app.js`:

- `loadCourses()` in `js/app.js:64-72`
  - URL: `data/courses.json`, built by `dataPath('courses.json')`.
  - Fetch options: `{ cache: 'no-store' }`.
  - Parsing: `await res.json()`.
  - Data shape: object keyed by course slug. Values include title, professor, poster image, prerequisites, assessment array, workflow, materials, related slugs, semesters.
  - UI usage:
    - `js/catalogue.js`: renders catalogue cards and filters.
    - `js/course.js`: renders one course detail page.
    - `js/professor.js` and `js/professors.js`: resolve professor course lists.

- `loadProfessors()` in `js/app.js:76-85`
  - URL: `data/professors.json`, built by `dataPath('professors.json')`.
  - Fetch options: `{ cache: 'no-store' }`.
  - Parsing: `res.json()` in a `.then()` chain.
  - Data shape: array of professor objects with name, slug, department, bio, photoUrl, and courses.
  - UI usage:
    - `js/professors.js`: renders professor catalogue cards.
    - `js/professor.js`: renders individual professor page.

### Web Storage

All storage uses `localStorage`, so the data persists across reloads on the same browser and origin.

- `js/app.js:108-113`: `readStoredArray(key)`
  - Call: `localStorage.getItem(key)`.
  - Parses a JSON array for any supplied key.
  - Used for `syllabus_users`, `syllabus_reviews_<courseSlug>`, and `syllabus_materials_<courseSlug>`.

- `js/app.js:116-118`: `writeStoredArray(key, value)`
  - Call: `localStorage.setItem(key, JSON.stringify(value))`.
  - Stores arrays as JSON strings.
  - Powers users, reviews, and materials.

- `js/app.js:120`: `getUsers()`
  - Key: `syllabus_users`.
  - Data structure: JSON array of `{ id, nickname, email, passwordHash, createdAt }`.
  - Feature: registration/login account lookup.

- `js/app.js:122`: `getSessionId()`
  - Key: `syllabus_session`.
  - Data structure: plain string user id.
  - Feature: persistent logged-in state.

- `js/app.js:142`: `writeSession(userId)`
  - Key: `syllabus_session`.
  - Data structure: string user id.
  - Feature: login/register persistence and auth indicator update.

- `js/app.js:147`: `clearSession()`
  - Key: `syllabus_session`.
  - Removes the session on logout.

- `js/app.js:155`: `getRatingsStore()`
  - Key: `syllabus_ratings`.
  - Data structure: JSON object keyed by course slug, each value an array of `{ userId, rating }`.
  - Feature: one rating per user per course, average ratings.

- `js/app.js:163`: `writeRatingsStore(ratings)`
  - Key: `syllabus_ratings`.
  - Data structure: JSON object.
  - Feature: saves updated ratings and dispatches `syllabus:ratings-change`.

- `js/course.js:27`: `storageKey(type)`
  - Dynamic keys:
    - `syllabus_reviews_<courseSlug>`
    - `syllabus_materials_<courseSlug>`
  - Feature: course-specific persisted reviews and uploaded material metadata.

- `js/course.js:207`, `269`, `304`
  - Reads/writes `syllabus_reviews_<courseSlug>`.
  - Data structure: JSON array of review objects with `id`, `userId`, `nickname`, `rating`, `body`, `date`, `helpfulCount`, `helpfulUserIds`.
  - Feature: reviews and helpful votes persist after reload.

- `js/course.js:374`, `376`
  - Reads/writes `syllabus_materials_<courseSlug>`.
  - Data structure: JSON array of `{ name, meta }`.
  - Feature: user-added course material metadata persists after reload.

Persistence example: if a user registers, `syllabus_users` and `syllabus_session` remain in localStorage. Refreshing the page keeps the header in the logged-in state. If that user rates a course, `syllabus_ratings` persists and the average rating is recalculated after reload.

## 5. What Was NOT Implemented / Potential Gaps

- There is no real backend or secure authentication. The account system is intentionally simulated with localStorage. `demoPasswordHash()` is documented as not cryptographically secure.
- Uploaded materials are metadata only. The "Upload a file" control stores a filename from `window.prompt()`, not an actual file blob or server upload.
- Helpful votes and reviews are local to one browser/origin. They are not shared between users on different machines.
- The Promise `.then()` requirement is satisfied by `loadProfessors()`, but most project async code uses async/await. The `.then()` example is valid but narrow.
- The callback requirement is satisfied by `setTimeout`-based `delay()` and `debounce()`. `delay()` is exported but not heavily used; `debounce()` is actively used by search inputs.
- The project does not include automated tests. Verification has been manual/static: syntax checks, JSON parsing, grep scans, and browser/local-server smoke checks.
- CSS is static and extensive; there is no CSS preprocessor or component system.
- Authentication state can be edited manually in browser devtools because localStorage is client-controlled.

## 6. Technologies & Constraints

- No backend.
- No framework.
- No build step.
- Runs directly in the browser as static files served from the project directory.
- Uses standard browser APIs: DOM, Fetch API, localStorage, CustomEvent, FormData, URLSearchParams, and timers.
- External resources:
  - Google Fonts are loaded in each HTML page through `fonts.googleapis.com` and `fonts.gstatic.com`.
  - Some professor photos use external KIU image URLs in `data/professors.json`.
  - Course posters are local images in `/assets/`.
- Data is externalized into JSON files and loaded at runtime with `fetch()`.
- Persistent user-generated state is stored in localStorage, not in the JSON files.

