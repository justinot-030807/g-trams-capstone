# G-TRAMS Agent Instructions

> **Project:** **G-TRAMS** — *Gasan Tricycle Records and Application Management System* (Municipality of Gasan, Marinduque).
> **Design & Stack Specs:** See `PROJECT_CONTEXT.md` and `DESIGN.md`.

## Project Stage & Branch Governance (Read Carefully)

- **Current Stage:** **Pre-Final Defense is DONE.** The codebase is currently on `main` (`86bd8f7`) in **Final Defense QA & readiness** (`25 Jest suites / 293 passing tests`).
- **OVM / LLSA I Only on `main` (NO BPLO Office Split):**
  - On `main`, the municipal licensing office is strictly **Office of the Municipal Vice Mayor (OVM) — Local Legislative Staff Assistant I (LLSA I)** (`llsa.tester@gtrams.com`, primary dashboard `/llsa-dashboard`).
  - Keep the internal MongoDB/RBAC enum value `'bplo_staff'` unchanged in `userModel.js` and `authMiddleware.js` for existing database compatibility, **but NEVER write "BPLO" in UI copy, seed/tester emails, routes, or documentation on `main`**.
  - A separate BPLO Mayor's Permitting Division + 2027 Red Card exists **only** on the backup branch `feature/uat-bplo-ovm-split` — do not merge it into `main` or describe it as part of `main`.
- **Local Dev Ports:** Backend runs on `http://localhost:3000` (`PORT=3000` in `backend/.env` & `frontend/.env.local`); Frontend Vite runs on `http://localhost:5173`.

## Second Brain Memory

- **Startup Memory Rule:** Before coding, refactoring, or auditing, ALWAYS read `brain/00-index.md` and `brain/active-task.md` first. Read `brain/architecture.md`, `brain/decisions.md`, or `brain/audit-log.md` only when relevant to the task.
- **Builder Role:** Follow `brain/decisions.md` strictly and update `brain/active-task.md` after completing a feature or milestone.
- **Auditor Role:** Log verified bugs, diff checks, or fixes into `brain/audit-log.md` and update `brain/architecture.md` if modules or schemas changed.
- **Conciseness Rule:** Keep all `brain/*.md` notes short and bulleted; never paste raw source code into them.
- **AI Attribution Rule:** Whenever updating `brain/active-task.md` or `brain/audit-log.md`, log the entry with `Agent (Model)` (e.g., `Antigravity (...)` or `Codex CLI (...)`). Never guess or fabricate the model name—if the exact model ID is not explicitly provided in your context, write `<Agent> (model unspecified)` instead.
- **Subnode Graph Rule:** Whenever a new major module, feature, or audit is completed, create a new concise `.md` file in the matching subfolder (`brain/modules/`, `brain/tasks/`, or `brain/audits/`) AND add a `[[wikilink]]` to it inside `brain/00-index.md` or `brain/architecture.md` so new subnodes appear automatically in the graph.
