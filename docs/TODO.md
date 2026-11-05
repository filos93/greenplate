# 🚀 DevOps Implementation To-Do List — Greenplate



## Step 2: Containerization (Local Environment)
- [ ] Test container locally:
  - Run `docker compose up --build -d`
  - Verify app loads properly on `http://localhost:8080`
  - Run `docker compose down`
- [ ] Document all Docker commands in `README.md`.

## Step 3: Security & Secret Management
- [ ] Verify `.env` is created locally and contains necessary keys (`VITE_SPOONACULAR_API_KEY`, `VITE_SENTRY_DSN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `VERCEL_TOKEN`, etc.).
- [ ] Ensure `.env` is listed in `.gitignore`.
- [ ] Audit Git history to confirm no secrets were committed (`git status`, inspect commit logs).
- [ ] Configure Repository Secrets in GitHub (`Settings -> Secrets and variables -> Actions`):
  - [ ] `VERCEL_TOKEN`
  - [ ] `VERCEL_ORG_ID`
  - [ ] `VERCEL_PROJECT_ID`
  - [ ] `VITE_SPOONACULAR_API_KEY`
  - [ ] `VITE_SENTRY_DSN`
  - [ ] `UPSTASH_REDIS_REST_URL`
  - [ ] `UPSTASH_REDIS_REST_TOKEN`
- [ ] Verify secret masking in GitHub Actions execution logs (`***`).

## Step 4: Continuous Integration (CI Pipeline)
- [ ] Create directory `.github/workflows/`.
- [ ] Create `ci-cd.yml` workflow file triggered on `push` and `pull_request` to `main`.
- [ ] Configure `lint-and-test` job:
  - Node.js setup & dependency installation (`npm ci`).
  - Code quality check (`npm run lint`).
  - Build validation (`npm run build`).
- [ ] Configure `docker-build-check` job:
  - Verify Docker image builds successfully without pushing.
- [ ] Test pipeline failure: temporarily force a linting error to ensure the pipeline turns red and blocks bad code.

## Step 5: Continuous Deployment (CD Pipeline & Public Deploy)
- [ ] Extend `ci-cd.yml` with `deploy-production` job (triggered only on push to `main` after CI succeeds).
- [ ] Configure Vercel CLI steps in workflow (`vercel pull`, `vercel build`, `vercel deploy`).
- [ ] Push changes to `main` and confirm automatic deployment.
- [ ] Verify app is live and reachable on public Vercel URL.
- [ ] Save pipeline run URL and public app URL for project submission.

## Step 6: Monitoring & Incident Simulation
- [ ] **Sentry Error Tracking:**
  - [ ] Install `@sentry/react`.
  - [ ] Initialize Sentry in `src/main.jsx` with `import.meta.env.VITE_SENTRY_DSN`.
  - [ ] Add a temporary crash trigger button (e.g., `throw new Error("DevOps Simulation Test")`).
  - [ ] Trigger the error in production and verify the event in Sentry Dashboard.
- [ ] **Uptime Monitoring:**
  - [ ] Set up HTTP(s) monitor on UptimeRobot pointing to public Vercel URL (5-minute interval).
  - [ ] Verify initial 100% UP status.
- [ ] **Documentation:**
  - [ ] Add "Incident Response & Alert Interpretation" section to `README.md`.

---
## 📦 Deliverables Check for Final Submission
- [ ] Public Live URL link.
- [ ] Link to successful GitHub Actions green pipeline run.
- [ ] Screenshot: Green GitHub Actions CI/CD pipeline.
- [ ] Screenshot: Sentry dashboard with recorded simulated error event.
- [ ] Screenshot: UptimeRobot dashboard showing active green status.