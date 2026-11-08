# 🚀 DevOps Implementation To-Do List — Greenplate

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