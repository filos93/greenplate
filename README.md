<img src="public/logo.svg" alt="greenplate-app" width="200" />

# GreenPlate

**Vegetarian recipe discovery, fridge matching, and PDF cookbook generation with DevOps CI/CD pipeline**

---

## 👀 Overview

GreenPlate is a responsive web application for discovering and organizing vegetarian recipes. It features a secure serverless backend proxy with feature-specific rate limits for vegetarian recipe search (`VegSearch`) and ingredient matching (`MyFridge`), real-time autocomplete, offline cache resilience, client-side PDF cookbook generation, and a fully automated DevOps CI/CD pipeline.

---

# 🏗️ DevOps Architecture & 3-Tier Environments

## System Architecture

```text
[ Client Browser ]
       │
       ├───> [ React SPA Frontend (CDN / Nginx Alpine Container) ]
       │
       └───> [ Vercel Serverless Proxy (api/spoonacular.js) ]
                   │
                   ├───> [ Upstash Redis REST API ] (Rate Limiting via Client IP)
                   └───> [ Spoonacular API ] (Recipe Data Provider)
```

---

## Environment Definitions

| Parameter | Development (Local) | Staging | Production |
|------------|------------|------------|------------|
| Purpose | Local feature development, debugging, and container testing | Integration & QA on feature branches / PRs | Final public release to end-users |
| Runtime Server | `npm run vercel:dev` / Docker (`localhost:8080`) | Vercel Preview Deployments (Automated on PR) | Vercel Production (`main` branch) |
| Data & Quota | Mock API / Dev Keys (Upstash & Spoonacular) | Staging Upstash Redis DB / Quota isolation | Production Upstash Redis DB + Live Spoonacular |
| Error Tracking | Disabled / `development` environment on Sentry | `staging` environment on Sentry | `production` environment on Sentry |
| Public Access | `http://localhost:3000` or `http://localhost:8080` | `https://greenplate-git-<branch>.vercel.app` | <https://flg-greenplate.vercel.app/> |

---

## ⚙️ CI/CD Stack & Technical Justification

For automation, **GitHub Actions** was selected as the CI/CD orchestrator.

### Technical Justifications

1. **Native GitHub Integration**  
   Operates directly on GitHub-managed runners (`ubuntu-latest`) without requiring self-hosted infrastructure (e.g., Jenkins).

2. **Ecosystem of Official Actions**  
   Leverages verified actions (`actions/setup-node`, `docker/build-push-action`, Vercel CLI), reducing workflow overhead and maintenance risk.

3. **Secret Masking**  
   GitHub Actions automatically redacts environment variables (`VERCEL_TOKEN`, `UPSTASH_REDIS_REST_URL`, API keys) in execution logs (`***`).

4. **Quality Gates**  
   Failed linting (`npm run lint`), build failures, or broken Docker builds automatically block bad code from reaching the production branch.

---

## 🗺️ DevOps Project Roadmap

- [x] **Step 1: Exploration & Project Setup**  
  Architecture, 3-tier environment definitions, and CI/CD justification.

- [x] **Step 2: Containerization**  
  Multi-stage `Dockerfile`, `nginx.conf` SPA routing, and local `docker-compose.yml`.

- [ ] **Step 3: Security & Secrets Management**  
  `.env` local setup, Git history audit, and GitHub Repository Secrets configuration.

- [ ] **Step 4: Continuous Integration (CI)**  
  GitHub Actions pipeline for linting, code compilation, and Docker build verification.

- [ ] **Step 5: Continuous Deployment (CD)**  
  Automated zero-downtime deployment to Vercel Production upon pushing to `main`.

- [ ] **Step 6: Monitoring & Alert Interpretation**  
  Sentry React SDK error tracking, UptimeRobot HTTP monitoring, and alert response workflow.

---

# ⚡ Key Features

## Recipe Discovery (VegSearch)

- Search vegetarian recipes safely via a serverless proxy protecting the Spoonacular API key.
- Receive live search suggestions through input-sanitized autocomplete.
- Browse recipe images, detailed ingredients, and step-by-step preparation instructions.

## Fridge Matcher (MyFridge)

- Enter available ingredients to discover matching recipes.
- Compare ingredient matches against missing ingredients and sort dynamically by relevance.

## Favorites & Offline Resilience

- Save recipes across sessions using browser `localStorage`.
- Two-tier quota protection combining fail-closed server-side rate limiting (Upstash Redis) with feature-specific limits and client-side fallback.
- Filter cached recipes while offline or when daily API quotas are exhausted.

## PDF Cookbook Generator

- Export individual recipes or up to 30 favorites into a formatted client-side PDF using jsPDF.

---

# 🛠 Tech Stack

| Layer | Technologies |
|---------|---------|
| Frontend | React 18, JavaScript (ES6+), HTML5, CSS3, Tailwind CSS |
| Build & Testing | Vite, Vitest |
| HTTP Client | Axios |
| Serverless Backend | Vercel Serverless Functions (`api/spoonacular.js`) |
| Rate Limiting | Upstash Redis REST API |
| Containerization | Docker, Nginx Alpine, Docker Compose |
| CI/CD | GitHub Actions, Vercel CLI |
| Monitoring | Sentry (React SDK), UptimeRobot |
| PDF Generation | jsPDF |
| Deployment | Vercel |

---

# 💻 Getting Started & Local Execution

## Prerequisites

Ensure that the following are installed:

1. [Node.js](https://nodejs.org/) (v18+)
2. [npm](https://www.npmjs.com/)
3. [Docker Desktop](https://www.docker.com/) (v24+)
4. Vercel CLI

```bash
npm install -g vercel
```

---

## Installation & Environment Variables

### Clone the Repository

```bash
git clone https://github.com/filos93/greenplate.git
cd greenplate
npm install
```

### Configure Environment Variables

Copy `.env.example` to `.env.local`:

```env
SPOONACULAR_API_KEY=your_spoonacular_api_key
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
```

> 🔒 **Security Note:**  
> The serverless proxy operates on a fail-closed policy. Requests return HTTP 500/503 if Redis credentials are missing, ensuring the Spoonacular API key is never exposed without active rate limiting.

---

## Running Locally

### 1. Full-Stack Development (Recommended)

Runs the React frontend together with local Vercel serverless functions and Upstash Redis rate limiting.

```bash
npm run vercel:dev
```

Open:

<http://localhost:3000>

---

### 2. Local Containerized Execution (Docker Benchmark)

Used to validate the multi-stage Docker build and Nginx runtime configuration.

```bash
# Build and start container
docker compose up --build -d

# Verify status and logs
docker compose ps
docker compose logs -f frontend

# Stop containers
docker compose down
```

Open:

<http://localhost:8080>

---

### 3. Frontend-Only Development (Offline/UI Mode)

```bash
npm run dev
```

Open:

<http://localhost:5173>

---

# 📜 Available Scripts

```bash
npm run dev          # Start Vite dev server (offline UI mode)

npm run vercel:dev   # Start local full-stack environment with Vercel CLI

npm run build        # Create production build artifact

npm run preview      # Preview production build locally

npm run lint         # Run ESLint quality checks

npm run test         # Run single-pass Vitest suite

npm run test:watch   # Run Vitest watch mode
```

---

# 📁 Project Architecture

```text
greenplate/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD pipelines
├── api/
│   └── spoonacular.js      # Serverless API proxy & Upstash rate limiter
├── public/                 # Static assets and logos
├── src/
│   ├── __mocks__/          # Vitest mock datasets
│   ├── api/                # Axios API client layer
│   ├── components/         # React UI components & tests
│   ├── context/            # Global state context
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Main application pages
│   ├── styles/             # Application styling
│   └── utils/              # Cache, quota, and PDF generator utilities
├── Dockerfile              # Multi-stage production container definition
├── docker-compose.yml      # Local container orchestration
├── nginx.conf              # SPA fallback routing configuration
├── index.html
├── package.json
└── vite.config.js
```

---

# 📊 Incident Response & Alert Interpretation

## 1. UptimeRobot Downtime Alerts

### Notification

Webhook or email alert reporting:

```text
DOWN (HTTP 500 / 502 / Timeout)
```

### Action Protocol

1. Check the Vercel infrastructure status at `status.vercel.com`.
2. Review the latest GitHub Actions workflow execution.
3. Roll back immediately from the Vercel Dashboard if the issue is deployment-related.

---

## 2. Sentry Error Tracking Alerts

### Notification

Sentry issue alerts include:

- Stack trace
- Browser information
- Component context
- Environment metadata

### Action Protocol

1. Open Sentry and identify the source file and exception line.
2. Create a hotfix branch:

```bash
git checkout -b fix/issue-description
```

3. Reproduce locally:

```bash
npm run vercel:dev
```

or

```bash
docker compose up
```

4. Open a Pull Request to `main`.
5. Allow CI validation before automatic deployment.

---

# 🎥 Live Demo & Submission Links

- **Live Application**  
  <https://flg-greenplate.vercel.app/>

- **CI/CD Pipeline Run**  
  *(Link to successful GitHub Actions workflow run will be inserted here.)*

---

# 🔐 License

This project is licensed under the MIT License.

See the `LICENSE` file for details.

---

# 👨‍💻 Author

Developed with ❤️ by **Filippo La Greca**

---

# ✨ Acknowledgements

- Spoonacular API for recipe data
- Upstash Redis for serverless rate limiting
- jsPDF for client-side PDF generation
- React, Vite, and Nginx Alpine
- Vercel for serverless hosting
- GitHub Actions for CI/CD automation