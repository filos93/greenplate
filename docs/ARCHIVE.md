# 🚀 DevOps Implementation ARCHIVE List — Greenplate

[12/11/2026]

## 📦 Deliverables Check for Final Submission
- [X] Public Live URL link.
- [X] Link to successful GitHub Actions green pipeline run.
- [X] Screenshot: Green GitHub Actions CI/CD pipeline.
- [X] Screenshot: Sentry dashboard with recorded simulated error event.
- [X] Screenshot: UptimeRobot dashboard showing active green status.

---

[08/11/2026]

## Step 6: Monitoring & Incident Simulation
- [X] **Sentry Error Tracking:**
  - [X] Install `@sentry/react`.
  - [X] Initialize Sentry in `src/main.jsx` with `import.meta.env.VITE_SENTRY_DSN`.
  - [X] Add a temporary crash trigger button (e.g., `throw new Error("DevOps Simulation Test")`).
  - [X] Trigger the error in production and verify the event in Sentry Dashboard.
  - [X] **Uptime Monitoring:**
  - [X] Set up HTTP(s) monitor on UptimeRobot pointing to public Vercel URL (5-minute interval).
  - [X] Verify initial 100% UP status.
- [X] **Documentation:**
  - [X] Add "Incident Response & Alert Interpretation" section to `README.md`.

## Step 5: Continuous Deployment (CD Pipeline & Public Deploy)
- [X] Extend `ci-cd.yml` with `deploy-production` job (triggered only on push to `main` after CI succeeds).
- [X] Configure Vercel CLI steps in workflow (`vercel pull`, `vercel build`, `vercel deploy`).
- [X] Push changes to `main` and confirm automatic deployment.
- [X] Verify app is live and reachable on public Vercel URL.
- [X] Save pipeline run URL and public app URL for project submission.

---

[07/11/2026]

## Step 4: Continuous Integration (CI Pipeline)
- [X] Create directory `.github/workflows/`.
- [X] Create `ci-cd.yml` workflow file triggered on `push` and `pull_request` to `main`.
- [X] Configure `lint-and-test` job:
  - Node.js setup & dependency installation (`npm ci`).
  - Code quality check (`npm run lint`).
  - Build validation (`npm run build`).
- [X] Configure `docker-build-check` job:
  - Verify Docker image builds successfully without pushing.
- [X] Test pipeline failure: temporarily force a linting error to ensure the pipeline turns red and blocks bad code.

## Step 3: Security & Secret Management
- [X] Verify `.env` is created locally and contains necessary keys.
- [X] Ensure `.env` is listed in `.gitignore`.
- [X] Audit Git history to confirm no secrets were committed (`git status`, inspect commit logs).
- [ ] Configure Repository Secrets in GitHub (`Settings -> Secrets and variables -> Actions`):
  - [X] `VERCEL_TOKEN`
  - [X] `VERCEL_ORG_ID`
  - [X] `VERCEL_PROJECT_ID`
- [X] Verify secret masking in GitHub Actions execution logs (`***`).

## Step 2: Containerization (Local Environment)
- [X] Test container locally:
  - Run `docker compose up --build -d`
  - Verify app loads properly on `http://localhost:8080`
  - Run `docker compose down`
- [X] Document all Docker commands in `README.md`.

---

[05/01/2026]

## Step 2: Containerization (Local Environment)
- [X] Create `Dockerfile` in the root directory (Multi-stage build: Node.js builder -> Nginx Alpine runner).
- [X] Create `nginx.conf` for fallback SPA client-side routing (`try_files $uri $uri/ /index.html;`).
- [X] Create `docker-compose.yml` to orchestrate local execution.

## Step 1: Exploration & Project Setup
- [X] Document project architecture and 3 environments (Dev, Staging, Production) in `README.md`.
- [X] Document choice of CI/CD tool (**GitHub Actions**) with technical justification.
- [X] Add project roadmap and local execution commands to `README.md`.