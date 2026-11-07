# 🚀 DevOps Implementation To-Do List — Greenplate

## Step 5: Continuous Deployment (CD Pipeline & Public Deploy)
- [X] Extend `ci-cd.yml` with `deploy-production` job (triggered only on push to `main` after CI succeeds).
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